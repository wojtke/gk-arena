// Combinatorics-on-words detectors. Every notion has a boolean brute-force check, a witness-returning
// brute-force check, and a fast suffix-anchored variant (only factors touching a freshly placed letter
// can be newly created by an append, so the suffix check is enough to test "did THIS append lose?").
//
//   square     : factor XX, period p, |X| = p >= 1
//   nontrivial : XX with p >= 2 (trivial squares aa allowed)
//   overlap    : factor a X a X a, i.e. a block of length 2p+1 with period p (>= 1) — equivalently
//                w[i + j] === w[i + j + p] for j in [0, p] (one extra matching letter beyond a square)
//   abelian    : XY with Y an anagram (permutation) of X, |X| = p >= 1

import { RepMode, Witness } from './types';

// --------------------------------------------------------------------------- //
// square / nontrivial                                                          //
// --------------------------------------------------------------------------- //

/** True if `word` contains a square factor XX with |X| >= minP. */
export function hasSquare(word: number[], minP = 1): boolean {
  return squareWitness(word, minP) !== null;
}

/** First square factor (smallest start, then smallest period), or null. */
export function squareWitness(word: number[], minP = 1): Witness | null {
  const n = word.length;
  for (let start = 0; start < n; start++) {
    for (let p = minP; start + 2 * p <= n; p++) {
      if (blocksEqual(word, start, start + p, p)) {
        return { start, end: start + 2 * p, period: p };
      }
    }
  }
  return null;
}

/** Suffix-anchored: a square XX that ENDS at the last letter (n-1). Cheap per-append check. */
export function squareSuffixWitness(word: number[], minP = 1): Witness | null {
  const n = word.length;
  for (let p = minP; 2 * p <= n; p++) {
    if (blocksEqual(word, n - 2 * p, n - p, p)) {
      return { start: n - 2 * p, end: n, period: p };
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// overlap (a X a X a)                                                          //
// --------------------------------------------------------------------------- //

/** True if `word` contains an overlap factor of total length 2p+1 (period p >= 1). */
export function hasOverlap(word: number[]): boolean {
  return overlapWitness(word) !== null;
}

export function overlapWitness(word: number[]): Witness | null {
  const n = word.length;
  for (let start = 0; start < n; start++) {
    for (let p = 1; start + 2 * p + 1 <= n; p++) {
      if (hasPeriod(word, start, start + 2 * p + 1, p)) {
        return { start, end: start + 2 * p + 1, period: p };
      }
    }
  }
  return null;
}

/** Suffix-anchored overlap ending at the last letter. */
export function overlapSuffixWitness(word: number[]): Witness | null {
  const n = word.length;
  for (let p = 1; 2 * p + 1 <= n; p++) {
    const start = n - (2 * p + 1);
    if (hasPeriod(word, start, n, p)) {
      return { start, end: n, period: p };
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// abelian square (XY, Y a permutation of X)                                    //
// --------------------------------------------------------------------------- //

/** True if `word` contains an abelian square with |X| >= minP. */
export function hasAbelianSquare(word: number[], minP = 1): boolean {
  return abelianSquareWitness(word, minP) !== null;
}

export function abelianSquareWitness(word: number[], minP = 1): Witness | null {
  const n = word.length;
  for (let start = 0; start < n; start++) {
    for (let p = minP; start + 2 * p <= n; p++) {
      if (sameMultiset(word, start, start + p, p)) {
        return { start, end: start + 2 * p, period: p };
      }
    }
  }
  return null;
}

/** Suffix-anchored abelian square ending at the last letter. */
export function abelianSquareSuffixWitness(word: number[], minP = 1): Witness | null {
  const n = word.length;
  for (let p = minP; 2 * p <= n; p++) {
    if (sameMultiset(word, n - 2 * p, n - p, p)) {
      return { start: n - 2 * p, end: n, period: p };
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// shared helpers                                                               //
// --------------------------------------------------------------------------- //

/** word[a..a+len) === word[b..b+len) ? */
function blocksEqual(word: number[], a: number, b: number, len: number): boolean {
  for (let j = 0; j < len; j++) if (word[a + j] !== word[b + j]) return false;
  return true;
}

/** Does word[start..end) have period p (w[i] === w[i+p] for all valid i)? */
function hasPeriod(word: number[], start: number, end: number, p: number): boolean {
  for (let i = start; i + p < end; i++) if (word[i] !== word[i + p]) return false;
  return true;
}

/** Do word[a..a+len) and word[b..b+len) have the same letter multiset? */
function sameMultiset(word: number[], a: number, b: number, len: number): boolean {
  const count = new Map<number, number>();
  for (let j = 0; j < len; j++) {
    count.set(word[a + j], (count.get(word[a + j]) ?? 0) + 1);
    count.set(word[b + j], (count.get(word[b + j]) ?? 0) - 1);
  }
  for (const v of count.values()) if (v !== 0) return false;
  return true;
}

// --------------------------------------------------------------------------- //
// dispatch by repetition mode                                                  //
// --------------------------------------------------------------------------- //

/** Minimum block length |X| for a given mode (nontrivial forbids only |X| >= 2). */
function minPeriod(mode: RepMode): number {
  return mode === 'nontrivial' ? 2 : 1;
}

/** Full-word forbidden-factor witness for the given mode, or null if the word is clean. */
export function repetitionWitness(word: number[], mode: RepMode): Witness | null {
  switch (mode) {
    case 'overlap': return overlapWitness(word);
    case 'abelian': return abelianSquareWitness(word, 1);
    case 'nontrivial': return squareWitness(word, 2);
    default: return squareWitness(word, 1);
  }
}

/** Suffix-anchored forbidden-factor witness for the given mode (factor ends at last letter). */
export function repetitionSuffixWitness(word: number[], mode: RepMode): Witness | null {
  switch (mode) {
    case 'overlap': return overlapSuffixWitness(word);
    case 'abelian': return abelianSquareSuffixWitness(word, 1);
    case 'nontrivial': return squareSuffixWitness(word, 2);
    default: return squareSuffixWitness(word, 1);
  }
}

export const hasRepetition = (word: number[], mode: RepMode): boolean =>
  repetitionWitness(word, mode) !== null;

export { minPeriod };
