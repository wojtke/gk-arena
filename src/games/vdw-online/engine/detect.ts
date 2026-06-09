// Per-colour arithmetic-progression detection — the general (off-diagonal) form of VdW Online.
//
// A monochromatic AP is k indices i, i+d, i+2d, ..., i+(k-1)d (d >= 1) all holding the same colour.
// Each colour i has its own target length k[i]; the POINTER wins the instant some colour i has a
// k[i]-AP. We scan per colour to that colour's own threshold and report the first hit with its colour
// for a colour-correct highlight. The diagonal case (all k[i] equal) is plain online VdW.
// Cost O(L^2 * max k[i]).

import { Color, Witness } from './types';

/**
 * The longest monochromatic AP of colour `color` in `line` (the longest run of equal-step, equal-
 * colour indices). Used for the per-colour mini-meters. Returns 0 if the colour is absent.
 */
export function longestApOfColor(line: readonly Color[], color: Color): number {
  const L = line.length;
  let best = 0;
  for (let i = 0; i < L; i++) {
    if (line[i] !== color) continue;
    if (best < 1) best = 1;
    for (let d = 1; i + d < L || i - d >= 0; d++) {
      // count forward run starting at i with step d
      let run = 1;
      let j = i + d;
      while (j < L && line[j] === color) { run++; j += d; }
      if (run > best) best = run;
      if (i + d >= L) break; // no further forward steps possible for larger d either
    }
  }
  return best;
}

/**
 * Find a k[color]-AP for some colour. Scans all (start, step) and, for each, the maximal mono run;
 * the FIRST colour whose run reaches its own threshold wins. Returns the witnessing indices + colour,
 * or null. Colours are scanned in index order so the result is deterministic.
 */
export function findWitness(line: readonly Color[], k: readonly number[]): Witness | null {
  const L = line.length;
  for (let start = 0; start < L; start++) {
    const color = line[start];
    const need = k[color];
    if (!need || need < 1) continue;
    if (need === 1) return { color, idx: [start] };
    const maxStep = Math.floor((L - 1 - start) / (need - 1));
    for (let d = 1; d <= maxStep; d++) {
      const idx: number[] = [start];
      let ok = true;
      for (let t = 1; t < need; t++) {
        const j = start + t * d;
        if (line[j] !== color) { ok = false; break; }
        idx.push(j);
      }
      if (ok) return { color, idx };
    }
  }
  return null;
}

/** Does `line` contain a k[i]-AP for some colour i? */
export function hasAp(line: readonly Color[], k: readonly number[]): boolean {
  return findWitness(line, k) !== null;
}
