import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export { makeRng } from '../../common/rng';

export const differentBlocks: GameModule = {
  id: 'different-blocks',
  title: 'Different Blocks',
  tagline: 'k adjacent blocks, all distinct',
  blurb: 'Generalises the square game: one player forces k equal-length adjacent blocks with a repeat among them; the other keeps every such run all-different.',
  topic: 'Different blocks',
  family: 'Repetitions & Thue',
  mechanic: 'insertion',
  tags: ['k-blocks', 'generalised squares'],
  icon: `<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3" y="8" width="14" height="12" rx="3" fill="var(--blkA, #e5484d)"/>
            <rect x="19" y="8" width="14" height="12" rx="3" fill="var(--blkB, #2a9d6b)"/>
            <rect x="35" y="8" width="14" height="12" rx="3" fill="var(--blkA, #e5484d)"/>
          </svg>`,
  mount,
};
