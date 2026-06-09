// m(F): the minimum interval length holding pairwise-disjoint shifted copies of every member of a
// family F of AP tiles. This is a packing/NP-flavoured problem; we solve small instances exactly:
//   - mF(F)            — branch-and-bound over the smallest L that fits all members.
//   - mFBruteForce(F)  — a simple reference used by tests on tiny families.
//
// All search is guarded by size caps so it stays fast on the parameters the app uses.

import { APSpec, Cell } from './types';
import { cellsOf } from './strip';

/** The span of a single member when placed at offset 0: (len-1)*d + 1 cells from first to last. */
export function memberSpan(spec: APSpec): number {
  return spec.len <= 0 ? 0 : (spec.len - 1) * spec.d + 1;
}

/** Total cells covered by all members (a trivial lower bound on m(F)). */
export function totalCells(family: APSpec[]): number {
  return family.reduce((acc, m) => acc + Math.max(0, m.len), 0);
}

/** Largest single-member span (another trivial lower bound on m(F)). */
export function maxSpan(family: APSpec[]): number {
  return family.reduce((acc, m) => Math.max(acc, memberSpan(m)), 0);
}

/** A safe upper bound: lay every member end-to-end with a gap of 1, ignoring overlap cleverness. */
function trivialUpperBound(family: APSpec[]): number {
  let used = 0;
  for (const m of family) used += memberSpan(m);
  return Math.max(1, used);
}

/**
 * Can all members of `family` (in the given order) be placed disjointly inside [0, L)? Uses a
 * bitmask of occupied cells (L <= 53-ish for safety we cap callers) with simple branch-and-bound and
 * a symmetry break (members are sorted by descending span first, and we place the first member only
 * at start 0..L-span to avoid mirror duplicates is not safe, so we keep full starts but prune).
 */
function fits(family: APSpec[], L: number): boolean {
  if (L < maxSpan(family)) return false;
  if (totalCells(family) > L) return false;
  // Represent occupancy as a regular boolean array (L is small).
  const occ = new Array<boolean>(L).fill(false);

  const place = (idx: number): boolean => {
    if (idx === family.length) return true;
    const { d, len } = family[idx];
    const maxStart = L - 1 - (len - 1) * d;
    for (let start = 0; start <= maxStart; start++) {
      const cells = cellsOf(start, d, len);
      let ok = true;
      for (const c of cells) {
        if (occ[c]) { ok = false; break; }
      }
      if (!ok) continue;
      for (const c of cells) occ[c] = true;
      if (place(idx + 1)) return true;
      for (const c of cells) occ[c] = false;
    }
    return false;
  };
  return place(0);
}

/**
 * Exact m(F) via branch-and-bound: the smallest L for which `fits` succeeds, searched upward from a
 * lower bound. Returns -1 if it exceeds `cap` (too big to solve here).
 */
export function mF(family: APSpec[], cap = 64): number {
  const fam = family.filter((m) => m.len > 0 && m.d > 0);
  if (fam.length === 0) return 0;
  // Order members by descending span: the hardest piece is placed first, pruning earlier.
  const ordered = [...fam].sort((a, b) => memberSpan(b) - memberSpan(a));
  const lo = Math.max(maxSpan(ordered), totalCells(ordered));
  const hi = Math.min(cap, trivialUpperBound(ordered));
  for (let L = lo; L <= hi; L++) {
    if (fits(ordered, L)) return L;
  }
  return -1;
}

/**
 * Brute-force reference m(F): for each candidate L, try every combination of starts independently
 * (cartesian product) and test disjointness directly. Only for tiny families/tests.
 */
export function mFBruteForce(family: APSpec[], cap = 40): number {
  const fam = family.filter((m) => m.len > 0 && m.d > 0);
  if (fam.length === 0) return 0;
  const lo = Math.max(maxSpan(fam), totalCells(fam));
  for (let L = lo; L <= cap; L++) {
    if (canFitBrute(fam, L)) return L;
  }
  return -1;
}

function canFitBrute(family: APSpec[], L: number): boolean {
  // Precompute legal single-tile placements (as bitmasks) for each member, then try all combos.
  const masks: number[][] = family.map(({ d, len }) => {
    const ms: number[] = [];
    const maxStart = L - 1 - (len - 1) * d;
    for (let start = 0; start <= maxStart; start++) {
      let m = 0;
      for (let t = 0; t < len; t++) m |= 1 << (start + t * d);
      ms.push(m);
    }
    return ms;
  });
  if (masks.some((m) => m.length === 0)) return false;

  const rec = (idx: number, used: number): boolean => {
    if (idx === family.length) return true;
    for (const m of masks[idx]) {
      if ((m & used) === 0 && rec(idx + 1, used | m)) return true;
    }
    return false;
  };
  return rec(0, 0);
}

/**
 * Joint feasibility for pack-vs-block: can the whole `remaining` family still be placed pairwise
 * disjointly onto the currently-free cells of `occupied` (cells === null)? This is the true
 * Maker-loses test — strictly stronger than "some single member has no legal placement", because a
 * family can be individually placeable yet jointly unpackable. Branch-and-bound, hardest-first,
 * guarded by `nodeCap` so it stays fast (callers cap the board size). When the node cap is hit we
 * conservatively return `true` (don't declare Breaker the winner on an undecided position).
 */
export function canPackRemaining(occupied: Cell[], remaining: APSpec[], nodeCap = 200000): boolean {
  const fam = remaining.filter((m) => m.len > 0 && m.d > 0);
  if (fam.length === 0) return true;
  const L = occupied.length;
  const occ = occupied.map((c) => c !== null);
  const ordered = [...fam].sort((a, b) => memberSpan(b) - memberSpan(a));
  let nodes = 0;
  let capped = false;
  const place = (idx: number): boolean => {
    if (idx === ordered.length) return true;
    if (nodes++ > nodeCap) { capped = true; return true; }
    const { d, len } = ordered[idx];
    const maxStart = L - 1 - (len - 1) * d;
    for (let start = 0; start <= maxStart; start++) {
      const cells = cellsOf(start, d, len);
      let ok = true;
      for (const c of cells) if (occ[c]) { ok = false; break; }
      if (!ok) continue;
      for (const c of cells) occ[c] = true;
      const done = place(idx + 1);
      for (const c of cells) occ[c] = false;
      if (done) return true;
      if (capped) return true;
    }
    return false;
  };
  return place(0);
}

/**
 * A witness packing achieving used length `mF(F)` — returns one start per member (in the *original*
 * family order) or null if none within `cap`. Useful for the Hint / "show optimal" feature.
 */
export function mFWitness(family: APSpec[], cap = 64): { L: number; starts: number[] } | null {
  const fam = family.filter((m) => m.len > 0 && m.d > 0);
  if (fam.length === 0) return { L: 0, starts: [] };
  const indexed = fam.map((m, i) => ({ m, i }));
  indexed.sort((a, b) => memberSpan(b.m) - memberSpan(a.m));
  const ordered = indexed.map((x) => x.m);
  const lo = Math.max(maxSpan(ordered), totalCells(ordered));
  const hi = Math.min(cap, trivialUpperBound(ordered));

  for (let L = lo; L <= hi; L++) {
    const occ = new Array<boolean>(L).fill(false);
    const startsOrdered = new Array<number>(ordered.length).fill(-1);
    const place = (idx: number): boolean => {
      if (idx === ordered.length) return true;
      const { d, len } = ordered[idx];
      const maxStart = L - 1 - (len - 1) * d;
      for (let start = 0; start <= maxStart; start++) {
        const cells = cellsOf(start, d, len);
        let ok = true;
        for (const c of cells) if (occ[c]) { ok = false; break; }
        if (!ok) continue;
        for (const c of cells) occ[c] = true;
        startsOrdered[idx] = start;
        if (place(idx + 1)) return true;
        for (const c of cells) occ[c] = false;
        startsOrdered[idx] = -1;
      }
      return false;
    };
    if (place(0)) {
      // Map back to original order.
      const starts = new Array<number>(fam.length).fill(-1);
      indexed.forEach((x, k) => { starts[x.i] = startsOrdered[k]; });
      // Compress to a window starting at 0 and report the true used length (== m(F) for this L).
      const allCells: number[] = [];
      starts.forEach((st, k) => { for (const c of cellsOf(st, fam[k].d, fam[k].len)) allCells.push(c); });
      const lo2 = Math.min(...allCells);
      const hi2 = Math.max(...allCells);
      return { L: hi2 - lo2 + 1, starts: starts.map((st) => st - lo2) };
    }
  }
  return null;
}

/**
 * Exact optimal completion of a packing in progress: given a strip `occupied` already holding some
 * tiles (and possibly blocked cells), find starts for the `remaining` members (in original order)
 * that keep everything disjoint AND minimise the final *used length* of the whole strip
 * (max occupied index − min occupied index + 1, counting cells already occupied plus the new ones).
 *
 * Returns the chosen starts (original order) and the resulting final used length, or null if the
 * remaining family cannot be completed at all or the search exceeds `nodeCap`. This is the engine the
 * solo level-3 "Solver" plays toward so it actually reaches m(F): when the strip is empty the optimum
 * it finds equals mF(remaining).
 */
export function optimalCompletion(
  occupied: Cell[],
  remaining: APSpec[],
  nodeCap = 400000,
): { starts: number[]; used: number } | null {
  const L = occupied.length;
  // Keep each member's original `remaining` index so we can map the answer straight back.
  const indexed = remaining
    .map((m, i) => ({ m, i }))
    .filter((x) => x.m.len > 0 && x.m.d > 0);
  // Pre-existing occupied window (tiles already placed). Blocked cells ('x') also count as occupied.
  let preLo = -1;
  let preHi = -1;
  for (let i = 0; i < L; i++) {
    if (occupied[i] !== null) { if (preLo < 0) preLo = i; preHi = i; }
  }

  if (indexed.length === 0) {
    return {
      starts: new Array<number>(remaining.length).fill(-1),
      used: preLo < 0 ? 0 : preHi - preLo + 1,
    };
  }

  // Place the hardest (largest-span) members first to prune earlier.
  indexed.sort((a, b) => memberSpan(b.m) - memberSpan(a.m));
  const ordered = indexed.map((x) => x.m);

  const occ = occupied.map((c) => c !== null);
  const startsOrdered = new Array<number>(ordered.length).fill(-1);
  let bestUsed = Infinity;
  let bestStarts: number[] | null = null;
  let nodes = 0;
  let exhausted = false;

  // Running bounds of the union of pre-existing occupancy and tiles placed so far in the search.
  const search = (idx: number, curLo: number, curHi: number): void => {
    if (exhausted) return;
    if (nodes++ > nodeCap) { exhausted = true; return; }
    if (idx === ordered.length) {
      const used = curHi - curLo + 1;
      if (used < bestUsed) {
        bestUsed = used;
        bestStarts = startsOrdered.slice();
      }
      return;
    }
    const { d, len } = ordered[idx];
    const maxStart = L - 1 - (len - 1) * d;
    for (let start = 0; start <= maxStart; start++) {
      const cells = cellsOf(start, d, len);
      let ok = true;
      for (const c of cells) if (occ[c]) { ok = false; break; }
      if (!ok) continue;
      let nLo = curLo;
      let nHi = curHi;
      for (const c of cells) {
        if (nLo < 0 || c < nLo) nLo = c;
        if (c > nHi) nHi = c;
      }
      // Bound: even the current partial span cannot already beat the best.
      if (nHi - nLo + 1 >= bestUsed) continue;
      for (const c of cells) occ[c] = true;
      startsOrdered[idx] = start;
      search(idx + 1, nLo, nHi);
      for (const c of cells) occ[c] = false;
      startsOrdered[idx] = -1;
    }
  };
  search(0, preLo, preHi);

  const best = bestStarts as number[] | null;
  if (best === null) return null;
  // Map the search order's starts back to the original `remaining` order via the carried indices.
  const starts = new Array<number>(remaining.length).fill(-1);
  best.forEach((st, k) => { starts[indexed[k].i] = st; });
  return { starts, used: bestUsed };
}
