import { describe, it, expect } from 'vitest';
import {
  isShuffleSquare, isShuffleOrderIso, patternOf, hasTightTwins, findWitness,
} from '../engine/twins';

// --- reference implementations (brute force over all 2-colourings / half-size subsets) --- //

function refPattern(seq: number[]): string {
  const order = seq.map((_, i) => i).sort((i, j) => (seq[i] - seq[j]) || (i - j));
  const rank = new Array<number>(seq.length);
  for (let r = 0; r < order.length; r++) rank[order[r]] = r;
  return rank.join(',');
}

/** Brute force: try every assignment of each position to copy A or copy B; equal split & sizes. */
function refShuffleSquare(factor: number[]): boolean {
  const n = factor.length;
  if (n === 0 || n % 2 !== 0) return false;
  for (let mask = 0; mask < (1 << n); mask++) {
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i < n; i++) ((mask >> i) & 1 ? a : b).push(factor[i]);
    if (a.length !== b.length) continue;
    if (a.length === n / 2 && a.join(',') === b.join(',')) return true;
  }
  return false;
}

function refShuffleOrderIso(factor: number[]): boolean {
  const n = factor.length;
  if (n === 0 || n % 2 !== 0) return false;
  for (let mask = 0; mask < (1 << n); mask++) {
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i < n; i++) ((mask >> i) & 1 ? a : b).push(factor[i]);
    if (a.length !== n / 2) continue;
    if (refPattern(a) === refPattern(b)) return true;
  }
  return false;
}

function* allWords(alphabet: number, len: number): Generator<number[]> {
  const total = alphabet ** len;
  for (let code = 0; code < total; code++) {
    const w: number[] = [];
    let c = code;
    for (let i = 0; i < len; i++) { w.push(c % alphabet); c = Math.floor(c / alphabet); }
    yield w;
  }
}

function* allPerms(m: number): Generator<number[]> {
  const base = Array.from({ length: m }, (_, i) => i + 1);
  const rec = function* (arr: number[], chosen: number[]): Generator<number[]> {
    if (arr.length === 0) { yield chosen.slice(); return; }
    for (let i = 0; i < arr.length; i++) {
      yield* rec([...arr.slice(0, i), ...arr.slice(i + 1)], [...chosen, arr[i]]);
    }
  };
  yield* rec(base, []);
}

describe('patternOf (order type)', () => {
  it('reduces equal-pattern sequences to the same pattern', () => {
    expect(patternOf([5, 8, 6]).join(',')).toBe(patternOf([3, 9, 7]).join(','));
    expect(patternOf([5, 8, 6]).join(',')).toBe('0,2,1'); // pattern 132 (0-indexed)
  });
  it('distinguishes different patterns', () => {
    expect(patternOf([1, 2, 3]).join(',')).not.toBe(patternOf([1, 3, 2]).join(','));
  });
});

describe('isShuffleSquare — known cases', () => {
  const L = (s: string) => [...s].map(ch => ch.charCodeAt(0));
  it('"aabb" IS a shuffle square (positions {0,2}/{1,3})', () => {
    expect(isShuffleSquare(L('aabb'))).toBe(true);
  });
  it('"abab" IS a shuffle square', () => {
    expect(isShuffleSquare(L('abab'))).toBe(true);
  });
  it('"abba" is NOT a shuffle square', () => {
    expect(isShuffleSquare(L('abba'))).toBe(false);
  });
  it('"abc" (odd) is not a shuffle square', () => {
    expect(isShuffleSquare(L('abc'))).toBe(false);
  });
  it('"aaaa" IS a shuffle square', () => {
    expect(isShuffleSquare(L('aaaa'))).toBe(true);
  });
});

describe('isShuffleSquare — vs brute force on all short words', () => {
  it('matches the reference for alphabet 2, lengths 2,4,6', () => {
    for (const len of [2, 4, 6]) {
      for (const w of allWords(2, len)) {
        expect(isShuffleSquare(w)).toBe(refShuffleSquare(w));
      }
    }
  });
  it('matches the reference for alphabet 3, lengths 2,4', () => {
    for (const len of [2, 4]) {
      for (const w of allWords(3, len)) {
        expect(isShuffleSquare(w)).toBe(refShuffleSquare(w));
      }
    }
  });
});

describe('isShuffleOrderIso — known cases & vs brute force', () => {
  it('[1,3,2,4] splits into order-isomorphic halves', () => {
    // {1,3} pattern 12 and {2,4} pattern 12 -> order-iso
    expect(isShuffleOrderIso([1, 3, 2, 4])).toBe(true);
  });
  it('matches the reference for all permutations of length 4 and 6', () => {
    for (const m of [4, 6]) {
      for (const p of allPerms(m)) {
        expect(isShuffleOrderIso(p)).toBe(refShuffleOrderIso(p));
      }
    }
  });
});

describe('hasTightTwins — factor scan', () => {
  const L = (s: string) => [...s].map(ch => ch.charCodeAt(0));
  it('finds tight twins inside a longer word', () => {
    expect(hasTightTwins(L('xaabb'), 'words', 1)).toBe(true); // "aabb" factor
  });
  it('returns false for a tight-twin-free word', () => {
    expect(hasTightTwins(L('abc'), 'words', 1)).toBe(false);
  });
  it('respects minBlock (length-1 twins ignored when minBlock=2)', () => {
    expect(hasTightTwins(L('aa'), 'words', 1)).toBe(true);
    expect(hasTightTwins(L('aa'), 'words', 2)).toBe(false);
  });
});

describe('findWitness — correctness', () => {
  const L = (s: string) => [...s].map(ch => ch.charCodeAt(0));
  it('returns disjoint index sets that cover the factor and are EQUAL (words)', () => {
    const seq = L('zaabb');
    const w = findWitness(seq, 'words', 1)!;
    expect(w).toBeDefined();
    const a = new Set(w.a);
    const b = new Set(w.b);
    // disjoint
    for (const i of w.a) expect(b.has(i)).toBe(false);
    // cover the whole factor exactly
    const cover = [...w.a, ...w.b].sort((x, y) => x - y);
    const factorIdx = [];
    for (let i = w.start; i < w.end; i++) factorIdx.push(i);
    expect(cover).toEqual(factorIdx);
    // equal copies (in absolute order within each set)
    const av = w.a.slice().sort((x, y) => x - y).map(i => seq[i]);
    const bv = w.b.slice().sort((x, y) => x - y).map(i => seq[i]);
    expect(av).toEqual(bv);
    void a;
  });

  it('returns ORDER-ISOMORPHIC copies for a permutation factor', () => {
    const seq = [1, 3, 2, 4];
    const w = findWitness(seq, 'perm', 2)!;
    expect(w).toBeDefined();
    // disjoint + cover
    const cover = [...w.a, ...w.b].sort((x, y) => x - y);
    const factorIdx = [];
    for (let i = w.start; i < w.end; i++) factorIdx.push(i);
    expect(cover).toEqual(factorIdx);
    // order-isomorphic copies
    const av = w.a.slice().sort((x, y) => x - y).map(i => seq[i]);
    const bv = w.b.slice().sort((x, y) => x - y).map(i => seq[i]);
    expect(patternOf(av).join(',')).toBe(patternOf(bv).join(','));
  });

  it('returns undefined when there are no tight twins', () => {
    expect(findWitness(L('abc'), 'words', 1)).toBeUndefined();
  });

  it('witness existence agrees with hasTightTwins on short words', () => {
    for (const w of allWords(2, 6)) {
      const has = hasTightTwins(w, 'words', 1);
      const wit = findWitness(w, 'words', 1);
      expect(!!wit).toBe(has);
    }
  });
});
