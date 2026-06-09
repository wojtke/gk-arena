// Game rules for Ramsey Words. CONSTRUCTOR points at a gap (point phase); AVOIDER inserts a letter
// (insert phase). CONSTRUCTOR wins the instant two adjacent length-l blocks share a colour; AVOIDER
// wins on reaching length n. Pure engine: no DOM. χ is fixed at newGame and never changes.

import { AVOIDER, CONSTRUCTOR, GameConfig, GameState, Move, Side } from './types';
import { coloringFor } from './coloring';
import { findAdjacentMono } from './detect';

export function newGame(config: GameConfig): GameState {
  return {
    config,
    coloring: coloringFor(config),
    word: [],
    phase: 'point',
    gap: null,
    winner: null,
    witness: null,
  };
}

/** Whose turn it is: Constructor points, Avoider inserts. */
export function currentPlayer(s: GameState): Side {
  return s.phase === 'point' ? CONSTRUCTOR : AVOIDER;
}

/** Point phase: every gap index 0..len. Insert phase: every letter 0..alpha-1. */
export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  const out: Move[] = [];
  if (s.phase === 'point') {
    for (let g = 0; g <= s.word.length; g++) out.push(g);
  } else {
    for (let a = 0; a < s.config.alpha; a++) out.push(a);
  }
  return out;
}

/** Evaluate a finished word (no phase): Constructor if adjacent mono, Avoider if length n. */
function evaluate(word: number[], s: GameState): { winner: Side | null; witness: GameState['witness'] } {
  const hit = findAdjacentMono(word, s.config.l, s.coloring, s.config.alpha);
  if (hit) return { winner: CONSTRUCTOR, witness: hit };
  if (word.length >= s.config.n) return { winner: AVOIDER, witness: null };
  return { winner: null, witness: null };
}

export function applyMove(s: GameState, move: Move): GameState {
  if (s.winner) return s;
  if (!legalMoves(s).includes(move)) return s;

  if (s.phase === 'point') {
    return { ...s, phase: 'insert', gap: move };
  }

  // insert phase
  const g = s.gap ?? s.word.length;
  const word = [...s.word.slice(0, g), move, ...s.word.slice(g)];
  const next: GameState = { ...s, word, phase: 'point', gap: null };
  const { winner, witness } = evaluate(word, s);
  next.winner = winner;
  next.witness = witness;
  return next;
}

export function isOver(s: GameState): boolean {
  return !!s.winner;
}

export function goalText(c: GameConfig): string {
  return `Constructor wants two adjacent same-coloured length-${c.l} blocks; Avoider wants to reach length ${c.n} over a ${c.alpha}-letter alphabet (${c.c} colours).`;
}
