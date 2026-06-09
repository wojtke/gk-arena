// Game rules: state transitions for the Maker–Breaker arc game.
// Maker (Red) always moves first. Maker wins by building k mutually-`type` red arcs.

import {
  Color, Edge, GameConfig, GameState, Move, Pattern, MAKER, BREAKER,
} from './types';
import { largestHomogeneous, largestOfAny } from './patterns';

export function points(config: GameConfig): number {
  return config.n * 2;
}

export function newGame(config: GameConfig): GameState {
  return {
    config,
    edges: [],
    used: new Array(points(config) + 1).fill(false),
    turn: MAKER, // Maker always first
  };
}

export function freePoints(s: GameState): number[] {
  const free: number[] = [];
  for (let p = 1; p <= points(s.config); p++) if (!s.used[p]) free.push(p);
  return free;
}

export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  const free = freePoints(s);
  const moves: Move[] = [];
  for (let i = 0; i < free.length; i++)
    for (let j = i + 1; j < free.length; j++)
      moves.push([free[i], free[j]]);
  return moves;
}

export function edgesOf(s: GameState, color: Color): Edge[] {
  return s.edges.filter(e => e.color === color);
}

/** Maker's best homogeneous structure right now (of the target type, or best over all if 'any'). */
export function makerProgress(s: GameState): { size: number; witness: Edge[]; type: Pattern } {
  const red = edgesOf(s, MAKER);
  if (s.config.type === 'any') {
    const { type, result } = largestOfAny(red);
    return { size: result.size, witness: result.witness, type };
  }
  const r = largestHomogeneous(red, s.config.type);
  return { size: r.size, witness: r.witness, type: s.config.type };
}

function boardFull(used: boolean[]): boolean {
  for (let i = 1; i < used.length; i++) if (!used[i]) return false;
  return true;
}

/**
 * Apply a move for the player to move. Returns a new state (pure). Illegal moves return the
 * state unchanged. Handles both maker-breaker (early win) and scoring (play to the end) modes.
 */
export function applyMove(s: GameState, lo: number, hi: number): GameState {
  if (lo > hi) [lo, hi] = [hi, lo];
  if (s.winner || lo === hi || lo < 1 || hi > points(s.config) || s.used[lo] || s.used[hi]) {
    return s;
  }
  const color = s.turn;
  const edges = [...s.edges, { lo, hi, color }];
  const used = s.used.slice();
  used[lo] = true;
  used[hi] = true;
  const next: GameState = {
    ...s,
    edges,
    used,
    turn: color === MAKER ? BREAKER : MAKER,
  };

  // Maker-breaker: Maker can win the instant her structure reaches k.
  if (s.config.mode === 'maker-breaker' && color === MAKER) {
    const prog = makerProgress(next);
    if (prog.size >= s.config.k) {
      next.winner = MAKER;
      next.witness = prog.witness;
      next.witnessType = prog.type;
      return next;
    }
  }

  // Board full: settle the game.
  if (boardFull(used)) {
    const prog = makerProgress(next);
    next.witness = prog.witness;
    next.witnessType = prog.type;
    if (s.config.mode === 'scoring') {
      // Scoring duel (DESIGN §2): no early target — the final largest homogeneous Red set IS the
      // score. Maker maximises it, Breaker minimises it. The label/winner is decided by the duel
      // against `k` as an agreed "par" bar: Maker wins the duel iff she reaches the bar.
      next.score = prog.size;
      next.winner = prog.size >= s.config.k ? MAKER : BREAKER;
    } else {
      next.winner = prog.size >= s.config.k ? MAKER : BREAKER;
    }
  }
  return next;
}

export function isOver(s: GameState): boolean {
  return !!s.winner;
}

/** Human-readable description of what the side to move is trying to do. */
export function goalText(config: GameConfig): string {
  const what = config.type === 'any' ? 'mutually crossing, nesting, or aligned' : `mutually ${config.type}`;
  if (config.mode === 'scoring') {
    return `Scoring duel: fill the board — Maker maximises, Breaker minimises the largest set of ${what} red arcs (par ${config.k}).`;
  }
  return `Maker (red) wants ${config.k} arcs that are ${what}.`;
}
