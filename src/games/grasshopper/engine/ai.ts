// AI opponents (four levels) for Grasshopper:
//   0 random   · 1 greedy (1-ply, safety-counting) · 2 strong (depth-limited alpha-beta)
//   3 solver   (exact alpha-beta, memoised on the COMPACT state; exact for small d, else Strong)
//
// Value convention everywhere: GRASSHOPPER wins (+1), BUILDER wins (-1). The Grasshopper maximises,
// the Builder minimises.
//
// AVOIDANCE FORM. The Grasshopper is the FORCER (a square in S is
// GOOD for it ⇒ +1), the Builder is the AVOIDER (a square is BAD for it; reaching square-free length
// d is its win ⇒ -1). So the orientation below is: the Grasshopper maximises square-risk (closing in
// on a forbidden suffix) while the Builder minimises it (keeps EVERY reachable hop-path square-free).
//
// Compact state. The value of a position depends only on:
//   (S, the committed-but-unreached lookahead tail W[p+1 .. |W|-1], phase, needLeft).
// A letter bypassed by a +2 hop is behind p forever (hops are forward-only) so it is irrelevant; the
// tail is ≤ 2 letters, so positions memoise well even though W grows without bound. We key the memo
// on (S, tail, phase, needLeft) — but, crucially, S only matters through its forbidden-suffix
// structure, so for the headline guaranteed-d question (the Builder/avoider's survival length,
// Grytczuk-style) we still cap by d.

import {
  BUILDER, GRASSHOPPER, GameState, Move, Role,
} from './types';
import {
  applyMove, currentPlayer, legalMoves,
} from './rules';


const WIN_GRASSHOPPER = 1;
const WIN_BUILDER = -1;

/** Pick one element of `arr` at random using `rnd`. */
function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

// --------------------------------------------------------------------------- //
// terminal value & heuristic                                                  //
// --------------------------------------------------------------------------- //

/** Exact value of a terminal state, or null if non-terminal. */
function terminalValue(s: GameState): number | null {
  if (s.winner === GRASSHOPPER) return WIN_GRASSHOPPER;
  if (s.winner === BUILDER) return WIN_BUILDER;
  return null;
}

/** How close is S to completing a forbidden power as a suffix (the Grasshopper's threat)? 0..1. */
function suffixThreat(s: GameState): number {
  const S = s.inspected;
  const power = s.config.power;
  let best = 0;
  // a block of length `block` is `r` blocks deep into a would-be x^power suffix.
  for (let block = 1; block * 2 <= S.length + 2; block++) {
    let reps = 1;
    let a = S.length - block;
    while (a - block >= 0 && blocksEqual(S, a - block, a, block)) { reps++; a -= block; }
    if (reps >= power) { best = 1; break; }
    best = Math.max(best, reps / power);
  }
  return best;
}

function blocksEqual(S: number[], a: number, b: number, len: number): boolean {
  for (let j = 0; j < len; j++) if (S[a + j] !== S[b + j]) return false;
  return true;
}

/**
 * Rough value in [-1,1] from the Grasshopper's (forcer's) view: near-squares are GOOD (the
 * Grasshopper is closing in on a forbidden suffix), while progress toward the square-free target d is
 * BAD (it means the Builder/avoider is winning the race). So threat is positive, progress negative.
 */
function heuristic(s: GameState): number {
  const t = terminalValue(s);
  if (t !== null) return t;
  const progress = s.inspected.length / s.config.d; // 0..~1, toward the Builder's square-free win
  const threat = suffixThreat(s); // 0..1, higher = Grasshopper closer to forcing a power
  return Math.max(-0.99, Math.min(0.99, threat * 1.0 - progress * 0.8));
}

// --------------------------------------------------------------------------- //
// depth-limited alpha-beta (level 2 strong)                                   //
// --------------------------------------------------------------------------- //

function minimax(s: GameState, depth: number, alpha: number, beta: number): number {
  const t = terminalValue(s);
  if (t !== null) return t;
  if (depth === 0) return heuristic(s);
  const me = currentPlayer(s);
  const moves = legalMoves(s);
  if (me === GRASSHOPPER) {
    let best = -2;
    for (const m of moves) {
      best = Math.max(best, minimax(applyMove(s, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = 2;
  for (const m of moves) {
    best = Math.min(best, minimax(applyMove(s, m), depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

// --------------------------------------------------------------------------- //
// exact memoised solver (level 3)                                             //
// --------------------------------------------------------------------------- //

/**
 * Compact memo key: (S, lookahead tail, phase, needLeft). The tail is the committed-but-unreached
 * letters W[p+1 ..]; bypassed letters behind p are dropped. Two positions with the same key have the
 * same exact value, so this keeps the solver tractable even though W grows.
 */
function compactKey(s: GameState): string {
  const tail = s.word.slice(s.pos + 1); // committed-but-unreached letters
  return `${s.inspected.join(',')}|${tail.join(',')}|${s.phase}|${s.needLeft}`;
}

/** Exact value under optimal play (+1 GRASSHOPPER / -1 BUILDER), memoised on the compact state. */
export function solve(s: GameState, cache: Map<string, number> = new Map()): number {
  const t = terminalValue(s);
  if (t !== null) return t;
  const key = compactKey(s);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const me = currentPlayer(s);
  let val = me === GRASSHOPPER ? -2 : 2;
  for (const m of legalMoves(s)) {
    const v = solve(applyMove(s, m), cache);
    if (me === GRASSHOPPER) {
      if (v > val) val = v;
      if (val === WIN_GRASSHOPPER) break; // best possible
    } else {
      if (v < val) val = v;
      if (val === WIN_BUILDER) break;
    }
  }
  cache.set(key, val);
  return val;
}

/**
 * Whether the exact solver is feasible here. The build sub-move branches `alpha` ways per owed
 * letter and the hop branches 2 ways; the depth is bounded by how much of S is still to be filled.
 * Thanks to the compact key the reachable state set is small for small d, so we gate on d (and
 * alpha) rather than a raw tree-size product.
 */
function solverFeasible(s: GameState): boolean {
  const remaining = s.config.d - s.inspected.length;
  if (remaining <= 0) return true;
  // distinct compact states ~ (alpha^tail) · (#distinct S of length ≤ d). Keep small instances exact.
  if (s.config.power >= 2 && s.config.alpha <= 4 && s.config.d <= 14) return true;
  if (s.config.alpha <= 3 && s.config.d <= 18) return true;
  return false;
}

// --------------------------------------------------------------------------- //
// greedy (level 1)                                                            //
// --------------------------------------------------------------------------- //

/**
 * Count of the opponent replies that do NOT immediately win for the opponent after `child` — i.e. how
 * many of the opponent's answers keep `me` alive. More = safer for `me`, so greedyMove (which always
 * MAXIMISES this score) prefers the move leaving the opponent the fewest winning replies. This is
 * role-symmetric: it is just as good for the avoider Builder as for the forcer Grasshopper.
 */
function safeReplyScore(child: GameState, me: Role): number {
  if (child.winner) return child.winner === me ? 1e6 : -1e6;
  const opp = me === GRASSHOPPER ? BUILDER : GRASSHOPPER;
  let safe = 0;
  for (const m of legalMoves(child)) {
    if (applyMove(child, m).winner !== opp) safe++;
  }
  return safe;
}

function greedyMove(s: GameState, rnd: () => number): Move {
  const me = currentPlayer(s);
  const moves = legalMoves(s);
  let best: number | null = null;
  let bestMoves: Move[] = [];
  for (const m of moves) {
    const child = applyMove(s, m);
    if (child.winner === me) return m; // immediate win
    let score = safeReplyScore(child, me);
    if (child.winner && child.winner !== me) score = -1e9; // immediate loss: avoid
    if (me === GRASSHOPPER) {
      // Grasshopper (forcer) prefers a landing letter that pushes S closer to a forbidden suffix.
      score += suffixThreat(child) * 0.5;
    } else {
      // Builder (avoider) prefers letters that keep S away from a forbidden suffix.
      score += (1 - suffixThreat(child)) * 0.5;
    }
    if (best === null || score > best) { best = score; bestMoves = [m]; }
    else if (score === best) bestMoves.push(m);
  }
  return bestMoves.length ? pick(bestMoves, rnd) : moves[0];
}

// --------------------------------------------------------------------------- //
// per-level move selection                                                    //
// --------------------------------------------------------------------------- //

function minimaxMove(s: GameState, rnd: () => number, depth = 8): Move {
  const me = currentPlayer(s);
  const moves = legalMoves(s);
  let best = me === GRASSHOPPER ? -Infinity : Infinity;
  let bestMoves: Move[] = [];
  for (const m of moves) {
    const v = minimax(applyMove(s, m), depth - 1, -2, 2);
    if (me === GRASSHOPPER ? v > best : v < best) { best = v; bestMoves = [m]; }
    else if (v === best) bestMoves.push(m);
  }
  return bestMoves.length ? pick(bestMoves, rnd) : moves[0];
}

function solverMove(s: GameState, rnd: () => number): Move {
  if (!solverFeasible(s)) return minimaxMove(s, rnd, 8); // fall back to Strong
  const me = currentPlayer(s);
  const target = me === GRASSHOPPER ? WIN_GRASSHOPPER : WIN_BUILDER;
  const cache = new Map<string, number>();
  const scored: { v: number; m: Move }[] = legalMoves(s).map((m) => ({
    v: solve(applyMove(s, m), cache), m,
  }));
  const winning = scored.filter((x) => x.v === target).map((x) => x.m);
  if (winning.length) return pick(winning, rnd);
  // losing anyway: play greedily to prolong / pose problems.
  return greedyMove(s, rnd);
}

/** Choose a move for the player to move under the given AI level. Always legal. */
export function aiMove(s: GameState, level: AILevelLike, rnd: () => number): Move {
  const moves = legalMoves(s);
  if (moves.length === 0) return 0;
  switch (level) {
    case 1: return greedyMove(s, rnd);
    case 2: return minimaxMove(s, rnd, 8);
    case 3: return solverMove(s, rnd);
    default: return pick(moves, rnd); // 0: random
  }
}

type AILevelLike = 0 | 1 | 2 | 3;

// --------------------------------------------------------------------------- //
// explanation (Hint / teaching)                                               //
// --------------------------------------------------------------------------- //

export interface Explanation {
  move: Move;
  text: string;
}

/**
 * A human-readable recommendation for the player to move. `forcedMove` (used by the AI overlay)
 * describes the precise move that will actually be played; without it (the Hint button) it
 * recommends a safe move where one exists.
 */
export function explainMove(
  s: GameState,
  rnd: () => number,
  level: AILevelLike = 3,
  forcedMove?: Move,
): Explanation | null {
  if (s.winner) return null;
  const me = currentPlayer(s);
  const move = forcedMove ?? aiMove(s, level, rnd);

  if (me === BUILDER) {
    // Builder is the AVOIDER: try to append a letter that no hop can turn into a forbidden suffix.
    const child = applyMove(s, move);
    const owed = s.needLeft;
    if (child.phase === 'hop') {
      const trapped = legalMoves(child).every((h) => applyMove(child, h).winner === GRASSHOPPER);
      if (trapped) {
        return { move, text: `Builder is cornered — after "${letterCharLocal(move)}" both grasshopper hops complete a forbidden power; no safe letter remains.` };
      }
    }
    return {
      move,
      text: `Builder appends "${letterCharLocal(move)}"${owed > 1 ? ` (${owed} letters owed this round — making them different denies the grasshopper a repeat)` : ''} to keep every reachable landing square-free.`,
    };
  }

  // Grasshopper is the FORCER: choose a hop that lands on a letter completing a square if possible.
  const winning = legalMoves(s).filter((m) => applyMove(s, m).winner === GRASSHOPPER);
  const all = legalMoves(s);
  if (winning.length) {
    const rec = winning.includes(move) ? move : winning[0];
    return { move: rec, text: `Grasshopper hops +${rec} — it lands on a letter that completes a forbidden power in S. Win!` };
  }
  return {
    move,
    text: `Grasshopper hops +${move} to extend a repeated block in S and manoeuvre toward forcing a ${s.config.power === 2 ? 'square' : 'power'}; no hop completes one yet.`,
  };
}

function letterCharLocal(c: number): string {
  return c < 26 ? 'abcdefghijklmnopqrstuvwxyz'[c] : `<${c}>`;
}

// expose a helper handy to tests; need/isOver/squareSuffixWitness already flow through `export *`.
export { suffixThreat };
