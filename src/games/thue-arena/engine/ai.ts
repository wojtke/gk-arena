// AI opponents (four levels), ported from the Python POC:
//   0 random · 1 greedy (1-ply, counting safe replies) · 2 depth-limited minimax with heuristic
//   3 exact memoised solver on small instances (falls back to level 2 when the tree is too big)
//
// Value convention: +1 = AVOIDER wins, -1 = FORCER wins (so AVOIDER maximises, FORCER minimises).

import { AVOIDER, FORCER, GameState, Move, RepMode } from './types';
import { applyMove, currentPlayer, legalMoves, letterChar } from './rules';

import { makeRng } from '../../../common/rng';
export { makeRng };

const WIN_AVOIDER = 1;
const WIN_FORCER = -1;

/** Pick one element of `arr` at random using `rnd`. */
function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

// --------------------------------------------------------------------------- //
// terminal value & heuristic                                                  //
// --------------------------------------------------------------------------- //

/** Exact value of a terminal state, or null if non-terminal. */
function terminalValue(s: GameState): number | null {
  if (s.winner === AVOIDER) return WIN_AVOIDER;
  if (s.winner === FORCER) return WIN_FORCER;
  return null;
}

/** Rough value in [-1, 1] from AVOIDER's view: more progress toward target n is better. */
function heuristic(s: GameState): number {
  const t = terminalValue(s);
  if (t !== null) return t;
  return (s.word.length / s.config.n) * 2 - 1; // 0 letters -> -1, full -> +1
}

// --------------------------------------------------------------------------- //
// depth-limited minimax with alpha-beta (level 2)                              //
// --------------------------------------------------------------------------- //

function minimax(s: GameState, depth: number, alpha: number, beta: number): number {
  const t = terminalValue(s);
  if (t !== null) return t;
  if (depth === 0) return heuristic(s);
  const me = currentPlayer(s);
  const moves = legalMoves(s);
  if (me === AVOIDER) {
    let best = -2;
    for (const m of moves) {
      best = Math.max(best, minimax(applyMove(s, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = 2;
  for (const m of moves) {
    best = Math.min(best, minimax(applyMove(s, m), depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

// --------------------------------------------------------------------------- //
// exact memoised solver (level 3)                                             //
// --------------------------------------------------------------------------- //

function stateKey(s: GameState): string {
  return `${s.word.join(',')}|${s.phase}|${s.gap ?? -1}`;
}

/** Exact value under optimal play (+1 AVOIDER / -1 FORCER), memoised. */
export function solve(s: GameState, cache: Map<string, number> = new Map()): number {
  const t = terminalValue(s);
  if (t !== null) return t;
  const key = stateKey(s);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const me = currentPlayer(s);
  let val = me === AVOIDER ? -2 : 2;
  for (const m of legalMoves(s)) {
    const v = solve(applyMove(s, m), cache);
    if (me === AVOIDER) {
      if (v > val) val = v;
      if (val === WIN_AVOIDER) break; // short-circuit: best possible
    } else {
      if (v < val) val = v;
      if (val === WIN_FORCER) break;
    }
  }
  cache.set(key, val);
  return val;
}

/**
 * Rough size of the remaining game tree, to decide whether the exact solver is feasible.
 * Each AVOIDER ply branches k ways; each FORCER ply branches k (append) or up to len+1 (online).
 * We cap the estimate quickly so this stays cheap.
 */
function treeTooBig(s: GameState): boolean {
  const remaining = s.config.n - s.word.length;
  if (remaining <= 0) return false;
  const k = s.config.k;
  // online point-phase adds a per-round forcer branching of about current length.
  const forcerBranch = s.config.game === 'online' ? Math.max(2, s.config.n) : k;
  // plies left ~ remaining letters (append) or 2*remaining (online: point+insert).
  const plies = s.config.game === 'online' ? remaining * 2 : remaining;
  let estimate = 1;
  for (let i = 0; i < plies; i++) {
    estimate *= i % 2 === 0 ? k : forcerBranch; // crude alternation
    if (estimate > 400_000) return true;
  }
  return false;
}

// --------------------------------------------------------------------------- //
// greedy (level 1)                                                            //
// --------------------------------------------------------------------------- //

/** Count of the opponent replies that keep `me` alive after `child` (AVOIDER likes many). */
function safeReplyScore(child: GameState, me: typeof AVOIDER | typeof FORCER): number {
  if (child.winner) return 0;
  const opp = me === AVOIDER ? FORCER : AVOIDER;
  let safe = 0;
  for (const m of legalMoves(child)) {
    if (applyMove(child, m).winner !== opp) safe++;
  }
  return me === AVOIDER ? safe : -safe;
}

function greedyMove(s: GameState, rnd: () => number): Move {
  const me = currentPlayer(s);
  let best: number | null = null;
  let bestMoves: Move[] = [];
  for (const m of legalMoves(s)) {
    const child = applyMove(s, m);
    if (child.winner === me) return m; // immediate win
    let score = safeReplyScore(child, me);
    if (child.winner && child.winner !== me) score = -1e9; // immediate loss: avoid
    if (best === null || score > best) { best = score; bestMoves = [m]; }
    else if (score === best) bestMoves.push(m);
  }
  return bestMoves.length ? pick(bestMoves, rnd) : legalMoves(s)[0];
}

// --------------------------------------------------------------------------- //
// explicit proven AVOIDER strategy (Grytczuk–Kosiński–Zmarz, "How to play Thue games", 2015)  //
// --------------------------------------------------------------------------- //
//
// Theorem 2 of the paper gives Ann a *finite-description* winning strategy for the append
// non-repetitive game over a 9-letter alphabet: she avoids every NONTRIVIAL repetition (|X| >= 2)
// for any length, against any forcer. We implement it verbatim and route Level 3 (the avoider side)
// to it whenever the exact solver's game tree is too big — so L3 is a tier that *provably* never
// loses for Ann, not a heuristic that merely usually wins.
//
// Construction: A = {0,1,2}; the 9 letters are pairs (c1, c2) in A x A, encoded as 3*c1 + c2.
// Ann plays two independent coordinate strategies:
//   coord1 (Lemma 5, kills EVEN repetitions): her m-th move is t[m], where t is a fixed
//           square-free ternary word (the morphism a->abc, b->ac, c->b fixed point).
//   coord2 (Lemma 6 / Algorithm 1, kills ODD repetitions): keep a "favourite" f (init 0) and Ben's
//           last letter y (init 1); on each move read Ben's last coord2 letter x; if x === f set
//           f = 3 - x - y; play f; set y = x. (Ann's very first move has no x to read; she plays 0.)
// Because nontrivial = even OR odd, neutralising both kills every nontrivial repetition.

/** A fixed square-free ternary word over {0,1,2} (morphism a->abc, b->ac, c->b), long enough. */
function squareFreeTernary(len: number): number[] {
  const morph: number[][] = [[0, 1, 2], [0, 2], [1]];
  let s = [0];
  while (s.length < len) {
    const next: number[] = [];
    for (const x of s) next.push(...morph[x]);
    s = next;
  }
  return s.slice(0, len);
}

// Lazily grown cache of the square-free ternary word used by coord1.
let ternaryWord: number[] = squareFreeTernary(64);
function ternaryAt(i: number): number {
  if (i >= ternaryWord.length) ternaryWord = squareFreeTernary(Math.max(i + 1, ternaryWord.length * 2));
  return ternaryWord[i];
}

const decodePair = (L: number): [number, number] => [Math.floor(L / 3), L % 3];
const encodePair = (c1: number, c2: number): number => 3 * c1 + c2;

/** True iff this state is one where the explicit 9-letter avoider strategy applies and it is Ann's turn. */
export function explicitAvoiderApplies(s: GameState): boolean {
  return (
    s.config.game === 'append' &&
    s.config.repMode === 'nontrivial' &&
    s.config.k >= 9 &&
    !s.winner &&
    currentPlayer(s) === AVOIDER
  );
}

/**
 * Ann's explicit, provably-correct 9-letter move for the append nontrivial game (Theorem 2).
 * Reconstructs the two coordinate strategies from the word so far (Ann at even indices, Ben at odd).
 */
export function explicitAvoiderMove(s: GameState): Move {
  const word = s.word;
  const L = word.length; // next position; even (Ann moves on even length in the append game)
  const c1 = ternaryAt(L / 2); // coord1: Ann's (L/2)-th move plays t[L/2]

  // coord2: replay Algorithm 1 over Ann's past moves to recover (f, y), then apply once more.
  const coord2 = word.map((w) => decodePair(w)[1]);
  let f = 0;
  let y = 1;
  for (let pos = 2; pos < L; pos += 2) { // pos 0 is Ann's first move (no opponent letter to read)
    const x = coord2[pos - 1]; // Ben's letter immediately before this Ann move
    if (x === f) f = 3 - x - y;
    y = x;
  }
  if (L !== 0) {
    const x = coord2[L - 1];
    if (x === f) f = 3 - x - y;
  }
  return encodePair(c1, f);
}

// --------------------------------------------------------------------------- //
// per-level move selection                                                    //
// --------------------------------------------------------------------------- //

function minimaxMove(s: GameState, rnd: () => number, depth = 6): Move {
  const me = currentPlayer(s);
  let best = me === AVOIDER ? -Infinity : Infinity;
  let bestMoves: Move[] = [];
  for (const m of legalMoves(s)) {
    const v = minimax(applyMove(s, m), depth - 1, -2, 2);
    if (me === AVOIDER ? v > best : v < best) { best = v; bestMoves = [m]; }
    else if (v === best) bestMoves.push(m);
  }
  return bestMoves.length ? pick(bestMoves, rnd) : legalMoves(s)[0];
}

function solverMove(s: GameState, rnd: () => number): Move {
  // Proven tier: Ann's explicit 9-letter strategy wins the append nontrivial game at any length, so
  // prefer it over the exact solver / heuristic fallback whenever it applies (Theorem 2).
  if (explicitAvoiderApplies(s)) return explicitAvoiderMove(s);
  if (treeTooBig(s)) return minimaxMove(s, rnd, 6); // fall back to level 2
  const me = currentPlayer(s);
  const target = me === AVOIDER ? WIN_AVOIDER : WIN_FORCER;
  const cache = new Map<string, number>();
  const scored: { v: number; m: Move }[] = legalMoves(s).map((m) => ({
    v: solve(applyMove(s, m), cache), m,
  }));
  const winning = scored.filter((x) => x.v === target).map((x) => x.m);
  if (winning.length) return pick(winning, rnd);
  // losing anyway: keep playing (greedy among the rest to prolong / pose problems).
  return greedyMove(s, rnd);
}

/** Choose a move for the player to move under the given AI level. Always legal. */
export function aiMove(s: GameState, level: 0 | 1 | 2 | 3, rnd: () => number): Move {
  const moves = legalMoves(s);
  if (moves.length === 0) return 0;
  switch (level) {
    case 1: return greedyMove(s, rnd);
    case 2: return minimaxMove(s, rnd, 6);
    case 3: return solverMove(s, rnd);
    default: return pick(moves, rnd); // 0: random
  }
}

// --------------------------------------------------------------------------- //
// explanation (teaching feature)                                              //
// --------------------------------------------------------------------------- //

export interface Explanation {
  move: Move;
  text: string;
}

/**
 * A human-readable recommendation for the player to move, naming the repetition the move
 * creates or averts. Used by Hint and by the AI-side explanation overlay.
 *
 * `level` selects the strategy used to choose the recommended move; when used as the AI-side
 * overlay it should match the side's configured AI level (and share the persistent RNG) so the
 * named move is exactly the one the AI is about to play. An explicit `forcedMove` overrides the
 * choice entirely, so the overlay can describe the precise move the AI already committed to.
 */
export function explainMove(
  s: GameState,
  rnd: () => number,
  level: 0 | 1 | 2 | 3 = 3,
  forcedMove?: Move,
): Explanation | null {
  if (s.winner) return null;
  const me = currentPlayer(s);
  const move = forcedMove ?? aiMove(s, level, rnd);
  const child = applyMove(s, move);

  // online point phase: FORCER is choosing where to strike.
  if (s.config.game === 'online' && s.phase === 'point') {
    return {
      move,
      text: `Ben (forcer) should point at gap ${move} — the position that most pressures Ann.`,
    };
  }

  const letter = letterChar(move);
  if (me === FORCER && child.winner === FORCER && child.witness) {
    const blk = describeWitness(child, child.witness);
    return { move, text: `Ben plays "${letter}" — it completes ${blk}, so Ann loses.` };
  }
  if (me === AVOIDER) {
    const moves = legalMoves(s);
    const danger = new Set(dangerLetters(s));
    // Lost position: every legal letter completes a forbidden repetition.
    if (danger.size === moves.length) {
      return {
        move,
        text: `Ann has no safe move — every letter completes a forbidden repetition, so she is lost. "${letterChar(move)}" only delays it.`,
      };
    }
    // A safe move exists. For Hint (no forced move) recommend a safe letter even if a weak level
    // picked a losing one; for the AI overlay (forcedMove) describe the move that will actually
    // be played, honestly, even when it walks into a loss.
    const rec = forcedMove === undefined && danger.has(move)
      ? moves.find((m) => !danger.has(m))!
      : move;
    const recChar = letterChar(rec);
    if (danger.has(rec)) {
      // The committed move loses although a safe move existed.
      const safe = moves.filter((m) => !danger.has(m)).map(letterChar).map((c) => `"${c}"`);
      return {
        move: rec,
        text: `Ann plays "${recChar}" — it completes a forbidden repetition and loses; ${safe.join(', ')} would have stayed safe.`,
      };
    }
    // Never list the recommended letter in the "avoid" set (it is a safe move here).
    const avoid = [...danger].filter((d) => d !== rec);
    const safetyNote = avoid.length
      ? ` Avoid ${avoid.map(letterChar).map((c) => `"${c}"`).join(', ')} — ${avoid.length === 1 ? 'it makes' : 'they each make'} a forbidden repetition.`
      : '';
    return { move: rec, text: `Ann should play "${recChar}" to stay repetition-free.${safetyNote}` };
  }
  return { move, text: `Recommended move: "${letter}".` };
}

/** Letters that would lose immediately for the AVOIDER from this state (append/insert phase). */
function dangerLetters(s: GameState): number[] {
  const bad: number[] = [];
  for (const m of legalMoves(s)) {
    if (applyMove(s, m).winner === FORCER) bad.push(m);
  }
  return bad;
}

function describeWitness(s: GameState, w: { start: number; end: number; period: number }): string {
  const factor = s.word.slice(w.start, w.end).map(letterChar).join('');
  const block = s.word.slice(w.start, w.start + w.period).map(letterChar).join('');
  const kindByMode: Record<RepMode, string> = {
    square: `the square ${block}${block}`,
    nontrivial: `the repetition ${block}${block}`,
    overlap: `the overlap ${factor}`,
    abelian: `the abelian square ${factor}`,
  };
  return kindByMode[s.config.repMode];
}
