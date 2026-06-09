import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, legalMoves } from '../rules';
import { aiMove, makeRng } from '../ai';
import { AILevel, GameConfig, GameKind, GameState } from '../types';

function cfg(kind: GameKind): GameConfig {
  const small = kind === 'vdw'
    ? { boardSize: 7, target: 3 }
    : { boardSize: 5, target: 3 };
  return { kind, ...small, mode: 'maker-breaker', humanRole: 'none', aiLevel: { R: 1, B: 1 }, seed: 1 };
}

describe('aiMove', () => {
  it('returns a legal, unclaimed cell at every level, for both games', () => {
    for (const kind of ['vdw', 'ramsey'] as GameKind[]) {
      for (const lvl of [0, 1, 2, 3] as AILevel[]) {
        const s = newGame(cfg(kind));
        const m = aiMove(s, lvl, makeRng(5));
        expect(s.owner[m]).toBe(null);
        expect(legalMoves(s)).toContain(m);
      }
    }
  });

  it('is deterministic for a fixed seed', () => {
    const s = newGame(cfg('vdw'));
    expect(aiMove(s, 2, makeRng(9))).toBe(aiMove(s, 2, makeRng(9)));
  });

  it('always terminates a full AI-vs-AI game with a winner', () => {
    for (const kind of ['vdw', 'ramsey'] as GameKind[]) {
      let s: GameState = newGame(cfg(kind));
      const rnd = makeRng(3);
      let guard = 0;
      while (!isOver(s) && guard++ < 200) s = applyMove(s, aiMove(s, s.config.aiLevel[s.turn], rnd));
      expect(s.winner === 'R' || s.winner === 'B').toBe(true);
    }
  });
});
