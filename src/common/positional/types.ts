// Core types for Builder vs Painter — a generic Maker–Breaker positional game, instantiated as
// either the Van der Waerden game (arithmetic progressions on a line) or the Ramsey game
// (cliques on K_v). Maker = Red (forces, moves first), Breaker = Blue (blocks).

export type Color = 'R' | 'B';
export const MAKER: Color = 'R';
export const BREAKER: Color = 'B';

export type GameKind = 'vdw' | 'ramsey';
export type Mode = 'maker-breaker' | 'scoring';
export type AILevel = 0 | 1 | 2 | 3;

/**
 * A positional game: `cellCount` claimable elements and a family of `winningSets` (each a list of
 * cell indices). Maker wins by owning every cell of some winning set.
 *   VdW:    cells = integer positions 0…N-1; winning sets = k-term arithmetic progressions.
 *   Ramsey: cells = edges of K_v;            winning sets = edge-sets of all q-cliques.
 */
export interface Hypergraph {
  cellCount: number;
  winningSets: number[][];
}

export interface GameConfig {
  kind: GameKind;
  /** VdW: N positions. Ramsey: V vertices. */
  boardSize: number;
  /** VdW: AP length k. Ramsey: clique size q. */
  target: number;
  mode: Mode;
  humanRole: Color | 'both' | 'none';
  aiLevel: Record<Color, AILevel>;
  seed: number;
}

export interface GameState {
  config: GameConfig;
  hg: Hypergraph;
  owner: (Color | null)[];
  turn: Color;
  winner?: Color;
  /** The completed (or, at full board, best) winning set, for highlighting. */
  witness?: number[];
  /**
   * Scoring mode only: Maker's final score = the size of her largest live structure when the game
   * ends (out of `setSize`). Undefined in Maker–Breaker mode and while a scoring game is in play.
   */
  score?: number;
}

/** A move is the index of the cell being claimed. */
export type Move = number;
