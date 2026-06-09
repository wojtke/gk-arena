// Headless AI-vs-AI experiments for Grasshopper (AVOIDANCE FORM).
// The headline is the BUILDER's GUARANTEED d: the largest inspected-length target the Builder (the
// AVOIDER) can reach square-free against a perfect Grasshopper (the FORCER), found by the exact
// solver. Over |A| ≥ 3 the Builder can keep the path clean arbitrarily long (Thue), so this is no
// longer the degenerate constant the literal win-direction produced — it is a real contest. All
// functions are pure (no top-level side effects) so tests can import them.

import {
  AILevel, GameConfig, Role, GRASSHOPPER, BUILDER,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer, solve,
} from '../engine';

export interface SimConfig {
  alpha: number;
  d: number;
  power: number;
  builderLevel: AILevel;
  grasshopperLevel: AILevel;
}

function configFor(sim: SimConfig, seed: number): GameConfig {
  return {
    alpha: sim.alpha,
    d: sim.d,
    power: sim.power,
    humanRole: 'none',
    aiLevel: { B: sim.builderLevel, R: sim.grasshopperLevel },
    seed,
  };
}

/** Play one full AI-vs-AI game; returns the winner. Always terminates (|S| grows by 1 each hop). */
export function playGame(sim: SimConfig, seed: number): Role {
  const rnd = makeRng(seed);
  let s = newGame(configFor(sim, seed));
  while (!isOver(s)) {
    const me = currentPlayer(s);
    const level = me === BUILDER ? sim.builderLevel : sim.grasshopperLevel;
    s = applyMove(s, aiMove(s, level, rnd));
  }
  return s.winner!;
}

export interface SimResult extends SimConfig {
  games: number;
  grasshopperWins: number;
  grasshopperRate: number;
}

export function tournament(sim: SimConfig, games = 200, seed0 = 1): SimResult {
  let grasshopperWins = 0;
  for (let g = 0; g < games; g++) {
    if (playGame(sim, seed0 + g * 7919) === GRASSHOPPER) grasshopperWins++;
  }
  return { ...sim, games, grasshopperWins, grasshopperRate: grasshopperWins / games };
}

/** Exact optimal winner of a fresh (alpha, d, power) instance via the solver (GRASSHOPPER = forcer). */
export function optimalWinner(alpha: number, d: number, power = 2): Role {
  const cfg: GameConfig = {
    alpha, d, power, humanRole: 'none', aiLevel: { B: 3, R: 3 }, seed: 1,
  };
  return solve(newGame(cfg)) === 1 ? GRASSHOPPER : BUILDER;
}

/**
 * The largest inspected-length target d in [1, dmax] the Builder (AVOIDER) can GUARANTEE square-free
 * against a perfect Grasshopper (FORCER) for a given alphabet size (the novelty table). If the
 * Builder wins (survives) at every d up to dmax we report dmax — a lower bound: it keeps the path
 * clean arbitrarily long, as expected for |A| ≥ 3 (Thue). Over |A| = 2 the forcer breaks through
 * early, so the guaranteed d is small: this is now a genuine, non-constant outcome across |A|.
 */
export function guaranteedD(alpha: number, power = 2, dmax = 14): number {
  let best = 0;
  for (let d = 1; d <= dmax; d++) {
    if (optimalWinner(alpha, d, power) === BUILDER) best = d;
    else break; // once the Grasshopper can force a square by length d it can at every larger d too
  }
  return best;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Grasshopper (avoidance form) — exact optimal winner (square mode) by (alphabet |A|, target d):');
  log('  G = Grasshopper forces a square · B = Builder keeps S square-free to length d.');
  for (const alpha of [2, 3, 4]) {
    const row = [2, 4, 6, 8].map((d) => `d=${d}:${optimalWinner(alpha, d, 2) === GRASSHOPPER ? 'G' : 'B'}`);
    log(`  |A|=${alpha}: ${row.join('  ')}`);
  }

  log("Builder's guaranteed d (largest d it survives square-free, square mode):");
  for (const alpha of [2, 3, 4]) {
    log(`  |A|=${alpha}: d* = ${guaranteedD(alpha, 2, 14)}`);
  }

  log('Grasshopper (forcer) win-rate, greedy vs greedy, |A|=3, square mode:');
  const row = [4, 6, 8, 10].map((d) => {
    const r = tournament({ alpha: 3, d, power: 2, builderLevel: 1, grasshopperLevel: 1 }, 120);
    return `d=${d}:${r.grasshopperRate.toFixed(2)}`;
  });
  log(`  ${row.join('  ')}`);
}

// Run via: npx tsx -e "import('./src/games/grasshopper/sim/tournament').then(m => m.runDemo())"
