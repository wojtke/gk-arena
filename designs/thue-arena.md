# Thue Arena — design document

A two-player word game with a *thinking* opponent: **Ann** builds a word avoiding repetitions,
**Ben** forces them — backed by an exact solver and an explanation mode that names the winning move.

> **Status: design.** A Python proof-of-concept exists at [../poc/poc1_thue_arena/](../poc/poc1_thue_arena/)
> (engine + 4 AI levels + self-play). Recommended build: a TypeScript + Vite app like
> [../arc-match/](../arc-match/) and [../builder-painter/](../builder-painter/), deployable like ThueOnline.

- **Course fit (on-list).** KS #2 (Thue online), KS #3 (nonrepetitive game), KS2 #2 (forbidden-`xx`).
- **Anchor papers.** Grytczuk, Kosiński, Zmarz — *How to play Thue games*, TCS 582 (2015), in
  `../../papers/from_professor/`; plus *Nonrepetitive games* (1103.3810), *Online version of the
  theorem of Thue* (1204.6687), *A new approach to nonrepetitive sequences* (1103.3809, entropy
  compression / LLL) in `../../papers/extra/`.
- **Reference app to extend:** <https://thueonline.github.io/>. **Proposal:**
  [../proposals/proposal-1-thue-arena.md](../proposals/proposal-1-thue-arena.md).

---

## 1. Mathematical background

- A **square** is a factor `XX` (e.g. `abab`); an **overlap** is a factor `aXaXa`. A word is
  **square-free** if it has no square factor.
- **Thue (1906):** arbitrarily long square-free words exist over a **3-letter** alphabet (2 letters
  is impossible). This is the seed of combinatorics on words.
- **"Trivial" repetitions** `aa` are sometimes excluded; an **abelian square** is `XY` with `Y` a
  permutation of `X`.
- **The game result (anchor):** in *How to play Thue games*, Ann (the avoider) has an **explicit
  strategy** to avoid nontrivial repetitions over a **9-letter** alphabet, and overlaps over a
  **4-letter** alphabet (optimal), *even when Ben may insert at arbitrary positions*. That explicit
  strategy is a real, provably-correct "perfect" AI for Ann's side.

## 2. Game rules

- **Thue online (primary).** A word is built left-to-right or by insertion. **Ben** picks an
  *insertion position*; **Ann** inserts a letter from the alphabet `[k]`. Ann wins if the word
  reaches length `n` while staying square-free (or nontrivial-repetition-free); Ben wins if a
  forbidden repetition appears.
- **Append-only nonrepetitive game.** Players alternately append one letter; one forces, one avoids.
- **Switches:** alphabet size `k`; target length `n`; repetition notion (square / nontrivial / overlap
  / abelian); who is human; who moves first (recommend the forcer, Ben, sets the challenge first).

## 3. Theory hooks (15-pt documentation)

1. **Thue's theorem** and the repetition threshold (square-free over 3, overlap-free over 2… the
   game raises these because of interaction).
2. **The explicit 9-letter strategy** — *implemented and demonstrated*: Level 3 routes Ann to the
   constructive 9-letter strategy of Theorem 2 (Grytczuk–Kosiński–Zmarz) for the **append
   nontrivial** game, a tier of AI that *provably* never loses for Ann at any length (see
   `explicitAvoiderMove` in `src/engine/ai.ts`, verified exhaustively and over long self-play in
   `tests/explicit.test.ts`). *Stretch goal:* the explicit **4-letter overlap** strategy
   (Theorem 3) is stated for the paper's *sparse* fixed-board game (the board is pre-split into
   length-2 segments and holes are filled in any order); it does not map onto this engine's
   left-to-right "Thue online" insertion model, so it is left as a stretch goal. In this engine's
   append + overlap mode the exact solver (small `n`) and minimax (large `n`) already keep Ann
   winning at `k = 4`.
3. **Entropy compression / Lovász Local Lemma** (the *new approach* paper) as the modern proof method.
4. **Computational result:** by exact solving + self-play, measure the *smallest alphabet* for which
   Ann/Ben wins for each `n`, and compare to the paper's bounds.

## 4. Core algorithms

- **Square / repetition detection.** A square has a period `p` with `w[i..i+p) = w[i+p..i+2p)`.
  Brute `O(n²)` checks all `(start, p)`; in the **online/append** setting only repetitions touching
  the new letter can appear, so per-move detection is `O(n)`–`O(n·√n)`.
- **Overlap** and **abelian-square** detectors (the latter via a sliding letter-count multiset).
- Legal-move generator (positions × letters).

## 5. AI (≥2 required; 4 shipped)

| Level | Strategy |
|-------|----------|
| 0 Easy | uniform random legal move |
| 1 Greedy | one-ply: avoid/force an immediate square; tie-break by counting safe replies |
| 2 Strong | bounded-depth minimax with the square-free test as terminal check + memoisation |
| 3 Optimal | exact retrograde solver (small `n`, both sides) / Ann's *proven* explicit 9-letter strategy on the append nontrivial game (any `n`, avoider side); minimax fallback for other large-`n` configs |

Feasibility: the square-free state space is small — ternary square-free words grow like ≈1.317ⁿ —
so exact solving is comfortable for `n ≲ 20–25`.

## 6. Architecture (TypeScript)

```
src/
├── engine/  types.ts · detectors.ts (square/overlap/abelian) · rules.ts · ai.ts
├── sim/     win-rate tables vs (alphabet, n); reproduces the 9-/4-letter thresholds
└── ui/      word tiles · letter palette · insertion carets · explanation mode
```
Pure engine (unit-tested, brute-force-checked detectors), thin UI, headless sim — same split as the
two built apps.

## 7. UI / UX

A row of **letter tiles** for the current word; a **palette** of the `k` letters; in online mode,
**insertion carets** between tiles (Ben clicks a caret → it highlights → Ann clicks a letter). When
a repetition forms, the two equal blocks **pulse**. **Explanation mode** shows the recommended move
and the square it creates/averts (the teaching feature that beats ThueOnline). Meter: current safe
length / target `n`; role + difficulty selectors; **Explainers** toggle.

## 8. Implementation plan

| Milestone | Deliverable |
|-----------|-------------|
| M0 | Engine: detectors (square/overlap/abelian) + move-gen + brute-force tests |
| M1 | AI L0–L2 + self-play sim (win-rate vs alphabet/n) |
| M2 | UI: word tiles, palette, online play, win highlight |
| M3 | L3 solver + the explicit 9-letter strategy (append nontrivial; 4-letter overlap sparse-model strategy is a stretch goal) + explanation mode |
| M4 | Variants (overlap/abelian), polish, AI-vs-AI viewer |
| M5 | Report (thresholds reproduced) + slides + Pages deploy |

## 9. Open items

- Which repetition notion is the default (square vs nontrivial vs overlap)?
- Exact roles / who moves first.
- Abelian mode in core or stretch.
