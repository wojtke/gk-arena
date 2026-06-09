// Strip primitives: cells of an AP tile, legality (in-bounds + no overlap), placement application,
// and legal-move enumeration. No DOM — pure functions over arrays.

import { APSpec, Cell, Color, GameState, Placement } from './types';

/** The cells occupied by an AP tile `{start, d, len}` (may go out of [0,L) — caller checks bounds). */
export function cellsOf(start: number, d: number, len: number): number[] {
  const out: number[] = [];
  for (let t = 0; t < len; t++) out.push(start + t * d);
  return out;
}

/** Cells of a placement object. */
export function cellsOfPlacement(p: Placement): number[] {
  return cellsOf(p.start, p.d, p.len);
}

/** The span (last cell index) of a tile placed at `start`: start + (len-1)*d. */
export function spanEnd(start: number, d: number, len: number): number {
  return start + (len - 1) * d;
}

/** True iff every cell of the tile is in [0,L) and currently free in `occupied`. */
export function isLegal(occupied: Cell[], start: number, d: number, len: number): boolean {
  const L = occupied.length;
  if (len < 1 || d < 1 || start < 0) return false;
  const end = spanEnd(start, d, len);
  if (end >= L) return false;
  for (let t = 0; t < len; t++) {
    if (occupied[start + t * d] !== null) return false;
  }
  return true;
}

/** Apply a placement to a copy of `occupied`, marking each cell with `color`. Caller ensures legal. */
export function applyToCells(occupied: Cell[], p: Placement, color: Color): Cell[] {
  const next = occupied.slice();
  for (const c of cellsOfPlacement(p)) next[c] = color;
  return next;
}

/**
 * Enumerate every legal placement of the tile shape `{d, len}` on the current strip — one entry per
 * legal `start`.
 */
export function legalStartsFor(occupied: Cell[], d: number, len: number): number[] {
  const L = occupied.length;
  const out: number[] = [];
  const maxStart = L - 1 - (len - 1) * d;
  for (let start = 0; start <= maxStart; start++) {
    if (isLegal(occupied, start, d, len)) out.push(start);
  }
  return out;
}

/** Legal placements of one family member (used by solo / pack-vs-block Maker). */
export function legalPlacementsFor(s: GameState, spec: APSpec): Placement[] {
  return legalStartsFor(s.occupied, spec.d, spec.len).map((start) => ({
    start,
    d: spec.d,
    len: spec.len,
  }));
}

/**
 * Enumerate all legal placements over allowed differences/lengths (two-player). Each result is a
 * `{start, d, len}` placement. Used for the two-player free-form mode.
 */
export function legalPlacements(occupied: Cell[], diffs: number[], lengths: number[]): Placement[] {
  const out: Placement[] = [];
  for (const d of diffs) {
    for (const len of lengths) {
      for (const start of legalStartsFor(occupied, d, len)) {
        out.push({ start, d, len });
      }
    }
  }
  return out;
}

/** The used-interval length: (max occupied cell index) - (min occupied cell index) + 1, or 0. */
export function usedLength(occupied: Cell[]): number {
  let lo = -1;
  let hi = -1;
  for (let i = 0; i < occupied.length; i++) {
    if (occupied[i] !== null) {
      if (lo < 0) lo = i;
      hi = i;
    }
  }
  return lo < 0 ? 0 : hi - lo + 1;
}

/** Count of non-free cells. */
export function coveredCount(occupied: Cell[]): number {
  let n = 0;
  for (const c of occupied) if (c !== null) n++;
  return n;
}
