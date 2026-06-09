// @vitest-environment jsdom
// A thin DOM smoke test against the slots contract: mount() the controller into three slots and drive
// a few interactions (New game, reroll χ, hotseat point->insert round, Hint, Undo, destroy). We only
// assert nothing throws and the DOM updated — the engine is covered elsewhere.

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

    // mount() runs startNewGame() -> render(): board / palette / status populated.
    expect(document.getElementById('word')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('palette')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('turnPill')!.textContent).not.toBe('');
    expect(document.getElementById('goalText')!.textContent).not.toBe('');
    expect(document.getElementById('legend')!.childElementCount).toBeGreaterThan(0);

    // New game.
    expect(() => click(document.getElementById('newBtn'))).not.toThrow();

    // Reroll χ (a fresh seeded colouring).
    expect(() => click(document.getElementById('rerollBtn'))).not.toThrow();

    // Switch to hotseat so a human controls both sides, then make a real round.
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'both';
    roleSel.dispatchEvent(new window.Event('change'));

    expect(() => {
      // Constructor points at the first gap (empty board shows a single caret at gap 0).
      click(document.querySelector('#word [data-gap]'));
      // Avoider inserts the first enabled palette letter.
      click(document.querySelector('#palette [data-sym]:not([disabled])'));
    }).not.toThrow();

    // After a point + insert the word has length 1, reflected in the meter (default target n=8).
    expect(document.getElementById('meterValue')!.textContent).toBe('1 / 8');

    // Hint highlights a strong move; Undo rolls it back. Neither should throw.
    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();

    expect(() => inst.destroy()).not.toThrow();
  });
});
