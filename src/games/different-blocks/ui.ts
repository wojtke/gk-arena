// UI controller for Different Blocks. CONSTRUCTOR clicks a caret (gap); AVOIDER clicks a palette
// letter to insert there. When a bad configuration forms, the k-block run is boxed and the two equal
// blocks B_i, B_j are pulsed in two colours. Logic lives in the engine; this file renders & wires.
//
// Role select mapping: "C" = human is CONSTRUCTOR (the forcing side), "A" = human is AVOIDER,
// "both" = hotseat, "none" = watch AI vs AI. aiR = Constructor level, aiB = Avoider level.

import {
  AILevel, AVOIDER, CONSTRUCTOR, GameConfig, GameState, HumanRole, Role,
  newGame, applyMove, legalMoves, isOver, goalText, makeRng, aiMove, currentPlayer, minAlpha,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// ---- slot markup ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="alphaRange">Alphabet |A| <span class="hint-num" id="alphaLabel">3</span></label>
      <input type="range" id="alphaRange" min="2" max="6" value="3" />
    </div>
    <div class="field">
      <label for="kRange">Blocks k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="2" max="5" value="3" />
    </div>
    <div class="field">
      <label for="nRange">Target length n <span class="hint-num" id="nLabel">12</span></label>
      <input type="range" id="nRange" min="4" max="24" value="12" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="C" selected>Constructor (blue)</option>
        <option value="A">Avoider (red)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Constructor AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Avoider AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
  <div class="hint-note" id="alphaNote"></div>
</section>`;

const BOARD_HTML = `
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Blue to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="wordbox">
    <div class="word" id="word"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 12</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Constructor (blue)</b> clicks a <b>caret</b> (a gap) to point at where the next letter goes.</li>
    <li><b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.</li>
    <li><b class="blue-text">Constructor</b> wins the instant the word has <b>k equal-length adjacent blocks with two identical</b> (a bad configuration).</li>
    <li><b class="red-text">Avoider</b> wins by reaching length <b id="howtoN">12</b> with every such run all-different.</li>
    <li>On a Constructor win the offending k-block run is boxed and the two equal blocks are painted <span class="blkA-text">block A</span> and <span class="blkB-text">block B</span>.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Squares to k-blocks.</b> A <b>square</b> is <code>XX</code> — two adjacent equal-length
    equal blocks. That is exactly the bad pattern at <b>k = 2</b>, so Different Blocks at k = 2
    coincides with the square game. The default <b>k = 3</b> forbids <i>three</i> equal-length
    adjacent blocks with a repeat: for length-1 blocks <code>abc</code> is safe but
    <code>aab</code>, <code>aba</code>, <code>baa</code> all lose (two single letters coincide).</p>
  <p><b>Why |A| &ge; k.</b> With <b>fewer than k letters</b>, any k single-letter blocks
    (<code>m = 1</code>) must repeat by the <b>pigeonhole principle</b>, so the Constructor wins for
    free. Interesting play needs at least k letters so an <code>m = 1</code> run can be pairwise
    distinct; we clamp <code>|A|</code> up to k.</p>
  <p><b>Connection to Thue theory.</b> "k adjacent blocks all pairwise different" is a rainbow-
    flavoured strengthening of square-freeness — a Thue-type avoidance question. The online forcing
    version has no published survivable-length table, so the tables here are computed from scratch.</p>
  <p><b>The AI.</b> "Strong" is depth-limited alpha-beta over (gap, letter) with a near-repeat leaf
    score; "Solver" searches exactly on small instances (memoised), falling back to Strong.</p>
  <p class="muted small">Reference: Thue, <i>Über unendliche Zeichenreihen</i> (1906).</p>
</section>`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: number | null = null; // a gap (point phase) or a letter (insert phase) to suggest
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// ---- config ----
function readConfig(seed: number): GameConfig {
  const k = +($('kRange') as HTMLInputElement).value;
  const alpha = Math.max(+($('alphaRange') as HTMLInputElement).value, minAlpha(k));
  const n = +($('nRange') as HTMLInputElement).value;
  const roleVal = ($('roleSel') as HTMLSelectElement).value;
  const humanRole: HumanRole =
    roleVal === 'C' ? CONSTRUCTOR : roleVal === 'A' ? AVOIDER : (roleVal as HumanRole);
  return {
    alpha, k, n, humanRole,
    aiLevel: {
      C: +($('aiR') as HTMLSelectElement).value as AILevel,
      A: +($('aiB') as HTMLSelectElement).value as AILevel,
    },
    seed,
  };
}

function humanControls(turn: Role): boolean {
  const r = state.config.humanRole;
  if (r === 'both') return true;
  if (r === 'none') return false;
  return r === turn;
}
const isHumanTurn = () => !isOver(state) && humanControls(currentPlayer(state));
const isAiTurn = () => !isOver(state) && !humanControls(currentPlayer(state));

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

function doMove(move: number): void {
  if (isOver(state)) return;
  const next = applyMove(state, move);
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
  doMove(aiMove(state, state.config.aiLevel[currentPlayer(state)], rng));
}

function onCaret(gap: number): void {
  if (!isHumanTurn() || state.phase !== 'point') return;
  doMove(gap);
}
function onLetter(sym: number): void {
  if (!isHumanTurn() || state.phase !== 'insert') return;
  if (!legalMoves(state).includes(sym)) return;
  doMove(sym);
}

function showHint(): void {
  if (!isHumanTurn()) return;
  hint = aiMove(state, 2, rng);
  render();
}

function undo(): void {
  if (!history.length) return;
  state = history.pop()!;
  const r = state.config.humanRole;
  if (r === CONSTRUCTOR || r === AVOIDER) {
    while (history.length && !humanControls(currentPlayer(state)) && !isOver(state)) state = history.pop()!;
  }
  hint = null;
  running = false;
  render();
}

// ---- rendering ----
/** Map each word index to a highlight class from the witness (the two equal blocks + the run box). */
function buildColorMap(s: GameState): { color: Map<number, 'blkA' | 'blkB'>; runStart: number; runEnd: number } {
  const color = new Map<number, 'blkA' | 'blkB'>();
  let runStart = -1, runEnd = -1;
  if (isOver(s) && s.witness) {
    const { start, m, i, j, k } = { ...s.witness, k: s.config.k };
    runStart = start;
    runEnd = start + k * m; // exclusive
    for (let t = 0; t < m; t++) color.set(start + i * m + t, 'blkA');
    for (let t = 0; t < m; t++) color.set(start + j * m + t, 'blkB');
  }
  return { color, runStart, runEnd };
}

/** Build the tile + caret row. In point phase the carets are clickable; insert phase shows the gap. */
function renderWord(): void {
  const word = $('word');
  word.innerHTML = '';
  const s = state;
  const { color, runStart, runEnd } = buildColorMap(s);

  if (s.word.length === 0) {
    // empty start: one full-width, centred, click-anywhere caret carrying the prompt
    const c = makeCaret(0);
    c.classList.add('empty');
    const hintSpan = document.createElement('span');
    hintSpan.className = 'empty-hint';
    hintSpan.textContent = s.phase === 'point'
      ? 'Constructor: click anywhere here to point at the first gap.'
      : 'Avoider: pick a letter to insert.';
    c.appendChild(hintSpan);
    word.appendChild(c);
    return;
  }

  // Always render a caret in every gap so the row never reflows ("crams") when the phase changes or
  // it's the AI's turn; makeCaret marks each pickable / chosen / disabled.
  for (let i = 0; i <= s.word.length; i++) {
    word.appendChild(makeCaret(i));
    if (i < s.word.length) {
      const inRun = i >= runStart && i < runEnd;
      word.appendChild(makeTile(s.word[i], i, color.get(i), inRun));
    }
  }
}

function makeCaret(gap: number): HTMLElement {
  const pickable = state.phase === 'point' && !isOver(state) && isHumanTurn();
  const chosen = state.phase === 'insert'
    ? state.gap === gap
    : (state.phase === 'point' && hint === gap);
  const el = document.createElement('button');
  el.className = 'caret' + (pickable ? '' : ' disabled') + (chosen ? ' sel' : '');
  el.dataset.gap = String(gap);
  const bar = document.createElement('span');
  bar.className = 'bar';
  el.appendChild(bar);
  if (!pickable) el.tabIndex = -1;
  return el;
}

function makeTile(sym: number, _idx: number, blk?: 'blkA' | 'blkB', inRun = false): HTMLElement {
  const el = document.createElement('span');
  el.className = 'tile' + (blk ? ' ' + blk : '') + (inRun ? ' inrun' : '');
  const val = document.createElement('span');
  val.className = 'val';
  val.textContent = LETTERS[sym] ?? String(sym);
  el.appendChild(val);
  return el;
}

function renderPalette(): void {
  const pal = $('palette');
  pal.innerHTML = '';
  const s = state;
  const over = isOver(s);
  const active = s.phase === 'insert' && !over && (humanControls(AVOIDER) || s.config.humanRole === 'none');
  const legal = new Set(legalMoves(s));

  for (let c = 0; c < s.config.alpha; c++) {
    pal.appendChild(makePaletteBtn(c, active && legal.has(c)));
  }

  const note = document.createElement('span');
  note.className = 'palette-hint';
  if (over) note.textContent = '';
  else if (s.phase === 'point') note.textContent = 'Constructor points at a gap first.';
  else note.textContent = 'Insert a letter.';
  pal.appendChild(note);
}

function makePaletteBtn(sym: number, enabled: boolean): HTMLElement {
  const b = document.createElement('button');
  b.dataset.sym = String(sym);
  b.disabled = !enabled;
  if (hint !== null && state.phase === 'insert' && hint === sym && enabled) {
    b.style.borderColor = 'var(--violet)';
    b.style.boxShadow = '0 0 0 2px rgba(110,86,207,.25)';
  }
  const label = document.createElement('span');
  label.textContent = LETTERS[sym] ?? String(sym);
  b.appendChild(label);
  return b;
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderWord();
  renderPalette();

  const pill = $('turnPill');
  if (over) {
    pill.textContent = `${state.winner === CONSTRUCTOR ? 'Constructor (blue)' : 'Avoider (red)'} wins`;
    pill.className = 'turn-pill done';
  } else {
    const p = currentPlayer(state);
    pill.textContent = p === CONSTRUCTOR ? 'Constructor to point' : 'Avoider to insert';
    pill.className = `turn-pill ${p === CONSTRUCTOR ? 'blue' : ''}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  const len = state.word.length;
  $('meterFill').style.width = `${cfg.n ? Math.min(len / cfg.n, 1) * 100 : 0}%`;
  $('meterValue').textContent = `${len} / ${cfg.n}`;
  $('meterLabel').textContent = 'Length toward target';

  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (state.winner === CONSTRUCTOR) {
      banner.className = 'banner blue';
      const w = state.witness;
      const where = w
        ? ` blocks ${w.i + 1} and ${w.j + 1} of a ${cfg.k}-block run (length ${w.m} each) at position ${w.start + 1}.`
        : '.';
      banner.textContent = `Constructor wins — a bad configuration appeared:${where} The two equal blocks are painted.`;
    } else {
      banner.className = 'banner red';
      banner.textContent = `Avoider wins — reached length ${cfg.n} with every k-block run all-different. 🎉`;
    }
  } else {
    banner.hidden = true;
  }

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
  const k = +($('kRange') as HTMLInputElement).value;
  const alphaEl = $('alphaRange') as HTMLInputElement;
  // enforce |A| >= k visually: bump the slider up if below k
  const wasBelow = +alphaEl.value < k; // capture BEFORE bumping so the clamp note can fire
  if (wasBelow) alphaEl.value = String(k);
  if (+alphaEl.min < 2) alphaEl.min = '2';
  $('alphaLabel').textContent = alphaEl.value;
  $('kLabel').textContent = String(k);
  $('nLabel').textContent = ($('nRange') as HTMLInputElement).value;
  $('howtoN').textContent = ($('nRange') as HTMLInputElement).value;
  const clamped = wasBelow;
  $('alphaNote').textContent = clamped
    ? `Alphabet clamped to k = ${k}: with |A| < k a bad configuration is forced (pigeonhole).`
    : `Keep |A| ≥ k = ${k}; below that the m = 1 case is forced by pigeonhole.`;
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  // aiR = Constructor (shown unless human is Constructor, role C), aiB = Avoider (unless role A)
  $('aiRField').style.display = (role === 'A' || role === 'none') ? '' : 'none';
  $('aiBField').style.display = (role === 'C' || role === 'none') ? '' : 'none';
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  $('word').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-gap]') as HTMLElement | null;
    if (t) onCaret(+(t.dataset.gap as string));
  });
  $('palette').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-sym]') as HTMLButtonElement | null;
    if (t && !t.disabled) onLetter(+(t.dataset.sym as string));
  });

  for (const id of ['alphaRange', 'kRange', 'nRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
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
