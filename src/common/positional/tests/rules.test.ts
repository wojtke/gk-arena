import { describe, it, expect } from 'vitest';
import { newGame, legalMoves, applyMove, makerProgress } from '../rules';
import { GameConfig } from '../types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    kind: 'vdw', boardSize: 5, target: 3, mode: 'maker-breaker',
    humanRole: 'none', aiLevel: { R: 0, B: 0 }, seed: 1, ...over,
  };
}

describe('newGame / legalMoves', () => {
  it('starts empty with Maker to move', () => {
    const s = newGame(cfg());
    expect(s.turn).toBe('R');
    expect(s.owner.every(o => o === null)).toBe(true);
    expect(legalMoves(s).length).toBe(5);
  });
});

describe('applyMove — VdW', () => {
  it('rejects claiming an occupied cell', () => {
    const s = applyMove(newGame(cfg()), 0);
    expect(applyMove(s, 0)).toBe(s);
  });
  it('lets Maker win with a 3-term progression', () => {
    let s = newGame(cfg({ boardSize: 5, target: 3 }));
    s = applyMove(s, 0); // R
    s = applyMove(s, 1); // B
    s = applyMove(s, 2); // R
    s = applyMove(s, 3); // B
    s = applyMove(s, 4); // R -> owns {0,2,4}, an AP (d=2)
    expect(s.winner).toBe('R');
    expect(s.witness?.sort((a, b) => a - b)).toEqual([0, 2, 4]);
  });
  it('gives Breaker the win when the only AP is blocked', () => {
    let s = newGame(cfg({ boardSize: 3, target: 3 }));
    s = applyMove(s, 0); // R
    s = applyMove(s, 1); // B blocks the middle of {0,1,2}
    s = applyMove(s, 2); // R -> board full
    expect(s.winner).toBe('B');
    expect(makerProgress(s).size).toBeLessThan(3);
  });
});

describe('applyMove — Ramsey', () => {
  it('lets Maker win by completing a triangle on K4', () => {
    // edges of K4 in index order: (0,1)=0 (0,2)=1 (0,3)=2 (1,2)=3 (1,3)=4 (2,3)=5
    // triangle on {0,1,2} = edges {0,1,3}
    let s = newGame(cfg({ kind: 'ramsey', boardSize: 4, target: 3 }));
    s = applyMove(s, 0); // R (0,1)
    s = applyMove(s, 5); // B (2,3)
    s = applyMove(s, 1); // R (0,2)
    s = applyMove(s, 4); // B (1,3)
    s = applyMove(s, 3); // R (1,2) -> triangle {0,1,2}
    expect(s.winner).toBe('R');
    expect(s.witness?.sort((a, b) => a - b)).toEqual([0, 1, 3]);
  });
});
