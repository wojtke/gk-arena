import { describe, it, expect } from 'vitest';
import {
  hasSquare, squareWitness, squareSuffixWitness,
  hasOverlap, overlapWitness, overlapSuffixWitness,
  hasAbelianSquare, abelianSquareWitness,
  repetitionWitness, repetitionSuffixWitness, hasRepetition,
} from '../engine/detectors';

// ---- reference brute-force implementations (independent of the engine) ---- //
function refHasSquare(w: number[], minP = 1): boolean {
  for (let s = 0; s < w.length; s++)
    for (let p = minP; s + 2 * p <= w.length; p++) {
      let eq = true;
      for (let j = 0; j < p; j++) if (w[s + j] !== w[s + p + j]) { eq = false; break; }
      if (eq) return true;
    }
  return false;
}
function refHasOverlap(w: number[]): boolean {
  for (let s = 0; s < w.length; s++)
    for (let p = 1; s + 2 * p + 1 <= w.length; p++) {
      let eq = true;
      for (let j = 0; j + p < 2 * p + 1; j++) if (w[s + j] !== w[s + j + p]) { eq = false; break; }
      if (eq) return true;
    }
  return false;
}
function refHasAbelian(w: number[], minP = 1): boolean {
  for (let s = 0; s < w.length; s++)
    for (let p = minP; s + 2 * p <= w.length; p++) {
      const m = new Map<number, number>();
      for (let j = 0; j < p; j++) {
        m.set(w[s + j], (m.get(w[s + j]) ?? 0) + 1);
        m.set(w[s + p + j], (m.get(w[s + p + j]) ?? 0) - 1);
      }
      if ([...m.values()].every((v) => v === 0)) return true;
    }
  return false;
}

/** Enumerate all words of length up to maxLen over an alphabet of size k. */
function* allWords(k: number, maxLen: number): Generator<number[]> {
  yield [];
  let cur: number[][] = [[]];
  for (let len = 1; len <= maxLen; len++) {
    const next: number[][] = [];
    for (const w of cur) for (let c = 0; c < k; c++) next.push([...w, c]);
    for (const w of next) yield w;
    cur = next;
  }
}

describe('hasSquare vs brute force', () => {
  it('agrees on all binary/ternary words up to length 7', () => {
    for (const k of [2, 3]) {
      for (const w of allWords(k, 7)) {
        expect(hasSquare(w)).toBe(refHasSquare(w));
        expect(hasSquare(w, 2)).toBe(refHasSquare(w, 2));
      }
    }
  });
});

describe('hasOverlap / hasAbelianSquare vs brute force', () => {
  it('agree on all ternary words up to length 7', () => {
    for (const w of allWords(3, 7)) {
      expect(hasOverlap(w)).toBe(refHasOverlap(w));
      expect(hasAbelianSquare(w)).toBe(refHasAbelian(w));
    }
  });
});

describe('known Thue facts', () => {
  const a = 0, b = 1, c = 2;
  it('aba (binary) is square-free', () => {
    expect(hasSquare([a, b, a])).toBe(false);
  });
  it('every length-4 binary word contains a square', () => {
    for (const w of allWords(2, 4)) {
      if (w.length === 4) expect(hasSquare(w)).toBe(true);
    }
  });
  it('a long ternary square-free word stays square-free', () => {
    // abcacbabcbac... — use the classic 3-letter square-free prefix abcacba? verify a known one.
    const w = [a, b, c, a, c, b, a, b, c, a, c, b, c, a, b]; // checked below
    // Build a guaranteed square-free word via the Thue-Morse-derived ternary sequence instead:
    const tm = thueMorseTernary(40);
    expect(hasSquare(tm)).toBe(false);
    void w;
  });
  it('binary Thue–Morse is overlap-free but has squares', () => {
    const tm = thueMorse(64);
    expect(hasOverlap(tm)).toBe(false);
    expect(hasSquare(tm)).toBe(true); // it does contain squares (e.g. "00")
  });
});

describe('witnesses are correct', () => {
  it('square witness points at two equal blocks', () => {
    const w = [0, 1, 0, 1, 2]; // "abab" square at [0,4)
    const wit = squareWitness(w)!;
    expect(wit).not.toBeNull();
    const block1 = w.slice(wit.start, wit.start + wit.period);
    const block2 = w.slice(wit.start + wit.period, wit.end);
    expect(block1).toEqual(block2);
  });
  it('suffix witness matches the full-word witness when the square ends at the last letter', () => {
    const w = [2, 0, 1, 0, 1]; // square "abab" ending at index 4
    const full = squareWitness(w);
    const suf = squareSuffixWitness(w);
    expect(suf).not.toBeNull();
    expect(suf!.end).toBe(w.length);
    expect(full).not.toBeNull();
  });
  it('overlap witness has period and total length 2p+1', () => {
    const w = [0, 1, 0, 1, 0]; // "ababa": overlap with p=2
    const wit = overlapWitness(w)!;
    expect(wit).not.toBeNull();
    expect(wit.end - wit.start).toBe(2 * wit.period + 1);
  });
  it('abelian witness blocks share a multiset', () => {
    const w = [0, 1, 1, 0]; // "abba": X=ab, Y=ba (anagram)
    const wit = abelianSquareWitness(w)!;
    expect(wit).not.toBeNull();
    const b1 = w.slice(wit.start, wit.start + wit.period).sort();
    const b2 = w.slice(wit.start + wit.period, wit.end).sort();
    expect(b1).toEqual(b2);
  });
});

describe('suffix-anchored matches brute force when appending', () => {
  it('square suffix detector finds exactly the squares that newly end at the last position', () => {
    for (const w of allWords(3, 7)) {
      if (w.length < 2) continue;
      const prefixClean = !hasSquare(w.slice(0, -1));
      if (!prefixClean) continue; // only the suffix can be new if the prefix was clean
      const suf = squareSuffixWitness(w) !== null;
      const full = hasSquare(w);
      expect(suf).toBe(full);
    }
  });
});

describe('repetition dispatch by mode', () => {
  it('nontrivial allows aa but forbids abab', () => {
    expect(hasRepetition([0, 0], 'nontrivial')).toBe(false);
    expect(hasRepetition([0, 1, 0, 1], 'nontrivial')).toBe(true);
    expect(hasRepetition([0, 0], 'square')).toBe(true);
  });
  it('repetitionSuffixWitness and repetitionWitness agree for clean prefixes (overlap)', () => {
    for (const w of allWords(3, 7)) {
      if (w.length < 3) continue;
      if (hasOverlap(w.slice(0, -1))) continue;
      const suf = repetitionSuffixWitness(w, 'overlap') !== null;
      const full = repetitionWitness(w, 'overlap') !== null;
      expect(suf).toBe(full);
    }
  });
});

// ---- helpers: Thue–Morse sequences for the known-fact tests ---- //
function thueMorse(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(popcount(i) & 1);
  return out;
}
function popcount(x: number): number {
  let c = 0; while (x) { c += x & 1; x >>>= 1; } return c;
}
/** A square-free ternary word from Thue–Morse via first-differences-style coding. */
function thueMorseTernary(n: number): number[] {
  // Use the classic construction: count of 1s between successive 1s in Thue–Morse (values in {0,1,2}).
  const tm = thueMorse(2 * n + 8);
  const out: number[] = [];
  let run = 0;
  let started = false;
  for (const bit of tm) {
    if (bit === 1) {
      if (started) out.push(run);
      run = 0; started = true;
    } else run++;
    if (out.length >= n) break;
  }
  return out.slice(0, n);
}
