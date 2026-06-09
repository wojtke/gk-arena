import { describe, it, expect } from 'vitest';
import { findBadConfig, hasBadConfig } from '../engine/detect';
import {
  newGame, legalMoves, applyMove, currentPlayer, isOver, goalText, minAlpha,
} from '../engine/rules';
import { AVOIDER, CONSTRUCTOR, GameConfig, GameState } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    alpha: 3, k: 3, n: 6,
    humanRole: 'none', aiLevel: { A: 0, C: 0 }, seed: 1, ...over,
  };
}

/** CONSTRUCTOR points at gap g, then AVOIDER inserts letter c. */
function play(s: GameState, g: number, c: number): GameState {
  return applyMove(applyMove(s, g), c);
}

// ----------------------------------------------------------------------------------------------
// An INLINED square oracle (self-contained known-squares helper; NOT a thue-arena import). A square
// is a factor XX (two adjacent equal-length equal halves). This is the k=2 bad configuration.
// ----------------------------------------------------------------------------------------------
function hasSquareOracle(word: readonly number[]): boolean {
  const n = word.length;
  for (let m = 1; m * 2 <= n; m++) {            // half-length m
    for (let s = 0; s + 2 * m <= n; s++) {       // start
      let equal = true;
      for (let t = 0; t < m; t++) {
        if (word[s + t] !== word[s + m + t]) { equal = false; break; }
      }
      if (equal) return true;
    }
  }
  return false;
}

describe('findBadConfig — m=1 (single-letter blocks)', () => {
  it('finds a repeat among k=3 single letters: aab', () => {
    const w = findBadConfig([0, 0, 1], 3); // a a b -> B0=B1
    expect(w).toEqual({ start: 0, m: 1, i: 0, j: 1 });
  });
  it('finds aba (B0=B2)', () => {
    const w = findBadConfig([0, 1, 0], 3);
    expect(w).toEqual({ start: 0, m: 1, i: 0, j: 2 });
  });
  it('finds baa (B1=B2)', () => {
    const w = findBadConfig([1, 0, 0], 3);
    expect(w).toEqual({ start: 0, m: 1, i: 1, j: 2 });
  });
  it('abc with three distinct letters is safe (no bad config at m=1)', () => {
    expect(findBadConfig([0, 1, 2], 3)).toBeNull();
  });
});

describe('findBadConfig — m>=2 (multi-letter blocks)', () => {
  it('finds two equal length-2 blocks among 3 with no m=1 repeat: [ab][cd][ab]', () => {
    // a b c d a b -> m=1 triples are all distinct ([a][b][c]=abc, [b][c][d]=bcd, [c][d][a]=cda,
    // [d][a][b]=dab) but the m=2 run [ab][cd][ab] has B0=B2.
    const w = findBadConfig([0, 1, 2, 3, 0, 1], 3);
    expect(w).toEqual({ start: 0, m: 2, i: 0, j: 2 });
  });
  it('reports the smallest m first (m=1 before m=2)', () => {
    // a a b a b c : an m=1 triple [a][a][b] at start 0 exists -> reported before any m=2
    const w = findBadConfig([0, 0, 1, 0, 1, 2], 3)!;
    expect(w.m).toBe(1);
    expect(w.start).toBe(0);
  });
  it('all-distinct length-2 blocks are safe', () => {
    // [ab][cd][bc] -> pairwise distinct
    expect(findBadConfig([0, 1, 2, 3, 1, 2], 3)).toBeNull();
  });
});

describe('findBadConfig — negatives & edges', () => {
  it('returns null when too short for k blocks', () => {
    expect(findBadConfig([0, 1], 3)).toBeNull();
  });
  it('k<2 is never a bad config', () => {
    expect(findBadConfig([0, 0, 0], 1)).toBeNull();
  });
  it('hasBadConfig mirrors findBadConfig', () => {
    expect(hasBadConfig([0, 0, 1], 3)).toBe(true);
    expect(hasBadConfig([0, 1, 2], 3)).toBe(false);
  });
});

describe('k=2 equals the square game (vs inlined square oracle)', () => {
  it('agrees with the oracle on a battery of words (m=1 and m>=2)', () => {
    const words: number[][] = [
      [], [0], [0, 0], [0, 1], [0, 1, 0], [0, 0, 1], [0, 1, 1],
      [0, 1, 0, 1], [0, 1, 2, 0, 1, 2], [0, 1, 2, 3], [0, 1, 0, 2, 1, 2],
      [0, 1, 2, 1, 2, 0], [2, 0, 1, 2, 0, 1], [0, 1, 2, 3, 4, 1, 2, 3, 4],
    ];
    for (const w of words) {
      expect(hasBadConfig(w, 2)).toBe(hasSquareOracle(w));
    }
  });
  it('the k=2 witness blocks are equal halves (a genuine square XX)', () => {
    const w = findBadConfig([0, 1, 2, 1, 2, 3], 2)!; // [12][12] square at start 1, m=2
    expect(w.m).toBe(2);
    // blocks B_i and B_j (i=0,j=1) are adjacent equal halves
    const b0 = [0, 1].map(t => [0, 1, 2, 1, 2, 3][w.start + w.i * w.m + t]);
    const b1 = [0, 1].map(t => [0, 1, 2, 1, 2, 3][w.start + w.j * w.m + t]);
    expect(b0).toEqual(b1);
    expect(w.j).toBe(w.i + 1); // adjacent for k=2
  });
});

describe('witness correctness', () => {
  it('the reported blocks are actually equal', () => {
    // 9-letter word, k=3: m=2 run at start 1 is [01][23][01] -> B0=B2 (the first m=1 triple
    // [a][b][c]=abc... none repeat, so m=2 fires).
    const word = [4, 0, 1, 2, 3, 0, 1, 5, 6];
    const w = findBadConfig(word, 3)!;
    const blk = (b: number) => Array.from({ length: w.m }, (_, t) => word[w.start + b * w.m + t]);
    expect(blk(w.i)).toEqual(blk(w.j));
    expect(w.i).toBeLessThan(w.j);
  });
});

describe('minAlpha / threshold |A| >= k', () => {
  it('minAlpha(k) === k', () => {
    expect(minAlpha(3)).toBe(3);
    expect(minAlpha(2)).toBe(2);
  });
  it('newGame clamps alpha up to k when below', () => {
    const s = newGame(cfg({ alpha: 2, k: 4 }));
    expect(s.config.alpha).toBe(4);
  });
  it('does not lower alpha when already >= k', () => {
    const s = newGame(cfg({ alpha: 6, k: 3 }));
    expect(s.config.alpha).toBe(6);
  });
});

describe('newGame / phases / applyMove', () => {
  it('starts empty, CONSTRUCTOR to point', () => {
    const s = newGame(cfg());
    expect(s.word.length).toBe(0);
    expect(s.phase).toBe('point');
    expect(currentPlayer(s)).toBe(CONSTRUCTOR);
  });
  it('point lists gaps; after pointing, insert lists letters', () => {
    let s = newGame(cfg({ alpha: 3 }));
    expect(legalMoves(s)).toEqual([0]);
    s = applyMove(s, 0);
    expect(s.phase).toBe('insert');
    expect(currentPlayer(s)).toBe(AVOIDER);
    expect(legalMoves(s)).toEqual([0, 1, 2]);
  });
  it('inserts at the pointed gap', () => {
    let s = newGame(cfg());
    s = play(s, 0, 0);
    s = play(s, 0, 1); // point gap 0, insert 'b' before 'a' -> [b,a]
    expect(s.word).toEqual([1, 0]);
  });
  it('rejects an illegal move (returns same state)', () => {
    const s = newGame(cfg());
    expect(applyMove(s, 99)).toBe(s);
  });
});

describe('win conditions', () => {
  it('CONSTRUCTOR wins the instant a bad config appears (aab, k=3)', () => {
    let s = newGame(cfg({ alpha: 3, k: 3, n: 9 }));
    s = play(s, 0, 0);  // [a]
    s = play(s, 1, 0);  // [a,a]
    s = play(s, 2, 1);  // [a,a,b] -> bad config B0=B1 (m=1)
    expect(s.winner).toBe(CONSTRUCTOR);
    expect(isOver(s)).toBe(true);
    expect(s.witness).toEqual({ start: 0, m: 1, i: 0, j: 1 });
  });
  it('k=2 CONSTRUCTOR wins on a square "aa"', () => {
    let s = newGame(cfg({ alpha: 2, k: 2, n: 9 }));
    s = play(s, 0, 0);
    s = play(s, 1, 0); // [a,a] square
    expect(s.winner).toBe(CONSTRUCTOR);
  });
  it('AVOIDER wins at |w| = n with no bad config (abc, k=3, n=3)', () => {
    let s = newGame(cfg({ alpha: 3, k: 3, n: 3 }));
    s = play(s, 0, 0); // [a]
    s = play(s, 1, 1); // [a,b]
    s = play(s, 2, 2); // [a,b,c] len 3 = n
    expect(s.winner).toBe(AVOIDER);
    expect(isOver(s)).toBe(true);
  });
});

describe('goalText', () => {
  it('mentions k, n and alphabet', () => {
    const t = goalText(cfg({ k: 3, n: 6, alpha: 3 }));
    expect(t).toContain('3');
    expect(t).toContain('6');
  });
});
