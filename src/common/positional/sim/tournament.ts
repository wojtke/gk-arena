// Headless AI-vs-AI experiments: win-rate tables and the Maker/Breaker threshold (where the
// outcome flips), which is exactly the Erdős–Selfridge phenomenon. Run via `npx tsx`.

import {
  AILevel, Color, GameConfig, GameKind, MAKER,
  newGame, applyMove, aiMove, makeRng, isOver,
} from '../index';

export interface SimConfig {
  kind: GameKind;
  boardSize: number;
  target: number;
  makerLevel: AILevel;
  breakerLevel: AILevel;
}

export function playGame(sim: SimConfig, seed: number): Color {
  const config: GameConfig = {
    kind: sim.kind, boardSize: sim.boardSize, target: sim.target, mode: 'maker-breaker',
    humanRole: 'none', aiLevel: { R: sim.makerLevel, B: sim.breakerLevel }, seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  while (!isOver(s)) s = applyMove(s, aiMove(s, config.aiLevel[s.turn], rnd));
  return s.winner!;
}

export interface SimResult extends SimConfig { games: number; makerWins: number; makerRate: number; }

export function tournament(sim: SimConfig, games = 200, seed0 = 1): SimResult {
  let makerWins = 0;
  for (let g = 0; g < games; g++) if (playGame(sim, seed0 + g * 7919) === MAKER) makerWins++;
  return { ...sim, games, makerWins, makerRate: makerWins / games };
}

/** For VdW with AP length k: the smallest N at which Maker starts winning (≥ winRate). */
export function vdwThreshold(k: number, level: AILevel, maxN = 24, games = 80, winRate = 0.5): number {
  for (let N = k; N <= maxN; N++) {
    const r = tournament({ kind: 'vdw', boardSize: N, target: k, makerLevel: level, breakerLevel: level }, games);
    if (r.makerRate >= winRate) return N;
  }
  return -1;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('VdW: Maker win-rate (ES vs ES), by AP length k and positions N:');
  for (const k of [3, 4, 5]) {
    const row = [7, 9, 11, 13, 15].map(N => {
      const r = tournament({ kind: 'vdw', boardSize: N, target: k, makerLevel: 2, breakerLevel: 2 }, 120);
      return `N=${N}:${r.makerRate.toFixed(2)}`;
    });
    log(`  k=${k}: ${row.join('  ')}`);
  }
  log('VdW Maker/Breaker threshold N* (smallest N where Maker wins):');
  for (const k of [3, 4, 5]) log(`  k=${k}: N* = ${vdwThreshold(k, 2)}`);
}

// CLI entry point: run the demo when this file is executed directly (e.g. `npx tsx
// src/common/positional/sim/tournament.ts`). Guarded so importing the module (tests, UI) never
// triggers the sweep. `process` is reached via globalThis so this typechecks without @types/node in
// the web tsconfig. We decode import.meta.url's pathname (it %-encodes spaces) and compare against
// argv[1]; the endsWith fallback tolerates the macOS /private symlink prefix on realpath'd locations.
const argv1 = (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1];
if (argv1) {
  const here = decodeURIComponent(new URL(import.meta.url).pathname);
  if (here === argv1 || here.endsWith(argv1) || argv1.endsWith(here)) runDemo();
}
