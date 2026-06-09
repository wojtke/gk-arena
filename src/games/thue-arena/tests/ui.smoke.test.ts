// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
});

function click(el: Element | null): void {
  el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

describe('UI smoke test (jsdom)', () => {
  it('mounts, renders, and survives a handful of interactions without throwing', async () => {
    const { mount } = await import('../ui');
    const slots = {
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    };
    let inst: { destroy(): void };
    expect(() => { inst = mount(slots); }).not.toThrow();

    // After mount the board, palette and status pill exist and are populated.
    const word = document.getElementById('word')!;
    const palette = document.getElementById('palette')!;
    const pill = document.getElementById('turnPill')!;
    expect(palette.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(pill.textContent && pill.textContent.length > 0).toBe(true);

    // New game.
    expect(() => click(document.getElementById('newBtn'))).not.toThrow();

    // A board (caret) click and a palette (letter) click via event delegation.
    expect(() => click(word.querySelector('[data-gap]'))).not.toThrow();
    expect(() => click(palette.querySelector('[data-letter]'))).not.toThrow();

    // Switch to hotseat so both sides are human, then make a couple of real moves.
    const role = document.getElementById('roleSel') as HTMLSelectElement;
    role.value = 'both';
    role.dispatchEvent(new window.Event('change', { bubbles: true }));
    const game = document.getElementById('gameSel') as HTMLSelectElement;
    game.value = 'append';
    game.dispatchEvent(new window.Event('change', { bubbles: true }));

    const before = document.getElementById('word')!.querySelectorAll('.tile').length;
    click(document.getElementById('palette')!.querySelector('[data-letter]'));
    const after = document.getElementById('word')!.querySelectorAll('.tile').length;
    expect(after).toBe(before + 1); // the move landed and the DOM updated

    // Hint and Undo should not throw.
    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();

    expect(() => inst.destroy()).not.toThrow();
  });
});
