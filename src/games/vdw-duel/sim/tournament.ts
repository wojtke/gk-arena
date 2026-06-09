// Headless AI-vs-AI experiment for VdW Duel: with optimal play at k=3, does the FIRST player (Red)
// or the SECOND player (Blue) win? The misère insertion tree is small enough (≤9 plies) that the
// exact solver settles it. Pure module — run the table via `npx tsx`.

import {
  AILevel, GameConfig, Owner, RED,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer, defaultMaxLen,
} from '../engine';

export interface SimConfig {
  k: number;
  redLevel: AILevel;
  blueLevel: AILevel;
}

export interface GameOutcome {
  /** The player who completed their own AP and lost. */
  loser: Owner;
  /** The winner (the other player). */
  winner: Owner;
  /** Number of tokens placed before the game ended. */
  length: number;
}

export function playGame(sim: SimConfig, seed: number): GameOutcome {
  const config: GameConfig = {
    k: sim.k,
    maxLen: defaultMaxLen(sim.k),
    humanRole: 'none',
    aiLevel: { R: sim.redLevel, B: sim.blueLevel },
    seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  let guard = 0;
  while (!isOver(s) && guard++ < 10000) {
    s = applyMove(s, aiMove(s, config.aiLevel[currentPlayer(s)], rnd));
  }
  // By W(2;k) someone has always lost; if the (unreachable) cap is somehow hit, call it a Red win.
  const loser: Owner = s.loser ?? 'B';
  return { loser, winner: loser === 'R' ? 'B' : 'R', length: s.line.length };
}

export interface SimResult extends SimConfig {
  games: number;
  /** Fraction of games the FIRST player (Red) won. */
  redWinRate: number;
  avgLength: number;
}

export function tournament(sim: SimConfig, games = 100, seed0 = 1): SimResult {
  let redWins = 0;
  let totalLength = 0;
  for (let g = 0; g < games; g++) {
    const o = playGame(sim, seed0 + g * 7919);
    if (o.winner === RED) redWins++;
    totalLength += o.length;
  }
  return { ...sim, games, redWinRate: redWins / games, avgLength: totalLength / games };
}

/**
 * The headline result: with the EXACT solver on both sides at k=3, who wins from the empty line?
 * Returns 'R' or 'B'. Deterministic up to tie-breaking; the verdict (winner) is stable.
 */
export function firstPlayerOutcome(k = 3): { winner: Owner; redWinRate: number } {
  const r = tournament({ k, redLevel: 3, blueLevel: 3 }, 40);
  return { winner: r.redWinRate >= 0.5 ? 'R' : 'B', redWinRate: r.redWinRate };
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('VdW Duel — first-vs-second-player outcome (exact solver both sides):');
  for (const k of [3]) {
    const o = firstPlayerOutcome(k);
    log(`  k=${k}: winner = ${o.winner === 'R' ? 'Red (first)' : 'Blue (second)'}  (Red win-rate ${o.redWinRate.toFixed(2)})`);
  }
  log('Greedy-vs-greedy Red win-rate by k:');
  for (const k of [3, 4]) {
    const r = tournament({ k, redLevel: 1, blueLevel: 1 }, 100);
    log(`  k=${k}: ${r.redWinRate.toFixed(2)}  (avg length ${r.avgLength.toFixed(1)})`);
  }
}

const proc = (globalThis as { process?: { argv?: string[] } }).process;
if (proc?.argv?.[1] && import.meta.url.endsWith(proc.argv[1].split('/').pop() ?? '\0')) {
  runDemo();
}
