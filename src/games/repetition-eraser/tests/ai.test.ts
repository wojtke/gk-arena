import { describe, it, expect } from 'vitest';
import {
  AILevel, EraseRule, GameConfig, GameState, GROWER, SHRINKER,
  newGame, applyMove, isOver, legalMoves,
} from '../engine';
import { aiMove, makeRng } from '../ai';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    k: 3, d: 8, rounds: 14, rule: 'shortest',
    humanRole: 'none', aiLevel: { R: 1, B: 1 }, seed: 1, ...over,
  };
}

describe('aiMove', () => {
  it('returns a legal letter at every level', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      const s = newGame(cfg());
      const m = aiMove(s, lvl, makeRng(5));
      expect(Number.isInteger(m)).toBe(true);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(s.config.k);
      expect(legalMoves(s)).toContain(m);
    }
  });

  it('returns a legal letter at every level for both erasure rules', () => {
    for (const rule of ['shortest', 'longest'] as EraseRule[]) {
      for (const lvl of [0, 1, 2, 3] as AILevel[]) {
        let s = newGame(cfg({ rule }));
        s = applyMove(s, 0);
        s = applyMove(s, 1); // some non-trivial state
        const m = aiMove(s, lvl, makeRng(7));
        expect(legalMoves(s)).toContain(m);
      }
    }
  });

  it('is deterministic for a fixed seed', () => {
    const s = newGame(cfg());
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      expect(aiMove(s, lvl, makeRng(9))).toBe(aiMove(s, lvl, makeRng(9)));
    }
  });

  it('always terminates an AI-vs-AI game with a winner (every level pairing)', () => {
    for (const gl of [0, 1, 2, 3] as AILevel[]) {
      for (const sl of [0, 1, 2, 3] as AILevel[]) {
        let s: GameState = newGame(cfg({ k: 2, d: 6, rounds: 12, aiLevel: { R: gl, B: sl } }));
        const rnd = makeRng(3 + gl * 10 + sl);
        let guard = 0;
        while (!isOver(s) && guard++ < 1000) {
          s = applyMove(s, aiMove(s, s.config.aiLevel[s.turn], rnd));
        }
        expect(isOver(s)).toBe(true);
        expect(s.winner === GROWER || s.winner === SHRINKER).toBe(true);
      }
    }
  });

  it('a greedy Grower prefers a non-erasing letter over one that triggers an erasure', () => {
    // word "a" with k>=2: appending 'a' erases (length stays 1); appending 'b' grows to 2.
    // The greedy max should pick the growing letter, never the self-erasing one.
    let s = newGame(cfg({ k: 2, d: 8, rounds: 14 }));
    s = applyMove(s, 0); // word = [0], Shrinker (B) to move...
    // make it Grower's turn again: B plays something, then it's R.
    s = applyMove(s, 1); // word = [0,1]
    expect(s.turn).toBe(GROWER);
    const m = aiMove(s, 1, makeRng(1));
    const grown = applyMove(s, m).word.length;
    // word=[0,1]: appending 0 grows to 3, appending 1 self-erases back to 2 (== s.word.length).
    // Greedy MAX must strictly grow, so it must pick the length-3 option, never the self-erasing one.
    expect(grown).toBe(3);
    expect(grown).toBeGreaterThan(s.word.length); // strictly longer: never chooses to shrink itself
  });
});

describe('level-3 search is game-theoretically optimal on small instances', () => {
  // Independent brute-force solver over the WHOLE game tree (no depth cap, no eval heuristic):
  // +1 if the Grower can force a win from s with optimal play, -1 otherwise.
  function solve(s: GameState): number {
    if (isOver(s)) return s.winner === GROWER ? 1 : -1;
    const vals = legalMoves(s).map((m) => solve(applyMove(s, m)));
    return s.turn === GROWER ? Math.max(...vals) : Math.min(...vals);
  }

  function optimalSelfPlay(over: Partial<GameConfig>, seed: number): void {
    let s: GameState = newGame(cfg(over));
    let guard = 0;
    while (!isOver(s) && guard++ < 200) {
      const optVal = solve(s);                          // best achievable value at this state
      const chosen = aiMove(s, 3, makeRng(seed + guard));
      const chosenVal = solve(applyMove(s, chosen));    // value the search's move actually leads to
      // For BOTH players, an optimal move keeps the game value unchanged: the maximiser may not
      // drop from a win, and the minimiser may not let the Grower escape into one.
      expect(chosenVal).toBe(optVal);
      s = applyMove(s, chosen);
    }
    expect(isOver(s)).toBe(true);
  }

  it('preserves a Grower forced win (k=3, d=5, rounds=10): search wins as Red', () => {
    // Verified by the brute-force solver: this is a forced Grower win from the empty word.
    expect(solve(newGame(cfg({ k: 3, d: 5, rounds: 10 })))).toBe(1);
    optimalSelfPlay({ k: 3, d: 5, rounds: 10 }, 100);
  });

  it('preserves a Shrinker forced win (k=3, d=6, rounds=8): search holds as Blue', () => {
    // Verified by the brute-force solver: forced Shrinker win — every search move must hold the line.
    expect(solve(newGame(cfg({ k: 3, d: 6, rounds: 8 })))).toBe(-1);
    optimalSelfPlay({ k: 3, d: 6, rounds: 8 }, 200);
  });
});
