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

export type GameEventClockTime = {
  period: number | string;
  minute: number;
  second: number;
  tenthOfASecond?: number;
  end?: true;
};
export function isClockTimeEvent(event: GameEvent): event is GameEventClockTime {
  return !!(event as GameEventClockTime).period;
}

export type GameEventShootout = {
  period: 'SO';
};
export function isShootoutEvent(event: GameEvent): event is GameEventShootout {
  return (event as GameEventShootout).period === 'SO';
}

export type GameEventGameUpdate = GameEventClockTime & {
  update: GameUpdateEnd | GameUpdateGoal | GameUpdateStart;
};
export function isGameUpdateEvent(event: GameEvent | PauseEvent): event is GameEventGameUpdate {
  return !!(event as GameEventGameUpdate).update;
}

type GameUpdateBase<T extends string> = { gameIndex: number; type: T };
type GameUpdateEnd = GameUpdateBase<'END'>;
export type GameUpdateGoal = GameUpdateBase<'GOAL'> & {
  classModifier: 'away' | 'home';
  goal: Goal;
};
type GameUpdateStart = GameUpdateBase<'START'>;

export type GameEventEnd = { end: true; inProgress?: true };
export function isEndEvent(event: GameEvent): event is GameEventEnd {
  return (event as GameEventEnd).end;
}

export type PauseEvent = { pause: true };
export function isPauseEvent(event: GameEvent | PauseEvent): event is PauseEvent {
  return !!(event as PauseEvent).pause;
}

export type GameEventStart = { start: true };
export function isStartEvent(event: GameEvent): event is GameEventStart {
  return (event as GameEventStart).start;
}

export type GameEvent =
  | GameEventClockTime
  | GameEventEnd
  | GameEventGameUpdate
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
