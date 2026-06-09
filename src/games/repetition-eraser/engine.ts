// Repetition Eraser engine.
// Players alternately append a letter. After each append, every square (XX) that ends at the new
// last position is erased — its second half deleted — repeated until the suffix is square-free
// (one append can create nested squares). Red = Grower (wants length d); Blue = Shrinker (wants the
// round limit to run out first). Red moves first.

export type Color = 'R' | 'B';
export const GROWER: Color = 'R';
export const SHRINKER: Color = 'B';
export type AILevel = 0 | 1 | 2 | 3;

/**
 * Which suffix square is erased after an append.
 * - 'shortest' (default): erase the second half of the *shortest* square ending at the last letter.
 * - 'longest': erase the second half of the *longest* square ending at the last letter.
 * Either way we repeat until the suffix is square-free.
 */
export type EraseRule = 'shortest' | 'longest';
export const DEFAULT_RULE: EraseRule = 'shortest';

export interface GameConfig {
  k: number;        // alphabet size
  d: number;        // target length (Grower wins on reaching it)
  rounds: number;   // total moves before the Shrinker wins
  rule: EraseRule;  // erasure rule: shortest (default) or longest suffix square
  humanRole: Color | 'both' | 'none';
  aiLevel: Record<Color, AILevel>;
  seed: number;
}

export interface GameState {
  config: GameConfig;
  word: number[];
  turn: Color;
  round: number;
  winner?: Color;
  /** how many letters the previous move erased (for the UI animation) */
  lastErased: number;
}

/**
 * Half-length of the suffix square to erase from `w`, per `rule`, or -1 if the suffix is square-free.
 * A suffix square of half-length `h` means w[n-2h … n-h) === w[n-h … n).
 */
function suffixSquareHalf(w: number[], rule: EraseRule): number {
  const n = w.length;
  let pick = -1;
  for (let half = 1; half * 2 <= n; half++) {
    let eq = true;
    for (let t = 0; t < half; t++) {
      if (w[n - 2 * half + t] !== w[n - half + t]) { eq = false; break; }
    }
    if (eq) {
      if (rule === 'shortest') return half; // smallest half-length = shortest square
      pick = half;                          // keep going; last one found = longest square
    }
  }
  return pick;
}

/**
 * Append `letter`, then erase the second half of the suffix square chosen by `rule` (shortest by
 * default, or longest), repeating until none remains. Returns the new word and how many letters were
 * erased in total. Relies on the invariant that the word is square-free before the append.
 */
export function appendAndErase(
  word: number[],
  letter: number,
  rule: EraseRule = DEFAULT_RULE,
): { word: number[]; erased: number } {
  const w = word.slice();
  w.push(letter);
  let erased = 0;
  for (;;) {
    const h = suffixSquareHalf(w, rule);
    if (h < 0) break;
    w.length = w.length - h; // delete the repeated (second) block
    erased += h;
  }
  return { word: w, erased };
}

export function newGame(config: GameConfig): GameState {
  return { config, word: [], turn: GROWER, round: 0, lastErased: 0 };
}

export function legalMoves(s: GameState): number[] {
  return s.winner ? [] : Array.from({ length: s.config.k }, (_, i) => i);
}

export function applyMove(s: GameState, letter: number): GameState {
  if (s.winner || letter < 0 || letter >= s.config.k) return s;
  const { word, erased } = appendAndErase(s.word, letter, s.config.rule);
  const next: GameState = {
    ...s,
    word,
    turn: s.turn === GROWER ? SHRINKER : GROWER,
    round: s.round + 1,
    lastErased: erased,
  };
  if (word.length >= s.config.d) next.winner = GROWER;
  else if (next.round >= s.config.rounds) next.winner = SHRINKER;
  return next;
}

export function isOver(s: GameState): boolean {
  return !!s.winner;
}

export function goalText(c: GameConfig): string {
  return `Red grows the word to ${c.d}; Blue keeps it short for ${c.rounds} moves.`;
}
