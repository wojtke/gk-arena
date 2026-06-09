// The single shared contract between the shell and every game. Games depend ONLY on this file (and
// common/rng + common/shared.css); they never import a sibling game or the shell. The shell imports
// games. This one-way dependency is what keeps each game extractable.

/** The three layout zones the shell hands a game when it mounts. */
export interface GameSlots {
  /** Left rail — settings/controls + New/Undo/Run buttons. */
  settings: HTMLElement;
  /** Centre stage — the board (status + board + meter + banner). */
  board: HTMLElement;
  /** Right rail — a Hints card (if any) followed by the explainer cards. */
  sidebar: HTMLElement;
}

/** A mounted game. The shell calls destroy() before navigating away or switching games. */
export interface GameInstance {
  /** Cancel timers/intervals and detach anything global. Slots are cleared by the shell. */
  destroy(): void;
}

/** The six thematic families the picker groups games under. */
export type GameFamily =
  | 'Repetitions & Thue'
  | 'Twins & shuffle squares'
  | 'Van der Waerden'
  | 'Ramsey'
  | 'Packing'
  | 'Ordered matchings';

/** Catalog metadata used to render (and group/tag) the picker card. */
export interface GameMeta {
  /** Stable kebab-case id; also the CSS scope class applied to the slots: `.game-<id>`. */
  id: string;
  title: string;
  tagline: string;
  /** One- to two-sentence description shown on the picker card. */
  blurb: string;
  /** Short topic descriptor shown in the footer, e.g. "Thue / nonrepetitive words". */
  topic: string;
  /** Thematic family (shown as a colour-coded tag on the card). */
  family: GameFamily;
  /** Short interaction-model label, e.g. "insertion", "Maker–Breaker", "build + hop". */
  mechanic: string;
  /** A few short concept keywords shown as tags, e.g. ["shuffle squares", "NP-hard"]. */
  tags?: string[];
  /** Optional inline SVG markup for the picker card icon. */
  icon?: string;
}

/** A game module: metadata plus a mount() that fills the three slots and returns a handle. */
export interface GameModule extends GameMeta {
  mount(slots: GameSlots): GameInstance;
}
