import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, legalMoves } from '../engine/rules';
import { aiMove, makeRng } from '../engine/ai';
import { AILevel, GameConfig, GameState } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return { r: 2, k: [3, 3], n: 6, humanRole: 'none', aiLevel: { P: 1, A: 1 }, seed: 1, ...over };
}

describe('aiMove', () => {
  it('returns a legal move at every level in both phases', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s = newGame(cfg());
      let m = aiMove(s, lvl, makeRng(5));
      expect(legalMoves(s)).toContain(m);
      s = applyMove(s, m);
      m = aiMove(s, lvl, makeRng(7));
      expect(legalMoves(s)).toContain(m);
    }
  });

  it('is deterministic for a fixed seed (solver stable on a tiny instance)', () => {
    const s = newGame(cfg({ r: 2, k: [3, 3], n: 5 }));
    expect(aiMove(s, 2, makeRng(9))).toBe(aiMove(s, 2, makeRng(9)));
    expect(aiMove(s, 3, makeRng(11))).toBe(aiMove(s, 3, makeRng(11)));
  });

  it('greedy PAINTER never hands the POINTER an immediate win when a safe colour exists', () => {
    // line [0,0], POINTER points gap 2 (end). Painting 0 -> [0,0,0] loses; greedy must pick 1.
    let s: GameState = newGame(cfg({ r: 2, k: [3, 3], n: 9 }));
    s = { ...s, line: [0, 0], phase: 'point', gap: null };
    s = applyMove(s, 2); // POINTER points at the end gap
    const m = aiMove(s, 1, makeRng(2));
    expect(legalMoves(s)).toContain(m);
    expect(applyMove(s, m).winner).not.toBe('P');
  });

  it('off-diagonal: greedy PAINTER respects the smaller threshold (defends short-k colour first)', () => {
    // colour 0 has k0=2 (very fragile), colour 1 has k1=5. From [0] with the pointer pointing right
    // after [0], inserting colour 0 makes [0,0] -> immediate loss; the Painter must avoid colour 0.
    let s: GameState = newGame(cfg({ k: [2, 5], n: 10 }));
    s = applyMove(s, 0);  // point gap 0
    s = applyMove(s, 0);  // Painter colours 0 -> [0]
    s = applyMove(s, 1);  // point gap 1 (end)
    const m = aiMove(s, 1, makeRng(2));
    expect(m).toBe(1);
    expect(applyMove(s, m).winner).not.toBe('P');
  });

  it('off-diagonal: greedy PAINTER prefers building the harder (long-k) colour', () => {
    // Neither move loses immediately, but colour 0 (k0=3) is more dangerous than colour 1 (k1=6).
    let s: GameState = newGame(cfg({ k: [3, 6], n: 12 }));
    s = { ...s, line: [0], phase: 'point', gap: null };
    s = applyMove(s, 1); // point gap 1 (after the existing colour-0 token)
    const m = aiMove(s, 1, makeRng(4));
    expect(m).toBe(1);
  });

  it('greedy POINTER returns a legal, deterministic gap', () => {
    let s: GameState = newGame(cfg({ r: 2, k: [3, 3], n: 9 }));
    s = { ...s, line: [0, 0], phase: 'point', gap: null };
    for (let seed = 0; seed < 6; seed++) {
      const m = aiMove(s, 1, makeRng(seed));
      expect(legalMoves(s)).toContain(m);
    }
  });

  it('always terminates a full AI-vs-AI game with a winner, all levels (diagonal)', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg({ r: 2, k: [3, 3], n: 9 }));
      const rnd = makeRng(3);
      let guard = 0;
      while (!isOver(s) && guard++ < 2000) {
        s = applyMove(s, aiMove(s, lvl, rnd));
      }
      expect(s.winner === 'P' || s.winner === 'A').toBe(true);
    }
  });

  it('always terminates a full AI-vs-AI game with a winner, all levels (off-diagonal)', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg({ r: 2, k: [3, 4], n: 7 }));
      const rnd = makeRng(3);
      let guard = 0;
      while (!isOver(s) && guard++ < 2000) s = applyMove(s, aiMove(s, lvl, rnd));
      expect(s.winner === 'P' || s.winner === 'A').toBe(true);
    }
  });

  it('solver returns promptly on a larger instance (falls back when too big)', () => {
    let s: GameState = newGame(cfg({ r: 3, k: [3, 3, 3], n: 20 }));
    s = { ...s, line: [0, 1, 0, 2, 1], phase: 'point', gap: null };
    const t0 = Date.now();
    const m = aiMove(s, 3, makeRng(1));
    const ms = Date.now() - t0;
    expect(legalMoves(s)).toContain(m);
    expect(ms).toBeLessThan(500);
  });
});
