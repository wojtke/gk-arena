import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const thueArena: GameModule = {
  id: 'thue-arena',
  title: "Thue Arena",
  tagline: "Build a repetition-free word",
  blurb: "One player extends a word, the other forces a repeated block (a square). Avoid squares as long as you can — or force one. Includes an exact solver and an explanation mode.",
  topic: "Thue / nonrepetitive words",
  family: 'Repetitions & Thue',
  mechanic: 'insertion + append',
  tags: ['squares', 'nonrepetitive', 'abelian'],
  icon: `<svg viewBox="0 0 64 28" width="64" height="28">
            <rect x="2" y="8" width="13" height="13" rx="3" fill="var(--red)"/>
            <rect x="18" y="8" width="13" height="13" rx="3" fill="var(--blue)"/>
            <rect x="34" y="8" width="13" height="13" rx="3" fill="var(--red)"/>
            <rect x="50" y="8" width="13" height="13" rx="3" fill="var(--blue)" opacity="0.45"/>
          </svg>`,
  mount,
};
