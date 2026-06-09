// Game rules for Twin Hunter. FORCER points at a gap (point phase); AVOIDER inserts a symbol
// (insert phase). FORCER wins the instant the sequence has tight twins; AVOIDER wins on reaching
// the target. Pure engine: no DOM.

import { AVOIDER, FORCER, GameConfig, GameState, Move, Role, Variant } from './types';
import { findWitness, hasTightTwins } from './twins';

/** Default minimum block per variant: words=1 (forbids "aa"), perm=2 (length-1 twins are trivial). */
export function defaultMinBlock(variant: Variant): number {
  return variant === 'perm' ? 2 : 1;
}

export function newGame(config: GameConfig): GameState {
  return { config, seq: [], phase: 'point', turn: FORCER };
}

/** Whose turn it is: FORCER points, AVOIDER inserts. */
export function currentPlayer(s: GameState): Role {
  return s.phase === 'point' ? FORCER : AVOIDER;
}

/**
 * Legal moves. Point phase: every gap index 0..len. Insert phase: every letter 0..k-1 (words) or
 * every unused number 1..m (perm — used numbers are removed).
 */
export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  if (s.phase === 'point') {
    const out: Move[] = [];
    for (let g = 0; g <= s.seq.length; g++) out.push(g);
    return out;
  }
  if (s.config.variant === 'words') {
    const out: Move[] = [];
    for (let c = 0; c < s.config.k; c++) out.push(c);
    return out;
  }
  const used = new Set(s.seq);
  const out: Move[] = [];
  for (let v = 1; v <= s.config.n; v++) if (!used.has(v)) out.push(v);
  return out;
}

/** Evaluate the terminal state of a sequence (no phase): FORCER if tight twins, AVOIDER if target. */
function evaluate(seq: number[], config: GameConfig): { winner?: Role; witness?: ReturnType<typeof findWitness> } {
  if (hasTightTwins(seq, config.variant, config.minBlock)) {
    return { winner: FORCER, witness: findWitness(seq, config.variant, config.minBlock) };
  }
  if (seq.length >= config.n) return { winner: AVOIDER };
  return {};
}

export function applyMove(s: GameState, move: Move): GameState {
  if (s.winner) return s;
  const legal = legalMoves(s);
  if (!legal.includes(move)) return s;

  if (s.phase === 'point') {
    return { ...s, phase: 'insert', gap: move, turn: AVOIDER };
  }

  // insert phase
  const g = s.gap ?? s.seq.length;
  const seq = [...s.seq.slice(0, g), move, ...s.seq.slice(g)];
  const next: GameState = { ...s, seq, phase: 'point', gap: undefined, turn: FORCER };
  const { winner, witness } = evaluate(seq, s.config);
  if (winner) {
    next.winner = winner;
    if (witness) next.witness = witness;
  }
  return next;
}

export function isOver(s: GameState): boolean {
  return !!s.winner;
}

export function goalText(c: GameConfig): string {
  if (c.variant === 'words') {
    return `Forcer (blue) wants tight twins; Avoider (red) wants to reach length ${c.n} with an ${c.k}-letter alphabet.`;
  }
  return `Forcer (blue) wants tight twins; Avoider (red) wants to place all ${c.n} numbers.`;
}
