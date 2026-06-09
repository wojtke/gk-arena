// UI controller for Maker–Breaker Van der Waerden: the number-line board. Maker tries to claim a
// k-term arithmetic progression; Breaker blocks. All logic lives in the shared positional engine,
// instantiated here with the VdW hypergraph (kind fixed to 'vdw').

import {
  Color, GameConfig, GameState, Mode, AILevel, MAKER,
  newGame, applyMove, makerProgress, isOver, goalText, makeRng, aiMove,
} from '../../common/positional';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="sizeRange">Positions <span class="hint-num" id="sizeLabel">13</span></label>
      <input type="range" id="sizeRange" min="5" max="20" value="13" />
    </div>
    <div class="field">
      <label for="targetRange">AP length k <span class="hint-num" id="targetLabel">4</span></label>
      <input type="range" id="targetRange" min="2" max="6" value="4" />
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
      <div class="meter-label" id="meterLabel">Largest red progression</div>
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
    <li><b>Click an empty position</b> to claim it in your colour.</li>
    <li id="howtoGoal">You are <b class="red-text">Maker (red)</b>.</li>
    <li><b class="blue-text">Breaker (blue)</b> claims positions too, to block you.</li>
    <li>Maker always moves first. Maker wins the instant a progression is complete; otherwise Breaker wins when the line fills.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Maker–Breaker.</b> A positional game (Beck, <i>Tic-Tac-Toe Theory</i>): Maker claims
    positions to occupy a whole <i>winning set</i> — here a k-term arithmetic progression — while
    Breaker just blocks. Maker, moving first, has the initiative.</p>
  <p><b>Erdős–Selfridge threshold.</b> If the winning sets are many and large enough
    (<i>Σ 2<sup>−|A|</sup> &lt; ½</i>), <b>Breaker wins</b>. So there's a sharp boundary: e.g.
    for 4-term progressions Breaker wins up to ~11 positions, then Maker takes over. Keep
    <b>k = 4</b> and slide the board size across ~12 to see it flip — that boundary is the
    whole point.</p>
  <p><b>The AI.</b> “Potential” is the Erdős–Selfridge weighting itself; “Solver” searches
    exactly on small boards. Lower the AI level if you want to win more easily.</p>
  <p class="muted small">References: van der Waerden, <i>Beweis einer Baudetschen Vermutung</i> (1927);
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
    kind: 'vdw',
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

function renderVdw(s: GameState): { viewBox: string; body: string } {
  const N = s.config.boardSize;
  const STEP = 40, MX = 26, R = 11, baseY = 30, H = 64;
  const W = MX * 2 + (N - 1) * STEP;
  const x = (i: number) => MX + i * STEP;
  const over = isOver(s);
  const win = new Set(over ? s.witness ?? [] : []);
  const body: string[] = [];
  // AP connector through the witnessing progression
  if (win.size) {
    const xs = [...win].map(x).sort((a, b) => a - b);
    body.push(`<line x1="${xs[0]}" y1="${baseY}" x2="${xs[xs.length - 1]}" y2="${baseY}" class="ap-line" />`);
  }
  const HIT = STEP / 2 - 2; // transparent hit radius ≈ half the spacing → generous snapping
  for (let i = 0; i < N; i++) {
    const owner = s.owner[i];
    const cls = ['cell', colorClass(owner)];
    if (win.has(i)) cls.push('win');
    const inner: string[] = [];
    if (hint === i && !over) inner.push(`<circle cx="${x(i)}" cy="${baseY}" r="${R + 4}" class="hint-dot" />`);
    inner.push(`<circle cx="${x(i)}" cy="${baseY}" r="${R}" class="${cls.join(' ')}" />`);
    inner.push(`<text x="${x(i)}" y="${baseY + 24}" class="cell-label">${i + 1}</text>`);
    inner.push(`<circle cx="${x(i)}" cy="${baseY}" r="${HIT}" class="cell-hit" data-cell="${i}" />`);
    body.push(`<g class="cell-group${owner ? ' used' : ''}">${inner.join('')}</g>`);
  }
  return { viewBox: `0 0 ${W} ${H}`, body: body.join('') };
}

function render(): void {
  const cfg = state.config;
  const prog = makerProgress(state);
  const over = isOver(state);

  const { viewBox, body } = renderVdw(state);
  const board = $('board');
  board.setAttribute('viewBox', viewBox);
  board.innerHTML = body;
  // drive the hover-preview colour: only on your turn, in the side-to-move's colour
  const myTurn = !over && isHumanTurn();
  board.classList.toggle('turn-r', myTurn && state.turn === MAKER);
  board.classList.toggle('turn-b', myTurn && state.turn !== MAKER);

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
        ? `Maker scored ${score}/${need} — a full ${cfg.target}-term progression! 🎉`
        : `Maker wins — a ${cfg.target}-term red progression! 🎉`;
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
    `You are <b class="red-text">Maker (red)</b> — claim <b>${target.value}</b> positions in an evenly-spaced row (an arithmetic progression).`;
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
