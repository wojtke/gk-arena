import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const apPack: GameModule = {
  id: 'ap-pack',
  title: "AP-Pack",
  tagline: "Pack arithmetic progressions",
  blurb: "Place evenly-spaced “combs” on a strip without overlaps. Reach the optimal packing m(F) in solo mode, or out-pack / block your opponent in the two-player game.",
  topic: "AP packing",
  family: 'Packing',
  mechanic: 'packing',
  tags: ['m(F)', 'strip packing'],
  icon: `<svg viewBox="0 0 48 28" width="48" height="28">
            <line x1="6" y1="14" x2="42" y2="14" stroke="var(--line)" stroke-width="1.5"/>
            <circle cx="6" cy="14" r="3" fill="var(--red)"/><circle cx="16" cy="14" r="3" fill="var(--red)"/>
            <circle cx="26" cy="14" r="3" fill="var(--red)"/>
            <circle cx="36" cy="14" r="3" fill="var(--blue)"/><circle cx="42" cy="14" r="3" fill="var(--blue)"/>
          </svg>`,
  mount,
};
