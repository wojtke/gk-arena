// @vitest-environment jsdom
// A thin DOM smoke test against the slots contract: mount() the controller into three slots and drive
// a few interactions in BOTH Targets modes (diagonal + off-diagonal), including a move that lands a
// token. We only assert nothing throws and the DOM actually updated — the engine is covered elsewhere.

import { describe, it, expect, beforeEach, vi } from 'vitest';

function click(el: Element | null): void {
  el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}
function setSelect(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLSelectElement;
  el.value = value;
  el.dispatchEvent(new window.Event('change'));
}
function slots() {
  return {
    settings: document.getElementById('slot-s')!,
    board: document.getElementById('slot-b')!,
    sidebar: document.getElementById('slot-r')!,
  };
}
/** Hotseat (human both sides), then point at the first gap + paint the first enabled colour. */
function playOneRound(): void {
  setSelect('roleSel', 'both');
  click(document.querySelector('#line [data-gap]'));
  click(document.querySelector('#palette [data-color]:not([disabled])'));
}

describe('UI smoke (jsdom, slots contract)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="slot-s"></div><div id="slot-b"></div><div id="slot-r"></div>';
  });

  it('mounts, renders, and survives a full interaction cycle (diagonal, default)', async () => {
    const { mount } = await import('../ui');
    let inst: { destroy(): void };
    expect(() => { inst = mount(slots()); }).not.toThrow();

    // mount() runs startNewGame() -> render(); board / palette / status populated.
    expect(document.getElementById('line')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('palette')!.childElementCount).toBeGreaterThan(0);
    expect(document.getElementById('turnPill')!.textContent).not.toBe('');
    expect(document.getElementById('goalText')!.textContent).not.toBe('');

    // Diagonal mode: single k slider visible, per-colour controls hidden, ONE meter.
    expect((document.getElementById('kField') as HTMLElement).hidden).toBe(false);
    expect((document.getElementById('kvecField') as HTMLElement).hidden).toBe(true);
    expect(document.querySelectorAll('#meterrow .meter.mini').length).toBe(0);

    expect(() => click(document.getElementById('newBtn'))).not.toThrow();

    // Land a real token; meter reflects length 1.
    expect(() => playOneRound()).not.toThrow();
    expect(document.querySelectorAll('#line .tile').length).toBe(1);
    expect(document.getElementById('meterValue')!.textContent).toBe('1 / 18');

    expect(() => click(document.getElementById('hintBtn'))).not.toThrow();
    expect(() => click(document.getElementById('undoBtn'))).not.toThrow();
    expect(() => inst.destroy()).not.toThrow();
  });

  it('off-diagonal Targets: per-colour k controls + mini-meters, lands a token', async () => {
    const { mount } = await import('../ui');
    let inst: { destroy(): void };
    expect(() => { inst = mount(slots()); }).not.toThrow();

    // Switch Targets to off-diagonal.
    expect(() => setSelect('targetsSel', 'offdiagonal')).not.toThrow();

    // Per-colour k[i] sliders appear (default r=2 -> kRange0, kRange1); diagonal slider hidden.
    expect((document.getElementById('kField') as HTMLElement).hidden).toBe(true);
    expect((document.getElementById('kvecField') as HTMLElement).hidden).toBe(false);
    expect(document.getElementById('kRange0')).not.toBeNull();
    expect(document.getElementById('kRange1')).not.toBeNull();

    // One mini-meter per colour (plus the trailing length meter).
    expect(document.querySelectorAll('#meterrow .meter.mini').length).toBe(2);

    // Land a real token in off-diagonal mode.
    expect(() => playOneRound()).not.toThrow();
    expect(document.querySelectorAll('#line .tile').length).toBe(1);

    // Changing r rebuilds the per-colour controls and meters.
    setSelect('roleSel', 'none'); // detach human so r-change just rebuilds + restarts
    const rRange = document.getElementById('rRange') as HTMLInputElement;
    rRange.value = '3';
    rRange.dispatchEvent(new window.Event('change'));
    expect(document.getElementById('kRange2')).not.toBeNull();
    expect(document.querySelectorAll('#meterrow .meter.mini').length).toBe(3);

    expect(() => inst.destroy()).not.toThrow();
  });

  it('watch AI vs AI (Run) reaches a terminal #banner', async () => {
    vi.useFakeTimers();
    try {
      const { mount } = await import('../ui');
      const inst = mount(slots());

      // Watch mode on a small instance so the forcer wins quickly. r=2,k=3 diagonal, n=9 (= W(2;3)).
      setSelect('roleSel', 'none');
      const nRange = document.getElementById('nRange') as HTMLInputElement;
      nRange.value = '9';
      nRange.dispatchEvent(new window.Event('change'));

      // Press Run; AI moves are scheduled on setTimeout(AI_DELAY). Advance the fake clock until the
      // banner appears or we exhaust a generous step budget.
      click(document.getElementById('runBtn'));
      const banner = document.getElementById('banner')!;
      let guard = 0;
      while (banner.hidden && guard++ < 500) {
        vi.advanceTimersByTime(500);
      }
      expect(banner.hidden).toBe(false);
      expect(banner.textContent).not.toBe('');
      inst.destroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
