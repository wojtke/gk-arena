// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameSlots, GameInstance } from '../../../common/contract';

beforeEach(() => {
  document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
});

function slots(): GameSlots {
  return {
    settings: document.getElementById('slot-s')!,
    board: document.getElementById('slot-b')!,
    sidebar: document.getElementById('slot-r')!,
  };
}

function click(id: string) {
  document.getElementById(id)!.dispatchEvent(new Event('click', { bubbles: true }));
}

describe('UI smoke (jsdom)', () => {
  it('mounts into slots, renders the board, wires controls, and destroys cleanly', async () => {
    // Fresh module instance so module-level UI state resets between tests.
    vi.resetModules();
    const { mount } = await import('../ui');

    let inst: GameInstance | undefined;
    expect(() => { inst = mount(slots()); }).not.toThrow();

    // Board rendered: palette has k buttons, turn pill + meter populated.
    const palette = document.getElementById('palette')!;
    expect(palette.querySelectorAll('button').length).toBe(4); // default k=4
    expect(document.getElementById('turnPill')!.textContent).toContain('to move');
    expect(document.getElementById('meterValue')!.textContent).toContain('/');

    // New game resets cleanly.
    click('newBtn');
    expect(document.querySelectorAll('#word .tile').length).toBe(0);

    // Hotseat: both colours human, so moves don't get auto-played by the AI.
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'both';
    roleSel.dispatchEvent(new Event('change', { bubbles: true }));

    // A human clicks a palette letter -> the word grows by a tile.
    const before = document.querySelectorAll('#word .tile').length;
    (palette.querySelector('button:not([disabled])') as HTMLButtonElement).dispatchEvent(
      new Event('click', { bubbles: true }),
    );
    const after = document.querySelectorAll('#word .tile').length;
    expect(after).toBeGreaterThan(before);

    // Undo is now enabled; clicking it rewinds.
    expect((document.getElementById('undoBtn') as HTMLButtonElement).disabled).toBe(false);
    expect(() => click('undoBtn')).not.toThrow();
    expect(document.querySelectorAll('#word .tile').length).toBe(before);

    expect(() => inst!.destroy()).not.toThrow();
  });

  it('changing a slider starts a new game without throwing', async () => {
    vi.resetModules();
    const { mount } = await import('../ui');
    const inst = mount(slots());

    const dRange = document.getElementById('dRange') as HTMLInputElement;
    dRange.value = '6';
    dRange.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('dLabel')!.textContent).toBe('6');
    expect(document.querySelectorAll('#word .tile').length).toBe(0);

    expect(() => inst.destroy()).not.toThrow();
  });
});
