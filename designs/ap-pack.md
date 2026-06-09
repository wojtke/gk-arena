# AP-Pack — design document

A packing game on a strip: players place disjoint **shifted copies of arithmetic progressions**
(evenly-spaced "comb" tiles) — PackIt, but the tiles are APs instead of rectangles.

> **Status: design (no POC yet).** Recommended build: TypeScript + Vite, like
> [../arc-match/](../arc-match/). ⚠ **Off-list topic — needs instructor sign-off.**

- **Course fit.** Off the KS/KS2 list (it's packing/optimisation), but "along the lines" three ways:
  it **mirrors the PackIt example app** the professor linked, shares the **arithmetic-progression**
  theme with the official Van der Waerden topics (KS #4/#5), and implements his **newest** paper.
- **Anchor paper.** Alon, Dębski, Grytczuk, Przybyło — *Packing arithmetic progressions*
  (2603.02786, 2026), **downloaded** in `../../papers/extra/`.
- **Reference app (the professor's example):** <https://packit.surge.sh/> + its paper
  arXiv:2403.12195 (Garrison, Heule, Subercaseaux — **not** Grytczuk). **Proposal:**
  [../proposals/proposal-6-ap-pack.md](../proposals/proposal-6-ap-pack.md).

---

## 1. Mathematical background

- Each progression `A_d` is an initial segment of `{d, 2d, 3d, …}` (e.g. `A_3 = {3,6,9,12}`).
- A **shifted copy** translates `A_d` to any offset along the line.
- For a family `F = {A_{d₁}, …}`, `m(F)` = the **minimum interval length** holding pairwise
  **disjoint** shifted copies of all members. Grytczuk et al. prove `m(F) = Θ(n^{3/2}/ln n)` when the
  progressions are bounded by `n`, and `Θ(n³/ln n)` when all have size `n`.

## 2. Game / app modes

- **Solo puzzle (the core).** Given a family `F`, pack all copies disjointly into the **shortest**
  interval (approach `m(F)`); the app scores you against the optimum.
- **Two-player packing (normal play).** Players alternately drop a shifted AP-copy (choose difference
  `d`, length `ℓ`) onto free cells; no overlaps; **last player able to place wins** (or score by cells
  covered).
- **Pack vs Block (Maker–Breaker).** One player places AP-copies, the other blocks single cells; can
  the packer still fit the whole family?
- **Switches:** strip length `L`; allowed differences/lengths; 1-D line vs 2-D grid (AP rows).

## 3. Theory hooks (15-pt documentation)

1. **AP packing and `m(F)`** — the bounds above, with the construction ideas.
2. **Greedy vs optimal:** measure how close first-fit / best-fit packing gets to `m(F)`, and how the
   used length grows vs the `Θ(n^{3/2}/ln n)` bound (a real experiment).
3. **Maker–Breaker framing** of the pack-vs-block variant.

## 4. Core algorithms

- **State:** a boolean strip/grid of occupied cells.
- **AP tile** = `{offset + t·d : 0 ≤ t < ℓ}`; placement is legal iff every cell is in-bounds and free
  (an `O(ℓ)` check). Legal-move generation enumerates `(offset, d, ℓ)` placements.
- **Exact `m(F)`:** branch-and-bound (packing is NP-flavoured) for small families — present it as a
  small-instance tool that reproduces the paper's small values.

## 5. AI (4 levels)

| Level | Strategy |
|-------|----------|
| 0 Easy | random legal placement |
| 1 Greedy | best-fit / first-fit-decreasing by tile length; leave the most usable space |
| 2 Strong | alpha-beta for the two-player game on small strips + memoisation |
| 3 Solve | branch-and-bound exact `m(F)` for small families |

## 6. Architecture (TypeScript)

```
src/
├── engine/  types.ts · strip.ts (placement + overlap + legal moves) · modes.ts · ai.ts
├── sim/     greedy vs optimal interval length; growth vs Θ(n^{3/2}/ln n)
└── ui/      strip/grid · AP "comb" tile tray (drag) · length-vs-m(F) meter
```

## 7. UI / UX

A strip (or grid) of cells and a **tray of AP "comb" tiles** — each a row of evenly-spaced marks with
gap `d`. **Drag** a tile to a shifted offset; cells fill, overlaps **flash red**, and a **meter** shows
interval-length-used vs the `m(F)` target. This is the PackIt interaction (so the UI is *known* to
work) restyled for AP combs. Mode selector (solo / 2-player / pack-vs-block); difficulty; **Explainers**.

## 8. Implementation plan

| Milestone | Deliverable |
|-----------|-------------|
| M0 | Engine: strip state, placement + overlap + legal-move gen + tests |
| M1 | Solo puzzle + greedy AI + branch-and-bound `m(F)` + sim (greedy vs optimal) |
| M2 | UI: drag-drop strip, comb tiles, the `m(F)` meter |
| M3 | Two-player + Maker–Breaker modes + minimax |
| M4 | 2-D grid variant, polish |
| M5 | Report (`m(F)` tables + growth plot) + slides + deploy |

## 9. Open items

- **Off-list sign-off** (frame via the newest paper + the PackIt example + the VdW/AP theme).
- Which mode is the headline (recommend **solo puzzle + two-player**; Maker–Breaker as the richest).
- 1-D vs 2-D default; how closely to mirror PackIt's exact rules.
