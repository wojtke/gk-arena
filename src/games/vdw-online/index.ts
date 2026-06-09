import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const vdwOnline: GameModule = {
  id: 'vdw-online',
  title: 'VdW Online',
  tagline: 'Force a monochromatic progression',
  blurb: 'A Pointer chooses where each token goes; a Painter colours it. Force — or dodge — a monochromatic arithmetic progression. Toggle to off-diagonal targets to give each colour its own length.',
  topic: 'Van der Waerden online',
  family: 'Van der Waerden',
  mechanic: 'insertion',
  tags: ['arithmetic progressions', 'online', 'off-diagonal'],
  icon: `<svg viewBox="0 0 56 28" width="56" height="28">
            <circle cx="8" cy="14" r="5" fill="var(--red, #e5484d)"/>
            <circle cx="20" cy="14" r="5" fill="var(--blue, #2a6fdb)"/>
            <circle cx="32" cy="14" r="5" fill="var(--red, #e5484d)"/>
            <circle cx="44" cy="14" r="5" fill="var(--violet, #6e56cf)"/>
            <rect x="6" y="22" width="4" height="4" rx="1" fill="var(--red, #e5484d)"/>
            <rect x="30" y="22" width="4" height="4" rx="1" fill="var(--red, #e5484d)"/>
          </svg>`,
  mount,
};
