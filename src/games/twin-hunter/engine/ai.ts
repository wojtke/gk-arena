// AI opponents (four levels), ported from the Python POC. Value convention (AVOIDER perspective):
//   +1 AVOIDER wins, -1 FORCER wins. AVOIDER maximises, FORCER minimises.
//   0 random · 1 greedy (1-ply: take an immediate win / avoid an immediate loss / count safe replies)
//   2 strong (depth-limited alpha-beta with a length heuristic)
//   3 solver (exact minimax with memoisation on small instances; falls back to level 2 when too big)

import { AILevel, AVOIDER, GameState, Move } from './types';
import { applyMove, currentPlayer, legalMoves } from './rules';

import { makeRng } from '../../../common/rng';
export { makeRng };

/** A key for memoisation: the sequence, phase, and pending gap. */
function stateKey(s: GameState): string {
  return s.seq.join(',') + '|' + s.phase + '|' + (s.gap ?? -1);
}

/** Heuristic in [0,1) mapped to (-,+): closer to target favours AVOIDER. */
function heuristic(s: GameState): number {
  return s.seq.length / s.config.n;
}

/** Thrown by solve() when the exact search exceeds its node budget; caller falls back to level 2. */
class SolverBudgetExceeded extends Error {}

/**
 * Hard cap on nodes the exact solver may visit before aborting (defends the UI thread). Memoisation
 * collapses the tree so aggressively that every instance the affordability gate admits finishes in a
 * few thousand nodes; 50k leaves ~20x headroom while keeping any pathological run well under a few
 * seconds even if the gate is somehow bypassed.
 */
const SOLVE_NODE_BUDGET = 50_000;

/**
 * Exact game value with memoisation: +1 AVOIDER wins, -1 FORCER wins.
 * `counter.n` accumulates visited nodes; throws SolverBudgetExceeded past SOLVE_NODE_BUDGET so the
 * search can never block the main thread regardless of the affordability gate.
 */
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

/**
 * Depth-limited alpha-beta with the length heuristic at the horizon and a transposition table
 * (keyed by stateKey + depth) per the Level-2 design. We only memoise EXACT values (those not
 * truncated by a cutoff) to stay sound under alpha-beta pruning.
 */
function minimax(
  s: GameState, depth: number, alpha: number, beta: number,
  cache: Map<string, number> = new Map(),
): number {
  if (s.winner) return s.winner === AVOIDER ? 1 : -1;
  if (depth === 0) return heuristic(s);
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
    if (!cutoff) cache.set(key, best); // exact value only
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, minimax(applyMove(s, m), depth - 1, alpha, beta, cache));
    beta = Math.min(beta, best);
    if (beta <= alpha) { cutoff = true; break; }
  }
  if (!cutoff) cache.set(key, best); // exact value only
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
      score = -1e9; // child.winner is the opponent (me already returned above) — avoid an immediate loss
    } else {
      // Minimise the opponent's safe replies: count the opponent's continuations that do NOT lose
      // to me, and prefer the move that leaves the fewest. This is symmetric and meaningful for
      // BOTH sides — in particular it lets the FORCER prefer a gap whose inserts force a tight twin
      // (winner === me === FORCER), which the previous formulation could never distinguish.
      const replies = legalMoves(child);
      const oppSafe = replies.reduce((acc, r) => acc + (applyMove(child, r).winner === me ? 0 : 1), 0);
      score = -oppSafe;
    }
    if (score > best) { best = score; pool = [m]; }
    else if (score === best) pool.push(m);
  }
  return pick(pool, rnd);
}

// --- level 2: strong (depth-limited alpha-beta) --- //
function strongMove(s: GameState, rnd: () => number, depth = 4): Move {
  const me = currentPlayer(s);
  const moves = legalMoves(s);
  const scored = moves.map(m => ({ m, v: minimax(applyMove(s, m), depth - 1, -Infinity, Infinity) }));
  const best = me === AVOIDER
    ? Math.max(...scored.map(x => x.v))
    : Math.min(...scored.map(x => x.v));
  return pick(scored.filter(x => x.v === best).map(x => x.m), rnd);
}

/** Budget on the (very rough) estimated number of leaves the exact solver may explore. */
const SOLVE_TREE_BUDGET = 2_000_000;

/**
 * Cheap upper bound on the search-tree size to decide whether the exact solver is affordable.
 * The real branching factor is (gaps)·(symbol fan-out) per *pair* of plies, where gaps grows as the
 * sequence does — the previous gate ignored the gap choice entirely and let the unbounded minimax
 * run (and freeze the UI) on words with k>=4 once `remaining` hit 7. We estimate the product over the
 * remaining inserts and compare against a fixed budget; the in-solver node cap (SOLVE_NODE_BUDGET) is
 * the hard backstop that guarantees termination even when this estimate is optimistic.
 */
function tooBigForSolver(s: GameState): boolean {
  const remaining = s.config.n - s.seq.length; // inserts left for the AVOIDER
  if (remaining <= 0) return false;
  const fan = s.config.variant === 'words' ? s.config.k : s.config.n; // symbol fan-out per insert
  // Each remaining insert is preceded by a FORCER gap choice; gaps grow from (len+1) upward.
  let est = 1;
  for (let i = 0; i < remaining; i++) {
    const gaps = s.seq.length + 1 + i; // gap choices available at this ply
    est *= gaps * fan;
    if (est > SOLVE_TREE_BUDGET) return true; // bail early to avoid overflow / wasted work
  }
  return est > SOLVE_TREE_BUDGET;
}

// --- level 3: solver (exact, memoised; falls back to level 2) --- //
function solverMove(s: GameState, rnd: () => number): Move {
  if (tooBigForSolver(s)) return strongMove(s, rnd, 5);
  const me = currentPlayer(s);
  const cache = new Map<string, number>();
  const counter = { n: 0 };
  try {
    const scored = legalMoves(s).map(m => ({ m, v: solve(applyMove(s, m), cache, counter) }));
    const target = me === AVOIDER ? 1 : -1;
    const winning = scored.filter(x => x.v === target).map(x => x.m);
    return pick(winning.length ? winning : scored.map(x => x.m), rnd);
  } catch (e) {
    if (e instanceof SolverBudgetExceeded) return strongMove(s, rnd, 5); // hard backstop
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

export { solve, minimax };
