// Core types for Grasshopper — a forbidden-pattern game with a grasshopper.
//
// The BUILDER (player 1, blue) appends letters to a word W. The GRASSHOPPER (player 2, red) hops
// forward over W by +1 or +2; the letters it LANDS ON, in order, form the inspected word S.
//
// AVOIDANCE FORM (the genuine game). The Grasshopper is the FORCER:
// it wins the instant S contains a forbidden pattern (a square XX, optionally a higher power xᵏ). The
// Builder is the AVOIDER: it wins when |S| reaches the target d with no pattern. (The literal
// direction — letter-chooser also forcing — is degenerate, so we flip the objective here.)
//
// Each round has two phases:
//   build : the Builder appends `need = p + 3 − |W|` letters ONE AT A TIME (each move chooses a
//           letter 0..alpha-1) until needLeft reaches 0; then phase → 'hop'.
//   hop   : the Grasshopper plays a step 1 or 2; p += step; W[p] is pushed to S; the square-suffix
//           test runs; then phase → 'build' and need is recomputed for the next round.
//
// A letter bypassed by a +2 hop is BEHIND p forever (hops are forward-only) and never landable
// again. The only lookahead that matters is the committed-but-unreached tail W[p+1 .. |W|-1] (≤ 2
// letters), which is what makes the position memoise compactly: (S, tail, phase, needLeft).

/** Side identity. We reuse the Red/Blue colour scheme of the other apps. */
export type Role = 'BUILDER' | 'GRASSHOPPER';
export const BUILDER: Role = 'BUILDER';
export const GRASSHOPPER: Role = 'GRASSHOPPER';

/** Colour convention shared with the other apps: BUILDER (avoider) = Blue, GRASSHOPPER (forcer) = Red. */
export type Color = 'R' | 'B';
export const colorOf = (r: Role): Color => (r === GRASSHOPPER ? 'R' : 'B');

export type AILevel = 0 | 1 | 2 | 3;

/** Which side the human plays, or hotseat / watch. */
export type HumanRole = Color | 'both' | 'none';

export type Phase = 'build' | 'hop';

export interface GameConfig {
  /** alphabet size |A| (default 3 — squares avoidable offline only for |A| ≥ 3). */
  alpha: number;
  /** inspected-length target d the Builder (avoider) tries to reach square-free. */
  d: number;
  /** pattern power k (2 = square XX, 3 = cube XXX, …). */
  power: number;
  humanRole: HumanRole;
  /** B = Builder AI level, R = Grasshopper AI level. */
  aiLevel: Record<Color, AILevel>;
  seed: number;
}

/**
 * A forbidden-pattern witness inside the inspected word S, given as a half-open range
 * [start, end) of S-positions; `block` is the length of one repeated block so the UI can split
 * the span into `power` tinted blocks.
 */
export interface Witness {
  start: number;
  end: number;
  block: number;
}

export interface GameState {
  config: GameConfig;
  /** W, the built word (letters 0..alpha-1). */
  word: number[];
  /** p, the Grasshopper's current index in W (start -1, "before" the word). */
  pos: number;
  /** S, the letters landed on, in order. */
  inspected: number[];
  /** 'build' → Builder appends `need` letters; 'hop' → Grasshopper picks +1/+2. */
  phase: Phase;
  /** letters the Builder still owes this round (counts down 1,0 or 2,1,0). */
  needLeft: number;
  winner: Role | null;
  /** the completing pattern in S (on a Grasshopper win) — for highlighting/pulsing. */
  witness?: Witness;
}

/** A move is a single number: a letter 0..alpha-1 (build) or a step 1/2 (hop). */
export type Move = number;
