// @vitest-environment jsdom
// Thin DOM smoke test against the slots contract: mount() into three slots, drive a few interactions
// (New game, switch to hotseat, claim a position, Hint, Undo) and assert nothing throws and the DOM
// actually updated. The engine itself is covered by the shared common/positional tests.
import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
});

function click(el: Element | null): void {
  el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

describe('MB Van der Waerden UI smoke (jsdom)', () => {
  it('mounts into slots, renders the board, and survives interactions without throwing', async () => {
    const { mount } = await import('../ui');
    const slots = {
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    };
    let inst: { destroy(): void } | undefined;
    expect(() => { inst = mount(slots); }).not.toThrow();

    const board = document.getElementById('board')!;
    // mount() runs startNewGame() -> render(), so the board should have SVG content.
    expect(board.innerHTML.length).toBeGreaterThan(0);
    expect(board.querySelectorAll('[data-cell]').length).toBeGreaterThan(0);

    // turn pill populated
    expect(document.getElementById('turnPill')!.textContent!.length).toBeGreaterThan(0);

    // New game
    expect(() => click(document.getElementById('newBtn'))).not.toThrow();

    // Switch to hotseat so both colours are human-controlled.
    const role = document.getElementById('roleSel') as HTMLSelectElement;
    role.value = 'both';
    expect(() => role.dispatchEvent(new window.Event('change', { bubbles: true }))).not.toThrow();

    // Claim a board cell — a real move should update the DOM.
    const turnBefore = document.getElementById('turnPill')!.textContent;
    const cell = document.querySelector('[data-cell]');
    expect(() => click(cell)).not.toThrow();
    const ownerCount = document.querySelectorAll('#board .cell.r').length;
    expect(ownerCount).toBeGreaterThanOrEqual(1); // a red cell now exists
    // The turn pill updated (Red -> Blue, or the game banner appeared).
    expect(document.getElementById('turnPill')!.textContent !== turnBefore
      || !document.getElementById('banner')!.hidden).toBe(true);

    // Hint and Undo must not throw.
    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();

    expect(() => inst!.destroy()).not.toThrow();
  });
});
