import { describe, it, expect } from 'vitest';
import { GameConfig } from '../engine/types';
import { newGame } from '../engine/rules';
import { solve } from '../engine/ai';
import { optimalWinner, avoiderThreshold, tournament } from '../sim/tournament';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    game: 'append', k: 3, n: 6, repMode: 'square',
    humanRole: 'none', aiLevel: { R: 3, B: 3 }, seed: 1, ...over,
  };
}

describe('exact solver — append game (FORCER moves second and always forces a square)', () => {
  it('FORCER wins append/square for n >= 2 regardless of alphabet size', () => {
    for (const k of [2, 3, 4]) {
      for (const n of [2, 4, 6]) {
        expect(solve(newGame(cfg({ game: 'append', k, n })))).toBe(-1); // -1 = FORCER
      }
    }
  });
});

describe('exact solver — online game has a genuine alphabet threshold', () => {
  it('matches the verified small-instance values (square)', () => {
    // online, square: AVOIDER survives only with enough letters.
    expect(optimalWinner('online', 2, 4, 'square')).toBe('FORCER');
    expect(optimalWinner('online', 3, 4, 'square')).toBe('AVOIDER');
    expect(optimalWinner('online', 3, 5, 'square')).toBe('FORCER');
    expect(optimalWinner('online', 4, 5, 'square')).toBe('AVOIDER');
    expect(optimalWinner('online', 4, 6, 'square')).toBe('AVOIDER');
  });
  it('the AVOIDER threshold rises as the target length grows', () => {
    expect(avoiderThreshold('online', 4, 'square', 2, 6)).toBe(3);
    expect(avoiderThreshold('online', 5, 'square', 2, 6)).toBe(4);
  });
});

describe('tournament self-play is deterministic and consistent with the solver', () => {
  it('online k=2 square: FORCER wins every game (AVOIDER cannot survive)', () => {
    const r = tournament(
      { game: 'online', k: 2, n: 5, repMode: 'square', avoiderLevel: 3, forcerLevel: 3 }, 20,
    );
    expect(r.avoiderWins).toBe(0);
  });
  it('online k=4 n=5 square: optimal AVOIDER wins every game', () => {
    const r = tournament(
      { game: 'online', k: 4, n: 5, repMode: 'square', avoiderLevel: 3, forcerLevel: 3 }, 20,
    );
    expect(r.avoiderWins).toBe(r.games);
  });
});
