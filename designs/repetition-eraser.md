# Repetition Eraser — design document

A dynamic word game: players alternately **append** a letter; whenever a repetition `XX` forms, the
second copy is **erased**. One player wants the word to reach length `d`; the other wants to keep it
short until the round limit runs out. The board *grows and shrinks*.

> **Status: design (no POC yet).** Recommended build: TypeScript + Vite, like
> [../arc-match/](../arc-match/) and [../builder-painter/](../builder-painter/).

- **Course fit (on-list).** KS #1 / KS2 #8 (repetition-erasing game).
- **Anchor paper.** Grytczuk & Stankiewicz, *Square-free reducts of words* (arXiv:2011.12822, 2020)
  — indexed in `../../papers/extra/ARXIV-INDEX.md` (download for the lit review). **Proposal:**
  [../proposals/proposal-4-repetition-eraser.md](../proposals/proposal-4-repetition-eraser.md).

---

## 1. Mathematical background

- A **square** is a factor `XX`. The **square-free reduct** of a word is obtained by repeatedly
  deleting the repeated block of a square until none remains (Grytczuk–Stankiewicz study when this is
  well-defined and what reducts are reachable).
- **Key invariant for the game:** because squares are erased as soon as they form, the word is
  **square-free between moves**. So appending one letter can only create a square that **ends at the
  new last position** — which is exactly why a cheap *suffix* check suffices.
- One append may create **nested** squares; erasure must **iterate** until the suffix is square-free.

## 2. Game rules

- **Inputs:** alphabet `[k]`; target length `d`; round limit `R`; a fixed deterministic erasure rule.
- **Erasure rule (default):** after appending, find the **shortest** square ending at the last
  position, erase its second half, and **repeat** until no suffix square remains.
- **Round:** the active player appends one letter → erasure resolves → check end conditions.
- **Win:** the **maximiser** wins if the word reaches length `d`; the **minimiser** wins if the round
  limit is exhausted with the word still shorter than `d`.

## 3. Theory hooks (15-pt documentation)

1. **Square-free reducts** and the erasure dynamic; the **square-free-between-moves invariant** and
   its proof (the reason suffix detection is correct).
2. **Reachable lengths / game value:** can the maximiser force length `d` within `R` rounds? Measure
   it by exact solving for small instances and by self-play for larger ones.
3. The grow/shrink process as a **state machine** on square-free words (links to the reduct poset).

## 4. Core algorithms

- **Suffix-square detection:** for each half-length `h = 1 … ⌊n/2⌋`, test `w[n-2h … n-h) =
  w[n-h … n)`; take the smallest such `h`. `O(n²)` worst case, typically far less.
- **Erase + iterate:** remove the second half, then re-test the (shorter) suffix until clean.
- Move generation is trivial (any of `k` letters); the interest is in the resulting length.

## 5. AI (4 levels)

| Level | Strategy |
|-------|----------|
| 0 Easy | random letter |
| 1 Greedy (max) | pick the letter giving the **largest** resulting length after erasure |
| 1 Greedy (min) | pick the letter that **maximises immediate erasure** / sets up future erasures |
| 2/3 Search | depth-limited minimax over the word state (small `k`, short `R`) → exact for small instances |

## 6. Architecture (TypeScript)

```
src/
├── engine/  types.ts · eraser.ts (append + iterated suffix-square erase) · rules.ts · ai.ts
├── sim/     avg max length, P(reach d), strategy comparison, length-over-time series
└── ui/      word tiles · length meter · round counter · erase animation · length chart
```

## 7. UI / UX

The word as **letter tiles** with a **length meter** and **round counter**. The signature visual:
when a repetition is erased, the removed tiles **slide off** and the word visibly shrinks — a tactile
tug-of-war. A live **length-over-time chart** shows the bouncing length. Role + difficulty selectors;
**Explainers** toggle that states the erasure rule and the square-free invariant.

## 8. Implementation plan

| Milestone | Deliverable |
|-----------|-------------|
| M0 | Engine: append + iterated suffix-square erase + tests (erasure, nesting, winner, seeded sims) |
| M1 | AI (random, greedy max/min, small minimax) + sim + length-over-time series |
| M2 | UI: tiles, meters, the erase animation, length chart |
| M3 | Modes / extensions (alternative erasure rules: shortest vs longest) |
| M4 | Polish, AI-vs-AI viewer |
| M5 | Report (invariant proof + experiments) + slides + deploy |

## 9. Open items

- **Confirm the erasure rule** with the instructor (shortest vs longest suffix square; iterate to
  clean) — it must be pinned down to make the game deterministic and testable.
- Round-limit vs move-limit framing.
- Download the anchor paper (2011.12822) into `../../papers/extra/`.
