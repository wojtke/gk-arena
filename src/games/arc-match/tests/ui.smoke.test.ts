// @vitest-environment jsdom
//
// Smoke test for the DOM controller under the slots contract: mount() fills the three slots, and a
// few interactions (New game, a board click, a control change, hint, undo) drive the engine↔DOM
// wiring. We only assert that nothing throws and that the DOM actually updated — game logic is
// covered by the engine suites.

import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
});

describe('UI smoke (jsdom)', () => {
  it('mounts into slots, renders a board, and survives interactions without throwing', async () => {
    const { mount } = await import('../ui');
    const slots = {
      settings: document.getElementById('slot-s')!,
      board: document.getElementById('slot-b')!,
      sidebar: document.getElementById('slot-r')!,
    };
    let inst: { destroy(): void } | undefined;
    expect(() => { inst = mount(slots); }).not.toThrow();

    // Board rendered some arcs/points.
    const board = document.getElementById('board')!;
    expect(board.innerHTML.length).toBeGreaterThan(0);
    expect(board.querySelectorAll('[data-p]').length).toBeGreaterThan(0);

    // Turn pill populated.
    expect((document.getElementById('turnPill')!.textContent ?? '').length).toBeGreaterThan(0);

    // New game does not throw and keeps a board rendered.
    expect(() => document.getElementById('newBtn')!.dispatchEvent(new Event('click'))).not.toThrow();
    expect(document.getElementById('board')!.querySelectorAll('[data-p]').length).toBeGreaterThan(0);

    // Hotseat (both) so the human controls every turn — then make a real move on the board.
    const roleSel = document.getElementById('roleSel') as HTMLSelectElement;
    roleSel.value = 'both';
    expect(() => roleSel.dispatchEvent(new Event('change'))).not.toThrow();

    // A board click: click two free points -> a new arc appears.
    const pts = () => Array.from(document.getElementById('board')!.querySelectorAll('[data-p]'));
    const clickPt = (el: Element) => el.dispatchEvent(new Event('click', { bubbles: true }));
    const before = document.getElementById('board')!.querySelectorAll('path.arc').length;
    expect(() => { clickPt(pts()[0]); clickPt(pts()[1]); }).not.toThrow();
    const after = document.getElementById('board')!.querySelectorAll('path.arc').length;
    expect(after).toBeGreaterThan(before); // an arc was drawn

    // Hint and Undo do not throw.
    expect(() => document.getElementById('hintBtn')!.dispatchEvent(new Event('click'))).not.toThrow();
    expect(() => document.getElementById('undoBtn')!.dispatchEvent(new Event('click'))).not.toThrow();

    // The meter has content.
    expect(document.getElementById('meterValue')!.textContent ?? '').toMatch(/\d+\s*\/\s*\d+/);

    expect(() => inst!.destroy()).not.toThrow();
  });
});
