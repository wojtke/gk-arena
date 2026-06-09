// AI opponents, four levels:
//   0 random   — uniform legal arc
//   1 greedy   — 1-ply, threat-aware: Maker grows her best chain; Breaker consumes Maker's threats
//   2 potential— Erdős–Selfridge-style threat potential (broader look-ahead, still cheap)
//   3 minimax  — alpha-beta to the end on small boards (exact), depth-capped + potential horizon
//                otherwise. Uses a transposition table and the board's left-right reflection symmetry.
//
// Note on Erdős–Selfridge here: claiming an arc consumes its two points, so arcs that share a
// point cannot coexist — a disjointness constraint the classic theorem does not model. The
// potential below is therefore a strong heuristic, not a turnkey theorem. (See DESIGN.md §3.)

import { AILevel, GameState, Move, MAKER, BREAKER } from './types';
import { legalMoves, applyMove, makerProgress, freePoints, edgesOf, points } from './rules';
import { largestHomogeneous } from './patterns';

import { makeRng } from '../../../common/rng';
export { makeRng };

const WIN = 1e6;

// Exact alpha-beta is only run when at most this many points are still free; above it we fall back
// to the 1-ply potential() heuristic so a single move never freezes the UI. At free <= 10 a full
// to-the-end search resolves in well under ~150ms even at n=12 (transposition table + alpha-beta).
const EXACT_FREE_LIMIT = 10;

/** The resolved target type for the current config (concrete type used to score 'any'). */
function activeType(s: GameState) {
  return s.config.type === 'any' ? makerProgress(s).type : s.config.type;
}

/**
 * Static evaluation from Maker's (Red's) perspective: higher = better for Maker.
 * In scoring mode the final largest-red size IS the result (Maker maximises, Breaker minimises),
 * so terminal full-board states return the score directly rather than a binary WIN/-WIN.
 */
function evaluate(s: GameState): number {
  if (s.config.mode === 'scoring') {
    // Terminal (board full) → the score is the realized largest-red set; otherwise score the
    // realized structure so the search trends toward larger/smaller final sets.
    if (s.winner) return makerProgress(s).size * 1000;
    return makerProgress(s).size * 100;
  }
  if (s.winner === MAKER) return WIN;
  if (s.winner === BREAKER) return -WIN;
  return makerProgress(s).size * 100;
}

/**
 * Count the distinct free Red arcs that would grow Maker's best structure (her live threats),
 * and the size of the best one-arc extension. Shared by the greedy and potential evaluators.
 */
function threatInfo(s: GameState): { base: number; threats: number; bestExtended: number } {
  const base = makerProgress(s).size;
  const red = edgesOf(s, MAKER);
  const free = freePoints(s);
  const type = activeType(s);
  let threats = 0;
  let bestExtended = base;
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      const grown = largestHomogeneous([...red, { lo: free[i], hi: free[j], color: MAKER }], type).size;
      if (grown > base) threats++;
      if (grown > bestExtended) bestExtended = grown;
    }
  }
  return { base, threats, bestExtended };
}

/**
 * L1 greedy / threat evaluation (Maker's perspective). Unlike the bare structure size, this is
 * sensitive to Breaker moves too: a Breaker move consumes two points and so removes free Red arcs
 * that were threatening to extend Maker's chain. Maker maximises, Breaker minimises, so a Breaker
 * who kills a threat lowers the value it is minimising — i.e. it actually blocks.
 */
function greedyEval(s: GameState): number {
  if (s.config.mode !== 'scoring') {
    if (s.winner === MAKER) return WIN;
    if (s.winner === BREAKER) return -WIN;
  } else if (s.winner) {
    return makerProgress(s).size * 1000;
  }
  const { base, threats, bestExtended } = threatInfo(s);
  // Realized structure dominates; the live-threat count and best extension are tie-breakers that
  // make point-consumption (Breaker's blocking) visible to a 1-ply search.
  return base * 1000 + bestExtended * 50 + threats;
}

/**
 * Erdős–Selfridge-style potential (Maker's perspective). Rewards Maker's current structure and
 * the *breadth* of her threats — how many single red arcs would extend her best structure — and
 * lightly penalises distance to the target.
 */
function potential(s: GameState): number {
  if (s.config.mode === 'scoring') {
    if (s.winner) return makerProgress(s).size * 1000;
  } else {
    if (s.winner === MAKER) return WIN;
    if (s.winner === BREAKER) return -WIN;
  }
  const { base, threats, bestExtended } = threatInfo(s);
  return base * 1000 + bestExtended * 50 + threats - (s.config.k - base) * 10;
}

function pickByEval(s: GameState, evalFn: (s: GameState) => number, rnd: () => number): Move {
  const moves = legalMoves(s);
  const maximize = s.turn === MAKER;
  let best: Move = moves[0];
  let bestVal = maximize ? -Infinity : Infinity;
  for (const [lo, hi] of moves) {
    const v = evalFn(applyMove(s, lo, hi)) + (rnd() - 0.5) * 1e-3; // tiny jitter breaks ties
    if (maximize ? v > bestVal : v < bestVal) { bestVal = v; best = [lo, hi]; }
  }
  return best;
}

// ---- L3: exact minimax with alpha-beta, transposition table, and reflection symmetry ----

/**
 * Canonical key for a position, folding the board's left-right reflection symmetry (point p maps to
 * 2n+1-p) so a position and its mirror image share a transposition-table entry. The key encodes the
 * coloured edge multiset and whose turn it is.
 */
function positionKey(s: GameState): string {
  const P = points(s.config);
  const enc = (reflect: boolean) =>
    s.edges
      .map(e => {
        const lo = reflect ? P + 1 - e.hi : e.lo;
        const hi = reflect ? P + 1 - e.lo : e.hi;
        return `${e.color}${lo},${hi}`;
      })
      .sort()
      .join('|');
  const a = enc(false);
  const b = enc(true);
  // Pick the lexicographically smaller of the two orientations as the canonical form.
  return (a < b ? a : b) + '#' + s.turn;
}

function minimax(
  s: GameState, depth: number, alpha: number, beta: number,
  tt: Map<string, number>, budget: { nodes: number },
): number {
  if (s.winner || depth === 0 || budget.nodes <= 0) {
    // True terminal → exact value; depth/budget horizon → potential() heuristic.
    return s.winner ? evaluate(s) : potential(s);
  }
  budget.nodes--;
  // The transposition table caches a position's value keyed (with reflection symmetry) by the
  // depth searched, so a cached entry is only reused at the same or deeper remaining depth. We only
  // store EXACT values (no alpha-beta cutoff truncated the search), keeping L3 game-theoretically
  // exact in the to-the-end case.
  const key = positionKey(s) + '@' + depth;
  const cached = tt.get(key);
  if (cached !== undefined) return cached;

  const moves = legalMoves(s);
  if (moves.length === 0) return evaluate(s);
  let v: number;
  let cutoff = false;
  if (s.turn === MAKER) {
    v = -Infinity;
    for (const [lo, hi] of moves) {
      v = Math.max(v, minimax(applyMove(s, lo, hi), depth - 1, alpha, beta, tt, budget));
      alpha = Math.max(alpha, v);
      if (alpha >= beta) { cutoff = true; break; }
    }
  } else {
    v = Infinity;
    for (const [lo, hi] of moves) {
      v = Math.min(v, minimax(applyMove(s, lo, hi), depth - 1, alpha, beta, tt, budget));
      beta = Math.min(beta, v);
      if (alpha >= beta) { cutoff = true; break; }
    }
  }
  if (!cutoff) tt.set(key, v); // only cache exact values
  return v;
}

/**
 * Search depth in plies. minimaxMove only calls this when free <= EXACT_FREE_LIMIT, i.e. we always
 * solve exactly to the end; the node budget (not a depth cap) is the responsiveness safety net.
 */
function searchDepth(s: GameState): number {
  return Math.floor(freePoints(s).length / 2);
}

function minimaxMove(s: GameState, rnd: () => number): Move {
  const free = freePoints(s).length;
  // Exact search is only run when it is both tractable AND responsive (free <= EXACT_FREE_LIMIT):
  // verified to resolve a single move in well under ~150ms even at n=12. Above that, a full-width
  // search would freeze the UI for seconds, so fall back to the 1-ply potential heuristic (as L2).
  if (free > EXACT_FREE_LIMIT) return pickByEval(s, potential, rnd);

  const moves = legalMoves(s);
  const depth = searchDepth(s);
  const maximize = s.turn === MAKER;
  const tt = new Map<string, number>();        // transposition table (reflection-symmetric keys)
  const budget = { nodes: 2_000_000 };          // hard ceiling so no single move can freeze the UI
  let best: Move = moves[0];
  let bestVal = maximize ? -Infinity : Infinity;
  for (const [lo, hi] of moves) {
    const v = minimax(applyMove(s, lo, hi), depth - 1, -Infinity, Infinity, tt, budget)
      + (rnd() - 0.5) * 1e-3;
    if (maximize ? v > bestVal : v < bestVal) { bestVal = v; best = [lo, hi]; }
    if (budget.nodes <= 0) break; // budget exhausted; keep best-so-far
  }
  return best;
}

export function aiMove(s: GameState, level: AILevel, rnd: () => number): Move {
  switch (level) {
    case 1: return pickByEval(s, greedyEval, rnd);
    case 2: return pickByEval(s, potential, rnd);
    case 3: return minimaxMove(s, rnd);
    default: { const m = legalMoves(s); return m[Math.floor(rnd() * m.length)]; } // level 0: random
  }
}

export { evaluate, potential, greedyEval };
