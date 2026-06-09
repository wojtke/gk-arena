import { describe, it, expect } from 'vitest';
import {
  newGame, legalMoves, applyMove, currentPlayer, isOver, computeWinner, goalText, wordString,
} from '../engine/rules';
import { GameConfig } from '../engine/types';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    game: 'append', k: 3, n: 6, repMode: 'square',
    humanRole: 'none', aiLevel: { R: 0, B: 0 }, seed: 1, ...over,
  };
}

describe('newGame / currentPlayer', () => {
  it('append starts empty with AVOIDER to move on even length', () => {
    const s = newGame(cfg());
    expect(s.word.length).toBe(0);
    expect(s.phase).toBe('move');
    expect(currentPlayer(s)).toBe('AVOIDER');
    expect(legalMoves(s).length).toBe(3); // k letters
  });
  it('online starts with FORCER pointing', () => {
    const s = newGame(cfg({ game: 'online' }));
    expect(s.phase).toBe('point');
    expect(currentPlayer(s)).toBe('FORCER');
    expect(legalMoves(s)).toEqual([0]); // only gap 0 in the empty word
  });
});

describe('append — alternation and terminal conditions', () => {
  it('alternates AVOIDER (even) / FORCER (odd)', () => {
    let s = newGame(cfg());
    expect(currentPlayer(s)).toBe('AVOIDER'); // len 0
    s = applyMove(s, 0);
    expect(currentPlayer(s)).toBe('FORCER'); // len 1
    s = applyMove(s, 1);
    expect(currentPlayer(s)).toBe('AVOIDER'); // len 2
  });
  it('FORCER wins the instant a square appears', () => {
    // a, b, a, b -> "abab" is a square (the 4th letter completes it).
    let s = newGame(cfg({ n: 8 }));
    s = applyMove(s, 0); // a (AVOIDER)
    s = applyMove(s, 1); // b (FORCER)
    s = applyMove(s, 0); // a (AVOIDER)
    s = applyMove(s, 1); // b (FORCER) -> "abab"
    expect(isOver(s)).toBe(true);
    expect(s.winner).toBe('FORCER');
    expect(s.witness).toBeDefined();
    expect(s.witness!.end).toBe(4);
    expect(s.witness!.period).toBe(2);
  });
  it('AVOIDER wins by reaching length n square-free', () => {
    // ternary square-free word of length 6: a b c a c b
    let s = newGame(cfg({ n: 6, k: 3 }));
    for (const c of [0, 1, 2, 0, 2, 1]) s = applyMove(s, c);
    expect(wordString(s.word)).toBe('abcacb');
    expect(isOver(s)).toBe(true);
    expect(s.winner).toBe('AVOIDER');
  });
  it('illegal moves return the same state object', () => {
    const s = newGame(cfg());
    expect(applyMove(s, 99)).toBe(s); // letter out of alphabet
    const lost = (() => {
      let t = newGame(cfg({ n: 8 }));
      for (const c of [0, 1, 0, 1]) t = applyMove(t, c); // FORCER already won
      return t;
    })();
    expect(applyMove(lost, 0)).toBe(lost);
  });
});

describe('online — point/insert flow', () => {
  it('FORCER points at a gap, then AVOIDER inserts there', () => {
    let s = newGame(cfg({ game: 'online', n: 4 }));
    expect(currentPlayer(s)).toBe('FORCER');
    s = applyMove(s, 0); // point at gap 0
    expect(s.phase).toBe('insert');
    expect(s.gap).toBe(0);
    expect(currentPlayer(s)).toBe('AVOIDER');
    s = applyMove(s, 0); // insert 'a' at gap 0
    expect(wordString(s.word)).toBe('a');
    expect(s.phase).toBe('point');
    expect(currentPlayer(s)).toBe('FORCER');
  });
  it('inserting between letters can create a square the FORCER targets', () => {
    // Word "ab" with letters; insert to make "abab"? Build "aa" via insertion: forcer can force aa.
    let s = newGame(cfg({ game: 'online', n: 4, k: 2 }));
    s = applyMove(s, 0); s = applyMove(s, 0);       // "a"
    s = applyMove(s, 1); s = applyMove(s, 0);       // insert 'a' at gap 1 -> "aa" square
    expect(s.winner).toBe('FORCER');
    expect(s.witness!.period).toBe(1);
  });
  it('legal gaps grow with the word length', () => {
    let s = newGame(cfg({ game: 'online', n: 6 }));
    s = applyMove(s, 0); s = applyMove(s, 0); // "a"
    expect(legalMoves(s)).toEqual([0, 1]); // gaps around 1 letter
  });
});

describe('computeWinner & goalText', () => {
  it('computeWinner is consistent with applyMove', () => {
    let s = newGame(cfg({ n: 8 }));
    for (const c of [0, 1, 0, 1]) s = applyMove(s, c);
    expect(computeWinner(s).winner).toBe('FORCER');
  });
  it('goalText mentions the repetition notion', () => {
    expect(goalText(cfg({ repMode: 'overlap' }))).toContain('overlap');
    expect(goalText(cfg({ repMode: 'abelian' }))).toContain('abelian');
  });
});
