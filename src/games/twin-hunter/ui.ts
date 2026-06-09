// UI controller for Twin Hunter. FORCER (blue) clicks a caret (gap); AVOIDER (red) clicks a palette
// symbol to insert there. When a tight twin forms, the two interleaved copies are painted in two
// colours. Logic lives in the engine; this file only renders and wires events.
//
// Role select mapping: "R" = human is FORCER (the first/forcing side), "B" = human is AVOIDER,
// "both" = hotseat, "none" = watch AI vs AI. aiR = Forcer level, aiB = Avoider level.

import {
  AILevel, AVOIDER, FORCER, GameConfig, GameState, HumanRole, Role, Variant,
  newGame, applyMove, legalMoves, isOver, goalText, makeRng, aiMove, currentPlayer, defaultMinBlock,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// ---- slot markup (re-grouped from the source index.html) ----
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field span2">
      <label for="variantSel">Variant</label>
      <select id="variantSel">
        <option value="words" selected>Words — equal copies (k-letter alphabet)</option>
        <option value="perm">Permutations — order-isomorphic copies (1..m)</option>
      </select>
    </div>
    <div class="field" id="kField">
      <label for="kRange">Alphabet k <span class="hint-num" id="kLabel">3</span></label>
      <input type="range" id="kRange" min="2" max="6" value="3" />
    </div>
    <div class="field">
      <label for="nRange"><span id="nName">Target length n</span> <span class="hint-num" id="nLabel">12</span></label>
      <input type="range" id="nRange" min="4" max="20" value="12" />
    </div>
    <div class="field">
      <label for="minBlockRange">Min block <span class="hint-num" id="minBlockLabel">1</span></label>
      <input type="range" id="minBlockRange" min="1" max="3" value="1" />
    </div>
    <div class="field">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Forcer (blue)</option>
        <option value="B">Avoider (red)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Forcer AI</label>
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
      <div class="meter-value" id="meterValue">0 / 12</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list">
    <li><b class="blue-text">Forcer (blue)</b> clicks a <b>caret</b> (a gap) to point at where the next symbol goes.</li>
    <li id="howtoInsert"><b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.</li>
    <li><b class="blue-text">Forcer</b> wins the instant a <b>tight twin</b> (a shuffle square) appears anywhere in the sequence.</li>
    <li id="howtoGoal"><b class="red-text">Avoider</b> wins by reaching length <b id="howtoN">12</b> with no tight twin.</li>
    <li>When a tight twin forms, its two interleaved copies are painted <span class="twinA-text">copy A</span> and <span class="twinB-text">copy B</span> so you can see the shuffle.</li>
  </ol>
</section>

<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>Twins vs squares vs shuffle squares.</b> <i>Twins</i> are two disjoint subsequences
    that are equal (words) or <i>order-isomorphic</i> (permutations — e.g. <code>586</code> and
    <code>397</code> both reduce to the pattern <code>132</code>). <i>Tight twins</i> are twins
    whose positions together form a contiguous block — a <b>shuffle square</b>. So tight twins
    generalise ordinary squares <code>XX</code>: <code>aabb</code> is a shuffle square (split
    into positions {0,2}=<code>ab</code> and {1,3}=<code>ab</code>) even though it is not a
    square.</p>
  <p><b>The headline: NP-hardness.</b> Recognising a shuffle square is <b>NP-hard — even on a
    binary alphabet</b> (Buss &amp; Soltys 2014, <i>Unshuffling a Square is NP-Hard</i>;
    Bulteau &amp; Vialette 2019). The avoidance detector embeds an NP-hard subproblem, so the
    computer opponent is genuinely, citably hard — we keep sequences game-sized.</p>
  <p><b>The AI.</b> "Strong" is depth-limited alpha-beta; "Solver" searches exactly on small
    instances (memoised), falling back to Strong when the tree is too large.</p>
  <p class="muted small">The avoider's guaranteed length per alphabet/interval size is not pinned
    down in the literature, so the threshold tables here are computed from scratch.</p>
  <p class="muted small">References: Grytczuk, Pawlik &amp; Ruciński, <i>Shuffle squares and ordered
    nest-free graphs</i> (2025),
    <a href="https://arxiv.org/abs/2503.22043" target="_blank" rel="noopener">arXiv:2503.22043</a>;
    Dudek, Grytczuk &amp; Ruciński, <i>Long twins in random words</i> (2023),
    <a href="https://arxiv.org/abs/2112.14197" target="_blank" rel="noopener">arXiv:2112.14197</a>.</p>
</section>`;

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let hint: number | null = null; // a gap (point phase) or a symbol (insert phase) to suggest
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// ---- config ----
function readConfig(seed: number): GameConfig {
  const variant = ($('variantSel') as HTMLSelectElement).value as Variant;
  const n = +($('nRange') as HTMLInputElement).value;
  const k = variant === 'words' ? +($('kRange') as HTMLInputElement).value : n;
  const minBlock = +($('minBlockRange') as HTMLInputElement).value;
  // roleSel "R" => human FORCER, "B" => human AVOIDER
  const roleVal = ($('roleSel') as HTMLSelectElement).value;
  const humanRole: HumanRole =
    roleVal === 'R' ? FORCER : roleVal === 'B' ? AVOIDER : (roleVal as HumanRole);
  return {
    variant, k, n, minBlock, humanRole,
    aiLevel: {
      FORCER: +($('aiR') as HTMLSelectElement).value as AILevel,
      AVOIDER: +($('aiB') as HTMLSelectElement).value as AILevel,
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
function onSymbol(sym: number): void {
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
  if (r === FORCER || r === AVOIDER) {
    while (history.length && !humanControls(currentPlayer(state)) && !isOver(state)) state = history.pop()!;
  }
  hint = null;
  running = false;
  render();
}

// ---- rendering ----
function symbolText(sym: number, variant: Variant): string {
  return variant === 'words' ? LETTERS[sym] : String(sym);
}

/** Build the tile + caret row. In point phase the carets are clickable; insert phase shows the gap. */
function renderWord(): void {
  const word = $('word');
  word.innerHTML = '';
  const s = state;
  const over = isOver(s);
  const variant = s.config.variant;

  // tile colour map from the witness (two-colour reveal)
  const colorOf = new Map<number, 'twinA' | 'twinB'>();
  if (over && s.witness) {
    for (const i of s.witness.a) colorOf.set(i, 'twinA');
    for (const i of s.witness.b) colorOf.set(i, 'twinB');
  }

  // for perm value bars, scale by current max value present (n)
  const maxVal = Math.max(1, s.config.n);

  if (s.seq.length === 0) {
    if (s.phase === 'point' && !over) {
      // single caret at gap 0
      word.appendChild(makeCaret(0));
    }
    const hintSpan = document.createElement('span');
    hintSpan.className = 'empty-hint';
    hintSpan.textContent = s.phase === 'point'
      ? 'Forcer: click the caret to point at the first gap.'
      : 'Avoider: pick a symbol to insert.';
    word.appendChild(hintSpan);
    return;
  }

  const showCarets = s.phase === 'point' && !over;
  for (let i = 0; i <= s.seq.length; i++) {
    if (showCarets) word.appendChild(makeCaret(i));
    else if (s.phase === 'insert' && s.gap === i) word.appendChild(makeCaret(i, true)); // selected gap
    if (i < s.seq.length) word.appendChild(makeTile(s.seq[i], i, variant, maxVal, colorOf.get(i)));
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

function makeTile(sym: number, idx: number, variant: Variant, maxVal: number, twin?: 'twinA' | 'twinB'): HTMLElement {
  const el = document.createElement('span');
  el.className = 'tile' + (twin ? ' ' + twin : '');
  if (variant === 'perm') {
    const bar = document.createElement('span');
    bar.className = 'valbar';
    bar.style.height = `${Math.round((sym / maxVal) * 100)}%`;
    el.appendChild(bar);
  }
  const val = document.createElement('span');
  val.className = 'val';
  val.textContent = symbolText(sym, variant);
  el.appendChild(val);
  // mark the most recently inserted tile
  return el;
}

function renderPalette(): void {
  const pal = $('palette');
  pal.innerHTML = '';
  const s = state;
  const over = isOver(s);
  const variant = s.config.variant;
  const active = s.phase === 'insert' && !over && (humanControls(AVOIDER) || s.config.humanRole === 'none');
  const legal = new Set(legalMoves(s));

  if (variant === 'words') {
    for (let c = 0; c < s.config.k; c++) {
      pal.appendChild(makePaletteBtn(c, variant, active && legal.has(c), s.config.n));
    }
  } else {
    // perm: show all 1..m; disable used numbers
    for (let v = 1; v <= s.config.n; v++) {
      pal.appendChild(makePaletteBtn(v, variant, active && legal.has(v), s.config.n));
    }
  }

  const note = document.createElement('span');
  note.className = 'palette-hint';
  if (over) note.textContent = '';
  else if (s.phase === 'point') note.textContent = 'Forcer points at a gap first.';
  else note.textContent = variant === 'perm' ? 'Insert an unused number.' : 'Insert a letter.';
  pal.appendChild(note);
}

function makePaletteBtn(sym: number, variant: Variant, enabled: boolean, maxVal: number): HTMLElement {
  const b = document.createElement('button');
  b.dataset.sym = String(sym);
  b.disabled = !enabled;
  if (hint !== null && state.phase === 'insert' && hint === sym && enabled) {
    b.style.borderColor = 'var(--violet)';
    b.style.boxShadow = '0 0 0 2px rgba(110,86,207,.25)';
  }
  if (variant === 'perm') {
    const bar = document.createElement('span');
    bar.className = 'valbar';
    bar.style.height = `${Math.round((sym / maxVal) * 100)}%`;
    b.appendChild(bar);
  }
  const label = document.createElement('span');
  label.style.position = 'relative';
  label.textContent = symbolText(sym, variant);
  b.appendChild(label);
  return b;
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  renderWord();
  renderPalette();

  // status pill
  const pill = $('turnPill');
  if (over) {
    pill.textContent = `${state.winner === FORCER ? 'Forcer (blue)' : 'Avoider (red)'} wins`;
    pill.className = 'turn-pill done';
  } else {
    const p = currentPlayer(state);
    pill.textContent = p === FORCER ? 'Forcer to point' : 'Avoider to insert';
    pill.className = `turn-pill ${p === FORCER ? 'blue' : ''}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // meter
  const len = state.seq.length;
  $('meterFill').style.width = `${cfg.n ? Math.min(len / cfg.n, 1) * 100 : 0}%`;
  $('meterValue').textContent = `${len} / ${cfg.n}`;
  $('meterLabel').textContent = 'Length toward target';

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (state.winner === FORCER) {
      banner.className = 'banner blue';
      const w = state.witness;
      const factor = w ? ` (positions ${w.start + 1}–${w.end}).` : '.';
      banner.textContent = `Forcer wins — tight twins appeared${factor} The two interleaved copies are painted.`;
    } else {
      banner.className = 'banner red';
      banner.textContent = `Avoider wins — reached length ${cfg.n} with no tight twin. 🎉`;
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
function syncVariant(resetValues: boolean): void {
  const variant = ($('variantSel') as HTMLSelectElement).value as Variant;
  const n = $('nRange') as HTMLInputElement;
  const minBlock = $('minBlockRange') as HTMLInputElement;
  if (variant === 'words') {
    $('kField').style.display = '';
    $('nName').textContent = 'Target length n';
    n.min = '4'; n.max = '20';
    if (resetValues) { n.value = '12'; minBlock.value = String(defaultMinBlock('words')); }
  } else {
    $('kField').style.display = 'none';
    $('nName').textContent = 'Interval m';
    n.min = '4'; n.max = '9';
    if (resetValues) { n.value = '7'; minBlock.value = String(defaultMinBlock('perm')); }
    if (+n.value > 9) n.value = '9';
  }
}

function syncLabels(): void {
  $('kLabel').textContent = ($('kRange') as HTMLInputElement).value;
  $('nLabel').textContent = ($('nRange') as HTMLInputElement).value;
  $('minBlockLabel').textContent = ($('minBlockRange') as HTMLInputElement).value;
  const variant = ($('variantSel') as HTMLSelectElement).value as Variant;
  const n = ($('nRange') as HTMLInputElement).value;
  $('howtoN').textContent = variant === 'words' ? n : `${n} numbers`;
  $('howtoInsert').innerHTML = variant === 'words'
    ? `<b class="red-text">Avoider (red)</b> then clicks a <b>letter</b> in the palette to insert it there.`
    : `<b class="red-text">Avoider (red)</b> then clicks an <b>unused number</b> in the palette to insert it there.`;
}

function syncRoleVisibility(): void {
  const role = ($('roleSel') as HTMLSelectElement).value;
  // aiR = Forcer (shown unless human is the Forcer, i.e. role R), aiB = Avoider (unless role B)
  $('aiRField').style.display = (role === 'B' || role === 'none') ? '' : 'none';
  $('aiBField').style.display = (role === 'R' || role === 'none') ? '' : 'none';
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
    if (t && !t.disabled) onSymbol(+(t.dataset.sym as string));
  });

  $('variantSel').addEventListener('change', () => { syncVariant(true); syncLabels(); startNewGame(); });
  for (const id of ['kRange', 'nRange', 'minBlockRange']) {
    $(id).addEventListener('input', syncLabels);
    $(id).addEventListener('change', () => { syncLabels(); startNewGame(); });
  }
  $('roleSel').addEventListener('change', () => { syncRoleVisibility(); startNewGame(); });
  for (const id of ['aiR', 'aiB']) $(id).addEventListener('change', startNewGame);

  $('newBtn').addEventListener('click', startNewGame);
  $('hintBtn').addEventListener('click', showHint);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => { running = !running; render(); scheduleAi(); });

  syncVariant(false);
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
