// Core types for Different Blocks — a forcer/avoider game on a growing word.
//
// CONSTRUCTOR (C) points at a gap; AVOIDER (A) inserts a letter there.
// CONSTRUCTOR wins the instant the word contains a BAD CONFIGURATION: k equal-length adjacent blocks
// B_0..B_{k-1} (each length m >= 1) of which two are identical (B_i = B_j, i != j).
// AVOIDER wins by surviving to target length n with every such k-block run pairwise distinct.
//
// At k = 2 the bad pattern "two adjacent equal-length equal blocks" is exactly a SQUARE XX, so the
// engine coincides with the square game; the default k = 3 is the new content.

export type Role = 'C' | 'A';
export const CONSTRUCTOR: Role = 'C';
export const AVOIDER: Role = 'A';

export type AILevel = 0 | 1 | 2 | 3;

/** Human side select: Constructor, Avoider, hotseat ('both'), or watch AI vs AI ('none'). */
export type HumanRole = Role | 'both' | 'none';

export interface GameConfig {
  /** Alphabet size |A| (letters 0..alpha-1). Kept >= k by default (else m=1 is forced). */
  alpha: number;
  /** Number of adjacent equal-length blocks in a run; default 3, k=2 == square game. */
  k: number;
  /** Target word length n; AVOIDER wins on reaching it with no bad config. */
  n: number;
  humanRole: HumanRole;
  aiLevel: Record<Role, AILevel>;
  seed: number;
}

/** The first duplicate block pair witnessing a bad configuration (for the highlight). */
export interface Witness {
  /** Start index (into the word) of block B_0 of the k-block run. */
  start: number;
  /** Common block length m. */
  m: number;
  /** Index (0..k-1) of the first equal block. */
  i: number;
  /** Index (0..k-1) of the second equal block (j > i). */
  j: number;
}

export interface GameState {
  config: GameConfig;
  /** The growing word: letters 0..alpha-1. */
  word: number[];
  /** 'point' = CONSTRUCTOR chooses a gap; 'insert' = AVOIDER inserts a letter at `gap`. */
  phase: 'point' | 'insert';
  /** During 'insert', the gap index (0..word.length) the CONSTRUCTOR pointed at. */
  gap?: number;
  /** Whose turn it is to move now. */
  turn: Role;
  winner?: Role;
  witness?: Witness;
}

/** A move is either a gap index (point phase) or a letter to insert (insert phase). */
export type Move = number;
