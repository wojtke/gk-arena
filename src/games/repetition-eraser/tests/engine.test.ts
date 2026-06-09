import { describe, it, expect } from 'vitest';
import {
  EraseRule, GameConfig, GROWER, SHRINKER,
  appendAndErase, newGame, applyMove, legalMoves,
} from '../engine';
import { aiMove, makeRng } from '../ai';

// Brute force: does the word contain ANY square factor XX (anywhere, any length)?
function hasSquare(w: number[]): boolean {
  const n = w.length;
  for (let i = 0; i < n; i++) {
    for (let half = 1; i + 2 * half <= n; half++) {
      let eq = true;
      for (let t = 0; t < half; t++) {
        if (w[i + t] !== w[i + half + t]) { eq = false; break; }
      }
      if (eq) return true;
    }
  }
  return false;
}

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    k: 3, d: 10, rounds: 24, rule: 'shortest',
    humanRole: 'none', aiLevel: { R: 0, B: 0 }, seed: 1, ...over,
  };
}

describe('appendAndErase — basic erasure', () => {
  it('erases a square that forms at the end (aa -> a)', () => {
    expect(appendAndErase([0], 0)).toEqual({ word: [0], erased: 1 });
  });

  it('does not erase when no suffix square forms (ab -> ab)', () => {
    expect(appendAndErase([0], 1)).toEqual({ word: [0, 1], erased: 0 });
  });

  it('erases the second half of a length-2 block square (abab -> ab)', () => {
    // word "aba" + "b" => "abab" has suffix square (ab)(ab); erase second "ab".
    expect(appendAndErase([0, 1, 0], 1)).toEqual({ word: [0, 1], erased: 2 });
  });

  it('defaults to the shortest rule (output identical to legacy behaviour)', () => {
    // appending to "aa..."? "aa" is impossible mid-game, but on a raw word the shortest square wins.
    // word "aba" + "a": suffixes - shortest square is "aa" (h=1) at the end.
    expect(appendAndErase([0, 1, 0], 0)).toEqual({ word: [0, 1, 0], erased: 1 });
  });
});

describe('appendAndErase — nested squares iterate until square-free', () => {
  it('keeps erasing while a new suffix square is exposed', () => {
    // Build "abcabc": appending the final 'c' makes (abc)(abc) -> erase -> "abc".
    // Then there is no further suffix square, so the result is square-free.
    const r = appendAndErase([0, 1, 2, 0, 1], 2);
    expect(r.word).toEqual([0, 1, 2]);
    expect(r.erased).toBe(3);
    expect(hasSquare(r.word)).toBe(false);
  });

  it('iterates through a chain of exposed squares (cascade collapse)', () => {
    // Append the final letter that exposes one square after another:
    // "ababa" + "b" -> "ababab" -> erase "ab" -> "abab" -> erase "ab" -> "ab" (square-free).
    const r = appendAndErase([0, 1, 0, 1, 0], 1);
    expect(r.word).toEqual([0, 1]);
    expect(r.erased).toBe(4);
    expect(hasSquare(r.word)).toBe(false);

    // The same collapse reached by feeding letters one at a time through the engine.
    let acc: number[] = [];
    for (const c of [0, 1, 0, 1]) acc = appendAndErase(acc, c, 'shortest').word;
    expect(acc).toEqual([0, 1]);
    expect(hasSquare(acc)).toBe(false);
  });
});

describe('appendAndErase — shortest vs longest rule', () => {
  it('the shortest rule erases only the short square; the longest erases the big one', () => {
    // raw word "10010" + "0" => "100100".
    //   suffix squares ending at the last position:
    //     half=1: "0","0"  -> yes (the short one)
    //     half=3: "100","100" -> yes (the long one)
    //   shortest -> erase the trailing "0" => "10010" (square-free, stop) -> erased 1.
    //   longest  -> erase "100" => "100"; then "100" exposes a new suffix square? "100" has none,
    //               BUT iteration re-checks: "100" -> no suffix square -> ... actually the longest
    //               run keeps collapsing the freshly exposed suffix squares, ending at "10", erased 4.
    const short = appendAndErase([1, 0, 0, 1, 0], 0, 'shortest');
    const long = appendAndErase([1, 0, 0, 1, 0], 0, 'longest');
    expect(short).toEqual({ word: [1, 0, 0, 1, 0], erased: 1 });
    expect(long).toEqual({ word: [1, 0], erased: 4 });
    // NB: the input here is intentionally not square-free, so only suffix-ending squares are erased;
    // the square-free-between-moves invariant (covered separately) assumes a square-free input word.
  });

  it('shortest is the default when no rule is passed', () => {
    expect(appendAndErase([1, 0, 0, 1, 0], 0)).toEqual(appendAndErase([1, 0, 0, 1, 0], 0, 'shortest'));
  });

  it('shortest output is unchanged from the documented legacy behaviour on a sample', () => {
    // Legacy = shortest square ending at last pos, iterated.
    expect(appendAndErase([0, 1, 2, 1, 2], 0).word).toEqual([0, 1, 2, 1, 2, 0]);
    expect(appendAndErase([0, 1, 0, 1, 0], 1).word).toEqual([0, 1]);
  });
});

describe('square-free-between-moves invariant (brute force, both rules)', () => {
  for (const rule of ['shortest', 'longest'] as EraseRule[]) {
    it(`every reachable state is square-free under the ${rule} rule`, () => {
      // Exhaustively play short games over k=2 letters and assert no square ever survives a move.
      const k = 2;
      function walk(w: number[], depth: number): void {
        expect(hasSquare(w)).toBe(false);
        if (depth === 0) return;
        for (let c = 0; c < k; c++) {
          walk(appendAndErase(w, c, rule).word, depth - 1);
        }
      }
      walk([], 8);
    });

    it(`random self-play stays square-free under the ${rule} rule`, () => {
      const rnd = makeRng(rule === 'shortest' ? 11 : 22);
      let w: number[] = [];
      for (let i = 0; i < 300; i++) {
        const c = Math.floor(rnd() * 3);
        w = appendAndErase(w, c, rule).word;
        expect(hasSquare(w)).toBe(false);
      }
    });
  }
});

describe('winner conditions', () => {
  it('Grower (Red) wins on reaching the target length', () => {
    // k=3 lets us spell a square-free word a,b,c,... of length 3 with no erasure.
    let s = newGame(cfg({ k: 3, d: 3, rounds: 24 }));
    s = applyMove(s, 0); // a
    s = applyMove(s, 1); // ab
    s = applyMove(s, 2); // abc -> length 3 == d
    expect(s.word.length).toBe(3);
    expect(s.winner).toBe(GROWER);
  });

  it('Shrinker (Blue) wins when the round limit is hit short of the target', () => {
    // Force a low round limit; play letters that keep erasing so length never reaches d.
    let s = newGame(cfg({ k: 2, d: 10, rounds: 4 }));
    s = applyMove(s, 0); // a
    s = applyMove(s, 0); // aa -> a (erase)
    s = applyMove(s, 0); // aa -> a (erase)
    s = applyMove(s, 0); // aa -> a (erase); round 4 reached, length 1 < 10
    expect(s.round).toBe(4);
    expect(s.word.length).toBeLessThan(10);
    expect(s.winner).toBe(SHRINKER);
  });

  it('no winner mid-game', () => {
    let s = newGame(cfg({ k: 3, d: 10, rounds: 24 }));
    s = applyMove(s, 0);
    expect(s.winner).toBeUndefined();
  });

  it('legalMoves returns all k letters while live, none when over', () => {
    const s = newGame(cfg({ k: 4 }));
    expect(legalMoves(s)).toEqual([0, 1, 2, 3]);
    let done = newGame(cfg({ k: 2, d: 2, rounds: 24 }));
    done = applyMove(done, 0);
    done = applyMove(done, 1); // ab -> length 2 == d, Grower wins
    expect(done.winner).toBe(GROWER);
    expect(legalMoves(done)).toEqual([]);
  });
});
