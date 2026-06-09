# Topic coverage — KS & KS2 lists vs the arena games

How the 12 arena games map onto the official course topic lists
(`gk/project_topic_list/projekty_tematy_ks.pdf` and `…_ks2.pdf`). "Deliver the intent", not 1:1.

**Per-topic sub-options (a)/(b)/(c)** — human-vs-computer, computer-vs-human, and the AI-vs-AI
simulation — are **universally covered**: every game has a role select (you / opponent / hotseat /
watch-AI) and four AI levels. So the table below tracks the *game / target-structure* coverage.

## KS list — "Kombinatoryka na słowach"

| KS # | Topic | Game (mode) | Status |
|---|---|---|---|
| 1 | Repetition erasing | **repetition-eraser** | ✅ full |
| 2 | Thue online | **thue-arena** (online) | ✅ full |
| 3 | Nonrepetitive game (nontrivial) | **thue-arena** (append · nontrivial) | ✅ full |
| 4 | Van der Waerden online | **vdw-online** (diagonal) | ✅ full |
| 5 | Van der Waerden game (misère) | **vdw-duel** | ✅ full |
| 6 | Abelian Thue online | **thue-arena** (abelian) | ✅ full |
| 7 | Off-diagonal VdW online | **vdw-online** (off-diagonal toggle) | ✅ full |
| 8 | Tight twins — words | **twin-hunter** (words) | ✅ full |
| 9 | Tight twins — permutations | **twin-hunter** (perm) | ✅ full |
| 10 | Ramsey on words online | **ramsey-words** | ✅ full |
| 11 | Ramsey numbers online (Builder–Painter, gui) | **mb-ramsey** (Maker–Breaker variant) | ⚠ partial |

**KS #11 note.** The listed mechanic is the *online Builder–Painter colouring* game (Konstruktor draws an
edge → Malarz colours it one of two colours → Konstruktor wants a monochromatic copy of a target graph
`H`). The arena ships **mb-ramsey**, a **Maker–Breaker** clique game (both players *claim* edges) — a
graph-Ramsey game in Beck's framework, delivering the theme but **not** the edge-colouring mechanic. The
faithful online Builder–Painter game is an open gap (below).

## KS2 list

| KS2 # | Topic | Game | Status |
|---|---|---|---|
| 1 | Zimin's algorithm (pattern unavoidability) | — | ❌ out of scope (a checker tool, not a 2-player game) |
| 2 | Forbidden patterns (`xx`, `xᵏ`) | **thue-arena** (square) | ⚠ partial — `xx` ✅, `xᵏ` power ❌ |
| 3 | Forbidden patterns with a grasshopper | **grasshopper** | ✅ full (`xx` + cube via power) |
| 4 | Abelian forbidden patterns (`xx`, `xᵏ`) | **thue-arena** (abelian) | ⚠ partial — `xx` ✅, `xᵏ` ❌ |
| 5 | Different blocks (k=3, any k) | **different-blocks** (k slider) | ✅ full |
| 6 | Tight twins — words (+ k-raczki) | **twin-hunter** (words) | ⚠ partial — twins ✅, k-raczki ❌ |
| 7 | Tight twins — permutations (+ k-raczki) | **twin-hunter** (perm) | ⚠ partial — twins ✅, k-raczki ❌ |
| 8 | Repetition erasing | **repetition-eraser** | ✅ full |

## Off-list (exploratory / variants — beyond the lists)

| Game | Family | Note |
|---|---|---|
| **ap-pack** | Packing | AP packing toward the optimum `m(F)` (mirrors the PackIt example app) |
| **arc-match** | Ordered matchings | twins / Erdős–Szekeres on ordered matchings (Grytczuk's newer line) |
| **mb-vdw** | Van der Waerden | Maker–Breaker VdW (Beck) — a *variant* of the VdW theme (faithful KS #4/#5 are vdw-online/vdw-duel) |
| **mb-ramsey** | Ramsey | Maker–Breaker Ramsey clique (Beck) — the arena's stand-in for the KS #11 graph-Ramsey theme |

## Summary

- **Fully covered (13):** KS #1–#10, KS2 #3, #5, #8.
- **Partial:** KS #11 (Maker–Breaker variant, not the online-colouring mechanic); KS2 #2 & #4 (`xx` yes,
  `xᵏ` no); KS2 #6 & #7 (twins yes, k-raczki no).
- **Not covered:** KS2 #1 (Zimin tool — not a 2-player game).
- **Bonus off-list:** ap-pack, arc-match, plus mb-vdw as a Maker–Breaker VdW variant.

### Open gaps (documented — not built this round)

1. **KS #11** — the faithful *online Builder–Painter* edge-colouring Ramsey game (Constructor draws,
   Painter colours, target graph `H`). Could be a new game or a mode of mb-ramsey.
2. **`xᵏ` powers** — an arbitrary-power option (`xxx`, `xxxx`, …) for the forbidden-pattern and abelian
   modes (KS2 #2 / #4); only `xx` is implemented in thue-arena.
3. **k-raczki (k-tuplets)** — the k≥3 tight-multiplet option for Twin Hunter (KS2 #6 / #7); only k=2
   tight twins are implemented.
4. **KS2 #1 Zimin checker** — a console utility for testing whether a pattern is unavoidable (not a
   game; would be a separate tool tab if ever added).
