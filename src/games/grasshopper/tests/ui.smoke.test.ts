// @vitest-environment jsdom
// A thin DOM smoke test against the slots contract: mount() the controller into three slots and drive
// a full build→hop round in hotseat (Builder appends letters via the palette, Grasshopper hops via a
// landing target), then Undo and destroy. We only assert that nothing throws and the DOM updates —
// the engine itself is covered by engine.test.ts / ai.test.ts.

import { describe, it, expect, beforeEach, vi } from 'vitest';

function click(el: Element | null): void {
  el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

describe('UI smoke (jsdom, slots contract)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
  });

  it('mounts, renders, and survives a full build→hop round + undo + destroy', async () => {
    const { mount } = await import('../ui');
    const slots = {
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    };

    let inst: { destroy(): void };
    expect(() => { inst = mount(slots); }).not.toThrow();

    // mount() runs startNewGame() -> render(); the board / palette / status are populated.
    expect(document.getElementById('palette')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('turnPill')!.textContent).not.toBe('');
    expect(document.getElementById('goalText')!.textContent).not.toBe('');

    // Switch to hotseat so a human controls both sides.
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'both';
    roleSel.dispatchEvent(new window.Event('change'));

    // New game (fresh build phase, Builder owes 2 letters by default).
    expect(() => click(document.getElementById('newBtn'))).not.toThrow();
    expect(document.getElementById('phaseLabel')!.textContent).toContain('Build');

    expect(() => {
      // Build phase: the Builder appends letters one at a time via the palette until the round flips
      // to the hop phase (needLeft = 0). Two clicks suffice from the start (need = 2).
      click(document.querySelector('#palette [data-letter]:not([disabled])'));
      click(document.querySelector('#palette [data-letter]:not([disabled])'));
    }).not.toThrow();

    // Now it is the hop phase: the word row shows clickable +1/+2 landing targets.
    const target = document.querySelector('#word [data-step]');
    expect(target).not.toBeNull();
    expect(() => click(target)).not.toThrow();

    // After one hop the inspected word S has length 1, reflected in the meter.
    expect(document.getElementById('meterValue')!.textContent).toBe('1 / 6');
    expect(document.getElementById('inspected')!.childElementCount).toBe(1);

    // Hint highlights a strong move; Undo rolls the last move back. Neither should throw.
    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();

    expect(() => inst.destroy()).not.toThrow();
  });

  it('watch-AI (role=none + Run) drives the board to a terminal #banner', async () => {
    vi.useFakeTimers();
    const { mount } = await import('../ui');
    const inst = mount({
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    });
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'none';
    roleSel.dispatchEvent(new window.Event('change'));

    const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
    expect(runBtn.hidden).toBe(false);
    click(runBtn);                  // start running
    vi.advanceTimersByTime(60000);  // flush the AI setTimeout chain

    const banner = document.getElementById('banner') as HTMLElement;
    expect(banner.hidden).toBe(false);
    expect(banner.textContent).toMatch(/wins/);
    inst.destroy();
    vi.useRealTimers();
  });
});
