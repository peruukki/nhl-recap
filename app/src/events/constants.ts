// String constants
export const PERIOD_OVERTIME = 'OT';
export const PERIOD_SHOOTOUT = 'SO';

// Determine by how many units we advance the clock at each "tick" (seconds or tenths of a second)
export const ADVANCE_CLOCK_STEP_MAX = 6;
export const ADVANCE_CLOCK_STEP_MIN = 3;

// Determine for how many number of extra events we pause the clock
const PAUSE_EVENT_MULTIPLIER = 50;
export const GAME_PRE_SUMMARY_PAUSE_EVENT_COUNT = 1 * PAUSE_EVENT_MULTIPLIER;
export const GAME_SUMMARY_PAUSE_EVENT_COUNT = 1 * PAUSE_EVENT_MULTIPLIER;
export const GAMES_START_PAUSE_EVENT_COUNT = 1 * PAUSE_EVENT_MULTIPLIER;
/**
 * Event counts per number of assists in the goal event:
 * - unassisted => index zero
 * - one assist => index one
 * - two assists => index two
 */
export const GOAL_PAUSE_EVENT_COUNTS: [number, number, number] = [2, 2.5, 3].map(
  (x) => x * PAUSE_EVENT_MULTIPLIER,
) as [number, number, number];
export const PERIOD_END_PAUSE_EVENT_COUNT = 3 * PAUSE_EVENT_MULTIPLIER;
