// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

function click(el: Element | null): void {
  el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

describe('UI smoke (jsdom)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
  });

  function makeSlots() {
    return {
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    };
  }

  it('mounts and renders the board without throwing', async () => {
    const { mount } = await import('../ui');
    const slots = makeSlots();
    let inst: { destroy(): void } | undefined;
    expect(() => { inst = mount(slots); }).not.toThrow();

    const board = document.getElementById('board')!;
    expect(board.querySelectorAll('[data-cell]').length).toBeGreaterThan(0);
    // Solo is the default mode: a tray of comb tiles should be present.
    expect(document.querySelectorAll('#tray .combtile').length).toBeGreaterThan(0);
    // The turn pill is populated.
    expect(document.getElementById('turnPill')!.textContent).toBeTruthy();

    expect(() => inst!.destroy()).not.toThrow();
  });

  it('handles New game, board/tile clicks, hint and undo without throwing', async () => {
    const { mount } = await import('../ui');
    const slots = makeSlots();
    let inst: { destroy(): void } | undefined;
    inst = mount(slots);

    expect(() => {
      click(document.getElementById('newBtn'));

      // Select a tray tile then place it on a strip cell (solo placement flow).
      const tile = document.querySelector('#tray .combtile:not(.placed)');
      click(tile);
      const cell = document.querySelector('#board [data-cell="0"]');
      click(cell);

      // Ask for a hint.
      click(document.getElementById('hintBtn'));

      // Undo the placement.
      click(document.getElementById('undoBtn'));
    }).not.toThrow();

    // The DOM stayed live: the meter value reflects the engine state.
    expect(document.getElementById('meterValue')!.textContent).toBeTruthy();

    expect(() => inst!.destroy()).not.toThrow();
  });

  it('switches modes and exposes the Run button for a Watch-AI flow', async () => {
    const { mount } = await import('../ui');
    const slots = makeSlots();
    const inst = mount(slots);

    expect(() => {
      const modeSel = document.getElementById('modeSel') as HTMLSelectElement;
      modeSel.value = 'two-player';
      modeSel.dispatchEvent(new window.Event('change', { bubbles: true }));

      const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
      roleSel.value = 'both';
      roleSel.dispatchEvent(new window.Event('change', { bubbles: true }));

      // Make a real move in two-player (pick a tile, click a cell).
      const tile = document.querySelector('#tray .combtile');
      click(tile);
      const cell = document.querySelector('#board [data-cell="0"]');
      click(cell);

      roleSel.value = 'none';
      roleSel.dispatchEvent(new window.Event('change', { bubbles: true }));
    }).not.toThrow();

    const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
    expect(runBtn.hidden).toBe(false);

    expect(() => inst.destroy()).not.toThrow();
  });
});
