// Game rules for VdW Online (general per-colour form). POINTER points at a gap (point phase); PAINTER
// colours a token (paint phase). POINTER wins the instant some colour i holds a k[i]-AP; PAINTER wins
// on reaching length n. The diagonal case is all k[i] equal. Pure engine: no DOM.

import { GameConfig, GameState, Move, PAINTER, POINTER, Role } from './types';
import { findWitness } from './detect';

/** Default per-colour target vector for r colours: the off-diagonal point is [3, 4] for r=2. */
export function defaultK(r: number): number[] {
  if (r === 2) return [3, 4];
  if (r === 3) return [3, 3, 4];
  return Array.from({ length: r }, () => 3);
}

export function newGame(config: GameConfig): GameState {
  return { config, line: [], phase: 'point', gap: null, winner: null, witness: null };
}

/** Whose turn it is: POINTER points, PAINTER colours. */
export function currentPlayer(s: GameState): Role {
  return s.phase === 'point' ? POINTER : PAINTER;
}

/** Legal moves. Point phase: every gap 0..len. Paint phase: every colour 0..r-1. */
export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  const out: Move[] = [];
  if (s.phase === 'point') {
    for (let g = 0; g <= s.line.length; g++) out.push(g);
  } else {
    for (let c = 0; c < s.config.r; c++) out.push(c);
  }
  return out;
}

/** Terminal verdict for a coloured line: POINTER if a k[i]-AP exists, PAINTER if length n reached. */
function evaluate(line: number[], config: GameConfig): Pick<GameState, 'winner' | 'witness'> {
  const w = findWitness(line, config.k);
  if (w) return { winner: POINTER, witness: w };
  if (line.length >= config.n) return { winner: PAINTER, witness: null };
  return { winner: null, witness: null };
}

export function applyMove(s: GameState, move: Move): GameState {
  if (s.winner) return s;
  if (!legalMoves(s).includes(move)) return s;

  if (s.phase === 'point') {
    return { ...s, phase: 'paint', gap: move };
  }

  // paint phase: insert the chosen colour at the pointed gap (indices to the right shift up by 1)
  const g = s.gap ?? s.line.length;
  const line = [...s.line.slice(0, g), move, ...s.line.slice(g)];
  const { winner, witness } = evaluate(line, s.config);
  return { ...s, line, phase: 'point', gap: null, winner, witness };
}

export function isOver(s: GameState): boolean {
  return s.winner !== null;
}

/** True iff every colour shares one target length (the diagonal / scalar case). */
export function isDiagonal(k: readonly number[]): boolean {
  return k.every(ki => ki === k[0]);
}

export function goalText(c: GameConfig): string {
  if (isDiagonal(c.k)) {
    return `Pointer wants a monochromatic ${c.k[0]}-term progression; Painter (avoider) wants to reach length ${c.n} using ${c.r} colours.`;
  }
  const targets = c.k.map((ki, i) => `colour ${i + 1}→${ki}`).join(', ');
  return `Pointer forces any one colour's AP (${targets}); Painter survives to length ${c.n}.`;
}
