# GK Games — Combinatorial Game Arena

**Twelve** two-player games from the **Gry kombinatoryczne** (Combinatorial Games) course behind one
**game picker** — a responsive grid of cards, each tagged by family, mechanic, and key concepts. Pick a
game and you get a **two-column** layout: settings + hints + explainers stacked on the **left**, the
board filling the **center-right**; an *Explainers* toggle shows/hides the how-to & maths cards.

The games span six families:
- **Repetitions & Thue** — Thue Arena, Repetition Eraser, Grasshopper, Different Blocks
- **Twins & shuffle squares** — Twin Hunter
- **Van der Waerden** — VdW Online (KS #4 & #7, diagonal/off-diagonal toggle), VdW Duel (KS #5), MB Van der Waerden *(Maker–Breaker variant)*
- **Ramsey** — Ramsey Words (KS #10), MB Ramsey *(Maker–Breaker variant)*
- **Packing** — AP-Pack *(off-list)*
- **Ordered matchings** — Arc Match *(off-list)*

The six original standalone apps still live one level up in `GK-Project/<game>/` as a backup; the
topic-list designs are in [`designs/`](designs/). See **[designs/COVERAGE.md](designs/COVERAGE.md)** for
the full KS/KS2 coverage matrix and the documented open gaps.

## Run

```bash
npm install
npm run dev        # dev server (picker at /)
npm test           # all engine/AI/UI tests (vitest)
npm run build      # tsc --noEmit && vite build
```

## Architecture

```
src/
├── main.ts            loads shared + shell CSS, starts the shell
├── common/            the ONLY shared layer
│   ├── contract.ts    GameModule / GameSlots / GameInstance / GameMeta
│   ├── rng.ts         makeRng (seeded mulberry32)
│   └── shared.css     design system (topbar, cards, controls, buttons, meter, banner, explainers)
├── shell/             picker + hash router + 3-pane host + rail toggles  (imports games)
└── games/
    ├── index.ts       the registry (picker order)
    └── <game>/        one self-contained game module
        ├── index.ts   exports the GameModule (metadata + mount)
        ├── engine/    pure game logic + AI (no DOM)   [repetition-eraser is flat: engine.ts/ai.ts/sim.ts]
        ├── sim/        AI-vs-AI tournament helpers
        ├── ui.ts      the controller: mount(slots) builds the three zones and wires everything
        ├── board.css  game-specific styling, every selector scoped under .game-<id>
        └── tests/      engine/AI tests + a jsdom UI smoke test
```

**Dependency rule (what keeps it modular):** the arrows only ever point one way —
`shell → games → common`. A game imports **only** from `common` and itself; it never imports a sibling
game or the shell. The shell imports games; games never import the shell.

### How a game plugs in

Each game exports a `GameModule`. The shell calls `mount({ settings, board, sidebar })`, handing the
game three DOM containers (the left rail, the centre stage, the right rail). The game fills them and
returns a `{ destroy() }` handle the shell calls before switching games. CSS is kept from clashing
between games by scoping every game's `board.css` under a `.game-<id>` class (the shell adds that class
to all three slots) and by giving each game's `@keyframes` a unique name.

## Extracting a game back into a standalone app

Because a game depends only on itself + the thin `common/` layer, lifting one out is mechanical:

1. Copy `src/games/<game>/` and `src/common/` into a fresh folder.
2. Add the standard boilerplate (identical to the originals one level up): `package.json`,
   `tsconfig.json`, `vite.config.ts`, plus an `index.html` with three slot divs and a `main.ts` that
   builds the slots and calls the game's `mount()`. The simplest `main.ts`:
   ```ts
   import './common/shared.css';
   import { <game> } from './games/<game>';
   const make = (id: string) => { const d = document.createElement('div'); d.id = id; d.className = `game-${<game>.id}`; document.body.append(d); return d; };
   document.body.classList.add('explain-on'); // reveal the explainer cards (in the arena the shell does this)
   <game>.mount({ settings: make('s'), board: make('b'), sidebar: make('r') });
   ```
   (The `explain-on` body class gates the `.explainer` cards via CSS — without it the How-to / maths cards
   stay hidden. A polished standalone would instead drive it from its own Explainers toggle.)
3. `npm install && npm run dev`.

(For a polished standalone you'd usually re-add a topbar with its own Settings / Explainers toggles —
the same `.switch` component the shell uses.)
