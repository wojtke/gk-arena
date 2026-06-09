// AI opponents (four levels) for VdW Duel. Value convention is FROM THE PERSPECTIVE OF THE PLAYER
// TO MOVE at the root: +∞ means that player is guaranteed to win, −∞ that they are guaranteed to
// lose. Because this is a misère avoidance game, "winning" means making the opponent complete an AP
// (or surviving to the W(2;k) cap, which cannot actually be reached without a loss first).
//
//   0 Easy   — random legal gap (may even lose on purpose)
//   1 Greedy — never play a gap that immediately completes your OWN k-AP if a safe gap exists; among
//              safe gaps, prefer ones that shrink the opponent's set of safe replies (1-ply)
//   2 Strong — depth-limited minimax; a forced loss = ±∞, leaf eval = (#safe gaps you keep) − (#safe
//              gaps opponent keeps)
//   3 Solver — exact memoised minimax for k=3 (≤9 plies); falls back to Strong for larger k

import { AILevel, GameState, Move, Owner } from './types';
import { applyMove, currentPlayer, isOver, legalMoves, other } from './rules';

import { makeRng } from '../../../common/rng';
export { makeRng };

const WIN = 1e9;
const LOSE = -1e9;

/** Memoisation key: the line colouring plus whose turn it is. */
function stateKey(s: GameState): string {
  return s.line.join('') + '|' + s.turn;
}

/** Count gaps that do NOT immediately make `who` lose, when `who` is the player to move in `s`. */
function safeReplyCount(s: GameState): number {
  let n = 0;
  for (const m of legalMoves(s)) {
    if (applyMove(s, m).loser !== s.turn) n++;
  }
  return n;
}

/**
 * Leaf evaluation from the perspective of `me` (the root mover): keep your own escape routes open and
 * close the opponent's. Positive favours `me`.
 */
function heuristic(s: GameState, me: Owner): number {
  // s.turn is whoever is to move at this node. Build the "my safe replies" count by checking from
  // each side's to-move viewpoint via a turn flip.
  const opp = other(me);
  const mySafe = countSafeFor(s, me);
  const oppSafe = countSafeFor(s, opp);
  return mySafe - oppSafe;
}

/** #gaps that would not immediately make `who` lose, evaluating as if `who` were to move now. */
function countSafeFor(s: GameState, who: Owner): number {
  if (s.turn === who) return safeReplyCount(s);
  return safeReplyCount({ ...s, turn: who });
}

/**
 * Exact game value from the perspective of the player to move at `s` (+WIN win / −WIN lose).
 * Misère: if a player has no legal move (the cap, unreachable in practice) it is a draw → 0.
 */
function solve(s: GameState, cache: Map<string, number>): number {
  if (isOver(s)) {
    // The game ended on the move INTO s, so the player to move here did not cause it.
    return s.loser === s.turn ? LOSE : WIN;
  }
  const moves = legalMoves(s);
  if (moves.length === 0) return 0;
  const key = stateKey(s);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let best = LOSE;
  for (const m of moves) {
    const child = applyMove(s, m);
    let v: number;
    if (isOver(child)) {
      // child is terminal: someone just lost. Good for the mover iff the mover is NOT the loser.
      v = child.loser === s.turn ? LOSE : WIN;
    } else {
      // value to the opponent (the mover of child) negated back to us.
      v = -solve(child, cache);
    }
    if (v > best) best = v;
    if (best >= WIN) break; // can't do better than a forced win
  }
  cache.set(key, best);
  return best;
}

/** Depth-limited minimax from the to-move perspective; ±WIN for forced results, heuristic at horizon. */
function minimax(s: GameState, depth: number): number {
  if (isOver(s)) return s.loser === s.turn ? LOSE : WIN;
  const moves = legalMoves(s);
  if (moves.length === 0) return 0;
  // heuristic is from the to-move player's perspective.
  if (depth === 0) return heuristic(s, s.turn);
  let best = LOSE;
  for (const m of moves) {
    const child = applyMove(s, m);
    let v: number;
    if (isOver(child)) {
      v = child.loser === s.turn ? LOSE : WIN;
    } else {
      v = -minimax(child, depth - 1);
    }
    if (v > best) best = v;
    if (best >= WIN) break;
  }
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
  const me = s.turn;
  const moves = legalMoves(s);
  // Partition into safe (don't immediately self-complete an AP) and unsafe.
  const safe: Move[] = [];
  const unsafe: Move[] = [];
  for (const m of moves) {
    const child = applyMove(s, m);
    if (child.loser === me) unsafe.push(m);
    else safe.push(m);
  }
  const pool = safe.length ? safe : unsafe; // never self-complete if a safe gap exists
  // Among the pool, prefer a move that also wins outright (opponent loses now), then one that
  // shrinks the opponent's safe replies.
  let best = -Infinity;
  let chosen: Move[] = [];
  for (const m of pool) {
    const child = applyMove(s, m);
    let score: number;
    if (child.loser && child.loser !== me) {
      score = 1e12; // immediate win: we shoved the opponent into an AP
    } else if (child.loser === me) {
      score = -1e12; // only happens when the whole pool is unsafe
    } else {
      // minimise opponent's safe replies (opponent is to move in child)
      score = -safeReplyCount(child);
    }
    if (score > best) { best = score; chosen = [m]; }
    else if (score === best) chosen.push(m);
  }
  return pick(chosen, rnd);
}

// --- level 2: strong (depth-limited minimax) --- //
function strongMove(s: GameState, rnd: () => number, depth = 5): Move {
  const me = s.turn;
  const moves = legalMoves(s);
  const scored = moves.map(m => {
    const child = applyMove(s, m);
    let v: number;
    if (isOver(child)) v = child.loser === me ? LOSE : WIN;
    else v = -minimax(child, depth - 1);
    return { m, v };
  });
  const best = Math.max(...scored.map(x => x.v));
  return pick(scored.filter(x => x.v === best).map(x => x.m), rnd);
}

// --- level 3: solver (exact for k=3, else fall back to strong) --- //
function solverMove(s: GameState, rnd: () => number): Move {
  if (s.config.k > 3) return strongMove(s, rnd, 6);
  const me = s.turn;
  const cache = new Map<string, number>();
  const scored = legalMoves(s).map(m => {
    const child = applyMove(s, m);
    let v: number;
    if (isOver(child)) v = child.loser === me ? LOSE : WIN;
    else v = -solve(child, cache);
    return { m, v };
  });
  const best = Math.max(...scored.map(x => x.v));
  const winning = scored.filter(x => x.v === best).map(x => x.m);
  return pick(winning, rnd);
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
