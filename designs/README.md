# Arena — designs for the remaining topic-list games

Design documents for the **six full games on the official KS / KS2 topic lists** that the original arena
six did not cover. **All six are now implemented** as `src/games/<id>/` modules under the `GameModule`
contract (`mount(slots) → GameInstance`, `engine`/`ui`/`sim`, four AI levels, the three-pane
settings·board·hints+explainers layout, board CSS scoped under `.game-<id>`) — these docs are the spec
they were built from. (Note: **grasshopper** was implemented in the *avoidance* form per its §8, because
the literal KS2 #3 win-direction is a degenerate forced win.)

Excluded on purpose: **KS2 #1 Zimin's algorithm** (a console *tool* for testing pattern unavoidability,
not a two-player game) and the **general `xᵏ` power** option of KS2 #2 (a parameter on the existing
square game rather than a new game).

| Design | Topic | One line |
|--------|-------|----------|
| [vdw-online](vdw-online.md) | KS #4 | Pointer chooses the slot, Painter the colour; force a monochromatic AP. |
| [vdw-duel](vdw-duel.md) | KS #5 | Two colours, own-colour insertion; **lose** if you complete a monochromatic AP. |
| [vdw-offdiagonal](vdw-offdiagonal.md) | KS #7 | VdW Online with a **per-colour target length** `k_i` — now **merged into vdw-online** (diagonal/off-diagonal toggle). |
| [ramsey-words](ramsey-words.md) | KS #10 | Length-`l` blocks are pre-coloured; force two same-coloured adjacent blocks. |
| [grasshopper](grasshopper.md) | KS2 #3 | Builder appends; a grasshopper hops, and only its landed subsequence is judged for a square. |
| [different-blocks](different-blocks.md) | KS2 #5 | Force `k` equal-length adjacent blocks with a repeat (k=2 is the square game). |

**Relationship to the existing six games.** These reuse arena patterns but are distinct games:
vdw-online / vdw-offdiagonal / vdw-duel are the *insertion / online* Van der Waerden models (≠
builder-painter's fixed-board Maker–Breaker); ramsey-words is Ramsey on *words* (≠ builder-painter's
graph Ramsey); grasshopper and different-blocks are new word-pattern games adjacent to thue-arena.

**Shared building blocks they can reuse** (copy locally or, if genuinely shared, factor into
`src/common/` — never import across games): the two-phase *point → insert/paint* flow and caret/palette
widgets (twin-hunter, thue-arena), `makeRng`, the AI-level/scheduling/undo/run-pause controller shape,
and AP/square-scan helpers.

All six are built. Two later consolidations: **vdw-offdiagonal was merged into vdw-online** (one game
with a diagonal/off-diagonal toggle — its doc is kept as the off-diagonal spec), and the original
Builder vs Painter was **split into `mb-vdw` + `mb-ramsey`** (sharing `src/common/positional/`). See
**[COVERAGE.md](COVERAGE.md)** for the full KS/KS2 coverage matrix and the documented open gaps.
