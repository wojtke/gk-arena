# Twin Hunter — design document

A two-player game on words and permutations: **Maker** points at a position, **Chooser** fills it;
one forces and the other avoids **tight twins** — two interleaved identical (or order-isomorphic)
blocks, i.e. a **shuffle square**.

> **Status: design.** A Python proof-of-concept exists at [../poc/poc2_twin_hunter/](../poc/poc2_twin_hunter/)
> (word + permutation variants, 3 AI levels). Recommended build: TypeScript + Vite, like
> [../arc-match/](../arc-match/).

- **Course fit (on-list).** KS #8 (tight twins in words), KS #9 (tight twins in permutations),
  KS2 #6/#7.
- **Anchor papers** (in `../../papers/extra/`): *Variations on twins in permutations* (2001.05589),
  *Multiple twins in permutations* (2107.06974), *Long twins in random words* (2112.14197), *Words
  Avoiding Tangrams* (2407.03819), and the shuffle-square line *Shuffle squares and ordered nest-free
  graphs* (2503.22043). **Proposal:** [../proposals/proposal-2-twin-hunter.md](../proposals/proposal-2-twin-hunter.md).

---

## 1. Mathematical background

- **Twins** = two disjoint subsequences that are equal (words) or order-isomorphic (permutations,
  e.g. `586` and `397` both reduce to the pattern `132`).
- **Tight twins** = twins whose positions together form a *contiguous* block — a factor that is a
  perfect interleaving (a **shuffle**) of two equal/order-isomorphic copies. So tight twins ⊃ classic
  squares `XX` (e.g. `aabb` is a shuffle square: split into positions 1,3 = `ab` and 2,4 = `ab`).
  This is the **shuffle-square** notion, *not* the abelian-square notion.

> ⚠ **Confirm the exact definition with the instructor before coding.** The literature's "tight"
> twins (Dudek–Grytczuk–Ruciński) allow *either each twin alone to form a block or their union to*;
> this design uses the "union forms a block" (= shuffle-square) reading. The whole detector depends
> on which is meant.

## 2. Game rules

- **Words:** Maker chooses a position; Chooser inserts a letter from `[k]`; the avoider tries to reach
  length `n` with **no tight-twin factor**; the forcer tries to create one.
- **Permutations:** same, but Chooser inserts an unused number from `[1..m]`; twins are compared by
  *order type*, and moves remove the used number.
- **Switches:** alphabet/interval size; target length; `k`-tight-twins (k equal blocks).

## 3. Theory hooks (15-pt documentation)

1. **Twins vs squares vs shuffle squares**, with the permutation order-isomorphism story.
2. **The headline:** recognising a shuffle square is **NP-hard — even on a binary alphabet**
   (Buss–Soltys 2014, *Unshuffling a Square is NP-Hard*; Bulteau–Vialette 2019, *Recognizing binary
   shuffle squares is NP-hard*). So the detector embeds an NP-hard subproblem — a genuine, citable
   result that makes the project's "computer opponent" mathematically interesting.
3. **Experimental contribution:** the longest word/permutation the avoider can guarantee per
   alphabet/interval size is **not pinned down** in the literature → first threshold tables.

## 4. Core algorithms

- **Tight-twin detector** = does any factor form a shuffle square? Per the NP-hardness, there is **no
  polynomial algorithm in general**; for game-sized words use a DP / branch-and-bound and **cap `n`**
  (≈30–40). Per-move, only factors ending at the new letter need re-checking.
- **Permutation order-isomorphism** comparison (rank within the factor).
- Legal-move generator (note: permutation moves remove the chosen value).

## 5. AI (4 levels)

| Level | Strategy |
|-------|----------|
| 0 Easy | random legal move |
| 1 Greedy | avoid/force an immediate tight twin; minimise opponent's safe replies |
| 2 Strong | alpha-beta with a tight-twin terminal detector + transposition table |
| 3 Analytic | exhaustive solve for small `n` → exact game value / position labels |

## 6. Architecture (TypeScript)

```
src/
├── engine/  types.ts · twins.ts (tight-twin / shuffle-square detector) · rules.ts · ai.ts
├── sim/     avoider's guaranteed length vs alphabet/interval size — first tables
└── ui/      word tiles / permutation tiles · two-colour shuffle reveal
```

## 7. UI / UX

The growing word as **letter tiles**, or a permutation as **numbered tiles** (with a faint bar for
each value's height, to show order type). When a tight twin forms, **paint the two interleaved copies
in two colours** so the player *sees* the shuffle — the visual that makes an otherwise invisible
structure legible. Meter: current length / target; role + difficulty; **Explainers** toggle.

## 8. Implementation plan

| Milestone | Deliverable |
|-----------|-------------|
| M0 | The tight-twin detector (the crux) + brute-force tests + an explicit `n`-bound |
| M1 | Word game engine + AI L0–L2 + sim tables |
| M2 | UI for the word game with the two-colour shuffle reveal |
| M3 | Permutation variant + L3 solver |
| M4 | Polish, AI-vs-AI viewer |
| M5 | Report (NP-hardness write-up + threshold tables) + slides + deploy |

## 9. Open items

- The exact "tight" definition (confirm with instructor) — load-bearing.
- Permutation variant: core or stretch.
- `k`-tight-twins generalisation.
