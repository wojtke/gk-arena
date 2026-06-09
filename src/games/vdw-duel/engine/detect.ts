// Per-colour arithmetic-progression detection over the line indices.
//
// A colour's tokens occupy a set of 0-based line indices. The colour contains a monochromatic
// k-term AP iff there exist indices i, i+d, i+2d, …, i+(k-1)d (d >= 1) all of that colour. We
// return the FIRST such witness found (k indices) so the UI can highlight it.

import { Owner } from './types';

/**
 * Find a k-term AP among the positions of `who` in `line`, or null if none exists.
 * O(L^2) over the line length, which is tiny at L <= W(2;k).
 */
export function findAP(line: Owner[], who: Owner, k: number): number[] | null {
  if (k < 2) return null;
  const L = line.length;
  const isMine = (i: number) => line[i] === who;
  for (let i = 0; i < L; i++) {
    if (!isMine(i)) continue;
    // d is the common difference; the last term i+(k-1)d must stay within the line.
    for (let d = 1; i + (k - 1) * d < L; d++) {
      let ok = true;
      const ap: number[] = [i];
      for (let t = 1; t < k; t++) {
        const j = i + t * d;
        if (!isMine(j)) { ok = false; break; }
        ap.push(j);
      }
      if (ok) return ap;
    }
  }
  return null;
}

/** Convenience: does `who` have a k-AP at all? */
export function hasAP(line: Owner[], who: Owner, k: number): boolean {
  return findAP(line, who, k) !== null;
}
