// Core types for Twin Hunter — a forcer/avoider game on a growing sequence.
//
// FORCER (Blue) points at a gap; AVOIDER (Red) inserts a symbol there.
// FORCER wins the instant the sequence contains TIGHT TWINS — a factor that is a perfect shuffle
// of two disjoint EQUAL (words) or ORDER-ISOMORPHIC (permutations) copies, i.e. a shuffle square.
// AVOIDER wins by surviving to the target.
//
//   words: AVOIDER inserts a letter from a k-letter alphabet; target length n.
//   perm:  AVOIDER inserts an UNUSED number from 1..m; reaching all m placed = AVOIDER wins.

export type Role = 'AVOIDER' | 'FORCER';
export const AVOIDER: Role = 'AVOIDER';
export const FORCER: Role = 'FORCER';

export type Variant = 'words' | 'perm';
export type AILevel = 0 | 1 | 2 | 3;

/** AVOIDER is the human-"Red"/first side in the role select; FORCER is the other side. */
export type HumanRole = Role | 'both' | 'none';

export interface GameConfig {
  variant: Variant;
  /** words: alphabet size k. perm: range m (= target). */
  k: number;
  /** words: target length n. perm: m (= use all numbers 1..m). */
  n: number;
  /** Minimum length of EACH twin copy. words default 1; perm default 2. */
  minBlock: number;
  humanRole: HumanRole;
  aiLevel: Record<Role, AILevel>;
  seed: number;
}

/** The two interleaved copies of a witnessing shuffle square, for the two-colour reveal. */
export interface Witness {
  /** Factor range [start, end) within `seq`. */
  start: number;
  end: number;
  /** Absolute indices (into `seq`) of the first interleaved copy. */
  a: number[];
  /** Absolute indices (into `seq`) of the second interleaved copy. */
  b: number[];
}

export interface GameState {
  config: GameConfig;
  /** The growing sequence: letters 0..k-1 (words) or numbers 1..m (perm). */
  seq: number[];
  /** 'point' = FORCER chooses a gap; 'insert' = AVOIDER inserts a symbol at `gap`. */
  phase: 'point' | 'insert';
  /** During 'insert', the gap index (0..seq.length) the FORCER pointed at. */
  gap?: number;
  /** Whose turn it is to move now. */
  turn: Role;
  winner?: Role;
  witness?: Witness;
}

/** A move is either a gap index (point phase) or a symbol to insert (insert phase). */
export type Move = number;
