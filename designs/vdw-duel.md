# VdW Duel — design document

The **Van der Waerden game** (two-colour, misère): each player owns a colour and inserts their own
tokens into a growing line. The player who **first completes a monochromatic arithmetic progression of
length `k` in their own colour loses**.

> **Status: design only — not yet implemented.** Targets the arena (`src/games/vdw-duel/`). Realises
> **KS #5 — Gra Van der Waerdena**. This is the *symmetric misère avoidance* game and is genuinely
> different from **builder-painter** (Maker–Breaker, one player *wants* the AP) and from
> **vdw-online** (Pointer/Painter, asymmetric roles). New mechanic: own-colour insertion + "you lose
> if you build it".

- **Course fit (on-list).** KS #5 exactly. The KS sheet lists only human-vs-computer and AI-vs-AI
  simulation; the arena gives all role combinations for free.

---

## 1. The game

- Tokens are placed in a single line; positions are the **line indices `1…L`** (inserting shifts
  indices, as in vdw-online).
- **Each player has their own fixed colour** (Red = player 1, Blue = player 2). A **move** = choose a
  gap `g ∈ {0…L}` and drop *your* colour there. Players alternate; Red moves first.
- **A player loses the instant their colour contains a monochromatic `k`-term AP** (an AP among the
  indices that player's tokens occupy). Because every move *inserts* into the line, it **re-indexes both
  colours** — so a move can complete an AP in either player's colour, not only the mover's. Whoever owns
  the completed AP loses; if one move completes both colours' APs at once, the **mover** loses. (This
  shift-induced subtlety is a rules decision — see §8.)
- **Inputs:** `k` (AP length, default 3), an optional max line length (see §2 for why it is bounded),
  role/AI levels.

## 2. The maths (theory doc)

- **Why it always terminates.** The `L` placed tokens form a 2-colouring of the index set `{1…L}` (each
  index coloured by who placed it — an alternation-generated colouring, i.e. a *subset* of all
  2-colourings, which only makes the guarantee easier). By **van der Waerden**, every 2-colouring of
  `{1…W(2;k)}` contains a monochromatic `k`-AP, so by `L = W(2;k)` *someone* has already lost — the game
  cannot run past `W(2;k)` moves. `W(2;3)=9`, `W(2;4)=35` (semicolon = diagonal: 2 colours, length `k`).
- **Design consequence.** `k=3` is the sweet spot: the game is over within 9 tokens, small enough to
  **solve exactly** and to make crisp strategy lessons; `k=4` is huge (≤35) — offer it but warn the
  solver falls back to heuristic. This bound is itself the headline theory point.
- **Misère / avoidance game theory.** Unlike Maker–Breaker, both players avoid a structure → this is a
  *Sim-like* avoidance game; no Erdős–Selfridge shortcut. Values come from game-tree search; the
  report can tabulate first-player win/lose for small `k` and discuss the parity/strategy-stealing
  intuition (and why strategy stealing does *not* straightforwardly apply to a misère insertion game).

## 3. Engine model (pure, DOM-free)

```ts
type Owner = 'R' | 'B';
interface Config { k: number; maxLen: number; humanRole: Role; aiLevel: {R:AILevel; B:AILevel}; seed: number }
interface State {
  config: Config;
  line: Owner[];            // colours in left-to-right order (one per placed token)
  turn: Owner;              // whose move
  loser: Owner | null;      // who completed their own k-AP
  winner: Owner | null;     // the other player
  witness: number[] | null; // indices of the losing AP
}
newGame · legalMoves(s) → gaps {0..L} · applyMove(s, gap) · isOver(s) · goalText(c)
```

- A **move is a single gap index**; the colour is implied by `turn`. After inserting, **re-scan both
  colours** for a `k`-AP — insertion shifts every token right of the gap, so a move can push the
  *opponent's* tokens into an AP, not just the mover's (e.g. line `R B R B B`, Red inserts between
  positions 4 and 5 → Blue now sits at indices `{2,4,6}`, a 3-AP). The player owning a completed AP
  loses; the mover loses a simultaneous double. `O(L²)` per move (cheap at `L ≤ W(2;k)`).
- `maxLen` defaults to `W(2;k)` (9 for k=3) — a safety cap; the game provably ends by then.

## 4. AI (≥2 required; 4 shipped)

| Level | Strategy |
|-------|----------|
| 0 Easy | random legal gap (may even lose on purpose) |
| 1 Greedy | never play a gap that *immediately* completes your own `k`-AP if a safe gap exists; among safe gaps, prefer ones that shrink your opponent's set of safe replies (1-ply) |
| 2 Strong | depth-limited minimax (loss = −∞ for the mover); leaf eval = (#safe gaps you keep) − (#safe gaps opponent keeps) |
| 3 Solver | full minimax with memoised line states; **exact for `k=3`** (≤9 tokens) and small `k=4` openings, else falls back to Strong |

Default **Greedy**.

## 5. UI (3-pane arena layout)

- **Left (settings):** AP length `k`, role (Red / Blue / hotseat / watch-AI), per-side AI level,
  New / Undo / Run.
- **Centre (board):** the token line with **clickable gap carets** (you always insert *your* colour,
  so no palette needed); a turn pill ("Red to place" / "Blue to place"), an indicator of each colour's
  longest current run toward `k`, and the banner. On a loss the offending mono AP pulses in the loser's
  colour with a "Red built a 3-AP — Red loses" message.
- **Right (hints + explainers):** Hint (safe-move suggestion) + how-to + maths (the `W(2;k)`
  termination argument is the centrepiece explainer).

## 6. Arena integration

`src/games/vdw-duel/index.ts` → `GameModule`: `id:'vdw-duel'`, `title:'VdW Duel'`,
`tagline:'Don’t be the one who makes the progression'`,
`topic:'On-list · Van der Waerden game (KS #5)'`,
`blurb:'Two colours, one line. Each player drops their own tokens — and loses the moment they complete a monochromatic arithmetic progression.'`.
Standard `mount(slots)` returning `{ destroy }`; `makeRng` from `common/rng`; board CSS scoped under
`.game-vdw-duel`, keyframes prefixed `vdwDuel_`.

## 7. Tests

- **engine:** AP detection in **both** colours after a move (including an opponent AP created purely by
  the index shift — the `R B R B B` → `{2,4,6}` case), index-shift correctness, game terminates by
  `W(2;3)=9`, loser/winner assignment, witness indices.
- **ai:** greedy never self-completes a `k`-AP when a safe gap exists; solver verdict stable for a
  fixed `k=3` opening.
- **ui.smoke (jsdom):** mount, place via caret for both colours in hotseat, undo, destroy.
- **playthrough:** generic watch-AI test must end with a banner (someone always loses by `W(2;k)`).

## 8. Complexity, risks, open questions

- Misère insertion tree is modest for `k=3` (≤9 plies) → solver is genuinely exact, a nice contrast to
  the heuristic-only larger games. `k=4` blows up (≤35 plies) → cap + fallback, clearly flagged.
- **Rules decision to confirm with the instructor.** Because an insertion re-indexes the opponent, a move
  can complete the *opponent's* AP. We rule that whoever **owns** the completed AP loses (so a player may
  actively try to shove the opponent into one — a richer but well-defined reading). The PDF says only
  "the player who first forms a monochromatic AP loses" and is silent on shift-induced APs.
- Open question worth a sim table: with optimal play at `k=3`, does the **first or second player win**?
  (Likely a forced outcome on ≤9 tokens — compute and report it.)

## 9. Implementation plan

- **M0** engine: line + own-colour AP check + termination test.
- **M1** rules + AI (random/greedy/minimax) + `sim` first-player-outcome table.
- **M2** UI: line + gap carets + per-colour run indicator + banner.
- **M3** exact Solver for `k=3` + side/difficulty + hint/undo/watch-AI.
- **M4** explainers (`W(2;k)` bound), witness pulse, polish; register.
