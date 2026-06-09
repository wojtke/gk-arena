// Game rules for VdW Duel — pure engine, no DOM.
//
// SINGLE-PHASE insertion: each move is a gap index 0..L; the colour placed is the CURRENT player's
// own colour (Red first). After inserting we re-scan BOTH colours for a k-AP, because the insertion
// re-indexes every token to the right of the gap and can therefore push the OPPONENT into an AP. The
// owner of a completed AP loses; a single move that completes both colours' APs loses for the MOVER.

import { BLUE, GameConfig, GameState, Move, Owner, RED } from './types';
import { findAP } from './detect';

/** The known diagonal Van der Waerden numbers W(2;k): the line cannot grow past W(2;k) tokens. */
export function vdw(k: number): number {
  switch (k) {
    case 1: return 1;
    case 2: return 3;
    case 3: return 9;
    case 4: return 35;
    case 5: return 178;
    default: return 35; // conservative fallback for unsupported k (only k=3,4 are exposed)
  }
}

/** Default safety cap on the line length: provably the game ends by W(2;k). */
export function defaultMaxLen(k: number): number {
  return vdw(k);
}

export function newGame(config: GameConfig): GameState {
  return { config, line: [], turn: RED, loser: null, winner: null, witness: null };
}

/** Whose move it is now. */
export function currentPlayer(s: GameState): Owner {
  return s.turn;
}

export const other = (o: Owner): Owner => (o === RED ? BLUE : RED);

/** Legal moves: every gap index 0..L while the game is live (none once it is over or at the cap). */
export function legalMoves(s: GameState): Move[] {
  if (isOver(s)) return [];
  if (s.line.length >= s.config.maxLen) return [];
  const out: Move[] = [];
  for (let g = 0; g <= s.line.length; g++) out.push(g);
  return out;
}

export function isOver(s: GameState): boolean {
  return s.loser !== null;
}

/**
 * Apply the current player's insertion at `gap`. Re-scans both colours afterward. The mover's
 * colour is checked FIRST so that a simultaneous double pins the loss on the mover.
 */
export function applyMove(s: GameState, gap: Move): GameState {
  if (isOver(s)) return s;
  if (gap < 0 || gap > s.line.length) return s;
  if (s.line.length >= s.config.maxLen) return s;

  const mover = s.turn;
  const line = [...s.line.slice(0, gap), mover, ...s.line.slice(gap)];
  const next: GameState = { ...s, line, turn: other(mover), loser: null, winner: null, witness: null };

  const k = s.config.k;
  // Check the mover's own colour first: a move completing both colours' APs loses for the mover.
  const opp = other(mover);
  const moverAP = findAP(line, mover, k);
  if (moverAP) {
    next.loser = mover;
    next.winner = opp;
    next.witness = moverAP;
    return next;
  }
  const oppAP = findAP(line, opp, k);
  if (oppAP) {
    next.loser = opp;
    next.winner = mover;
    next.witness = oppAP;
    return next;
  }
  return next;
}

/** Longest run toward a k-AP currently held by `who`: the largest m such that an m-AP exists. */
export function longestAP(line: Owner[], who: Owner, k: number): number {
  let best = 0;
  for (const i of line.keys()) if (line[i] === who) best = Math.max(best, 1);
  // search for the longest AP up to k (cheap at small L)
  for (let m = 2; m <= k; m++) {
    if (findAP(line, who, m)) best = Math.max(best, m);
  }
  return best;
}

export function goalText(c: GameConfig): string {
  return `Each player drops their own colour into the line. You LOSE the instant your colour forms a monochromatic ${c.k}-term arithmetic progression. The game always ends by W(2;${c.k}) = ${vdw(c.k)} tokens.`;
}
