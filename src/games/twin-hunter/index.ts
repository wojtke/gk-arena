import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const twinHunter: GameModule = {
  id: 'twin-hunter',
  title: "Twin Hunter",
  tagline: "Tight twins & shuffle squares",
  blurb: "Place symbols (or permutation values) while dodging — or forcing — two identical interleaved copies, a shuffle square. Recognising them is NP-hard.",
  topic: "Twins / shuffle squares",
  family: 'Twins & shuffle squares',
  mechanic: 'insertion',
  tags: ['shuffle squares', 'NP-hard', 'permutations'],
  icon: `<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3" y="8" width="11" height="12" rx="3" fill="var(--twinA, #e5484d)"/>
            <rect x="16" y="8" width="11" height="12" rx="3" fill="var(--twinB, #2a9d6b)"/>
            <rect x="29" y="8" width="11" height="12" rx="3" fill="var(--twinA, #e5484d)"/>
            <rect x="42" y="8" width="11" height="12" rx="3" fill="var(--twinB, #2a9d6b)"/>
          </svg>`,
  mount,
};
