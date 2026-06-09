import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const repetitionEraser: GameModule = {
  id: 'repetition-eraser',
  title: "Repetition Eraser",
  tagline: "A grow-and-shrink word game",
  blurb: "Append letters; squares at the end are erased, so the word grows and shrinks. Reach the target length (Grower) — or stall it out until the moves run out (Shrinker).",
  topic: "Square-free reducts",
  family: 'Repetitions & Thue',
  mechanic: 'append + erase',
  tags: ['square-free', 'grow & shrink'],
  icon: `<svg viewBox="0 0 52 28" width="52" height="28">
            <rect x="3" y="8" width="12" height="12" rx="3" fill="var(--red)"/>
            <rect x="18" y="8" width="12" height="12" rx="3" fill="var(--blue)"/>
            <rect x="33" y="8" width="12" height="12" rx="3" fill="var(--red)" opacity="0.4"/>
          </svg>`,
  mount,
};
