// Headless AI-vs-AI experiments for VdW Online: how long can the PAINTER survive vs colours r and a
// per-colour target vector k, and what is the POINTER's forcing length? Produces win-rate /
// forcing-length tables — the experimental contribution flagged in the design (online forcing length
// is open, both diagonal and off-diagonal). Pure; run via `npx tsx`.

import {
  AILevel, GameConfig, GameState, Role, POINTER, PAINTER,
  newGame, applyMove, aiMove, makeRng, isOver, currentPlayer,
} from '../engine';

export interface SimConfig {
  r: number;            // colours
  k: number[];          // per-colour AP targets (all equal = diagonal / plain VdW online)
  n: number;            // token budget
  pointerLevel: AILevel;
  painterLevel: AILevel;
}

export interface GameOutcome {
  winner: Role;
  /** Final line length reached (= how long the PAINTER survived / the POINTER's forcing length). */
  length: number;
}

export function playGame(sim: SimConfig, seed: number): GameOutcome {
  const config: GameConfig = {
    r: sim.r, k: sim.k, n: sim.n,
    humanRole: 'none', aiLevel: { P: sim.pointerLevel, A: sim.painterLevel }, seed,
  };
  const rnd = makeRng(seed);
  let s: GameState = newGame(config);
  let guard = 0;
  while (!isOver(s) && guard++ < 10000) {
    s = applyMove(s, aiMove(s, config.aiLevel[currentPlayer(s)], rnd));
  }
  return { winner: s.winner ?? PAINTER, length: s.line.length };
}

export interface SimResult extends SimConfig {
  games: number;
  pointerWins: number;
  pointerRate: number;
  /** Average final length: for POINTER wins this is the forcing length; for PAINTER wins it is n. */
  avgLength: number;
  /** Average final length over POINTER wins only (the empirical forcing length). */
  avgForcingLength: number;
}

export function tournament(sim: SimConfig, games = 200, seed0 = 1): SimResult {
  let pointerWins = 0;
  let totalLength = 0;
  let forcingTotal = 0;
  for (let g = 0; g < games; g++) {
    const o = playGame(sim, seed0 + g * 7919);
    if (o.winner === POINTER) { pointerWins++; forcingTotal += o.length; }
    totalLength += o.length;
  }
  return {
    ...sim, games, pointerWins,
    pointerRate: pointerWins / games,
    avgLength: totalLength / games,
    avgForcingLength: pointerWins ? forcingTotal / pointerWins : 0,
  };
}

/** Diagonal target vector: every colour shares the same AP length k. */
function diag(r: number, k: number): number[] {
  return Array.from({ length: r }, () => k);
}

/**
 * For colours r and a target vector k: the largest budget n the PAINTER can still survive with
 * win-rate >= winRate (the observed "guaranteed length" threshold). Returns the last n that holds.
 */
export function painterThreshold(r: number, k: number[], level: AILevel, maxN = 16, games = 60, winRate = 0.5): number {
  let last = 0;
  for (let n = Math.max(...k); n <= maxN; n++) {
    const res = tournament({ r, k, n, pointerLevel: level, painterLevel: level }, games);
    if (1 - res.pointerRate >= winRate) last = n; else break;
  }
  return last;
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('VdW Online — POINTER forcing (greedy vs greedy)');
  log('Diagonal: POINTER win-rate by colours r and budget n (k=3):');
  for (const r of [2, 3]) {
    const row = [6, 8, 10, 12, 14].map(n => {
      const res = tournament({ r, k: diag(r, 3), n, pointerLevel: 1, painterLevel: 1 }, 80);
      return `n=${n}:${res.pointerRate.toFixed(2)}`;
    });
    log(`  r=${r}: ${row.join('  ')}`);
  }
  log('Diagonal: PAINTER guaranteed length n* (largest n with survival rate >= 0.5):');
  for (const r of [2, 3]) log(`  r=${r}, k=3: n* = ${painterThreshold(r, diag(r, 3), 1)}`);

  log('Off-diagonal: PAINTER survival n* (win-rate >= 0.5) by target vector:');
  for (const k of [[3, 3], [3, 4], [3, 5], [3, 3, 4]]) {
    log(`  k=[${k.join(',')}] -> n* = ${painterThreshold(k.length, k, 1)}`);
  }
}

// Run with `npx tsx src/games/vdw-online/sim/tournament.ts`. Self-running when executed directly,
// inert when imported (e.g. by tests). We read process.argv through an untyped global so this stays
// compilable without @types/node; under a browser/vite build `proc` is undefined and the guard skips.
const proc = (globalThis as { process?: { argv?: string[] } }).process;
if (proc?.argv?.[1] && import.meta.url.endsWith(proc.argv[1].split('/').pop() ?? '\0')) {
  runDemo();
}
