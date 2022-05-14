export const ERROR_MISSING_ALL_GOALS = 'MISSING-ALL-GOALS';
export const ERROR_SCORE_AND_GOAL_COUNT_MISMATCH = 'SCORE-AND-GOAL-COUNT-MISMATCH';

/** Showing pre-game information, before playback has started. */
export const GAME_DISPLAY_PRE_GAME = 'GAME_DISPLAY_PRE_GAME';
/** Playback has started, clock hasn't reached this game's end time. */
export const GAME_DISPLAY_PLAYBACK = 'GAME_DISPLAY_PLAYBACK';
/** Playback has started, clock has reached this in-progress game's current time. */
export const GAME_DISPLAY_IN_PROGRESS = 'GAME_DISPLAY_IN_PROGRESS';
/** Playback has finished, showing this finished game's post-game information. */
export const GAME_DISPLAY_POST_GAME_FINISHED = 'GAME_DISPLAY_POST_GAME_FINISHED';
/** Playback has finished, showing this in-progress game's post-game information. */
export const GAME_DISPLAY_POST_GAME_IN_PROGRESS = 'GAME_DISPLAY_POST_GAME_IN_PROGRESS';

export const GAME_STATE_FINISHED = 'FINAL';
export const GAME_STATE_IN_PROGRESS = 'LIVE';
export const GAME_STATE_NOT_STARTED = 'PREVIEW';
export const GAME_STATE_POSTPONED = 'POSTPONED';

export const GAME_UPDATE_START = 'START';
export const GAME_UPDATE_GOAL = 'GOAL';
export const GAME_UPDATE_END = 'END';

export const PERIOD_OVERTIME = 'OT';
export const PERIOD_SHOOTOUT = 'SO';

export const PLAYBACK_IN_PROGRESS = 'PLAYBACK_IN_PROGRESS';
export const PLAYBACK_FINISHED = 'PLAYBACK_FINISHED';
