import _ from 'lodash';

import {
  ClockTimeElapsed,
  ClockTimeRemaining,
  GameEvent,
  GameEventClockTime,
  GameProgress,
  GameState,
  GameStatus,
  GoalWithUpdateFields,
  isShootoutGoal,
  PauseEvent,
  Period,
} from '../types';
import { PERIOD_OVERTIME, PERIOD_SHOOTOUT } from './constants';

export function remainingTimeToElapsedTime({ period, minute, second }: ClockTimeRemaining): {
  period: number | string;
  minute: number;
  second: number;
} {
  const periodLengthInMinutes = period === 'OT' ? 5 : 20;
  const secondsRemaining = 60 * (minute || 0) + (second || 0);
  const secondsElapsed = periodLengthInMinutes * 60 - secondsRemaining;
  const elapsedMinute = Math.floor(secondsElapsed / 60);
  const elapsedSecond = secondsElapsed - 60 * elapsedMinute;

  return { period, minute: elapsedMinute, second: elapsedSecond };
}

export function elapsedTimeToRemainingTime(time: ClockTimeElapsed): ClockTimeRemaining {
  return remainingTimeToElapsedTime(time);
}

export function hasGameFinished(state: GameState): boolean {
  return state === 'FINAL';
}

export function hasGameStarted(state: GameState): boolean {
  return !['PREVIEW', 'POSTPONED'].includes(state);
}

export function isGameInProgress(state: GameState): boolean {
  return state === 'LIVE';
}

export function hasGoalBeenScored(clock: GameEventClockTime, goal: GoalWithUpdateFields): boolean {
  const minute = isShootoutGoal(goal) ? undefined : goal.min;
  const second = isShootoutGoal(goal) ? undefined : goal.sec;
  return hasElapsedTimePassed(clock, { period: goal.period, minute, second });
}

export function hasClockPassedCurrentProgress(
  clock: GameEventClockTime,
  status: GameStatus,
): boolean {
  const progressTime = status.state === 'LIVE' ? parseProgressTimeRemaining(status.progress) : null;
  if (!progressTime) {
    return false;
  }

  const progressTimeElapsed = remainingTimeToElapsedTime(progressTime);
  return hasElapsedTimePassed(clock, progressTimeElapsed);
}

function hasElapsedTimePassed(clock: GameEventClockTime, elapsedTime: ClockTimeElapsed): boolean {
  const { minute, second } = remainingTimeToElapsedTime(clock);
  return (
    getPeriodOrdinal(elapsedTime.period) < getPeriodOrdinal(clock.period) ||
    (getPeriodOrdinal(elapsedTime.period) === getPeriodOrdinal(clock.period) &&
      ((elapsedTime.minute ?? 0) < minute ||
        (elapsedTime.minute === minute && (elapsedTime.second ?? 0) <= second)))
  );
}

function parseProgressTimeRemaining(progress: GameProgress): ClockTimeRemaining | null {
  const { min, sec } = progress.currentPeriodTimeRemaining;
  return { period: progress.currentPeriod, minute: min, second: sec };
}

export function getPeriodOrdinal(period: Period): number {
  switch (period) {
    case PERIOD_SHOOTOUT:
      return 5;
    case PERIOD_OVERTIME:
      return 4;
    default:
      return Number(period);
  }
}

export function getGoalEvents(
  currentGameEvent: GameEvent,
  { classModifier, gameIndex, ...goal }: GoalWithUpdateFields,
  goalPauseEventCount: number,
): (GameEvent | PauseEvent)[] {
  return [
    { ...currentGameEvent, update: { gameIndex, type: 'START' } },
    { ...currentGameEvent, update: { gameIndex, classModifier, goal, type: 'GOAL' } },
    ..._.times(goalPauseEventCount, getPauseEvent),
    { ...currentGameEvent, update: { gameIndex, type: 'END' } },
  ];
}

export function getPauseEvent(): PauseEvent {
  return { pause: true };
}
