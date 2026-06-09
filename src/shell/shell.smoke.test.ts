// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

function fire(target: EventTarget, type: string): void {
  target.dispatchEvent(new Event(type, { bubbles: true }));
}

describe('shell (jsdom)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    document.body.className = '';
    location.hash = '';
  });

  it('renders the picker, mounts a game into three slots, collapses a card, switches and returns', async () => {
    const { startShell } = await import('./shell');
    startShell();
    const app = document.getElementById('app')!;

    // Picker shows one card per game.
    expect(app.querySelectorAll('.game-card').length).toBe(12);

    // Navigate into a game (back button lives in the left of the topbar).
    location.hash = '#/thue-arena';
    fire(window, 'hashchange');
    expect(document.querySelector('.topbar-left #hub-back')).toBeTruthy();
    expect(document.getElementById('hub-settings')!.children.length).toBeGreaterThan(0);
    expect(document.getElementById('hub-board')!.children.length).toBeGreaterThan(0);
    expect(document.getElementById('hub-sidebar')!.children.length).toBeGreaterThan(0);
    // Explainers are shown by default (no toggle anymore).
    expect(document.body.classList.contains('explain-on')).toBe(true);

    // Each left-panel card is collapsible via its header.
    const collapsible = document.querySelector('#hub-panel .card.collapsible') as HTMLElement;
    expect(collapsible).toBeTruthy();
    const h2 = collapsible.querySelector('h2') as HTMLElement;
    fire(h2, 'click');
    expect(collapsible.classList.contains('collapsed')).toBe(true);
    expect(h2.getAttribute('aria-expanded')).toBe('false');
    fire(h2, 'click');
    expect(collapsible.classList.contains('collapsed')).toBe(false);

    // Switch directly to another game (exercises teardown/destroy of the previous one).
    location.hash = '#/ap-pack';
    fire(window, 'hashchange');
    expect(document.getElementById('hub-board')!.children.length).toBeGreaterThan(0);

    // Back to the picker.
    location.hash = '#/';
    fire(window, 'hashchange');
    expect(app.querySelectorAll('.game-card').length).toBe(12);
  });

  it('clears a running AI timer when navigating away (no stray callback after destroy)', async () => {
    const { startShell } = await import('./shell');
    startShell();

    vi.useFakeTimers();
    try {
      location.hash = '#/mb-vdw';
      fire(window, 'hashchange');

      // Put it into watch-AI mode and press Run so an AI move is scheduled.
      const role = document.getElementById('roleSel') as HTMLSelectElement;
      role.value = 'none'; fire(role, 'change');
      const run = document.getElementById('runBtn') as HTMLButtonElement;
      fire(run, 'click');

      // Leave the game — destroy() must cancel the pending timer.
      location.hash = '#/';
      fire(window, 'hashchange');

      // If the timer were not cleared, aiStep would fire against a torn-down DOM and throw.
      expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});
