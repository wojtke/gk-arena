# Different Blocks — design document

A **"different blocks" game** (*gra w różne bloczki*). Online insertion: a **Constructor** points at a
slot, an **Avoider** inserts a letter. The Constructor wants **`k` equal-length adjacent blocks among
which two are identical**; the Avoider wants every such run of `k` blocks to be **pairwise different**.

> **Status: design only — not yet implemented.** Targets the arena (`src/games/different-blocks/`).
> Realises **KS2 #5 — Gra w różne bloczki**. It **generalises the square game**: at `k = 2` the bad
> pattern "two adjacent equal-length blocks that are equal" is exactly a **square `XX`** (so it
> coincides with thue-arena's square mode); the default `k = 3` is the new content.

- **Course fit (on-list, KS2).** KS2 #5. Same Pointer/insert interaction as thue-arena & twin-hunter;
  the *target structure* (k consecutive equal-length blocks with a repeat) is what's new.

---

## 1. The game

- A word `w` grows one letter per round. **Round:** the **Constructor** (player 1) points at a gap
  `g ∈ {0…|w|}`; the **Avoider** (player 2) inserts a chosen letter `a ∈ A` there.
- A **bad configuration** is a contiguous stretch of **`k` blocks, each of the same length `m ≥ 1`**
  (so `k·m` consecutive letters `w[s … s+km-1]` split into `B_0,…,B_{k-1}` with `|B_j| = m`), in which
  **two of the blocks are identical** (`B_i = B_j`, `i ≠ j`).
- **Constructor wins** the instant any bad configuration exists (any start `s`, any block length `m`).
- **Avoider wins** when `|w| = n` and every run of `k` equal-length adjacent blocks is pairwise distinct.
- **Inputs:** alphabet size `|A|`, blocks `k` (default 3; `k = 2` reproduces the square game), target
  length `n`, role/AI levels.

## 2. The maths (theory doc)

- **From squares to `k`-block repeats.** A square is `k = 2`. For `k = 3` the forbidden structure is
  three equal-length adjacent blocks with a repeat — e.g. for length-1 blocks, an `m=1` triple is *safe*
  only if all three letters differ (`abc`), whereas `aab`, `aba`, `baa` all lose (two of the three
  single-letter blocks coincide). For `|A|=2` no three letters can be pairwise distinct, so every triple
  loses by pigeonhole. So **small `|A|` makes `k`-block repeats trivially forced** — interesting play
  needs `|A| ≥ k` (enough letters that `m=1` blocks can be pairwise distinct).
- **Connection to nonrepetitive / Thue theory.** "`k` adjacent blocks all pairwise different" is a
  *rainbow*-flavoured strengthening of square-freeness; avoiding it over a fixed alphabet is a Thue-type
  question. The online game version (Constructor forces it) has no published threshold table → novelty.
- **Demo.** Slide `|A|` and `k`: at `|A| = k` the Avoider is squeezed (only `k!`-ish distinct `m=1`
  runs); raise `|A|` to give the Avoider room. The `m=1` case alone (k distinct adjacent letters) is a
  clean first lesson before general `m`.

## 3. Engine model (pure, DOM-free)

```ts
interface Config { alpha:number; k:number; n:number; humanRole:Role; aiLevel:{C:AILevel;A:AILevel}; seed:number }
interface State {
  config: Config;
  word: number[];           // letters 0..alpha-1
  phase: 'point' | 'insert';
  gap: number | null;
  winner: 'C' | 'A' | null; // Constructor or Avoider
  witness: { start:number; m:number; i:number; j:number } | null; // the two equal blocks B_i=B_j
}
newGame · legalMoves · applyMove · isOver · currentPlayer · findBadConfig(word,k) · goalText
```

- **Move** is a single number (gap in `point`, letter in `insert`) — identical interaction to
  twin-hunter; reuse its caret/palette UI.
- **`findBadConfig`:** for each block length `m = 1 … ⌊|w|/k⌋` and each start `s` with `s + k·m ≤ |w|`,
  compare the `k` blocks for a duplicate. A plain element-compare is `≈ O(|w|³/k)` (each `(m,s)` costs
  `O(k·m)`); rolling/precomputed hashes bring it to `≈ O(|w|²/k)`. Either is cheap at game sizes — ship
  the plain compare first (correctness), optimise only if needed. Return the first duplicate pair for
  the highlight.

## 4. AI (≥2 required; 4 shipped)

| Level | Constructor (forcer) | Avoider |
|-------|----------------------|---------|
| 0 Easy | random gap | random legal letter |
| 1 Greedy | gap where the Avoider has the fewest letters that keep all `k`-block runs distinct (1-ply) | letter that creates no bad config and minimises "near-repeats" (k-block runs with two blocks one letter from equal) |
| 2 Strong | depth-limited alpha-beta over (gap, letter) | alpha-beta; leaf eval counts near-repeat `k`-block runs by closeness |
| 3 Solver | exact alpha-beta with memo on `word`, exact for small `n`, else Strong | same |

Default **Greedy**. Cross-check: at `k = 2` the engine must agree with an **inlined square oracle** (a
self-contained known-squares list — *not* an import of thue-arena, per the no-cross-game-import rule).

## 5. UI (3-pane arena layout)

- **Left (settings):** alphabet size, blocks `k`, target `n`, role (Constructor / Avoider / hotseat /
  watch-AI), AI levels, New/Undo/Run.
- **Centre (board):** the word as letter tiles + point-phase carets / insert-phase palette (reuse
  twin-hunter widgets); turn pill; length meter `|w| / n`; banner. On a Constructor win the two equal
  blocks `B_i`, `B_j` (and the `k`-block run containing them) are boxed/pulsed so the repeat is obvious.
- **Right (hints + explainers):** Hint + how-to + maths (squares → `k`-blocks; why `|A| ≥ k`).

## 6. Arena integration

`GameModule`: `id:'different-blocks'`, `title:'Different Blocks'`,
`tagline:'k adjacent blocks, all distinct'`,
`topic:'On-list (KS2) · different blocks'`,
`blurb:'Generalises the square game: one player forces k equal-length adjacent blocks with a repeat among them; the other keeps every such run all-different.'`.
Standard `mount(slots)` → `{ destroy }`; `makeRng` from `common/rng`; CSS scoped `.game-different-blocks`,
keyframes `differentBlocks_`.

## 7. Tests

- **engine:** `findBadConfig` for `m=1` (k equal-length single letters with a repeat) and `m≥2`;
  negatives (all distinct); `k=2` equals square detection (cross-check vs a known square list);
  `applyMove`/phase/`isOver`/`|w|=n` Avoider win; witness `(start,m,i,j)` correct.
- **ai:** greedy Avoider never plays a letter that creates a bad config when a safe letter exists;
  solver value stable for a tiny `(|A|,k,n)` seed; `k=2` engine parity with the inlined square oracle
  (no thue-arena import).
- **ui.smoke (jsdom):** mount, a point→insert round that lands, hint/undo, destroy.
- **playthrough:** generic watch-AI completion.

## 8. Complexity, risks, open questions

- Keep `|A| ≥ k` by default (else the game is trivially Constructor-won by pigeonhole) — enforce a
  sensible minimum in the settings and explain why.
- `findBadConfig` is the hot path; plain compare is fine for game sizes, but document the rolling-hash
  optimisation for larger `n`.
- Open: survivable-`n` table vs `(|A|, k)` for the online forcing game — novelty for the report.

## 9. Implementation plan

- **M0** `findBadConfig` (m=1 then general) + `k=2`==square cross-check + tests.
- **M1** rules (two-phase) + AI (random/greedy/strong) + `sim` survivable-`n` sweep.
- **M2** UI: word tiles + carets/palette + meter/banner + block-repeat highlight.
- **M3** Solver + difficulty/side + hint/undo/watch-AI.
- **M4** explainers, polish; register.
