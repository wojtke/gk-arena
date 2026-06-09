import { describe, it, expect } from 'vitest';
import { newGame, applyMove, legalMoves, isOver } from '../rules';
import { phi, aiMove, makeRng } from '../ai';
import { tournament } from '../sim/tournament';
import { AILevel, GameConfig } from '../types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    kind: 'vdw', boardSize: 3, target: 3, mode: 'maker-breaker',
    humanRole: 'none', aiLevel: { R: 2, B: 2 }, seed: 1, ...over,
  };
}

describe('Erdős–Selfridge potential Φ', () => {
  it('takes the exact theorem-weighted values on a tiny one-AP board (VdW N=3, k=3)', () => {
    // Single winning set {0,1,2}. Φ = Σ_{live A} 2^-(|A| - maker_A).
    let s = newGame(cfg({ boardSize: 3, target: 3 }));
    expect(s.hg.winningSets.length).toBe(1);
    expect(phi(s)).toBeCloseTo(0.125, 12);          // empty: 2^-3
    const m = applyMove(s, 0);                        // Maker @0: 2^-(3-1)
    expect(phi(m)).toBeCloseTo(0.25, 12);
    const b = applyMove(m, 1);                        // Breaker @1: the set is dead -> 0
    expect(phi(b)).toBeCloseTo(0, 12);
  });

  it('sums 2^-(|A|-maker_A) over all live sets (two overlapping APs on VdW N=4, k=3)', () => {
    // APs: {0,1,2} and {1,2,3}. Empty board: 2 * 2^-3 = 0.25.
    let s = newGame(cfg({ boardSize: 4, target: 3 }));
    expect(s.hg.winningSets.length).toBe(2);
    expect(phi(s)).toBeCloseTo(0.25, 12);
    const m = applyMove(s, 1); // Maker @1 is in BOTH APs -> 2 * 2^-(3-1) = 0.5
    expect(phi(m)).toBeCloseTo(0.5, 12);
  });
});

describe('strategic Breaker (potential / solver) blocks on a Breaker-safe board', () => {
  it('ES Breaker holds Maker to a 0% win rate at the Breaker-safe N=11, k=4', () => {
    const r = tournament({ kind: 'vdw', boardSize: 11, target: 4, makerLevel: 2, breakerLevel: 2 }, 40);
    expect(r.makerRate).toBe(0);
  });

  it('the threshold flips: Maker wins every game at N=13, k=4', () => {
    const r = tournament({ kind: 'vdw', boardSize: 13, target: 4, makerLevel: 2, breakerLevel: 2 }, 40);
    expect(r.makerRate).toBe(1);
  });

  it('the solver Breaker (level 3) also prevents the Maker win on a tiny Breaker-safe board', () => {
    // VdW N=3, k=3 is Breaker-safe (Σ 2^-3 = 1/8 < 1/2): a perfect Breaker always blocks the lone AP.
    const c = cfg({ boardSize: 3, target: 3, aiLevel: { R: 0, B: 3 } });
    const rnd = makeRng(7);
    let s = newGame(c);
    while (!isOver(s)) s = applyMove(s, aiMove(s, c.aiLevel[s.turn], rnd));
    expect(s.winner).toBe('B');
  });
});

describe('AI seed-determinism over a full played-out game', () => {
  function playSequence(level: AILevel, seed: number): number[] {
    const c = cfg({ boardSize: 11, target: 4, aiLevel: { R: level, B: level } });
    const rnd = makeRng(seed);
    const moves: number[] = [];
    let s = newGame(c);
    while (!isOver(s)) {
      const m = aiMove(s, c.aiLevel[s.turn], rnd);
      // Every move actually played must be legal at the moment it is played.
      expect(legalMoves(s)).toContain(m);
      moves.push(m);
      s = applyMove(s, m);
    }
    return moves;
  }

  it('two full games with the same seed produce identical move sequences (each level)', () => {
    for (const level of [0, 1, 2, 3] as AILevel[]) {
      const a = playSequence(level, 42);
      const b = playSequence(level, 42);
      expect(a.length).toBeGreaterThan(0);
      expect(a).toEqual(b);
    }
  });
});
