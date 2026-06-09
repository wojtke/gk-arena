// AI opponents (four levels). Because this is a genuine positional game on a fixed ground set with
// predefined winning sets, the Erdős–Selfridge potential applies *cleanly* here (no disjointness
// caveat): Φ = Σ over winning sets A with no Breaker cell of 2^-(|A| − Maker-owned-in-A).
//   0 random · 1 greedy (progress) · 2 Erdős–Selfridge potential · 3 minimax (small boards)

import { AILevel, GameState, Move, MAKER, BREAKER } from './types';
import { legalMoves, applyMove, makerProgress } from './rules';

import { makeRng } from '../rng';
export { makeRng };

const WIN = 1e6;

/** Simple eval (Maker perspective): how close Maker's best live set is to completion. */
function evaluateSimple(s: GameState): number {
  if (s.winner === MAKER) return WIN;
  if (s.winner === BREAKER) return -WIN;
  return makerProgress(s).size * 100;
}

/** Erdős–Selfridge potential (Maker perspective). */
function phi(s: GameState): number {
  if (s.winner === MAKER) return WIN;
  if (s.winner === BREAKER) return -WIN;
  let total = 0;
  for (const set of s.hg.winningSets) {
    let mk = 0;
    let blocked = false;
    for (const c of set) {
      const o = s.owner[c];
      if (o === BREAKER) { blocked = true; break; }
      if (o === MAKER) mk++;
    }
    if (!blocked) total += 2 ** -(set.length - mk);
  }
  return total;
}

function pickByEval(s: GameState, evalFn: (s: GameState) => number, rnd: () => number): Move {
  const moves = legalMoves(s);
  const maximize = s.turn === MAKER;
  let best: Move = moves[0];
  let bestVal = maximize ? -Infinity : Infinity;
  for (const m of moves) {
    const v = evalFn(applyMove(s, m)) + (rnd() - 0.5) * 1e-6;
    if (maximize ? v > bestVal : v < bestVal) { bestVal = v; best = m; }
  }
  return best;
}

function minimax(s: GameState, depth: number, alpha: number, beta: number): number {
  if (s.winner || depth === 0) return phi(s);
  const moves = legalMoves(s);
  if (moves.length === 0) return phi(s);
  if (s.turn === MAKER) {
    let v = -Infinity;
    for (const m of moves) {
      v = Math.max(v, minimax(applyMove(s, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, v);
      if (alpha >= beta) break;
    }
    return v;
  }
  let v = Infinity;
  for (const m of moves) {
    v = Math.min(v, minimax(applyMove(s, m), depth - 1, alpha, beta));
    beta = Math.min(beta, v);
    if (alpha >= beta) break;
  }
  return v;
}

function minimaxMove(s: GameState, rnd: () => number): Move {
  const free = legalMoves(s);
  if (free.length > 9) return pickByEval(s, phi, rnd); // exact solve only on small boards
  const depth = free.length; // solve to the end
  const maximize = s.turn === MAKER;
  let best: Move = free[0];
  let bestVal = maximize ? -Infinity : Infinity;
  for (const m of free) {
    const v = minimax(applyMove(s, m), depth - 1, -Infinity, Infinity) + (rnd() - 0.5) * 1e-6;
    if (maximize ? v > bestVal : v < bestVal) { bestVal = v; best = m; }
  }
  return best;
}

export function aiMove(s: GameState, level: AILevel, rnd: () => number): Move {
  switch (level) {
    case 1: return pickByEval(s, evaluateSimple, rnd);
    case 2: return pickByEval(s, phi, rnd);
    case 3: return minimaxMove(s, rnd);
    default: { const m = legalMoves(s); return m[Math.floor(rnd() * m.length)]; } // 0: random
  }
}

export { phi, evaluateSimple };
