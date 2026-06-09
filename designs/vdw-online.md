# VdW Online — design document

An **online Van der Waerden game**: a **Pointer** chooses *where* the next token goes in a growing
line; a **Painter** chooses *which colour* it gets. Pointer tries to force a monochromatic arithmetic
progression; Painter tries to survive to length `n`.

> **Status: implemented** (`src/games/vdw-online/`). Now covers **both KS #4 and KS #7**: the engine uses
> a per-colour target vector, and a **diagonal / off-diagonal Targets toggle** switches between a single
> shared `k` (KS #4) and per-colour `k_i` (KS #7) — see [vdw-offdiagonal.md](vdw-offdiagonal.md), now
> merged in. The model is *online insertion + adversarial colouring* (Pointer picks the slot, Painter
> the colour) — distinct from the Maker–Breaker `mb-vdw`.

- **Course fit (on-list).** KS #4 exactly. Sibling of **vdw-offdiagonal** (KS #7, per-colour target
  lengths) and the misère **vdw-duel** (KS #5). Shares the AP-detection maths with builder-painter
  but neither its rules nor its engine.

---

## 1. The game

- A line of coloured tokens grows one token per round. The tokens are read left-to-right; their
  **positions are the line indices `1…L`** (NOT fixed integers — inserting a token shifts the indices
  of everything to its right). This is what "online" means here.
- **Round:** the **Pointer** (player 1) picks a *gap* `g ∈ {0…L}` (before all, between two tokens, or
  after all); the **Painter** (player 2) places a token of a chosen colour `c ∈ {0…r-1}` into that gap.
- **Pointer wins** the instant the line contains a **monochromatic arithmetic progression of length
  `k`** — `k` indices `i, i+d, …, i+(k-1)d` all holding the same colour.
- **Painter wins** when `n` tokens have been placed with no monochromatic `k`-AP.
- **Inputs:** `r` (colours, default 2), `k` (AP length, default 3), `n` (token budget, default ~18).

> **Source typo to flag:** the KS #4 sheet says "*if it fails and n tokens are placed, **player one**
> wins*", duplicating player 1 as the winner of both outcomes. By analogy with every other avoidance
> topic (Thue online etc.) the avoider — **Painter / player 2** — wins at length `n`. We implement the
> sensible rule and note the typo in the explainer.

## 2. The maths (theory doc)

- **Van der Waerden's theorem** guarantees that for any `r, k` there is `W(r;k)` (semicolon = the
  *diagonal* number: `r` colours, common length `k`) such that every `r`-colouring of `{1…W}` contains a
  monochromatic `k`-AP. So with enough tokens the Pointer can always eventually win the *offline*
  problem; the game asks whether the Pointer can **force** it online and **how fast**, and whether the
  Painter can stretch to `n < W`.
- This is the **online / adaptive** form (cf. Beck's *Positional Games*, and the Builder–Painter
  online framework): the board is revealed adaptively, so the clean Erdős–Selfridge potential of the
  fixed-board game does **not** transfer directly. The Painter's heuristic is an ES-flavoured
  potential over *currently live* APs (see §4), used as a guide rather than a theorem.
- **Headline numbers / demo.** `W(2;3) = 9`: any 2-colouring of indices `1…9` has a mono 3-AP, so at
  `k=3, r=2` the Painter can never *survive* to `n ≥ 9`. This offline bound applies to the online game
  too — the **final** board is just some 2-colouring of `n` indices regardless of insertion order; what
  `W` does *not* give is the Pointer's **forcing length** (the moves needed against best play), which is
  the actual question. `W(2;4)=35`, `W(3;3)=27` — keep `n` well below `W` so the Painter has a real
  chance and the knife-edge is visible by sliding `n`.

## 3. Engine model (pure, DOM-free)

```ts
type Color = number;                 // 0..r-1
type Phase = 'point' | 'paint';
interface Config { r: number; k: number; n: number; humanRole: Role; aiLevel: {P:AILevel; A:AILevel}; seed: number }
interface State {
  config: Config;
  line: Color[];                     // colours in left-to-right order; positions are indices
  phase: Phase;                      // 'point' → Pointer picks gap; 'paint' → Painter picks colour
  gap: number | null;                // the gap the Pointer selected, awaiting a colour
  winner: 'P' | 'A' | null;          // Pointer or Avoider(Painter)
  witness: number[] | null;          // the indices of the completing mono AP (for highlight)
}
newGame(config) · legalMoves(s) · applyMove(s, move) · isOver(s) · currentPlayer(s) · goalText(c)
```

- **Move** is a single number: a *gap* in the point phase, a *colour* in the paint phase (mirrors
  twin-hunter's two-phase point/insert flow — reuse that UI pattern).
- **Win detection** after each paint: scan all `(start, step)` with `start + (k-1)·step ≤ L`; report
  the first all-equal-colour AP. `O(L²·k)` per move, trivial for game-sized `L`.
- **Guards / edge cases:** require `k ≥ 2` (`k=1` would make every single token a trivial AP) and
  `n ≥ k`; the empty line renders a single gap-0 caret (mirroring twin-hunter's empty-sequence case).

## 4. AI (≥2 required; 4 shipped)

| Level | Pointer (forcer) | Painter (avoider) |
|-------|------------------|-------------------|
| 0 Easy | random legal gap | random colour |
| 1 Greedy | gap that maximises Painter's *minimum* over colours of "danger" (forces a bad colour) | colour minimising the longest mono run / number of length-`(k-1)` mono APs extendable to `k` |
| 2 Strong | depth-limited alpha-beta over (gap, colour) plies | same alpha-beta; leaf eval = ES-style potential `Φ = Σ_live-AP r^{-(k - filled)}` |
| 3 Solver | full alpha-beta with memoised line states; exact for small `n` (≤ ~12), else falls back to Strong | same |

Default level **Greedy** so a first game is winnable by a human on either side.

## 5. UI (3-pane arena layout)

- **Left (settings):** colours `r`, AP length `k`, token budget `n`, role (Pointer / Painter / hotseat
  / watch-AI), per-side AI level, New / Undo / Run.
- **Centre (board):** the line of tokens as coloured chips with index labels; in the *point* phase the
  **gaps are clickable carets** (reuse twin-hunter's caret row); in the *paint* phase a small colour
  palette appears. A turn pill ("Pointer to place a gap" / "Painter to colour"), a meter
  `length / n`, and the win/loss banner. On a Pointer win the witnessing AP chips pulse.
- **Right (hints + explainers):** a Hint button (suggests the level-2 move) + how-to + the maths card.

## 6. Arena integration

`src/games/vdw-online/index.ts` exports a `GameModule`:
`id:'vdw-online'`, `title:'VdW Online'`, `tagline:'Force a monochromatic progression'`,
`topic:'On-list · Van der Waerden online (KS #4)'`,
`blurb:'A Pointer chooses where each token goes; a Painter colours it. Force — or dodge — a monochromatic arithmetic progression.'`.
`mount(slots)` follows the established pattern (inject SETTINGS/BOARD/SIDEBAR, wire by id, return
`{ destroy }` clearing the AI timer). `makeRng` from `common/rng`. Board CSS scoped under
`.game-vdw-online`, keyframes prefixed `vdwOnline_`.

## 7. Tests

- **engine:** AP detection (positive/negative incl. step>1 and wrap-free), index-shift on insertion,
  `applyMove` phase transitions, `isOver`/winner, "Painter cannot exceed `W(2;3)=9` at `k=3,r=2`".
- **ai:** greedy never hands the Pointer an immediate win when a safe colour exists; solver result is
  stable for a fixed seed on a tiny instance.
- **ui.smoke (jsdom):** mount into slots, point→paint a token lands, hint/undo, destroy.
- **playthrough:** covered by the arena's generic watch-AI-to-completion test.

## 8. Complexity, risks, open questions

- Insertion makes the state a *sequence*, not a fixed board → larger tree than builder-painter; cap
  the solver by `n` and free-token count, fall back to Strong (same discipline as twin-hunter).
- Open: tightest *forcing length* `f(r,k)` (moves Pointer needs vs best Painter) — produce a small
  table in `sim/` (this is the report's novelty, like builder-painter's threshold sweep).

## 9. Implementation plan

- **M0** engine: line model + AP detection + brute-force tests.
- **M1** rules (two-phase) + AI (random/greedy/potential) + `sim` forcing-length table.
- **M2** UI: token line + caret gaps + colour palette + meter/banner.
- **M3** alpha-beta Solver + difficulty/side selection + hint/undo/watch-AI.
- **M4** explainers, witness highlight, polish; wire into the registry.
