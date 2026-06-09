import { describe, it, expect } from 'vitest';
import { classify, largestHomogeneous } from '../engine/patterns';
import { Edge, Pattern } from '../engine/types';

const e = (lo: number, hi: number): Edge => ({ lo, hi, color: 'R' });

describe('classify', () => {
  it('identifies the three patterns', () => {
    expect(classify(e(1, 3), e(2, 4))).toBe('crossing');
    expect(classify(e(1, 4), e(2, 3))).toBe('nesting');
    expect(classify(e(1, 2), e(3, 4))).toBe('alignment');
  });
  it('is order-independent', () => {
    expect(classify(e(2, 4), e(1, 3))).toBe('crossing');
    expect(classify(e(2, 3), e(1, 4))).toBe('nesting');
    expect(classify(e(3, 4), e(1, 2))).toBe('alignment');
  });
});

describe('largestHomogeneous — canonical forms', () => {
  it('detects a k-crossing', () => {
    expect(largestHomogeneous([e(1, 4), e(2, 5), e(3, 6)], 'crossing').size).toBe(3);
  });
  it('detects a k-nesting', () => {
    expect(largestHomogeneous([e(1, 6), e(2, 5), e(3, 4)], 'nesting').size).toBe(3);
  });
  it('detects a k-alignment', () => {
    expect(largestHomogeneous([e(1, 2), e(3, 4), e(5, 6)], 'alignment').size).toBe(3);
  });
  it('returns a witness of the reported size', () => {
    const r = largestHomogeneous([e(1, 4), e(2, 5), e(3, 6), e(7, 8)], 'crossing');
    expect(r.witness.length).toBe(r.size);
  });
});

// ---- brute-force property test (mirrors the standalone verification) ----
function bruteforce(edges: Edge[], type: Pattern): number {
  const m = edges.length;
  let best = 0;
  for (let mask = 1; mask < 1 << m; mask++) {
    const sel: Edge[] = [];
    for (let i = 0; i < m; i++) if (mask & (1 << i)) sel.push(edges[i]);
    let ok = true;
    for (let i = 0; i < sel.length && ok; i++)
      for (let j = i + 1; j < sel.length && ok; j++)
        if (classify(sel[i], sel[j]) !== type) ok = false;
    if (ok) best = Math.max(best, sel.length);
  }
  return best;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function randomSubMatching(P: number, rnd: () => number): Edge[] {
  const free: number[] = [];
  for (let p = 1; p <= P; p++) free.push(p);
  const out: Edge[] = [];
  while (free.length >= 2 && rnd() < 0.85) {
    const a = free.splice(Math.floor(rnd() * free.length), 1)[0];
    const b = free.splice(Math.floor(rnd() * free.length), 1)[0];
    out.push(e(Math.min(a, b), Math.max(a, b)));
  }
  return out;
}

describe('largestHomogeneous matches brute force', () => {
  it('agrees on 20000 random sub-matchings', () => {
    const rnd = mulberry(99);
    const types: Pattern[] = ['crossing', 'nesting', 'alignment'];
    for (let t = 0; t < 20000; t++) {
      const P = 2 * (1 + Math.floor(rnd() * 6));
      const E = randomSubMatching(P, rnd);
      for (const type of types) {
        expect(largestHomogeneous(E, type).size).toBe(bruteforce(E, type));
      }
    }
  });
});
