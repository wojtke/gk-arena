import { describe, it, expect } from 'vitest';
import { GameConfig, AILevel, AVOIDER, FORCER } from '../engine/types';
import {
  newGame, applyMove, currentPlayer, isOver, legalMoves,
} from '../engine/rules';
import {
  aiMove, makeRng, explainMove, explicitAvoiderApplies, explicitAvoiderMove,
} from '../engine/ai';
import { hasRepetition } from '../engine/detectors';

// The explicit, provably-correct avoider strategy of Grytczuk–Kosiński–Zmarz (Theorem 2):
// the append nontrivial game over >= 9 letters. Ann should reach any length n with no nontrivial
// repetition, against any forcer.

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    game: 'append', k: 9, n: 30, repMode: 'nontrivial',
    humanRole: 'none', aiLevel: { R: 3, B: 1 }, seed: 1, ...over,
  };
}

/** Play the append nontrivial game with Ann on the explicit strategy and the given forcer level. */
function playAnnExplicit(c: GameConfig, forcerLevel: AILevel, seed: number) {
  const rng = makeRng(seed);
  let s = newGame(c);
  let guard = 0;
  while (!isOver(s)) {
    const me = currentPlayer(s);
    const m = me === AVOIDER ? aiMove(s, 3, rng) : aiMove(s, forcerLevel, rng);
    s = applyMove(s, m);
    if (++guard > 100000) throw new Error('did not terminate');
  }
  return s;
}

describe('explicit 9-letter avoider strategy (append, nontrivial) — Theorem 2', () => {
  it('applies exactly on append/nontrivial/k>=9 avoider turns', () => {
    expect(explicitAvoiderApplies(newGame(cfg()))).toBe(true);
    expect(explicitAvoiderApplies(newGame(cfg({ k: 8 })))).toBe(false);
    expect(explicitAvoiderApplies(newGame(cfg({ repMode: 'square' })))).toBe(false);
    expect(explicitAvoiderApplies(newGame(cfg({ game: 'online' })))).toBe(false);
  });

  it('Level 3 routes the avoider to the explicit move on a large instance', () => {
    const s = newGame(cfg({ n: 30 }));
    expect(aiMove(s, 3, makeRng(1))).toBe(explicitAvoiderMove(s));
  });

  it('beats every forcer level and reaches the full target length, repetition-free', () => {
    for (const forcer of [0, 1, 2, 3] as AILevel[]) {
      for (let seed = 0; seed < 8; seed++) {
        const s = playAnnExplicit(cfg({ n: 30 }), forcer, seed);
        expect(s.winner).toBe(AVOIDER); // Ann survived to length n
        expect(s.word.length).toBe(30);
        expect(hasRepetition(s.word, 'nontrivial')).toBe(false);
      }
    }
  });

  it('is exhaustively safe: against ALL forcer replies up to length 12, no nontrivial repetition', () => {
    // Ann uses the explicit strategy; Ben branches over every letter. Verify the word never has a
    // nontrivial repetition along the whole tree.
    const c = cfg({ n: 12 });
    let failure: number[] | null = null;
    const dfs = (s: ReturnType<typeof newGame>): void => {
      if (failure) return;
      if (hasRepetition(s.word, 'nontrivial')) { failure = s.word.slice(); return; }
      if (isOver(s) || s.word.length >= c.n) return;
      if (currentPlayer(s) === AVOIDER) {
        dfs(applyMove(s, explicitAvoiderMove(s)));
      } else {
        for (const m of legalMoves(s)) dfs(applyMove(s, m));
      }
    };
    dfs(newGame(c));
    expect(failure).toBeNull();
  });
});

describe('explainMove — no contradictory advice in lost positions', () => {
  it('AVOIDER lost position: does not recommend a letter it also says to avoid', () => {
    // online square k=2: Ann is doomed; find a reachable insert-phase state where every letter loses.
    const c: GameConfig = {
      game: 'online', k: 2, n: 8, repMode: 'square',
      humanRole: 'none', aiLevel: { R: 3, B: 3 }, seed: 1,
    };
    // Scan small reachable insert-phase states to find one where every legal letter loses.
    type S = ReturnType<typeof newGame>;
    const seen = new Set<string>();
    const lost: S[] = [];
    const key = (g: S) => `${g.word.join(',')}|${g.phase}|${g.gap}`;
    const walk = (g: S, depth: number): void => {
      if (depth > 6 || g.winner) return;
      const kk = key(g);
      if (seen.has(kk)) return;
      seen.add(kk);
      if (g.phase === 'insert') {
        const moves = legalMoves(g);
        const allLose = moves.every((m) => applyMove(g, m).winner === FORCER);
        if (allLose && lost.length < 3) lost.push(g);
      }
      for (const m of legalMoves(g)) walk(applyMove(g, m), depth + 1);
    };
    walk(newGame(c), 0);
    expect(lost.length).toBeGreaterThan(0);
    for (const g of lost) {
      const e = explainMove(g, makeRng(1));
      expect(e).not.toBeNull();
      // The text must not both recommend and forbid the same letter. Honest "no safe move" text.
      expect(e!.text).toMatch(/no safe move|forbidden repetition/i);
      // It must not contain the pattern: 'play "X" to stay repetition-free' (a false promise).
      expect(e!.text).not.toMatch(/to stay repetition-free/);
    }
  });

  it('AVOIDER safe position: recommended letter is never in the avoid list', () => {
    const c: GameConfig = {
      game: 'append', k: 3, n: 8, repMode: 'square',
      humanRole: 'none', aiLevel: { R: 3, B: 3 }, seed: 1,
    };
    let s = newGame(c);
    s = applyMove(s, 0); // a (Ann)
    s = applyMove(s, 1); // b (Ben) -> "ab", Ann to move with safe options
    const e = explainMove(s, makeRng(1));
    expect(e).not.toBeNull();
    // applying the recommended move must be safe.
    expect(applyMove(s, e!.move).winner).not.toBe(FORCER);
  });
});

describe('explainMove — overlay names the exact move when given a forced move', () => {
  it('honors forcedMove so the overlay matches the AI move', () => {
    const c: GameConfig = {
      game: 'append', k: 3, n: 8, repMode: 'square',
      humanRole: 'none', aiLevel: { R: 0, B: 0 }, seed: 1,
    };
    const s = newGame(c);
    const actual = aiMove(s, 0, makeRng(99)); // some level-0 (random) move
    const e = explainMove(s, makeRng(1), 0, actual);
    expect(e!.move).toBe(actual); // overlay describes exactly the committed move
  });
});
