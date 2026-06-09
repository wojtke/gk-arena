// Core types for Thue Arena — a two-player word game. AVOIDER (Ann, Red) keeps the word
// repetition-free; FORCER (Ben, Blue) tries to force a forbidden repetition.
//
// Two game kinds:
//   append : players alternately append one letter to the end; AVOIDER plays on even length,
//            FORCER on odd; AVOIDER wins by reaching target length n repetition-free.
//   online : each round FORCER points at an insertion gap (0..len), then AVOIDER inserts a letter
//            at that gap; AVOIDER wins by reaching length n repetition-free.

/** Side identity. We reuse the Red/Blue colour scheme of the other apps. */
export type Role = 'AVOIDER' | 'FORCER';
export const AVOIDER: Role = 'AVOIDER';
export const FORCER: Role = 'FORCER';

/** Colour convention shared with the other apps: AVOIDER (Ann) = Red, FORCER (Ben) = Blue. */
export type Color = 'R' | 'B';
export const colorOf = (r: Role): Color => (r === AVOIDER ? 'R' : 'B');

export type GameKind = 'append' | 'online';

/**
 * Repetition notion the terminal test forbids:
 *   square      — any factor XX (period p, |X| >= 1)
 *   nontrivial  — XX with |X| >= 2 (trivial squares aa are allowed)
 *   overlap     — a factor a X a X a (period p with one extra matching letter): w[i..i+2p] equal
 *                 to its shift, length 2p+1
 *   abelian     — XY with Y a permutation (anagram) of X, |X| >= 1
 */
export type RepMode = 'square' | 'nontrivial' | 'overlap' | 'abelian';

export type AILevel = 0 | 1 | 2 | 3;

export interface GameConfig {
  game: GameKind;
  /** alphabet size (number of usable letters). */
  k: number;
  /** target word length the AVOIDER tries to reach. */
  n: number;
  repMode: RepMode;
  humanRole: Color | 'both' | 'none';
  aiLevel: Record<Color, AILevel>;
  seed: number;
}

/**
 * A factor of the word, given as a half-open range [start, end) of letter positions.
 * For a repetition the witness covers the WHOLE offending factor (both equal blocks); `period`
 * is the length of one block so the UI can split it into two tinted halves.
 */
export interface Witness {
  start: number;
  end: number;
  period: number;
}

export interface GameState {
  config: GameConfig;
  word: number[];
  /**
   * append: always 'move' (the current player appends a letter).
   * online: 'point' (FORCER chooses a gap) then 'insert' (AVOIDER inserts a letter at gap).
   */
  phase: 'move' | 'point' | 'insert';
  /** online: the gap chosen during 'insert'. */
  gap: number | null;
  winner?: Role;
  /** the offending repetition (on a FORCER win) — for highlighting/pulsing. */
  witness?: Witness;
}

/** A move is either a letter to play (append/insert) or a gap index (online point phase). */
export type Move = number;
