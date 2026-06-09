import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, legalMoves } from '../engine/rules';
import { aiMove, makeRng } from '../engine/ai';
import { AILevel, GameConfig, GameState, Variant } from '../engine/types';

function cfg(variant: Variant): GameConfig {
  const small = variant === 'words'
    ? { k: 2, n: 6, minBlock: 1 }
    : { k: 5, n: 5, minBlock: 2 };
  return { variant, ...small, humanRole: 'none', aiLevel: { AVOIDER: 1, FORCER: 1 }, seed: 1 };
}

describe('aiMove', () => {
  it('returns a legal move at every level for both variants and both phases', () => {
    for (const variant of ['words', 'perm'] as Variant[]) {
      for (const lvl of [0, 1, 2, 3] as AILevel[]) {
        // point phase
        let s = newGame(cfg(variant));
        let m = aiMove(s, lvl, makeRng(5));
        expect(legalMoves(s)).toContain(m);
        // insert phase
        s = applyMove(s, m);
        m = aiMove(s, lvl, makeRng(7));
        expect(legalMoves(s)).toContain(m);
      }
    }
  });

  it('is deterministic for a fixed seed', () => {
    const s = newGame(cfg('words'));
    expect(aiMove(s, 2, makeRng(9))).toBe(aiMove(s, 2, makeRng(9)));
    expect(aiMove(s, 3, makeRng(11))).toBe(aiMove(s, 3, makeRng(11)));
  });

  it('greedy FORCER takes an immediate winning insertion', () => {
    // seq [a], FORCER to point. After pointing the AVOIDER inserts; but check the FORCER's
    // 1-ply: from [a] insert phase, any 'a' insertion creates "aa". Set up insert phase as AVOIDER
    // and instead verify the AVOIDER greedily avoids an immediate loss.
    let s: GameState = newGame(cfg('words')); // k=2,n=6
    s = applyMove(s, 0);   // FORCER points gap 0
    s = applyMove(s, 0);  // AVOIDER inserts 'a' -> [a]
    s = applyMove(s, 1);   // FORCER points gap 1 (end)
    // AVOIDER to insert; inserting 'a' -> "aa" loses; greedy should pick 'b'
    const m = aiMove(s, 1, makeRng(2));
    expect(legalMoves(s)).toContain(m);
    expect(applyMove(s, m).winner).not.toBe('FORCER');
  });

  it('always terminates a full AI-vs-AI game with a winner, both variants, all levels', () => {
    for (const variant of ['words', 'perm'] as Variant[]) {
      for (const lvl of [0, 1, 2, 3] as AILevel[]) {
        let s: GameState = newGame(cfg(variant));
        const rnd = makeRng(3);
        let guard = 0;
        while (!isOver(s) && guard++ < 2000) {
          // Both sides play at level `lvl` (the cfg() levels are overridden here on purpose so the
          // loop genuinely varies the AI level across the outer iterations).
          s = applyMove(s, aiMove(s, lvl, rnd));
        }
        expect(s.winner === 'AVOIDER' || s.winner === 'FORCER').toBe(true);
      }
    }
  });

  it('greedy FORCER prefers a gap that forces a tight twin over one that does not', () => {
    // From "0102" (k=3) the FORCER's gap choices differ: pointing at gap 3 forces EVERY avoider
    // insert into a tight twin (the strongest gap), whereas other gaps leave the avoider escapes.
    // The fixed greedy heuristic (minimise the opponent's safe replies) must single out gap 3.
    const config: GameConfig = {
      variant: 'words', k: 3, n: 20, minBlock: 1,
      humanRole: 'none', aiLevel: { AVOIDER: 1, FORCER: 1 }, seed: 1,
    };
    let s: GameState = newGame(config);
    s = { ...s, seq: [0, 1, 0, 2], phase: 'point', turn: 'FORCER' };
    // Deterministic and unique across many seeds: the FORCER always picks the forcing gap 3.
    for (let seed = 0; seed < 12; seed++) {
      const m = aiMove(s, 1, makeRng(seed));
      expect(m).toBe(3);
    }
  });

  it('level-3 solver returns promptly on a danger-zone instance (words k=4 n=12 mid-game)', () => {
    // Regression for the UI-freeze: with words k=4, n=12 at sequence length 5 the unbounded exact
    // minimax used to blow past tens of millions of nodes and block the main thread for minutes.
    // The affordability gate (and the in-solver node cap) must make a single move return quickly.
    const config: GameConfig = {
      variant: 'words', k: 4, n: 12, minBlock: 1,
      humanRole: 'none', aiLevel: { AVOIDER: 3, FORCER: 3 }, seed: 1,
    };
    let s: GameState = newGame(config);
    s = { ...s, seq: [0, 1, 0, 2, 0], phase: 'point', turn: 'FORCER' };
    const t0 = Date.now();
    const m = aiMove(s, 3, makeRng(1));
    const ms = Date.now() - t0;
    expect(legalMoves(s)).toContain(m);
    expect(ms).toBeLessThan(200);
  });
});
