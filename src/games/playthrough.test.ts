// @vitest-environment jsdom
// A deep, game-agnostic correctness net: for every registered game, run a full watch-AI-vs-AI match to
// completion and assert it ends with the win/loss banner shown and nothing thrown. This exercises the
// entire move loop and the game-over rendering path (banner, witness highlight) that the light per-game
// smoke tests do not reach.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { games } from './index';

function slot(id: string, scope: string): HTMLElement {
  const d = document.createElement('div');
  d.id = id;
  d.className = `game-${scope}`;
  document.body.appendChild(d);
  return d;
}

describe('watch-AI playthrough', () => {
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ''; });

  for (const g of games) {
    it(`${g.id}: a watch-AI game reaches a terminal state without crashing`, () => {
      vi.useFakeTimers();
      const inst = g.mount({
        settings: slot('slot-s', g.id),
        board: slot('slot-b', g.id),
        sidebar: slot('slot-r', g.id),
      });

      // Switch to watch AI-vs-AI, then press Run so moves are scheduled.
      const role = document.getElementById('roleSel') as HTMLSelectElement;
      role.value = 'none';
      role.dispatchEvent(new Event('change', { bubbles: true }));
      const run = document.getElementById('runBtn') as HTMLButtonElement;
      expect(run.hidden, `${g.id}: Run button visible in watch mode`).toBe(false);
      run.dispatchEvent(new Event('click', { bubbles: true }));

      // Advance the AI clock until the game ends (banner appears) or a generous cap is hit.
      const banner = document.getElementById('banner') as HTMLElement;
      let steps = 0;
      expect(() => {
        while (banner.hidden && steps++ < 5000) vi.advanceTimersByTime(450);
      }).not.toThrow();

      expect(banner.hidden, `${g.id}: game reached a terminal state (banner shown)`).toBe(false);
      expect(banner.textContent && banner.textContent.length > 0).toBe(true);

      expect(() => inst.destroy()).not.toThrow();
    });
  }
});
