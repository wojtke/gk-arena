// UI controller for Thue Arena. One pure engine, two game kinds (append + Thue online), rendered as
// a row of letter tiles plus a palette; in online mode, insertion carets between tiles. The forcer
// clicks a caret, then the avoider clicks a letter. On a loss the witness blocks pulse. Explanation
// mode (with the Explainers toggle and the Hint button) names the recommended move.

import {
  AILevel, AVOIDER, FORCER, Color, GameConfig, GameKind, GameState, RepMode, Role,
  colorOf, newGame, applyMove, currentPlayer, isOver, legalMoves, goalText,
  letterChar, makeRng, aiMove, explainMove, Explanation,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- markup (re-grouped from the standalone index.html into the three shell slots) ----
const SETTINGS_HTML = `
  <section class="card">
    <h2>Settings</h2>
    <div class="controls">
      <div class="field span2">
        <label for="gameSel">Game</label>
        <select id="gameSel">
          <option value="append">Append (alternating)</option>
          <option value="online" selected>Thue online (insertion)</option>
        </select>
      </div>
      <div class="field">
        <label for="kRange">Alphabet k <span class="hint-num" id="kLabel">4</span></label>
        <input type="range" id="kRange" min="2" max="6" value="4" />
      </div>
      <div class="field">
        <label for="nRange">Target n <span class="hint-num" id="nLabel">12</span></label>
        <input type="range" id="nRange" min="4" max="24" value="12" />
      </div>
      <div class="field span2">
        <label for="repSel">Repetition</label>
        <select id="repSel">
          <option value="square">Square XX</option>
          <option value="nontrivial">Nontrivial XX (|X| ≥ 2)</option>
          <option value="overlap" selected>Overlap aXaXa</option>
          <option value="abelian">Abelian square XY</option>
        </select>
      </div>
      <div class="field">
        <label for="roleSel">You play</label>
        <select id="roleSel">
          <option value="R" selected>Ann (avoider)</option>
          <option value="B">Ben (forcer)</option>
          <option value="both">Hotseat (both)</option>
          <option value="none">Watch AI vs AI</option>
        </select>
      </div>
      <div class="field" id="aiRField">
        <label for="aiR">Ann AI</label>
        <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
      </div>
      <div class="field" id="aiBField">
        <label for="aiB">Ben AI</label>
        <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
      </div>
    </div>
    <div class="buttons">
      <button id="newBtn" class="btn btn-primary">New game</button>
      <button id="hintBtn" class="btn">Hint</button>
      <button id="undoBtn" class="btn">Undo</button>
      <button id="runBtn" class="btn" hidden>Run</button>
    </div>
    <div class="explain-note hidden" id="explainNote"></div>
  </section>
`;

const BOARD_HTML = `
  <section class="card board-card">
    <div class="status">
      <span class="turn-pill" id="turnPill">Ann to move</span>
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
  </section>
`;

const SIDEBAR_HTML = `
  <section class="card explainer" id="howto">
    <h2>How to play</h2>
    <ol class="howto-list">
      <li><b class="red-text">Ann (avoider, red)</b> keeps the word free of the chosen repetition; <b class="blue-text">Ben (forcer, blue)</b> tries to force one.</li>
      <li id="howtoMode"><b>Append game:</b> players take turns adding a letter to the end.</li>
      <li><b class="red-text">Ann</b> wins by reaching length <b id="howtoN">12</b> repetition-free.</li>
      <li><b class="blue-text">Ben</b> wins the instant a forbidden repetition appears — its two equal blocks pulse.</li>
      <li>Turn on <b>Explainers</b> and use <b>Hint</b> to see the recommended move named.</li>
    </ol>
  </section>

  <section class="card explainer" id="maths">
    <h2>The maths behind it</h2>
    <p><b>Thue's theorem (1906).</b> Arbitrarily long <i>square-free</i> words exist over a
      <b>3-letter</b> alphabet, never over 2 — the seed of combinatorics on words.</p>
    <p><b>The game raises the bar.</b> When Ben interferes, Ann needs more room: in
      <i>How to play Thue games</i> (Grytczuk, Kosiński, Zmarz) she has an explicit strategy to
      dodge nontrivial repetitions over <b>9</b> letters and overlaps over <b>4</b> — even when
      Ben inserts at arbitrary positions.</p>
    <p><b>Square / overlap / abelian.</b> A square is <code>XX</code>; an overlap is
      <code>aXaXa</code>; an abelian square is <code>XY</code> with <code>Y</code> an anagram of
      <code>X</code>. Switch the repetition notion to change the threshold.</p>
    <p><b>The AI.</b> “Solver” searches the whole game tree exactly on small instances (so
      <i>k</i>, <i>n</i> small reproduces the paper's thresholds), and on the append game with
      nontrivial repetitions over <b>9</b> letters it plays Ann's <i>explicit</i> proven
      strategy (Theorem 2) — a tier that never loses, at any length. “Strong” is depth-limited
      minimax. Explanation mode names the square each move creates or averts.</p>
    <p class="muted small">References: Thue, <i>Über unendliche Zeichenreihen</i> (1906);
      Grytczuk, Kosiński &amp; Zmarz, <i>How to play Thue games</i>, Theoret. Comput. Sci. 582 (2015).</p>
  </section>
`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: Explanation | null = null;
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
let freshLen = 0; // word length after the previous render, for the "fresh" tile highlight
// The AI's committed next move for the current state, computed once (from the persistent rng) so the
// teaching overlay names the SAME move aiStep will play, and the move is not recomputed twice.
let pendingAi: { key: string; move: number } | null = null;
const AI_DELAY = 430;

// ---- config ----
function readConfig(seed: number): GameConfig {
  const k = +($('kRange') as HTMLInputElement).value;
  const n = +($('nRange') as HTMLInputElement).value;
  return {
    game: ($('gameSel') as HTMLSelectElement).value as GameKind,
    k,
    n,
    repMode: ($('repSel') as HTMLSelectElement).value as RepMode,
    humanRole: ($('roleSel') as HTMLSelectElement).value as GameConfig['humanRole'],
    aiLevel: {
      R: +($('aiR') as HTMLSelectElement).value as AILevel,
      B: +($('aiB') as HTMLSelectElement).value as AILevel,
    },
    seed,
  };
}

function humanControls(role: Role): boolean {
  const r = state.config.humanRole;
  if (r === 'both') return true;
  if (r === 'none') return false;
  return r === colorOf(role);
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
  freshLen = 0;
  if (state.config.humanRole !== 'none') running = false;
  render();
  scheduleAi();
}

function doMove(move: number): void {
  if (isOver(state)) return;
  const next = applyMove(state, move);
  if (next === state) return;
  history.push(state);
  freshLen = state.word.length;
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

/** Identifies an AI decision point so the committed move is computed (and RNG drawn) only once. */
function aiKey(s: GameState): string {
  return `${s.word.join(',')}|${s.phase}|${s.gap ?? -1}|${s.config.aiLevel[colorOf(currentPlayer(s))]}`;
}

/**
 * The move the AI side will play from the current state, computed once with the persistent rng and
 * memoised, so the teaching overlay (renderExplain) and aiStep agree on the exact move.
 */
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
  if (!isHumanTurn()) return;
  // append: any current player plays a letter; online: only in insert phase.
  if (state.config.game === 'online' && state.phase !== 'insert') return;
  doMove(letter);
}

function onCaret(gap: number): void {
  if (!isHumanTurn()) return;
  if (state.config.game !== 'online' || state.phase !== 'point') return;
  doMove(gap);
}

function showHint(): void {
  if (!isHumanTurn()) return;
  hint = explainMove(state, rng);
  render();
}

function undo(): void {
  if (!history.length) return;
  state = history.pop()!;
  const r = state.config.humanRole;
  if (r === 'R' || r === 'B') {
    while (history.length && !humanControls(currentPlayer(state)) && !isOver(state)) {
      state = history.pop()!;
    }
  }
  hint = null;
  pendingAi = null;
  running = false;
  freshLen = state.word.length;
  render();
}

// ---- rendering ----
function tileWinClass(i: number): string {
  // The witness covers [start, end); first block (avoider tint), second block (forcer tint).
  const w = state.witness;
  if (!w) return '';
  if (i < w.start || i >= w.end) return '';
  // overlap can have odd length; split at the midpoint of the witness span.
  const firstBlockEnd = w.start + Math.ceil((w.end - w.start) / 2);
  return i < firstBlockEnd ? 'win-a' : 'win-b';
}

function renderWord(): void {
  const wordEl = $('word');
  const over = isOver(state);
  const online = state.config.game === 'online';
  const showCarets = online && !over && state.phase === 'point' && isHumanTurn();
  const chosenGap = online && state.phase === 'insert' ? state.gap : null;

  wordEl.classList.toggle('empty', state.word.length === 0 && !showCarets);
  const parts: string[] = [];
  // In the point phase a Hint names the recommended GAP (hint.move); cue it on the board.
  const suggestGap = showCarets && hint ? hint.move : -1;

  const caret = (gap: number): string => {
    // Point phase (human forcer): show a clickable caret at every gap.
    // Insert phase: show only the already-chosen gap, highlighted and disabled.
    if (showCarets) {
      const cls = gap === suggestGap ? 'caret suggest' : 'caret';
      return `<button class="${cls}" data-gap="${gap}" aria-label="insert at gap ${gap}"></button>`;
    }
    if (chosenGap === gap) {
      return `<button class="caret active" data-gap="${gap}" disabled aria-label="chosen gap ${gap}"></button>`;
    }
    return '';
  };

  for (let i = 0; i <= state.word.length; i++) {
    parts.push(caret(i));
    if (i < state.word.length) {
      const cls = ['tile'];
      const wc = tileWinClass(i);
      if (wc) cls.push(wc);
      else if (i >= freshLen && !over) cls.push('fresh');
      parts.push(`<span class="${cls.join(' ')}">${letterChar(state.word[i])}</span>`);
    }
  }
  wordEl.innerHTML = parts.join('');
}

function renderPalette(): void {
  const pal = $('palette');
  const over = isOver(state);
  const online = state.config.game === 'online';
  // letters are clickable only on a human letter-turn (append: any turn; online: the insert phase).
  const enabled = !over && isHumanTurn() && (!online || state.phase === 'insert');

  const dangerSet = new Set<number>();
  const suggest = hint && (!online || state.phase === 'insert') ? hint.move : -1;
  if (enabled) {
    for (let c = 0; c < state.config.k; c++) {
      if (applyMove(state, c).winner === FORCER) dangerSet.add(c);
    }
  }

  const btns: string[] = [];
  for (let c = 0; c < state.config.k; c++) {
    const cls = ['' ];
    if (enabled && dangerSet.has(c)) cls.push('danger');
    if (enabled && suggest === c) cls.push('suggest');
    const disabled = enabled ? '' : ' disabled';
    btns.push(`<button class="${cls.join(' ').trim()}" data-letter="${c}"${disabled}>${letterChar(c)}</button>`);
  }
  pal.innerHTML = btns.join('');
}

function renderExplain(): void {
  const note = $('explainNote');
  const explainOn = document.body.classList.contains('explain-on');
  let html = '';
  if (explainOn && !isOver(state)) {
    if (hint) {
      html = `<b>Hint:</b> ${hint.text}`;
    } else if (isAiTurn()) {
      // Teaching overlay: describe the EXACT move the AI is about to play (the committed move,
      // computed once from the persistent rng) at the side's configured level.
      const level = state.config.aiLevel[colorOf(currentPlayer(state))];
      const e = explainMove(state, rng, level, committedAiMove());
      if (e) html = `<b>${currentPlayer(state) === AVOIDER ? 'Ann' : 'Ben'} (AI):</b> ${e.text}`;
    }
  }
  note.innerHTML = html;
  note.classList.toggle('hidden', html === '');
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderWord();
  renderPalette();
  renderExplain();

  // status pill
  const pill = $('turnPill');
  if (over) {
    pill.textContent = state.winner === AVOIDER ? 'Ann wins' : 'Ben wins';
    pill.className = 'turn-pill done';
  } else {
    const me = currentPlayer(state);
    const action = cfg.game === 'online' && state.phase === 'point' ? ' — pick a gap' : '';
    pill.textContent = (me === AVOIDER ? 'Ann to move' : 'Ben to move') + action;
    pill.className = `turn-pill ${me === AVOIDER ? '' : 'blue'}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // meter: length toward target
  $('meterLabel').textContent = 'Length toward target';
  $('meterFill').style.width = `${Math.min(state.word.length / cfg.n, 1) * 100}%`;
  $('meterValue').textContent = `${state.word.length} / ${cfg.n}`;

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (state.winner === AVOIDER) {
      banner.className = 'banner red';
      banner.textContent = `Ann wins — reached length ${cfg.n} with no forbidden repetition! 🎉`;
    } else {
      banner.className = 'banner blue';
      const w = state.witness;
      const factor = w ? state.word.slice(w.start, w.end).map(letterChar).join('') : '';
      banner.textContent = `Ben wins — a forbidden repetition appeared${factor ? `: ${factor}` : ''}.`;
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
  const k = $('kRange') as HTMLInputElement;
  const n = $('nRange') as HTMLInputElement;
  $('kLabel').textContent = k.value;
  $('nLabel').textContent = n.value;
  $('howtoN').textContent = n.value;
  const game = ($('gameSel') as HTMLSelectElement).value as GameKind;
  $('howtoMode').innerHTML = game === 'append'
    ? '<b>Append game:</b> players take turns adding a letter to the end.'
    : '<b>Thue online:</b> Ben clicks a caret to choose a gap, then Ann inserts a letter there.';
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

  $('word').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-gap]');
    if (t) onCaret(+(t.getAttribute('data-gap') as string));
  });
  $('palette').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-letter]');
    if (t) onLetter(+(t.getAttribute('data-letter') as string));
  });

  $('gameSel').addEventListener('change', () => { syncLabels(); startNewGame(); });
  for (const id of ['kRange', 'nRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('repSel').addEventListener('change', startNewGame);
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
