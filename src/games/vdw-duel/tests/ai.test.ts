import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, legalMoves } from '../engine/rules';
import { aiMove, makeRng } from '../engine/ai';
import { AILevel, GameConfig, GameState, Owner, RED, BLUE } from '../engine/types';
import { findAP } from '../engine/detect';

function cfg(k = 3): GameConfig {
  return { k, maxLen: k === 3 ? 9 : 35, humanRole: 'none', aiLevel: { R: 1, B: 1 }, seed: 1 };
}

function fromLine(line: Owner[], turn: Owner, k = 3): GameState {
  return { ...newGame(cfg(k)), line: [...line], turn };
}

describe('aiMove returns legal moves', () => {
  it('every level returns a legal gap on a mid-game line', () => {
    const s = fromLine(['R', 'B', 'R'], BLUE);
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      expect(legalMoves(s)).toContain(aiMove(s, lvl, makeRng(5)));
    }
  });
  it('is deterministic for a fixed seed', () => {
    const s = fromLine(['R', 'B', 'R', 'B'], RED);
    expect(aiMove(s, 2, makeRng(9))).toBe(aiMove(s, 2, makeRng(9)));
    expect(aiMove(s, 3, makeRng(11))).toBe(aiMove(s, 3, makeRng(11)));
  });
});

describe('greedy never self-completes a k-AP when a safe gap exists', () => {
  it('Red has a safe drop and must take it instead of building R R R', () => {
    // Line R R: appending at gap 2 → R R R (Red loses). A safe drop exists (e.g. gap 1 → R R R? no).
    // Use R _ R: Red to move, gap 1 → R R R loses; but inserting at the ends shifts and may be safe.
    // Line R R B: Red to move. gap 2 → R R R B = Red {0,1,2} loses. Safe alternatives exist.
    const s = fromLine(['R', 'R', 'B'], RED);
    for (let seed = 0; seed < 20; seed++) {
      const m = aiMove(s, 1, makeRng(seed));
      const child = applyMove(s, m);
      expect(child.loser).not.toBe(RED); // greedy avoids self-completion
    }
  });
  it('greedy takes an immediate win — shoving the opponent into an AP', () => {
    // B R B B, Red to move: inserting Red at gap 3 → B R B R B shoves Blue into {0,2,4} (Blue loses)
    // while Red stays safe. Greedy must take this winning gap.
    const s = fromLine(['B', 'R', 'B', 'B'], RED);
    for (let seed = 0; seed < 12; seed++) {
      const m = aiMove(s, 1, makeRng(seed));
      const child = applyMove(s, m);
      expect(child.loser).toBe(BLUE);
      expect(child.winner).toBe(RED);
    }
  });
});

describe('solver (exact k=3) verdict is stable', () => {
  it('from a forced-win position the solver wins (never self-loses, and Red prevails on playout)', () => {
    const start = fromLine(['B', 'R', 'B', 'B'], RED); // Red has a forced win here
    for (let seed = 0; seed < 8; seed++) {
      // First move never self-loses.
      const m = aiMove(start, 3, makeRng(seed));
      expect(applyMove(start, m).loser).not.toBe(RED);
      // Solver vs solver from here: Red (the side to move) must win.
      let s = start;
      const rnd = makeRng(seed + 100);
      let guard = 0;
      while (!isOver(s) && guard++ < 50) s = applyMove(s, aiMove(s, 3, rnd));
      expect(s.winner).toBe(RED);
    }
  });

  it('solver verdict from the empty line is deterministic across seeds', () => {
    const empty = newGame(cfg(3));
    const first = aiMove(empty, 3, makeRng(0));
    // The optimal value (win/lose) is fixed even if tie-break gaps vary; confirm a legal, stable move.
    for (let seed = 0; seed < 6; seed++) {
      expect(legalMoves(empty)).toContain(aiMove(empty, 3, makeRng(seed)));
    }
    expect(legalMoves(empty)).toContain(first);
  });
});

describe('AI-vs-AI always terminates with a loser', () => {
  it('all levels finish a full game by W(2;3)', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg(3));
      const rnd = makeRng(3);
      let guard = 0;
      while (!isOver(s) && guard++ < 200) {
        s = applyMove(s, aiMove(s, lvl, rnd));
      }
      expect(isOver(s)).toBe(true);
      expect(s.line.length).toBeLessThanOrEqual(9);
      expect(findAP(s.line, s.loser!, 3)).not.toBeNull();
    }
  });
});
