// Bad-configuration detection — the crux of Different Blocks.
//
// A BAD CONFIGURATION is a run of k equal-length adjacent blocks (each length m >= 1) in which two
// blocks are identical. findBadConfig scans every block length m = 1..floor(|w|/k) and every start s
// with s + k*m <= |w|, splits w[s .. s+k*m-1] into B_0..B_{k-1}, and looks for a duplicate pair.
//
// Plain element-compare is ~O(|w|^3 / k): each (m, s) pair costs O(k*m) to hash the blocks; summed
// over all (m, s) this is ~O(|w|^3 / k). Cheap at game sizes — ship the plain compare for
// correctness; a rolling/precomputed hash would bring it to ~O(|w|^2 / k) if larger n were needed.
//
// k = 2 reduces to square detection: two adjacent equal-length equal blocks B_0 = B_1 is the square
// XX (where X = B_0). Smallest-then-earliest scan order makes the witness deterministic.

import { Witness } from './types';

/** Key for a block w[start .. start+m-1] (m small, so a join is fine). */
function blockKey(word: readonly number[], start: number, m: number): string {
  let s = '';
  for (let t = 0; t < m; t++) s += word[start + t] + ',';
  return s;
}

/**
 * Find the first bad configuration in `word` for k blocks, or null if none. Scans block length m
 * ascending (smallest first), then start s ascending (earliest first), then returns the earliest
 * duplicate pair (i, j) within the run. Returns the witness { start, m, i, j }.
 */
export function findBadConfig(word: readonly number[], k: number): Witness | null {
  const len = word.length;
  if (k < 2) return null;
  const maxM = Math.floor(len / k);
  for (let m = 1; m <= maxM; m++) {
    for (let s = 0; s + k * m <= len; s++) {
      // hash the k blocks; the first repeated key gives the duplicate pair
      const seen = new Map<string, number>();
      for (let b = 0; b < k; b++) {
        const key = blockKey(word, s + b * m, m);
        const prev = seen.get(key);
        if (prev !== undefined) {
          return { start: s, m, i: prev, j: b };
        }
        seen.set(key, b);
      }
    }
  }
  return null;
}

/** True if `word` contains any bad configuration for k blocks. */
export function hasBadConfig(word: readonly number[], k: number): boolean {
  return findBadConfig(word, k) !== null;
}
