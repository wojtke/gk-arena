import { describe, it, expect } from 'vitest';
import {
  cellsOf, cellsOfPlacement, spanEnd, isLegal, applyToCells,
  legalStartsFor, legalPlacements, usedLength, coveredCount,
} from '../engine/strip';
import { Cell } from '../engine/types';

function emptyStrip(L: number): Cell[] {
  return new Array<Cell>(L).fill(null);
}

/** Brute-force occupancy check used to cross-validate isLegal. */
function bruteLegal(occ: Cell[], start: number, d: number, len: number): boolean {
  if (len < 1 || d < 1 || start < 0) return false;
  for (let t = 0; t < len; t++) {
    const c = start + t * d;
    if (c < 0 || c >= occ.length) return false;
    if (occ[c] !== null) return false;
  }
  return true;
}

describe('cellsOf', () => {
  it('produces the arithmetic progression cells', () => {
    expect(cellsOf(2, 3, 4)).toEqual([2, 5, 8, 11]);
    expect(cellsOf(0, 1, 3)).toEqual([0, 1, 2]);
    expect(cellsOf(5, 1, 1)).toEqual([5]);
  });
  it('cellsOfPlacement matches cellsOf', () => {
    expect(cellsOfPlacement({ start: 1, d: 2, len: 3 })).toEqual(cellsOf(1, 2, 3));
  });
  it('spanEnd is the last cell index', () => {
    expect(spanEnd(2, 3, 4)).toBe(11);
    expect(spanEnd(0, 1, 1)).toBe(0);
  });
});

describe('isLegal vs brute force', () => {
  it('agrees with a brute occupancy check across many cases on a partly-filled strip', () => {
    const L = 14;
    const occ = emptyStrip(L);
    occ[3] = 'R'; occ[7] = 'B'; occ[8] = 'x';
    for (let start = -1; start <= L; start++) {
      for (let d = 1; d <= 4; d++) {
        for (let len = 1; len <= 5; len++) {
          expect(isLegal(occ, start, d, len)).toBe(bruteLegal(occ, start, d, len));
        }
      }
    }
  });
  it('rejects out-of-bounds and overlaps', () => {
    const occ = emptyStrip(6);
    occ[2] = 'R';
    expect(isLegal(occ, 0, 2, 3)).toBe(false); // hits index 2
    expect(isLegal(occ, 0, 1, 7)).toBe(false); // out of bounds
    expect(isLegal(occ, 3, 1, 3)).toBe(true);
    expect(isLegal(occ, 0, 0, 2)).toBe(false); // d must be >= 1
  });
});

describe('applyToCells', () => {
  it('marks the right cells and does not mutate the input', () => {
    const occ = emptyStrip(8);
    const next = applyToCells(occ, { start: 1, d: 2, len: 3 }, 'R');
    expect(next[1]).toBe('R'); expect(next[3]).toBe('R'); expect(next[5]).toBe('R');
    expect(next[0]).toBe(null);
    expect(occ.every((c) => c === null)).toBe(true);
  });
});

describe('legalStartsFor / legalPlacements', () => {
  it('legalStartsFor lists exactly the valid starts (vs brute)', () => {
    const occ = emptyStrip(10);
    occ[4] = 'R';
    const d = 2, len = 3;
    const brute: number[] = [];
    for (let s = 0; s < 10; s++) if (bruteLegal(occ, s, d, len)) brute.push(s);
    expect(legalStartsFor(occ, d, len)).toEqual(brute);
  });
  it('legalPlacements enumerates over all allowed (d,len) and is all-legal', () => {
    const occ = emptyStrip(9);
    occ[0] = 'B';
    const ps = legalPlacements(occ, [1, 2], [2, 3]);
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) expect(isLegal(occ, p.start, p.d, p.len)).toBe(true);
    // count must equal sum of legalStartsFor over the grid
    let total = 0;
    for (const d of [1, 2]) for (const len of [2, 3]) total += legalStartsFor(occ, d, len).length;
    expect(ps.length).toBe(total);
  });
  it('returns nothing when nothing fits', () => {
    const occ = emptyStrip(2);
    expect(legalStartsFor(occ, 1, 5)).toEqual([]);
  });
});

describe('usedLength / coveredCount', () => {
  it('usedLength is the span of occupied cells', () => {
    const occ = emptyStrip(10);
    expect(usedLength(occ)).toBe(0);
    occ[2] = 'R'; occ[6] = 'B';
    expect(usedLength(occ)).toBe(5); // cells 2..6
    expect(coveredCount(occ)).toBe(2);
  });
});
