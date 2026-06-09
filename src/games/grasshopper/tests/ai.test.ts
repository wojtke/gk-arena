import { describe, it, expect } from 'vitest';
import {
  GameConfig, GameState, BUILDER, GRASSHOPPER,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer, solve, legalMoves,
} from '../engine';
import { guaranteedD, optimalWinner, playGame } from '../sim/tournament';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    alpha: 3, d: 6, power: 2, humanRole: 'none', aiLevel: { B: 1, R: 1 }, seed: 1, ...over,
  };
}
function build(s: GameState, letters: number[]): GameState {
  for (const c of letters) s = applyMove(s, c);
  return s;
}

describe('greedy Grasshopper (forcer)', () => {
  it('hops onto a letter that completes a square when one is reachable', () => {
    // S already = [a]; W lookahead = [a, b]. +1 → S=[a,a] (square ⇒ Grasshopper wins);
    // +2 → S=[a,b] (no square). The forcer should TAKE the +1 win.
    let s = newGame(cfg({ alpha: 2 }));
    s = build(s, [0, 0]);      // W=[a,a]
    s = applyMove(s, 1);       // +1 → S=[a], p=0, need=1
    s = build(s, [1]);         // W=[a,a,b]; hop phase, lookahead [a,b]
    expect(s.phase).toBe('hop');
    // +1 lands on index1 = a → square ⇒ Grasshopper win; +2 lands on index2 = b → no win.
    expect(applyMove(s, 1).winner).toBe(GRASSHOPPER);
    expect(applyMove(s, 2).winner).toBeNull();
    const rnd = makeRng(7);
    const m = aiMove(s, 1, rnd); // greedy grasshopper (forcer)
    expect(m).toBe(1);           // forces the square
  });
});

describe('greedy Builder (avoider)', () => {
  it('appends a letter that keeps S square-free when one exists (the dodger)', () => {
    // S=[a], grasshopper on the last letter so it owes need=1 letter, then will hop.
    // alpha=2: choosing letter b means the only landable letter is b ≠ a, so no square forms on the
    // next hop; choosing a would let the grasshopper land on a → S=[a,a] square. The avoider picks b.
    let s = newGame(cfg({ alpha: 2, d: 9 }));
    s = build(s, [0, 1]);      // W=[a,b]
    s = applyMove(s, 1);       // +1 → S=[a], p=0, need=1 (build phase)
    expect(s.phase).toBe('build');
    expect(s.needLeft).toBe(1);
    // If Builder appends a → W=[a,b,a]; grasshopper can hop to a (index 2) → S=[a,a] square ⇒ G wins.
    const afterA = applyMove(s, 0);
    expect(legalMoves(afterA).some((h) => applyMove(afterA, h).winner === GRASSHOPPER)).toBe(true);
    // If Builder appends b → W=[a,b,b]; landable letter is b ≠ a → no square next hop.
    const afterB = applyMove(s, 1);
    expect(legalMoves(afterB).some((h) => applyMove(afterB, h).winner === GRASSHOPPER)).toBe(false);
    const rnd = makeRng(3);
    const m = aiMove(s, 1, rnd); // greedy builder (avoider)
    expect(m).toBe(1);           // dodges by appending the safe letter b
  });
});

describe('forced repeat: the Grasshopper wins when the Builder must repeat', () => {
  it('with alpha=1 every letter is equal, so the forcer always completes a square', () => {
    // alpha=1 means the Builder cannot make the two landable letters different — it is forced into a
    // repeat — so the grasshopper (forcer) wins under perfect play for any d ≥ 2.
    expect(optimalWinner(1, 2, 2)).toBe(GRASSHOPPER);
    expect(playGame({ alpha: 1, d: 6, power: 2, builderLevel: 3, grasshopperLevel: 3 }, 5)).toBe(GRASSHOPPER);
  });
});

describe('solver', () => {
  it('is deterministic for a fixed tiny (alpha, d)', () => {
    const v1 = solve(newGame(cfg({ alpha: 3, d: 5 })));
    const v2 = solve(newGame(cfg({ alpha: 3, d: 5 })));
    expect(v1).toBe(v2);
    expect([-1, 1]).toContain(v1);
  });

  it('the Builder (avoider) trivially survives d=1 (one hop, no square possible yet)', () => {
    // |S| reaches 1 after a single hop and a 1-letter word has no square suffix ⇒ Builder wins at d=1.
    expect(optimalWinner(1, 1, 2)).toBe(BUILDER);
    expect(optimalWinner(3, 1, 2)).toBe(BUILDER);
  });

  it('avoidance form de-degenerates: the winner now depends on (|A|, d), not a constant', () => {
    // The literal win-direction was degenerate (a forced win at d=2 for every |A|). In the avoidance
    // form the outcome is a real, two-sided contest. The grasshopper's freedom to CHOOSE which
    // subsequence is judged is strictly stronger than reading a fixed word, so over |A| = 3 it can
    // still force a square (from d = 5) — beating plain Thue, where a static word stays square-free
    // forever. The avoider only escapes for good once |A| ≥ 4.
    expect(optimalWinner(3, 4, 2)).toBe(BUILDER);     // Builder survives to d=4
    expect(optimalWinner(3, 5, 2)).toBe(GRASSHOPPER); // …but the forcer breaks through at d=5
    expect(optimalWinner(4, 10, 2)).toBe(BUILDER);    // |A|=4: avoider survives long
    expect(optimalWinner(1, 2, 2)).toBe(GRASSHOPPER); // alpha 1 forces a repeat ⇒ forcer wins
  });

  it('guaranteedD is no longer a constant: it grows with |A| and jumps at the |A|=4 threshold', () => {
    // Builder's guaranteed square-free length: 2 (|A|=2), 4 (|A|=3), then unbounded (capped at dmax)
    // from |A|=4 on — a genuine, monotone, non-constant table (vs the degenerate constant 1 before).
    expect(guaranteedD(2, 2, 12)).toBe(2);
    expect(guaranteedD(3, 2, 12)).toBe(4);
    expect(guaranteedD(2, 2, 12)).toBeLessThan(guaranteedD(3, 2, 12));
    expect(guaranteedD(4, 2, 12)).toBe(12); // survives to the cap ⇒ unbounded over |A| ≥ 4
  });
});

describe('full games always terminate (watch-AI requirement)', () => {
  it('every level pairing reaches a terminal state', () => {
    for (const B of [0, 1, 2, 3] as const) {
      for (const G of [0, 1, 2, 3] as const) {
        const w = playGame({ alpha: 3, d: 6, power: 2, builderLevel: B, grasshopperLevel: G }, 42);
        expect([BUILDER, GRASSHOPPER]).toContain(w);
      }
    }
  });

  it('a watch loop drives any config to isOver within a bounded number of plies', () => {
    let s = newGame(cfg({ alpha: 3, d: 8, humanRole: 'none' }));
    const rnd = makeRng(99);
    let guard = 0;
    while (!isOver(s) && guard++ < 10000) {
      const level = currentPlayer(s) === BUILDER ? 2 : 2;
      s = applyMove(s, aiMove(s, level, rnd));
    }
    expect(isOver(s)).toBe(true);
  });
});
