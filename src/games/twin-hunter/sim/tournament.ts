// Headless AI-vs-AI experiments for Twin Hunter: how long can the AVOIDER survive vs alphabet size
// k (words) or interval size m (perm)? Produces first-threshold tables — the experimental
// contribution flagged in DESIGN.md. Run via `npx tsx`.

import {
  AILevel, AVOIDER, GameConfig, Role, Variant,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer, defaultMinBlock,
} from '../engine';

export interface SimConfig {
  variant: Variant;
  k: number;          // words: alphabet size ; perm: range m
  n: number;          // words: target length ; perm: m
  minBlock: number;
  avoiderLevel: AILevel;
  forcerLevel: AILevel;
}

export interface GameOutcome {
  winner: Role;
  /** Final sequence length reached (= how long the AVOIDER survived). */
  length: number;
}

export function playGame(sim: SimConfig, seed: number): GameOutcome {
  const config: GameConfig = {
    variant: sim.variant, k: sim.k, n: sim.n, minBlock: sim.minBlock,
    humanRole: 'none', aiLevel: { AVOIDER: sim.avoiderLevel, FORCER: sim.forcerLevel }, seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  let guard = 0;
  while (!isOver(s) && guard++ < 10000) {
    s = applyMove(s, aiMove(s, config.aiLevel[currentPlayer(s)], rnd));
  }
  return { winner: s.winner ?? AVOIDER, length: s.seq.length };
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
 * For a words alphabet of size k: the largest target length n the AVOIDER can still reach with
 * win-rate >= winRate (the observed "guaranteed length" threshold). Returns the last n that holds.
 */
export function avoiderThresholdWords(k: number, level: AILevel, maxN = 16, games = 60, winRate = 0.5): number {
  const minBlock = defaultMinBlock('words');
  let last = 0;
  for (let n = 2; n <= maxN; n++) {
    const r = tournament({ variant: 'words', k, n, minBlock, avoiderLevel: level, forcerLevel: level }, games);
    if (r.avoiderRate >= winRate) last = n; else break;
  }
  return last;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Twin Hunter — AVOIDER survival (greedy vs greedy)');
  log('words: AVOIDER win-rate by alphabet k and target length n:');
  for (const k of [2, 3, 4]) {
    const row = [4, 6, 8, 10, 12].map(n => {
      const r = tournament({ variant: 'words', k, n, minBlock: 1, avoiderLevel: 1, forcerLevel: 1 }, 80);
      return `n=${n}:${r.avoiderRate.toFixed(2)}`;
    });
    log(`  k=${k}: ${row.join('  ')}`);
  }
  log('words AVOIDER guaranteed length n* (largest n with win-rate >= 0.5):');
  for (const k of [2, 3, 4]) log(`  k=${k}: n* = ${avoiderThresholdWords(k, 1)}`);

  log('perm: AVOIDER win-rate by interval m:');
  const row = [4, 5, 6, 7].map(m => {
    const r = tournament({ variant: 'perm', k: m, n: m, minBlock: 2, avoiderLevel: 1, forcerLevel: 1 }, 80);
    return `m=${m}:${r.avoiderRate.toFixed(2)}(len${r.avgLength.toFixed(1)})`;
  });
  log(`  ${row.join('  ')}`);
}

// Run the tables with `npx tsx src/sim/tournament.ts`. The guard below makes this file self-running
// when executed directly (e.g. via tsx/node), while staying inert when imported (e.g. by tests).
// We read `process.argv` through an untyped global so this stays compilable without @types/node
// (the project deliberately ships no Node typings); under a browser/vite build `proc` is undefined
// and the guard is simply skipped.
const proc = (globalThis as { process?: { argv?: string[] } }).process;
if (proc?.argv?.[1] && import.meta.url.endsWith(proc.argv[1].split('/').pop() ?? '\0')) {
  runDemo();
}

