import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const mbVdw: GameModule = {
  id: 'mb-vdw',
  title: "MB Van der Waerden",
  tagline: "Maker–Breaker: arithmetic progressions on a line",
  blurb: "Claim positions on a number line to complete a k-term arithmetic progression while your opponent blocks. The Erdős–Selfridge threshold decides who is favoured.",
  topic: "Maker–Breaker Van der Waerden",
  family: 'Van der Waerden',
  mechanic: 'Maker–Breaker',
  tags: ['arithmetic progressions', 'Erdős–Selfridge'],
  icon: `<svg viewBox="0 0 48 28" width="48" height="28">
            <circle cx="8" cy="14" r="3" fill="var(--red)"/><circle cx="20" cy="14" r="3" fill="var(--blue)"/>
            <circle cx="32" cy="14" r="3" fill="var(--red)"/><circle cx="44" cy="14" r="3" fill="var(--red)"/>
            <path d="M8 14 H44" stroke="var(--line)" stroke-width="1.5"/>
          </svg>`,
  mount,
};
