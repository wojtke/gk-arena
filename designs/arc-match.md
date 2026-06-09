# Arc Match — design document

A two-player **Maker–Breaker** game on an **ordered matching**: players add coloured arcs over a
row of points; **Maker (Red)** tries to build *k* of her own arcs that mutually **cross** (or nest /
align), **Breaker (Blue)** tries to stop her. TypeScript web app, deployable like ThueOnline.

> **Status: implemented.** A runnable Vite + TypeScript app lives in this folder — see
> [README.md](README.md) and `src/`. The pattern detectors and rules were verified against brute
> force (600 000 + 3 000 random cases). Decisions locked: **Maker moves first**; pattern type is
> player-selectable; modes shipped = Maker–Breaker + scoring.

- **Course fit:** off the official KS/KS2 list, but squarely in the **Maker–Breaker / Erdős–Selfridge**
  framework the course teaches (Beck, *Tic-Tac-Toe Theory*) and the **twins / ordered-matchings**
  line of Grytczuk's *most active* recent work. **Confirm as an off-list topic with Prof. Grytczuk.**
- **Anchor papers** (`../../papers/extra/ARXIV-INDEX.md`): *Ordered unavoidable sub-structures in
  matchings* (2210.14042), *Twins in ordered hyper-matchings* (2310.01394), *Erdős–Szekeres type
  theorems for ordered uniform matchings* (2301.02936), *Homogeneous substructures in random ordered
  (hyper-)matchings* (2601.13906, 2507.20374). Not yet downloaded — see "Open items".
- **Proposal:** [../proposals/proposal-5-arc-match.md](../proposals/proposal-5-arc-match.md).

---

## 1. Mathematical background

- An **ordered matching** of size *n* is a set of *n* edges (arcs) that pairwise share no endpoint,
  drawn on `2n` linearly ordered points `1 … 2n`. Every point is an endpoint of exactly one edge.
- Take two edges `e = (a,b)` and `f = (c,d)` with `a<b`, `c<d`, and WLOG `a<c`. Exactly one of:
  - **Alignment** (`a<b<c<d`) — disjoint, side by side. *"lines"*
  - **Nesting** (`a<c<d<b`) — one inside the other. *"stacks"*
  - **Crossing** (`a<c<b<d`) — interleaved. *"waves"*
- A sub-matching is **homogeneous** of type `T` if *every* pair in it has type `T`.
  Canonical forms for a size-*k* homogeneous set (edges `e_i=(a_i,b_i)`, sorted by `a_i`):
  - **k-crossing:** `a_1<a_2<…<a_k < b_1<b_2<…<b_k`
  - **k-nesting:**  `a_1<a_2<…<a_k < b_k<…<b_2<b_1`
  - **k-alignment:** `a_1<b_1 < a_2<b_2 < … < a_k<b_k`
- **Twins** = two vertex-disjoint, order-isomorphic sub-matchings.
- **Erdős–Szekeres for matchings** (2210.14042): every size-*n* ordered matching contains a
  homogeneous sub-matching of size `≥ n^{1/3}`. So homogeneity is *unavoidable* in a full matching —
  which is exactly why the *game* (can Maker **force** it while owning only her own arcs?) is
  interesting.

> Worked example (n = 3, points 1..6). Edges {(1,4),(2,5),(3,6)} → `a:1<2<3 < b:4<5<6` = a
> **3-crossing**. Edges {(1,6),(2,5),(3,4)} → `a:1<2<3 < b:6>5>4` = a **3-nesting**.
> Edges {(1,2),(3,4),(5,6)} = a **3-alignment**.

## 2. Game rules (Maker–Breaker, the chosen model)

- **Board:** `2n` points on a line. Parameters: `n`, target size `k`, target type `T ∈
  {crossing, nesting, alignment, any}`. **Maker (Red) always moves first.**
- **Move:** on your turn, pick two **unused** points and connect them with an arc **in your colour**
  (Red = Maker, Blue = Breaker). Each point is consumed by at most one arc → the union of all arcs is
  a single ordered matching, 2-coloured by who drew each arc.
- **Goal:** **Maker (Red) wins the instant her Red arcs contain a homogeneous size-`k` set of type
  `T`** (default `T = crossing`: *k* mutually-crossing red arcs). **Breaker (Blue) wins** if the board
  fills (or no Red completion remains possible) without that happening. *Ties → Breaker* (standard
  Maker–Breaker convention).
- **Why it's strategic & fun:** crossings/nestings are *visible*, so a human can plan and block by
  eye (unlike tight-twin avoidance). Breaker plays by **occupying points** that Red needs and by
  **breaking** Red's near-complete chains.

**Default ship config:** `n = 6–9`, `T = crossing`, `k = 3–4`, Maker first, three modes (human-vs-AI
either colour, AI-vs-AI).

### Modes / variants (configurable)
| Mode | Change |
|------|--------|
| **Type select** | `T` = crossing / nesting / alignment / **any** (any single type counts) |
| **Scoring duel** | no target; fill the board; score = largest homogeneous Red set; Maker maximises, Breaker minimises |
| **Misère** | Maker tries to *avoid* completing the structure (flips roles' feel) |
| **Twins** *(stretch)* | Maker wants two disjoint order-isomorphic Red sub-matchings of size *k* |
| **Online insertion** *(stretch)* | points revealed left-to-right; attach each new point on arrival |
| **r-uniform** *(stretch)* | edges on *r* points (ordered hyper-matchings, per 2310.01394) |

## 3. Theory hooks (for the 15-pt documentation)

1. **Maker–Breaker positional game** on the hypergraph `H` whose vertices are *possible arcs* and
   whose winning sets are the homogeneous-`k` sub-matchings. Standard Beck framework.
2. **Erdős–Selfridge criterion.** If `Σ_{A ∈ winning sets} 2^{-|A|} < 1/2`, Breaker (2nd player) wins.
   All winning sets have size `k`, so this is `W(n,k,T) · 2^{-k} < 1/2`, where `W` = number of
   homogeneous-`k` sub-matchings on `2n` points. This both **bounds when Breaker is safe** and gives
   the **AI's potential** (§5, L2).
   > ⚠ **Honest subtlety to address in the report:** classic Erdős–Selfridge assumes the ground-set
   > elements are *independently* claimable. Here claiming an arc *consumes its two points*, so arcs
   > sharing a point can't coexist — a matroid/disjointness constraint the basic theorem doesn't
   > model. So ES is a **strong heuristic + a one-sided sufficient bound** here, not a turnkey
   > theorem. Stating this precisely (and how the disjointness changes the count `W`) is a genuine
   > contribution for the documentation. (Same care we applied to the Builder–Painter proposal.)
3. **Game threshold** `k*(n)` = largest `k` Maker can force on `2n` points. Compare empirically
   (§5, L3 solver + §6 sims) against the `n^{1/3}` *unavoidable* floor (which concerns the *whole*
   matching, whereas Maker owns only ~half the arcs — so `k*(n)` is smaller and **open**).

## 4. Core algorithms (the engine crux)

- **`classify(e, f) → Pattern`** — O(1): order the four endpoints, read off alignment/nesting/crossing.
- **`largestHomogeneous(edges, T) → number`** — the size of the biggest type-`T` set. Each type is a
  **longest chain under a partial order**, an LIS/LDS-style DP:
  - sort edges by `a_i`;
  - **crossing:** longest subsequence with `b_i` increasing *and* all `a` before all `b`
    (overlap/Helly condition) — patience-sorting on `b`, `O(m log m)`;
  - **nesting:** longest subsequence with `b_i` *decreasing* (containment) — LDS on `b`;
  - **alignment:** longest chain of pairwise-disjoint intervals in order — greedy/DP `O(m log m)`.
  A simple `O(m²)` DP is fine for game-sized boards and is the reference for property-testing the
  fast version.
- **`isWin(state)`** — after each Red move, `largestHomogeneous(redEdges, T) ≥ k`. Cheap (recompute
  on Red's ~`m/2` arcs).
- **Twins detector** *(only for the twins mode)* — finding largest twins is hard in general (cf.
  Twin Hunter / shuffle-square NP-hardness); cap `n` and brute-force. Keep out of the core.

## 5. AI design (≥2 levels required; we ship 4)

| Level | Strategy |
|-------|----------|
| **L0 Random** | uniform random legal arc |
| **L1 Greedy / threat** | score moves by how much they grow Red's largest type-`T` chain and shrink Breaker's options; Breaker blocks Red's longest near-complete chain and grabs shared points |
| **L2 Erdős–Selfridge** | maintain potential `Φ = Σ_{A live} 2^{-(k − r_A)}` over still-completable homogeneous-`k` candidate sets `A` (`r_A` = #Red arcs already in `A`, `A` not blocked by Blue or by point-consumption). Maker plays the move maximising `Φ`; Breaker the move minimising it (the ES "reduce the most dangerous set" rule). |
| **L3 Solver** | exact minimax with **alpha-beta + transposition table + symmetry** (the board has a left-right reflection); solves the position for small `n`. Used to label positions and to compute `k*(n)`. |

Practical notes: full enumeration of candidate sets `A` is expensive, so L2 caps board size or uses a
**threat list** (Red chains of length `k−1` with a free extension; Blue chains to block) instead of
the exact ES sum. L3 is feasible for `n ≲ 7–8` with memoisation; beyond that, fall back to L2.

## 6. Architecture (TypeScript)

Pure, framework-free **engine**; thin **UI**; headless **sim** — so the engine is unit-tested and
reused by the AI-vs-AI experiments (the "computer-vs-computer + tests" the rubric wants).

```
arc-match/
├── DESIGN.md                ← this file
├── src/
│   ├── engine/              ← pure, no DOM
│   │   ├── types.ts         Point, Edge, Color, Pattern, GameConfig, GameState
│   │   ├── rules.ts         legalMoves, applyMove, isWin, isOver
│   │   ├── patterns.ts      classify, largestHomogeneous (the 3 chain DPs)
│   │   └── ai/              random.ts, greedy.ts, erdosSelfridge.ts, minimax.ts
│   ├── sim/                 ← headless AI-vs-AI; emits CSV for the report
│   │   └── tournament.ts    win-rate vs (n,k,T); smallest n to force k → k*(n)
│   └── ui/                  ← SVG rendering + interaction
│       ├── Board.ts         draw points + arcs (semicircle/Bézier), colour by player
│       ├── controls.ts      n, k, type, difficulty, mode, who-first
│       └── app.ts           wire engine ↔ DOM; human-vs-AI; AI-vs-AI viewer
├── tests/                   ← Vitest: patterns, rules, AI sanity, property tests
└── index.html
```

- **Stack:** Vite + TypeScript; **SVG** for arcs (crisp, easy hit-testing, exportable). A light view
  layer (plain TS or Svelte) — no heavy framework needed. **Vitest** for tests. Build → **GitHub
  Pages** (mirror ThueOnline's deploy).
- **Engine purity:** no `Math.random` inside logic except a seeded RNG passed in (reproducible sims
  & tests). All engine functions are pure `(state) → state | value`.

### Data model (concrete)
```ts
type Color = 'R' | 'B';                         // Red = Maker, Blue = Breaker
type Pattern = 'crossing' | 'nesting' | 'alignment';
interface Edge { lo: number; hi: number; color: Color; }   // 1 ≤ lo < hi ≤ 2n

interface GameConfig {
  points: number;                                // 2n
  target: number;                                // k
  type: Pattern | 'any';
  firstPlayer: Color;
  mode: 'maker-breaker' | 'scoring' | 'misere';
  humanRole: Color | 'both' | 'none';            // 'none' = AI vs AI
  aiLevel: { R: 0|1|2|3; B: 0|1|2|3 };
  seed: number;
}
interface GameState {
  config: GameConfig;
  edges: Edge[];
  used: boolean[];                               // length points+1
  turn: Color;
  winner?: Color | 'draw';
}

function legalMoves(s: GameState): [number, number][];
function applyMove(s: GameState, lo: number, hi: number): GameState;
function classify(e: Edge, f: Edge): Pattern;
function largestHomogeneous(edges: Edge[], t: Pattern): number;   // longest chain
function isWin(s: GameState): boolean;                            // Red has k of type T
function aiMove(s: GameState, level: 0|1|2|3): [number, number];
```

## 7. UI / UX

- **Board:** a horizontal axis with `2n` numbered dots; arcs drawn above as semicircles/Béziers,
  **red** (Maker) vs **blue** (Breaker). Used points dim out.
- **Interaction:** click a dot (it highlights) → click a second free dot → your arc appears in your
  colour; illegal picks (used point) shake and are rejected. The AI replies with a brief animation.
- **Side panel:** turn indicator; the goal in words ("Make **3** red arcs that all cross"); a live
  meter "largest red crossing: 2 / 3"; controls for `n, k, T`, difficulty (per colour), mode, who
  moves first; buttons: New game, Undo, **Hint**, **Run AI-vs-AI**.
- **Feedback:** optional **hint** mode highlights arcs that would extend Red's longest chain / the
  arcs Breaker should block. On win, the witnessing `k`-set **pulses** (rainbow for a crossing, nested
  bands for a nesting). On full-board Breaker win, show the largest Red chain achieved.
- **AI-vs-AI viewer:** step/auto-play; surfaces the sim tables for the report.
- Numbered dots + the meter keep the abstract goal legible; large tap targets for mobile.

## 8. Implementation plan (maps to the 6 checkpoints & 50-pt rubric)

| Milestone | Deliverable | Rubric |
|-----------|-------------|--------|
| **M0 Engine** | `types/rules/patterns` + the 3 chain detectors, `isWin`; Vitest incl. brute-force property tests | app core |
| **M1 Loop + sim** | headless game loop, L0/L1 AI, `tournament.ts` CSV output, more tests | app + experiments |
| **M2 UI** | SVG board, human-vs-AI (either colour), win highlight | app (25) |
| **M3 Smart AI** | L2 Erdős–Selfridge, L3 minimax (small n), difficulty selector | app + theory |
| **M4 Modes + polish** | type select, scoring mode, hint mode, AI-vs-AI viewer | app (25) |
| **M5 Report + deploy** | sim tables/plots (`k*(n)` vs `n^{1/3}`), theory doc (15), slides (10), Pages deploy | doc + presentation |
| **Stretch** | twins / online-insertion / r-uniform | bonus |

Suggested **first commit**: `engine/patterns.ts` + its tests — `classify` and the three
`largestHomogeneous` chain DPs, validated against an `O(2^m)` brute force on all matchings up to
`n = 5`. Everything else builds on a trusted detector.

## 9. Open items / to confirm

1. **Off-list sign-off** from Prof. Grytczuk (the project topic is not on KS/KS2). Frame it via the
   ordered-matchings papers + Maker–Breaker theory.
2. ~~Rule choices~~ — **locked:** Maker moves first; pattern type is player-selectable; modes =
   Maker–Breaker + scoring. Still optional: misère, online-insertion, twins, *r*-uniform (stretch).
3. **ES rigor:** write up the disjointness caveat (§3.2) precisely — it's the most interesting theory
   point.
4. ~~Download the anchor matchings papers~~ — **done:** 2210.14042, 2310.01394, 2301.02936,
   2601.13906, 2507.20374 are in `../../papers/extra/` (filenames `dudek_*matchings*`).
