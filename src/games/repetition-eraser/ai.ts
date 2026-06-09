// AI levels: 0 random · 1 greedy (best resulting length) · 2 deeper greedy · 3 minimax.

import { AILevel, GameState, GROWER, legalMoves, applyMove } from './engine';

import { makeRng } from '../../common/rng';
export { makeRng };

const WIN = 1e6;

/** Grower (Red) perspective: higher = longer word = better for the Grower. */
function evaluate(s: GameState): number {
  if (s.winner === GROWER) return WIN;
  if (s.winner && s.winner !== GROWER) return -WIN;
  return s.word.length * 100 - s.round;
}

function pickByEval(s: GameState, depth: number, rnd: () => number): number {
  const moves = legalMoves(s);
  const maximize = s.turn === GROWER;
  let best = moves[0];
  let bestVal = maximize ? -Infinity : Infinity;
  for (const m of moves) {
    const v = (depth > 1 ? minimax(applyMove(s, m), depth - 1, -Infinity, Infinity) : evaluate(applyMove(s, m)))
      + (rnd() - 0.5) * 1e-3;
    if (maximize ? v > bestVal : v < bestVal) { bestVal = v; best = m; }
  }
  return best;
}

function minimax(s: GameState, depth: number, alpha: number, beta: number): number {
  if (s.winner || depth === 0) return evaluate(s);
  const moves = legalMoves(s);
  if (s.turn === GROWER) {
    let v = -Infinity;
    for (const m of moves) { v = Math.max(v, minimax(applyMove(s, m), depth - 1, alpha, beta)); alpha = Math.max(alpha, v); if (alpha >= beta) break; }
    return v;
  }
  let v = Infinity;
  for (const m of moves) { v = Math.min(v, minimax(applyMove(s, m), depth - 1, alpha, beta)); beta = Math.min(beta, v); if (alpha >= beta) break; }
  return v;
}

function searchDepth(s: GameState): number {
  const left = s.config.rounds - s.round;
  const cap = s.config.k <= 2 ? 16 : s.config.k <= 3 ? 11 : 8;
  return Math.min(left, cap);
}

export function aiMove(s: GameState, level: AILevel, rnd: () => number): number {
  switch (level) {
    case 1: return pickByEval(s, 1, rnd);
    case 2: return pickByEval(s, 3, rnd);
    case 3: return pickByEval(s, searchDepth(s), rnd);
    default: { const m = legalMoves(s); return m[Math.floor(rnd() * m.length)]; }
  }
}
