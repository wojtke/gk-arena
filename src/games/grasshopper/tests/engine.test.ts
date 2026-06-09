import { describe, it, expect } from 'vitest';
import {
  GameConfig, GameState, BUILDER, GRASSHOPPER,
  newGame, applyMove, legalMoves, currentPlayer, isOver, need,
  hasSquareSuffix, squareSuffixWitness, patternWitness,
} from '../engine';

function cfg(over: Partial<GameConfig> = {}): GameConfig {
  return {
    alpha: 3, d: 6, power: 2, humanRole: 'none', aiLevel: { B: 1, R: 1 }, seed: 1, ...over,
  };
}

/** Append `letters` (build phase) then return state ready for a hop. */
function build(s: GameState, letters: number[]): GameState {
  for (const c of letters) s = applyMove(s, c);
  return s;
}

describe('hasSquareSuffix / detect', () => {
  it('detects a square XX suffix (power 2)', () => {
    expect(hasSquareSuffix([0, 1, 0, 1], 2)).toBe(true); // abab ends with (ab)(ab)
    expect(hasSquareSuffix([0, 0], 2)).toBe(true);       // aa
    expect(hasSquareSuffix([0, 1, 0], 2)).toBe(false);   // aba — no square suffix
    expect(hasSquareSuffix([0, 1, 2], 2)).toBe(false);
  });

  it('only fires when the square is a SUFFIX', () => {
    // aab c: the square aa is NOT a suffix, so the suffix test is false.
    expect(hasSquareSuffix([0, 0, 1], 2)).toBe(false);
    // ...but the full-word witness still finds the embedded square.
    expect(patternWitness([0, 0, 1], 2)).not.toBeNull();
  });

  it('honours the power parameter (cube xxx)', () => {
    expect(hasSquareSuffix([0, 0], 3)).toBe(false);       // aa is not a cube
    expect(hasSquareSuffix([0, 0, 0], 3)).toBe(true);     // aaa is a cube
    expect(hasSquareSuffix([1, 0, 1, 0, 1, 0], 3)).toBe(true); // (10)^3
    const w = squareSuffixWitness([0, 0, 0], 3)!;
    expect(w).toEqual({ start: 0, end: 3, block: 1 });
  });

  it('prefers the smallest block', () => {
    const w = squareSuffixWitness([0, 1, 0, 1], 2)!; // could be (01)(01); smallest block is 2
    expect(w.block).toBe(2);
    const w2 = squareSuffixWitness([2, 0, 0], 2)!; // aa with block 1
    expect(w2).toEqual({ start: 1, end: 3, block: 1 });
  });
});

describe('need / needLeft accounting (1 vs 2)', () => {
  it('starts owing 2 letters (p=-1, |W|=0)', () => {
    const s = newGame(cfg());
    expect(s.pos).toBe(-1);
    expect(s.inspected).toEqual([]);
    expect(s.phase).toBe('build');
    expect(s.needLeft).toBe(2);
    expect(need(s)).toBe(2);
  });

  it('counts down 2,1,0 then switches to hop', () => {
    let s = newGame(cfg());
    expect(currentPlayer(s)).toBe(BUILDER);
    s = applyMove(s, 0);
    expect(s.needLeft).toBe(1);
    expect(s.phase).toBe('build');
    s = applyMove(s, 1);
    expect(s.needLeft).toBe(0);
    expect(s.phase).toBe('hop');
    expect(currentPlayer(s)).toBe(GRASSHOPPER);
    expect(legalMoves(s)).toEqual([1, 2]);
  });

  it('owes 1 after a +1 hop, 2 after a +2 hop', () => {
    // Build [a,b], hop +1 → p=0, |W|=2 → need = 0+3-2 = 1.
    let s = build(newGame(cfg()), [0, 1]);
    const after1 = applyMove(s, 1);
    expect(after1.pos).toBe(0);
    expect(after1.needLeft).toBe(1);
    expect(after1.phase).toBe('build');

    // From the same hop point, hop +2 → p=1, |W|=2 → need = 1+3-2 = 2.
    const after2 = applyMove(s, 2);
    expect(after2.pos).toBe(1);
    expect(after2.needLeft).toBe(2);
    expect(after2.phase).toBe('build');
  });
});

describe('hop +1/+2 updates pos and S', () => {
  it('+1 lands on p+1 and appends W[p+1] to S', () => {
    let s = build(newGame(cfg()), [0, 1]); // W=[a,b], p=-1
    s = applyMove(s, 1);                    // hop +1 → land on index 0 = a
    expect(s.pos).toBe(0);
    expect(s.inspected).toEqual([0]);
  });

  it('+2 lands on p+2 and appends W[p+2] to S', () => {
    let s = build(newGame(cfg()), [0, 1]); // W=[a,b], p=-1
    s = applyMove(s, 2);                    // hop +2 → land on index 1 = b
    expect(s.pos).toBe(1);
    expect(s.inspected).toEqual([1]);
  });
});

describe('forward-only: a +2-bypassed letter is never landed again', () => {
  it('a bypassed letter is gone; an un-reached lookahead letter is landable next round', () => {
    // Round 1: W=[a,b], hop +2 lands on b (index 1); index 0 (a) is now BEHIND p forever.
    let s = build(newGame(cfg()), [0, 1]);
    s = applyMove(s, 2); // p=1, S=[b]; index 0 bypassed
    expect(s.pos).toBe(1);
    expect(s.inspected).toEqual([1]);

    // Round 2 (need=2): build two letters, then a +1 hop lands on the FIRST committed lookahead
    // letter (old un-reached index 2). The bypassed index 0 can never be revisited (forward-only).
    s = build(s, [2, 0]); // W=[a,b,c,a]; lookahead tail before hop = [c,a] (indices 2,3)
    expect(s.phase).toBe('hop');
    const next1 = applyMove(s, 1); // +1 → land on index 2 = c (the un-reached lookahead letter)
    expect(next1.pos).toBe(2);
    expect(next1.inspected).toEqual([1, 2]); // [b, c]; the bypassed a (index 0) never reappears
    expect(next1.inspected).not.toContain(0 === next1.word[0] ? next1.word[0] : -999);

    // pos only ever increases — confirms forward-only motion.
    expect(next1.pos).toBeGreaterThan(s.pos);
  });

  it('after +1 the previously un-reached p+2 letter becomes the new landable p+1', () => {
    // W=[a,b], hop +1 lands on a (index 0); index 1 (b) is still un-reached and committed.
    let s = build(newGame(cfg()), [0, 1]);
    s = applyMove(s, 1); // p=0, S=[a]; b (index 1) is the still-landable lookahead
    expect(s.needLeft).toBe(1);
    s = applyMove(s, 2); // build 1 letter → W=[a,b,c]; phase hop
    expect(s.phase).toBe('hop');
    // +1 now lands on index 1 = b (the old un-reached p+2, now p+1).
    const h = applyMove(s, 1);
    expect(h.pos).toBe(1);
    expect(h.inspected).toEqual([0, 1]); // [a, b]
  });
});

describe('terminal conditions (avoidance form)', () => {
  it('Builder (avoider) wins when |S| reaches d square-free', () => {
    // Use d=2, alpha large so we can keep S clean. Build ab, hop +1 (a), build, hop to a different
    // letter so S has no square — the Builder survives to length d.
    let s = newGame(cfg({ d: 2, alpha: 3 }));
    s = build(s, [0, 1]);   // W=[a,b]
    s = applyMove(s, 1);    // +1 → S=[a], p=0, need=1
    expect(isOver(s)).toBe(false);
    s = build(s, [1]);      // W=[a,b,b]; hop phase, lookahead [b]
    s = applyMove(s, 1);    // +1 → land on index 1 = b → S=[a,b], length 2 = d, no square
    expect(isOver(s)).toBe(true);
    expect(s.winner).toBe(BUILDER);
    expect(hasSquareSuffix(s.inspected, 2)).toBe(false);
  });

  it('Grasshopper (forcer) wins the instant S ends with a square', () => {
    // d large so the game does not end by length first. Force S = [a,a].
    let s = newGame(cfg({ d: 6, alpha: 1 })); // alpha 1: every letter is a → any 2 hops make aa
    s = build(s, [0, 0]);   // W=[a,a]
    s = applyMove(s, 1);    // +1 → S=[a], p=0, need=1
    expect(isOver(s)).toBe(false);
    s = build(s, [0]);      // W=[a,a,a]
    s = applyMove(s, 1);    // +1 → land on a → S=[a,a] → square suffix
    expect(isOver(s)).toBe(true);
    expect(s.winner).toBe(GRASSHOPPER);
    expect(s.witness).toBeDefined();
    expect(hasSquareSuffix(s.inspected, 2)).toBe(true);
  });

  it('illegal moves return the same state object', () => {
    const s = newGame(cfg());
    expect(applyMove(s, 99)).toBe(s);       // letter out of alphabet in build
    const hop = build(s, [0, 1]);
    expect(applyMove(hop, 0)).toBe(hop);    // step 0 illegal in hop
    expect(applyMove(hop, 3)).toBe(hop);    // step 3 illegal in hop
  });
});
