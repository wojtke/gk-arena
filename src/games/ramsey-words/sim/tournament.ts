// Headless AI-vs-AI experiments for Ramsey Words: for random colourings χ over (|A|, l, c), how long
// can the AVOIDER survive? Produces "survivable-n" tables — the experimental contribution flagged in
// the design (forcing is conditional on (|A|, l, c), and for many seeds the AVOIDER wins for ALL n).
// Pure: no DOM. Run via `npx tsx`.

import {
  AILevel, AVOIDER, GameConfig, Side,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer,
} from '../engine';

export interface SimConfig {
  alpha: number;
  l: number;
  c: number;
  n: number;
  avoiderLevel: AILevel;
  constructorLevel: AILevel;
}

export interface GameOutcome {
  winner: Side;
  /** Final word length reached (= how long the AVOIDER survived). */
  length: number;
}

/** Play one game on the colouring seeded by `seed` (also seeds the AI's tie-breaking rng). */
export function playGame(sim: SimConfig, seed: number): GameOutcome {
  const config: GameConfig = {
    alpha: sim.alpha, l: sim.l, c: sim.c, n: sim.n, seed,
    humanRole: 'none', aiLevel: { A: sim.avoiderLevel, C: sim.constructorLevel },
  };
  const rnd = makeRng(seed ^ 0x5bd1e995);
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

/** Run `games` games over distinct colouring seeds and aggregate the AVOIDER's success. */
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
 * For a given (alpha, l, c): the largest target length n the AVOIDER can still reach with win-rate
 * >= winRate over random colourings (the observed "survivable n" threshold). Returns the last n that
 * holds, or maxN if it holds throughout (the "Avoider survives every n" finding).
 */
export function survivableN(
  alpha: number, l: number, c: number, level: AILevel,
  maxN = 16, games = 60, winRate = 0.5,
): number {
  let last = 0;
  for (let n = 2 * l; n <= maxN; n++) {
    const r = tournament({ alpha, l, c, n, avoiderLevel: level, constructorLevel: level }, games);
    if (r.avoiderRate >= winRate) last = n; else break;
  }
  return last;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Ramsey Words — AVOIDER survival over random colourings (greedy vs greedy)');
  log('AVOIDER win-rate by (|A|, l, c) and target length n:');
  for (const alpha of [2, 3]) {
    for (const l of [1, 2]) {
      for (const c of [2, 3]) {
        if (Math.pow(alpha, l) > 256) continue;
        const row = [6, 8, 10, 12].map(n => {
          const r = tournament({ alpha, l, c, n, avoiderLevel: 1, constructorLevel: 1 }, 60);
          return `n=${n}:${r.avoiderRate.toFixed(2)}`;
        });
        log(`  |A|=${alpha} l=${l} c=${c}: ${row.join('  ')}`);
      }
    }
  }
  log('Survivable n* (largest n with AVOIDER win-rate >= 0.5 over random χ):');
  for (const alpha of [2, 3]) {
    for (const l of [1, 2]) {
      for (const c of [2, 3]) {
        if (Math.pow(alpha, l) > 256) continue;
        log(`  |A|=${alpha} l=${l} c=${c}: n* = ${survivableN(alpha, l, c, 1)}`);
      }
    }
  }
}

// Self-running when executed directly (tsx/node), inert when imported. We read process.argv through an
// untyped global so this stays compilable without @types/node.
const proc = (globalThis as { process?: { argv?: string[] } }).process;
if (proc?.argv?.[1] && import.meta.url.endsWith(proc.argv[1].split('/').pop() ?? '\0')) {
  runDemo();
}
