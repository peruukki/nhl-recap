import { Goal } from './api';

export type ClockTimeElapsed = {
  period: number | string;
  minute?: number;
  second?: number;
};

export type ClockTimeRemaining = {
  period: number | string;
  minute?: number;
  second?: number;
  tenthOfASecond?: number;
};

/**
 * Game display states:
 *
 * - `in-progress`: playback has started, clock has reached this in-progress game's current time
 * - `playback`: playback has started, clock hasn't reached this game's end time
 * - `post-game-finished`: playback has finished, showing this finished game's post-game information
 * - `post-game-in-progress`: playback has finished, showing this in-progress game's post-game information
 * - `pre-game`: showing pre-game information, before playback has started
 */
export type GameDisplay =
  | 'in-progress'
  | 'playback'
  | 'post-game-finished'
  | 'post-game-in-progress'
  | 'pre-game';

export type GameEventClockTime<Type extends string = 'clock'> = GameEventBase<Type> & {
  period: number | string;
  minute: number;
  second: number;
  tenthOfASecond?: number;
};

export type GameEventShootout<Type extends string = 'shootout'> = GameEventBase<Type> & {
  period: 'SO';
};

export type GameEventGameUpdate = (
  | GameEventClockTime<'game-update'>
  | GameEventShootout<'game-update'>
) & {
  update: GameUpdateEnd | GameUpdateGoal | GameUpdateStart;
};

type GameUpdateBase<Type extends string> = { gameIndex: number; type: Type };
type GameUpdateEnd = GameUpdateBase<'end'>;
export type GameUpdateGoal = GameUpdateBase<'goal'> & {
  classModifier: 'away' | 'home';
  goal: Goal;
};
type GameUpdateStart = GameUpdateBase<'start'>;

type GameEventBase<Type extends string> = {
  type: Type;
};

export type GameEventEnd = GameEventBase<'end'> & { inProgress: boolean };

export type PauseEvent = GameEventBase<'pause'>;

export type GameEventPeriodEnd = GameEventBase<'period-end'> & Pick<GameEventClockTime, 'period'>;

export type GameEventStart = GameEventBase<'start'>;

export type GameEvent =
  | GameEventClockTime
  | GameEventEnd
  | GameEventGameUpdate
  | GameEventPeriodEnd
  | GameEventShootout
  | GameEventStart;

export type GameEndTime = {
  inProgress?: true;
  minute?: number;
  period: Period;
  second?: number;
};

export type GoalWithUpdateFields = Goal & { classModifier: 'away' | 'home'; gameIndex: number };

export type Period = number | string;

export type PeriodGameEvents = {
  period: Period;
  events: (GameEvent | PauseEvent)[];
};

export type TextualPeriod = 'OT' | 'SO';
