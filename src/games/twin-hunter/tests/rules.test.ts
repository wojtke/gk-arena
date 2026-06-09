import { describe, it, expect } from 'vitest';
import {
  newGame, legalMoves, applyMove, currentPlayer, isOver, defaultMinBlock,
} from '../engine/rules';
import { AVOIDER, FORCER, GameConfig, GameState, Variant } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    variant: 'words', k: 3, n: 6, minBlock: 1,
    humanRole: 'none', aiLevel: { AVOIDER: 0, FORCER: 0 }, seed: 1, ...over,
  };
}

/** Helper: FORCER points at gap g, then AVOIDER inserts symbol c. */
function play(s: GameState, g: number, c: number): GameState {
  return applyMove(applyMove(s, g), c);
}

describe('newGame / phases', () => {
  it('starts empty, FORCER to point', () => {
    const s = newGame(cfg());
    expect(s.seq.length).toBe(0);
    expect(s.phase).toBe('point');
    expect(currentPlayer(s)).toBe(FORCER);
  });
  it('point phase lists every gap; after pointing, insert phase lists letters', () => {
    let s = newGame(cfg({ k: 3 }));
    expect(legalMoves(s)).toEqual([0]); // empty seq -> only gap 0
    s = applyMove(s, 0);
    expect(s.phase).toBe('insert');
    expect(currentPlayer(s)).toBe(AVOIDER);
    expect(legalMoves(s)).toEqual([0, 1, 2]); // k=3 letters
  });
});

describe('applyMove — words variant', () => {
  it('inserts at the pointed gap', () => {
    let s = newGame(cfg());
    s = play(s, 0, 0); // insert 'a' at gap 0 -> [a]
    s = play(s, 1, 1); // point gap 1, insert 'b' -> [a,b]
    expect(s.seq).toEqual([0, 1]);
  });
  it('FORCER wins the instant tight twins appear ("aa")', () => {
    let s = newGame(cfg({ k: 2, n: 8, minBlock: 1 }));
    s = play(s, 0, 0);     // [a]
    s = play(s, 1, 0);     // [a,a] -> tight twins
    expect(s.winner).toBe(FORCER);
    expect(isOver(s)).toBe(true);
    expect(s.witness).toBeDefined();
  });
  it('AVOIDER wins by reaching the target with no tight twin', () => {
    // alphabet 3, target 3: a,b,c has no shuffle square
    let s = newGame(cfg({ k: 3, n: 3, minBlock: 1 }));
    s = play(s, 0, 0); // [a]
    s = play(s, 1, 1); // [a,b]
    s = play(s, 2, 2); // [a,b,c] len 3 = target
    expect(s.winner).toBe(AVOIDER);
  });
  it('rejects an illegal move (returns same state)', () => {
    const s = newGame(cfg());
    const after = applyMove(s, 99); // gap 99 not legal on empty seq
    expect(after).toBe(s);
  });
});

describe('applyMove — perm variant: used numbers removed', () => {
  it('insert phase offers only unused numbers and target is all-placed', () => {
    const v: Variant = 'perm';
    let s = newGame(cfg({ variant: v, k: 5, n: 5, minBlock: defaultMinBlock('perm') }));
    s = applyMove(s, 0);            // point gap 0
    expect(legalMoves(s)).toEqual([1, 2, 3, 4, 5]);
    s = applyMove(s, 3);           // insert 3 -> [3]
    s = applyMove(s, 0);          // point gap 0
    expect(legalMoves(s)).toEqual([1, 2, 4, 5]); // 3 removed
    expect(s.seq).toEqual([3]);
  });
  it('order-isomorphic tight twins end the game for FORCER', () => {
    const v: Variant = 'perm';
    // build [1,3,2,4]: pattern split {1,3}/{2,4} order-iso -> shuffle square
    let s = newGame(cfg({ variant: v, k: 6, n: 6, minBlock: 2 }));
    s = play(s, 0, 1); // [1]
    s = play(s, 1, 3); // [1,3]
    s = play(s, 2, 2); // [1,3,2]
    s = play(s, 3, 4); // [1,3,2,4] -> tight twins
    expect(s.winner).toBe(FORCER);
    expect(s.witness).toBeDefined();
  });
});

describe('defaultMinBlock', () => {
  it('is 1 for words and 2 for perm', () => {
    expect(defaultMinBlock('words')).toBe(1);
    expect(defaultMinBlock('perm')).toBe(2);
  });
});
