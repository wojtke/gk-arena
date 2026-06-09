// UI controller for Repetition Eraser. Players append letters; squares ending at the last position
// are erased so the word grows and shrinks. Red (Grower) wants length d; Blue (Shrinker) wants the
// moves to run out first. Pure engine + AI live elsewhere; this file only wires the DOM.

import {
  Color, GameConfig, GameState, AILevel, EraseRule, GROWER,
  newGame, applyMove, legalMoves, isOver, goalText,
} from './engine';
import { aiMove, makeRng } from './ai';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

// ---- markup (re-grouped from the original index.html into the three slots) ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="kRange">Alphabet <span class="hint-num" id="kLabel">4</span></label>
      <input type="range" id="kRange" min="2" max="5" value="4" />
    </div>
    <div class="field">
      <label for="dRange">Target length <span class="hint-num" id="dLabel">8</span></label>
      <input type="range" id="dRange" min="4" max="20" value="8" />
    </div>
    <div class="field">
      <label for="roundsRange">Moves <span class="hint-num" id="roundsLabel">24</span></label>
      <input type="range" id="roundsRange" min="6" max="40" value="24" />
    </div>
    <div class="field">
      <label for="eraseSel">Erase rule</label>
      <select id="eraseSel">
        <option value="shortest" selected>Shortest square</option>
        <option value="longest">Longest square</option>
      </select>
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Red (Grower)</option>
        <option value="B">Blue (Shrinker)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Search</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Search</option></select>
    </div>
  </div>
  <div class="buttons">
    <button id="newBtn" class="btn btn-primary">New game</button>
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

  <div class="wordbox">
    <div class="word" id="word"></div>
    <div class="erase-badge" id="eraseBadge" hidden></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow">
    <div class="meter">
      <div class="meter-label">Length toward target</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 8</div>
    </div>
    <div class="rounds" id="rounds">move 0 / 24</div>
  </div>
  <div class="chartbox">
    <div class="chart-label">Length over time</div>
    <div class="chart" id="chart"></div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b>Click a letter</b> to append it to the word.</li>
    <li>Whenever a repetition <code>XX</code> appears at the end, its second copy is <b>erased</b> — so the word can shrink.</li>
    <li>You are <b class="red-text">Red (Grower)</b> — make the word reach length <b id="howtoD">8</b>.</li>
    <li><b class="blue-text">Blue (Shrinker)</b> wants to keep it short until the moves run out.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Square-free reducts.</b> Erasing the repeated block of a square repeatedly leads to a
    square-free word (Grytczuk &amp; Stankiewicz, <i>Square-free reducts of words</i>, 2020).</p>
  <p><b>Why only the end?</b> Because squares are erased as they form, the word stays
    <b>square-free between moves</b> — so a new square can only end at the just-added letter.
    That's why we only check the suffix.</p>
  <p><b>Game value / who's favoured.</b> With a small alphabet the Shrinker dominates: for
    <code>k&nbsp;=&nbsp;3</code> the longest square-free word the Grower can force tops out
    around length&nbsp;5, so any target <code>d&nbsp;&ge;&nbsp;6</code> (and all of
    <code>k&nbsp;=&nbsp;2</code>) is a forced Shrinker win. A larger alphabet gives the Grower
    room — the default <code>k&nbsp;=&nbsp;4</code>, <code>d&nbsp;=&nbsp;8</code> is a genuine
    toss-up.</p>
  <p class="muted small">Erasure rule: erase the second half of the <i>shortest</i> square ending at
    the last letter, and repeat until clean.</p>
  <p class="muted small">Reference: Grytczuk &amp; Stankiewicz, <i>Square-free reducts of words</i>
    (2020), <a href="https://arxiv.org/abs/2011.12822" target="_blank" rel="noopener">arXiv:2011.12822</a>.</p>
</section>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// Tiles erased by the most recent move, to animate them sliding off before the rebuild.
// These are the trailing tiles of (previousWord + appendedLetter) that the erasure removed.
let erasedTiles: number[] = [];
let eraseAnimTimer: number | undefined;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ---- config ----
function readConfig(seed: number): GameConfig {
  return {
    k: +($('kRange') as HTMLInputElement).value,
    d: +($('dRange') as HTMLInputElement).value,
    rounds: +($('roundsRange') as HTMLInputElement).value,
    rule: ($('eraseSel') as HTMLSelectElement).value as EraseRule,
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
  window.clearTimeout(eraseAnimTimer);
  erasedTiles = [];
  const seed = seedCounter++;
  rng = makeRng(0x9e3779b1 ^ (seed * 2654435761));
  state = newGame(readConfig(seed));
  history = [];
  if (state.config.humanRole !== 'none') running = false;
  render();
  scheduleAi();
}

function doMove(letter: number): void {
  if (isOver(state)) return;
  const next = applyMove(state, letter);
  if (next === state) return;
  // The new word is always a prefix of (old word + appended letter); anything past it slid off.
  const beforeErase = state.word.concat(letter);
  erasedTiles = next.lastErased > 0 ? beforeErase.slice(next.word.length) : [];
  history.push(state);
  state = next;
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

function onLetter(letter: number): void {
  if (!isHumanTurn()) return;
  doMove(letter);
}

function undo(): void {
  if (!history.length) return;
  window.clearTimeout(eraseAnimTimer);
  erasedTiles = [];
  state = history.pop()!;
  const r = state.config.humanRole;
  if (r === 'R' || r === 'B') {
    while (history.length && !humanControls(state.turn) && !isOver(state)) state = history.pop()!;
  }
  running = false;
  render();
}

// ---- rendering ----
function renderWord(): void {
  const wrap = $('word');
  wrap.innerHTML = '';
  const n = state.word.length;
  state.word.forEach((c, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (i === n - 1 && n > 0 && !isOver(state) ? ' fresh' : '');
    tile.textContent = LETTERS[c] ?? String(c);
    wrap.appendChild(tile);
  });
  // Signature visual: the just-erased tiles slide off the end before vanishing.
  if (erasedTiles.length) {
    const slid = erasedTiles;
    erasedTiles = [];
    for (const c of slid) {
      const tile = document.createElement('div');
      tile.className = 'tile erasing';
      tile.textContent = LETTERS[c] ?? String(c);
      wrap.appendChild(tile);
    }
    // Remove the ghosts once the slide-off animation has played, then redraw the clean word.
    window.clearTimeout(eraseAnimTimer);
    eraseAnimTimer = window.setTimeout(renderWord, 240);
  }
}

function renderPalette(): void {
  const pal = $('palette');
  pal.innerHTML = '';
  const clickable = isHumanTurn();
  const moves = new Set(legalMoves(state));
  for (let c = 0; c < state.config.k; c++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = LETTERS[c] ?? String(c);
    btn.dataset.letter = String(c);
    btn.disabled = !clickable || !moves.has(c);
    pal.appendChild(btn);
  }
}

function renderChart(): void {
  const chart = $('chart');
  const series = [0, ...history.map((s) => s.word.length), state.word.length];
  // de-dup the very first 0 if no moves yet
  const data = series.length > 1 ? series.slice(1) : series;
  const max = Math.max(state.config.d, 1, ...data);
  chart.innerHTML = '';
  for (const len of data) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.max(2, (len / max) * 100)}%`;
    bar.title = String(len);
    chart.appendChild(bar);
  }
}

function flashErase(): void {
  const badge = $('eraseBadge');
  if (state.lastErased > 0) {
    badge.textContent = `−${state.lastErased}`;
    badge.hidden = false;
    // restart the CSS fade animation
    badge.style.animation = 'none';
    void badge.offsetWidth;
    badge.style.animation = '';
  } else {
    badge.hidden = true;
  }
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);
  const len = state.word.length;

  renderWord();
  renderPalette();
  renderChart();
  flashErase();

  // status pill
  const pill = $('turnPill');
  if (over) {
    pill.textContent = `${state.winner === GROWER ? 'Red' : 'Blue'} wins`;
    pill.className = 'turn-pill done';
  } else {
    pill.textContent = state.turn === GROWER ? 'Red to move' : 'Blue to move';
    pill.className = `turn-pill ${state.turn === GROWER ? '' : 'blue'}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // length meter
  $('meterFill').style.width = `${Math.min(len / cfg.d, 1) * 100}%`;
  $('meterValue').textContent = `${len} / ${cfg.d}`;

  // move counter
  $('rounds').textContent = `move ${state.round} / ${cfg.rounds}`;

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (state.winner === GROWER) {
      banner.className = 'banner red';
      banner.textContent = `Red (Grower) wins — the word reached length ${cfg.d}! 🎉`;
    } else {
      banner.className = 'banner blue';
      banner.textContent = `Blue (Shrinker) wins — ${cfg.rounds} moves up, the word stayed at ${len} < ${cfg.d}.`;
    }
  } else {
    banner.hidden = true;
  }

  // buttons
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
  const k = ($('kRange') as HTMLInputElement).value;
  const d = ($('dRange') as HTMLInputElement).value;
  const rounds = ($('roundsRange') as HTMLInputElement).value;
  $('kLabel').textContent = k;
  $('dLabel').textContent = d;
  $('roundsLabel').textContent = rounds;
  $('howtoD').textContent = d;
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

  $('palette').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-letter]');
    if (t) onLetter(+(t.getAttribute('data-letter') as string));
  });

  for (const id of ['kRange', 'dRange', 'roundsRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('eraseSel').addEventListener('change', startNewGame);
  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiR', 'aiB']) $(id).addEventListener('change', startNewGame);

  $('newBtn').addEventListener('click', startNewGame);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => { running = !running; render(); scheduleAi(); });

  syncLabels();
  syncRoleVisibility();
  startNewGame();

  return {
    destroy() {
      window.clearTimeout(aiTimer);
      window.clearTimeout(eraseAnimTimer);
    },
  };
}
