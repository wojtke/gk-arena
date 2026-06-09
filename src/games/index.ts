// The game registry. The shell renders the picker and routes from this list. Order = fallback order;
// the picker groups by `family`. Each game lives in its own folder and exposes a GameModule; no game
// imports another. (mb-vdw / mb-ramsey share the generic engine in src/common/positional.)

import type { GameModule } from '../common/contract';

import { thueArena } from './thue-arena';
import { repetitionEraser } from './repetition-eraser';
import { grasshopper } from './grasshopper';
import { differentBlocks } from './different-blocks';
import { twinHunter } from './twin-hunter';
import { vdwOnline } from './vdw-online';
import { vdwDuel } from './vdw-duel';
import { mbVdw } from './mb-vdw';
import { ramseyWords } from './ramsey-words';
import { mbRamsey } from './mb-ramsey';
import { apPack } from './ap-pack';
import { arcMatch } from './arc-match';

export const games: GameModule[] = [
  thueArena,
  repetitionEraser,
  grasshopper,
  differentBlocks,
  twinHunter,
  vdwOnline,
  vdwDuel,
  mbVdw,
  ramseyWords,
  mbRamsey,
  apPack,
  arcMatch,
];
