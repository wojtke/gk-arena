// Core types for Arc Match. The engine is pure (no DOM) so it can be unit-tested
// and reused by both the UI and the headless simulation harness.

/** Red = Maker (always moves first), Blue = Breaker. */
export type Color = 'R' | 'B';
export const MAKER: Color = 'R';
export const BREAKER: Color = 'B';

/** The three ways two disjoint arcs can relate on a line. */
export type Pattern = 'crossing' | 'nesting' | 'alignment';

/** The structure Maker is trying to build (a single pattern, or any one of them). */
export type TargetType = Pattern | 'any';

export type Mode = 'maker-breaker' | 'scoring';
export type AILevel = 0 | 1 | 2 | 3;

/** An arc connecting two points, owned by a player. Always lo < hi. */
export interface Edge {
  lo: number;
  hi: number;
  color: Color;
}

export interface GameConfig {
  /** Number of arcs at a full board; the line has 2·n points (1 … 2n). */
  n: number;
  /** Target size: Maker wins on k mutually-`type` red arcs. */
  k: number;
  type: TargetType;
  mode: Mode;
  /** Which side(s) the human controls; 'none' = AI vs AI. Maker is always Red and first. */
  humanRole: Color | 'both' | 'none';
  /** AI difficulty per colour (used when that colour is not human). */
  aiLevel: Record<Color, AILevel>;
  seed: number;
}

export interface GameState {
  config: GameConfig;
  edges: Edge[];
  /** used[p] is true once point p (1-indexed) is an endpoint of some arc. */
  used: boolean[];
  turn: Color;
  winner?: Color;
  /** The witnessing homogeneous set once the game ends (for highlighting). */
  witness?: Edge[];
  /** The winning/decisive pattern type once the game ends. */
  witnessType?: Pattern;
  /** Scoring mode only: the final largest homogeneous Red set size once the board fills. */
  score?: number;
}

export type Move = [number, number];
