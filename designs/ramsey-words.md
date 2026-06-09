# Ramsey Words — design document

An **online Ramsey-on-words game**. All words of length `l` over an alphabet `A` are pre-coloured with
`c` colours. Two players grow a word by insertion; the **Constructor** tries to force **two adjacent
length-`l` blocks of the same colour**, the **Avoider** tries to reach length `n` without one.

> **Status: design only — not yet implemented.** Targets the arena (`src/games/ramsey-words/`).
> Realises **KS #10 — Ramsey na słowach online**. New mechanic (a fixed colouring of `l`-grams +
> adjacent-block matching); unrelated to the graph Ramsey game in **builder-painter** (KS #11).

- **Course fit (on-list).** KS #10 exactly. Same Pointer/insert interaction family as thue-arena and
  vdw-online, but the *target* is a Ramsey-type monochromatic adjacency on words.

---

## 1. The game

- A fixed **colouring** `χ : Aˡ → {0…c-1}` of every length-`l` word is chosen up front (random with a
  seed, or a built-in preset).
- A word `w` grows one letter per round. **Round:** the **Constructor** (player 1) points at a gap
  `g ∈ {0…|w|}`; the **Avoider** (player 2) inserts a chosen letter `a ∈ A` there.
- **Constructor wins** the instant `w` contains **two adjacent length-`l` blocks of equal colour** —
  i.e. some `i` with `χ(w[i … i+l-1]) = χ(w[i+l … i+2l-1])`. *Example (`l=2`, `ab` and `bc` both red):*
  the factor `abbc` is a Constructor win.
- **Avoider wins** when `|w| = n` with no such monochromatic adjacent pair.
- **Inputs:** `|A|` (alphabet size, default 2–3), `l` (block length, default 2), `c` (colours, default
  2), `n` (target length), `seed` (for the random colouring). *(The KS #10 sheet names the colour count
  `k`; it is renamed `c` here to avoid clashing with the AP length `k` used by the VdW games.)*

## 2. The maths (theory doc)

- This is a **Ramsey-type / colouring** game on words, in the **Hales–Jewett / Ramsey** circle. Whether
  long words are *forced* to contain two same-coloured adjacent `l`-blocks **depends on `(|A|, l, c)` —
  it is NOT unconditional.** Counter-example: `l=1`, `c=|A|`, `χ` = identity makes "same-coloured
  adjacent blocks" mean "two equal adjacent letters", which `abab…` avoids forever, so the Avoider
  survives every `n`. The game explores exactly the boundary between forceable and avoidable; termination
  is guaranteed only by the **hard `n` cap**, not by inevitability.
- **When is the Avoider squeezed?** With `c` small relative to the number of distinct adjacent `l`-block
  pairs, the supply of "fresh" continuations shrinks and the Constructor gains; with `c` large (or a
  friendly `χ`) the Avoider reaches `n`. The `sim/` sweep over `(|A|, l, c)` and over random `χ` seeds
  maps this — for many seeds the Avoider wins for *all* `n`, which is itself the reportable finding.
- The colouring being **fixed in advance** (and possibly random) is the key wrinkle: the Avoider must
  reason about `χ`, not just letters. Report can sweep "survivable `n`" vs `(|A|, l, c)` for random `χ`.

## 3. Engine model (pure, DOM-free)

```ts
interface Config { alpha:number; l:number; c:number; n:number; seed:number; humanRole:Role; aiLevel:{C:AILevel;A:AILevel} }
interface State {
  config: Config;
  coloring: Uint8Array;     // χ as a flat table indexed by the base-|A| value of the l-gram (length alpha^l)
  word: number[];           // letters 0..alpha-1
  phase: 'point' | 'insert';
  gap: number | null;
  winner: 'C' | 'A' | null; // Constructor or Avoider
  witness: { i: number; color: number } | null;  // start of the first monochromatic adjacent pair
}
newGame(config)  // builds χ from seed (or a preset); buildColoring(alpha,l,c,seed)
legalMoves · applyMove · isOver · currentPlayer · colorOf(word,i,l,χ) · goalText
```

- `χ` is a table of size `|A|ˡ` (keep `|A|ˡ ≤ ~256` → tiny `Uint8Array`); `colorOf` reads the `l`-gram
  starting at `i` as a base-`|A|` index. **`buildColoring(alpha,l,c,seed)` is fully specified:** draw one
  value per entry in ascending index order from a single `makeRng(seed)` stream — `for idx in 0…αˡ-1:
  χ[idx] = floor(rng()*c)` — so a given `(α,l,c,seed)` always reproduces the same χ (and matches the UI
  legend). A **preset** instead installs a hand-built χ (used by the `abbc` test). **Win check:** after
  each insert scan `i = 0 … |w|-2l` and compare `χ` of the two adjacent blocks; `O(|w|·l)`.
- Insertion can change many overlapping `l`-grams at once → re-scan the affected window (full scan is
  cheap at game sizes; correctness-first).

## 4. AI (≥2 required; 4 shipped)

| Level | Constructor (forcer) | Avoider |
|-------|----------------------|---------|
| 0 Easy | random gap | random legal letter |
| 1 Greedy | gap where the Avoider has the *fewest* letters that dodge a same-colour adjacency (1-ply) | letter that avoids creating a monochromatic adjacent pair and minimises near-misses |
| 2 Strong | depth-limited alpha-beta over (gap, letter) | alpha-beta; leaf eval counts adjacent block pairs one letter from matching colour |
| 3 Solver | exact alpha-beta with memoised (word) states for small `n`, else Strong | same |

Default **Greedy**. The colouring `χ` is part of the (immutable) state, so memo keys are just the word.

## 5. UI (3-pane arena layout)

- **Left (settings):** alphabet size, block length `l`, colours `c`, target `n`, **colouring seed** (+ a
  "reroll χ" button and a preset dropdown), role, AI levels, New/Undo/Run.
- **Centre (board):** the word as letter tiles; a faint **coloured underline under every length-`l`
  block** shows `χ` of that block, so players can *see* the colouring as the word grows (this makes the
  Ramsey condition tangible). Point-phase carets + insert-phase letter palette (reuse thue-arena /
  twin-hunter widgets). Turn pill, length meter, banner; on a Constructor win the two matching adjacent
  blocks pulse in their shared colour.
- **Right (hints + explainers):** Hint + how-to + maths; a small "current colouring" legend mapping a
  few example `l`-grams → colour.

## 6. Arena integration

`GameModule`: `id:'ramsey-words'`, `title:'Ramsey Words'`,
`tagline:'Force two same-coloured adjacent blocks'`,
`topic:'On-list · Ramsey on words online (KS #10)'`,
`blurb:'Every length-l block has a fixed colour. One player forces two same-coloured blocks side by side; the other dodges to the target length.'`.
Standard `mount(slots)` → `{ destroy }`; `makeRng` from `common/rng` (also seeds χ); CSS scoped
`.game-ramsey-words`, keyframes `ramseyWords_`.

## 7. Tests

- **engine:** `buildColoring` deterministic for a seed; `colorOf` base-`|A|` indexing; win detection on
  the `abbc` example **using a crafted preset χ with `χ('ab')=χ('bc')`** (a random χ would not guarantee
  it) plus negatives; insertion re-scan correctness; `isOver`/length-`n` Avoider win.
- **ai:** greedy Avoider never plays a letter that creates a monochromatic adjacency when a safe letter
  exists; solver stable for a fixed seed + tiny `n`.
- **ui.smoke (jsdom):** mount, reroll χ, a point→insert round, hint/undo, destroy.
- **playthrough:** generic watch-AI completion (ends in a win or reaches `n`).

## 8. Complexity, risks, open questions

- Keep `|A|ˡ` small (≤256) so χ is a tiny table and the underline overlay is readable. Larger `l`
  explodes the colouring and the UI — cap `l ≤ 3`, `|A| ≤ 4`.
- With a *random* χ the game can be near-trivial or near-impossible for some seeds → expose the seed and
  a "balanced preset" so demos are fair; report the distribution of outcomes over seeds.
- Open: survivable-`n` table vs `(|A|,l,c)` for random χ — novelty for the report.

## 9. Implementation plan

- **M0** `buildColoring` + `colorOf` + win detection + tests.
- **M1** rules (two-phase) + AI (random/greedy/strong) + `sim` survivable-`n` sweep.
- **M2** UI: word tiles + per-block colour underline + carets/palette + meter/banner.
- **M3** Solver + difficulty/side + reroll-χ/preset + hint/undo/watch-AI.
- **M4** explainers + colouring legend + witness pulse, polish; register.
