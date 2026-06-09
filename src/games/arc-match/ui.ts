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
        <label for="typeSel">Pattern</label>
        <select id="typeSel">
          <option value="crossing" selected>Crossing — the competitive game</option>
          <option value="nesting">Nesting</option>
          <option value="alignment">Alignment</option>
          <option value="any">Any homogeneous</option>
        </select>
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
        <b id="howtoK">3</b> red arcs that <b id="howtoType">all cross each other</b>.</li>
      <li><b class="blue-text">Breaker (blue)</b> draws arcs too, using up dots so you can't.</li>
      <li>Each dot is used once. Maker always moves first.</li>
      <li><b>Maker–Breaker</b> (default): a race — Maker wins the instant the target is reached, otherwise Breaker wins when the board fills.</li>
      <li><b>Scoring duel</b>: no early win — the board is <i>always</i> played to the end. Maker maximises, Breaker minimises the largest red set; the final size is the score (compared to par <b>k</b>).</li>
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
    <p><b>Unavoidable patterns.</b> Any two arcs relate as exactly one of <i>crossing</i>,
      <i>nesting</i>, or <i>alignment</i>; a sub-matching is <i>homogeneous</i> if every pair shares one
      type. Every ordered matching of size <i>n</i> contains a homogeneous sub-matching of size at least
      <i>n<sup>1/3</sup></i> (an Erdős–Szekeres-type theorem of Dudek, Grytczuk &amp; Ruciński). So
      <i>some</i> structure is unavoidable — but that is about the <b>whole</b> matching (both colours
      mixed), so it only motivates the game; it gives no direct bound on what <b>Maker</b> can force
      with her own arcs.</p>
    <p><b>Maker–Breaker, almost.</b> Compared with Beck's positional games (<i>Tic-Tac-Toe Theory</i>),
      the winning sets are the <i>k</i>-crossings of one type, and there are
      <i>C(2n, 2k)</i> of them — any <i>2k</i> endpoints determine exactly one canonical
      <i>k</i>-crossing. The Erdős–Selfridge criterion would then suggest Breaker wins when
      <i>C(2n,2k)·2<sup>−k</sup> &lt; ½</i>.</p>
    <p><b>But the arcs aren't independent.</b> Drawing arc <i>(i,j)</i> <i>uses up</i> endpoints
      <i>i, j</i>, so Breaker can kill a red target <b>without taking any of its arcs</b> — just by
      grabbing an arc that shares an endpoint. The independent-cell model (and hence Erdős–Selfridge)
      does <b>not</b> apply directly; the “Potential” AI uses it only as a <b>threat heuristic</b>, not
      a verdict. “Solver” instead searches the game tree exactly on small boards.</p>
    <p><b>The threshold <i>k*(n)</i>.</b> The largest <i>k ≥ 2</i> Maker can force under optimal play.
      Maker draws only <b>⌈n/2⌉</b> arcs, so <i>k*(n) ≤ ⌈n/2⌉</i>; its general growth is an
      <b>open problem</b> (the <i>n<sup>1/3</sup></i> curve is only a reference). Exact minimax for
      crossing gives <i>k* = 0, 2, 2, 2, 3, 3</i> at <i>n = 3…8</i> — above <i>n<sup>1/3</sup></i> yet
      below the ⌈n/2⌉ ceiling (at <i>n=3</i> a 2-crossing exists but can't be forced).</p>
    <p class="muted small">References: Dudek, Grytczuk &amp; Ruciński, <i>Ordered unavoidable
      sub-structures in matchings and random matchings</i>, EJC 31(2) (2024),
      <a href="https://arxiv.org/abs/2210.14042" target="_blank" rel="noopener">arXiv:2210.14042</a>;
      <i>Erdős–Szekeres type theorems for ordered uniform matchings</i>, JCTB 170 (2025),
      <a href="https://arxiv.org/abs/2301.02936" target="_blank" rel="noopener">arXiv:2301.02936</a>;
      Beck, <i>Tic-Tac-Toe Theory</i> (2008).</p>
  </section>
`;

// ---- DOM helpers ----
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- module state ----
let state!: GameState; // assigned in startNewGame(), called from mount()
let history: GameState[] = [];
let selected: number | null = null;
let hovered: number | null = null; // dot under the cursor (column-snapped) — drives highlight + preview
let hint: Move | null = null;
let lastEdgeCount = 0; // so only a freshly-added arc animates in (no re-animation on re-render)
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

// Map a pointer event to the NEAREST dot index by x (column snapping) — so hovering/clicking anywhere
// in a dot's column (including high above it in the arc area) snaps to that dot. Returns null when SVG
// coordinate mapping is unavailable (e.g. jsdom in tests), so callers fall back to the data-p hit zone.
function pointFromEvent(ev: MouseEvent): number | null {
  try {
    const svg = $('board') as unknown as SVGSVGElement;
    if (typeof svg.getScreenCTM !== 'function') return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
    const P = state.config.n * 2;
    return Math.max(1, Math.min(P, Math.round((loc.x - MARGIN_X) / STEP) + 1));
  } catch {
    return null;
  }
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
    // Crossing is the genuinely competitive target; nesting / alignment / any are kept as variants.
    type: ($('typeSel') as HTMLSelectElement).value as GameConfig['type'],
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
  hovered = null;
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
  hovered = null;
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
  hovered = null;
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
  const selSide = state.turn === MAKER ? 'r' : 'b';

  // each used dot is coloured by the arc it belongs to
  const ptColor = new Map<number, Color>();
  for (const e of state.edges) { ptColor.set(e.lo, e.color); ptColor.set(e.hi, e.color); }

  // hint arc (under everything)
  if (hint && !over) {
    body.push(`<path d="${arcPath(g.x(hint[0]), g.x(hint[1]), g.baselineY)}" class="arc arc-hint" />`);
  }

  // committed arcs. Only a just-added arc animates in (when the edge count grew this render), so
  // re-renders for hover / undo / AI don't replay the draw on existing arcs (the "twitch").
  const animateNewest = state.edges.length > lastEdgeCount;
  state.edges.forEach((e, i) => {
    const cls = ['arc', e.color === MAKER ? 'arc-r' : 'arc-b'];
    if (animateNewest && i === state.edges.length - 1) cls.push('arc-new');
    const key = `${e.lo}-${e.hi}`;
    if (over && witnessKeys.size) cls.push(witnessKeys.has(key) ? 'arc-win' : 'arc-dim');
    body.push(`<path d="${arcPath(g.x(e.lo), g.x(e.hi), g.baselineY)}" class="${cls.join(' ')}" />`);
  });

  // live preview: a dashed, low-opacity arc from the selected dot to the dot under the cursor
  if (!over && selected !== null && hovered !== null && hovered !== selected && !state.used[hovered]) {
    body.push(`<path d="${arcPath(g.x(selected), g.x(hovered), g.baselineY)}" class="arc arc-preview arc-${selSide}" />`);
  }

  // points + labels + selection/hover rings. Each point carries an oversized transparent hit circle
  // (a fallback when SVG-coordinate snapping is unavailable). The selection/hover rings and the dot
  // take the side-to-move's colour (red Maker / blue Breaker).
  for (let p = 1; p <= g.P; p++) {
    const x = g.x(p);
    const used = state.used[p];
    const ptCls = ['pt'];
    if (used) {
      ptCls.push('used');
      const c = ptColor.get(p);
      if (c) ptCls.push(c === MAKER ? 'r' : 'b');
    }
    if (selected === p) ptCls.push('sel', `sel-${selSide}`);
    const inner: string[] = [];
    if (selected === p) {
      inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${PT_R + 4}" class="pt-ring on ${selSide}" />`);
    } else if (!over && hovered === p && !used) {
      inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${PT_R + 3}" class="pt-ring on hover ${selSide}" />`);
    }
    inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${PT_R}" class="${ptCls.join(' ')}" />`);
    inner.push(`<text x="${x}" y="${g.baselineY + 18}" class="pt-label">${p}</text>`);
    inner.push(`<circle cx="${x}" cy="${g.baselineY}" r="${HIT_R}" class="pt-hit" data-p="${p}" />`);
    body.push(`<g class="pt-group${used ? ' used' : ''}">${inner.join('')}</g>`);
  }

  $('board').setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  $('board').innerHTML = body.join('');
  lastEdgeCount = state.edges.length;

  // --- status ---
  const turnPill = $('turnPill');
  if (over) {
    const win = state.winner === MAKER ? 'Red' : 'Blue';
    turnPill.textContent = `${win} wins`;
    turnPill.className = 'turn-pill done';
  } else {
    const base = state.turn === MAKER ? 'Red to move' : 'Blue to move';
    // scoring never ends early — cue that the board is always played out in full
    turnPill.textContent = cfg.mode === 'scoring' ? `${base} · play to fill the board` : base;
    turnPill.className = `turn-pill ${state.turn === MAKER ? '' : 'blue'}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // --- meter ---
  const label = $('meter').querySelector('.meter-label') as HTMLElement;
  if (cfg.mode === 'scoring') {
    // a live SCORE (largest red set so far), not a race to k: k is only the par bar, and Maker can
    // finish above it. Fill tracks progress toward par but the value shows the actual score.
    $('meterFill').style.width = `${Math.min(prog.size / cfg.k, 1) * 100}%`;
    $('meterValue').textContent = `${prog.size}  ·  par ${cfg.k}`;
    label.textContent = `Red score — largest ${cfg.type}`;
  } else {
    $('meterFill').style.width = `${Math.min(prog.size / cfg.k, 1) * 100}%`;
    $('meterValue').textContent = `${prog.size} / ${cfg.k}`;
    label.textContent = `Largest red ${cfg.type}`;
  }

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
  const typeWord: Record<string, string> = {
    crossing: 'all cross each other',
    nesting: 'are all nested',
    alignment: 'are all aligned (side by side)',
    any: 'are all the same type',
  };
  const t = ($('typeSel') as HTMLSelectElement).value;
  $('howtoType').textContent = typeWord[t] ?? 'all cross each other';
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

  // board interaction (delegated; survives innerHTML rebuilds). Clicks snap to the nearest dot by
  // column; if SVG-coordinate mapping is unavailable (jsdom) fall back to the data-p hit zone.
  $('board').addEventListener('click', (ev) => {
    let p = pointFromEvent(ev);
    if (p === null) {
      const t = (ev.target as Element).closest('[data-p]');
      p = t ? +(t.getAttribute('data-p') as string) : null;
    }
    if (p !== null) onPoint(p);
  });
  $('board').addEventListener('mousemove', (ev) => {
    if (!isHumanTurn()) { if (hovered !== null) { hovered = null; render(); } return; }
    const p = pointFromEvent(ev);
    const h = p !== null && !state.used[p] ? p : null;
    if (h !== hovered) { hovered = h; render(); } // re-render only when the snapped dot changes
  });
  $('board').addEventListener('mouseleave', () => {
    if (hovered !== null) { hovered = null; render(); }
  });

  // settings → live labels + new game
  for (const id of ['nRange', 'kRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  for (const id of ['modeSel', 'typeSel']) {
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
