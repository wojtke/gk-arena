import type { GameModule } from '../../common/contract';
import { mount } from './ui';

export const ramseyWords: GameModule = {
  id: 'ramsey-words',
  title: 'Ramsey Words',
  tagline: 'Force two same-coloured adjacent blocks',
  blurb: 'Every length-l block has a fixed colour. One player forces two same-coloured blocks side by side; the other dodges to the target length.',
  topic: 'Ramsey on words online',
  family: 'Ramsey',
  mechanic: 'insertion',
  tags: ['colourings', 'online'],
  icon: `<svg viewBox="0 0 56 28" width="56" height="28">
            <rect x="3"  y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="16" y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="29" y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="42" y="8" width="11" height="12" rx="3" fill="#fff" stroke="var(--line,#dcdfe7)"/>
            <rect x="4"  y="22" width="9" height="3" rx="1.5" fill="#6e56cf"/>
            <rect x="17" y="22" width="9" height="3" rx="1.5" fill="#2a9d6b"/>
            <rect x="30" y="22" width="9" height="3" rx="1.5" fill="#2a9d6b"/>
            <rect x="43" y="22" width="9" height="3" rx="1.5" fill="#e5a32a"/>
          </svg>`,
  mount,
};
