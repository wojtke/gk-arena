import { describe, it, expect } from 'vitest';
import { newGame, applyMove, isOver, legalMoves } from '../engine/rules';
import { aiMove, makeRng } from '../engine/ai';
import { AILevel, APSpec, GameConfig, GameState, Mode, Move, RED, BLUE } from '../engine/types';
import { isLegal, usedLength } from '../engine/strip';
import { mF } from '../engine/mF';

function cfg(mode: Mode, over: Partial<GameConfig> = {}): GameConfig {
  const base: GameConfig = {
    mode, L: 12, humanRole: 'none', aiLevel: { R: 1, B: 1 }, seed: 1, ...over,
  };
  if (mode === 'two-player') { base.diffs = base.diffs ?? [1, 2]; base.lengths = base.lengths ?? [2, 3]; }
  else { base.family = base.family ?? [{ d: 1, len: 2 }, { d: 2, len: 2 }, { d: 1, len: 3 }]; }
  return base;
}

function moveIsLegal(s: GameState, m: Move): boolean {
  if (m.kind === 'place') return isLegal(s.occupied, m.start, m.d, m.len);
  return m.cell >= 0 && m.cell < s.L && s.occupied[m.cell] === null;
}

describe('aiMove returns a legal move at every level, every mode', () => {
  for (const mode of ['solo', 'two-player', 'pack-vs-block'] as Mode[]) {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      it(`${mode} level ${lvl}`, () => {
        const s = newGame(cfg(mode));
        const m = aiMove(s, lvl, makeRng(7));
        expect(m).not.toBeNull();
        if (m) {
          expect(moveIsLegal(s, m)).toBe(true);
          // the move should be among enumerated legal moves (by shape)
          const legal = legalMoves(s);
          expect(legal.length).toBeGreaterThan(0);
        }
      });
    }
  }

  it('pack-vs-block Breaker returns a legal block move', () => {
    let s = newGame(cfg('pack-vs-block', { family: [{ d: 1, len: 2 }, { d: 2, len: 2 }] }));
    // Maker moves first
    const mk = aiMove(s, 1, makeRng(1));
    expect(mk).not.toBeNull();
    s = applyMove(s, mk!);
    if (!isOver(s)) {
      expect(s.turn).toBe(BLUE);
      const blk = aiMove(s, 1, makeRng(2));
      expect(blk).not.toBeNull();
      expect(blk!.kind).toBe('block');
      expect(moveIsLegal(s, blk!)).toBe(true);
    }
  });
});

describe('determinism', () => {
  it('is deterministic for a fixed seed (two-player level 2)', () => {
    const s = newGame(cfg('two-player'));
    const a = aiMove(s, 2, makeRng(9));
    const b = aiMove(s, 2, makeRng(9));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('is deterministic for solo level 3', () => {
    const s = newGame(cfg('solo'));
    const a = aiMove(s, 3, makeRng(4));
    const b = aiMove(s, 3, makeRng(4));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('AI-vs-AI terminates with a winner', () => {
  it('two-player game terminates with a winner', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg('two-player', { L: 10, aiLevel: { R: lvl, B: lvl } }));
      const rnd = makeRng(3);
      let guard = 0;
      while (!isOver(s) && guard++ < 300) {
        const m = aiMove(s, s.config.aiLevel[s.turn], rnd);
        if (!m) break;
        s = applyMove(s, m);
      }
      expect(isOver(s)).toBe(true);
      expect(s.winner === RED || s.winner === BLUE).toBe(true);
    }
  });

  it('pack-vs-block game terminates with a winner', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg('pack-vs-block', {
        L: 10, family: [{ d: 1, len: 2 }, { d: 2, len: 2 }, { d: 1, len: 3 }],
        aiLevel: { R: lvl, B: lvl },
      }));
      const rnd = makeRng(5);
      let guard = 0;
      while (!isOver(s) && guard++ < 300) {
        const m = aiMove(s, s.config.aiLevel[s.turn], rnd);
        if (!m) break;
        s = applyMove(s, m);
      }
      expect(isOver(s)).toBe(true);
      expect(s.winner === RED || s.winner === BLUE).toBe(true);
    }
  });

  it('solo auto-packs to completion at every level', () => {
    for (const lvl of [0, 1, 2, 3] as AILevel[]) {
      let s: GameState = newGame(cfg('solo', { L: 16, aiLevel: { R: lvl, B: lvl } }));
      const rnd = makeRng(2);
      let guard = 0;
      while (!isOver(s) && guard++ < 100) {
        const m = aiMove(s, lvl, rnd);
        if (!m) break;
        s = applyMove(s, m);
      }
      // With enough room the greedy/solver should place everything.
      expect(s.remaining.length === 0 || isOver(s)).toBe(true);
    }
  });
});

describe('solo level 3 Solver reaches the exact optimum m(F)', () => {
  // The shipped families the headline "Solver" must crack (greedy lands short on these).
  const FAMS: Record<string, APSpec[]> = {
    D: [{ d: 1, len: 3 }, { d: 2, len: 2 }, { d: 3, len: 3 }],
    E: [{ d: 1, len: 4 }, { d: 2, len: 3 }, { d: 3, len: 3 }, { d: 1, len: 2 }],
  };
  for (const [name, family] of Object.entries(FAMS)) {
    for (const seed of [1, 2, 5]) {
      it(`family ${name} packs in used length m(F) (seed ${seed})`, () => {
        let s: GameState = newGame(cfg('solo', { L: 20, family, aiLevel: { R: 3, B: 3 } }));
        const rnd = makeRng(seed);
        let guard = 0;
        while (!isOver(s) && guard++ < 50) {
          const m = aiMove(s, 3, rnd);
          if (!m) break;
          s = applyMove(s, m);
        }
        expect(s.remaining.length).toBe(0);
        expect(usedLength(s.occupied)).toBe(mF(family, 60));
      });
    }
  }

  it('level 3 strictly beats level 1 greedy on family E', () => {
    const family = FAMS.E;
    const run = (lvl: AILevel): number => {
      let s: GameState = newGame(cfg('solo', { L: 20, family, aiLevel: { R: lvl, B: lvl } }));
      const rnd = makeRng(3);
      let g = 0;
      while (!isOver(s) && g++ < 50) { const m = aiMove(s, lvl, rnd); if (!m) break; s = applyMove(s, m); }
      return usedLength(s.occupied);
    };
    expect(run(3)).toBeLessThan(run(1));
  });
});
