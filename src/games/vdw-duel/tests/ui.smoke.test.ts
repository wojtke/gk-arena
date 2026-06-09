// @vitest-environment jsdom
// Thin DOM smoke test against the slots contract: mount() into three slots and drive interactions —
// place via caret for BOTH colours in hotseat, then undo and destroy. We only assert nothing throws
// and the DOM updates; the engine is covered elsewhere.

import { describe, it, expect, beforeEach } from 'vitest';

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

    expect(document.getElementById('line')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('turnPill')!.textContent).not.toBe('');
    expect(document.getElementById('goalText')!.textContent).not.toBe('');

    // New game.
    expect(() => click(document.getElementById('newBtn'))).not.toThrow();

    // Hotseat so a human controls both colours.
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'both';
    roleSel.dispatchEvent(new window.Event('change'));

    expect(() => {
      // Red places at the first caret (empty board renders a single caret at gap 0).
      click(document.querySelector('#line [data-gap]'));
      // Blue then places at the first available caret.
      click(document.querySelector('#line [data-gap]'));
    }).not.toThrow();

    // Two tokens placed → two tiles on the line.
    expect(document.querySelectorAll('#line .tile').length).toBe(2);

    // Hint + Undo must not throw.
    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();

    expect(() => inst.destroy()).not.toThrow();
  });
});
