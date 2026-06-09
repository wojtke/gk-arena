// Core types for Ramsey Words — an online Ramsey-on-words forcer/avoider game.
//
// All length-l words over a |A|-letter alphabet are pre-coloured with c colours by a FIXED colouring
// χ (random-from-seed or a hand-built preset). A word grows one letter per round:
//   CONSTRUCTOR (player 1) points at a gap; AVOIDER (player 2) inserts a letter a ∈ A there.
// CONSTRUCTOR wins the instant two ADJACENT length-l blocks share a colour — some i with
//   χ(w[i..i+l-1]) == χ(w[i+l..i+2l-1]).
// AVOIDER wins by reaching length n with no such monochromatic adjacent pair.
//
// χ lives on the (immutable) state as a flat Uint8Array of size |A|^l, indexed by the base-|A| value
// of the l-gram. We cap |A|^l ≤ 256 (l ≤ 3, |A| ≤ 4).

/** The two sides. C = Constructor (forcer), A = Avoider. */
export type Side = 'C' | 'A';
export const CONSTRUCTOR: Side = 'C';
export const AVOIDER: Side = 'A';

export type AILevel = 0 | 1 | 2 | 3;

/** C is the first/forcing side in the role select; 'both' = hotseat, 'none' = watch AI vs AI. */
export type HumanRole = Side | 'both' | 'none';

export interface GameConfig {
  /** Alphabet size |A| (letters 0..alpha-1). Cap 4 so alpha^l ≤ 256. */
  alpha: number;
  /** Block length l (cap 3). */
  l: number;
  /** Colour count c. */
  c: number;
  /** Target length n: Avoider wins on reaching it. */
  n: number;
  /** Seed for the deterministic random colouring χ. */
  seed: number;
  /** Optional preset colouring name; when set, χ is hand-built and `seed` is ignored. */
  preset?: string;
  humanRole: HumanRole;
  aiLevel: Record<Side, AILevel>;
}

/** The witness of a Constructor win: the start index i of the first monochromatic adjacent pair. */
export interface Witness {
  /** Start index of the first (left) block; the two blocks span [i, i+2l). */
  i: number;
  /** The shared colour. */
  color: number;
}

export interface GameState {
  config: GameConfig;
  /** χ as a flat table indexed by the base-|A| value of the l-gram (length alpha^l). Immutable. */
  coloring: Uint8Array;
  /** The growing word: letters 0..alpha-1. */
  word: number[];
  /** 'point' = Constructor chooses a gap; 'insert' = Avoider inserts a letter at `gap`. */
  phase: 'point' | 'insert';
  /** During 'insert', the gap index (0..word.length) the Constructor pointed at. */
  gap: number | null;
  /** Constructor or Avoider once the game is over. */
  winner: Side | null;
  /** The first monochromatic adjacent pair, set on a Constructor win. */
  witness: Witness | null;
}

/** A move is either a gap index (point phase) or a letter to insert (insert phase). */
export type Move = number;
