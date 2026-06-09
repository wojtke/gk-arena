// UI controller for VdW Online. POINTER clicks a caret (gap); PAINTER clicks a colour in the palette
// to paint a token there. A Targets toggle switches between:
//   diagonal     — one shared AP length k (plain online VdW); a single meter.
//   off-diagonal — each colour has its own target k[i] (one slider per colour); per-colour mini-meters.
// When a winning AP forms, its tokens pulse in the offending colour. Logic lives in the engine; this
// file only renders and wires events.
//
// Role select mapping: "P" = human is POINTER (first/forcing side), "A" = human is PAINTER,
// "both" = hotseat, "none" = watch AI vs AI. aiP = Pointer level, aiA = Painter level.

import {
  AILevel, GameConfig, GameState, HumanRole, Role, Color, PAINTER, POINTER,
  newGame, applyMove, legalMoves, isOver, goalText, makeRng, aiMove, currentPlayer,
  defaultK, isDiagonal, longestApOfColor,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// up to 6 distinct colours (uses shared palette vars where sensible)
const COLORS = ['#e5484d', '#2a6fdb', '#2a9d6b', '#e0a325', '#6e56cf', '#d6409f'];
const COLOR_NAMES = ['Red', 'Blue', 'Green', 'Amber', 'Violet', 'Pink'];

const MAX_COLORS = 6;

// ---- slot markup ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="rRange">Colours r <span class="hint-num" id="rLabel">2</span></label>
      <input type="range" id="rRange" min="2" max="${MAX_COLORS}" value="2" />
    </div>
    <div class="field">
      <label for="targetsSel">Targets</label>
      <select id="targetsSel">
        <option value="diagonal" selected>Diagonal (one k)</option>
        <option value="offdiagonal">Off-diagonal (per colour)</option>
      </select>
    </div>
    <div class="field" id="kField">
      <label for="kRange">AP length k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="2" max="6" value="3" />
    </div>
    <div class="field span2" id="kvecField" hidden>
      <label>Per-colour target length k<sub>i</sub></label>
      <div class="kvec" id="kvec"></div>
    </div>
    <div class="field span2">
      <label for="nRange">Token budget n <span class="hint-num" id="nLabel">18</span></label>
      <input type="range" id="nRange" min="3" max="30" value="18" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="P" selected>Pointer (forcer)</option>
        <option value="A">Painter (avoider)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiPField">
      <label for="aiP">Pointer AI</label>
      <select id="aiP"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiAField">
      <label for="aiA">Painter AI</label>
      <select id="aiA"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
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
    <span class="turn-pill" id="turnPill">Pointer to move</span>
    <span class="goal" id="goalText"></span>
  </div>

  <div class="linebox">
    <div class="line" id="line"></div>
  </div>

  <div class="palette" id="palette"></div>

  <div class="meterrow" id="meterrow"></div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Pointer</b> clicks a <b>caret</b> (a gap) to choose where the next token goes.</li>
    <li><b class="red-text">Painter</b> then clicks a <b>colour</b> in the palette to paint a token into that gap.</li>
    <li>Token positions are the <b>line indices</b> — inserting a token <b>shifts</b> the indices of everything to its right.</li>
    <li><b class="blue-text">Pointer</b> wins the instant a <b>monochromatic arithmetic progression</b> reaches its target — length <b id="howtoK">3</b> for every colour (diagonal), or each colour's own k<sub>i</sub> (off-diagonal).</li>
    <li><b class="red-text">Painter</b> wins by reaching <b id="howtoN">18</b> tokens with no such progression.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Van der Waerden's theorem.</b> For any r, k there is a number W(r;k) such that every
    r-colouring of {1…W} contains a monochromatic k-term arithmetic progression. So with enough tokens
    a progression is unavoidable; <b>W(2;3)=9</b>, W(3;3)=27, W(2;4)=35. Keep n below W so the
    Painter has a fighting chance and the knife-edge is visible by sliding n.</p>
  <p><b>Off-diagonal targets.</b> Give each colour its own threshold and you get the off-diagonal
    numbers <code>W(k₀,…,k_{r-1})</code> (a comma list = a threshold vector): <b>W(3,4)=18</b>,
    <b>W(3,5)=22</b>, <b>W(4,5)=55</b> (Chvátal). Equal thresholds recover the diagonal case, so this
    game is a strict generalisation — set all k<sub>i</sub> equal and it <i>is</i> plain online VdW.</p>
  <p><b>Online / adaptive.</b> Here the board is revealed adaptively (the Pointer chooses each slot),
    so the clean Erdős–Selfridge potential of the fixed-board game does <i>not</i> transfer. The
    "Strong" AI's potential Φ = Σ r<sup>−(k−filled)</sup> over live APs is a <b>heuristic guide</b>,
    not a theorem. The open question is the <b>forcing length</b>: how many moves the Pointer needs
    against best play, both diagonal and off-diagonal.</p>
  <p class="muted small">By analogy with every other avoidance game, the avoider (Painter / player 2)
    wins at length n — the rule implemented here.</p>
  <p class="muted small">Reference: van der Waerden, <i>Beweis einer Baudetschen Vermutung</i> (1927).</p>
</section>`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: number | null = null; // a gap (point phase) or a colour (paint phase) to suggest
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
let kVec: number[] = defaultK(2); // off-diagonal vector (used when targets = offdiagonal)
const AI_DELAY = 430;

// ---- config helpers ----
function targetsMode(): 'diagonal' | 'offdiagonal' {
  return ($('targetsSel') as HTMLSelectElement).value === 'offdiagonal' ? 'offdiagonal' : 'diagonal';
}

/** The effective per-colour target vector for the current Targets mode. */
function currentK(r: number): number[] {
  if (targetsMode() === 'offdiagonal') return kVec.slice(0, r);
  const k = +($('kRange') as HTMLInputElement).value;
  return Array.from({ length: r }, () => k);
}

// ---- config ----
function readConfig(seed: number): GameConfig {
  const r = +($('rRange') as HTMLInputElement).value;
  const k = currentK(r);
  // Lift n to at least the largest target so the game can't end trivially.
  const n = Math.max(+($('nRange') as HTMLInputElement).value, ...k);
  const roleVal = ($('roleSel') as HTMLSelectElement).value;
  const humanRole: HumanRole =
    roleVal === 'P' ? POINTER : roleVal === 'A' ? PAINTER : (roleVal as HumanRole);
  return {
    r, k, n, humanRole,
    aiLevel: {
      P: +($('aiP') as HTMLSelectElement).value as AILevel,
      A: +($('aiA') as HTMLSelectElement).value as AILevel,
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
function onColor(c: number): void {
  if (!isHumanTurn() || state.phase !== 'paint') return;
  if (!legalMoves(state).includes(c)) return;
  doMove(c);
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
  if (r === POINTER || r === PAINTER) {
    while (history.length && !humanControls(currentPlayer(state)) && !isOver(state)) state = history.pop()!;
  }
  hint = null;
  running = false;
  render();
}

// ---- rendering ----
/** Build the token + caret row. In point phase the carets are clickable; paint phase shows the gap. */
function renderLine(): void {
  const lineEl = $('line');
  lineEl.innerHTML = '';
  const s = state;
  const over = isOver(s);

  const witnessIdx = new Set<number>(over && s.witness ? s.witness.idx : []);
  const witnessColor = over && s.witness ? s.witness.color : -1;

  if (s.line.length === 0) {
    // empty start: one full-width, centred, click-anywhere caret carrying the prompt
    const c = makeCaret(0);
    c.classList.add('empty');
    const hintSpan = document.createElement('span');
    hintSpan.className = 'empty-hint';
    hintSpan.textContent = s.phase === 'point'
      ? 'Pointer: click anywhere here to point at the first gap.'
      : 'Painter: pick a colour.';
    c.appendChild(hintSpan);
    lineEl.appendChild(c);
    return;
  }

  // Always render a caret in every gap so the row never reflows ("crams") when the phase changes or
  // it's the AI's turn; makeCaret marks each pickable / chosen / disabled.
  for (let i = 0; i <= s.line.length; i++) {
    lineEl.appendChild(makeCaret(i));
    if (i < s.line.length) {
      lineEl.appendChild(makeTile(s.line[i], i, witnessIdx.has(i) && s.line[i] === witnessColor));
    }
  }
}

function makeCaret(gap: number): HTMLElement {
  const pickable = state.phase === 'point' && !isOver(state) && isHumanTurn();
  const chosen = state.phase === 'paint'
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

function makeTile(color: Color, idx: number, inWitness: boolean): HTMLElement {
  const el = document.createElement('span');
  el.className = 'tile' + (inWitness ? ' witness' : '');
  el.style.setProperty('--chip', COLORS[color % COLORS.length]);
  const dot = document.createElement('span');
  dot.className = 'chip';
  el.appendChild(dot);
  const lab = document.createElement('span');
  lab.className = 'idx';
  lab.textContent = String(idx + 1);
  el.appendChild(lab);
  return el;
}

function renderPalette(): void {
  const pal = $('palette');
  pal.innerHTML = '';
  const s = state;
  const over = isOver(s);
  const active = s.phase === 'paint' && !over && (humanControls(PAINTER) || s.config.humanRole === 'none');
  const legal = new Set(legalMoves(s));

  for (let c = 0; c < s.config.r; c++) {
    pal.appendChild(makePaletteBtn(c, active && legal.has(c)));
  }

  const note = document.createElement('span');
  note.className = 'palette-hint';
  if (over) note.textContent = '';
  else if (s.phase === 'point') note.textContent = 'Pointer points at a gap first.';
  else note.textContent = 'Paint a colour into the chosen gap.';
  pal.appendChild(note);
}

function makePaletteBtn(color: number, enabled: boolean): HTMLElement {
  const b = document.createElement('button');
  b.dataset.color = String(color);
  b.disabled = !enabled;
  b.style.setProperty('--chip', COLORS[color % COLORS.length]);
  if (hint !== null && state.phase === 'paint' && hint === color && enabled) {
    b.classList.add('suggested');
  }
  const dot = document.createElement('span');
  dot.className = 'chip';
  b.appendChild(dot);
  const lab = document.createElement('span');
  lab.className = 'pal-label';
  // diagonal: just the colour name; off-diagonal: name + its own k.
  lab.textContent = isDiagonal(state.config.k)
    ? COLOR_NAMES[color % COLOR_NAMES.length]
    : `${COLOR_NAMES[color % COLOR_NAMES.length]} (k=${state.config.k[color]})`;
  b.appendChild(lab);
  return b;
}

/** Diagonal: one length meter. Off-diagonal: a mini-meter per colour + a length meter. */
function renderMeters(): void {
  const row = $('meterrow');
  row.innerHTML = '';
  const s = state;

  if (!isDiagonal(s.config.k)) {
    for (let c = 0; c < s.config.r; c++) {
      const ki = s.config.k[c];
      const run = longestApOfColor(s.line, c);
      const meter = document.createElement('div');
      meter.className = 'meter mini';
      meter.style.setProperty('--chip', COLORS[c % COLORS.length]);
      const label = document.createElement('div');
      label.className = 'meter-label';
      label.textContent = `${COLOR_NAMES[c % COLOR_NAMES.length]} run / k`;
      const track = document.createElement('div');
      track.className = 'meter-track';
      const fill = document.createElement('div');
      fill.className = 'meter-fill';
      fill.style.width = `${Math.min(run / ki, 1) * 100}%`;
      track.appendChild(fill);
      const value = document.createElement('div');
      value.className = 'meter-value';
      value.textContent = `${run} / ${ki}`;
      meter.appendChild(label);
      meter.appendChild(track);
      meter.appendChild(value);
      row.appendChild(meter);
    }
  }

  // overall length toward n (single meter in diagonal mode; trailing meter off-diagonal)
  const lenMeter = document.createElement('div');
  lenMeter.className = 'meter';
  const label = document.createElement('div');
  label.className = 'meter-label';
  label.id = 'meterLabel';
  label.textContent = 'Tokens placed toward budget';
  const track = document.createElement('div');
  track.className = 'meter-track';
  const fill = document.createElement('div');
  fill.className = 'meter-fill len';
  fill.id = 'meterFill';
  fill.style.width = `${s.config.n ? Math.min(s.line.length / s.config.n, 1) * 100 : 0}%`;
  track.appendChild(fill);
  const value = document.createElement('div');
  value.className = 'meter-value len';
  value.id = 'meterValue';
  value.textContent = `${s.line.length} / ${s.config.n}`;
  lenMeter.appendChild(label);
  lenMeter.appendChild(track);
  lenMeter.appendChild(value);
  row.appendChild(lenMeter);
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderLine();
  renderPalette();
  renderMeters();

  const pill = $('turnPill');
  if (over) {
    pill.textContent = `${state.winner === POINTER ? 'Pointer' : 'Painter'} wins`;
    pill.className = 'turn-pill done';
  } else {
    const p = currentPlayer(state);
    pill.textContent = p === POINTER ? 'Pointer to point' : 'Painter to colour';
    pill.className = `turn-pill ${p === POINTER ? 'blue' : ''}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (state.winner === POINTER) {
      banner.className = 'banner blue';
      const w = state.witness;
      if (w && isDiagonal(cfg.k)) {
        banner.textContent = `Pointer wins — a monochromatic ${cfg.k[0]}-term progression appeared at indices ${w.idx.map(i => i + 1).join(', ')}. The witnessing tokens pulse.`;
      } else if (w) {
        banner.textContent = `Pointer wins — ${COLOR_NAMES[w.color % COLOR_NAMES.length]} made a ${cfg.k[w.color]}-AP at indices ${w.idx.map(i => i + 1).join(', ')}. The witnessing tokens pulse.`;
      } else {
        banner.textContent = 'Pointer wins — a monochromatic progression appeared.';
      }
    } else {
      banner.className = 'banner red';
      banner.textContent = isDiagonal(cfg.k)
        ? `Painter wins — reached ${cfg.n} tokens with no monochromatic ${cfg.k[0]}-AP. 🎉`
        : `Painter wins — reached length ${cfg.n} with no colour hitting its target. 🎉`;
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

// ---- per-colour k controls (off-diagonal mode) ----
/** Build one slider per colour (the off-diagonal signature). Rebuilt when r changes. */
function buildKControls(): void {
  const r = +($('rRange') as HTMLInputElement).value;
  // grow/shrink kVec to r, seeding new colours from the default vector
  const def = defaultK(r);
  const next: number[] = [];
  for (let c = 0; c < r; c++) next.push(kVec[c] ?? def[c] ?? 3);
  kVec = next;

  const host = $('kvec');
  host.innerHTML = '';
  for (let c = 0; c < r; c++) {
    const wrap = document.createElement('div');
    wrap.className = 'kcell';
    wrap.style.setProperty('--chip', COLORS[c % COLORS.length]);
    const label = document.createElement('label');
    label.htmlFor = `kRange${c}`;
    label.innerHTML = `${COLOR_NAMES[c % COLOR_NAMES.length]} k <span class="hint-num" id="kLabel${c}">${kVec[c]}</span>`;
    const input = document.createElement('input');
    input.type = 'range';
    input.id = `kRange${c}`;
    input.min = '2';
    input.max = '6';
    input.value = String(kVec[c]);
    input.dataset.color = String(c);
    wrap.appendChild(label);
    wrap.appendChild(input);
    host.appendChild(wrap);
  }
}

function syncKLabels(): void {
  for (let c = 0; c < kVec.length; c++) {
    const lab = document.getElementById(`kLabel${c}`);
    if (lab) lab.textContent = String(kVec[c]);
  }
}

/** Largest active target, for the n floor. */
function maxTarget(): number {
  const r = +($('rRange') as HTMLInputElement).value;
  return Math.max(...currentK(r));
}

function syncLabels(): void {
  const r = ($('rRange') as HTMLInputElement).value;
  const nEl = $('nRange') as HTMLInputElement;
  const floor = maxTarget();
  // keep n >= max target by lifting the slider floor
  nEl.min = String(floor);
  if (+nEl.value < floor) nEl.value = String(floor);
  $('rLabel').textContent = r;
  $('nLabel').textContent = nEl.value;
  $('howtoN').textContent = nEl.value;
  if (targetsMode() === 'diagonal') {
    const k = ($('kRange') as HTMLInputElement).value;
    $('kLabel').textContent = k;
    $('howtoK').textContent = k;
  } else {
    $('howtoK').textContent = String(floor);
  }
}

/** Show the diagonal k slider OR the off-diagonal per-colour controls. */
function syncTargetsVisibility(): void {
  const off = targetsMode() === 'offdiagonal';
  ($('kField') as HTMLElement).hidden = off;
  ($('kvecField') as HTMLElement).hidden = !off;
  if (off) buildKControls();
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  $('aiPField').style.display = (role === 'A' || role === 'none') ? '' : 'none';
  $('aiAField').style.display = (role === 'P' || role === 'none') ? '' : 'none';
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  $('line').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-gap]') as HTMLElement | null;
    if (t) onCaret(+(t.dataset.gap as string));
  });
  $('palette').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-color]') as HTMLButtonElement | null;
    if (t && !t.disabled) onColor(+(t.dataset.color as string));
  });

  // r: rebuild off-diagonal controls (if shown), resync, start new game.
  $('rRange').addEventListener('input', () => { syncTargetsVisibility(); syncLabels(); });
  $('rRange').addEventListener('change', () => { syncTargetsVisibility(); syncLabels(); startNewGame(); });

  // Targets toggle: switch the visible controls and start a new game.
  $('targetsSel').addEventListener('change', () => { syncTargetsVisibility(); syncLabels(); startNewGame(); });

  // diagonal k slider
  $('kRange').addEventListener('input', syncLabels);
  $('kRange').addEventListener('change', () => { syncLabels(); startNewGame(); });

  // off-diagonal per-colour k sliders (rebuilt on r/targets change, so listen on the host)
  $('kvec').addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.dataset.color === undefined) return;
    kVec[+t.dataset.color] = +t.value;
    syncKLabels();
    syncLabels(); // k may raise the n floor
  });
  $('kvec').addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.dataset.color === undefined) return;
    kVec[+t.dataset.color] = +t.value;
    syncKLabels();
    syncLabels();
    startNewGame();
  });

  $('nRange').addEventListener('input', syncLabels);
  $('nRange').addEventListener('change', () => { syncLabels(); startNewGame(); });

  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiP', 'aiA']) $(id).addEventListener('change', startNewGame);

  $('newBtn').addEventListener('click', startNewGame);
  $('hintBtn').addEventListener('click', showHint);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => { running = !running; render(); scheduleAi(); });

  syncTargetsVisibility();
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
