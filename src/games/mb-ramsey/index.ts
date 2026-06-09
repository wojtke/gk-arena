import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const mbRamsey: GameModule = {
  id: 'mb-ramsey',
  title: "MB Ramsey",
  tagline: "Maker–Breaker: cliques on a graph",
  blurb: "Claim edges of a complete graph to complete a red clique while your opponent blocks. The Erdős–Selfridge threshold decides who is favoured.",
  topic: "Maker–Breaker Ramsey clique game",
  family: 'Ramsey',
  mechanic: 'Maker–Breaker',
  tags: ['cliques', 'Erdős–Selfridge'],
  icon: `<svg viewBox="0 0 48 28" width="48" height="28">
            <g stroke="var(--line)" stroke-width="1.5"><line x1="12" y1="6" x2="36" y2="6"/><line x1="12" y1="6" x2="24" y2="24"/><line x1="36" y1="6" x2="24" y2="24"/></g>
            <circle cx="12" cy="6" r="3" fill="var(--red)"/><circle cx="36" cy="6" r="3" fill="var(--red)"/><circle cx="24" cy="24" r="3" fill="var(--blue)"/>
          </svg>`,
  mount,
};
