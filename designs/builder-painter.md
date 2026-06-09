# Builder vs Painter — design document

Two **Maker–Breaker positional games** on one generic engine. **Maker (Red)** moves first and
tries to occupy a whole *winning set*; **Breaker (Blue)** blocks.

> **Status: implemented.** Runnable Vite + TypeScript app in this folder — see [README.md](README.md)
> and `src/`. Hypergraph generation, rules, and AI verified against brute force in Python.
> Decisions locked: Maker moves first; two games (Van der Waerden + Ramsey); modes = Maker–Breaker
> + scoring; default AI = Greedy (so a first game is winnable).

- **Course fit (on-list).** Realises the official **Van der Waerden game** (KS #5) and a
  **Ramsey / clique game** (KS #10) inside Beck's Maker–Breaker framework (KS theme; *Tic-Tac-Toe
  Theory*). The *online* variants — online Van der Waerden (KS #4) and online Ramsey numbers,
  Builder–Painter (KS #11) — are the documented extension below.
- **Proposal:** [../proposals/proposal-3-builder-painter.md](../proposals/proposal-3-builder-painter.md).

---

## 1. The games

A **positional game** is a ground set of claimable cells plus a family of **winning sets**. Maker
claims cells; she wins by owning every cell of some winning set; Breaker wins if she prevents that.

- **Van der Waerden:** cells = positions `0…N-1`; winning sets = all **k-term arithmetic
  progressions** `{a, a+d, …, a+(k-1)d}`.
- **Ramsey (clique game):** cells = edges of `K_V`; winning sets = the `C(q,2)` edges of each
  **q-clique** (default `q=3`, a triangle).

One engine plays both — only the `winningSets` differ.

## 2. Rules

- **Maker (Red) moves first.** On your turn, claim one empty cell in your colour.
- **Maker wins** the instant her cells contain a full winning set (a complete AP, or all edges of
  a clique). **Breaker wins** if the board fills first. *Scoring* mode plays to the end and scores
  Maker by her largest live structure.
- Parameters: game kind; board size (`N` positions / `V` vertices); target (`k` / `q`); AI levels.

## 3. The maths (theory doc, 15 pts)

- **Maker–Breaker positional games** (Beck). Maker has the initiative; on small boards she usually
  wins, so the game is asymmetric by design.
- **Erdős–Selfridge theorem.** If `Σ_{winning sets A} 2^{-|A|} < 1/2`, **Breaker has a winning
  strategy.** Here this is a *clean, exact* application (unlike Arc Match): the cells are
  **independently claimable**, so the classic theorem applies with no caveat. The Breaker strategy
  is to minimise the potential `Φ = Σ_{live A} 2^{-(|A|-maker_A)}` — which is exactly the AI's
  "Potential" level.
- **The Maker/Breaker threshold.** Counting winning sets gives a sharp boundary:
  - *VdW, k-AP on `[1..N]`:* #APs `≈ N²/(2(k-1))`, each weight `2^{-k}`, so Breaker is safe while
    `N² < (k-1)2^k`. For **k=4** that's `N ≤ ~11`; empirically (strong play) Breaker wins to
    `N≈11` and Maker from `N≈13`. **The knife-edge at k=4, N≈12 is the headline demo.**
  - *Ramsey triangles:* #triangles `= C(V,3)`, weight `1/8`; Breaker only safe for `V≤3`, so the
    triangle game is Maker-won for any interesting `V` — use `q=4` for a Breaker-competitive game.
- **Verified balance sweep** (ES vs ES, Maker win-rate): k=3 → Maker wins all N; k=4 → 0.00 up to
  N=11 then 1.00 from N=13; k=5 → Breaker wins through N=17. Ramsey q=3 → Maker wins all V; q=4 →
  Breaker wins through V=9.

## 4. AI (≥2 levels required; 4 shipped)

| Level | Strategy |
|-------|----------|
| 0 Easy | random legal cell |
| 1 Greedy | maximise (Maker) / minimise (Breaker) the best live structure, 1-ply |
| 2 Potential | the **Erdős–Selfridge** potential `Φ` (the theorem's own weighting) |
| 3 Solver | alpha-beta to the end on small boards (≤ ~9 free cells), else falls back to `Φ` |

## 5. Architecture (TypeScript)

```
src/
├── engine/        pure, DOM-free, unit-tested
│   ├── types.ts        Hypergraph, GameConfig, GameState
│   ├── hypergraph.ts   vdw/ramsey winning-set builders + edge indexing
│   ├── rules.ts        newGame · legalMoves · applyMove · makerProgress
│   └── ai.ts           random · greedy · Erdős–Selfridge Φ · minimax
├── sim/tournament.ts   AI-vs-AI win-rates + VdW threshold N*(k)
└── ui/{app.ts,styles.css}   two renderers: number line (VdW) + circular graph (Ramsey)
```

The engine is generic over `(cellCount, winningSets)`, so the same rules/AI drive both games and
any future positional game (e.g. a Hales–Jewett / tic-tac-toe board) just needs a new builder.

## 6. Implementation plan (maps to checkpoints)

- **M0** engine + hypergraph builders + brute-force tests.
- **M1** generic rules + AI (random/greedy/ES) + sim harness.
- **M2** UI: number-line board, claim/colour, win highlight.
- **M3** Ramsey graph board; minimax Solver; difficulty + side selection.
- **M4** scoring mode, hint, undo, AI-vs-AI viewer, explainers, polish.
- **M5** report: threshold tables + plots, theory doc, slides, deploy to Pages.
- **Stretch:** **online Builder–Painter Ramsey numbers** (KS #11) — Builder builds adaptively,
  Painter colours; compute `r̃(H)`. This is a *different* model (ES does not transfer); kept as an
  extension so the core stays a clean, theorem-backed positional game. Also: biased `(1:b)` games
  to rebalance toward Breaker.

## 7. Notes

- **On-list**, so no special sign-off needed — but flag to the instructor that the core is the
  **Maker–Breaker** formulation; the online Builder–Painter Ramsey-number game is the extension.
- Supersedes the earlier Python POC (`../poc/poc3_builder_painter/`).
