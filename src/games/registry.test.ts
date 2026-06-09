import { describe, it, expect } from 'vitest';
import { games } from './index';

describe('game registry', () => {
  it('lists twelve games with complete, unique metadata and a mount()', () => {
    expect(games).toHaveLength(12);

    const ids = games.map((g) => g.id);
    expect(new Set(ids).size).toBe(12); // ids are unique

    for (const g of games) {
      expect(g.id, 'id is kebab-case').toMatch(/^[a-z][a-z0-9-]*$/);
      for (const field of ['title', 'tagline', 'blurb', 'topic'] as const) {
        expect(typeof g[field]).toBe('string');
        expect(g[field].length, `${g.id}.${field} non-empty`).toBeGreaterThan(0);
      }
      expect(typeof g.mount, `${g.id}.mount is a function`).toBe('function');
      expect(typeof g.icon === 'string' && g.icon.length > 0, `${g.id} has an icon`).toBe(true);

      // category tags
      expect(
        ['Repetitions & Thue', 'Twins & shuffle squares', 'Van der Waerden', 'Ramsey', 'Packing', 'Ordered matchings'],
        `${g.id}.family is valid`,
      ).toContain(g.family);
      expect(typeof g.mechanic === 'string' && g.mechanic.length > 0, `${g.id}.mechanic non-empty`).toBe(true);
    }
  });

  it('every family in FAMILY order has at least one game', () => {
    const families = new Set(games.map((g) => g.family));
    for (const fam of ['Repetitions & Thue', 'Twins & shuffle squares', 'Van der Waerden', 'Ramsey', 'Packing', 'Ordered matchings']) {
      expect(families.has(fam as (typeof games)[number]['family']), `${fam} has a game`).toBe(true);
    }
  });
});
