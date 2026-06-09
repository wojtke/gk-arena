// @vitest-environment jsdom
// A thin DOM smoke test against the slots contract: mount() the controller into three slots and drive
// a point→insert round that lands, plus Hint / Undo / destroy. We only assert nothing throws and the
// DOM updated — the engine is covered elsewhere.

import { describe, it, expect, beforeEach, vi } from 'vitest';

function click(el: Element | null): void {
  el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

describe('UI smoke (jsdom, slots contract)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
  });

  it('mounts, renders, and survives a full interaction cycle without throwing', async () => {
    const { mount } = await import('../ui');
    const slots = {
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    };

    let inst: { destroy(): void };
    expect(() => { inst = mount(slots); }).not.toThrow();

    expect(document.getElementById('word')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('palette')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('turnPill')!.textContent).not.toBe('');
    expect(document.getElementById('goalText')!.textContent).not.toBe('');

    // New game.
    expect(() => click(document.getElementById('newBtn'))).not.toThrow();

    // Hotseat so a human controls both sides, then play a real point→insert round.
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'both';
    roleSel.dispatchEvent(new window.Event('change'));

    expect(() => {
      click(document.querySelector('#word [data-gap]'));                       // Constructor points
      click(document.querySelector('#palette [data-sym]:not([disabled])'));    // Avoider inserts
    }).not.toThrow();

    // After a point + insert the word has length 1, reflected in the meter.
    expect(document.getElementById('meterValue')!.textContent).toBe('1 / 12');

    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();
    expect(document.getElementById('meterValue')!.textContent).toBe('0 / 12');

    expect(() => inst.destroy()).not.toThrow();
  });

  it('watch-AI runs to completion and shows the terminating banner', async () => {
    vi.useFakeTimers();
    try {
      const { mount } = await import('../ui');
      const slots = {
        settings: document.getElementById('slot-s')!,
        board: document.getElementById('slot-b')!,
        sidebar: document.getElementById('slot-r')!,
      };
      const inst = mount(slots);

      // Tight alphabet + small target so the game terminates fast in watch mode.
      const set = (id: string, v: string) => {
        const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
        el.value = v;
        el.dispatchEvent(new window.Event('change'));
      };
      set('kRange', '2');
      set('alphaRange', '2');
      set('nRange', '8');
      set('roleSel', 'none'); // watch AI vs AI; this also starts a new game

      // Start the AI loop and advance timers until the banner appears (bounded).
      click(document.getElementById('runBtn'));
      const banner = document.getElementById('banner')!;
      for (let i = 0; i < 200 && banner.hidden; i++) {
        vi.advanceTimersByTime(500);
      }
      expect(banner.hidden).toBe(false);
      expect(banner.textContent).toMatch(/wins/);

      inst.destroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
