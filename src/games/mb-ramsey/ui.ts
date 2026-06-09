// UI controller for Maker–Breaker Ramsey: the circular-graph board. Maker tries to claim all edges
// of a q-clique on K_v; Breaker blocks. All logic lives in the shared positional engine,
// instantiated here with the Ramsey hypergraph (kind fixed to 'ramsey').

import {
  Color, GameConfig, GameState, Mode, AILevel, MAKER,
  newGame, applyMove, makerProgress, isOver, goalText, makeRng, aiMove, edgeList,
} from '../../common/positional';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="sizeRange">Vertices <span class="hint-num" id="sizeLabel">8</span></label>
      <input type="range" id="sizeRange" min="4" max="9" value="8" />
    </div>
    <div class="field">
      <label for="targetRange">Clique q <span class="hint-num" id="targetLabel">4</span></label>
      <input type="range" id="targetRange" min="3" max="5" value="4" />
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
    <div class="field">
      <label for="modeSel">Mode</label>
      <select id="modeSel">
        <option value="maker-breaker" selected>Maker–Breaker</option>
        <option value="scoring">Scoring duel</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Potential</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Potential</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
</section>`;

const BOARD_HTML = `
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to move</span>
    <span class="goal" id="goalText"></span>
  </div>
  <div class="board-wrap">
    <svg id="board" class="board" role="img" aria-label="game board"></svg>
  </div>
  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Best red clique (edges)</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 4</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b>Click an empty edge</b> to claim it in your colour.</li>
    <li id="howtoGoal">You are <b class="red-text">Maker (red)</b>.</li>
    <li><b class="blue-text">Breaker (blue)</b> claims edges too, to block you.</li>
    <li>Maker always moves first. Maker wins the instant a clique is complete; otherwise Breaker wins when the graph fills.</li>
  </ol>
</section>

<section class="card explainer" id="legend">
  <h2>The clique game</h2>
  <div class="legend-grid">
    <figure class="legend-item">
      <svg viewBox="0 0 90 40" class="mini" aria-hidden="true">
        <g class="m-edge"><line x1="20" y1="10" x2="70" y2="10"/><line x1="20" y1="10" x2="45" y2="34"/><line x1="70" y1="10" x2="45" y2="34"/></g>
        <circle cx="20" cy="10" r="3.6" class="m-v"/><circle cx="70" cy="10" r="3.6" class="m-v"/><circle cx="45" cy="34" r="3.6" class="m-v"/>
      </svg>
      <figcaption><b>Ramsey</b><span>3 red edges forming a triangle (a clique)</span></figcaption>
    </figure>
  </div>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Maker–Breaker.</b> A positional game (Beck, <i>Tic-Tac-Toe Theory</i>): Maker claims
    edges to occupy a whole <i>winning set</i> — here all edges of a q-clique — while Breaker just
    blocks. Maker, moving first, has the initiative.</p>
  <p><b>Erdős–Selfridge threshold.</b> If the winning sets are many and large enough
    (<i>Σ 2<sup>−|A|</sup> &lt; ½</i>), <b>Breaker wins</b>. So there's a sharp boundary between
    a Maker-competitive clique size and one Breaker can always block — that boundary is the whole
    point. Slide the clique size against the vertex count to feel it flip.</p>
  <p><b>The AI.</b> “Potential” is the Erdős–Selfridge weighting itself; “Solver” searches
    exactly on small boards. Lower the AI level if you want to win more easily.</p>
  <p class="muted small">References: Ramsey, <i>On a problem of formal logic</i> (1930);
    Erdős &amp; Selfridge, <i>On a combinatorial game</i> (1973);
    Beck, <i>Combinatorial Games: Tic-Tac-Toe Theory</i> (2008).</p>
</section>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: number | null = null;
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// ---- config ----
function readConfig(seed: number): GameConfig {
  const boardSize = +($('sizeRange') as HTMLInputElement).value;
  let target = +($('targetRange') as HTMLInputElement).value;
  target = Math.min(target, boardSize);
  return {
    kind: 'ramsey',
    boardSize,
    target,
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

// ---- flow ----
function startNewGame(): void {
  window.clearTimeout(aiTimer);
  const seed = seedCounter++;
  rng = makeRng(0x9e3779b1 ^ (seed * 2654435761));
  state = newGame(readConfig(seed));
  history = [];
  hint = null;
  if (state.config.humanRole !== 'none') running = false;
  render();
  scheduleAi();
}

function doMove(cell: number): void {
  if (isOver(state)) return;
  const next = applyMove(state, cell);
  if (next === state) return;
  history.push(state);
  state = next;
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
  doMove(aiMove(state, state.config.aiLevel[state.turn], rng));
}

function onCell(cell: number): void {
  if (!isHumanTurn() || state.owner[cell] !== null) return;
  doMove(cell);
}

function showHint(): void {
  if (!isHumanTurn()) return;
  hint = aiMove(state, 2, rng);
  render();
}

function undo(): void {
  if (!history.length) return;
  window.clearTimeout(aiTimer); // a stale timer from the pre-undo state must not fire after rewind
  state = history.pop()!;
  const r = state.config.humanRole;
  if (r === 'R' || r === 'B') {
    while (history.length && !humanControls(state.turn) && !isOver(state)) state = history.pop()!;
  }
  hint = null;
  running = false;
  render();
  // If we landed on an AI turn (e.g. rewound to the empty board while playing as Breaker, where
  // the AI Maker moves first), re-arm the AI so the board isn't frozen. scheduleAi() self-guards.
  scheduleAi();
}

// ---- board rendering ----
function colorClass(o: Color | null): string {
  return o === MAKER ? 'r' : o === 'B' ? 'b' : 'free';
}

function renderRamsey(s: GameState): { viewBox: string; body: string } {
  const V = s.config.boardSize;
  const SIZE = 340, C = SIZE / 2, R = SIZE / 2 - 34, VR = 13;
  const edges = edgeList(V);
  const over = isOver(s);
  const win = new Set(over ? s.witness ?? [] : []);
  const pos = (v: number): [number, number] => {
    const a = -Math.PI / 2 + (v * 2 * Math.PI) / V;
    return [C + R * Math.cos(a), C + R * Math.sin(a)];
  };
  const winVerts = new Set<number>();
  for (const e of win) { winVerts.add(edges[e][0]); winVerts.add(edges[e][1]); }

  const body: string[] = [];
  // edges (visible)
  edges.forEach(([i, j], e) => {
    const [x1, y1] = pos(i), [x2, y2] = pos(j);
    const cls = ['edge', colorClass(s.owner[e])];
    if (win.has(e)) cls.push('win');
    body.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls.join(' ')}" />`);
    if (hint === e && !over) body.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge hint-dot" />`);
  });
  // clickable hit areas
  edges.forEach(([i, j], e) => {
    const [x1, y1] = pos(i), [x2, y2] = pos(j);
    const taken = s.owner[e] !== null ? ' taken' : '';
    body.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge-hit${taken}" data-cell="${e}" />`);
  });
  // vertices on top
  for (let v = 0; v < V; v++) {
    const [vx, vy] = pos(v);
    body.push(`<circle cx="${vx}" cy="${vy}" r="${VR}" class="vertex${winVerts.has(v) ? ' win' : ''}" />`);
    body.push(`<text x="${vx}" y="${vy}" class="vlabel">${v + 1}</text>`);
  }
  return { viewBox: `0 0 ${SIZE} ${SIZE}`, body: body.join('') };
}

function render(): void {
  const cfg = state.config;
  const prog = makerProgress(state);
  const over = isOver(state);

  const { viewBox, body } = renderRamsey(state);
  const board = $('board');
  board.setAttribute('viewBox', viewBox);
  board.innerHTML = body;

  // status
  const pill = $('turnPill');
  if (over) {
    pill.textContent = `${state.winner === MAKER ? 'Red' : 'Blue'} wins`;
    pill.className = 'turn-pill done';
  } else {
    pill.textContent = state.turn === MAKER ? 'Red to move' : 'Blue to move';
    pill.className = `turn-pill ${state.turn === MAKER ? '' : 'blue'}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // meter
  const need = prog.need || cfg.target;
  $('meterFill').style.width = `${need ? Math.min(prog.size / need, 1) * 100 : 0}%`;
  $('meterValue').textContent = `${prog.size} / ${need}`;

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    const scoring = cfg.mode === 'scoring';
    const score = state.score ?? prog.size; // Maker's largest live structure in scoring mode
    if (state.winner === MAKER) {
      banner.className = 'banner red';
      banner.textContent = scoring
        ? `Maker scored ${score}/${need} — a full ${cfg.target}-clique! 🎉`
        : `Maker wins — a red ${cfg.target}-clique! 🎉`;
    } else {
      banner.className = 'banner blue';
      banner.textContent = scoring
        ? `Breaker wins — Maker scored only ${score}/${need}.`
        : `Breaker wins — Maker blocked (best ${prog.size}/${need}).`;
    }
  } else {
    banner.hidden = true;
  }

  // buttons
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

// ---- controls ----
function syncLabels(): void {
  const size = $('sizeRange') as HTMLInputElement;
  const target = $('targetRange') as HTMLInputElement;
  if (+target.value > +size.value) target.value = size.value;
  $('sizeLabel').textContent = size.value;
  $('targetLabel').textContent = target.value;
  $('howtoGoal').innerHTML =
    `You are <b class="red-text">Maker (red)</b> — claim all edges among some <b>${target.value}</b> vertices (a red clique).`;
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  $('aiRField').style.display = (role === 'B' || role === 'none') ? '' : 'none';
  $('aiBField').style.display = (role === 'R' || role === 'none') ? '' : 'none';
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  $('board').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-cell]');
    if (t) onCell(+(t.getAttribute('data-cell') as string));
  });

  for (const id of ['sizeRange', 'targetRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('modeSel').addEventListener('change', startNewGame);
  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiR', 'aiB']) $(id).addEventListener('change', startNewGame);

  $('newBtn').addEventListener('click', startNewGame);
  $('hintBtn').addEventListener('click', showHint);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => { running = !running; render(); scheduleAi(); });

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
