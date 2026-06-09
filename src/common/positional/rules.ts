// Generic Maker–Breaker rules over a Hypergraph. Maker (Red) moves first and wins by owning every
// cell of some winning set; otherwise Breaker wins when the board fills.

import { Color, GameConfig, GameState, Hypergraph, Move, MAKER, BREAKER } from './types';
import { buildHypergraph, setSize } from './hypergraph';

export function newGame(config: GameConfig): GameState {
  const hg = buildHypergraph(config);
  return { config, hg, owner: new Array<Color | null>(hg.cellCount).fill(null), turn: MAKER };
}

export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  const out: Move[] = [];
  for (let i = 0; i < s.owner.length; i++) if (s.owner[i] === null) out.push(i);
  return out;
}

export interface Progress { size: number; need: number; witness: number[]; }

function progressOwner(hg: Hypergraph, owner: (Color | null)[]): Progress {
  let best = 0;
  let bestSet: number[] = [];
  const need = setSize(hg);
  for (const set of hg.winningSets) {
    let mk = 0;
    let blocked = false;
    for (const c of set) {
      const o = owner[c];
      if (o === BREAKER) { blocked = true; break; }
      if (o === MAKER) mk++;
    }
    if (blocked) continue;
    if (mk > best) { best = mk; bestSet = set; }
  }
  return { size: best, need, witness: bestSet };
}

/** Maker's best *live* winning set (one with no Breaker cell) and how many cells she owns in it. */
export function makerProgress(s: GameState): Progress {
  return progressOwner(s.hg, s.owner);
}

function boardFull(owner: (Color | null)[]): boolean {
  return owner.every(o => o !== null);
}

function completedSet(hg: Hypergraph, owner: (Color | null)[]): number[] | undefined {
  return hg.winningSets.find(set => set.every(c => owner[c] === MAKER));
}

export function applyMove(s: GameState, cell: number): GameState {
  if (s.winner || cell < 0 || cell >= s.owner.length || s.owner[cell] !== null) return s;
  const color = s.turn;
  const owner = s.owner.slice();
  owner[cell] = color;
  const next: GameState = { ...s, owner, turn: color === MAKER ? BREAKER : MAKER };

  if (s.config.mode === 'scoring') {
    // Scoring mode: play to the end and score Maker by her largest live structure. The game stops
    // when the board fills, or early once Maker can no longer improve (she has completed a full
    // live set, the maximum possible score). The winner is decided by that final score.
    const prog = progressOwner(s.hg, owner);
    if (boardFull(owner) || prog.size >= prog.need) {
      next.score = prog.size;
      next.witness = prog.witness;
      next.winner = prog.size >= prog.need ? MAKER : BREAKER;
    }
    return next;
  }

  if (color === MAKER) {
    const w = completedSet(s.hg, owner);
    if (w) {
      next.winner = MAKER;
      next.witness = w;
      return next;
    }
  }
  if (boardFull(owner)) {
    const w = completedSet(s.hg, owner);
    next.witness = w ?? progressOwner(s.hg, owner).witness;
    next.winner = w ? MAKER : BREAKER;
  }
  return next;
}

export function isOver(s: GameState): boolean {
  return !!s.winner;
}

export function goalText(c: GameConfig): string {
  return c.kind === 'vdw'
    ? `Maker (red) wants ${c.target} red marks in arithmetic progression.`
    : `Maker (red) wants a red clique on ${c.target} vertices (all edges among them).`;
}
