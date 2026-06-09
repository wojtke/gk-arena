// Game rules for Thue Arena, ported from the Python ThueState. Pure engine, no DOM.
// Value convention everywhere: AVOIDER wins (+1) or FORCER wins (-1).

import {
  AVOIDER, FORCER, GameConfig, GameKind, GameState, Move, RepMode, Role, Witness,
} from './types';
import { repetitionWitness } from './detectors';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function letterChar(c: number): string {
  return c < 26 ? LETTERS[c] : `<${c}>`;
}

export function wordString(word: number[]): string {
  return word.map(letterChar).join('');
}

/** Initial empty state: online starts with FORCER pointing, append starts with AVOIDER moving. */
export function newGame(config: GameConfig): GameState {
  const phase: GameState['phase'] = config.game === 'online' ? 'point' : 'move';
  return { config, word: [], phase, gap: null };
}

/** Whose turn it is at this state (ignores terminality). */
export function currentPlayer(s: GameState): Role {
  if (s.config.game === 'append') {
    // AVOIDER moves on even length, FORCER on odd length.
    return s.word.length % 2 === 0 ? AVOIDER : FORCER;
  }
  return s.phase === 'point' ? FORCER : AVOIDER;
}

/** The forbidden-factor witness for the current word under the config's repetition mode. */
export function findRepetition(word: number[], mode: RepMode): Witness | null {
  return repetitionWitness(word, mode);
}

/** Compute the winner of a position from scratch (FORCER on any repetition, AVOIDER at length n). */
export function computeWinner(s: GameState): { winner?: Role; witness?: Witness } {
  const w = findRepetition(s.word, s.config.repMode);
  if (w) return { winner: FORCER, witness: w };
  if (s.word.length >= s.config.n) return { winner: AVOIDER };
  return {};
}

export function isOver(s: GameState): boolean {
  return !!s.winner;
}

/** Legal moves from a (non-terminal) state. */
export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  if (s.config.game === 'append') return range(s.config.k); // which letter to append
  if (s.phase === 'point') return range(s.word.length + 1); // which gap to point at
  return range(s.config.k); // which letter to insert
}

/** Apply a move, returning a fresh state. Returns the SAME state object if the move is illegal. */
export function applyMove(s: GameState, move: Move): GameState {
  if (s.winner) return s;
  const moves = legalMoves(s);
  if (!moves.includes(move)) return s;

  if (s.config.game === 'append') {
    return settle({ ...s, word: [...s.word, move], phase: 'move', gap: null });
  }
  if (s.phase === 'point') {
    // FORCER picks a gap; word unchanged, AVOIDER inserts next.
    return { ...s, phase: 'insert', gap: move };
  }
  // AVOIDER inserts letter `move` at the chosen gap.
  const g = s.gap ?? s.word.length;
  const word = [...s.word.slice(0, g), move, ...s.word.slice(g)];
  return settle({ ...s, word, phase: 'point', gap: null });
}

/** Attach winner/witness if the word just became terminal. */
function settle(s: GameState): GameState {
  const { winner, witness } = computeWinner(s);
  return winner ? { ...s, winner, witness } : s;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Human-facing goal sentence for the current config. */
export function goalText(c: GameConfig): string {
  const modeName: Record<RepMode, string> = {
    square: 'any square XX',
    nontrivial: 'a nontrivial repetition XX (|X| ≥ 2)',
    overlap: 'an overlap aXaXa',
    abelian: 'an abelian square XY (Y a rearrangement of X)',
  };
  const verb = c.game === 'append' ? 'append letters' : 'insert letters where Ben points';
  return `Ann (red) wants to ${verb} until length ${c.n} without ${modeName[c.repMode]}; Ben (blue) wins the instant one appears.`;
}

export const gameKindName = (g: GameKind): string =>
  g === 'append' ? 'Append (alternating)' : 'Thue online (insertion)';
