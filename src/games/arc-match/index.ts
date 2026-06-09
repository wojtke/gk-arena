import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const arcMatch: GameModule = {
  id: 'arc-match',
  title: "Arc Match",
  tagline: "Force crossing arcs on an ordered matching",
  blurb: "Draw arcs between points on a line and force a family of mutually-crossing arcs — a Maker–Breaker / Erdős–Szekeres game on ordered matchings.",
  topic: "Ordered matchings",
  family: 'Ordered matchings',
  mechanic: 'Maker–Breaker',
  tags: ['chord diagrams', 'Erdős–Szekeres'],
  icon: `<svg viewBox="0 0 48 28" width="48" height="28">
            <path d="M4 24 C 10 2, 26 2, 32 24" fill="none" stroke="var(--red)" stroke-width="3" stroke-linecap="round"/>
            <path d="M16 24 C 24 4, 40 4, 44 24" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>
          </svg>`,
  mount,
};
