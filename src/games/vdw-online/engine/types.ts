// Core types for VdW Online — the online Van der Waerden forcer/avoider game, in its general
// per-colour (off-diagonal) form. Each colour has its OWN target AP length k[i]; the diagonal case
// (plain VdW online) is just all k[i] equal.
//
// POINTER (player 1) points at a GAP in a growing line; PAINTER (player 2) places a token of a
// chosen colour there. Positions are line INDICES 1..L (insertion shifts everything to the right).
//   POINTER wins the instant some colour i holds a monochromatic AP of length >= k[i].
//   PAINTER (the avoider) wins by surviving to n tokens with no such AP.

/** A colour 0..r-1. */
export type Color = number;

/** 'point' = POINTER chooses a gap; 'paint' = PAINTER chooses a colour for that gap. */
export type Phase = 'point' | 'paint';

/** 'P' = Pointer (forcer), 'A' = Avoider (Painter). */
export type Role = 'P' | 'A';
/** Alias kept for parity with the off-diagonal naming this engine was merged from. */
export type Player = Role;
export const POINTER: Role = 'P';
export const PAINTER: Role = 'A';

export type AILevel = 0 | 1 | 2 | 3;

/** POINTER is the first/forcing side in the role select; PAINTER is the other. */
export type HumanRole = Role | 'both' | 'none';

export interface GameConfig {
  /** Number of colours r (>= 2). */
  r: number;
  /** Per-colour target AP length: colour i wins the Pointer at length k[i]. Diagonal = all equal. */
  k: number[];
  /** Token budget n. PAINTER wins on reaching length n. */
  n: number;
  humanRole: HumanRole;
  aiLevel: Record<Role, AILevel>;
  seed: number;
}

/** The completing monochromatic AP, carrying the offending colour for a colour-correct highlight. */
export interface Witness {
  /** The colour of the AP (0..r-1). */
  color: Color;
  /** Absolute line indices of the k[color]-AP. */
  idx: number[];
}

export interface GameState {
  config: GameConfig;
  /** Colours left-to-right; positions are line indices 0..line.length-1. */
  line: Color[];
  phase: Phase;
  /** During 'paint', the gap index (0..line.length) the POINTER chose. */
  gap: number | null;
  winner: Role | null;
  /** The completing monochromatic AP (indices + offending colour) for the win highlight. */
  witness: Witness | null;
}

/** A move is a gap index (point phase) or a colour (paint phase). */
export type Move = number;
