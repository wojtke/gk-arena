# Grasshopper — design document

A **forbidden-pattern game with a grasshopper** (*gra w zabronione wzorce z pasikonikiem*). The
**Builder** appends letters to a word; a **Grasshopper** hops forward over it, and only the letters it
**lands on** form the inspected word `S`. We implement the **avoidance form** (see §8): the
**Grasshopper** is the *forcer* — it hops to make a forbidden pattern (a square `xx`) appear in `S`;
the **Builder** is the *avoider* — it picks letters to keep `S` square-free and survive to length `d`.

> **Status: design only — not yet implemented.** Targets the arena (`src/games/grasshopper/`). Realises
> **KS2 #3 — Gra w zabronione wzorce z pasikonikiem**. The hop mechanic (the inspected word is a chosen
> *subsequence*, not the built word) is genuinely new and unlike anything currently in the arena.

- **Course fit (on-list, KS2).** KS2 #3. Related to thue-arena (squares / forbidden `xx`) but with the
  grasshopper twist; pairs naturally with KS2 #2 (plain forbidden patterns) and the `xᵏ` power option.

---

## 1. The game

- A word `W` is built by **appending to its end**. A **Grasshopper** sits on some index `p` of `W`
  (start: `p = -1`, "before" the word). The letters it has landed on, in order, form the **inspected
  word `S`**.
- **Each round has two steps:**
  1. **Builder (player 1)** appends the letters needed so the Grasshopper has somewhere to jump: it must
     be able to reach `p+1` *and* `p+2`. So it appends **`need = p + 3 − |W|` letters** (which is **2**
     when the Grasshopper is on the last letter, **1** when on the second-to-last) — choosing each
     letter from the alphabet `A`.
  2. **Grasshopper (player 2)** jumps forward by **+1 (adjacent)** or **+2 (skip one)** — never
     backward. It lands on `W[p+Δ]`, which is appended to `S`.
- **Win conditions (avoidance form — see §8).** The **Grasshopper (forcer) wins** the instant `S`
  contains the forbidden pattern (default a **square `xx`** — two equal adjacent blocks; optionally a
  general power `xᵏ`). The **Builder (avoider) wins** when `|S| = d` with no forbidden pattern.
- **Inputs:** alphabet size `|A|` (default 3 — squares are avoidable offline only for `|A| ≥ 3`),
  inspected-length target `d`, pattern power `k` (default 2 = square), role/AI levels.

## 2. The maths (theory doc)

- **Thue & nonrepetitive sequences.** Over `|A| ≥ 3` there exist arbitrarily long **square-free** words
  (Thue 1906); over 2 letters every word of length ≥ 4 has a square. The plain Thue game asks whether an
  *avoider* who controls the letters can dodge a square forever; over `|A| ≥ 3` it can.
- **The grasshopper twist (avoidance form).** Here the avoider is the **Builder**: it controls the
  letters but **not** which of them is judged. The **Grasshopper** (forcer) chooses **which subsequence
  (via `+1/+2` hops) becomes `S`** — so the Builder must keep *every* hop-reachable subsequence
  square-free, while the Grasshopper steers some reachable path into a repeat. This subsequence-choice
  power is strictly stronger than reading a fixed word, which is the novel combinatorial content.
- **Demo / open question.** What is the largest `d` the **Builder (avoider)** can guarantee square-free
  against perfect hopping? Can the Grasshopper force a square at all over `|A| = 3` (where a *static*
  Thue word would survive forever)? **Yes** — the `sim/` table shows the threshold sits at `|A| = 4`,
  not `|A| = 3`, which is the report's headline.

## 3. Engine model (pure, DOM-free)

```ts
type Phase = 'build' | 'hop';
interface Config { alpha:number; d:number; power:number; humanRole:Role; aiLevel:{B:AILevel;G:AILevel}; seed:number }
interface State {
  config: Config;
  word: number[];        // W, the built word (letters 0..alpha-1)
  pos: number;           // p, the Grasshopper's current index (start -1)
  inspected: number[];   // S, letters landed on (in order)
  phase: Phase;          // 'build' → Builder appends `need` letters; 'hop' → Grasshopper picks +1/+2
  needLeft: number;      // letters Builder still owes this round (counts down 1,0 or 2,1,0)
  winner: 'B' | 'G' | null;  // G(rasshopper) on a forced square · B(uilder) on square-free |S|=d
}
newGame · legalMoves(s) · applyMove(s, move) · isOver(s) · currentPlayer(s) · hasSquareSuffix(S, power) · goalText
```

- **Move** is a single number: in `build` a letter `0…alpha-1` (Builder appends one at a time until
  `needLeft = 0`, then phase → `hop`); in `hop` a step `1` or `2`.
- **Pattern check:** after each hop, test whether `S` *ends with* a `power`-th power (for squares: some
  suffix `XX`). Suffix check is `O(|S|²)`, trivial.
- **Compact state for search:** the value depends only on `(S, the committed-but-unreached lookahead
  letters W[p+1 … |W|-1], phase, needLeft)`; this tail is ≤ 2 letters, so positions memoise well even
  though `W` grows. The tail matters because after a **+1** hop the not-yet-reached letter at the old
  `p+2` becomes the new `p+1` — a still-landable lookahead. A letter **bypassed by a +2** hop, by
  contrast, is behind `p`; since hops are forward-only it can **never** be landed on again, so it is
  irrelevant to the value (and need not be kept).

## 4. AI (≥2 required; 4 shipped)

| Level | Builder (avoider) | Grasshopper (forcer) |
|-------|-------------------|-----------------------|
| 0 Easy | random letters | random legal hop |
| 1 Greedy | letters that keep **every** of the Grasshopper's reachable landings away from a near-square in `S` (when owing 2, make them different) | hop whose landed letter extends a near-square and leaves the opponent fewest safe replies |
| 2 Strong | depth-limited alpha-beta over (letters, hop) | same alpha-beta; leaf eval = (near-squares in `S`) − (progress toward the square-free target `d`) |
| 3 Solver | exact alpha-beta with memo on the compact state; exact for small `d`, else Strong | same |

Value convention: **Grasshopper wins +1, Builder wins −1**; the Grasshopper (forcer) maximises
square-risk, the Builder (avoider) minimises it. Default AI **Strong** (the greedy avoider is a weaker
1-ply heuristic; Strong/Solver play both sides competently).

## 5. UI (3-pane arena layout)

- **Left (settings):** alphabet size, inspected target `d`, pattern power `k` (xx / xxx …), role
  (Builder / Grasshopper / hotseat / watch-AI), AI levels, New/Undo/Run.
- **Centre (board):** the built word `W` as a row of letter tiles with a **🦗 grasshopper marker** on
  `pos`; in `build` phase the appended slots glow and a letter palette is shown; in `hop` phase two
  **landing targets (`+1`, `+2`)** are highlighted and clickable. Below, the **inspected word `S`** is
  shown as its own tile row (this is what's judged) with a meter `|S| / d`. Banner on a win:
  - square forced → *"Grasshopper wins — forced a square in the path 🎉"* (the completing square in
    `S` pulses);
  - `|S| = d` square-free → *"Builder wins — kept the path square-free to length d 🎉"*.
- **Right (hints + explainers):** Hint + how-to + maths (Thue + the grasshopper twist).

## 6. Arena integration

`GameModule`: `id:'grasshopper'`, `title:'Grasshopper'`,
`tagline:'Hop to force a square — or keep every path clean'`,
`topic:'On-list (KS2) · forbidden patterns with a grasshopper'`,
`blurb:'A builder appends letters trying to keep the path clean; a grasshopper hops over them, and only the letters it lands on are judged. Hop to force a square into that path — or build to dodge it forever.'`.
Standard `mount(slots)` → `{ destroy }`; `makeRng` from `common/rng`; CSS scoped `.game-grasshopper`,
keyframes `grasshopper_`.

## 7. Tests

- **engine:** `need`/`needLeft` accounting (1 vs 2 letters), `hasSquareSuffix` (incl. power `k`),
  hop `+1/+2` updates `pos`/`S`, **a +2-bypassed letter is never landed again (forward-only) while an
  un-reached lookahead letter stays landable next round**, `isOver` plus the flipped terminals
  (square ⇒ Grasshopper win; square-free `|S|=d` ⇒ Builder win).
- **ai:** greedy Grasshopper (forcer) takes a hop that completes a square when one is reachable; greedy
  Builder (avoider) appends a letter that keeps `S` square-free when one exists; the Grasshopper wins
  when the Builder is forced into a repeat (`|A|=1`); solver value stable for a fixed tiny `(|A|,d)`;
  the guaranteed-`d` table is non-constant (2, 4, then unbounded across `|A| = 2,3,4`).
- **ui.smoke (jsdom):** mount, a full build→hop round, both palette and hop-target clicks, undo, destroy.
- **playthrough:** generic watch-AI completion (square forced or `|S|=d`).

## 8. Complexity, risks, open questions

- The two-letter build sub-move (`|A|²` options when `need=2`) plus hop branching keeps the tree larger
  than thue-arena's; cap the solver by `d` and the lookahead, fall back to Strong.
- **Win-direction is degenerate in the literal KS2 #3 — we deviate (FLAG FOR THE INSTRUCTOR).** Read
  literally, the side that *chooses the letters* (the Builder) also *wins on the pattern*. But then the
  Builder simply makes the two letters it owes equal whenever it owes two, and the Grasshopper — which
  only picks *which* position, never *which letter* — can never avoid a square: the Builder forces `xx`
  at `|S| = 2` for **every** alphabet size. The solver/sim confirm this (guaranteed `d = 1` for all
  `|A|`); it is not a game. We therefore implement the **avoidance form**: the **Builder avoids** the
  pattern (wins by reaching square-free length `d`) and the **Grasshopper forces** it (wins on a square).
  Same actors, same hop/build mechanics — only the win-direction flips. This restores two-sided agency:
  when the Builder owes two letters it makes the two landable letters *different*, so the Grasshopper
  cannot always repeat and must manoeuvre to force a square.
- **What the avoidance form yields (the real, non-constant table).** Exact solver, square mode:
  the Builder's guaranteed square-free length is `d* = 2` for `|A| = 2`, `d* = 4` for `|A| = 3`, and
  **unbounded for `|A| ≥ 4`** — so the optimal winner genuinely depends on `(|A|, d)`. Note the
  *threshold is `|A| = 4`, not `|A| = 3`*: unlike plain Thue (a *static* word over 3 letters stays
  square-free forever), the Grasshopper's freedom to **choose the subsequence** is strictly stronger, so
  over 3 letters it can still force a square (from `d = 5`). That gap is the report's novel content.
- Rules ambiguity worth pinning with the instructor: does `S` include the *first* landed letter from
  `p=-1`, and does the Builder choose freely or is the very first letter fixed? Design assumes Builder
  chooses all letters and `S` starts empty. Flag in the explainer.
- Open: how the Builder's guaranteed `d` scales with `|A| ≥ 4` (a lower bound only — capped at `dmax`
  in the sim), and the exact threshold/structure of the `|A| = 3` forced square.

## 9. Implementation plan

- **M0** engine: build/hop loop + `need` accounting + square-suffix check + tests.
- **M1** AI (random/greedy/strong) + `sim` guaranteed-`d` table.
- **M2** UI: `W` row + grasshopper marker + landing targets + `S` row + meter/banner.
- **M3** memoised Solver + difficulty/side + hint/undo/watch-AI.
- **M4** explainers, square pulse in `S`, polish; register.
