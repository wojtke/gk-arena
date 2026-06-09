// Forbidden-pattern detector for the inspected word S. The only pattern the game judges is a
// `power`-th power that ENDS at the last landed letter — a hop can only create a new pattern as a
// suffix of S, so the suffix-anchored check is exactly "did THIS hop lose?".
//
//   power 2 → square XX  (suffix of length 2·block, two equal blocks)
//   power 3 → cube  XXX  (suffix of length 3·block, three equal blocks)
//   power k → x^k

import { Witness } from './types';

/** word[a..a+len) === word[b..b+len) ? */
function blocksEqual(s: number[], a: number, b: number, len: number): boolean {
  for (let j = 0; j < len; j++) if (s[a + j] !== s[b + j]) return false;
  return true;
}

/**
 * True iff S ends with a `power`-th power (some suffix X^power, |X| = block ≥ 1).
 * For power 2 this is "S ends with a square XX".
 */
export function hasSquareSuffix(s: number[], power = 2): boolean {
  return squareSuffixWitness(s, power) !== null;
}

/**
 * The smallest-block `power`-th power ending at the last letter of S, or null. The witness covers
 * the whole offending factor X^power; `block = |X|`.
 */
export function squareSuffixWitness(s: number[], power = 2): Witness | null {
  const n = s.length;
  if (power < 2) return null;
  // smallest block first: prefer the tightest pattern (e.g. aa over a longer accidental one).
  for (let block = 1; power * block <= n; block++) {
    const start = n - power * block;
    let ok = true;
    // all `power` blocks equal ⇔ each adjacent pair of blocks is equal.
    for (let r = 1; r < power && ok; r++) {
      if (!blocksEqual(s, start, start + r * block, block)) ok = false;
    }
    if (ok) return { start, end: n, block };
  }
  return null;
}

/** Full-word forbidden-factor witness (any occurrence, not only a suffix) — for highlighting. */
export function patternWitness(s: number[], power = 2): Witness | null {
  const n = s.length;
  if (power < 2) return null;
  for (let start = 0; start < n; start++) {
    for (let block = 1; start + power * block <= n; block++) {
      let ok = true;
      for (let r = 1; r < power && ok; r++) {
        if (!blocksEqual(s, start, start + r * block, block)) ok = false;
      }
      if (ok) return { start, end: start + power * block, block };
    }
  }
  return null;
}

export const hasPattern = (s: number[], power = 2): boolean => patternWitness(s, power) !== null;
