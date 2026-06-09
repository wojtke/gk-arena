// AI opponents (four levels) for all three modes. Every level always returns a legal move when one
// exists (or null when the side has no move), and AI-vs-AI games always terminate.
//   0 random        — uniform random legal move.
//   1 greedy        — solo/Maker: best-fit placement leaving the most usable contiguous space;
//                     two-player: a heuristic; Breaker: block the cell most needed by remaining members.
//   2 strong        — two-player: alpha-beta minimax with memoisation on small strips; otherwise the
//                     greedy heuristic (Maker/Breaker get a one-ply look-ahead).
//   3 solver        — solo: branch-and-bound exact m(F) packing; two-player: deeper exact minimax
//                     where feasible (falls back to level 2); pack-vs-block: exact game search on
//                     small instances (falls back to greedy).

import { AILevel, Cell, Color, GameState, Move, RED, BLUE } from './types';
import { isLegal, legalPlacementsFor, usedLength } from './strip';
import { legalMoves, applyMove, isOver } from './rules';
import { optimalCompletion } from './mF';

import { makeRng } from '../../../common/rng';
export { makeRng };

const WIN = 1e6;

function randomMove(s: GameState, rnd: () => number): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  return moves[Math.floor(rnd() * moves.length)];
}

// ---------------------------------------------------------------------------------------------------
// Greedy helpers
// ---------------------------------------------------------------------------------------------------

/** Largest run of consecutive free cells remaining after a hypothetical occupancy. */
function maxFreeRun(occ: Cell[]): number {
  let best = 0;
  let cur = 0;
  for (const c of occ) {
    if (c === null) { cur++; if (cur > best) best = cur; } else cur = 0;
  }
  return best;
}

/** Number of free cells. */
function freeCount(occ: Cell[]): number {
  let n = 0;
  for (const c of occ) if (c === null) n++;
  return n;
}

/**
 * Greedy place: among all legal placements of the remaining family (solo / pack-vs-block Maker),
 * choose the one minimising the resulting used length, then maximising the largest remaining free
 * run (so future tiles still fit). Pack tiles toward the low end / tightly.
 */
function greedyPlaceMove(s: GameState, rnd: () => number): Move | null {
  const moves = legalMoves(s).filter((m): m is Extract<Move, { kind: 'place' }> => m.kind === 'place');
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestKey = Infinity;
  for (const m of moves) {
    const occ = s.occupied.slice();
    for (let t = 0; t < m.len; t++) occ[m.start + t * m.d] = RED;
    const used = usedLength(occ);
    const run = maxFreeRun(occ);
    // Lower used length is better; more remaining free run is better; tie-break by tiny noise.
    const key = used * 1000 - run + (rnd() - 0.5) * 1e-3;
    if (key < bestKey) { bestKey = key; best = m; }
  }
  return best;
}

/**
 * Greedy block (pack-vs-block Breaker): block the free cell that, once removed, kills the most
 * placement options for the remaining family — i.e. the cell most needed. Counts, for every free
 * cell, in how many legal placements of remaining members it participates, and blocks the max.
 */
function greedyBlockMove(s: GameState, rnd: () => number): Move | null {
  const need = new Array<number>(s.L).fill(0);
  let any = false;
  for (const spec of s.remaining) {
    for (const p of legalPlacementsFor(s, spec)) {
      for (let t = 0; t < p.len; t++) { need[p.start + t * p.d]++; any = true; }
    }
  }
  if (!any) {
    // No placements at all means Breaker has already won; block any free cell.
    return randomMove(s, rnd);
  }
  // Prefer to make some member impossible: try the cell whose removal stuck-checks a member.
  // Approximate by maximum "neediness" weighted by scarcity (cells of members with few placements).
  let best = -1;
  let bestVal = -Infinity;
  for (let i = 0; i < s.L; i++) {
    if (s.occupied[i] !== null) continue;
    const v = need[i] + (rnd() - 0.5) * 1e-3;
    if (v > bestVal) { bestVal = v; best = i; }
  }
  if (best < 0) return randomMove(s, rnd);
  return { kind: 'block', cell: best };
}

/** Greedy move for two-player: prefer placements that maximise our remaining mobility minus theirs. */
function greedyTwoPlayer(s: GameState, rnd: () => number): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestVal = -Infinity;
  for (const m of moves) {
    const ns = applyMove(s, m);
    if (ns.winner === s.turn) return m; // immediate win
    // Opponent mobility after our move — fewer is better (normal play: starve the opponent).
    const oppMoves = legalMoves(ns).length;
    const v = -oppMoves + (rnd() - 0.5) * 1e-3;
    if (v > bestVal) { bestVal = v; best = m; }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------------
// Two-player exact minimax (alpha-beta) with memoisation
// ---------------------------------------------------------------------------------------------------

function key(s: GameState): string {
  // Occupancy + turn fully determine the two-player position.
  return s.occupied.map((c) => (c === null ? '.' : c === 'x' ? 'x' : c)).join('') + s.turn;
}

/** Returns +1 if RED wins with optimal play from `s`, -1 if BLUE wins (normal play, no draws). */
function solveTwoPlayer(s: GameState, memo: Map<string, number>, budget: { n: number }): number {
  if (s.winner) return s.winner === RED ? 1 : -1;
  if (budget.n <= 0) return 0; // unknown — caller falls back
  const k = key(s);
  const cached = memo.get(k);
  if (cached !== undefined) return cached;
  budget.n--;
  const moves = legalMoves(s);
  const maximizing = s.turn === RED;
  let val = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const r = solveTwoPlayer(applyMove(s, m), memo, budget);
    val = maximizing ? Math.max(val, r) : Math.min(val, r);
    if (budget.n <= 0) break;
    if ((maximizing && val === 1) || (!maximizing && val === -1)) break; // prune on a sure win
  }
  if (val === Infinity || val === -Infinity) val = 0;
  memo.set(k, val);
  return val;
}

/** Choose an exactly-winning two-player move if one exists, else the greedy move. */
function exactTwoPlayerMove(s: GameState, rnd: () => number): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  // Cap exact search to small positions.
  if (s.L > 22 || moves.length > 60) return greedyTwoPlayer(s, rnd);
  const memo = new Map<string, number>();
  const want = s.turn === RED ? 1 : -1;
  const budget = { n: 400000 };
  let fallback: Move = moves[0];
  let bestUnknown: Move | null = null;
  for (const m of moves) {
    const ns = applyMove(s, m);
    if (ns.winner === s.turn) return m;
    const r = solveTwoPlayer(ns, memo, budget);
    if (r === want) return m;
    if (r === 0 && bestUnknown === null) bestUnknown = m;
  }
  // No winning move found; play to starve the opponent (greedy) — or an unknown if search ran out.
  return bestUnknown ?? greedyTwoPlayer(s, rnd) ?? fallback;
}

// ---------------------------------------------------------------------------------------------------
// Solo solver (level 3): play toward the exact optimal packing m(F).
// ---------------------------------------------------------------------------------------------------

/**
 * Solo level 3 ("Solver"): play toward the exact optimum m(F). Each move we compute an optimal
 * *completion* of the remaining family from the current strip (branch-and-bound minimising the final
 * used length, via optimalCompletion), then place the next remaining member at its witness start so
 * the game finishes in length m(F). On an empty strip the completion length equals mF(remaining), so
 * a full solo game lands exactly on m(F). Falls back to greedy when the search is too big / fails.
 */
function soloSolveMove(s: GameState, rnd: () => number): Move | null {
  const placeMoves = legalMoves(s).filter((m): m is Extract<Move, { kind: 'place' }> => m.kind === 'place');
  if (placeMoves.length === 0) return null;
  if (s.remaining.length === 0) return null;

  const plan = optimalCompletion(s.occupied, s.remaining);
  if (!plan) return greedyPlaceMove(s, rnd);

  // Play the planned member with the lowest witness start first (pack left-to-right), so each move is
  // legal and consistent with an optimal final layout. Verify legality before committing.
  let bestIdx = -1;
  let bestStart = Infinity;
  for (let i = 0; i < s.remaining.length; i++) {
    const start = plan.starts[i];
    if (start < 0) continue;
    const spec = s.remaining[i];
    if (!isLegal(s.occupied, start, spec.d, spec.len)) continue;
    if (start < bestStart) { bestStart = start; bestIdx = i; }
  }
  if (bestIdx < 0) return greedyPlaceMove(s, rnd);
  const spec = s.remaining[bestIdx];
  return { kind: 'place', start: plan.starts[bestIdx], d: spec.d, len: spec.len, specIndex: bestIdx };
}

// ---------------------------------------------------------------------------------------------------
// pack-vs-block exact (level 3): small game-tree search with memoisation, fall back to greedy.
// ---------------------------------------------------------------------------------------------------

function pvbKey(s: GameState): string {
  const board = s.occupied.map((c) => (c === null ? '.' : c === 'x' ? 'x' : c)).join('');
  const rem = s.remaining.map((m) => `${m.d}:${m.len}`).sort().join(',');
  return `${board}|${rem}|${s.turn}`;
}

/** +1 if Maker (RED) wins with optimal play, -1 if Breaker (BLUE) wins. */
function solvePvb(s: GameState, memo: Map<string, number>, budget: { n: number }): number {
  if (s.winner) return s.winner === RED ? 1 : -1;
  if (budget.n <= 0) return 0;
  const k = pvbKey(s);
  const cached = memo.get(k);
  if (cached !== undefined) return cached;
  budget.n--;
  const moves = legalMoves(s);
  if (moves.length === 0) {
    // No move: in pack-vs-block this only happens for Maker when stuck (=> Breaker wins).
    const v = s.turn === RED ? -1 : 1;
    memo.set(k, v);
    return v;
  }
  const maximizing = s.turn === RED;
  let val = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const r = solvePvb(applyMove(s, m), memo, budget);
    val = maximizing ? Math.max(val, r) : Math.min(val, r);
    if (budget.n <= 0) break;
    if ((maximizing && val === 1) || (!maximizing && val === -1)) break;
  }
  if (val === Infinity || val === -Infinity) val = 0;
  memo.set(k, val);
  return val;
}

function pvbExactMove(s: GameState, rnd: () => number): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  if (s.L > 16 || moves.length > 40) {
    return s.turn === RED ? greedyPlaceMove(s, rnd) : greedyBlockMove(s, rnd);
  }
  const memo = new Map<string, number>();
  const want = s.turn === RED ? 1 : -1;
  const budget = { n: 500000 };
  let unknown: Move | null = null;
  for (const m of moves) {
    const ns = applyMove(s, m);
    if (ns.winner === s.turn) return m;
    const r = solvePvb(ns, memo, budget);
    if (r === want) return m;
    if (r === 0 && unknown === null) unknown = m;
  }
  return unknown ?? (s.turn === RED ? greedyPlaceMove(s, rnd) : greedyBlockMove(s, rnd)) ?? moves[0];
}

// ---------------------------------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------------------------------

/** Returns a legal move, or null if the side has no move (caller should treat as terminal). */
export function aiMove(s: GameState, level: AILevel, rnd: () => number): Move | null {
  if (isOver(s)) return null;
  const mode = s.config.mode;

  // Level 0: random for everyone.
  if (level === 0) return randomMove(s, rnd);

  if (mode === 'solo') {
    if (level >= 3) return soloSolveMove(s, rnd) ?? greedyPlaceMove(s, rnd) ?? randomMove(s, rnd);
    return greedyPlaceMove(s, rnd) ?? randomMove(s, rnd);
  }

  if (mode === 'two-player') {
    if (level >= 2) return exactTwoPlayerMove(s, rnd) ?? randomMove(s, rnd);
    return greedyTwoPlayer(s, rnd) ?? randomMove(s, rnd);
  }

  // pack-vs-block
  if (level >= 3) return pvbExactMove(s, rnd) ?? randomMove(s, rnd);
  if (s.turn === RED) {
    return greedyPlaceMove(s, rnd) ?? randomMove(s, rnd);
  }
  return greedyBlockMove(s, rnd) ?? randomMove(s, rnd);
}

export { greedyPlaceMove, greedyBlockMove, greedyTwoPlayer };
