// UI controller for AP-Pack. One strip renderer + a comb-tile tray; the engine does all the logic.
// Interaction: pick a tray tile (or block mode), then click a strip cell to set the start. Illegal
// placements flash red (shake). Solo scores used length vs m(F); two-player and pack-vs-block run as
// turn-based games with AI for the non-human side(s).

import {
  APSpec, Cell, Color, GameConfig, GameState, Mode, AILevel, Move, RED, BLUE,
  newGame, applyMove, isOver, goalText, makeRng, aiMove,
  isLegal, legalPlacementsFor, usedLength, coveredCount, mF, mFWitness,
} from './engine';
import type { GameSlots, GameInstance } from '../../common/contract';
import './board.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---- slot markup ----------------------------------------------------------------------------------
const SETTINGS_HTML = `
<section class="card">
  <h2>Settings</h2>
  <div class="controls">
    <div class="field span2">
      <label for="modeSel">Mode</label>
      <select id="modeSel">
        <option value="solo" selected>Solo puzzle — pack a family tightly</option>
        <option value="two-player">Two-player — last to place wins</option>
        <option value="pack-vs-block">Pack vs Block — Maker–Breaker</option>
      </select>
    </div>
    <div class="field">
      <label for="sizeRange">Strip length L <span class="hint-num" id="sizeLabel">20</span></label>
      <input type="range" id="sizeRange" min="8" max="40" value="20" />
    </div>
    <div class="field" id="famField">
      <label for="famSel">Family</label>
      <select id="famSel"></select>
    </div>
    <div class="field span2" id="diffsField" style="display:none">
      <label>Allowed differences d</label>
      <div class="chips" id="diffChips"></div>
    </div>
    <div class="field span2" id="lensField" style="display:none">
      <label>Allowed lengths &#8467;</label>
      <div class="chips" id="lenChips"></div>
    </div>
    <div class="field" id="roleField">
      <label for="roleSel">You play</label>
      <select id="roleSel">
        <option value="R" selected>Red (first / Maker)</option>
        <option value="B">Blue (other side)</option>
        <option value="both">Hotseat (both)</option>
        <option value="none">Watch AI vs AI</option>
      </select>
    </div>
    <div class="field" id="aiRField">
      <label for="aiR">Red AI</label>
      <select id="aiR" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
    </div>
    <div class="field" id="aiBField">
      <label for="aiB">Blue AI</label>
      <select id="aiB" class="ai-sel"><option value="0">Easy</option><option value="1" selected>Greedy</option><option value="2">Strong</option><option value="3">Solver</option></select>
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
    <svg id="board" class="board" role="img" aria-label="packing strip"></svg>
  </div>
  <div id="trayWrap">
    <div class="meter-label" id="trayLabel" style="margin-bottom:8px">Tiles to place</div>
    <div class="tray" id="tray"></div>
  </div>
  <div class="meterrow">
    <div class="meter">
      <div class="meter-label" id="meterLabel">Used length</div>
      <div class="meter-track"><div class="meter-fill" id="meterFill"></div></div>
      <div class="meter-value" id="meterValue">0 / 0</div>
    </div>
  </div>
  <div class="banner" id="banner" hidden></div>
</section>`;

const SIDEBAR_HTML = `
<section class="card explainer" id="howto">
  <h2>How to play</h2>
  <ol class="howto-list" id="howtoList"></ol>
</section>
<section class="card explainer" id="maths">
  <h2>The maths behind it</h2>
  <p><b>AP "comb" tiles.</b> A tile <i>(start, d, &#8467;)</i> covers cells
    <i>start, start+d, &#8230;, start+(&#8467;&#8722;1)d</i> &mdash; an arithmetic progression.
    A packing places shifted copies pairwise disjointly on the strip.</p>
  <p><b>The optimum m(F).</b> For a family <i>F</i>, <i>m(F)</i> is the shortest interval that
    holds all members disjointly. Alon, D&#281;bski, Grytczuk &amp; Przyby&#322;o prove
    <i>m(F) = &Theta;(n<sup>3/2</sup>/ln n)</i> when the differences are bounded by <i>n</i>
    (and <i>&Theta;(n<sup>3</sup>/ln n)</i> when every member has size <i>n</i>). The solver
    finds <i>m(F)</i> exactly by branch-and-bound on small instances; the meter scores your
    used length against it.</p>
  <p><b>Maker&ndash;Breaker.</b> In Pack&nbsp;vs&nbsp;Block, Maker must place the whole family
    while Breaker deletes one cell per turn &mdash; a positional game (Beck,
    <i>Tic-Tac-Toe Theory</i>): can the packer still fit everything?</p>
  <p><b>The AI.</b> <i>Greedy</i> uses best-fit packing; <i>Strong</i> runs alpha&ndash;beta
    on the two-player game; <i>Solver</i> computes the exact optimum / game value on small
    boards.</p>
  <p class="muted small">References: Alon, D&#281;bski, Grytczuk &amp; Przyby&#322;o,
    <i>Packing arithmetic progressions</i> (2026),
    <a href="https://arxiv.org/abs/2603.02786" target="_blank" rel="noopener">arXiv:2603.02786</a>;
    Beck, <i>Combinatorial Games: Tic-Tac-Toe Theory</i> (2008).</p>
</section>`;

// ---- families for solo / pack-vs-block ----
interface NamedFamily { name: string; family: APSpec[]; }
const FAMILIES: NamedFamily[] = [
  { name: 'A: {2×len2}', family: [{ d: 1, len: 2 }, { d: 2, len: 2 }] },
  { name: 'B: line + skip', family: [{ d: 1, len: 3 }, { d: 2, len: 3 }] },
  { name: 'C: three combs', family: [{ d: 1, len: 2 }, { d: 2, len: 3 }, { d: 3, len: 2 }] },
  { name: 'D: combs 1..3', family: [{ d: 1, len: 3 }, { d: 2, len: 2 }, { d: 3, len: 3 }] },
  { name: 'E: dense', family: [{ d: 1, len: 4 }, { d: 2, len: 3 }, { d: 3, len: 3 }, { d: 1, len: 2 }] },
];

const ALL_DIFFS = [1, 2, 3, 4];
const ALL_LENS = [2, 3, 4];

// ---- state ----
let state!: GameState;
let history: GameState[] = [];
let rng = makeRng(1);
let seedCounter = 1;
let aiTimer: number | undefined;
let running = false;
const AI_DELAY = 430;

// UI selection: which remaining-member index is armed (solo / pvb Maker), or 'block' for Breaker.
let selected: number | null = null;
let hintMove: Move | null = null;
let target = 0; // m(F) for solo

// two-player selection: chosen (d,len) tile
let selDiff = 1;
let selLen = 2;
// chip selections
let diffsOn = new Set<number>([1, 2, 3]);
let lensOn = new Set<number>([2, 3]);

// ---- config ----
function currentMode(): Mode { return ($('modeSel') as HTMLSelectElement).value as Mode; }

function readConfig(seed: number): GameConfig {
  const mode = currentMode();
  const L = +($('sizeRange') as HTMLInputElement).value;
  const cfg: GameConfig = {
    mode, L,
    humanRole: ($('roleSel') as HTMLSelectElement).value as GameConfig['humanRole'],
    aiLevel: {
      R: +($('aiR') as HTMLSelectElement).value as AILevel,
      B: +($('aiB') as HTMLSelectElement).value as AILevel,
    },
    seed,
  };
  if (mode === 'two-player') {
    cfg.diffs = ALL_DIFFS.filter((d) => diffsOn.has(d));
    cfg.lengths = ALL_LENS.filter((l) => lensOn.has(l));
    if (cfg.diffs.length === 0) cfg.diffs = [1];
    if (cfg.lengths.length === 0) cfg.lengths = [2];
  } else {
    const idx = +($('famSel') as HTMLSelectElement).value;
    cfg.family = FAMILIES[idx].family.map((m) => ({ ...m }));
  }
  return cfg;
}

function humanControls(turn: Color): boolean {
  const r = state.config.humanRole;
  if (state.config.mode === 'solo') return r !== 'none';
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
  hintMove = null;
  selected = state.config.mode === 'two-player' ? null : 0;
  // Reset Run state when a human is involved; for any "Watch AI vs AI" flow (including solo) leave
  // `running` as-is so a fresh game keeps auto-playing if it was already running.
  if (state.config.humanRole !== 'none') running = false;
  // compute m(F) target for solo
  if (state.config.mode === 'solo' && state.config.family) {
    const m = mF(state.config.family, 60);
    target = m > 0 ? m : usedLength(state.occupied);
  } else {
    target = 0;
  }
  syncDefaultTwoPlayerSelection();
  render();
  scheduleAi();
}

function syncDefaultTwoPlayerSelection(): void {
  if (state.config.mode !== 'two-player') return;
  const diffs = state.config.diffs ?? [1];
  const lens = state.config.lengths ?? [2];
  if (!diffs.includes(selDiff)) selDiff = diffs[0];
  if (!lens.includes(selLen)) selLen = lens[0];
}

function commit(next: GameState): void {
  if (next === state) { flashBad(); return; }
  history.push(state);
  state = next;
  hintMove = null;
  // keep a valid armed selection
  if (state.config.mode !== 'two-player') {
    if (selected === null || selected >= state.remaining.length) {
      selected = state.remaining.length ? 0 : null;
    }
  }
  render();
  scheduleAi();
}

function flashBad(): void {
  const board = $('board');
  board.classList.remove('shake');
  // force reflow to restart animation
  void board.offsetWidth;
  board.classList.add('shake');
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
  const m = aiMove(state, state.config.aiLevel[state.turn], rng);
  if (m) commit(applyMove(state, m));
  else render();
}

// ---- human interaction ----
function onCellClick(cell: number): void {
  if (!isHumanTurn()) return;
  const mode = state.config.mode;

  if (mode === 'two-player') {
    const move: Move = { kind: 'place', start: cell, d: selDiff, len: selLen };
    commit(applyMove(state, move));
    return;
  }

  // solo / pack-vs-block
  if (state.turn === BLUE && mode === 'pack-vs-block') {
    // Breaker: click a free cell to block it.
    commit(applyMove(state, { kind: 'block', cell }));
    return;
  }
  // Maker / solo: place the armed remaining member at `cell` as its start.
  if (selected === null || selected >= state.remaining.length) { flashBad(); return; }
  const spec = state.remaining[selected];
  const move: Move = { kind: 'place', start: cell, d: spec.d, len: spec.len, specIndex: selected };
  commit(applyMove(state, move));
}

function showHint(): void {
  if (!isHumanTurn()) return;
  const lvl = Math.max(2, state.config.aiLevel[state.turn]) as AILevel;
  hintMove = aiMove(state, lvl, rng);
  // arm the hinted tile if it's a placement
  if (hintMove && hintMove.kind === 'place' && hintMove.specIndex !== undefined) {
    selected = hintMove.specIndex;
  }
  render();
}

function undo(): void {
  if (!history.length) return;
  state = history.pop()!;
  const r = state.config.humanRole;
  if ((r === 'R' || r === 'B') && state.config.mode !== 'solo') {
    while (history.length && !humanControls(state.turn) && !isOver(state)) state = history.pop()!;
  }
  hintMove = null;
  running = false;
  if (state.config.mode !== 'two-player'
      && (selected === null || selected >= state.remaining.length)) {
    selected = state.remaining.length ? 0 : null;
  }
  render();
}

// ---- preview computation ----
/** Cells the currently-armed tile would occupy if placed starting at `cell`; null if not applicable. */
function previewCells(startCell: number): { cells: number[]; ok: boolean } | null {
  const mode = state.config.mode;
  if (!isHumanTurn()) return null;
  let d: number, len: number;
  if (mode === 'two-player') { d = selDiff; len = selLen; }
  else if (mode === 'pack-vs-block' && state.turn === BLUE) {
    return { cells: [startCell], ok: state.occupied[startCell] === null };
  } else {
    if (selected === null || selected >= state.remaining.length) return null;
    d = state.remaining[selected].d; len = state.remaining[selected].len;
  }
  const cells: number[] = [];
  for (let t = 0; t < len; t++) cells.push(startCell + t * d);
  const ok = isLegal(state.occupied, startCell, d, len);
  return { cells, ok };
}

// ---- rendering ----
let hoverStart: number | null = null;

function colorClass(o: Cell): string {
  return o === RED ? 'r' : o === BLUE ? 'b' : o === 'x' ? 'x' : 'free';
}

function renderStrip(s: GameState): { viewBox: string; body: string } {
  const L = s.L;
  const MX = 8, GAP = 4, baseY = 8;
  const W = 600;
  const cellW = Math.max(8, (W - 2 * MX - (L - 1) * GAP) / L);
  const cellH = Math.min(34, Math.max(18, cellW * 1.1));
  const H = baseY + cellH + 16;
  const x = (i: number) => MX + i * (cellW + GAP);

  // preview set
  const armed = isHumanTurn();
  let prev: Set<number> = new Set();
  let prevOk = true;
  if (armed && hoverStart !== null) {
    const p = previewCells(hoverStart);
    if (p) { prev = new Set(p.cells.filter((c) => c >= 0 && c < L)); prevOk = p.ok; }
  }
  // hint set
  const hintCells = new Set<number>();
  if (hintMove) {
    if (hintMove.kind === 'place') {
      for (let t = 0; t < hintMove.len; t++) hintCells.add(hintMove.start + t * hintMove.d);
    } else hintCells.add(hintMove.cell);
  }

  const body: string[] = [];
  for (let i = 0; i < L; i++) {
    const cls = ['scell', colorClass(s.occupied[i])];
    const isFree = s.occupied[i] === null;
    if (isFree && armed) cls.push('armed');
    if (prev.has(i)) {
      if (prevOk) cls.push('preview', s.turn === BLUE ? 'preview-b' : 'preview-r');
      else cls.push('bad');
    }
    const stroke = hintCells.has(i) && !isOver(s)
      ? ' stroke="var(--violet)" stroke-width="2.5" stroke-dasharray="3 3"' : '';
    body.push(
      `<rect x="${x(i).toFixed(1)}" y="${baseY}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" rx="4" class="${cls.join(' ')}" data-cell="${i}"${stroke} />`,
    );
    if (L <= 28) {
      body.push(
        `<text x="${(x(i) + cellW / 2).toFixed(1)}" y="${baseY + cellH + 11}" class="scell-label">${i}</text>`,
      );
    }
  }
  return { viewBox: `0 0 ${W} ${H}`, body: body.join('') };
}

/** Mini SVG for a comb tile shape. */
function combSvg(spec: APSpec, placed: boolean): string {
  const r = 3.2, gap = 11, mx = 4;
  const w = mx * 2 + (spec.len - 1) * spec.d * gap + 0;
  const span = (spec.len - 1) * spec.d;
  const W = mx * 2 + span * gap;
  const H = 16;
  const cx = (k: number) => mx + k * gap;
  const parts: string[] = [];
  parts.push(`<line x1="${mx}" y1="8" x2="${(mx + span * gap).toFixed(1)}" y2="8" class="comb-line"/>`);
  for (let t = 0; t < spec.len; t++) {
    parts.push(`<circle cx="${cx(t * spec.d).toFixed(1)}" cy="8" r="${r}" class="comb-mark"/>`);
  }
  return `<svg viewBox="0 0 ${Math.max(W, 14)} ${H}" width="${Math.min(120, Math.max(20, W)).toFixed(0)}" height="${H}">${parts.join('')}</svg>`;
}

function renderTray(s: GameState): void {
  const wrap = $('trayWrap');
  const tray = $('tray');
  const label = $('trayLabel');

  if (s.config.mode === 'two-player') {
    wrap.style.display = '';
    label.textContent = 'Pick a tile (difference d × length ℓ), then click a cell to place it';
    const diffs = s.config.diffs ?? [1];
    const lens = s.config.lengths ?? [2];
    const tiles: string[] = [];
    for (const d of diffs) for (const len of lens) {
      const spec = { d, len };
      const sel = (d === selDiff && len === selLen) ? ' selected' : '';
      tiles.push(
        `<figure class="combtile${sel}" data-d="${d}" data-len="${len}" tabindex="0">${combSvg(spec, false)}<figcaption>d=${d}, ℓ=${len}</figcaption></figure>`,
      );
    }
    tray.innerHTML = tiles.join('');
    return;
  }

  // solo / pack-vs-block: remaining family members as tiles
  wrap.style.display = '';
  if (s.config.mode === 'pack-vs-block' && s.turn === BLUE && humanControls(BLUE)) {
    label.textContent = 'Breaker: click any free cell to block it';
  } else {
    label.textContent = 'Click a comb tile to select it, then click a strip cell for its start';
  }
  const placedSpecs = s.placed.map((p) => `${p.d}:${p.len}`);
  // Build a stable per-member list: remaining (clickable) + already-placed (faded)
  const tiles: string[] = [];
  s.remaining.forEach((spec, idx) => {
    const sel = idx === selected ? ' selected' : '';
    tiles.push(
      `<figure class="combtile${sel}" data-spec="${idx}" tabindex="0">${combSvg(spec, false)}<figcaption>d=${spec.d}, ℓ=${spec.len}</figcaption></figure>`,
    );
  });
  // show placed ones faded for context
  for (const p of s.placed) {
    tiles.push(
      `<figure class="combtile placed">${combSvg({ d: p.d, len: p.len }, true)}<figcaption>placed</figcaption></figure>`,
    );
  }
  void placedSpecs;
  tray.innerHTML = tiles.join('');
}

function render(): void {
  const cfg = state.config;
  const over = isOver(state);

  const { viewBox, body } = renderStrip(state);
  const board = $('board');
  board.setAttribute('viewBox', viewBox);
  board.innerHTML = body;

  renderTray(state);

  // status pill
  const pill = $('turnPill');
  if (over) {
    if (cfg.mode === 'solo') {
      pill.textContent = 'Packed';
      pill.className = 'turn-pill done';
    } else {
      pill.textContent = `${state.winner === RED ? 'Red' : 'Blue'} wins`;
      pill.className = 'turn-pill done';
    }
  } else if (cfg.mode === 'solo') {
    pill.textContent = `${state.remaining.length} tile${state.remaining.length === 1 ? '' : 's'} left`;
    pill.className = 'turn-pill';
  } else {
    pill.textContent = state.turn === RED ? 'Red to move' : 'Blue to move';
    pill.className = `turn-pill ${state.turn === RED ? '' : 'blue'}`.trim();
  }
  $('goalText').textContent = goalText(cfg);

  // meter
  const used = usedLength(state.occupied);
  const mLabel = $('meterLabel');
  const mFill = $('meterFill') as HTMLElement;
  const mVal = $('meterValue');
  if (cfg.mode === 'solo') {
    mLabel.textContent = 'Used length vs m(F)';
    const denom = target || used || 1;
    mFill.style.width = `${Math.min(used / denom, 1.5) / 1.5 * 100}%`;
    mVal.textContent = `${used} / ${target || '?'}`;
  } else if (cfg.mode === 'two-player') {
    mLabel.textContent = 'Cells covered';
    mFill.style.width = `${(coveredCount(state.occupied) / state.L) * 100}%`;
    mVal.textContent = `${coveredCount(state.occupied)} / ${state.L}`;
  } else {
    mLabel.textContent = 'Family placed';
    const total = (cfg.family?.length ?? 0);
    const done = total - state.remaining.length;
    mFill.style.width = `${total ? (done / total) * 100 : 0}%`;
    mVal.textContent = `${done} / ${total}`;
  }

  // banner
  const banner = $('banner');
  if (over) {
    banner.hidden = false;
    if (cfg.mode === 'solo') {
      const optimal = used === target;
      banner.className = optimal ? 'banner violet' : 'banner red';
      banner.textContent = optimal
        ? `Optimal! Used length ${used} = m(F). 🎉`
        : `Packed in length ${used}. Optimum m(F) = ${target}. Try to match it!`;
    } else if (state.winner === RED) {
      banner.className = 'banner red';
      banner.textContent = cfg.mode === 'pack-vs-block'
        ? 'Maker wins — the whole family is packed! 🎉'
        : 'Red wins — Blue cannot move. 🎉';
    } else {
      banner.className = 'banner blue';
      banner.textContent = cfg.mode === 'pack-vs-block'
        ? 'Breaker wins — a tile can no longer be placed.'
        : 'Blue wins — Red cannot move.';
    }
  } else {
    banner.hidden = true;
  }

  // buttons
  ($('hintBtn') as HTMLButtonElement).disabled = !isHumanTurn();
  ($('undoBtn') as HTMLButtonElement).disabled = history.length === 0;
  const runBtn = $('runBtn') as HTMLButtonElement;
  // Run/Pause drives every AI-vs-AI watch flow, including solo "Watch AI vs AI" (the auto-solver).
  if (cfg.humanRole === 'none') {
    runBtn.hidden = false;
    runBtn.textContent = running ? 'Pause' : 'Run';
    runBtn.disabled = over;
  } else {
    runBtn.hidden = true;
  }
}

// ---- controls wiring ----
function syncModeVisibility(): void {
  const mode = currentMode();
  const isTwo = mode === 'two-player';
  $('famField').style.display = isTwo ? 'none' : '';
  $('diffsField').style.display = isTwo ? '' : 'none';
  $('lensField').style.display = isTwo ? '' : 'none';

  // In solo only "Play" (R) and "Watch AI vs AI" (none) change behaviour — Blue and Hotseat are
  // no-ops (turn is always Red). Hide/disable them in solo and snap the selector to a valid value.
  const roleSel = $('roleSel') as HTMLSelectElement;
  const soloDead = ['B', 'both'];
  for (const opt of Array.from(roleSel.options)) {
    const dead = mode === 'solo' && soloDead.includes(opt.value);
    opt.hidden = dead;
    opt.disabled = dead;
  }
  if (mode === 'solo' && soloDead.includes(roleSel.value)) roleSel.value = 'R';

  // role only meaningful for two-player / pvb; for solo the human always plays (or watch via 'none')
  const role = roleSel.value;
  $('aiRField').style.display = (role === 'B' || role === 'none') && mode !== 'solo' ? '' : 'none';
  $('aiBField').style.display = (role === 'R' || role === 'none') && mode !== 'solo' ? '' : 'none';
  if (mode === 'solo') {
    // solo: show only the solver level for the auto-solver via Red AI when watching
    $('aiRField').style.display = role === 'none' ? '' : 'none';
    $('aiBField').style.display = 'none';
  }
  $('sizeLabel').textContent = ($('sizeRange') as HTMLInputElement).value;
}

function syncHowto(): void {
  const mode = currentMode();
  const list = $('howtoList');
  if (mode === 'solo') {
    list.innerHTML = `
      <li><b>Click a comb tile</b> in the tray to select it.</li>
      <li><b>Click a strip cell</b> to set the tile's <i>start</i>; it fills cells <i>start, start+d, …</i></li>
      <li>All tiles must be <b>pairwise disjoint</b>. Illegal drops flash red.</li>
      <li>Pack every tile to <b>minimise the used length</b> — match <b>m(F)</b> for a perfect score.</li>`;
  } else if (mode === 'two-player') {
    list.innerHTML = `
      <li>Pick a tile <b>(d × ℓ)</b>, then click a cell to drop a shifted AP copy.</li>
      <li>No overlaps; <b class="red-text">Red</b> moves first, then <b class="blue-text">Blue</b>.</li>
      <li><b>Normal play:</b> the player who cannot move loses (last to place wins).</li>`;
  } else {
    list.innerHTML = `
      <li><b class="red-text">Maker</b> places the whole family of comb tiles, all disjoint.</li>
      <li><b class="blue-text">Breaker</b> blocks <b>one free cell</b> each turn.</li>
      <li>Maker wins by placing everything; Breaker wins if a tile can no longer fit.</li>`;
  }
}

function buildChips(): void {
  const dc = $('diffChips');
  dc.innerHTML = ALL_DIFFS.map((d) =>
    `<button class="chip${diffsOn.has(d) ? ' on' : ''}" data-diff="${d}">d=${d}</button>`).join('');
  const lc = $('lenChips');
  lc.innerHTML = ALL_LENS.map((l) =>
    `<button class="chip${lensOn.has(l) ? ' on' : ''}" data-len="${l}">ℓ=${l}</button>`).join('');
}

function buildFamilyOptions(): void {
  const sel = $('famSel') as HTMLSelectElement;
  sel.innerHTML = FAMILIES.map((f, i) =>
    `<option value="${i}"${i === 0 ? ' selected' : ''}>${f.name}</option>`).join('');
}

export function mount(slots: GameSlots): GameInstance {
  slots.settings.innerHTML = SETTINGS_HTML;
  slots.board.innerHTML = BOARD_HTML;
  slots.sidebar.innerHTML = SIDEBAR_HTML;

  buildFamilyOptions();
  buildChips();

  // board clicks + hover preview
  $('board').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('[data-cell]');
    if (t) onCellClick(+(t.getAttribute('data-cell') as string));
  });
  $('board').addEventListener('mousemove', (ev) => {
    const t = (ev.target as Element).closest('[data-cell]');
    const c = t ? +(t.getAttribute('data-cell') as string) : null;
    if (c !== hoverStart) { hoverStart = c; if (isHumanTurn()) render(); }
  });
  $('board').addEventListener('mouseleave', () => {
    if (hoverStart !== null) { hoverStart = null; render(); }
  });

  // tray clicks (delegated)
  $('tray').addEventListener('click', (ev) => {
    const t = (ev.target as Element).closest('.combtile') as HTMLElement | null;
    if (!t || t.classList.contains('placed')) return;
    if (t.dataset.spec !== undefined) { selected = +t.dataset.spec; render(); }
    else if (t.dataset.d !== undefined) {
      selDiff = +t.dataset.d; selLen = +(t.dataset.len as string); render();
    }
  });

  // chips
  $('diffChips').addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest('[data-diff]') as HTMLElement | null;
    if (!b) return;
    const d = +(b.dataset.diff as string);
    if (diffsOn.has(d)) diffsOn.delete(d); else diffsOn.add(d);
    if (diffsOn.size === 0) diffsOn.add(d);
    buildChips(); startNewGame();
  });
  $('lenChips').addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest('[data-len]') as HTMLElement | null;
    if (!b) return;
    const l = +(b.dataset.len as string);
    if (lensOn.has(l)) lensOn.delete(l); else lensOn.add(l);
    if (lensOn.size === 0) lensOn.add(l);
    buildChips(); startNewGame();
  });

  $('modeSel').addEventListener('change', () => { syncModeVisibility(); syncHowto(); startNewGame(); });
  $('sizeRange').addEventListener('input', () => { $('sizeLabel').textContent = ($('sizeRange') as HTMLInputElement).value; });
  $('sizeRange').addEventListener('change', startNewGame);
  $('famSel').addEventListener('change', startNewGame);
  $('roleSel').addEventListener('change', () => { syncModeVisibility(); startNewGame(); });
  for (const id of ['aiR', 'aiB']) $(id).addEventListener('change', startNewGame);

  $('newBtn').addEventListener('click', startNewGame);
  $('hintBtn').addEventListener('click', showHint);
  $('undoBtn').addEventListener('click', undo);
  $('runBtn').addEventListener('click', () => { running = !running; render(); scheduleAi(); });

  syncModeVisibility();
  syncHowto();
  startNewGame();

  return {
    destroy() {
      window.clearTimeout(aiTimer);
      aiTimer = undefined;
    },
  };
}

// silence unused-import noise for helpers reserved for future hint visualisation
void mFWitness;
void legalPlacementsFor;
