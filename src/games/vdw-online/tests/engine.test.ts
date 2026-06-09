import { describe, it, expect } from 'vitest';
import {
  newGame, legalMoves, applyMove, currentPlayer, isOver, goalText, defaultK, isDiagonal,
} from '../engine/rules';
import { findWitness, hasAp, longestApOfColor } from '../engine/detect';
import { GameConfig, GameState, POINTER, PAINTER } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    r: 2, k: [3, 3], n: 9,
    humanRole: 'none', aiLevel: { P: 0, A: 0 }, seed: 1, ...over,
  };
}

/** Helper: POINTER points at gap g, then PAINTER paints colour c. */
function play(s: GameState, g: number, c: number): GameState {
  return applyMove(applyMove(s, g), c);
}

describe('detect — per-colour monochromatic AP scan', () => {
  it('finds a step-1 AP', () => {
    expect(findWitness([0, 0, 0], [3, 3])!.idx).toEqual([0, 1, 2]);
  });
  it('finds a step>1 AP and carries the offending colour', () => {
    // indices 0,2,4 all colour 1
    const w = findWitness([1, 0, 1, 0, 1], [3, 3]);
    expect(w!.color).toBe(1);
    expect(w!.idx).toEqual([0, 2, 4]);
  });
  it('returns null when no mono AP exists', () => {
    expect(hasAp([0, 1, 0, 1], [3, 3])).toBe(false);
    expect(findWitness([0, 1, 0, 1], [3, 3])).toBeNull();
  });
  it('a differently coloured middle breaks the AP', () => {
    expect(hasAp([0, 1, 0], [3, 3])).toBe(false);
  });
  it('off-diagonal: each colour wins at its OWN k[i]', () => {
    // colour 0 needs 3, colour 1 needs 4
    expect(hasAp([0, 0, 0], [3, 4])).toBe(true);    // red 3-AP -> win
    expect(hasAp([1, 1, 1], [3, 4])).toBe(false);   // blue 3-run, but k1=4 -> not yet
    expect(hasAp([1, 1, 1, 1], [3, 4])).toBe(true); // blue 4-AP -> win
  });
  it('off-diagonal witness carries the offending colour', () => {
    const w = findWitness([1, 1, 1, 1], [3, 4]);
    expect(w!.color).toBe(1);
    expect(w!.idx.length).toBe(4);
  });
  it('longestApOfColor reports the longest mono run incl. step>1', () => {
    expect(longestApOfColor([0, 1, 0, 1, 0], 0)).toBe(3); // step-2 run of colour 0
    expect(longestApOfColor([0, 1, 0, 1, 0], 1)).toBe(2);
    expect(longestApOfColor([1, 1, 1], 0)).toBe(0);       // absent colour
  });
});

describe('reduction: all k[i] equal == plain (scalar) online VdW', () => {
  it('symmetric vector [k,k] detects exactly a scalar k-AP of either colour', () => {
    // cross-check against a "scalar k, any colour" reference scan
    const scalarHasAp = (line: number[], k: number, r: number): boolean => {
      for (let c = 0; c < r; c++) {
        for (let s = 0; s < line.length; s++) {
          for (let d = 1; s + (k - 1) * d < line.length; d++) {
            let ok = true;
            for (let t = 0; t < k; t++) if (line[s + t * d] !== c) { ok = false; break; }
            if (ok) return true;
          }
        }
      }
      return false;
    };
    const lines = [[0, 0, 0], [1, 1, 1], [0, 1, 0, 1, 0], [0, 1, 1, 0, 1], [0, 1, 0, 0, 1, 1]];
    for (const line of lines) {
      expect(hasAp(line, [3, 3])).toBe(scalarHasAp(line, 3, 2));
    }
  });
  it('isDiagonal flags equal vs unequal target vectors', () => {
    expect(isDiagonal([3, 3, 3])).toBe(true);
    expect(isDiagonal([3, 4])).toBe(false);
  });
});

describe('newGame / phases', () => {
  it('starts empty, POINTER to point', () => {
    const s = newGame(cfg());
    expect(s.line.length).toBe(0);
    expect(s.phase).toBe('point');
    expect(currentPlayer(s)).toBe(POINTER);
  });
  it('point phase lists every gap; after pointing, paint phase lists colours', () => {
    let s = newGame(cfg({ r: 3, k: [3, 3, 3] }));
    expect(legalMoves(s)).toEqual([0]); // empty line -> only gap 0
    s = applyMove(s, 0);
    expect(s.phase).toBe('paint');
    expect(currentPlayer(s)).toBe(PAINTER);
    expect(legalMoves(s)).toEqual([0, 1, 2]); // r=3 colours
  });
});

describe('applyMove — insertion shifts indices', () => {
  it('paints at the pointed gap and shifts the right side', () => {
    let s = newGame(cfg());
    s = play(s, 0, 0); // [0]
    s = play(s, 1, 1); // point gap 1, paint 1 -> [0,1]
    s = play(s, 0, 1); // point gap 0, paint 1 -> [1,0,1] (everything shifted right)
    expect(s.line).toEqual([1, 0, 1]);
  });
  it('rejects an illegal move (returns same state)', () => {
    const s = newGame(cfg());
    const after = applyMove(s, 99);
    expect(after).toBe(s);
  });
});

describe('win detection / winner', () => {
  it('POINTER wins the instant a mono 3-AP forms (diagonal)', () => {
    let s = newGame(cfg({ r: 2, k: [3, 3], n: 9 }));
    s = play(s, 0, 0); // [0]
    s = play(s, 1, 0); // [0,0]
    s = play(s, 2, 0); // [0,0,0] -> mono 3-AP
    expect(s.winner).toBe(POINTER);
    expect(isOver(s)).toBe(true);
    expect(s.witness!.idx).toEqual([0, 1, 2]);
    expect(s.witness!.color).toBe(0);
  });
  it('off-diagonal: a colour-1 3-run does NOT win when k1=4', () => {
    let s = newGame(cfg({ k: [3, 4], n: 12 }));
    s = play(s, 0, 1);
    s = play(s, 1, 1);
    s = play(s, 2, 1); // [1,1,1] -> blue 3-run, k1=4
    expect(s.winner).toBeNull();
  });
  it('PAINTER wins by reaching length n with no mono AP', () => {
    // r=2,k=[3,3],n=4: line 0,1,1,0 has no mono 3-AP
    let s = newGame(cfg({ r: 2, k: [3, 3], n: 4 }));
    s = play(s, 0, 0); // [0]
    s = play(s, 1, 1); // [0,1]
    s = play(s, 2, 1); // [0,1,1]
    s = play(s, 3, 0); // [0,1,1,0] len 4 = n
    expect(s.winner).toBe(PAINTER);
  });
});

describe('defaultK / goalText', () => {
  it('defaultK is off-diagonal [3,4] for r=2', () => {
    expect(defaultK(2)).toEqual([3, 4]);
    expect(defaultK(3).length).toBe(3);
  });
  it('goalText reflects the diagonal vs off-diagonal mode', () => {
    expect(goalText(cfg({ k: [3, 3] }))).toContain('3-term progression');
    expect(goalText(cfg({ k: [3, 4] }))).toContain('colour 1→3');
  });
});

describe('Van der Waerden bound W(2;3)=9', () => {
  it('PAINTER can never survive to n=9 at k=3, r=2 (any 2-colouring of 9 has a mono 3-AP)', () => {
    // Exhaustively check every 2-colouring of length 9 has a mono 3-AP -> PAINTER cannot reach 9.
    for (let mask = 0; mask < (1 << 9); mask++) {
      const line = Array.from({ length: 9 }, (_, i) => (mask >> i) & 1);
      expect(hasAp(line, [3, 3])).toBe(true);
    }
  });
});
