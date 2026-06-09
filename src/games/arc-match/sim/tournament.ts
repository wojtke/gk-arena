// Headless AI-vs-AI experiments. Produces the win-rate and threshold tables for the report's
// "computer-vs-computer simulation" requirement. Run with a TS runner, e.g. `npx tsx src/sim/tournament.ts`.

import {
  AILevel, Color, GameConfig, MAKER, TargetType,
  newGame, applyMove, aiMove, makeRng, isOver,
} from '../engine';

export interface SimConfig {
  n: number;
  k: number;
  type: TargetType;
  makerLevel: AILevel;
  breakerLevel: AILevel;
}

/** Play one AI-vs-AI game; return the winner. */
export function playGame(sim: SimConfig, seed: number): Color {
  const config: GameConfig = {
    n: sim.n, k: sim.k, type: sim.type, mode: 'maker-breaker',
    humanRole: 'none', aiLevel: { R: sim.makerLevel, B: sim.breakerLevel }, seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  while (!isOver(s)) {
    const [lo, hi] = aiMove(s, config.aiLevel[s.turn], rnd);
    s = applyMove(s, lo, hi);
  }
  return s.winner!;
}

export interface SimResult extends SimConfig { games: number; makerWins: number; makerRate: number; }

/** Play `games` games and report Maker's win rate. */
export function tournament(sim: SimConfig, games = 200, seed0 = 1): SimResult {
  let makerWins = 0;
  for (let g = 0; g < games; g++) {
    if (playGame(sim, seed0 + g * 7919) === MAKER) makerWins++;
  }
  return { ...sim, games, makerWins, makerRate: makerWins / games };
}

/**
 * For fixed type/levels, the largest k Maker still wins ≥ threshold of the time, per n.
 * Maker draws only `cap = ⌈n/2⌉` of the n arcs, so k*(n) ≤ cap and k > cap is unwinnable — we probe
 * only up to cap. `esFloor = n^{1/3}` is the Erdős–Szekeres size unavoidable in a whole matching,
 * carried as a reference curve. (The app ships the crossing target, where Breaker has real agency
 * and k*(n) < cap; nesting/alignment are degenerate — Maker forces cap regardless.)
 */
export function thresholdTable(
  ns: number[], type: TargetType, makerLevel: AILevel, breakerLevel: AILevel,
  games = 100, winRate = 0.5,
): Array<{ n: number; kStar: number; cap: number; esFloor: number }> {
  return ns.map(n => {
    const cap = Math.ceil(n / 2);
    let kStar = 0;
    for (let k = 2; k <= cap; k++) {
      const r = tournament({ n, k, type, makerLevel, breakerLevel }, games);
      if (r.makerRate >= winRate) kStar = k; else break;
    }
    return { n, kStar, cap, esFloor: Math.cbrt(n) };
  });
}

/**
 * Print a couple of demo tables for the report. Call from a runner, e.g. a tiny `run.ts` with
 * `import { runDemo } from './tournament'; runDemo();` executed via `npx tsx`.
 */
export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Maker win-rate (greedy Maker L1 vs greedy Breaker L1), type=crossing, k=3:');
  for (const n of [3, 4, 5, 6, 7, 8]) {
    const r = tournament({ n, k: 3, type: 'crossing', makerLevel: 1, breakerLevel: 1 }, 200);
    log(`  n=${n}: Maker wins ${(r.makerRate * 100).toFixed(0)}%`);
  }
  log('Largest forceable k* (L2 Maker vs L2 Breaker, crossing, >=50% over 60 games) vs the ceiling cap=ceil(n/2):');
  for (const row of thresholdTable([3, 4, 5, 6, 7], 'crossing', 2, 2, 60)) {
    log(`  n=${row.n}: k* = ${row.kStar}  (cap = ${row.cap}, n^(1/3) = ${row.esFloor.toFixed(2)})`);
  }
}
