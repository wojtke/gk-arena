import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const grasshopper: GameModule = {
  id: 'grasshopper',
  title: 'Grasshopper',
  tagline: 'Hop to force a square — or keep every path clean',
  topic: 'Forbidden patterns with a grasshopper',
  family: 'Repetitions & Thue',
  mechanic: 'build + hop',
  tags: ['subsequence', 'pursuit'],
  blurb: 'A builder appends letters trying to keep the path clean; a grasshopper hops over them, and only the letters it lands on are judged. Hop to force a square into that path — or build to dodge it forever.',
  icon: `<svg viewBox="0 0 64 28" width="64" height="28">
            <rect x="2" y="9" width="12" height="12" rx="3" fill="var(--blue)"/>
            <rect x="16" y="9" width="12" height="12" rx="3" fill="var(--blue)" opacity="0.5"/>
            <rect x="30" y="9" width="12" height="12" rx="3" fill="var(--blue)"/>
            <path d="M8 8 q11 -10 22 0" fill="none" stroke="var(--red)" stroke-width="2.2"/>
            <circle cx="30" cy="6" r="3.4" fill="var(--red)"/>
          </svg>`,
  mount,
};
