// Headless AI-vs-AI experiments for the report.
import { AILevel, EraseRule, GameConfig, GROWER, DEFAULT_RULE, newGame, applyMove, isOver } from './engine';
import { aiMove, makeRng } from './ai';

export interface GameResult {
  winner: string;
  finalLen: number;  // length of the word when the game ended
  maxLen: number;    // longest the word ever got during the game
  series: number[];  // length-over-time: length after each move (move 1 onward)
}

export function playGame(k: number, d: number, rounds: number, growerLvl: AILevel, shrinkerLvl: AILevel, seed: number, rule: EraseRule = DEFAULT_RULE): GameResult {
  const config: GameConfig = { k, d, rounds, rule, humanRole: 'none', aiLevel: { R: growerLvl, B: shrinkerLvl }, seed };
  const rnd = makeRng(seed);
  let s = newGame(config);
  let maxLen = 0;
  const series: number[] = [];
  while (!isOver(s)) {
    s = applyMove(s, aiMove(s, config.aiLevel[s.turn], rnd));
    maxLen = Math.max(maxLen, s.word.length);
    series.push(s.word.length);
  }
  return { winner: s.winner!, finalLen: s.word.length, maxLen, series };
}

export function tournament(k: number, d: number, rounds: number, growerLvl: AILevel, shrinkerLvl: AILevel, games = 200): number {
  let g = 0;
  for (let i = 0; i < games; i++) if (playGame(k, d, rounds, growerLvl, shrinkerLvl, 1 + i * 7919).winner === GROWER) g++;
  return g / games;
}

export interface SimStats {
  growerWinRate: number; // == P(reach d) under this strategy pair
  avgMaxLen: number;     // average longest length reached across the game set
  avgFinalLen: number;   // average final length across the game set
  games: number;
}

/** Aggregate a seeded set of games into the report stats (avg max length, P(reach d), …). */
export function simStats(k: number, d: number, rounds: number, growerLvl: AILevel, shrinkerLvl: AILevel, games = 200, rule: EraseRule = DEFAULT_RULE): SimStats {
  let wins = 0, sumMax = 0, sumFinal = 0;
  for (let i = 0; i < games; i++) {
    const r = playGame(k, d, rounds, growerLvl, shrinkerLvl, 1 + i * 7919, rule);
    if (r.winner === GROWER) wins++;
    sumMax += r.maxLen;
    sumFinal += r.finalLen;
  }
  return { growerWinRate: wins / games, avgMaxLen: sumMax / games, avgFinalLen: sumFinal / games, games };
}

export function runDemo(log: (s: string) => void = (s) => console.log(s)): void {
  log('Grower (greedy) vs Shrinker (greedy), alphabet k=3, 30 rounds:');
  log('  target d   P(reach d)   avg max len   avg final len');
  for (const d of [6, 8, 10, 12, 14]) {
    const st = simStats(3, d, 30, 1, 1);
    log(`  d=${String(d).padEnd(8)} ${st.growerWinRate.toFixed(2).padEnd(12)} ${st.avgMaxLen.toFixed(2).padEnd(13)} ${st.avgFinalLen.toFixed(2)}`);
  }
}
