// Core types for AP-Pack — a packing game on a 1-D strip of cells 0..L-1. Tiles are shifted copies
// of arithmetic progressions ("comb" tiles): an AP spec {d, len} placed at `start` occupies the
// cells { start + t*d : 0 <= t < len }. Three modes:
//   solo           — pack a fixed family F disjointly into the shortest used interval (vs m(F)).
//   two-player     — players alternately drop any legal AP tile (normal play: last to place wins).
//   pack-vs-block  — Maker (Red) places a fixed family F; Breaker (Blue) blocks one free cell/turn.

export type Mode = 'solo' | 'two-player' | 'pack-vs-block';

// In two-player both sides place tiles; in pack-vs-block Red = Maker (places), Blue = Breaker (blocks).
// In solo there is a single (Red) player.
export type Color = 'R' | 'B';
export const RED: Color = 'R';
export const BLUE: Color = 'B';

export type AILevel = 0 | 1 | 2 | 3;

/** An arithmetic-progression tile shape: `len` marks spaced `d` apart (d >= 1, len >= 1). */
export interface APSpec {
  d: number;
  len: number;
}

/** A concrete placement of an AP tile starting at `start`. `color` records who placed it (if any). */
export interface Placement {
  start: number;
  d: number;
  len: number;
  color?: Color;
}

/**
 * A cell is either free (`null`), blocked by Breaker (`'x'`), or owned by the player who placed a
 * tile covering it (`'R'` or `'B'`).
 */
export type Cell = Color | 'x' | null;

export interface GameConfig {
  mode: Mode;
  /** Strip length: cells 0..L-1. */
  L: number;
  /** Fixed family for solo / pack-vs-block. */
  family?: APSpec[];
  /** Allowed differences for two-player. */
  diffs?: number[];
  /** Allowed lengths for two-player. */
  lengths?: number[];
  /** R (human is first/Maker side), B (other side), 'both' hotseat, 'none' watch AI vs AI. */
  humanRole: Color | 'both' | 'none';
  aiLevel: Record<Color, AILevel>;
  seed: number;
}

export interface GameState {
  config: GameConfig;
  L: number;
  /** Owner array of length L. */
  occupied: Cell[];
  /** All tiles placed so far, in order. */
  placed: Placement[];
  /** Members of the family still to be placed (solo / pack-vs-block). */
  remaining: APSpec[];
  /** Whose turn it is. */
  turn: Color;
  /** Set when the game is decided. */
  winner?: Color;
  /** True when the solo puzzle has been fully (and optimally) packed / finished. */
  done?: boolean;
}

/**
 * A move is either placing a tile, or — in pack-vs-block — Breaker blocking a single cell.
 * For two-player and the Maker side, `kind` is `'place'`; for the Breaker side it is `'block'`.
 */
export type Move =
  | { kind: 'place'; start: number; d: number; len: number; specIndex?: number }
  | { kind: 'block'; cell: number };
