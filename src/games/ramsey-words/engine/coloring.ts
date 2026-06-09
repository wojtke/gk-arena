// The fixed colouring χ : Aˡ → {0…c-1}. χ is a flat Uint8Array of size alpha^l, indexed by the
// base-|A| value of an l-gram. Two ways to build it:
//   - buildColoring(alpha,l,c,seed): fill in ASCENDING index order, χ[idx] = floor(rng()*c) from ONE
//     makeRng(seed) stream — so a given (alpha,l,c,seed) always reproduces the same table.
//   - a PRESET: a hand-built χ (used by the abbc test, where χ('ab') == χ('bc')).
// colorOf reads the l-gram starting at i as a base-|A| index and looks it up.

import { makeRng } from '../../../common/rng';

/** Largest allowed table size: keep alpha^l ≤ 256 (cap l ≤ 3, |A| ≤ 4). */
export const MAX_TABLE = 256;

/** Number of distinct l-grams = alpha^l (the χ table size). */
export function tableSize(alpha: number, l: number): number {
  return Math.pow(alpha, l);
}

/**
 * Deterministic random colouring. Draw one value per entry in ascending index order from a single
 * makeRng(seed) stream: for idx in 0…alpha^l-1, χ[idx] = floor(rng()*c).
 */
export function buildColoring(alpha: number, l: number, c: number, seed: number): Uint8Array {
  const size = tableSize(alpha, l);
  const table = new Uint8Array(size);
  const rng = makeRng(seed);
  for (let idx = 0; idx < size; idx++) table[idx] = Math.floor(rng() * c) % c;
  return table;
}

/**
 * Base-|A| index of the l-gram starting at position i in `word`. Most-significant digit first:
 * idx = w[i]*alpha^(l-1) + w[i+1]*alpha^(l-2) + … + w[i+l-1]. Caller guarantees i+l ≤ word.length.
 */
export function gramIndex(word: readonly number[], i: number, l: number, alpha: number): number {
  let idx = 0;
  for (let j = 0; j < l; j++) idx = idx * alpha + word[i + j];
  return idx;
}

/** Colour of the l-gram starting at i, read from χ. Caller guarantees i+l ≤ word.length. */
export function colorOf(word: readonly number[], i: number, l: number, coloring: Uint8Array, alpha: number): number {
  return coloring[gramIndex(word, i, l, alpha)];
}

// --- presets --- //

/** A preset: a name plus a factory that builds χ for the given (alpha,l,c). */
export interface Preset {
  name: string;
  label: string;
  /** Required alphabet/block/colour shape this preset is defined for (for the UI to sync ranges). */
  alpha: number;
  l: number;
  c: number;
  build(): Uint8Array;
}

/**
 * Build a χ over alpha=3, l=2, c=2 in which χ('ab') == χ('bc') (both colour 1) so the factor `abbc`
 * is a Constructor win: blocks 'ab' (positions 0-1) and 'bc' (positions 2-3) share colour 1.
 * Letters: a=0, b=1, c=2. 'ab' = idx 0*3+1 = 1; 'bc' = idx 1*3+2 = 5.
 */
function buildAbbcPreset(): Uint8Array {
  const alpha = 3, l = 2;
  const table = new Uint8Array(tableSize(alpha, l)); // all colour 0 by default
  table[gramIndex([0, 1], 0, l, alpha)] = 1; // χ('ab') = 1
  table[gramIndex([1, 2], 0, l, alpha)] = 1; // χ('bc') = 1
  return table;
}

/**
 * A "balanced" demo colouring for the default (alpha=2,l=2,c=2): assigns colours so the game is a
 * real contest rather than trivially won/lost. Hand-tuned over the 4 length-2 words aa,ab,ba,bb.
 *   aa→0, ab→1, ba→1, bb→0  (idx aa=0, ab=1, ba=2, bb=3)
 */
function buildBalancedPreset(): Uint8Array {
  const alpha = 2, l = 2;
  const table = new Uint8Array(tableSize(alpha, l));
  table[gramIndex([0, 0], 0, l, alpha)] = 0; // aa
  table[gramIndex([0, 1], 0, l, alpha)] = 1; // ab
  table[gramIndex([1, 0], 0, l, alpha)] = 1; // ba
  table[gramIndex([1, 1], 0, l, alpha)] = 0; // bb
  return table;
}

/**
 * The DEFAULT colouring: a curated CONTEST over (alpha=4, l=2, c=4). Random χ at l=2 is hopeless —
 * the Constructor forces a win in ~5 letters for essentially every seed — while l=1 is a trivial
 * Avoider walkover (abab…). This hand-built χ instead has "survivable n* = 8": the exact solver
 * proves the AVOIDER can reach length 8 with PERFECT play, yet a single slip loses (only 1 of the 4
 * opening letters keeps the win), and the Constructor wins outright for any longer target. So the
 * default n=8 is genuinely two-sided — neither side wins by default, play quality decides it.
 *
 * χ over the 16 digrams (a=0,b=1,c=2,d=3), colours 0-3:
 *   aa=2 ab=2 ac=2 ad=1  ba=2 bb=2 bc=1 bd=3  ca=3 cb=2 cc=0 cd=1  da=1 db=3 dc=3 dd=2
 * (found by an exhaustive/sampled exact-solver sweep over χ tables — see src/sim.)
 */
function buildContestPreset(): Uint8Array {
  // flat table indexed by the base-4 digram value (MSB first); see the χ comment above.
  return Uint8Array.from([2, 2, 2, 1, 2, 2, 1, 3, 3, 2, 0, 1, 1, 3, 3, 2]);
}

export const PRESETS: Preset[] = [
  { name: 'contest', label: 'Contest (|A|=4, l=2, c=4) — default', alpha: 4, l: 2, c: 4, build: buildContestPreset },
  { name: 'balanced', label: 'Balanced (|A|=2, l=2, c=2)', alpha: 2, l: 2, c: 2, build: buildBalancedPreset },
  { name: 'abbc', label: 'abbc demo (|A|=3, l=2, c=2)', alpha: 3, l: 2, c: 2, build: buildAbbcPreset },
];

export function getPreset(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name);
}

/** Build χ for a config: a named preset if present and applicable, else the seeded random table. */
export function coloringFor(config: { alpha: number; l: number; c: number; seed: number; preset?: string }): Uint8Array {
  if (config.preset) {
    const p = getPreset(config.preset);
    if (p && p.alpha === config.alpha && p.l === config.l && p.c === config.c) return p.build();
  }
  return buildColoring(config.alpha, config.l, config.c, config.seed);
}
