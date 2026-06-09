import { describe, it, expect } from 'vitest';
import { vdwHypergraph, ramseyHypergraph, edgeIndex, edgeList, setSize } from '../hypergraph';

function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const combo: number[] = [];
  const rec = (start: number) => {
    if (combo.length === k) { out.push(combo.slice()); return; }
    for (let v = start; v < n; v++) { combo.push(v); rec(v + 1); combo.pop(); }
  };
  rec(0);
  return out;
}
const choose = (n: number, k: number) => combinations(n, k).length;

describe('vdwHypergraph', () => {
  it('enumerates exactly the k-term arithmetic progressions (vs subset brute force)', () => {
    for (const [N, k] of [[5, 3], [9, 3], [10, 4], [8, 2]] as const) {
      const brute = combinations(N, k).filter(s => {
        const d = s[1] - s[0];
        return d > 0 && s.every((v, i) => i === 0 || v - s[i - 1] === d);
      }).length;
      const hg = vdwHypergraph(N, k);
      expect(hg.winningSets.length).toBe(brute);
      expect(hg.winningSets.every(s => s.length === k)).toBe(true);
      expect(setSize(hg)).toBe(k);
    }
  });
  it('has no winning sets when k > N', () => {
    expect(vdwHypergraph(3, 5).winningSets.length).toBe(0);
  });
  it('does not hang and returns well-formed singletons for the degenerate k=1', () => {
    // k=1 used to infinite-loop (the d-loop bound a < N is independent of d). It must terminate
    // and emit exactly one singleton per cell.
    const hg = vdwHypergraph(5, 1);
    expect(hg.cellCount).toBe(5);
    expect(hg.winningSets.length).toBe(5);
    expect(hg.winningSets.every(s => s.length === 1)).toBe(true);
    expect(hg.winningSets.map(s => s[0]).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });
  it('has no winning sets for k <= 0', () => {
    expect(vdwHypergraph(5, 0).winningSets.length).toBe(0);
  });
});

describe('ramseyHypergraph', () => {
  it('enumerates C(V,q) cliques, each with C(q,2) valid edge indices', () => {
    for (const [V, q] of [[4, 3], [5, 3], [6, 4]] as const) {
      const hg = ramseyHypergraph(V, q);
      expect(hg.winningSets.length).toBe(choose(V, q));
      expect(hg.cellCount).toBe(choose(V, 2));
      for (const s of hg.winningSets) {
        expect(s.length).toBe(choose(q, 2));
        expect(new Set(s).size).toBe(s.length);
        expect(s.every(c => c >= 0 && c < hg.cellCount)).toBe(true);
      }
    }
  });
  it('has no winning sets for degenerate q < 3 (and does not hang)', () => {
    // q<2 / q>V produce no cliques; the builder must return well-formed empty families.
    expect(ramseyHypergraph(5, 1).winningSets.length).toBe(0);
    expect(ramseyHypergraph(5, 0).winningSets.length).toBe(0);
    const q2 = ramseyHypergraph(5, 2); // a "2-clique" is a single edge — C(5,2)=10 of them
    expect(q2.winningSets.length).toBe(choose(5, 2));
    expect(q2.winningSets.every(s => s.length === 1)).toBe(true);
  });
});

describe('edgeIndex / edgeList', () => {
  it('are mutually consistent', () => {
    const V = 6;
    const idx = edgeIndex(V);
    edgeList(V).forEach(([i, j], e) => expect(idx(i, j)).toBe(e));
    expect(idx(3, 1)).toBe(idx(1, 3)); // unordered
  });
});
