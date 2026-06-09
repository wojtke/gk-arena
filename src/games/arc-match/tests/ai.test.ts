import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, edgesOf, freePoints } from '../engine/rules';
import { largestHomogeneous } from '../engine/patterns';
import { aiMove, makeRng } from '../engine/ai';
import { AILevel, GameConfig, GameState, MAKER } from '../engine/types';

function cfg(): GameConfig {
  return { n: 4, k: 3, type: 'crossing', mode: 'maker-breaker', humanRole: 'none', aiLevel: { R: 1, B: 1 }, seed: 1 };
}

describe('aiMove', () => {
  it('returns a legal move at every level', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      const s = newGame(cfg());
      const [lo, hi] = aiMove(s, lvl, makeRng(7));
      expect(lo).not.toBe(hi);
      expect(s.used[lo]).toBe(false);
      expect(s.used[hi]).toBe(false);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const s = newGame(cfg());
    expect(aiMove(s, 2, makeRng(42))).toEqual(aiMove(s, 2, makeRng(42)));
  });

  it('always terminates a full AI-vs-AI game with a winner', () => {
    let s: GameState = newGame(cfg());
    const rnd = makeRng(123);
    let guard = 0;
    while (!isOver(s) && guard++ < 100) {
      const [lo, hi] = aiMove(s, s.config.aiLevel[s.turn], rnd);
      s = applyMove(s, lo, hi);
    }
    expect(isOver(s)).toBe(true);
    expect(s.winner === 'R' || s.winner === 'B').toBe(true);
  });

  // L1 greedy must actually defend when playing Breaker: previously evaluate() only measured Red's
  // realized structure, so every Breaker move scored identically (a no-op defender). The threat-aware
  // greedy must consume the points that Red needs to complete her chain.
  it('L1 Breaker blocks Maker threats (not a no-op defender)', () => {
    const c: GameConfig = {
      n: 5, k: 3, type: 'crossing', mode: 'maker-breaker',
      humanRole: 'none', aiLevel: { R: 1, B: 1 }, seed: 1,
    };
    let s = newGame(c);
    s = applyMove(s, 1, 6);   // R
    s = applyMove(s, 5, 10);  // B (harmless)
    s = applyMove(s, 2, 7);   // R -> Red holds a 2-crossing (1,6),(2,7); free = 3,4,8,9
    expect(s.turn).toBe('B');
    // Red has four winning completions to a 3-crossing using {3,4}×{8,9}.
    const red = edgesOf(s, MAKER);
    const free = freePoints(s);
    const completions = (st = s) => {
      const r = edgesOf(st, MAKER);
      const f = freePoints(st);
      let n = 0;
      for (let i = 0; i < f.length; i++)
        for (let j = i + 1; j < f.length; j++)
          if (largestHomogeneous([...r, { lo: f[i], hi: f[j], color: MAKER }], 'crossing').size >= 3) n++;
      return n;
    };
    expect(completions()).toBeGreaterThan(0);
    void red; void free;
    const mv = aiMove(s, 1, makeRng(7));
    const after = applyMove(s, mv[0], mv[1]);
    // A real defender kills every remaining Red completion here (it can take both shared left points).
    expect(completions(after)).toBe(0);
  });

  // The L3 solver must stay responsive — exact search only runs on small free-point counts, so a
  // single move on a large default-reachable board returns quickly.
  it('L3 returns a move quickly on a large board (no multi-second freeze)', () => {
    const c: GameConfig = {
      n: 12, k: 3, type: 'crossing', mode: 'maker-breaker',
      humanRole: 'none', aiLevel: { R: 3, B: 3 }, seed: 1,
    };
    const s = newGame(c); // 24 free points -> heuristic fallback, must be fast
    const t0 = Date.now();
    const mv = aiMove(s, 3, makeRng(1));
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(mv[0]).not.toBe(mv[1]);
  });
});
