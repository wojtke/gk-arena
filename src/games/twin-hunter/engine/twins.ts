// Tight-twin / shuffle-square detection — the crux of Twin Hunter.
//
// A factor (contiguous block) has TIGHT TWINS iff it is a SHUFFLE SQUARE: it splits into two
// disjoint subsequences that cover the whole factor and are EQUAL (words) or ORDER-ISOMORPHIC
// (permutations). Recognising shuffle squares is NP-hard in general (Buss & Soltys 2014; binary:
// Bulteau & Vialette 2019), so we keep the sequences game-sized.
//
// - isShuffleSquare: polynomial-ish DP over the unmatched suffix of the leading copy.
// - isShuffleOrderIso: exponential (over half-size subsets) — only call on short factors.
// - hasTightTwins: scan all even-length factors.
// - findWitness: when tight twins exist, return the factor range and the two interleaved copies.

import { Variant, Witness } from './types';

/** Order type: rank each element (0 = smallest). Ties broken by index (stable). */
export function patternOf(seq: readonly number[]): number[] {
  const order = seq.map((_, i) => i).sort((i, j) => (seq[i] - seq[j]) || (i - j));
  const rank = new Array<number>(seq.length);
  for (let r = 0; r < order.length; r++) rank[order[r]] = r;
  return rank;
}

function patternKey(seq: readonly number[]): string {
  return patternOf(seq).join(',');
}

/**
 * True if `factor` (even length) splits into two disjoint EQUAL subsequences covering all
 * positions. DP over the unmatched suffix of the leading copy (by symmetry we don't track which
 * physical copy leads). Polynomial-ish via memoisation on (i, pending).
 */
export function isShuffleSquare(factor: readonly number[]): boolean {
  const n = factor.length;
  if (n === 0 || n % 2 !== 0) return false;
  const seen = new Set<string>();
  // stack entries: [index, pending suffix of the leading copy]
  const stack: Array<[number, number[]]> = [[0, []]];
  while (stack.length) {
    const [i, pending] = stack.pop()!;
    if (i === n) {
      if (pending.length === 0) return true;
      continue;
    }
    const key = i + '|' + pending.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    const c = factor[i];
    // assign c to the leading copy (extend the unmatched suffix); prune: leader can't exceed room
    if (pending.length < n - i) stack.push([i + 1, [...pending, c]]);
    // assign c to the trailing copy (must match the oldest unmatched char)
    if (pending.length && pending[0] === c) stack.push([i + 1, pending.slice(1)]);
  }
  return false;
}

function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const combo: number[] = [];
  const rec = (start: number) => {
    if (combo.length === k) { out.push(combo.slice()); return; }
    for (let v = start; v < n; v++) { combo.push(v); rec(v + 1); combo.pop(); }
  };
  rec(0);
  return out;
}

/**
 * True if `factor` (even length) splits into two disjoint ORDER-ISOMORPHIC subsequences covering
 * all positions. Exponential (over half-size subsets) — call only on short, game-sized factors.
 */
export function isShuffleOrderIso(factor: readonly number[]): boolean {
  const n = factor.length;
  if (n === 0 || n % 2 !== 0) return false;
  const half = n / 2;
  for (const S of combinations(n, half)) {
    const inS = new Array<boolean>(n).fill(false);
    for (const j of S) inS[j] = true;
    const a: number[] = [];
    const b: number[] = [];
    for (let j = 0; j < n; j++) (inS[j] ? a : b).push(factor[j]);
    if (patternKey(a) === patternKey(b)) return true;
  }
  return false;
}

/** Pick the checker for a variant. */
export function shuffleChecker(variant: Variant): (factor: readonly number[]) => boolean {
  return variant === 'words' ? isShuffleSquare : isShuffleOrderIso;
}

/** Does `seq` contain tight twins with each twin copy of length >= minBlock? */
export function hasTightTwins(seq: readonly number[], variant: Variant, minBlock = 1): boolean {
  const n = seq.length;
  const check = shuffleChecker(variant);
  for (let length = 2 * minBlock; length <= n; length += 2) {
    for (let i = 0; i + length <= n; i++) {
      if (check(seq.slice(i, i + length))) return true;
    }
  }
  return false;
}

// --- witness recovery (for the two-colour reveal) --- //

/** EQUAL-split witness: the two index sets (relative to the factor) of a shuffle square, or null. */
function witnessShuffleSquare(factor: readonly number[]): [number[], number[]] | null {
  const n = factor.length;
  if (n === 0 || n % 2 !== 0) return null;
  // DFS that also records, per matched index, which copy it was assigned to.
  const seen = new Set<string>();
  type Frame = { i: number; pending: number[]; lead: number[]; trail: number[] };
  const stack: Frame[] = [{ i: 0, pending: [], lead: [], trail: [] }];
  while (stack.length) {
    const { i, pending, lead, trail } = stack.pop()!;
    if (i === n) {
      if (pending.length === 0) return [lead, trail];
      continue;
    }
    const key = i + '|' + pending.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    const c = factor[i];
    if (pending.length < n - i) {
      stack.push({ i: i + 1, pending: [...pending, c], lead: [...lead, i], trail });
    }
    if (pending.length && pending[0] === c) {
      stack.push({ i: i + 1, pending: pending.slice(1), lead, trail: [...trail, i] });
    }
  }
  return null;
}

/** ORDER-ISO-split witness: two index sets (relative to the factor), or null. */
function witnessShuffleOrderIso(factor: readonly number[]): [number[], number[]] | null {
  const n = factor.length;
  if (n === 0 || n % 2 !== 0) return null;
  const half = n / 2;
  for (const S of combinations(n, half)) {
    const inS = new Array<boolean>(n).fill(false);
    for (const j of S) inS[j] = true;
    const aIdx: number[] = [];
    const bIdx: number[] = [];
    const a: number[] = [];
    const b: number[] = [];
    for (let j = 0; j < n; j++) {
      if (inS[j]) { aIdx.push(j); a.push(factor[j]); } else { bIdx.push(j); b.push(factor[j]); }
    }
    if (patternKey(a) === patternKey(b)) return [aIdx, bIdx];
  }
  return null;
}

/**
 * Find a tight-twin witness in `seq`: the smallest (then earliest) factor that is a shuffle square,
 * with the two interleaved copies as ABSOLUTE indices into `seq`. Returns undefined if none.
 */
export function findWitness(seq: readonly number[], variant: Variant, minBlock = 1): Witness | undefined {
  const n = seq.length;
  const witnessFor = variant === 'words' ? witnessShuffleSquare : witnessShuffleOrderIso;
  for (let length = 2 * minBlock; length <= n; length += 2) {
    for (let i = 0; i + length <= n; i++) {
      const factor = seq.slice(i, i + length);
      const w = witnessFor(factor);
      if (w) {
        const [relA, relB] = w;
        return {
          start: i,
          end: i + length,
          a: relA.map(j => j + i),
          b: relB.map(j => j + i),
        };
      }
    }
  }
  return undefined;
}
