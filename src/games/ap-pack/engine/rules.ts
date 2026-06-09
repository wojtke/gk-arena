// Rules for the three modes. Pure functions: newGame, legalMoves, applyMove, isOver, winner, goalText.
//
//   solo          — one player places a shifted copy of each family member, all disjoint, to
//                   minimise the used-interval length. No opponent; "winner" is unused (use done).
//   two-player    — alternate placing any legal AP tile; NORMAL play: the player who cannot move
//                   loses, so the last to place wins. Red moves first.
//   pack-vs-block — Maker (Red) places the family; Breaker (Blue) blocks one free cell per turn.
//                   Maker wins by placing the whole family disjointly; Breaker wins if some remaining
//                   member has no legal placement. Red (Maker) moves first.

import {
  APSpec, Cell, Color, GameConfig, GameState, Move, RED, BLUE,
} from './types';
import {
  cellsOf, isLegal, legalPlacements, legalPlacementsFor, applyToCells,
} from './strip';
import { canPackRemaining } from './mF';

export function newGame(config: GameConfig): GameState {
  const L = config.L;
  const occupied = new Array<Cell>(L).fill(null);
  const family = config.family ?? [];
  return {
    config,
    L,
    occupied,
    placed: [],
    remaining: config.mode === 'two-player' ? [] : family.map((m) => ({ ...m })),
    turn: RED,
  };
}

/**
 * True when the remaining family can no longer be packed jointly into the free cells — the true
 * pack-vs-block Breaker-win condition. This is strictly stronger than "some single member has no
 * legal placement": a family can be individually placeable yet jointly unpackable, and Breaker has
 * effectively already won in that case. (A fast per-member pre-check short-circuits the common case.)
 */
function makerHasLost(s: GameState): boolean {
  if (s.remaining.some((spec) => legalPlacementsFor(s, spec).length === 0)) return true;
  return !canPackRemaining(s.occupied, s.remaining);
}

export function legalMoves(s: GameState): Move[] {
  if (s.winner || s.done) return [];
  const cfg = s.config;

  if (cfg.mode === 'solo') {
    // Player must place the *next* remaining member (first one). Allow placing any remaining member
    // by enumerating all; UI restricts to selected tile.
    const out: Move[] = [];
    s.remaining.forEach((spec, idx) => {
      for (const p of legalPlacementsFor(s, spec)) {
        out.push({ kind: 'place', start: p.start, d: p.d, len: p.len, specIndex: idx });
      }
    });
    return out;
  }

  if (cfg.mode === 'two-player') {
    const diffs = cfg.diffs ?? [1];
    const lengths = cfg.lengths ?? [2];
    return legalPlacements(s.occupied, diffs, lengths).map((p) => ({
      kind: 'place' as const, start: p.start, d: p.d, len: p.len,
    }));
  }

  // pack-vs-block
  if (s.turn === RED) {
    const out: Move[] = [];
    s.remaining.forEach((spec, idx) => {
      for (const p of legalPlacementsFor(s, spec)) {
        out.push({ kind: 'place', start: p.start, d: p.d, len: p.len, specIndex: idx });
      }
    });
    return out;
  }
  // Breaker: block any free cell.
  const out: Move[] = [];
  for (let i = 0; i < s.L; i++) if (s.occupied[i] === null) out.push({ kind: 'block', cell: i });
  return out;
}

/** Remove the first matching spec from a remaining list (returns a new array). */
function removeSpec(remaining: APSpec[], idx: number | undefined, spec: APSpec): APSpec[] {
  const next = remaining.slice();
  if (idx !== undefined && idx >= 0 && idx < next.length
      && next[idx].d === spec.d && next[idx].len === spec.len) {
    next.splice(idx, 1);
    return next;
  }
  // Fallback: remove first member with matching shape.
  const i = next.findIndex((m) => m.d === spec.d && m.len === spec.len);
  if (i >= 0) next.splice(i, 1);
  return next;
}

export function applyMove(s: GameState, move: Move): GameState {
  if (s.winner || s.done) return s;
  const cfg = s.config;

  // ---- solo ----
  if (cfg.mode === 'solo') {
    if (move.kind !== 'place') return s;
    if (!isLegal(s.occupied, move.start, move.d, move.len)) return s;
    const placement = { start: move.start, d: move.d, len: move.len, color: RED as Color };
    const occupied = applyToCells(s.occupied, placement, RED);
    const remaining = removeSpec(s.remaining, move.specIndex, { d: move.d, len: move.len });
    const next: GameState = {
      ...s, occupied, placed: [...s.placed, placement], remaining, turn: RED,
    };
    if (remaining.length === 0) { next.done = true; next.winner = RED; }
    return next;
  }

  // ---- two-player ----
  if (cfg.mode === 'two-player') {
    if (move.kind !== 'place') return s;
    if (!isLegal(s.occupied, move.start, move.d, move.len)) return s;
    const color = s.turn;
    const placement = { start: move.start, d: move.d, len: move.len, color };
    const occupied = applyToCells(s.occupied, placement, color);
    const nextTurn: Color = color === RED ? BLUE : RED;
    const next: GameState = {
      ...s, occupied, placed: [...s.placed, placement], turn: nextTurn,
    };
    // Normal play: if the player to move next has no legal move, the mover (color) wins.
    if (legalMoves(next).length === 0) next.winner = color;
    return next;
  }

  // ---- pack-vs-block ----
  if (s.turn === RED) {
    if (move.kind !== 'place') return s;
    if (!isLegal(s.occupied, move.start, move.d, move.len)) return s;
    const placement = { start: move.start, d: move.d, len: move.len, color: RED as Color };
    const occupied = applyToCells(s.occupied, placement, RED);
    const remaining = removeSpec(s.remaining, move.specIndex, { d: move.d, len: move.len });
    const next: GameState = {
      ...s, occupied, placed: [...s.placed, placement], remaining, turn: BLUE,
    };
    if (remaining.length === 0) { next.winner = RED; next.done = true; return next; }
    // After Maker's placement, if the rest can no longer be packed jointly, Breaker wins.
    if (makerHasLost(next)) next.winner = BLUE;
    return next;
  }
  // Breaker blocks a cell.
  if (move.kind !== 'block') return s;
  if (move.cell < 0 || move.cell >= s.L || s.occupied[move.cell] !== null) return s;
  const occupied = s.occupied.slice();
  occupied[move.cell] = 'x';
  const next: GameState = { ...s, occupied, turn: RED };
  if (makerHasLost(next)) next.winner = BLUE;
  return next;
}

export function isOver(s: GameState): boolean {
  return !!s.winner || !!s.done;
}

/** Apply a place-move described by raw coordinates (UI convenience), returns same state if illegal. */
export function placeAt(s: GameState, start: number, d: number, len: number, specIndex?: number): GameState {
  return applyMove(s, { kind: 'place', start, d, len, specIndex });
}

export function blockAt(s: GameState, cell: number): GameState {
  return applyMove(s, { kind: 'block', cell });
}

export function goalText(c: GameConfig): string {
  switch (c.mode) {
    case 'solo':
      return 'Place every comb tile without overlap — minimise the used length toward m(F).';
    case 'two-player':
      return 'Drop AP tiles in turn. The player who cannot move loses (last to place wins).';
    case 'pack-vs-block':
      return 'Maker (red) places the whole family; Breaker (blue) blocks one cell per turn.';
  }
}

/** Convenience: list of cells of a placement (re-exported for UI). */
export { cellsOf };
