// UI controller for Grasshopper (AVOIDANCE FORM — Builder avoids a square, Grasshopper forces one).
// Two phases per round, rendered as a row of letter tiles (the built
// word W) with a 🦗 marker on `pos`; in build phase the appended slots glow and a letter palette is
// shown; in hop phase the +1/+2 landing targets are highlighted and clickable. Below, the inspected
// word S is its own tile row with a |S|/d meter and a win banner. Logic lives in the engine; this
// file only renders and wires events.
//
// Role select mapping: "B" = human Builder (blue), "R" = human Grasshopper (red), "both" = hotseat,
// "none" = watch AI vs AI. aiR = Grasshopper level, aiB = Builder level.

import {
  AILevel, BUILDER, GRASSHOPPER, GameConfig, GameState, HumanRole, Role,
  colorOf, newGame, applyMove, currentPlayer, isOver, legalMoves, goalText,
  letterChar, makeRng, aiMove, explainMove, Explanation,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- slot markup (three shell slots) ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="alphaRange">Alphabet |A| <span class="hint-num" id="alphaLabel">3</span></label>
      <input type="range" id="alphaRange" min="2" max="6" value="3" />
    </div>
    <div class="field">
      <label for="dRange">Inspected target d <span class="hint-num" id="dLabel">6</span></label>
      <input type="range" id="dRange" min="2" max="16" value="6" />
    </div>
    <div class="field span2">
      <label for="powerSel">Forbidden pattern</label>
      <select id="powerSel">
        <option value="2" selected>Square xx</option>
        <option value="3">Cube xxx</option>
      </select>
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="B">Builder (blue) · avoider</option>
        <option value="R" selected>Grasshopper (red) · forcer</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Builder AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Grasshopper AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1">Greedy</option><option value="2" selected>Strong</option><option value="3">Solver</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
    <button id="hintBtn" class="btn">Hint</button>
    <button id="undoBtn" class="btn">Undo</button>
    <button id="runBtn" class="btn" hidden>Run</button>
  </div>
  <div id="hintText" class="hint-note">Click Hint to highlight a strong move on the board.</div>
</section>`;

const BOARD_HTML = `
<section class="card board-card">
  <div class="status">
    <span class="turn-pill" id="turnPill">Builder to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="phaselabel" id="phaseLabel"></div>

  <div class="wordbox">
    <div class="word" id="word"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="inspectbox">
    <div class="inspect-label">Inspected word S (what is judged)</div>
    <div class="inspected" id="inspected"></div>
  </div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Inspected length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 6</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Builder (blue)</b> — the <b>avoider</b> — appends letters to the end of the word <b>W</b>, one at a time, until the grasshopper has somewhere to jump (it must be able to reach both <code>p+1</code> and <code>p+2</code>). When it owes <b>two</b> letters it can make them <i>different</i> so the grasshopper can't simply repeat.</li>
    <li><b class="red-text">Grasshopper (red)</b> 🦗 — the <b>forcer</b> — then hops forward <b>+1</b> or <b>+2</b> — never backward. The letter it lands on is appended to the <b>inspected word S</b>.</li>
    <li><b class="red-text">Grasshopper</b> wins the instant <b>S</b> ends with the forbidden pattern (a square <code>xx</code>, or a cube <code>xxx</code>) — it has <b>forced a square into the path</b>; its repeated blocks pulse.</li>
    <li id="howtoGoal"><b class="blue-text">Builder</b> wins by keeping <b>S</b> square-free all the way to <b>|S| = <span id="howtoD">6</span></b>.</li>
    <li>A letter the grasshopper <b>skips with a +2 hop</b> is behind it forever — hops are forward-only, so it can never be landed on again.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Thue's theorem (1906).</b> Arbitrarily long <i>square-free</i> words exist over a
    <b>3-letter</b> alphabet, never over 2 — the seed of combinatorics on words. The plain Thue
    pursuit–evasion game asks whether an <i>avoider</i> who controls the letters can dodge a square
    forever; over <b>|A| ≥ 3</b> it can.</p>
  <p><b>The grasshopper twist.</b> The avoider is the <b class="blue-text">Builder</b>: it controls
    the letters but <b>not</b> which of them is judged. The <b class="red-text">Grasshopper</b> (the
    forcer) chooses <i>which subsequence</i> — via <code>+1/+2</code> hops — becomes <b>S</b>. So the
    Builder must keep <i>every</i> hop-reachable subsequence square-free, while the Grasshopper
    manoeuvres to steer some reachable path into a repeat. This is a genuine pursuit–evasion game on
    a word.</p>
  <p><b>The contest.</b> When the Builder owes <b>two</b> letters it can make the two landable
    letters <i>different</i>, denying the grasshopper an automatic repeat — so the grasshopper must
    work to force a square, and the Builder must plan its letters so no reachable path closes one.
    Neither side wins for free.</p>
  <p><b>Why the lookahead is tiny.</b> The value of a position depends only on
    <code>(S, the committed-but-unreached tail W[p+1…], phase, needLeft)</code>. A letter bypassed
    by a <code>+2</code> hop is behind <code>p</code> forever, so it is irrelevant; the tail is
    <b>≤ 2 letters</b>, so the exact solver memoises well even though <b>W</b> grows.</p>
  <p><b>What the solver finds.</b> The <b>Builder's guaranteed <code>d</code></b> — the largest length
    it can keep <b>S</b> square-free against perfect hopping — is small for <b>|A| = 2</b> (the
    grasshopper soon forces a square) but grows without bound for <b>|A| ≥ 3</b> (Thue): a real,
    non-constant table.</p>
  <p class="muted small"><b>Start-condition assumption.</b> The Builder chooses <i>all</i> letters and
    <b>S starts empty</b> (the grasshopper has not landed yet at <code>p = -1</code>). A variant where
    the first letter is fixed, or where <b>S</b> includes a pre-placed letter, would shift the balance.
    <b>Win-direction note:</b> the version where the letter-chooser also wants the pattern is degenerate
    — that side forces a square trivially — so we implement the <b>avoidance form</b> (Builder avoids,
    Grasshopper forces) as the genuine game.</p>
  <p class="muted small">References: Thue, <i>Über unendliche Zeichenreihen</i> (1906);
    Grytczuk, Szafruga &amp; Zmarz, <i>Online version of the theorem of Thue</i> (2012),
    <a href="https://arxiv.org/abs/1204.6687" target="_blank" rel="noopener">arXiv:1204.6687</a>.</p>
</section>`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: Explanation | null = null;
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
let freshFrom = 0; // W-length before this round's appends, for the "fresh slot" glow
let pendingAi: { key: string; move: number } | null = null;
const AI_DELAY = 430;

// ---- config ----
function readConfig(seed: number): GameConfig {
  const alpha = +($('alphaRange') as HTMLInputElement).value;
  const d = +($('dRange') as HTMLInputElement).value;
  const power = +($('powerSel') as HTMLSelectElement).value;
  const roleVal = ($('roleSel') as HTMLSelectElement).value;
  const humanRole: HumanRole =
    roleVal === 'B' ? 'B' : roleVal === 'R' ? 'R' : (roleVal as HumanRole);
  return {
    alpha, d, power, humanRole,
    aiLevel: {
      B: +($('aiB') as HTMLSelectElement).value as AILevel,
      R: +($('aiR') as HTMLSelectElement).value as AILevel,
    },
    seed,
  };
}

function humanControls(turn: Role): boolean {
  const r = state.config.humanRole;
  if (r === 'both') return true;
  if (r === 'none') return false;
  return r === colorOf(turn);
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
  pendingAi = null;
  freshFrom = 0;
  if (state.config.humanRole !== 'none') running = false;
  render();
  scheduleAi();
}

function doMove(move: number): void {
  if (isOver(state)) return;
  // Track where this round's appends began so the build-phase glow only lights fresh slots.
  if (state.phase === 'hop') freshFrom = state.word.length; // next build round starts here
  const next = applyMove(state, move);
  if (next === state) return;
  history.push(state);
  state = next;
  hint = null;
  pendingAi = null;
  render();
  scheduleAi();
}

function scheduleAi(): void {
  window.clearTimeout(aiTimer);
  if (!isAiTurn()) return;
  if (state.config.humanRole === 'none' && !running) return;
  aiTimer = window.setTimeout(aiStep, AI_DELAY);
}

function aiKey(s: GameState): string {
  return `${s.word.join(',')}|${s.pos}|${s.phase}|${s.needLeft}|${s.config.aiLevel[colorOf(currentPlayer(s))]}`;
}
function committedAiMove(): number {
  const key = aiKey(state);
  if (!pendingAi || pendingAi.key !== key) {
    const level = state.config.aiLevel[colorOf(currentPlayer(state))];
    pendingAi = { key, move: aiMove(state, level, rng) };
  }
  return pendingAi.move;
}
function aiStep(): void {
  if (!isAiTurn()) return;
  if (state.config.humanRole === 'none' && !running) return;
  doMove(committedAiMove());
}

function onLetter(letter: number): void {
  if (!isHumanTurn() || state.phase !== 'build') return;
  if (!legalMoves(state).includes(letter)) return;
  doMove(letter);
}
function onHop(step: number): void {
  if (!isHumanTurn() || state.phase !== 'hop') return;
  if (!legalMoves(state).includes(step)) return;
  doMove(step);
}

function showHint(): void {
  if (!isHumanTurn()) return;
  hint = explainMove(state, rng, 2);
  render();
}

function undo(): void {
  if (!history.length) return;
  state = history.pop()!;
  const r = state.config.humanRole;
  if (r === 'B' || r === 'R') {
    while (history.length && !humanControls(currentPlayer(state)) && !isOver(state)) {
      state = history.pop()!;
    }
  }
  hint = null;
  pendingAi = null;
  running = false;
  freshFrom = state.word.length; // after an undo, don't glow stale slots
  render();
}

// ---- rendering ----
/** Two tinted blocks for a square (power 2) or three for a cube; split the witness span evenly. */
function inspectedWinClass(i: number): string {
  const w = state.witness;
  if (!w) return '';
  if (i < w.start || i >= w.end) return '';
  const rel = Math.floor((i - w.start) / w.block); // which repeated block
  return rel % 2 === 0 ? 'win-a' : 'win-b';
}

function renderWord(): void {
  const wordEl = $('word');
  const over = isOver(state);
  const hopping = !over && state.phase === 'hop';
  // landing targets the grasshopper may jump to this hop
  const t1 = state.pos + 1;
  const t2 = state.pos + 2;
  const suggestStep = hopping && hint ? hint.move : -1;
  const hopHuman = hopping && isHumanTurn();

  wordEl.classList.toggle('empty', state.word.length === 0);
  const parts: string[] = [];
  for (let i = 0; i < state.word.length; i++) {
    const cls = ['tile'];
    if (i <= state.pos) cls.push('past');                 // already behind the grasshopper
    if (i >= freshFrom && state.phase === 'build' && !over) cls.push('fresh'); // just appended
    let attrs = '';
    if (hopping && (i === t1 || i === t2)) {
      const step = i === t1 ? 1 : 2;
      cls.push('target', `target-${step}`);
      if (suggestStep === step) cls.push('suggest');
      if (hopHuman) { attrs = ` data-step="${step}" role="button" tabindex="0"`; }
    }
    const marker = i === state.pos ? '<span class="hopper">🦗</span>' : '';
    const badge = hopping && (i === t1 || i === t2) ? `<span class="step-badge">+${i === t1 ? 1 : 2}</span>` : '';
    parts.push(`<span class="${cls.join(' ')}"${attrs}>${marker}${letterChar(state.word[i])}${badge}</span>`);
  }
  // The grasshopper sits "before" the word at the very start (p = -1): show a leading marker.
  if (state.pos < 0) {
    parts.unshift('<span class="tile pre"><span class="hopper">🦗</span></span>');
  }
  wordEl.innerHTML = parts.join('');
}

function renderPalette(): void {
  const pal = $('palette');
  const over = isOver(state);
  const building = !over && state.phase === 'build';
  const enabled = building && isHumanTurn();
  const suggest = enabled && hint ? hint.move : -1;
  const btns: string[] = [];
  for (let c = 0; c < state.config.alpha; c++) {
    const cls: string[] = [];
    if (enabled && suggest === c) cls.push('suggest');
    const disabled = enabled ? '' : ' disabled';
    btns.push(`<button class="${cls.join(' ')}" data-letter="${c}"${disabled}>${letterChar(c)}</button>`);
  }
  // when hopping, the palette is dimmed/empty with a hint
  if (!building) {
    pal.innerHTML = `<span class="palette-hint">${over ? '' : 'Grasshopper: click a +1 / +2 landing tile above.'}</span>`;
    return;
  }
  pal.innerHTML = btns.join('') + `<span class="palette-hint">Builder owes ${state.needLeft} letter${state.needLeft === 1 ? '' : 's'} this round.</span>`;
}

function renderInspected(): void {
  const el = $('inspected');
  const over = isOver(state);
  el.classList.toggle('empty', state.inspected.length === 0);
  const parts: string[] = [];
  for (let i = 0; i < state.inspected.length; i++) {
    const cls = ['stile'];
    const wc = inspectedWinClass(i);
    if (wc) cls.push(wc, 'pulse');
    else if (i === state.inspected.length - 1 && !over) cls.push('fresh');
    parts.push(`<span class="${cls.join(' ')}">${letterChar(state.inspected[i])}</span>`);
  }
  el.innerHTML = parts.join('');
}

function renderHint(): void {
  const note = $('hintText');
  if (hint && !isOver(state)) {
    note.innerHTML = `<b>Hint:</b> ${hint.text}`;
    return;
  }
  if (!isOver(state) && isAiTurn() && state.config.humanRole === 'none') {
    const level = state.config.aiLevel[colorOf(currentPlayer(state))];
    const e = explainMove(state, rng, level, committedAiMove());
    if (e) { note.innerHTML = `<b>${currentPlayer(state) === BUILDER ? 'Builder' : 'Grasshopper'} (AI):</b> ${e.text}`; return; }
  }
  note.textContent = 'Click Hint to highlight a strong move on the board.';
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderWord();
  renderPalette();
  renderInspected();
  renderHint();

  // phase label
  const phaseEl = $('phaseLabel');
  if (over) phaseEl.textContent = '';
  else phaseEl.textContent = state.phase === 'build'
    ? `Build phase — Builder appends letters (owes ${state.needLeft}).`
    : 'Hop phase — Grasshopper jumps +1 or +2.';

  // status pill
  const pill = $('turnPill');
  if (over) {
    pill.textContent = state.winner === BUILDER ? 'Builder wins' : 'Grasshopper wins';
    pill.className = 'turn-pill done';
  } else {
    const p = currentPlayer(state);
    pill.textContent = p === BUILDER ? 'Builder to append' : 'Grasshopper to hop';
    pill.className = `turn-pill ${p === BUILDER ? 'blue' : ''}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // meter: inspected length toward target d
  $('meterLabel').textContent = 'Inspected length toward target';
  $('meterFill').style.width = `${cfg.d ? Math.min(state.inspected.length / cfg.d, 1) * 100 : 0}%`;
  $('meterValue').textContent = `${state.inspected.length} / ${cfg.d}`;

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (state.winner === GRASSHOPPER) {
      banner.className = 'banner red';
      const w = state.witness;
      const factor = w ? state.inspected.slice(w.start, w.end).map(letterChar).join('') : '';
      banner.textContent = `Grasshopper wins — forced a square in the path${factor ? `: ${factor}` : ''} 🦗🎉`;
    } else {
      banner.className = 'banner blue';
      banner.textContent = `Builder wins — kept the path square-free to length d = ${cfg.d} 🎉`;
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
  $('alphaLabel').textContent = ($('alphaRange') as HTMLInputElement).value;
  $('dLabel').textContent = ($('dRange') as HTMLInputElement).value;
  $('howtoD').textContent = ($('dRange') as HTMLInputElement).value;
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  $('aiBField').style.display = (role === 'R' || role === 'none') ? '' : 'none';
  $('aiRField').style.display = (role === 'B' || role === 'none') ? '' : 'none';
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  $('word').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-step]');
    if (t) onHop(+(t.getAttribute('data-step') as string));
  });
  $('palette').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-letter]');
    if (t) onLetter(+(t.getAttribute('data-letter') as string));
  });

  for (const id of ['alphaRange', 'dRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('powerSel').addEventListener('change', startNewGame);
  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiB', 'aiR']) $(id).addEventListener('change', startNewGame);

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
