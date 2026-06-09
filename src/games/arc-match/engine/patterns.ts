// Pattern detection — the mathematical core.
//
// Two disjoint arcs e=(a,b), f=(c,d) with a<c relate as exactly one of:
//   alignment  a<b<c<d   (disjoint, side by side)
//   nesting    a<c<d<b   (one inside the other)
//   crossing   a<c<b<d   (interleaved)
//
// A size-k homogeneous sub-matching, sorted by lo, has a canonical form:
//   k-crossing   a1<…<ak < b1<…<bk           (all lefts before all rights, his increasing)
//   k-nesting    a1<…<ak < bk<…<b1           (his decreasing)
//   k-alignment  a1<b1 < a2<b2 < … < ak<bk   (pairwise disjoint intervals)
//
// So each "largest homogeneous set" is a longest-chain / interval-scheduling problem.

import { Edge, Pattern } from './types';

/** Classify the relationship between two disjoint arcs. */
export function classify(e: Edge, f: Edge): Pattern {
  let a = e.lo, b = e.hi, c = f.lo, d = f.hi;
  if (a > c) { [a, b, c, d] = [c, d, a, b]; } // ensure a < c
  if (b < c) return 'alignment'; // a < b < c < d
  if (d < b) return 'nesting';   // a < c < d < b
  return 'crossing';             // a < c < b < d
}

export interface HomResult {
  size: number;
  witness: Edge[];
}

/** Indices of a longest strictly-increasing subsequence of `vals` (patience sorting, O(m log m)). */
function lisIndices(vals: number[]): number[] {
  const n = vals.length;
  const tails: number[] = [];          // tails[l] = index of the smallest tail of an inc. seq of length l+1
  const prev: number[] = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vals[tails[mid]] < vals[i]) lo = mid + 1; else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    if (lo === tails.length) tails.push(i); else tails[lo] = i;
  }
  const res: number[] = [];
  let k = tails.length ? tails[tails.length - 1] : -1;
  while (k !== -1) { res.push(k); k = prev[k]; }
  return res.reverse();
}

/**
 * Largest pairwise-crossing set. Every k-crossing has a_k < b_1, so all its arcs span a common
 * gap g (a_i ≤ g < b_i). Among arcs spanning g, two arcs cross iff their his are in the same order
 * as their los — so the answer is max over gaps of LIS-by-hi of the spanning arcs sorted by lo.
 */
function largestCrossing(edges: Edge[]): HomResult {
  if (edges.length === 0) return { size: 0, witness: [] };
  let maxHi = 0;
  for (const e of edges) if (e.hi > maxHi) maxHi = e.hi;
  let best: Edge[] = [];
  for (let g = 1; g < maxHi; g++) {
    const span = edges.filter(e => e.lo <= g && e.hi > g).sort((x, y) => x.lo - y.lo);
    if (span.length <= best.length) continue;
    const idx = lisIndices(span.map(e => e.hi));
    if (idx.length > best.length) best = idx.map(i => span[i]);
  }
  return { size: best.length, witness: best };
}

/** Largest pairwise-nesting set = longest hi-decreasing chain when sorted by lo. */
function largestNesting(edges: Edge[]): HomResult {
  if (edges.length === 0) return { size: 0, witness: [] };
  const sorted = [...edges].sort((x, y) => x.lo - y.lo);
  const idx = lisIndices(sorted.map(e => -e.hi)); // increasing -hi = decreasing hi
  return { size: idx.length, witness: idx.map(i => sorted[i]) };
}

/** Largest pairwise-aligned set = max number of disjoint intervals (greedy by hi). */
function largestAlignment(edges: Edge[]): HomResult {
  const sorted = [...edges].sort((x, y) => x.hi - y.hi);
  const witness: Edge[] = [];
  let lastEnd = -Infinity;
  for (const e of sorted) {
    if (e.lo > lastEnd) { witness.push(e); lastEnd = e.hi; }
  }
  return { size: witness.length, witness };
}

export function largestHomogeneous(edges: Edge[], type: Pattern): HomResult {
  if (type === 'crossing') return largestCrossing(edges);
  if (type === 'nesting') return largestNesting(edges);
  return largestAlignment(edges);
}

/** Best homogeneous set over all three pattern types. */
export function largestOfAny(edges: Edge[]): { type: Pattern; result: HomResult } {
  const all: Array<{ type: Pattern; result: HomResult }> = [
    { type: 'crossing', result: largestCrossing(edges) },
    { type: 'nesting', result: largestNesting(edges) },
    { type: 'alignment', result: largestAlignment(edges) },
  ];
  all.sort((p, q) => q.result.size - p.result.size);
  return all[0];
}
