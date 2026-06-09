// UI controller for Ramsey Words. CONSTRUCTOR (blue) clicks a caret (gap); AVOIDER (red) clicks a
// palette letter to insert there. A faint coloured underline under every length-l block shows χ of
// that block, so players can SEE the colouring as the word grows. On a Constructor win the two
// matching adjacent blocks pulse in their shared colour. Logic lives in the engine; this file only
// renders and wires events.
//
// Role select mapping: "R" = human is CONSTRUCTOR (first/forcing side), "B" = human is AVOIDER,
// "both" = hotseat, "none" = watch AI vs AI. aiR = Constructor level, aiB = Avoider level.

import {
  AILevel, AVOIDER, CONSTRUCTOR, GameConfig, GameState, HumanRole, Side,
  newGame, applyMove, legalMoves, isOver, goalText, makeRng, aiMove, currentPlayer,
  colorOf, gramIndex, getPreset, PRESETS,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
/** Up to 4 distinct block-colour hues for the underlines / pulse. */
const COLOR_HUES = ['#2a9d6b', '#e5a32a', '#6e56cf', '#e5484d'];

// ---- slot markup ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field">
      <label for="alphaRange">Alphabet |A| <span class="hint-num" id="alphaLabel">4</span></label>
      <input type="range" id="alphaRange" min="2" max="4" value="4" />
    </div>
    <div class="field">
      <label for="lRange">Block length l <span class="hint-num" id="lLabel">2</span></label>
      <input type="range" id="lRange" min="1" max="3" value="2" />
    </div>
    <div class="field">
      <label for="cRange">Colours c <span class="hint-num" id="cLabel">4</span></label>
      <input type="range" id="cRange" min="2" max="4" value="4" />
    </div>
    <div class="field">
      <label for="nRange">Target length n <span class="hint-num" id="nLabel">8</span></label>
      <input type="range" id="nRange" min="4" max="24" value="8" />
    </div>
    <div class="field span2">
      <label for="presetSel">Colouring χ</label>
      <select id="presetSel">
        <option value="">Random (seeded)</option>
      </select>
    </div>
    <div class="field">
      <label for="seedField">Seed <span class="hint-num" id="seedLabel">1</span></label>
      <input type="number" id="seedField" min="0" value="1" />
    </div>
    <div class="field">
      <label>&nbsp;</label>
      <button id="rerollBtn" class="btn">Reroll χ</button>
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Constructor (blue)</option>
        <option value="B">Avoider (red)</option>
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
      <div class="meter-value" id="meterValue">0 / 8</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card">
  <div id="legend" class="legend"></div>
</section>

<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Constructor (blue)</b> clicks a <b>caret</b> (a gap) to point at where the next letter goes.</li>
    <li><b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.</li>
    <li>Every length-<b id="howtoL">2</b> block has a fixed colour (the <b>underline</b> shows it). <b class="blue-text">Constructor</b> wins the instant two <b>adjacent</b> blocks share a colour.</li>
    <li><b class="red-text">Avoider</b> wins by reaching length <b id="howtoN">8</b> with no such monochromatic adjacent pair.</li>
    <li>On a Constructor win the two matching adjacent blocks <b>pulse</b> in their shared colour.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>A Ramsey-type colouring game on words.</b> A colouring <code>χ : Aˡ → {0…c-1}</code> is fixed
    in advance (random-from-seed or a preset). The Constructor tries to force two adjacent length-<i>l</i>
    blocks of equal colour; the Avoider dodges to length <i>n</i>.</p>
  <p><b>Forcing is conditional — not guaranteed.</b> Whether long words are <i>forced</i> to contain
    two same-coloured adjacent blocks <b>depends on (|A|, l, c)</b>. Counter-example: <code>l=1</code>,
    <code>c=|A|</code>, χ = identity makes "same-coloured adjacent blocks" mean "two equal adjacent
    letters", which <code>abab…</code> avoids forever — the Avoider survives every <i>n</i>. The game
    explores exactly the boundary between forceable and avoidable; termination is guaranteed only by the
    hard <i>n</i> cap, not by inevitability.</p>
  <p><b>The AI.</b> "Strong" is depth-limited alpha-beta (leaf eval = length minus near-miss pressure);
    "Solver" searches exactly on small instances (memoised on the word, since χ is immutable), falling
    back to Strong when the tree is too large.</p>
  <p class="muted small">The colour count is written <code>c</code> here. The survivable-<i>n</i>
    distribution over random χ is a genuine reportable finding.</p>
  <p class="muted small">Reference: Ramsey, <i>On a problem of formal logic</i> (1930).</p>
</section>`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: number | null = null;
let rng = makeRng(1);
let runSeed = 1; // re-seeds AI tie-breaking each new game
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// ---- config ----
function readConfig(): GameConfig {
  let alpha = +($('alphaRange') as HTMLInputElement).value;
  let l = +($('lRange') as HTMLInputElement).value;
  // enforce alpha^l <= 256 (defensive; ranges already cap at 4^3=64)
  while (Math.pow(alpha, l) > 256 && l > 1) l--;
  const c = +($('cRange') as HTMLInputElement).value;
  const n = +($('nRange') as HTMLInputElement).value;
  const seed = +($('seedField') as HTMLInputElement).value | 0;
  const preset = ($('presetSel') as HTMLSelectElement).value || undefined;
  const roleVal = ($('roleSel') as HTMLSelectElement).value;
  const humanRole: HumanRole =
    roleVal === 'R' ? CONSTRUCTOR : roleVal === 'B' ? AVOIDER : (roleVal as HumanRole);
  return {
    alpha, l, c, n, seed, preset, humanRole,
    aiLevel: {
      C: +($('aiR') as HTMLSelectElement).value as AILevel,
      A: +($('aiB') as HTMLSelectElement).value as AILevel,
    },
  };
}

function humanControls(turn: Side): boolean {
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
  runSeed = (runSeed + 1) | 0;
  rng = makeRng(0x9e3779b1 ^ (runSeed * 2654435761));
  state = newGame(readConfig());
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
/** Map of position -> 'mono' for the two pulsing witness blocks (each spans l tiles). */
function witnessTiles(): { set: Set<number>; color: number } | null {
  if (!isOver(state) || !state.witness) return null;
  const { i, color } = state.witness;
  const l = state.config.l;
  const set = new Set<number>();
  for (let j = 0; j < 2 * l; j++) set.add(i + j);
  return { set, color };
}

function renderWord(): void {
  const word = $('word');
  word.innerHTML = '';
  const s = state;
  const over = isOver(s);
  const { alpha, l, c } = s.config;
  const wit = witnessTiles();

  if (s.word.length === 0) {
    if (s.phase === 'point' && !over) {
      const c0 = makeCaret(0);
      c0.classList.add('empty'); // wider, tile-tall click zone so the first gap is easy to see/hit
      word.appendChild(c0);
    }
    const hintSpan = document.createElement('span');
    hintSpan.className = 'empty-hint';
    hintSpan.textContent = s.phase === 'point'
      ? 'Constructor: click the caret to point at the first gap.'
      : 'Avoider: pick a letter to insert.';
    word.appendChild(hintSpan);
    return;
  }

  const showCarets = s.phase === 'point' && !over;
  for (let i = 0; i <= s.word.length; i++) {
    if (showCarets) word.appendChild(makeCaret(i));
    else if (s.phase === 'insert' && s.gap === i) word.appendChild(makeCaret(i, true));
    if (i < s.word.length) {
      // colour of the l-block STARTING at i (if it fits) — drives the faint underline
      let blockColor: number | null = null;
      if (i + l <= s.word.length) blockColor = colorOf(s.word, i, l, s.coloring, alpha);
      const pulse = wit?.set.has(i) ?? false;
      word.appendChild(makeTile(s.word[i], i, blockColor, c, pulse, wit?.color ?? null));
    }
  }
}

function makeCaret(gap: number, selected = false): HTMLElement {
  const showCarets = state.phase === 'point' && !isOver(state);
  const el = document.createElement('button');
  el.className = 'caret' + (selected ? ' sel' : '') + (showCarets ? '' : ' disabled');
  el.dataset.gap = String(gap);
  if (hint !== null && state.phase === 'point' && hint === gap) el.classList.add('sel');
  const bar = document.createElement('span');
  bar.className = 'bar';
  el.appendChild(bar);
  if (!showCarets) el.tabIndex = -1;
  return el;
}

function hueFor(color: number): string {
  return COLOR_HUES[color % COLOR_HUES.length];
}

function makeTile(
  sym: number, _idx: number, blockColor: number | null, _c: number,
  pulse: boolean, pulseColor: number | null,
): HTMLElement {
  const el = document.createElement('span');
  el.className = 'tile' + (pulse ? ' mono' : '');
  const val = document.createElement('span');
  val.className = 'val';
  val.textContent = LETTERS[sym];
  el.appendChild(val);
  // faint coloured underline showing χ of the l-block starting here
  if (blockColor !== null) {
    const u = document.createElement('span');
    u.className = 'blockline';
    u.style.background = hueFor(blockColor);
    el.appendChild(u);
  }
  if (pulse && pulseColor !== null) {
    el.style.setProperty('--mono-hue', hueFor(pulseColor));
  }
  return el;
}

function renderPalette(): void {
  const pal = $('palette');
  pal.innerHTML = '';
  const s = state;
  const over = isOver(s);
  const active = s.phase === 'insert' && !over && (humanControls(AVOIDER) || s.config.humanRole === 'none');
  const legal = new Set(legalMoves(s));

  for (let a = 0; a < s.config.alpha; a++) {
    pal.appendChild(makePaletteBtn(a, active && legal.has(a)));
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
  label.textContent = LETTERS[sym];
  b.appendChild(label);
  return b;
}

/** A small legend mapping a few example l-grams to their colour swatch. */
function renderLegend(): void {
  const el = $('legend');
  el.innerHTML = '';
  const s = state;
  const { alpha, l } = s.config;
  const total = Math.pow(alpha, l);
  const title = document.createElement('div');
  title.className = 'legend-title';
  title.textContent = 'Current colouring χ:';
  el.appendChild(title);
  const max = Math.min(total, 8);
  for (let idx = 0; idx < max; idx++) {
    // decode idx back to its l-gram (base alpha, MSB first)
    const gram: number[] = [];
    let rem = idx;
    for (let j = l - 1; j >= 0; j--) { gram[j] = rem % alpha; rem = Math.floor(rem / alpha); }
    const color = s.coloring[idx];
    const chip = document.createElement('span');
    chip.className = 'legend-chip';
    const sw = document.createElement('span');
    sw.className = 'legend-sw';
    sw.style.background = hueFor(color);
    chip.appendChild(sw);
    const txt = document.createElement('span');
    txt.textContent = gram.map(x => LETTERS[x]).join('');
    chip.appendChild(txt);
    el.appendChild(chip);
  }
  if (total > max) {
    const more = document.createElement('span');
    more.className = 'legend-more';
    more.textContent = `+${total - max} more`;
    el.appendChild(more);
  }
  void gramIndex; // keep import used; gramIndex is part of the public engine surface
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderWord();
  renderPalette();
  renderLegend();

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
      const where = w ? ` (blocks at positions ${w.i + 1}–${w.i + cfg.l} and ${w.i + cfg.l + 1}–${w.i + 2 * cfg.l}, colour ${w.color}).` : '.';
      banner.textContent = `Constructor wins — two adjacent same-coloured blocks appeared${where}`;
    } else {
      banner.className = 'banner red';
      banner.textContent = `Avoider wins — reached length ${cfg.n} with no monochromatic adjacent pair. 🎉`;
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
  // keep alpha^l <= 256: if l too big for alpha, clamp the l slider
  const alphaEl = $('alphaRange') as HTMLInputElement;
  const lEl = $('lRange') as HTMLInputElement;
  let alpha = +alphaEl.value;
  let l = +lEl.value;
  while (Math.pow(alpha, l) > 256 && l > 1) { l--; lEl.value = String(l); }
  $('alphaLabel').textContent = alphaEl.value;
  $('lLabel').textContent = lEl.value;
  $('cLabel').textContent = ($('cRange') as HTMLInputElement).value;
  $('nLabel').textContent = ($('nRange') as HTMLInputElement).value;
  $('seedLabel').textContent = ($('seedField') as HTMLInputElement).value;
  $('howtoL').textContent = lEl.value;
  $('howtoN').textContent = ($('nRange') as HTMLInputElement).value;
}

function syncPreset(): void {
  // selecting a preset snaps alpha/l/c to the preset's shape so χ actually applies
  const sel = ($('presetSel') as HTMLSelectElement).value;
  const p = sel ? getPreset(sel) : undefined;
  if (p) {
    ($('alphaRange') as HTMLInputElement).value = String(p.alpha);
    ($('lRange') as HTMLInputElement).value = String(p.l);
    ($('cRange') as HTMLInputElement).value = String(p.c);
    syncLabels();
  }
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  $('aiRField').style.display = (role === 'B' || role === 'none') ? '' : 'none';
  $('aiBField').style.display = (role === 'R' || role === 'none') ? '' : 'none';
}

/** The preset selected on first load: the curated two-sided contest (see engine/coloring.ts). */
const DEFAULT_PRESET = 'contest';

function populatePresets(): void {
  const sel = $('presetSel') as HTMLSelectElement;
  for (const p of PRESETS) {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.label;
    sel.appendChild(opt);
  }
  // Ship the contested curated χ as the default χ so first load is a genuine contest, not a trivially
  // decided random colouring. syncPreset() (called in mount) snaps |A|/l/c to the preset's shape.
  if (getPreset(DEFAULT_PRESET)) sel.value = DEFAULT_PRESET;
}

function reroll(): void {
  // a fresh random colouring: clear any preset and bump the seed
  ($('presetSel') as HTMLSelectElement).value = '';
  const seedEl = $('seedField') as HTMLInputElement;
  seedEl.value = String(((+seedEl.value | 0) + 1) % 1_000_000);
  syncLabels();
  startNewGame();
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  populatePresets();

  $('word').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-gap]') as HTMLElement | null;
    if (t) onCaret(+(t.dataset.gap as string));
  });
  $('palette').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-sym]') as HTMLButtonElement | null;
    if (t && !t.disabled) onLetter(+(t.dataset.sym as string));
  });

  for (const id of ['alphaRange', 'lRange', 'cRange', 'nRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('seedField').addEventListener('input', syncLabels);
  $('seedField').addEventListener('change', () => { syncLabels(); startNewGame(); });
  $('presetSel').addEventListener('change', () => { syncPreset(); startNewGame(); });
  $('rerollBtn').addEventListener('click', reroll);
  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiR', 'aiB']) $(id).addEventListener('change', startNewGame);

  $('newBtn').addEventListener('click', startNewGame);
  $('hintBtn').addEventListener('click', showHint);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => { running = !running; render(); scheduleAi(); });

  syncPreset(); // snap |A|/l/c to the default contest preset selected in populatePresets()
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
