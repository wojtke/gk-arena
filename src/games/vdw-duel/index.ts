import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const vdwDuel: GameModule = {
  id: 'vdw-duel',
  title: 'VdW Duel',
  tagline: 'Don’t be the one who makes the progression',
  topic: 'Van der Waerden game',
  family: 'Van der Waerden',
  mechanic: 'misère duel',
  tags: ['arithmetic progressions', 'misère'],
  blurb: 'Two colours, one line. Each player drops their own tokens — and loses the moment they complete a monochromatic arithmetic progression.',
  icon: `<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3" y="8" width="11" height="12" rx="3" fill="var(--red, #e5484d)"/>
            <rect x="16" y="8" width="11" height="12" rx="3" fill="var(--blue, #3e63dd)"/>
            <rect x="29" y="8" width="11" height="12" rx="3" fill="var(--red, #e5484d)"/>
            <rect x="42" y="8" width="11" height="12" rx="3" fill="var(--blue, #3e63dd)"/>
          </svg>`,
  mount,
};
