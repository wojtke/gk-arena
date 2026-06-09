// AI opponents (four levels). Value convention (AVOIDER perspective):
//   +1 AVOIDER wins, -1 CONSTRUCTOR wins. AVOIDER maximises, CONSTRUCTOR minimises.
//   0 random · 1 greedy (1-ply: take an immediate win / avoid an immediate loss / count near-repeats)
//   2 strong (depth-limited alpha-beta with a near-repeat leaf heuristic)
//   3 solver (exact minimax with memoisation on small instances; falls back to level 2 when too big)

import { AILevel, AVOIDER, GameState, Move } from './types';
import { applyMove, currentPlayer, legalMoves } from './rules';

import { makeRng } from '../../../common/rng';
export { makeRng };

/** A key for memoisation: the word, phase, and pending gap. */
function stateKey(s: GameState): string {
  return s.word.join(',') + '|' + s.phase + '|' + (s.gap ?? -1);
}

/**
 * Count "near-repeats": k-block runs in which two equal-length blocks differ in exactly one position
 * (one letter away from a duplicate). High count = the CONSTRUCTOR is close to forcing a bad config,
 * so the AVOIDER wants this LOW and the CONSTRUCTOR wants it HIGH. Cheap and game-sized.
 */
function nearRepeats(word: readonly number[], k: number): number {
  const len = word.length;
  let count = 0;
  const maxM = Math.floor(len / k);
  for (let m = 1; m <= maxM; m++) {
    for (let s = 0; s + k * m <= len; s++) {
      for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
          let diff = 0;
          for (let t = 0; t < m && diff <= 1; t++) {
            if (word[s + i * m + t] !== word[s + j * m + t]) diff++;
          }
          if (diff === 1) count++;
        }
      }
    }
  }
  return count;
}

/**
 * Heuristic in (-1, 1), AVOIDER perspective: progress toward the target rewards the AVOIDER, while
 * near-repeats push toward the CONSTRUCTOR. Bounded so it never dominates a true win/loss (+/-1).
 */
function heuristic(s: GameState): number {
  const progress = s.config.n ? s.word.length / s.config.n : 0;       // 0..1
  const danger = nearRepeats(s.word, s.config.k);
  return 0.9 * progress - 0.45 * (1 - 1 / (1 + danger)); // danger in (0, 0.45)
}

/** Thrown by solve() when the exact search exceeds its node budget; caller falls back to level 2. */
class SolverBudgetExceeded extends Error {}

/** Hard cap on nodes the exact solver may visit before aborting (defends the UI thread). */
const SOLVE_NODE_BUDGET = 50_000;

/**
 * Exact game value with memoisation: +1 AVOIDER wins, -1 CONSTRUCTOR wins.
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
 * Depth-limited alpha-beta with the near-repeat heuristic at the horizon and a transposition table
 * (keyed by stateKey + depth). Only EXACT values (not truncated by a cutoff) are memoised, to stay
 * sound under pruning.
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
      score = -1e9; // child.winner is the opponent — avoid an immediate loss
    } else if (s.phase === 'insert') {
      // AVOIDER's own letter choice: prefer the inserted word with the FEWEST near-repeats so the
      // CONSTRUCTOR has the least leverage afterwards (greedy avoid + minimise near-repeats).
      score = -nearRepeats(child.word, s.config.k);
    } else {
      // CONSTRUCTOR's gap choice: minimise the AVOIDER's safe replies (gaps after which every
      // letter loses are perfect), then MAXIMISE the worst-case near-repeat over safe replies so the
      // forcer keeps the most pressure. Encodes "fewest letters that keep all runs distinct".
      const replies = legalMoves(child);
      let safe = 0;
      let worstNear = -1; // max near-repeats among the avoider's surviving replies
      for (const r of replies) {
        const gc = applyMove(child, r);
        if (gc.winner === me) continue; // a losing-for-avoider reply: good for the forcer
        safe++;
        worstNear = Math.max(worstNear, nearRepeats(gc.word, s.config.k));
      }
      // primary: fewer safe replies (negate); secondary tie-break: more near-repeats kept alive
      score = -safe * 1000 + worstNear;
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
 * Cheap upper bound on the search-tree size to decide whether the exact solver is affordable. Each
 * remaining insert is preceded by a CONSTRUCTOR gap choice (gaps grow as the word does); the symbol
 * fan-out is alpha. The in-solver node cap is the hard backstop if this estimate is optimistic.
 */
function tooBigForSolver(s: GameState): boolean {
  const remaining = s.config.n - s.word.length;
  if (remaining <= 0) return false;
  const fan = s.config.alpha;
  let est = 1;
  for (let i = 0; i < remaining; i++) {
    const gaps = s.word.length + 1 + i;
    est *= gaps * fan;
    if (est > SOLVE_TREE_BUDGET) return true;
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
    // Lost position (no winning move): play best-effort to prolong rather than picking randomly,
    // since a uniform random pick can lose immediately when another move survives longer.
    return winning.length ? pick(winning, rnd) : greedyMove(s, rnd);
  } catch (e) {
    if (e instanceof SolverBudgetExceeded) return strongMove(s, rnd, 5);
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

export { solve, minimax, nearRepeats };
