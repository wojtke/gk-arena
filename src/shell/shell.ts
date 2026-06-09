// The arena shell: a path-routed picker + a two-column host for whichever game is open. Layout is
// settings + hints + explainers stacked in the LEFT panel, the board filling the wider center-right
// column. One game is mounted at a time; the shell owns the topbar, the Explainers toggle, and
// teardown. All shell element ids are namespaced `hub-*` so they never collide with a game's ids.

import type { GameFamily, GameInstance, GameModule } from '../common/contract';
import { games } from '../games';

const ARENA_LOGO = `<svg viewBox="0 0 40 28" width="40" height="28" aria-hidden="true">
  <circle cx="9" cy="14" r="4" fill="var(--red)"/><circle cx="20" cy="8" r="4" fill="var(--violet)"/>
  <circle cx="31" cy="14" r="4" fill="var(--blue)"/><circle cx="20" cy="20" r="4" fill="var(--blue)"/></svg>`;

// The flat picker grid is ordered by family so same-theme games sit near each other.
const FAMILY_ORDER: GameFamily[] = [
  'Repetitions & Thue', 'Twins & shuffle squares', 'Van der Waerden', 'Ramsey', 'Packing', 'Ordered matchings',
];
// Short slug per family → the colour-coded family chip class `.fam-<slug>`.
const FAMILY_SLUG: Record<GameFamily, string> = {
  'Repetitions & Thue': 'thue',
  'Twins & shuffle squares': 'twins',
  'Van der Waerden': 'vdw',
  'Ramsey': 'ramsey',
  'Packing': 'packing',
  'Ordered matchings': 'matchings',
};

let current: GameInstance | null = null;

function teardown(): void {
  if (current) { try { current.destroy(); } catch { /* ignore */ } current = null; }
}

function gameById(id: string): GameModule | undefined {
  return games.find((g) => g.id === id);
}

// Path-based routing under Vite's base (e.g. "/gk-arena/"). The picker is the base path; a game is
// base + its id (e.g. "/gk-arena/arc-match"). GitHub Pages serves 404.html (a copy of index.html) for
// those deep paths, so a hard refresh / shared link re-bootstraps the app, which then reads the path.
const BASE = import.meta.env.BASE_URL; // always has a trailing slash, e.g. "/gk-arena/"

function currentRoute(): string {
  let p = location.pathname;
  if (p === BASE.slice(0, -1)) return '';            // "/gk-arena" without the trailing slash
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  return p.replace(/^\/+|\/+$/g, '').trim();
}

function navigate(id: string): void {
  const target = BASE + id;                          // id "" → the picker (base path)
  if (location.pathname !== target) history.pushState({}, '', target);
  route();
}

// ---- picker ----
function renderPicker(app: HTMLElement): void {
  teardown();
  document.title = 'GK Arena';
  document.body.classList.remove('explain-on');
  const card = (g: GameModule) => `
    <button class="game-card" data-id="${g.id}">
      <span class="gc-head">
        <span class="gc-icon" aria-hidden="true">${g.icon ?? ARENA_LOGO}</span>
        <span><h3>${g.title}</h3><p class="gc-tagline">${g.tagline}</p></span>
      </span>
      <p class="gc-blurb">${g.blurb}</p>
      <span class="gc-tags">
        <span class="gc-tag fam fam-${FAMILY_SLUG[g.family]}">${g.family}</span>
        <span class="gc-tag mech">${g.mechanic}</span>
        ${(g.tags ?? []).map((t) => `<span class="gc-tag">${t}</span>`).join('')}
      </span>
    </button>`;

  // Flat grid, ordered by family (stable on original order within a family) — no group headers.
  const sorted = games
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (FAMILY_ORDER.indexOf(a.g.family) - FAMILY_ORDER.indexOf(b.g.family)) || (a.i - b.i))
    .map((x) => x.g);

  app.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <span class="logo" aria-hidden="true">${ARENA_LOGO}</span>
        <div><h1>GK Games</h1><p class="tagline">A combinatorial-game arena · pick a game</p></div>
      </div>
    </header>
    <p class="picker-intro">Twelve two-player games from the Combinatorial Games course. One player builds
      an object move by move while the other forces — or avoids — an unavoidable pattern. Each card is
      tagged by theme and how it plays; every game has human-vs-AI, hotseat, and watch-AI modes with four
      AI strengths.</p>
    <main class="picker-grid">${sorted.map(card).join('')}</main>
    <footer class="foot">
      <span>GK Games · combinatorial games on words &amp; coloured structures</span>
      <span class="muted small">TypeScript · Vite</span>
    </footer>`;

  app.querySelectorAll<HTMLElement>('.game-card').forEach((c) => {
    c.addEventListener('click', () => navigate(c.dataset.id ?? ''));
  });
}

// ---- game host (2 columns: left panel = settings + hints + explainers · right = board) ----
function renderGame(app: HTMLElement, mod: GameModule): void {
  teardown();
  document.title = `${mod.title} | GK Arena`;
  document.body.classList.add('explain-on'); // explainers shown by default

  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-left">
        <button id="hub-back" class="btn hub-back">← Games</button>
        <div class="brand">
          <span class="logo" aria-hidden="true">${mod.icon ?? ARENA_LOGO}</span>
          <div><h1>${mod.title}</h1><p class="tagline">${mod.tagline}</p></div>
        </div>
      </div>
    </header>
    <main class="arena2">
      <aside class="panel game-${mod.id}" id="hub-panel">
        <div id="hub-settings"></div>
        <div id="hub-sidebar"></div>
      </aside>
      <section class="stage game-${mod.id}" id="hub-board"></section>
    </main>
    <footer class="foot">
      <span>${mod.title} · ${mod.topic}</span>
      <span class="muted small">part of GK Games</span>
    </footer>`;

  const settings = app.querySelector<HTMLElement>('#hub-settings')!;
  const board = app.querySelector<HTMLElement>('#hub-board')!;
  const sidebar = app.querySelector<HTMLElement>('#hub-sidebar')!;

  current = mod.mount({ settings, board, sidebar });

  // Each left-panel card (Settings, How to play, maths, …) is collapsible via its <h2> header.
  app.querySelectorAll<HTMLElement>('#hub-panel .card').forEach((cardEl) => {
    const h2 = cardEl.querySelector<HTMLElement>(':scope > h2');
    if (!h2) return;
    cardEl.classList.add('collapsible');
    h2.setAttribute('role', 'button');
    h2.setAttribute('tabindex', '0');
    h2.setAttribute('aria-expanded', 'true');
    const toggle = () => {
      const collapsed = cardEl.classList.toggle('collapsed');
      h2.setAttribute('aria-expanded', String(!collapsed));
    };
    h2.addEventListener('click', toggle);
    h2.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
    });
  });

  app.querySelector<HTMLButtonElement>('#hub-back')!.addEventListener('click', () => navigate(''));
}

// Reset the viewport to the top on navigation — the SPA swaps content in place, so without this
// a game opened from far down the picker grid would start mid-scroll. (Sets the scrolling root's
// scrollTop directly; works in browsers and is a harmless no-op in jsdom.)
function scrollToTop(): void {
  const el = document.scrollingElement ?? document.documentElement;
  if (el) el.scrollTop = 0;
}

function route(): void {
  const app = document.getElementById('app');
  if (!app) return;
  const mod = gameById(currentRoute());
  if (mod) renderGame(app, mod);
  else renderPicker(app);
  scrollToTop();
}

export function startShell(): void {
  window.addEventListener('popstate', route);
  route();
}
