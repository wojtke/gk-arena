# Arc Match — Mathematical Review

This review checks whether the document describes a mathematically coherent game, whether the theoretical claims are valid for the exact game model, and whether the cited papers support the claims.

## Verdict

The game idea itself makes sense: **Arc Match is a valid and interesting finite two-player game**. However, the current theoretical documentation has several important mathematical/modeling issues. I would not submit it as-is.

The biggest problems are:

1. The Maker–Breaker modeling is not faithful to the actual game.
2. The Erdős–Szekeres theorem is used in a way that overstates its relevance to Maker's objective.
3. The definition of the threshold \(k^*(n)\) conflicts with the empirical table.
4. Exact solver values and AI-vs-AI empirical values are mixed together.
5. Some citations should be updated to journal versions where available.

---

## 1. Game definition: mostly coherent

The core game is well-defined.

Maker and Breaker alternately choose disjoint pairs of unused points. Each move creates one arc. Maker wins if his own arcs contain a family of \(k\) pairwise crossing arcs. Breaker wins if Maker never obtains such a family.

This is a valid finite positional-style game with an asymmetric winning condition.

The definitions of:

- crossing,
- nesting,
- alignment / ułożenie,
- homogeneous submatching,
- canonical forms,

are mathematically correct.

The cited Dudek–Grytczuk–Ruciński work uses the same three basic structures, although the terminology may differ: alignment/lines, nesting/stacks, and crossing/waves.

### Small terminology issue

Definition 2.1 defines an ordered matching as using every point exactly once. That is correct for the final board, but during play the game state is only a partial ordered matching.

It would be better to distinguish:

- **partial ordered matching** — the game state during play,
- **full ordered matching** — the final state after all \(n\) arcs have been drawn.

This is not fatal, but it should be cleaned up.

---

## 2. Erdős–Szekeres claim: valid, but relevance is overstated

Theorem 3.1 is correctly attributed in spirit.

The cited result says that every ordered matching of size \(n\) contains a homogeneous submatching of size at least about

\[
n^{1/3}.
\]

So the statement that full ordered matchings inevitably contain a large homogeneous substructure is mathematically reasonable.

However, the inference for this game is too strong.

The theorem applies to the **whole final matching**, including both Maker's red arcs and Breaker's blue arcs. The theorem does not say that Maker's red arcs alone contain such a structure.

A homogeneous family guaranteed in the full matching may be:

- entirely red,
- entirely blue,
- or mixed red/blue.

Maker's win condition only counts red arcs.

Therefore, the Erdős–Szekeres theorem does **not** directly imply a lower bound for Maker.

### Better wording

Use something like:

> The Erdős–Szekeres theorem motivates the pattern class, but it does not directly give a lower bound on Maker's winning threshold, because the unavoidable homogeneous submatching may use arcs of both colors.

---

## 3. Major issue: the Maker–Breaker hypergraph model is not correct

The document models the game as a Maker–Breaker game on a hypergraph:

- vertices = possible arcs,
- winning sets = homogeneous \(k\)-submatchings.

Then it invokes the Erdős–Selfridge criterion.

This is **not a faithful model of Arc Match**.

In a standard Maker–Breaker game, players claim elements of a fixed board. Claiming one element does not make other unclaimed elements illegal.

In Arc Match, claiming an arc \((i,j)\) consumes points \(i\) and \(j\). As a result, every other arc incident to \(i\) or \(j\) becomes impossible.

So Breaker can block a potential red target without claiming one of the target arcs. He can simply claim an overlapping arc that consumes one of the target's endpoints.

That behavior is not modeled by the hypergraph whose vertices are possible arcs.

The document notices this issue, but understates it. It says that disjointness “changes counting \(W(n,k,T)\).” That is not precise enough.

The issue is not merely counting. The issue is that the **game dynamics are different**.

### Correct interpretation

The Erdős–Selfridge criterion does not apply directly to Arc Match unless one proves a new reduction or formulates a suitable constrained-game version.

At most, it can be used as a heuristic.

### Better wording

Use something like:

> The usual Erdős–Selfridge criterion does not apply directly, because our move set is subject to endpoint-exclusion constraints. Modeling possible arcs as independent board elements ignores the fact that an arc can be made unavailable without being claimed. Therefore the criterion can only be used as an informal heuristic unless a new reduction or constrained-game variant is proved.

---

## 4. Counting \(W(n,k,T)\): should be explicit

If you still want a heuristic count of possible homogeneous targets, the count is simple.

For a fixed type

\[
T \in \{\text{crossing}, \text{nesting}, \text{alignment}\},
\]

the number of \(k\)-edge homogeneous submatchings on \(2n\) ordered labeled points is:

\[
W(n,k,T) = \binom{2n}{2k}.
\]

Reason: choose the \(2k\) endpoints. For those ordered endpoints, there is exactly one canonical \(k\)-crossing, one canonical \(k\)-nesting, and one canonical \(k\)-alignment.

So for one target type, the Erdős–Selfridge-style heuristic would be:

\[
\binom{2n}{2k}2^{-k} < \frac12.
\]

For all three target types together, the corresponding heuristic would be:

\[
3\binom{2n}{2k}2^{-k} < \frac12.
\]

However, this is still only a heuristic for the independent-arc hypergraph model. It is not a theorem for the actual endpoint-consuming game.

---

## 5. Threshold \(k^*(n)\): definition/table conflict

The document defines \(k^*(n)\) as the largest \(k\) Maker can force.

But the table gives:

\[
k^*(3) = 0.
\]

This is mathematically inconsistent if \(k=1\) is allowed.

Maker can always force a \(1\)-crossing in the trivial sense by drawing any arc. A family of one arc is vacuously pairwise crossing.

So either the table is wrong, or the definition must explicitly exclude \(k=1\).

### Option A: allow \(k=1\)

Then:

\[
k^*(3) \ge 1.
\]

The table value \(0\) is wrong.

### Option B: define only nontrivial thresholds \(k \ge 2\)

Then define a new quantity, for example:

\[
k^+(n) = \max\{k \ge 2 : \text{Maker can force a } k\text{-crossing}\}.
\]

If Maker cannot force any nontrivial crossing, set:

\[
k^+(n)=0.
\]

With this convention, the table value \(0\) for \(n=3\) can make sense.

---

## 6. Exact small-\(n\) values

Assuming \(k=1\) is allowed, the exact minimax values for the crossing objective are:

| \(n\) | exact \(k^*(n)\) |
|---:|---:|
| 3 | 1 |
| 4 | 2 |
| 5 | 2 |
| 6 | 2 |
| 7 | 3 |
| 8 | 3 |

Therefore, the document's table is consistent only if the first entry means:

> Maker cannot force a nontrivial crossing of size \(k \ge 2\) for \(n=3\).

But then the definition must say this explicitly.

---

## 7. Exact solver values vs AI-vs-AI empirical values

The table caption says:

> Maker poz. 2 vs Breaker poz. 2, threshold ≥50% on 100 games.

That is not the same as \(k^*(n)\) under optimal play.

A threshold based on 100 AI-vs-AI games is an empirical estimate, not a mathematical threshold.

You should separate the two concepts:

- \(k^*(n)\): exact minimax threshold under optimal play,
- \(\hat{k}_{\mathrm{AI}}(n)\): empirical threshold from AI-vs-AI simulations.

Do not call simulation results \(k^*(n)\) unless they were verified by an exact solver.

---

## 8. Upper bound \(\lceil n/2 \rceil\): correct but weak

The bound

\[
k^*(n) \le \left\lceil \frac n2 \right\rceil
\]

is correct, because Maker moves first and therefore draws exactly \(\lceil n/2 \rceil\) arcs in a full game.

So Maker cannot build a red family larger than the number of red arcs he owns.

This is a valid upper bound, but it is very weak.

---

## 9. “Only crossing gives Breaker real influence” is not justified

The document says that among the alternative objectives, only crossing gives Breaker real influence.

This is not proven and sounds too strong.

Breaker can influence nesting and alignment objectives too, because he can consume endpoints and prevent Maker from completing particular structures.

If the intended meaning is that crossing is the most visually or strategically interesting objective, write that instead.

### Better wording

> W dalszej części skupiamy się na krzyżowaniu, ponieważ daje ono najbardziej czytelny i strategicznie interesujący cel gry.

---

## 10. Citation review

### [1] Dudek, Grytczuk, Ruciński — ordered unavoidable substructures

This citation is real and directly relevant to Theorem 3.1.

It supports the claim that every ordered matching of size \(n\) contains a homogeneous submatching of size at least roughly \(n^{1/3}\).

However, this theorem concerns full ordered matchings, not Maker's red submatching.

If a journal version is available, cite the journal version instead of only arXiv.

### [2] Dudek, Grytczuk, Ruciński — ordered uniform matchings

This citation is real.

It is relevant as a broader Erdős–Szekeres-type result for ordered uniform matchings.

There is a later journal version:

> A. Dudek, J. Grytczuk, A. Ruciński, *Erdős–Szekeres type theorems for ordered uniform matchings*, Journal of Combinatorial Theory, Series B, 170, 225–259, 2025.

Use this version if possible.

### [3] Dudek, Grytczuk, Ruciński — twins in ordered hyper-matchings

This citation is real, but it is not central to the current game unless twins are actually used in the theory.

Since the document defines twins but does not use them later, either:

- remove the twins definition and citation, or
- explain why twins are relevant to Arc Match.

### [4] Beck — Combinatorial Games: Tic-Tac-Toe Theory

This is relevant background for Maker–Breaker games.

However, be careful: Beck's classical framework does not directly apply to Arc Match because Arc Match has endpoint-exclusion constraints.

Use Beck as background, not as direct proof support for the threshold claims.

---

## 11. Suggested replacement for the Erdős–Selfridge paragraph

Replace the current paragraph with something like:

> Grę można porównać z klasyczną grą pozycyjną Maker–Breaker, w której elementami planszy są możliwe łuki, a zbiorami wygrywającymi są \(k\)-elementowe jednorodne podskojarzenia. Dla ustalonego typu \(T\) liczba takich potencjalnych celów wynosi \(\binom{2n}{2k}\). Gdyby łuki były niezależnie zajmowalnymi elementami planszy, kryterium Erdősa–Selfridge’a dawałoby warunek wystarczający zwycięstwa Breakera:
>
> \[
> \binom{2n}{2k}2^{-k}<\frac12.
> \]
>
> Jednak Arc Match nie jest dokładnie taką grą, ponieważ wybór łuku zużywa jego końce i usuwa z dalszej gry wszystkie łuki incydentne z tymi punktami. Dlatego powyższy warunek traktujemy wyłącznie jako heurystykę oceny potencjalnych zagrożeń, a nie jako twierdzenie rozstrzygające grę.

---

## 12. Recommended concrete edits

### Must fix

1. Distinguish partial game states from full ordered matchings.
2. Clarify that Erdős–Szekeres does not imply a Maker lower bound.
3. Rewrite the Erdős–Selfridge section as a heuristic, not a theorem for Arc Match.
4. Define \(W(n,k,T)=\binom{2n}{2k}\) explicitly if using the heuristic.
5. Fix the definition of \(k^*(n)\) or change the table entry for \(n=3\).
6. Separate exact minimax thresholds from empirical AI-vs-AI thresholds.
7. Remove or justify the claim that only crossing gives Breaker real influence.

### Nice to fix

1. Update citations to journal versions where possible.
2. Remove the twins definition unless it is used later.
3. Rename empirical thresholds, for example to \(\hat{k}_{\mathrm{AI}}(n)\).
4. Add a short explanation that a one-arc family is vacuously homogeneous, unless the game explicitly requires \(k\ge2\).

---

## Final assessment

Arc Match is mathematically coherent as a game.

The theoretical framing needs revision. The game is not a standard independent-board Maker–Breaker game, because arcs consume endpoints and thereby invalidate other arcs. This means classical Maker–Breaker results such as Erdős–Selfridge cannot be applied directly.

The Erdős–Szekeres theorem is relevant as motivation for homogeneous patterns in ordered matchings, but it does not prove that Maker can force such a pattern among his own arcs.

After fixing the threshold definition, separating exact and empirical results, and weakening the use of Erdős–Selfridge to a heuristic, the document will be much more mathematically sound.
