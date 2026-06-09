// UI controller for VdW Duel. Single-phase insertion: the current player clicks a GAP caret and
// their OWN colour drops there (Red = player 1 / first, Blue = player 2). A player loses the instant
// their colour forms a monochromatic k-AP over the line indices — and because an insertion re-indexes
// everything to its right, a move can shove the OPPONENT into an AP too. Logic lives in the engine.
//
// Role select: "R" = human plays Red (first), "B" = human plays Blue, "both" = hotseat,
// "none" = watch AI vs AI. aiR = Red level, aiB = Blue level.

import {
  AILevel, GameConfig, GameState, HumanRole, Owner, RED, BLUE,
  newGame, applyMove, legalMoves, isOver, goalText, makeRng, aiMove, currentPlayer,
  longestAP, defaultMaxLen,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- slot markup ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field span2">
      <label for="kRange">AP length k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="3" max="4" value="3" />
    </div>
    <div class="field span2">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Red (first)</option>
        <option value="B">Blue (second)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
  <div id="hintText" class="hint-note">Click Hint to highlight a strong gap (Strong AI) — strong, not guaranteed safe.</div>
</section>`;

const BOARD_HTML = `
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Red to place</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="linebox">
    <div class="line" id="line"></div>
  </div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label red-text">Red — longest run toward k</div>
      <div class="meter-track"><div class="meter-fill" id="meterFillR"></div></div>
      <div class="meter-value" id="meterValueR">0 / 3</div>
    </div>
    <div class="meter">
      <div class="meter-label blue-text">Blue — longest run toward k</div>
      <div class="meter-track"><div class="meter-fill blue" id="meterFillB"></div></div>
      <div class="meter-value blue" id="meterValueB">0 / 3</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="red-text">Red</b> moves first; players alternate. You always drop <b>your own</b> colour.</li>
    <li>Click a <b>caret</b> (a gap between tokens) to insert your colour there. There is no palette — the colour is always yours.</li>
    <li>You <b>lose</b> the instant your colour sits on a monochromatic <b id="howtoK">3</b>-term arithmetic progression (equally spaced positions like <code>2, 4, 6</code>).</li>
    <li>Inserting shifts every token to the right, re-indexing the line — so a move can even push the <b>opponent</b> into an AP. Whoever owns the completed AP loses; a double loses for the mover.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Why it always ends.</b> The placed tokens form a 2-colouring of the index set
    <code>{1…L}</code>. By <b>Van der Waerden's theorem</b>, <i>every</i> 2-colouring of
    <code>{1…W(2;k)}</code> contains a monochromatic <code>k</code>-AP — so by length
    <code>W(2;k)</code> someone has already lost. The game cannot run past <code>W(2;k)</code> moves:
    <code>W(2;3) = 9</code>, <code>W(2;4) = 35</code> (the semicolon marks the diagonal — 2 colours,
    length <code>k</code>).</p>
  <p><b>k = 3 is the sweet spot.</b> Over within 9 tokens — small enough to <b>solve exactly</b> by
    game-tree search. <code>k = 4</code> can run to 35 tokens, so the exact Solver falls back to the
    depth-limited Strong AI there.</p>
  <p><b>Misère / avoidance.</b> Both players avoid the structure, so (unlike Maker–Breaker) there is
    no Erdős–Selfridge shortcut — values come from search. Whether the first or second player wins at
    <code>k = 3</code> is settled by exact game-tree search.</p>
  <p class="muted small">Reference: van der Waerden, <i>Beweis einer Baudetschen Vermutung</i> (1927).</p>
</section>`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: number | null = null; // a gap to suggest
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// ---- config ----
function readConfig(seed: number): GameConfig {
  const k = +($('kRange') as HTMLInputElement).value;
  const roleVal = ($('roleSel') as HTMLSelectElement).value;
  const humanRole: HumanRole =
    roleVal === 'R' ? RED : roleVal === 'B' ? BLUE : (roleVal as HumanRole);
  return {
    k,
    maxLen: defaultMaxLen(k),
    humanRole,
    aiLevel: {
      R: +($('aiR') as HTMLSelectElement).value as AILevel,
      B: +($('aiB') as HTMLSelectElement).value as AILevel,
    },
    seed,
  };
}

function humanControls(turn: Owner): boolean {
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

function doMove(gap: number): void {
  if (isOver(state)) return;
  const next = applyMove(state, gap);
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
  if (!isHumanTurn()) return;
  if (!legalMoves(state).includes(gap)) return;
  doMove(gap);
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
  if (r === RED || r === BLUE) {
    while (history.length && !humanControls(currentPlayer(state)) && !isOver(state)) state = history.pop()!;
  }
  hint = null;
  running = false;
  render();
}

// ---- rendering ----
function ownerLabel(o: Owner): string {
  return o === RED ? 'Red' : 'Blue';
}

/** Build the token + caret row. A caret is rendered in every gap on every render so the line never
 *  collapses (e.g. during the AI's turn); makeCaret marks non-pickable carets `disabled`. */
function renderLine(): void {
  const line = $('line');
  line.innerHTML = '';
  const s = state;

  const witness = new Set(s.witness ?? []);

  if (s.line.length === 0) {
    const c = makeCaret(0);
    c.classList.add('empty');
    const hintSpan = document.createElement('span');
    hintSpan.className = 'empty-hint';
    hintSpan.textContent = `${ownerLabel(s.turn)} to place — click anywhere here to drop your colour.`;
    c.appendChild(hintSpan);
    line.appendChild(c);
    return;
  }

  for (let i = 0; i <= s.line.length; i++) {
    line.appendChild(makeCaret(i));
    if (i < s.line.length) line.appendChild(makeTile(s.line[i], i, witness.has(i)));
  }
}

function makeCaret(gap: number): HTMLElement {
  const el = document.createElement('button');
  const pickable = !isOver(state) && isHumanTurn();
  el.className = 'caret' + (pickable ? '' : ' disabled') + (state.turn === BLUE ? ' blue' : '');
  el.dataset.gap = String(gap);
  const bar = document.createElement('span');
  bar.className = 'bar';
  el.appendChild(bar);
  if (!pickable) el.tabIndex = -1;
  return el;
}

function makeTile(owner: Owner, idx: number, inWitness: boolean): HTMLElement {
  const el = document.createElement('span');
  el.className = 'tile ' + (owner === RED ? 'red' : 'blue') + (inWitness ? ' witness' : '');
  const val = document.createElement('span');
  val.className = 'val';
  val.textContent = String(idx + 1); // show the 1-based line index, which the AP is over
  el.appendChild(val);
  return el;
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderLine();

  // status pill
  const pill = $('turnPill');
  if (over) {
    const loser = state.loser!;
    pill.textContent = `${ownerLabel(loser)} built a ${cfg.k}-AP — ${ownerLabel(loser)} loses`;
    pill.className = 'turn-pill done';
  } else {
    const p = currentPlayer(state);
    pill.textContent = `${ownerLabel(p)} to place`;
    pill.className = `turn-pill ${p === BLUE ? 'blue' : ''}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // meters — each colour's longest run toward k
  const rRun = longestAP(state.line, RED, cfg.k);
  const bRun = longestAP(state.line, BLUE, cfg.k);
  $('meterFillR').style.width = `${Math.min(rRun / cfg.k, 1) * 100}%`;
  $('meterFillB').style.width = `${Math.min(bRun / cfg.k, 1) * 100}%`;
  $('meterValueR').textContent = `${rRun} / ${cfg.k}`;
  $('meterValueB').textContent = `${bRun} / ${cfg.k}`;

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    const loser = state.loser!;
    const winner = state.winner!;
    banner.className = 'banner ' + (loser === RED ? 'red' : 'blue');
    const w = state.witness ? ` at positions ${state.witness.map(i => i + 1).join(', ')}` : '';
    banner.textContent = `${ownerLabel(loser)} built a ${cfg.k}-AP${w} — ${ownerLabel(loser)} loses, ${ownerLabel(winner)} wins.`;
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

  // hint note text
  if (hint !== null && isHumanTurn()) {
    $('hintText').textContent = `Suggested move (Strong AI): gap ${hint} — a strong drop, not guaranteed safe.`;
  }
}

// ---- controls ----
function syncLabels(): void {
  const k = ($('kRange') as HTMLInputElement).value;
  $('kLabel').textContent = k;
  $('howtoK').textContent = k;
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

  $('line').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-gap]') as HTMLElement | null;
    if (t) onCaret(+(t.dataset.gap as string));
  });

  $('kRange').addEventListener('input', syncLabels);
  $('kRange').addEventListener('change', () => { syncLabels(); startNewGame(); });
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
