// AI opponents (four levels) for Ramsey Words. Value convention (AVOIDER perspective):
//   +1 AVOIDER wins, -1 CONSTRUCTOR wins. AVOIDER maximises, CONSTRUCTOR minimises.
//   0 random · 1 greedy (1-ply) · 2 strong (depth-limited alpha-beta) · 3 solver (exact memoised,
//   falls back to strong when the tree is too big).
//
// χ is part of the (immutable) state, so memo keys are just the word (+ phase + pending gap).

import { AILevel, AVOIDER, GameState, Move, Side } from './types';
import { applyMove, currentPlayer, legalMoves } from './rules';
import { findAdjacentMono } from './detect';

import { makeRng } from '../../../common/rng';
export { makeRng };

/** Memo key: the word (χ is immutable so it need not appear), the phase, and the pending gap. */
function stateKey(s: GameState): string {
  return s.word.join(',') + '|' + s.phase + '|' + (s.gap ?? -1);
}

/** Horizon heuristic in [0,1): closer to target favours the AVOIDER. */
function heuristic(s: GameState): number {
  return s.config.n ? s.word.length / s.config.n : 0;
}

/**
 * "Near-miss" pressure on the AVOIDER: count adjacent block PAIRS that are one letter from sharing a
 * colour, i.e. positions where exactly one of the 2l letters could be changed to match. Cheap proxy:
 * over the current word, count adjacent block boundaries where the two blocks differ in exactly one
 * position AND there exists a single-letter change making the colours equal. We approximate by simply
 * counting boundaries whose two blocks have Hamming distance 1 (overlapping/ tight pressure). Higher
 * = more dangerous for the AVOIDER, so it lowers the AVOIDER-perspective leaf value slightly.
 */
function nearMissPenalty(s: GameState): number {
  const { l, alpha } = s.config;
  const w = s.word;
  let near = 0;
  for (let i = 0; i + 2 * l <= w.length; i++) {
    let diff = 0;
    for (let j = 0; j < l; j++) if (w[i + j] !== w[i + l + j]) diff++;
    if (diff === 1) near++;
  }
  // map into a small [0, .25) discount so it never overrides a real win/loss or the length term
  return Math.min(near, alpha * l) * 0.01;
}

class SolverBudgetExceeded extends Error {}

/** Hard cap on nodes the exact solver may visit before aborting (defends the UI thread). */
const SOLVE_NODE_BUDGET = 60_000;

/** Exact game value with memoisation: +1 AVOIDER wins, -1 CONSTRUCTOR wins. */
function solve(s: GameState, cache: Map<string, number>, counter: { n: number } = { n: 0 }): number {
  if (s.winner) return s.winner === AVOIDER ? 1 : -1;
  const key = stateKey(s);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (++counter.n > SOLVE_NODE_BUDGET) throw new SolverBudgetExceeded();
  const player = currentPlayer(s);
  const moves = legalMoves(s);
  let val = player === AVOIDER ? -Infinity : Infinity;
  for (const m of moves) {
    const v = solve(applyMove(s, m), cache, counter);
    val = player === AVOIDER ? Math.max(val, v) : Math.min(val, v);
  }
  cache.set(key, val);
  return val;
}

/** Depth-limited alpha-beta with a length+near-miss heuristic at the horizon. Memoises exact values. */
function minimax(
  s: GameState, depth: number, alpha: number, beta: number,
  cache: Map<string, number> = new Map(),
): number {
  if (s.winner) return s.winner === AVOIDER ? 1 : -1;
  if (depth === 0) return heuristic(s) - nearMissPenalty(s);
  const key = stateKey(s) + '@' + depth;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const player = currentPlayer(s);
  const moves = legalMoves(s);
  let cutoff = false;
  if (player === AVOIDER) {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, minimax(applyMove(s, m), depth - 1, alpha, beta, cache));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) { cutoff = true; break; }
    }
    if (!cutoff) cache.set(key, best);
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, minimax(applyMove(s, m), depth - 1, alpha, beta, cache));
    beta = Math.min(beta, best);
    if (beta <= alpha) { cutoff = true; break; }
  }
  if (!cutoff) cache.set(key, best);
  return best;
}

function pick(moves: Move[], rnd: () => number): Move {
  return moves[Math.floor(rnd() * moves.length)];
}

// --- level 0: random --- //
function randomMove(s: GameState, rnd: () => number): Move {
  return pick(legalMoves(s), rnd);
}

// --- level 1: greedy (1-ply) --- //
function greedyMove(s: GameState, rnd: () => number): Move {
  const me = currentPlayer(s);
  let best = -Infinity;
  let pool: Move[] = [];
  for (const m of legalMoves(s)) {
    const child = applyMove(s, m);
    if (child.winner === me) return m; // take an immediate win
    let score: number;
    if (child.winner) {
      score = -1e9; // immediate loss for me — avoid
    } else {
      // Minimise the opponent's safe replies (continuations that do NOT immediately lose to me),
      // tie-broken by the near-miss pressure my move leaves. Symmetric for both sides:
      //  - CONSTRUCTOR prefers a gap whose inserts mostly create an adjacent mono pair;
      //  - AVOIDER prefers a letter that leaves the CONSTRUCTOR the fewest forcing gaps.
      const replies = legalMoves(child);
      const oppSafe = replies.reduce((acc, r) => acc + (applyMove(child, r).winner === me ? 0 : 1), 0);
      // near-miss: more near-misses help the CONSTRUCTOR, hurt the AVOIDER
      const press = nearMissPenalty(child);
      score = me === AVOIDER ? -oppSafe - press : -oppSafe + press;
    }
    if (score > best) { best = score; pool = [m]; }
    else if (score === best) pool.push(m);
  }
  return pick(pool, rnd);
}

// --- level 2: strong (depth-limited alpha-beta) --- //
function strongMove(s: GameState, rnd: () => number, depth = 5): Move {
  const me = currentPlayer(s);
  const moves = legalMoves(s);
  const scored = moves.map(m => ({ m, v: minimax(applyMove(s, m), depth - 1, -Infinity, Infinity) }));
  const best = me === AVOIDER
    ? Math.max(...scored.map(x => x.v))
    : Math.min(...scored.map(x => x.v));
  return pick(scored.filter(x => x.v === best).map(x => x.m), rnd);
}

/** Budget on the (rough) estimated search-tree size to decide whether the exact solver is affordable. */
const SOLVE_TREE_BUDGET = 2_000_000;

function tooBigForSolver(s: GameState): boolean {
  const remaining = s.config.n - s.word.length; // inserts left for the AVOIDER
  if (remaining <= 0) return false;
  const fan = s.config.alpha; // letter fan-out per insert
  let est = 1;
  for (let i = 0; i < remaining; i++) {
    const gaps = s.word.length + 1 + i; // gap choices available at this ply
    est *= gaps * fan;
    if (est > SOLVE_TREE_BUDGET) return true;
  }
  return est > SOLVE_TREE_BUDGET;
}

// --- level 3: solver (exact, memoised; falls back to level 2) --- //
function solverMove(s: GameState, rnd: () => number): Move {
  if (tooBigForSolver(s)) return strongMove(s, rnd, 6);
  const me = currentPlayer(s);
  const cache = new Map<string, number>();
  const counter = { n: 0 };
  try {
    const scored = legalMoves(s).map(m => ({ m, v: solve(applyMove(s, m), cache, counter) }));
    const target = me === AVOIDER ? 1 : -1;
    const winning = scored.filter(x => x.v === target).map(x => x.m);
    return pick(winning.length ? winning : scored.map(x => x.m), rnd);
  } catch (e) {
    if (e instanceof SolverBudgetExceeded) return strongMove(s, rnd, 6);
    throw e;
  }
}

export function aiMove(s: GameState, level: AILevel, rnd: () => number): Move {
  switch (level) {
    case 1: return greedyMove(s, rnd);
    case 2: return strongMove(s, rnd);
    case 3: return solverMove(s, rnd);
    default: return randomMove(s, rnd);
  }
}

export { solve, minimax, findAdjacentMono };
