// Game rules for Different Blocks. CONSTRUCTOR points at a gap (point phase); AVOIDER inserts a
// letter (insert phase). CONSTRUCTOR wins the instant the word has a bad configuration; AVOIDER wins
// on reaching target length n. Pure engine: no DOM.

import { AVOIDER, CONSTRUCTOR, GameConfig, GameState, Move, Role } from './types';
import { findBadConfig } from './detect';

/**
 * Default minimum alphabet for k blocks. We enforce |A| >= k: with |A| < k the m=1 case is forced by
 * pigeonhole (k single-letter blocks over fewer than k letters must repeat), so the game is trivially
 * Constructor-won. Callers clamp alpha up to this.
 */
export function minAlpha(k: number): number {
  return k;
}

export function newGame(config: GameConfig): GameState {
  const alpha = Math.max(config.alpha, minAlpha(config.k));
  return { config: { ...config, alpha }, word: [], phase: 'point', turn: CONSTRUCTOR };
}

/** Whose turn it is: CONSTRUCTOR points, AVOIDER inserts. */
export function currentPlayer(s: GameState): Role {
  return s.phase === 'point' ? CONSTRUCTOR : AVOIDER;
}

/** Legal moves. Point phase: every gap index 0..len. Insert phase: every letter 0..alpha-1. */
export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  const out: Move[] = [];
  if (s.phase === 'point') {
    for (let g = 0; g <= s.word.length; g++) out.push(g);
    return out;
  }
  for (let c = 0; c < s.config.alpha; c++) out.push(c);
  return out;
}

/** Evaluate a word (no phase): CONSTRUCTOR if a bad config exists, AVOIDER if target reached. */
function evaluate(word: number[], config: GameConfig): { winner?: Role; witness?: ReturnType<typeof findBadConfig> } {
  const witness = findBadConfig(word, config.k);
  if (witness) return { winner: CONSTRUCTOR, witness };
  if (word.length >= config.n) return { winner: AVOIDER };
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
  const g = s.gap ?? s.word.length;
  const word = [...s.word.slice(0, g), move, ...s.word.slice(g)];
  const next: GameState = { ...s, word, phase: 'point', gap: undefined, turn: CONSTRUCTOR };
  const { winner, witness } = evaluate(word, s.config);
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
  return `Constructor wants ${c.k} equal-length adjacent blocks with two identical; ` +
    `Avoider wants to reach length ${c.n} over a ${c.alpha}-letter alphabet with every such run all-different.`;
}
