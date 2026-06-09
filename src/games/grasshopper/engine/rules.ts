// Game rules for Grasshopper. Pure engine, no DOM.
//
// State machine per round:
//   build : Builder (the AVOIDER) owes `need = p + 3 − |W|` letters so the Grasshopper can reach BOTH
//           p+1 and p+2. need is 2 when the hopper is on the last letter, 1 when on the second-to-last.
//           Each move appends one letter (0..alpha-1); needLeft counts down; at needLeft 0 → 'hop'.
//           When owing 2 the Builder can make the two landable letters DIFFERENT so the Grasshopper
//           cannot always repeat — this is what restores two-sided agency (vs the degenerate form).
//   hop   : Grasshopper plays step 1 or 2; p += step; W[p] → S; if S now ends with a forbidden power
//           the Grasshopper wins (it FORCED the pattern); if |S| = d with no pattern the Builder wins
//           (it AVOIDED it to length d); otherwise phase → 'build' (recompute needLeft for the round).
//
// AVOIDANCE FORM: the literal win-direction is degenerate —
// the side that CHOOSES the letters (Builder) also wanting the pattern trivially forces it. So we
// flip the objective: the Builder AVOIDS the pattern (wins by reaching square-free length d) and the
// Grasshopper FORCES it (wins the instant S contains the forbidden power). Same actors, same hops.
//
// Start assumption (flagged in the explainer): the Builder chooses ALL letters and S starts empty
// (the hopper has not landed yet at p = -1).

import {
  BUILDER, GRASSHOPPER, GameConfig, GameState, Move, Role,
} from './types';
import { squareSuffixWitness } from './detect';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function letterChar(c: number): string {
  return c < 26 ? LETTERS[c] : `<${c}>`;
}

export function wordString(word: number[]): string {
  return word.map(letterChar).join('');
}

/** Letters the Builder must append so the hopper can reach p+1 AND p+2: need = p + 3 − |W|. */
export function need(s: GameState): number {
  return s.pos + 3 - s.word.length;
}

/** Initial state: Grasshopper "before" the word (p = -1), S empty, Builder owes need = 2 letters. */
export function newGame(config: GameConfig): GameState {
  const s: GameState = {
    config,
    word: [],
    pos: -1,
    inspected: [],
    phase: 'build',
    needLeft: 0,
    winner: null,
  };
  s.needLeft = need(s); // p=-1, |W|=0 → 2
  return s;
}

/** Whose turn it is at this (non-terminal) state: Builder (avoider) builds, Grasshopper (forcer) hops. */
export function currentPlayer(s: GameState): Role {
  return s.phase === 'build' ? BUILDER : GRASSHOPPER;
}

export function isOver(s: GameState): boolean {
  return s.winner !== null;
}

/** Legal moves: letters 0..alpha-1 in build; steps {1,2} in hop. */
export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  if (s.phase === 'build') return range(s.config.alpha);
  return [1, 2];
}

/** Apply a move, returning a fresh state. Returns the SAME state object if the move is illegal. */
export function applyMove(s: GameState, move: Move): GameState {
  if (s.winner) return s;
  if (s.phase === 'build') {
    if (move < 0 || move >= s.config.alpha) return s;
    const word = [...s.word, move];
    const needLeft = s.needLeft - 1;
    // Builder finished owing letters → hand off to the Grasshopper.
    const phase = needLeft <= 0 ? 'hop' : 'build';
    return { ...s, word, needLeft: Math.max(0, needLeft), phase };
  }

  // hop phase: step 1 or 2.
  if (move !== 1 && move !== 2) return s;
  const pos = s.pos + move;
  // The Builder always guarantees pos is a committed index (need accounting), so this is safe.
  const inspected = [...s.inspected, s.word[pos]];
  const next: GameState = {
    ...s, word: s.word, pos, inspected, phase: 'build', needLeft: 0,
  };

  // Grasshopper wins the instant it FORCES S to end with a forbidden power.
  const w = squareSuffixWitness(inspected, s.config.power);
  if (w) return { ...next, winner: GRASSHOPPER, witness: w };
  // Builder wins on AVOIDING the pattern up to the inspected-length target d (square-free).
  if (inspected.length >= s.config.d) return { ...next, winner: BUILDER };

  // Otherwise a new build round: recompute what the Builder now owes.
  return { ...next, needLeft: need(next) };
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Human-facing goal sentence for the current config. */
export function goalText(c: GameConfig): string {
  const patName = c.power === 2 ? 'a square XX' : `a ${c.power}th power x^${c.power}`;
  return `Grasshopper (red) hops +1/+2 to force ${patName} into the inspected word S; `
    + `Builder (blue) appends letters to keep S square-free and reach |S| = ${c.d}.`;
}
