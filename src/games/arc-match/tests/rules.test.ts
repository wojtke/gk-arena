import { describe, it, expect } from 'vitest';
import { newGame, legalMoves, applyMove, makerProgress } from '../engine/rules';
import { GameConfig } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    n: 5, k: 3, type: 'crossing', mode: 'maker-breaker',
    humanRole: 'none', aiLevel: { R: 0, B: 0 }, seed: 1, ...over,
  };
}

describe('newGame / legalMoves', () => {
  it('starts with Maker to move and the right board size', () => {
    const s = newGame(cfg());
    expect(s.turn).toBe('R');
    expect(s.used.length).toBe(11); // 2n + 1
    expect(s.edges.length).toBe(0);
  });
  it('offers C(2n,2) opening moves', () => {
    const s = newGame(cfg({ n: 3 }));
    expect(legalMoves(s).length).toBe((6 * 5) / 2);
  });
});

describe('applyMove', () => {
  it('rejects illegal moves by returning the same state object', () => {
    const s = newGame(cfg());
    expect(applyMove(s, 1, 1)).toBe(s);          // degenerate
    const s2 = applyMove(s, 1, 2);
    expect(applyMove(s2, 1, 5)).toBe(s2);        // point 1 already used
  });

  it('lets Maker win by completing a k-crossing', () => {
    let s = newGame(cfg({ n: 5, k: 3, type: 'crossing' }));
    // R,B,R,B,R — red builds (1,6),(2,7),(3,8) = a 3-crossing
    s = applyMove(s, 1, 6); // R
    s = applyMove(s, 4, 9); // B
    s = applyMove(s, 2, 7); // R
    s = applyMove(s, 5, 10); // B
    s = applyMove(s, 3, 8); // R -> win
    expect(s.winner).toBe('R');
    expect(s.witness?.length).toBe(3);
  });

  it('gives Breaker the win when the board fills short of the target', () => {
    let s = newGame(cfg({ n: 2, k: 2, type: 'crossing' }));
    s = applyMove(s, 1, 3); // R
    s = applyMove(s, 2, 4); // B -> board full, Maker only has 1 arc
    expect(s.winner).toBe('B');
    expect(makerProgress(s).size).toBeLessThan(2);
  });
});

describe('scoring mode (DESIGN §2 max/min duel)', () => {
  it('records the final largest-red set as the score and plays to a full board', () => {
    // Scoring duel must not stop early at k; it fills the board and reports the score.
    let s = newGame(cfg({ n: 3, k: 2, type: 'crossing', mode: 'scoring' }));
    // Red builds a 3-crossing: (1,4),(2,5),(3,6). With k=2 a maker-breaker game would end at move 2;
    // scoring must continue, but here R takes 3 arcs since B never gets a free point pair... use n=3
    // and alternate so the board fills.
    s = applyMove(s, 1, 4); // R
    s = applyMove(s, 2, 5); // B
    s = applyMove(s, 3, 6); // R -> board full (6 points)
    expect(s.used.slice(1).every(Boolean)).toBe(true); // board full
    expect(s.winner).toBeDefined();
    // Score is the realized largest red set, NOT a binary k-threshold artifact.
    expect(s.score).toBe(makerProgress(s).size);
  });

  it('decouples the score from an unreachable par k', () => {
    // With par k=99 (unreachable) the game still reports the true largest-red size as the score.
    let s = newGame(cfg({ n: 2, k: 99, type: 'crossing', mode: 'scoring' }));
    s = applyMove(s, 1, 3); // R
    s = applyMove(s, 2, 4); // B -> board full
    expect(s.score).toBe(makerProgress(s).size);
    expect(s.winner).toBe('B'); // below par
  });
});
