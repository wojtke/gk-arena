import { describe, it, expect } from 'vitest';
import { newGame, applyMove, makerProgress, isOver } from '../rules';
import { GameConfig } from '../types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    kind: 'vdw', boardSize: 5, target: 3, mode: 'scoring',
    humanRole: 'none', aiLevel: { R: 0, B: 0 }, seed: 1, ...over,
  };
}

describe('scoring mode', () => {
  it('plays to the end and scores Maker by her largest live structure (Breaker win)', () => {
    // N=4, k=3: the only two APs are {0,1,2} and {1,2,3}; both pass through cell 2. If Breaker
    // takes cell 2 every live set is dead, so Maker's largest *live* structure is 0.
    let s = newGame(cfg({ boardSize: 4, target: 3 }));
    s = applyMove(s, 0); // R @0
    s = applyMove(s, 2); // B @2 — kills every winning set
    s = applyMove(s, 1); // R @1
    s = applyMove(s, 3); // B @3 — board full
    expect(isOver(s)).toBe(true);
    expect(s.winner).toBe('B');
    expect(s.score).toBe(0);
    expect(s.score).toBe(makerProgress(s).size);
  });

  it('declares Maker the winner with score === need when she completes a set, and surfaces a score', () => {
    let s = newGame(cfg({ boardSize: 5, target: 3 }));
    s = applyMove(s, 0); // R
    s = applyMove(s, 1); // B
    s = applyMove(s, 2); // R
    s = applyMove(s, 3); // B
    s = applyMove(s, 4); // R -> owns {0,2,4}, a completed AP
    expect(s.winner).toBe('R');
    expect(s.score).toBe(3); // == need (k)
    expect(s.witness?.slice().sort((a, b) => a - b)).toEqual([0, 2, 4]);
  });

  it('stops as soon as Maker can no longer improve (no dead moves after a completed set)', () => {
    // N=7, k=3: Maker should win well before the board fills; the game must end on the winning move,
    // not keep playing to a full board.
    let s = newGame(cfg({ boardSize: 7, target: 3 }));
    s = applyMove(s, 0); // R
    s = applyMove(s, 6); // B (far away, does not block {0,2,4})
    s = applyMove(s, 2); // R
    s = applyMove(s, 5); // B
    s = applyMove(s, 4); // R -> {0,2,4} complete
    expect(s.winner).toBe('R');
    expect(s.score).toBe(3);
    const filled = s.owner.filter(o => o !== null).length;
    expect(filled).toBe(5);            // game stopped on the completing move
    expect(s.owner.every(o => o !== null)).toBe(false); // board NOT full
  });

  it('scoring is observably different from maker-breaker (a score is reported)', () => {
    let mb = newGame(cfg({ boardSize: 5, target: 3, mode: 'maker-breaker' }));
    let sc = newGame(cfg({ boardSize: 5, target: 3, mode: 'scoring' }));
    for (const cell of [0, 1, 2, 3, 4]) { mb = applyMove(mb, cell); sc = applyMove(sc, cell); }
    expect(mb.winner).toBe('R');
    expect(mb.score).toBeUndefined();  // maker-breaker never sets a numeric score
    expect(sc.winner).toBe('R');
    expect(sc.score).toBe(3);          // scoring surfaces Maker's largest live structure
  });
});
