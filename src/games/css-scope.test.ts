// Guards the anti-leakage invariant: because Vite bundles all CSS into one global sheet, every rule in
// a game's board.css MUST be scoped under that game's `.game-<id>` class, otherwise (e.g.) thue-arena's
// `.tile` and twin-hunter's `.tile` would clash. @keyframes are exempt (they are renamed per game).
import { describe, it, expect } from 'vitest';
import thue from './thue-arena/board.css?raw';
import twin from './twin-hunter/board.css?raw';
import eraser from './repetition-eraser/board.css?raw';
import ap from './ap-pack/board.css?raw';
import mbVdw from './mb-vdw/board.css?raw';
import mbRamsey from './mb-ramsey/board.css?raw';
import arc from './arc-match/board.css?raw';
import vdwOnline from './vdw-online/board.css?raw';
import vdwDuel from './vdw-duel/board.css?raw';
import ramsey from './ramsey-words/board.css?raw';
import grasshopper from './grasshopper/board.css?raw';
import diffBlocks from './different-blocks/board.css?raw';

const SHEETS: Array<[string, string]> = [
  ['thue-arena', thue], ['twin-hunter', twin], ['repetition-eraser', eraser],
  ['ap-pack', ap], ['mb-vdw', mbVdw], ['mb-ramsey', mbRamsey], ['arc-match', arc],
  ['vdw-online', vdwOnline], ['vdw-duel', vdwDuel],
  ['ramsey-words', ramsey], ['grasshopper', grasshopper], ['different-blocks', diffBlocks],
];

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Remove @keyframes blocks (brace-matched) so their percentage selectors are not checked.
function stripKeyframes(css: string): string {
  let out = '', i = 0;
  for (;;) {
    const idx = css.indexOf('@keyframes', i);
    if (idx < 0) return out + css.slice(i);
    out += css.slice(i, idx);
    let depth = 0, j = css.indexOf('{', idx);
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}' && --depth === 0) { j++; break; }
    }
    i = j;
  }
}

// Selector lists are the text before each `{` (skipping at-rules like @media, which start with '@';
// their inner rules are still picked up and must be scoped).
function selectorLists(css: string): string[] {
  const out: string[] = [];
  const re = /([^{}]+)\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const sel = m[1].trim();
    if (sel && !sel.startsWith('@')) out.push(sel);
  }
  return out;
}

describe('board.css scoping', () => {
  for (const [id, css] of SHEETS) {
    it(`${id}: every selector is scoped under .game-${id}`, () => {
      const clean = stripKeyframes(stripComments(css));
      for (const list of selectorLists(clean)) {
        for (const part of list.split(',')) {
          const p = part.trim();
          if (!p) continue;
          expect(p, `unscoped selector in ${id}/board.css: "${p}"`).toContain(`.game-${id}`);
        }
      }
    });
  }
});
