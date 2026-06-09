// Headless experiments. Three computer-vs-computer simulations covering the theory hooks:
//   1. greedy-vs-optimal: how close greedy first/best-fit packing gets to the true m(F).
//   2. two-player first-player win-rate (AI vs AI).
//   3. a small growth table of m(F) vs the Theta(n^{3/2}/ln n) bound.
// Run via `npx tsx src/sim/tournament.ts` (or import the functions).

import {
  APSpec, Color, GameConfig, RED,
  newGame, applyMove, aiMove, makeRng, isOver, usedLength, mF,
} from '../engine';

// ---------------------------------------------------------------------------------------------------
// 1. Greedy vs optimal used length on random families.
// ---------------------------------------------------------------------------------------------------

function randomFamily(rnd: () => number, members: number, maxD: number, maxLen: number): APSpec[] {
  const fam: APSpec[] = [];
  for (let i = 0; i < members; i++) {
    const d = 1 + Math.floor(rnd() * maxD);
    const len = 2 + Math.floor(rnd() * (maxLen - 1));
    fam.push({ d, len });
  }
  return fam;
}

/**
 * Play a solo game with a greedy AI and return the used length it achieves, or Infinity if greedy
 * got stuck before placing the whole family (a partial packing is NOT a valid greedy result — its
 * used length can be smaller than the optimum m(F), which would be nonsensical).
 */
function greedyUsedLength(family: APSpec[], L: number, seed: number): number {
  const config: GameConfig = {
    mode: 'solo', L, family, humanRole: 'none',
    aiLevel: { R: 1, B: 1 }, seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  let guard = 0;
  while (!isOver(s) && guard++ < 200) {
    const m = aiMove(s, 1, rnd);
    if (!m) break;
    s = applyMove(s, m);
  }
  // Only a fully-placed family is a real packing; otherwise greedy failed at this L.
  if (s.remaining.length > 0) return Infinity;
  return usedLength(s.occupied);
}

export interface GreedyVsOptimal {
  family: APSpec[];
  optimal: number;
  greedy: number;
  ratio: number;
}

export function greedyVsOptimal(games = 40, seed0 = 1): GreedyVsOptimal[] {
  const rnd = makeRng(seed0);
  const out: GreedyVsOptimal[] = [];
  for (let g = 0; g < games; g++) {
    const family = randomFamily(rnd, 2 + Math.floor(rnd() * 3), 4, 4); // 2..4 members
    const optimal = mF(family, 60);
    if (optimal <= 0) continue;
    // Greedy can get stuck if the strip is too tight; retry on a progressively larger L so we
    // measure a *completed* greedy packing. If it still fails, drop the sample rather than record a
    // partial packing whose used length could spuriously beat the optimum (ratio < 1).
    let greedy = Infinity;
    for (const extra of [6, 12, 24]) {
      const L = Math.max(optimal + extra, 12);
      greedy = greedyUsedLength(family, L, seed0 + g * 7919);
      if (Number.isFinite(greedy)) break;
    }
    if (!Number.isFinite(greedy)) continue; // greedy could not complete a valid packing
    out.push({ family, optimal, greedy, ratio: greedy / optimal });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------
// 2. Two-player first-player win-rate (AI vs AI).
// ---------------------------------------------------------------------------------------------------

export function playTwoPlayer(
  L: number, diffs: number[], lengths: number[], levelR: 0 | 1 | 2 | 3, levelB: 0 | 1 | 2 | 3, seed: number,
): Color {
  const config: GameConfig = {
    mode: 'two-player', L, diffs, lengths, humanRole: 'none',
    aiLevel: { R: levelR, B: levelB }, seed,
  };
  const rnd = makeRng(seed);
  let s = newGame(config);
  let guard = 0;
  while (!isOver(s) && guard++ < 500) {
    const m = aiMove(s, s.config.aiLevel[s.turn], rnd);
    if (!m) break;
    s = applyMove(s, m);
  }
  return s.winner ?? RED;
}

export interface TwoPlayerResult {
  L: number; games: number; redWins: number; redRate: number;
}

export function twoPlayerFirstPlayerRate(
  L: number, diffs: number[], lengths: number[], level: 0 | 1 | 2 | 3 = 2, games = 100, seed0 = 1,
): TwoPlayerResult {
  let redWins = 0;
  for (let g = 0; g < games; g++) {
    if (playTwoPlayer(L, diffs, lengths, level, level, seed0 + g * 6271) === RED) redWins++;
  }
  return { L, games, redWins, redRate: redWins / games };
}

// ---------------------------------------------------------------------------------------------------
// 3. Growth table: m(F) for the all-equal family {A_1,...,A_n} (n single-step APs of length n) vs the
//    Theta(n^{3/2}/ln n) shape. (Small n only.)
// ---------------------------------------------------------------------------------------------------

export interface GrowthRow {
  n: number;
  family: APSpec[];
  m: number;
  bound: number; // n^{3/2}/ln n shape (unnormalised)
}

export function growthTable(maxN = 5): GrowthRow[] {
  const rows: GrowthRow[] = [];
  for (let n = 2; n <= maxN; n++) {
    // Family of progressions with differences 1..n, each of length 2 (bounded-by-n flavour).
    const family: APSpec[] = [];
    for (let d = 1; d <= n; d++) family.push({ d, len: 2 });
    const m = mF(family, 80);
    const bound = Math.pow(n, 1.5) / Math.max(1, Math.log(n));
    rows.push({ n, family, m, bound });
  }
  return rows;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Greedy vs optimal used length (solo packing, random families):');
  const gv = greedyVsOptimal(30);
  const avg = gv.reduce((a, r) => a + r.ratio, 0) / Math.max(1, gv.length);
  const worst = gv.reduce((a, r) => Math.max(a, r.ratio), 0);
  log(`  samples=${gv.length}  mean greedy/optimal=${avg.toFixed(3)}  worst=${worst.toFixed(3)}`);

  log('Two-player first-player (Red) win-rate by strip length L (level 2):');
  for (const L of [8, 10, 12, 14]) {
    const r = twoPlayerFirstPlayerRate(L, [1, 2], [2, 3], 2, 60);
    log(`  L=${L}: red wins ${(r.redRate * 100).toFixed(0)}%`);
  }

  log('Growth table m(F) for F = {A_1..A_n} (len 2) vs n^{3/2}/ln n shape:');
  for (const row of growthTable(6)) {
    log(`  n=${row.n}: m(F)=${row.m}  bound~${row.bound.toFixed(2)}`);
  }
}
