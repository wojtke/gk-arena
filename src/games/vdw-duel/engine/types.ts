// Core types for VdW Duel — the two-colour misère Van der Waerden game.
//
// Each player owns a colour and inserts ONLY their own colour into a single growing line.
// Red (player 1) moves first, then Blue. A move is just a GAP index 0..L: drop *your* colour
// there. A player LOSES the instant their colour occupies a monochromatic k-term arithmetic
// progression over the line indices. Because every move INSERTS (re-indexing everything to the
// right of the gap), one move can complete an AP in EITHER colour — whoever owns the completed AP
// loses; if a single move completes both colours' APs, the MOVER loses.

export type Owner = 'R' | 'B';
export const RED: Owner = 'R';
export const BLUE: Owner = 'B';

export type AILevel = 0 | 1 | 2 | 3;

/** "R" = human plays Red (first), "B" = human plays Blue, "both" = hotseat, "none" = watch AI. */
export type HumanRole = Owner | 'both' | 'none';

export interface GameConfig {
  /** AP length to avoid. Default 3 (W(2;3)=9). 4 is offered but the exact solver falls back. */
  k: number;
  /** Safety cap on line length; defaults to W(2;k) — the game provably ends by then. */
  maxLen: number;
  humanRole: HumanRole;
  aiLevel: Record<Owner, AILevel>;
  seed: number;
}

export interface GameState {
  config: GameConfig;
  /** Colours in left-to-right order, one per placed token; index i is line position i. */
  line: Owner[];
  /** Whose move it is now (Red first). */
  turn: Owner;
  /** Who completed their own k-AP (and therefore lost), or null while play continues. */
  loser: Owner | null;
  /** The other player, set when the game is over. */
  winner: Owner | null;
  /** Line indices of the losing AP, for the highlight pulse. */
  witness: number[] | null;
}

/** A move is a single gap index 0..line.length; the colour is implied by `turn`. */
export type Move = number;
