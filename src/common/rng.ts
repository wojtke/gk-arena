// Seeded PRNG shared by every game (mulberry32). Byte-identical to the copy each standalone app
// shipped, so hoisting it here does not change any seeded sequence. Each game re-exports makeRng from
// its own index so existing test imports keep resolving.

export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
