// UI controller: SVG board rendering, interaction, controls, hint, undo, and the AI loop.
// All game logic lives in the engine; this file only renders state and collects input.

import {
  Color, GameConfig, GameState, Move, Mode, AILevel, MAKER,
  newGame, applyMove, makerProgress, isOver, goalText, makeRng, aiMove,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

// ---- markup (inlined from the standalone index.html, re-grouped into the three slots) ----
const SETTINGS_HTML = `
  <section class="card">
    <h2>Settings</h2>
    <div class="controls">
      <div class="field">
        <label for="nRange">Points <span class="hint-num" id="nLabel">14</span></label>
        <input type="range" id="nRange" min="3" max="12" value="7" />
      </div>
      <div class="field">
        <label for="kRange">Target k <span class="hint-num" id="kLabel">3</span> <span class="muted small" id="kCap"></span></label>
        <input type="range" id="kRange" min="2" max="6" value="3" />
      </div>
      <div class="field">
        <label for="roleSel">You play</label>
        <select id="roleSel">
          <option value="R" selected>Maker (red)</option>
          <option value="B">Breaker (blue)</option>
          <option value="both">Hotseat (both)</option>
          <option value="none">Watch AI vs AI</option>
        </select>
      </div>
      <div class="field" id="aiRField">
        <label for="aiR">Red AI</label>
        <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Potential</option><option value="3">Solver</option></select>
      </div>
      <div class="field" id="aiBField">
        <label for="aiB">Blue AI</label>
        <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Potential</option><option value="3">Solver</option></select>
      </div>
      <div class="field">
        <label for="modeSel">Mode</label>
        <select id="modeSel">
          <option value="maker-breaker" selected>Maker–Breaker</option>
          <option value="scoring">Scoring duel</option>
        </select>
      </div>
    </div>
    <div class="buttons">
      <button id="newBtn" class="btn btn-primary">New game</button>
      <button id="hintBtn" class="btn">Hint</button>
      <button id="undoBtn" class="btn">Undo</button>
      <button id="runBtn" class="btn" hidden>Run</button>
    </div>
  </section>
`;

const BOARD_HTML = `
  <section class="card board-card">
    <div class="status" id="status">
      <span class="turn-pill" id="turnPill">Red to move</span>
      <span class="goal" id="goalText"></span>
    </div>
    <div class="board-wrap">
      <svg id="board" class="board" role="img" aria-label="Arc match board"></svg>
    </div>
    <div class="meterrow">
      <div class="meter" id="meter">
        <div class="meter-label">Largest red structure</div>
        <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
        <div class="meter-value" id="meterValue">0 / 3</div>
      </div>
    </div>
    <div class="banner" id="banner" hidden></div>
  </section>
`;

const SIDEBAR_HTML = `
  <section class="card explainer" id="howto">
    <h2>How to play</h2>
    <ol class="howto-list">
      <li><b>Click two dots</b> to draw an arc between them in your colour.</li>
      <li>You are <b class="red-text">Maker (red)</b> by default — try to build
        <b id="howtoK">3</b> red arcs that <b>all cross each other</b>.</li>
      <li><b class="blue-text">Breaker (blue)</b> draws arcs too, using up dots so you can't.</li>
      <li>Each dot is used once. Maker always moves first.</li>
      <li>Maker wins the instant the target is reached; otherwise Breaker wins when the board fills.</li>
    </ol>
  </section>

  <section class="card explainer" id="legend">
    <h2>The three patterns</h2>
    <p class="muted">Any two arcs relate as exactly one of these. This game is about forcing a family
      of <b>crossings</b>; nesting and alignment are shown for contrast.</p>
    <div class="legend-grid">
      <figure class="legend-item">
        <svg viewBox="0 0 80 34" class="mini" aria-hidden="true"><g class="mini-pts"><circle cx="10" cy="28" r="2.4"/><circle cx="30" cy="28" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="70" cy="28" r="2.4"/></g><path d="M10 28 C 22 4, 38 4, 50 28" class="mini-r"/><path d="M30 28 C 42 4, 58 4, 70 28" class="mini-b"/></svg>
        <figcaption><b>Crossing</b><span>arcs interleave</span></figcaption>
      </figure>
      <figure class="legend-item">
        <svg viewBox="0 0 80 34" class="mini" aria-hidden="true"><g class="mini-pts"><circle cx="10" cy="28" r="2.4"/><circle cx="30" cy="28" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="70" cy="28" r="2.4"/></g><path d="M10 28 C 28 0, 52 0, 70 28" class="mini-r"/><path d="M30 28 C 38 10, 42 10, 50 28" class="mini-b"/></svg>
        <figcaption><b>Nesting</b><span>one inside the other</span></figcaption>
      </figure>
      <figure class="legend-item">
        <svg viewBox="0 0 80 34" class="mini" aria-hidden="true"><g class="mini-pts"><circle cx="10" cy="28" r="2.4"/><circle cx="30" cy="28" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="70" cy="28" r="2.4"/></g><path d="M10 28 C 16 12, 24 12, 30 28" class="mini-r"/><path d="M50 28 C 56 12, 64 12, 70 28" class="mini-b"/></svg>
        <figcaption><b>Alignment</b><span>side by side</span></figcaption>
      </figure>
    </div>
  </section>

  <section class="card explainer" id="maths">
    <h2>The maths behind it</h2>
    <p><b>Why a game?</b> Every ordered matching on <i>2n</i> points must contain a homogeneous
      set of size about <i>n<sup>1/3</sup></i> (an Erdős–Szekeres-type theorem of Dudek,
      Grytczuk &amp; Ruciński). So <i>some</i> structure is unavoidable — the game asks whether
      <b>Maker can force</b> one while owning only her own arcs.</p>
    <p><b>Maker–Breaker.</b> This is a positional game in the sense of Beck's
      <i>Tic-Tac-Toe Theory</i>: the winning sets are the <i>k</i>-crossings, Maker claims arcs,
      Breaker blocks. Maker draws only <b>⌈n/2⌉</b> of the <i>n</i> arcs, so the target <i>k</i> is
      capped there.</p>
    <p><b>The AI.</b> The “Potential” opponent uses an <b>Erdős–Selfridge</b>-style weighting of
      Maker's threats; “Solver” searches the game tree exactly on small boards.</p>
    <p class="muted small">References: Dudek, Grytczuk &amp; Ruciński, <i>Ordered unavoidable
      sub-structures in matchings and random matchings</i> (2024),
      <a href="https://arxiv.org/abs/2210.14042" target="_blank" rel="noopener">arXiv:2210.14042</a>;
      Beck, <i>Combinatorial Games: Tic-Tac-Toe Theory</i> (2008).</p>
  </section>
`;

// ---- DOM helpers ----
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- module state ----
let state!: GameState; // assigned in startNewGame(), called from mount()
let history: GameState[] = [];
let selected: number | null = null;
let hint: Move | null = null;
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false; // for "watch AI vs AI"

const AI_DELAY = 430;

// ---- geometry ----
const STEP = 40;
const MARGIN_X = 26;
const TOP_PAD = 14;
const LABEL_AREA = 24;
const ARC_FACTOR = 0.55;
const PT_R = 7;
// Transparent hit target radius: clicks/hover anywhere in this zone snap to the dot. Just under
// half the point spacing (STEP) so neighbouring zones never overlap.
const HIT_R = STEP / 2 - 1;

function geom(n: number) {
  const P = n * 2;
  const maxArcH = (P - 1) * STEP * ARC_FACTOR;
  const baselineY = TOP_PAD + maxArcH;
  const width = MARGIN_X * 2 + (P - 1) * STEP;
  const height = baselineY + LABEL_AREA;
  const x = (p: number) => MARGIN_X + (p - 1) * STEP;
  return { P, baselineY, width, height, x };
}

// ---- config from controls ----
function readConfig(seed: number): GameConfig {
  const n = +($('nRange') as HTMLInputElement).value;
  let k = +($('kRange') as HTMLInputElement).value;
  // Maker draws only ceil(n/2) arcs, so k beyond that is mathematically unwinnable — clamp to it.
  k = Math.max(2, Math.min(k, Math.ceil(n / 2)));
  return {
    n,
    k,
    // Crossing is the only target that is a genuine contest (see DESIGN.md §3); it is the game.
    type: 'crossing',
    mode: ($('modeSel') as HTMLSelectElement).value as Mode,
    humanRole: ($('roleSel') as HTMLSelectElement).value as GameConfig['humanRole'],
    aiLevel: {
      R: +($('aiR') as HTMLSelectElement).value as AILevel,
      B: +($('aiB') as HTMLSelectElement).value as AILevel,
    },
    seed,
  };
}

function humanControls(turn: Color): boolean {
  const r = state.config.humanRole;
  if (r === 'both') return true;
  if (r === 'none') return false;
  return r === turn;
}
const isHumanTurn = () => !isOver(state) && humanControls(state.turn);
const isAiTurn = () => !isOver(state) && !humanControls(state.turn);

// ---- core flow ----
function startNewGame(): void {
  window.clearTimeout(aiTimer);
  const seed = seedCounter++;
  rng = makeRng(0x9e3779b1 ^ (seed * 2654435761));
  state = newGame(readConfig(seed));
  history = [];
  selected = null;
  hint = null;
  running = state.config.humanRole === 'none' ? running : false;
  render();
  scheduleAi();
}

function doMove(lo: number, hi: number): void {
  if (isOver(state)) return;
  const next = applyMove(state, lo, hi);
  if (next === state) return; // illegal / no-op (applyMove returns the same object)
  history.push(state);
  state = next;
  selected = null;
  hint = null;
  render();
  scheduleAi();
}

function scheduleAi(): void {
  window.clearTimeout(aiTimer);
  if (!isAiTurn()) return;
  if (state.config.humanRole === 'none' && !running) return;
  aiTimer = window.setTimeout(aiStep, AI_DELAY);
}

function aiStep(): void {
  if (!isAiTurn()) return;
  if (state.config.humanRole === 'none' && !running) return;
  const [lo, hi] = aiMove(state, state.config.aiLevel[state.turn], rng);
  doMove(lo, hi);
}

function onPoint(p: number): void {
  if (!isHumanTurn() || state.used[p]) return;
  if (selected === null) { selected = p; render(); return; }
  if (selected === p) { selected = null; render(); return; }
  doMove(selected, p);
}

function showHint(): void {
  if (!isHumanTurn()) return;
  hint = aiMove(state, 2, rng); // potential-level suggestion for the side to move
  render();
}

function undo(): void {
  if (!history.length) return;
  state = history.pop()!;
  const r = state.config.humanRole;
  if (r === 'R' || r === 'B') {
    while (history.length && !humanControls(state.turn) && !isOver(state)) state = history.pop()!;
  }
  selected = null;
  hint = null;
  running = false;
  render();
}

// ---- rendering ----
function arcPath(x1: number, x2: number, baseY: number): string {
  const span = Math.abs(x2 - x1);
  const h = span * ARC_FACTOR;
  return `M ${x1} ${baseY} C ${x1} ${baseY - h}, ${x2} ${baseY - h}, ${x2} ${baseY}`;
}

function render(): void {
  const cfg = state.config;
  const g = geom(cfg.n);
  const prog = makerProgress(state);
  const witnessKeys = new Set((state.witness ?? []).map(e => `${e.lo}-${e.hi}`));
  const over = isOver(state);

  // --- board svg ---
  const body: string[] = [];

  // hint arc (under everything)
  if (hint && !over) {
    body.push(`<path d="${arcPath(g.x(hint[0]), g.x(hint[1]), g.baselineY)}" class="arc arc-hint" />`);
  }

  // arcs
  for (const e of state.edges) {
    const cls = ['arc', e.color === MAKER ? 'arc-r' : 'arc-b', 'arc-new'];
    const key = `${e.lo}-${e.hi}`;
    if (over && witnessKeys.size) {
      if (witnessKeys.has(key)) cls.push('arc-win');
      else cls.push('arc-dim');
    }
    body.push(`<path d="${arcPath(g.x(e.lo), g.x(e.hi), g.baselineY)}" class="${cls.join(' ')}" />`);
  }

  // points + labels + selection ring. Each point is wrapped in a <g> carrying an oversized,
  // transparent hit circle on top — so a click anywhere in the dot's zone snaps to that dot, and
  // hovering the whole zone highlights it. The selection ring/dot take the colour of the side to
  // move (red Maker / blue Breaker) rather than a neutral violet.
  const selSide = state.turn === MAKER ? 'r' : 'b';
  for (let p = 1; p <= g.P; p++) {
    const x = g.x(p);
    const used = state.used[p];
    const ptCls = ['pt'];
    if (used) ptCls.push('used');
    if (selected === p) ptCls.push('sel', `sel-${selSide}`);
    const inner: string[] = [];
    if (selected === p) {
      inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${PT_R + 4}" class="pt-ring on ${selSide}" />`);
    }
    inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${PT_R}" class="${ptCls.join(' ')}" />`);
    inner.push(`<text x="${x}" y="${g.baselineY + 18}" class="pt-label">${p}</text>`);
    inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${HIT_R}" class="pt-hit" data-p="${p}" />`);
    body.push(`<g class="pt-group${used ? ' used' : ''}">${inner.join('')}</g>`);
  }

  $('board').setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  $('board').innerHTML = body.join('');

  // --- status ---
  const turnPill = $('turnPill');
  if (over) {
    const win = state.winner === MAKER ? 'Red' : 'Blue';
    turnPill.textContent = `${win} wins`;
    turnPill.className = 'turn-pill done';
  } else {
    turnPill.textContent = state.turn === MAKER ? 'Red to move' : 'Blue to move';
    turnPill.className = `turn-pill ${state.turn === MAKER ? '' : 'blue'}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // --- meter ---
  $('meterFill').style.width = `${Math.min(prog.size / cfg.k, 1) * 100}%`;
  $('meterValue').textContent = `${prog.size} / ${cfg.k}`;
  ($('meter').querySelector('.meter-label') as HTMLElement).textContent = `Largest red ${cfg.type}`;

  // --- banner ---
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (cfg.mode === 'scoring') {
      // Scoring duel: report the final score (largest red set). Maker maximised, Breaker minimised.
      const score = state.score ?? prog.size;
      if (state.winner === MAKER) {
        banner.className = 'banner red';
        banner.textContent = `Final score: largest red ${cfg.type} = ${score} — Maker beats par (${cfg.k}). 🎉`;
      } else {
        banner.className = 'banner blue';
        banner.textContent = `Final score: largest red ${cfg.type} = ${score} — Breaker held Maker below par (${cfg.k}).`;
      }
    } else if (state.winner === MAKER) {
      banner.className = 'banner red';
      banner.textContent = `Maker wins — ${prog.size} red arcs ${cfg.type}! 🎉`;
    } else {
      banner.className = 'banner blue';
      banner.textContent = `Breaker wins — Maker stuck at ${prog.size}/${cfg.k}.`;
    }
  } else {
    banner.hidden = true;
  }

  // --- buttons ---
  ($('hintBtn') as HTMLButtonElement).disabled = !isHumanTurn();
  ($('undoBtn') as HTMLButtonElement).disabled = history.length === 0;
  const runBtn = $('runBtn') as HTMLButtonElement;
  if (cfg.humanRole === 'none') {
    runBtn.hidden = false;
    runBtn.textContent = running ? 'Pause' : 'Run';
    runBtn.disabled = over;
  } else {
    runBtn.hidden = true;
  }
}

// ---- control wiring ----
function syncLabels(): void {
  const n = +($('nRange') as HTMLInputElement).value;
  const kRange = $('kRange') as HTMLInputElement;
  // Maker owns only ceil(n/2) of the n arcs, so that is the hard ceiling for k (above it she can
  // never win). Cap the slider there rather than at n.
  const cap = Math.ceil(n / 2);
  kRange.max = String(cap);
  if (+kRange.value > cap) kRange.value = String(cap);
  $('nLabel').textContent = String(n * 2);
  $('kLabel').textContent = kRange.value;
  $('kCap').textContent = `(max ${cap})`;
  $('howtoK').textContent = kRange.value; // how-to mirror
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  const showR = role === 'B' || role === 'none';
  const showB = role === 'R' || role === 'none';
  $('aiRField').style.display = showR ? '' : 'none';
  $('aiBField').style.display = showB ? '' : 'none';
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  // board interaction (delegated; survives innerHTML rebuilds)
  $('board').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-p]');
    if (t) onPoint(+(t.getAttribute('data-p') as string));
  });

  // settings → live labels + new game
  for (const id of ['nRange', 'kRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  for (const id of ['modeSel']) {
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiR', 'aiB']) {
    $(id).addEventListener('change', startNewGame);
  }

  // buttons
  $('newBtn').addEventListener('click', startNewGame);
  $('hintBtn').addEventListener('click', showHint);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => {
    running = !running;
    render();
    scheduleAi();
  });

  syncLabels();
  syncRoleVisibility();
  startNewGame();

  return {
    destroy() {
      window.clearTimeout(aiTimer);
      aiTimer = undefined;
    },
  };
}
