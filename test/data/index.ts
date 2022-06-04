import type { Scores } from 'app/js/types';

import latest from './latest.json';
import latestLive from './latest-live.json';
import latestLiveEndOfOT from './latest-live-end-of-ot.json';
import latestLiveEndOf2OT from './latest-live-end-of-2-ot.json';
import latestLiveSO from './latest-live-so.json';
import latestLive2OT from './latest-live-2-ot.json';
import latest2OT from './latest-2-ot.json';
import latestOT2SO from './latest-ot-2-so.json';
import latestPlayoffs from './latest-playoffs.json';
import latestPlayoffsOT from './latest-playoffs-ot.json';

export const scoresAllLive = latestLive as unknown as Scores;
export const scoresAllRegularTime = latest as unknown as Scores;
export const scoresAllRegularTimePlayoffs = latestPlayoffs as unknown as Scores;
export const scoresLiveEndOfOT = latestLiveEndOfOT as unknown as Scores;
export const scoresLiveEndOf2OT = latestLiveEndOf2OT as unknown as Scores;
export const scoresLiveProgressedMoreThanFinished = latestLive2OT as unknown as Scores;
export const scoresLiveSO = latestLiveSO as unknown as Scores;
export const scoresMultipleOvertime = latest2OT as unknown as Scores;
export const scoresOvertimeAndMultipleShootout = latestOT2SO as unknown as Scores;
export const scoresRegularTimeAndOvertimePlayoffs = latestPlayoffsOT as unknown as Scores;
