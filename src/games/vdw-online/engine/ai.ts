// AI opponents (four levels) for VdW Online (general per-colour form). Value convention (PAINTER
// perspective): +1 PAINTER (avoider) survives, -1 POINTER (forcer) wins. PAINTER maximises, POINTER
// minimises.
//   0 random
//   1 greedy (1-ply): Pointer maximises Painter's worst-case closeness to ANY k[i]; Painter minimises
//     the colours' summed closeness to their own k[i], weighting smaller k[i] harder.
//   2 strong (depth-limited alpha-beta; leaf eval Φ = Σ_live-AP r^-(k_i - filled))
//   3 solver (exact alpha-beta with memoisation on small n; else falls back to level 2)
//
// NOTE: online VdW has no clean Erdős–Selfridge theorem — the potential here is a HEURISTIC guide,
// not an exact danger bound (the board is revealed adaptively as the line grows). The diagonal case
// (all k[i] equal) reduces to plain online VdW.

import { AILevel, GameState, Move, PAINTER, POINTER } from './types';
import { applyMove, currentPlayer, legalMoves } from './rules';
import { longestApOfColor } from './detect';

import { makeRng } from '../../../common/rng';
export { makeRng };

/** A key for memoisation: the line, phase, and pending gap. */
function stateKey(s: GameState): string {
  return s.line.join(',') + '|' + s.phase + '|' + (s.gap ?? -1);
}

function pick(moves: Move[], rnd: () => number): Move {
  return moves[Math.floor(rnd() * moves.length)];
}

// ---------- potential Φ (Erdős–Selfridge flavoured, heuristic) ----------
// Sum over every "live" AP slot (a (start, step, colour) window of length k[colour] that is not yet
// blocked by a different colour) of r^-(k_i - filled): nearly-complete APs of short-threshold colours
// dominate. From the PAINTER's perspective a SMALLER Φ is safer, so we subtract Φ from length progress.
function potential(s: GameState): number {
  const line = s.line;
  const L = line.length;
  const r = s.config.r;
  const k = s.config.k;
  let phi = 0;
  for (let color = 0; color < r; color++) {
    const need = k[color];
    if (need < 1) continue;
    for (let start = 0; start < L; start++) {
      const maxStep = Math.floor((L - 1 - start) / Math.max(1, need - 1));
      for (let d = 1; d <= maxStep; d++) {
        let filled = 0;
        let blocked = false;
        for (let t = 0; t < need; t++) {
          const c = line[start + t * d];
          if (c === color) filled++;
          else { blocked = true; break; } // a different colour blocks this AP window
        }
        if (blocked || filled === 0) continue;
        phi += Math.pow(r, -(need - filled));
      }
    }
  }
  // PAINTER wants this small; return Painter-perspective value (higher = safer = more tokens placed).
  return s.line.length / s.config.n - phi;
}

/** Thrown by solve() when the exact search exceeds its node budget; caller falls back to level 2. */
class SolverBudgetExceeded extends Error {}

/** Hard cap on nodes the exact solver may visit before aborting (defends the UI thread). */
const SOLVE_NODE_BUDGET = 50_000;

/** Exact game value with memoisation: +1 PAINTER survives, -1 POINTER wins. */
function solve(s: GameState, cache: Map<string, number>, counter: { n: number } = { n: 0 }): number {
  if (s.winner) return s.winner === PAINTER ? 1 : -1;
  const key = stateKey(s);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (++counter.n > SOLVE_NODE_BUDGET) throw new SolverBudgetExceeded();
  const player = currentPlayer(s);
  const moves = legalMoves(s);
  let val = player === PAINTER ? -Infinity : Infinity;
  for (const m of moves) {
    const v = solve(applyMove(s, m), cache, counter);
    val = player === PAINTER ? Math.max(val, v) : Math.min(val, v);
  }
  cache.set(key, val);
  return val;
}

/**
 * Depth-limited alpha-beta with the potential leaf eval and a transposition table (keyed by
 * stateKey + depth). Only EXACT values (not cut off) are memoised, to stay sound under pruning.
 */
function minimax(
  s: GameState, depth: number, alpha: number, beta: number,
  cache: Map<string, number> = new Map(),
): number {
  if (s.winner) return s.winner === PAINTER ? 1 : -1;
  if (depth === 0) return potential(s);
  const key = stateKey(s) + '@' + depth;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const player = currentPlayer(s);
  const moves = legalMoves(s);
  let cutoff = false;
  if (player === PAINTER) {
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

// ---------- level 0: random ----------
function randomMove(s: GameState, rnd: () => number): Move {
  return pick(legalMoves(s), rnd);
}

// ---------- level 1: greedy (1-ply) ----------
// PAINTER: of the colours that do not lose immediately, choose the one minimising weighted closeness:
//   Σ_color (longestRun / k[color]) * (kMax / k[color])  — smaller k[color] is defended harder.
// POINTER: choose the gap whose worst Painter reply still leaves the Painter closest to losing, i.e.
//   maximise (over gaps) the Painter's worst-case (max over colours) closeness-to-some-k[i].
function closeness(s: GameState): number {
  const k = s.config.k;
  const kMax = Math.max(...k);
  let total = 0;
  for (let color = 0; color < s.config.r; color++) {
    const run = longestApOfColor(s.line, color);
    const weight = kMax / k[color]; // smaller threshold -> bigger weight
    total += (run / k[color]) * weight;
  }
  return total;
}

function greedyMove(s: GameState, rnd: () => number): Move {
  const me = currentPlayer(s);
  if (me === PAINTER) {
    let best = Infinity;
    let pool: Move[] = [];
    for (const m of legalMoves(s)) {
      const child = applyMove(s, m);
      // a colour that immediately hands the Pointer the win is worst-possible
      const score = child.winner === POINTER ? 1e9 : closeness(child);
      if (score < best) { best = score; pool = [m]; }
      else if (score === best) pool.push(m);
    }
    return pick(pool, rnd);
  }
  // POINTER: pick the gap maximising the Painter's worst-case closeness after best Painter reply.
  let best = -Infinity;
  let pool: Move[] = [];
  for (const m of legalMoves(s)) {
    const child = applyMove(s, m); // now paint phase
    if (child.winner === POINTER) return m; // an immediate win (single-colour edge cases)
    // the Painter will pick the colour MINIMISING closeness (best defence); the Pointer wants the gap
    // whose best defence is still as dangerous as possible.
    let painterBest = Infinity;
    for (const c of legalMoves(child)) {
      const g = applyMove(child, c);
      const sc = g.winner === POINTER ? 1e9 : closeness(g);
      painterBest = Math.min(painterBest, sc);
    }
    if (painterBest > best) { best = painterBest; pool = [m]; }
    else if (painterBest === best) pool.push(m);
  }
  return pick(pool, rnd);
}

// ---------- level 2: strong (depth-limited alpha-beta) ----------
function strongMove(s: GameState, rnd: () => number, depth = 4): Move {
  const me = currentPlayer(s);
  const scored = legalMoves(s).map(m => ({ m, v: minimax(applyMove(s, m), depth - 1, -Infinity, Infinity) }));
  const best = me === PAINTER
    ? Math.max(...scored.map(x => x.v))
    : Math.min(...scored.map(x => x.v));
  return pick(scored.filter(x => x.v === best).map(x => x.m), rnd);
}

/** Budget on the (very rough) estimated number of leaves the exact solver may explore. */
const SOLVE_TREE_BUDGET = 2_000_000;

/**
 * Cheap upper bound on the search tree to decide whether the exact solver is affordable. Each
 * remaining paint is preceded by a POINTER gap choice; gaps grow from (len+1) upward and the colour
 * fan-out is r. The in-solver node cap is the hard backstop if this estimate is optimistic.
 */
function tooBigForSolver(s: GameState): boolean {
  const remaining = s.config.n - s.line.length;
  if (remaining <= 0) return false;
  const fan = s.config.r;
  let est = 1;
  for (let i = 0; i < remaining; i++) {
    const gaps = s.line.length + 1 + i;
    est *= gaps * fan;
    if (est > SOLVE_TREE_BUDGET) return true;
  }
  return est > SOLVE_TREE_BUDGET;
}

// ---------- level 3: solver (exact, memoised; falls back to level 2) ----------
function solverMove(s: GameState, rnd: () => number): Move {
  if (tooBigForSolver(s)) return strongMove(s, rnd, 5);
  const me = currentPlayer(s);
  const cache = new Map<string, number>();
  const counter = { n: 0 };
  try {
    const scored = legalMoves(s).map(m => ({ m, v: solve(applyMove(s, m), cache, counter) }));
    const target = me === PAINTER ? 1 : -1;
    const winning = scored.filter(x => x.v === target).map(x => x.m);
    return pick(winning.length ? winning : scored.map(x => x.m), rnd);
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

export { solve, minimax, potential };
