// Headless AI-vs-AI experiments for Different Blocks: how long can the AVOIDER survive vs alphabet
// size |A| and block count k? Produces survivable-n threshold tables — the experimental contribution
// flagged in the design (no published threshold table for this online forcing game). Pure; run via tsx.

import {
  AILevel, AVOIDER, GameConfig, Role,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer, minAlpha,
} from '../engine';

export interface SimConfig {
  alpha: number;   // alphabet size |A|
  k: number;       // block count
  n: number;       // target length
  avoiderLevel: AILevel;
  constructorLevel: AILevel;
}

export interface GameOutcome {
  winner: Role;
  /** Final word length reached (= how long the AVOIDER survived). */
  length: number;
}

export function playGame(sim: SimConfig, seed: number): GameOutcome {
  const config: GameConfig = {
    alpha: Math.max(sim.alpha, minAlpha(sim.k)), k: sim.k, n: sim.n,
    humanRole: 'none', aiLevel: { A: sim.avoiderLevel, C: sim.constructorLevel }, seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  let guard = 0;
  while (!isOver(s) && guard++ < 10000) {
    s = applyMove(s, aiMove(s, config.aiLevel[currentPlayer(s)], rnd));
  }
  return { winner: s.winner ?? AVOIDER, length: s.word.length };
}

export interface SimResult extends SimConfig {
  games: number;
  avoiderWins: number;
  avoiderRate: number;
  avgLength: number;
}

export function tournament(sim: SimConfig, games = 200, seed0 = 1): SimResult {
  let avoiderWins = 0;
  let totalLength = 0;
  for (let g = 0; g < games; g++) {
    const o = playGame(sim, seed0 + g * 7919);
    if (o.winner === AVOIDER) avoiderWins++;
    totalLength += o.length;
  }
  return { ...sim, games, avoiderWins, avoiderRate: avoiderWins / games, avgLength: totalLength / games };
}

/**
 * For a given (alpha, k): the largest target length n the AVOIDER can still reach with win-rate
 * >= winRate (the observed "survivable length" threshold). Returns the last n that holds.
 */
export function survivableN(alpha: number, k: number, level: AILevel, maxN = 16, games = 60, winRate = 0.5): number {
  let last = 0;
  for (let n = k; n <= maxN; n++) {
    const r = tournament({ alpha, k, n, avoiderLevel: level, constructorLevel: level }, games);
    if (r.avoiderRate >= winRate) last = n; else break;
  }
  return last;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Different Blocks — AVOIDER survival (greedy vs greedy)');
  log('AVOIDER win-rate by (alphabet |A|, target n) for k=3:');
  for (const alpha of [3, 4, 5]) {
    const row = [4, 6, 8, 10, 12].map(n => {
      const r = tournament({ alpha, k: 3, n, avoiderLevel: 1, constructorLevel: 1 }, 80);
      return `n=${n}:${r.avoiderRate.toFixed(2)}`;
    });
    log(`  |A|=${alpha}: ${row.join('  ')}`);
  }
  log('survivable n* (largest n with win-rate >= 0.5) by (|A|, k):');
  for (const k of [2, 3, 4]) {
    const row = [k, k + 1, k + 2].map(alpha => `|A|=${alpha}:${survivableN(alpha, k, 1)}`);
    log(`  k=${k}: ${row.join('  ')}`);
  }
}

// Run with `npx tsx src/games/different-blocks/sim/tournament.ts`. The guard makes this file
// self-running when executed directly, while staying inert when imported (e.g. by tests). We read
// process.argv through an untyped global so this stays compilable without @types/node.
const proc = (globalThis as { process?: { argv?: string[] } }).process;
if (proc?.argv?.[1] && import.meta.url.endsWith(proc.argv[1].split('/').pop() ?? '\0')) {
  runDemo();
}
