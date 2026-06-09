// Headless AI-vs-AI experiments: AVOIDER win-rate vs (alphabet k, target n), and the repetition
// THRESHOLD — the smallest alphabet k where the AVOIDER wins under optimal play (the exact solver).
// This reproduces the classic Thue phenomenon: too few letters and the FORCER always wins.
// Run via `npx tsx src/sim/tournament.ts` (or import the functions in tests).

import {
  AILevel, GameConfig, GameKind, RepMode, Role, AVOIDER,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer, solve,
} from '../engine';

export interface SimConfig {
  game: GameKind;
  k: number;
  n: number;
  repMode: RepMode;
  avoiderLevel: AILevel;
  forcerLevel: AILevel;
}

function configFor(sim: SimConfig, seed: number): GameConfig {
  return {
    game: sim.game, k: sim.k, n: sim.n, repMode: sim.repMode,
    humanRole: 'none',
    aiLevel: { R: sim.avoiderLevel, B: sim.forcerLevel },
    seed,
  };
}

/** Play one full AI-vs-AI game; returns the winner. Always terminates. */
export function playGame(sim: SimConfig, seed: number): Role {
  const rnd = makeRng(seed);
  let s = newGame(configFor(sim, seed));
  while (!isOver(s)) {
    const me = currentPlayer(s);
    const level = me === AVOIDER ? sim.avoiderLevel : sim.forcerLevel;
    s = applyMove(s, aiMove(s, level, rnd));
  }
  return s.winner!;
}

export interface SimResult extends SimConfig {
  games: number;
  avoiderWins: number;
  avoiderRate: number;
}

export function tournament(sim: SimConfig, games = 200, seed0 = 1): SimResult {
  let avoiderWins = 0;
  for (let g = 0; g < games; g++) {
    if (playGame(sim, seed0 + g * 7919) === AVOIDER) avoiderWins++;
  }
  return { ...sim, games, avoiderWins, avoiderRate: avoiderWins / games };
}

/** Exact optimal winner of a fresh (k, n) instance via the solver. */
export function optimalWinner(game: GameKind, k: number, n: number, repMode: RepMode): Role {
  const cfg: GameConfig = {
    game, k, n, repMode, humanRole: 'none', aiLevel: { R: 3, B: 3 }, seed: 1,
  };
  return solve(newGame(cfg)) === 1 ? 'AVOIDER' : 'FORCER';
}

/** Smallest alphabet size k in [kmin, kmax] where the AVOIDER wins under optimal play, or -1. */
export function avoiderThreshold(
  game: GameKind, n: number, repMode: RepMode, kmin = 2, kmax = 5,
): number {
  for (let k = kmin; k <= kmax; k++) {
    if (optimalWinner(game, k, n, repMode) === 'AVOIDER') return k;
  }
  return -1;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Thue Arena — AVOIDER win-rate (greedy vs greedy), online game, square mode:');
  for (const k of [2, 3, 4]) {
    const row = [4, 6, 8, 10].map((n) => {
      const r = tournament(
        { game: 'online', k, n, repMode: 'square', avoiderLevel: 1, forcerLevel: 1 }, 120,
      );
      return `n=${n}:${r.avoiderRate.toFixed(2)}`;
    });
    log(`  k=${k}: ${row.join('  ')}`);
  }

  log('Exact optimal winner (online, square) — too few letters and the FORCER always wins:');
  for (const n of [4, 5, 6]) {
    const row = [2, 3, 4, 5].map((k) => `k=${k}:${optimalWinner('online', k, n, 'square')[0]}`);
    log(`  n=${n}: ${row.join('  ')}`);
  }

  log('Smallest alphabet where AVOIDER wins (online, square), by target n:');
  for (const n of [4, 5, 6]) {
    log(`  n=${n}: k* = ${avoiderThreshold('online', n, 'square', 2, 6)}`);
  }

  log('Append, square — note: the second-moving FORCER always forces a square (k irrelevant):');
  for (const n of [4, 6, 8]) {
    const row = [2, 3, 4].map((k) => `k=${k}:${optimalWinner('append', k, n, 'square')[0]}`);
    log(`  n=${n}: ${row.join('  ')}`);
  }
}

// Run the demo by importing and calling runDemo() (e.g. `npx tsx -e "import('./src/sim/tournament')
// .then(m => m.runDemo())"`). No top-level side effects, so tests can import this module cleanly.
