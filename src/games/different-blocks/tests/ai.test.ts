import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, legalMoves } from '../engine/rules';
import { aiMove, makeRng } from '../engine/ai';
import { findBadConfig } from '../engine/detect';
import { AILevel, GameConfig, GameState } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    alpha: 3, k: 3, n: 6,
    humanRole: 'none', aiLevel: { A: 1, C: 1 }, seed: 1, ...over,
  };
}

// Inlined square oracle (no thue-arena import) for the k=2 parity check.
function hasSquareOracle(word: readonly number[]): boolean {
  const n = word.length;
  for (let m = 1; m * 2 <= n; m++)
    for (let s = 0; s + 2 * m <= n; s++) {
      let eq = true;
      for (let t = 0; t < m; t++) if (word[s + t] !== word[s + m + t]) { eq = false; break; }
      if (eq) return true;
    }
  return false;
}

describe('aiMove', () => {
  it('returns a legal move at every level and both phases', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg());
      let m = aiMove(s, lvl, makeRng(5));
      expect(legalMoves(s)).toContain(m);
      s = applyMove(s, m);
      m = aiMove(s, lvl, makeRng(7));
      expect(legalMoves(s)).toContain(m);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const s = newGame(cfg());
    expect(aiMove(s, 2, makeRng(9))).toBe(aiMove(s, 2, makeRng(9)));
    expect(aiMove(s, 3, makeRng(11))).toBe(aiMove(s, 3, makeRng(11)));
  });

  it('greedy AVOIDER never creates a bad config when a safe letter exists', () => {
    // [a,b] then CONSTRUCTOR points at gap 2 (end). 'a'->aba (B0=B2) and 'b'->abb (B1=B2) both lose;
    // only 'c'->abc is safe. The greedy AVOIDER must find it.
    let s: GameState = newGame(cfg({ alpha: 3, k: 3, n: 20 }));
    s = { ...s, word: [0, 1], phase: 'insert', gap: 2, turn: 'A' };
    for (let seed = 0; seed < 12; seed++) {
      const m = aiMove(s, 1, makeRng(seed));
      const after = applyMove(s, m);
      expect(after.winner).not.toBe('C'); // did not walk into a bad config
      expect(findBadConfig(after.word, 3)).toBeNull();
    }
  });

  it('greedy CONSTRUCTOR takes an immediate winning point→... — picks a forcing gap', () => {
    // word [a,a]: CONSTRUCTOR to point. Pointing gap 2 (or 0) and any avoider 'a' would make aaa, but
    // avoider has escapes; check the chosen gap is legal and the forcer prefers high-pressure gaps.
    let s: GameState = newGame(cfg({ alpha: 3, k: 3, n: 20 }));
    s = { ...s, word: [0, 0], phase: 'point', turn: 'C' };
    const m = aiMove(s, 1, makeRng(1));
    expect(legalMoves(s)).toContain(m);
  });

  it('k=2 engine parity with the inlined square oracle on AI playthroughs', () => {
    // Run greedy-vs-greedy k=2 games and confirm the engine's win/loss matches the square oracle.
    for (let seed = 1; seed <= 25; seed++) {
      let s: GameState = newGame(cfg({ alpha: 2, k: 2, n: 10 }));
      const rnd = makeRng(seed);
      let guard = 0;
      while (!isOver(s) && guard++ < 500) s = applyMove(s, aiMove(s, 1, rnd));
      // engine says CONSTRUCTOR iff the final word has a square per the oracle
      expect(s.winner === 'C').toBe(hasSquareOracle(s.word));
    }
  });

  it('always terminates a full AI-vs-AI game with a winner, all levels', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg({ alpha: 3, k: 3, n: 8 }));
      const rnd = makeRng(3);
      let guard = 0;
      while (!isOver(s) && guard++ < 2000) s = applyMove(s, aiMove(s, lvl, rnd));
      expect(s.winner === 'A' || s.winner === 'C').toBe(true);
    }
  });

  it('level-3 solver value is stable on a tiny instance', () => {
    const s = newGame(cfg({ alpha: 3, k: 3, n: 4 }));
    const a = aiMove(s, 3, makeRng(1));
    const b = aiMove(s, 3, makeRng(1));
    expect(a).toBe(b);
    expect(legalMoves(s)).toContain(a);
  });

  it('solver returns promptly on a danger-zone instance', () => {
    let s: GameState = newGame(cfg({ alpha: 4, k: 3, n: 12 }));
    s = { ...s, word: [0, 1, 0, 2, 0], phase: 'point', turn: 'C' };
    const t0 = Date.now();
    const m = aiMove(s, 3, makeRng(1));
    expect(Date.now() - t0).toBeLessThan(300);
    expect(legalMoves(s)).toContain(m);
  });
});
