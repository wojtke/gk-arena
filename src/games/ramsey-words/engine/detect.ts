// Adjacent same-colour detection — the crux of Ramsey Words.
//
// CONSTRUCTOR wins the instant the word contains two ADJACENT length-l blocks of equal colour:
//   some i with χ(w[i..i+l-1]) == χ(w[i+l..i+2l-1]).
// We scan i = 0 … |w|-2l and compare χ of the two adjacent blocks. Colours are letter-based, so a
// full rescan after each insert is cheap and correct.

import { colorOf } from './coloring';

/**
 * Find the first (earliest) start index i of a monochromatic adjacent pair, or null. The two blocks
 * span [i, i+l) and [i+l, i+2l); both fit when i + 2l ≤ |w|.
 */
export function findAdjacentMono(
  word: readonly number[], l: number, coloring: Uint8Array, alpha: number,
): { i: number; color: number } | null {
  const lim = word.length - 2 * l;
  for (let i = 0; i <= lim; i++) {
    const left = colorOf(word, i, l, coloring, alpha);
    const right = colorOf(word, i + l, l, coloring, alpha);
    if (left === right) return { i, color: left };
  }
  return null;
}

/** True iff the word contains two adjacent same-colour length-l blocks. */
export function hasAdjacentMono(word: readonly number[], l: number, coloring: Uint8Array, alpha: number): boolean {
  return findAdjacentMono(word, l, coloring, alpha) !== null;
}
