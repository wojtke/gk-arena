# VdW Off-diagonal — design document

The **off-diagonal online Van der Waerden game**: like VdW Online, but each colour `i` has its **own
target length `k_i`**. The Pointer forces a monochromatic AP of colour `i` and length `k_i` for *some*
`i`; the Painter survives to `n` tokens.

> **Status: implemented — MERGED into `vdw-online`.** Because off-diagonal is a strict generalisation of
> KS #4 (set all `k_i` equal → plain online VdW), the two are now **one game** (`src/games/vdw-online/`)
> with a **diagonal / off-diagonal Targets toggle**. This doc is retained as the off-diagonal spec;
> there is no separate `vdw-offdiagonal/` module. Realises **KS #7 — Liczby Off-diagonal Van der
> Waerdena online**.

- **Course fit (on-list).** KS #7 exactly. Direct sibling of vdw-online; both are the Pointer/Painter
  insertion model (≠ builder-painter's Maker–Breaker).

---

## 1. The game

- Identical board mechanics to **vdw-online**: a line grows one token per round; positions are the line
  indices `1…L` (insertion shifts them). Each round the **Pointer** picks a gap, the **Painter** picks
  a colour `c ∈ {0…r-1}`.
- **Per-colour targets** `{k_0, k_1, …, k_{r-1}}`. **Pointer wins** the instant the line contains a
  monochromatic AP of **some** colour `i` with length `≥ k_i`.
- **Painter wins** when `n` tokens are placed with no colour `i` reaching a `k_i`-AP.
- **Inputs:** `r` (colours, default 2), the target vector `k_i` (default e.g. `{3, 4}` — the
  "off-diagonal" asymmetry is the whole point), `n` (budget). Default colours kept ≤3 for a legible UI.

## 2. The maths (theory doc)

- **Off-diagonal (mixed) van der Waerden numbers** `W(k_0,…,k_{r-1})` (a **comma list = a threshold
  vector**, one length per colour): the least `N` such that every `r`-colouring of `{1…N}` has a
  colour-`i` `k_i`-AP for some `i`. The genuinely *asymmetric* small cases are the interesting ones —
  **`W(3,4)=18`, `W(3,5)=22`, `W(4,5)=55`** (Chvátal's mixed numbers). The symmetric vectors just
  recover the diagonal numbers of vdw-online: `W(3,3)=W(2;3)=9`, `W(4,4)=W(2;4)=35`, `W(3,3,3)=W(3;3)=27`.
  > **Notation:** comma vector = off-diagonal here; semicolon `W(r;k)` = diagonal in vdw-online. They
  > disambiguate an otherwise clashing symbol — e.g. **off-diagonal `W(3,3)=9` (2 colours) ≠ diagonal
  > `W(3;3)=27` (3 colours)**.

  The online/forcing version asks how fast the Pointer can force *any one* of the targets.
- As in vdw-online the Erdős–Selfridge potential is heuristic only here; the Painter's eval weights
  each live AP by how close it is to *its colour's own* threshold `k_i`, so short-threshold colours are
  defended harder.
- **Demo.** With `{k_red=3, k_blue=4}` the Painter must lean toward Blue (the harder target) yet not
  pile up a red 3-AP — the tension between the two thresholds is the pedagogical hook; slide `n` to find
  the survivable length.

## 3. Engine model (pure, DOM-free)

Same shape as vdw-online, with `k` replaced by a vector:

```ts
interface Config { r: number; k: number[]; n: number; humanRole: Role; aiLevel:{P:AILevel;A:AILevel}; seed:number }
interface State { config:Config; line:number[]; phase:'point'|'paint'; gap:number|null;
                  winner:'P'|'A'|null; witness:{color:number; idx:number[]}|null }
newGame · legalMoves · applyMove · isOver · currentPlayer · goalText
```

- **Win detection:** for each colour `i`, scan for an AP of length `k_i` among that colour's indices;
  report the first hit with its colour (for a colour-correct highlight). `O(L²·max k_i)`.
- A thin layer over the vdw-online engine: literally `vdw-online` with `kOf(color)` instead of a scalar
  `k`. Implementation may import a shared AP-scan helper from a small local module (NOT from a sibling
  game — copy or factor into `common` if shared).

## 4. AI (≥2 required; 4 shipped)

| Level | Pointer (forcer) | Painter (avoider) |
|-------|------------------|-------------------|
| 0 Easy | random gap | random colour |
| 1 Greedy | gap maximising the Painter's worst-case shortfall to *any* `k_i` | colour minimising `Σ_i (closeness of colour i to k_i)`, weighting smaller `k_i` more |
| 2 Strong | depth-limited alpha-beta | alpha-beta; leaf eval `Φ = Σ_{live AP of colour i} r^{-(k_i - filled)}` |
| 3 Solver | exact alpha-beta for small `n`, else Strong | same |

Default **Greedy**.

## 5. UI (3-pane arena layout)

- **Left (settings):** number of colours `r`; a small **per-colour `k_i` control** (one slider/stepper
  per colour, the off-diagonal signature); `n`; role; AI levels; New/Undo/Run.
- **Centre (board):** coloured token line with index labels + clickable gap carets (point phase) and a
  colour palette (paint phase); a turn pill; **one mini-meter per colour** showing its longest run vs
  its own `k_i`; banner. Witness AP pulses in the offending colour, labelled with that colour's `k_i`.
- **Right (hints + explainers):** Hint + how-to + maths (off-diagonal `W` numbers card).

## 6. Arena integration

`GameModule`: `id:'vdw-offdiagonal'`, `title:'VdW Off-diagonal'`,
`tagline:'Different target length per colour'`,
`topic:'On-list · Off-diagonal VdW online (KS #7)'`,
`blurb:'Online Van der Waerden with a twist: each colour has its own target AP length. Force any one of them — or balance the defence and survive.'`.
Standard `mount(slots)` → `{ destroy }`; `makeRng` from `common/rng`; CSS scoped `.game-vdw-offdiagonal`,
keyframes `vdwOff_`.

## 7. Tests

- **engine:** per-colour AP detection at the right `k_i`; reduces to vdw-online when all `k_i` equal
  (cross-check); `applyMove`/phase/`isOver`/witness colour correct.
- **ai:** Painter respects the smaller threshold (defends the short-`k_i` colour first); solver stable
  on a tiny `{3,4}` seed.
- **ui.smoke (jsdom):** mount, per-colour `k_i` controls present, a point→paint round, destroy.
- **playthrough:** generic watch-AI completion.

## 8. Complexity, risks, open questions

- Same insertion-tree blow-up as vdw-online → cap solver by `n`/free tokens. Multiple colours raise the
  branching of the paint phase (`r` choices) — keep `r ≤ 3` by default.
- Open: small off-diagonal *forcing-length* table (e.g. `{3,4}`, `{3,3,3}`) for the report — these are
  not in the literature for the online forcing variant, so it is genuine novelty.

## 9. Implementation plan

- **M0** AP-scan-with-`k_i` + tests; confirm reduction to vdw-online.
- **M1** rules + AI (random/greedy/potential) + per-colour `sim` table.
- **M2** UI: per-colour `k_i` controls + per-colour meters + coloured witness.
- **M3** Solver + difficulty/side + hint/undo/watch-AI.
- **M4** explainers, polish, register.
