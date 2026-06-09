import { describe, it, expect } from 'vitest';
import {
  newGame, legalMoves, applyMove, currentPlayer, isOver,
} from '../engine/rules';
import { buildColoring, colorOf, gramIndex, coloringFor, getPreset, tableSize } from '../engine/coloring';
import { solve } from '../engine/ai';
import { AVOIDER, CONSTRUCTOR, GameConfig, GameState } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    alpha: 2, l: 2, c: 2, n: 8, seed: 1,
    humanRole: 'none', aiLevel: { A: 0, C: 0 }, ...over,
  };
}

/** Constructor points at gap g, then Avoider inserts letter a. */
function play(s: GameState, g: number, a: number): GameState {
  return applyMove(applyMove(s, g), a);
}

describe('buildColoring', () => {
  it('is deterministic for a fixed (alpha,l,c,seed)', () => {
    const a = buildColoring(3, 2, 2, 42);
    const b = buildColoring(3, 2, 2, 42);
    expect(Array.from(a)).toEqual(Array.from(b));
  });
  it('has the right table size (alpha^l) and colours in 0..c-1', () => {
    const t = buildColoring(4, 3, 3, 7);
    expect(t.length).toBe(tableSize(4, 3)); // 64
    expect(t.length).toBe(64);
    for (const v of t) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThan(3);
  });
  it('differs across seeds (at least sometimes)', () => {
    const a = buildColoring(3, 2, 2, 1);
    const b = buildColoring(3, 2, 2, 999);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('gramIndex / colorOf base-|A| indexing', () => {
  it('reads the l-gram as a base-alpha number, MSB first', () => {
    // alpha=3, l=2: 'bc' = [1,2] -> 1*3 + 2 = 5
    expect(gramIndex([1, 2], 0, 2, 3)).toBe(5);
    // 'ab' = [0,1] -> 0*3 + 1 = 1
    expect(gramIndex([0, 1], 0, 2, 3)).toBe(1);
  });
  it('colorOf reads χ at the gram index', () => {
    const table = buildColoring(3, 2, 2, 5);
    expect(colorOf([0, 1, 2], 1, 2, table, 3)).toBe(table[gramIndex([1, 2], 0, 2, 3)]);
  });
});

describe('win detection — abbc preset (χ(ab)==χ(bc))', () => {
  it('detects the abbc Constructor win via the crafted preset', () => {
    const config = cfg({ alpha: 3, l: 2, c: 2, n: 10, preset: 'abbc' });
    const s = newGame(config);
    // preset must put 'ab' and 'bc' in the same colour
    const p = getPreset('abbc')!;
    const table = p.build();
    const alpha = 3;
    expect(colorOf([0, 1], 0, 2, table, alpha)).toBe(colorOf([1, 2], 0, 2, table, alpha));
    // play letters a,b,b,c at the end each time -> word [a,b,b,c]; blocks 'ab' (0-1) and 'bc' (2-3)
    let g = play(s, 0, 0);            // [a]
    g = play(g, 1, 1);              // [a,b]
    g = play(g, 2, 1);              // [a,b,b]
    g = play(g, 3, 2);              // [a,b,b,c]
    expect(g.word).toEqual([0, 1, 1, 2]);
    expect(g.winner).toBe(CONSTRUCTOR);
    expect(g.witness).toEqual({ i: 0, color: 1 });
  });

  it('negative: abc (no adjacent same-colour pair) is not a Constructor win', () => {
    const config = cfg({ alpha: 3, l: 1, c: 3, n: 10, preset: undefined, seed: 1 });
    // l=1, c=3, identity-ish random — but use a known table where a,b,c all differ:
    const s0 = newGame(config);
    // patch coloring to identity so colours are 0,1,2 for a,b,c
    const s: GameState = { ...s0, coloring: Uint8Array.from([0, 1, 2]) };
    let g = play(s, 0, 0);   // a
    g = play(g, 1, 1);     // ab
    g = play(g, 2, 2);     // abc -> colours 0,1,2 no adjacent equal
    expect(g.winner).toBeNull();
  });
});

describe('insertion re-scan correctness', () => {
  it('an insert in the MIDDLE can create the winning adjacency', () => {
    // preset abbc: word [a,b,c] (colours χ(ab)=1, χ(bc)=1 adjacent? ab at 0, bc at 1 -> overlap not adjacent)
    // To get adjacency we need blocks at i and i+l. With l=2, insert to make [a,b,b,c].
    const config = cfg({ alpha: 3, l: 2, c: 2, n: 10, preset: 'abbc' });
    let s = newGame(config);
    s = play(s, 0, 0);            // [a]
    s = play(s, 1, 1);          // [a,b]
    s = play(s, 2, 2);          // [a,b,c]  (no adjacent pair yet — only 3 letters < 2l)
    expect(s.winner).toBeNull();
    // now insert 'b' at gap 2 -> [a,b,b,c]: triggers the win on full rescan
    s = play(s, 2, 1);
    expect(s.word).toEqual([0, 1, 1, 2]);
    expect(s.winner).toBe(CONSTRUCTOR);
  });
});

describe('newGame / phases / legalMoves', () => {
  it('starts empty, Constructor to point', () => {
    const s = newGame(cfg());
    expect(s.word.length).toBe(0);
    expect(s.phase).toBe('point');
    expect(currentPlayer(s)).toBe(CONSTRUCTOR);
  });
  it('point lists every gap; insert lists every letter', () => {
    let s = newGame(cfg({ alpha: 3 }));
    expect(legalMoves(s)).toEqual([0]);
    s = applyMove(s, 0);
    expect(s.phase).toBe('insert');
    expect(currentPlayer(s)).toBe(AVOIDER);
    expect(legalMoves(s)).toEqual([0, 1, 2]);
  });
  it('rejects an illegal move (returns same state)', () => {
    const s = newGame(cfg());
    expect(applyMove(s, 99)).toBe(s);
  });
});

describe('Avoider win at length n', () => {
  it('reaching n with no monochromatic adjacent pair is an Avoider win', () => {
    // l=1, c=alpha, identity χ -> "same colour adjacent" == "equal adjacent letters"; abab avoids it
    const config = cfg({ alpha: 2, l: 1, c: 2, n: 4 });
    let s0 = newGame(config);
    s0 = { ...s0, coloring: Uint8Array.from([0, 1]) }; // identity
    let s = play(s0, 0, 0); // a
    s = play(s, 1, 1);    // ab
    s = play(s, 2, 0);    // aba
    s = play(s, 3, 1);    // abab -> length 4 = n, no equal adjacent letters
    expect(s.winner).toBe(AVOIDER);
    expect(isOver(s)).toBe(true);
  });
});

describe('coloringFor', () => {
  it('uses a preset when shape matches, else the seeded table', () => {
    const withPreset = coloringFor({ alpha: 3, l: 2, c: 2, seed: 1, preset: 'abbc' });
    expect(Array.from(withPreset)).toEqual(Array.from(getPreset('abbc')!.build()));
    // shape mismatch -> falls back to seeded random
    const mismatch = coloringFor({ alpha: 2, l: 2, c: 2, seed: 1, preset: 'abbc' });
    expect(Array.from(mismatch)).toEqual(Array.from(buildColoring(2, 2, 2, 1)));
  });
});

describe('default contest preset is a genuine two-sided game', () => {
  // The shipped default is the curated "contest" χ over (|A|=4, l=2, c=4) at n=8. It must NOT be
  // trivially decided: the exact solver proves the AVOIDER wins with perfect play, yet most opening
  // letters lose — so play quality decides it. (Random l=2 χ is a trivial Constructor walkover and
  // l=1 a trivial Avoider walkover; this preset is the deliberate middle ground.)
  const p = getPreset('contest')!;

  it('is registered with shape |A|=4, l=2, c=4', () => {
    expect([p.alpha, p.l, p.c]).toEqual([4, 2, 4]);
    expect(p.build().length).toBe(tableSize(4, 2)); // 16
  });

  it('coloringFor applies the contest χ for the default config', () => {
    const t = coloringFor({ alpha: 4, l: 2, c: 4, seed: 1, preset: 'contest' });
    expect(Array.from(t)).toEqual(Array.from(p.build()));
  });

  it('exact solver: AVOIDER wins at the default n=8 with perfect play (not a Constructor walkover)', () => {
    const config = cfg({ alpha: 4, l: 2, c: 4, n: 8, preset: 'contest', aiLevel: { A: 3, C: 3 } });
    const s = newGame(config);
    expect(solve(s, new Map(), { n: 0 })).toBe(1); // +1 == Avoider win
  });

  it('first move matters: only some opening Avoider letters keep the win (not trivially won)', () => {
    const config = cfg({ alpha: 4, l: 2, c: 4, n: 8, preset: 'contest', aiLevel: { A: 3, C: 3 } });
    const afterPoint = applyMove(newGame(config), 0); // Constructor points at gap 0
    const outcomes = legalMoves(afterPoint).map(a => solve(applyMove(afterPoint, a), new Map(), { n: 0 }));
    expect(outcomes).toContain(1);  // at least one opening letter wins for the Avoider
    expect(outcomes).toContain(-1); // and at least one loses -> the choice is decisive
  });
});
