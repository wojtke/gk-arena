// Builders for the two game families. Both produce a `Hypergraph` the generic engine plays on.

import { GameConfig, Hypergraph } from './types';

/** Map an unordered vertex pair (i,j) of K_v to a contiguous edge index 0 … C(V,2)-1. */
export function edgeIndex(V: number): (i: number, j: number) => number {
  return (i, j) => {
    if (i > j) [i, j] = [j, i];
    return (i * (2 * V - i - 1)) / 2 + (j - i - 1);
  };
}

/** The list of vertex pairs in edge-index order. */
export function edgeList(V: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < V; i++) for (let j = i + 1; j < V; j++) out.push([i, j]);
  return out;
}

/** Van der Waerden: positions 0…N-1, winning sets = all k-term arithmetic progressions. */
export function vdwHypergraph(N: number, k: number): Hypergraph {
  const winningSets: number[][] = [];
  if (k === 1) {
    // A degenerate 1-term "AP" is a single position; emit one singleton per cell (not an
    // unbounded family). Guarding here keeps the engine robust if k=1 is ever requested directly —
    // the d-loop below would otherwise never terminate, since its bound (a < N) is independent of d.
    for (let a = 0; a < N; a++) winningSets.push([a]);
  } else if (k >= 2 && k <= N) {
    for (let a = 0; a < N; a++) {
      for (let d = 1; a + (k - 1) * d < N; d++) {
        const set: number[] = [];
        for (let t = 0; t < k; t++) set.push(a + t * d);
        winningSets.push(set);
      }
    }
  }
  return { cellCount: N, winningSets };
}

/** Ramsey clique game: edges of K_v, winning sets = edge-sets of all q-cliques. */
export function ramseyHypergraph(V: number, q: number): Hypergraph {
  const idx = edgeIndex(V);
  const cellCount = (V * (V - 1)) / 2;
  const winningSets: number[][] = [];
  if (q >= 2 && q <= V) {
    const combo: number[] = [];
    const choose = (start: number): void => {
      if (combo.length === q) {
        const edges: number[] = [];
        for (let i = 0; i < q; i++) for (let j = i + 1; j < q; j++) edges.push(idx(combo[i], combo[j]));
        winningSets.push(edges);
        return;
      }
      for (let v = start; v < V; v++) { combo.push(v); choose(v + 1); combo.pop(); }
    };
    choose(0);
  }
  return { cellCount, winningSets };
}

export function buildHypergraph(c: GameConfig): Hypergraph {
  return c.kind === 'vdw'
    ? vdwHypergraph(c.boardSize, c.target)
    : ramseyHypergraph(c.boardSize, c.target);
}

/** Size of a winning set (k for VdW, C(q,2) for Ramsey); 0 if there are none. */
export function setSize(hg: Hypergraph): number {
  return hg.winningSets.length ? hg.winningSets[0].length : 0;
}
