import _ from 'lodash';

import {
  ClockTimeElapsed,
  ClockTimeRemaining,
  GameEvent,
  GameEventClockTime,
  GameEventShootout,
  GameProgress,
  GameState,
  GameStatus,
  GoalWithUpdateFields,
  isShootoutGoal,
  PauseEvent,
  Period,
} from '../types';
import {
  ADVANCE_CLOCK_STEP_MAX,
  ADVANCE_CLOCK_STEP_MIN,
  PERIOD_OVERTIME,
  PERIOD_SHOOTOUT,
} from './constants';

export function remainingTimeToElapsedTime({ period, minute, second }: ClockTimeRemaining): {
  period: number | string;
  minute: number;
  second: number;
} {
  const periodLengthInMinutes = period === 'OT' ? 5 : 20;
  const secondsRemaining = 60 * (minute ?? 0) + (second ?? 0);
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

export function hasGoalBeenScored(event: GameEventClockTime, goal: GoalWithUpdateFields): boolean {
  const minute = isShootoutGoal(goal) ? undefined : goal.min;
  const second = isShootoutGoal(goal) ? undefined : goal.sec;
  return hasElapsedTimePassed(event, { period: goal.period, minute, second });
}

export function hasClockPassedCurrentProgress(
  event: GameEventClockTime,
  status: GameStatus,
): boolean {
  const progressTime = status.state === 'LIVE' ? parseProgressTimeRemaining(status.progress) : null;
  if (!progressTime) {
    return false;
  }

  const progressTimeElapsed = remainingTimeToElapsedTime(progressTime);
  return hasElapsedTimePassed(event, progressTimeElapsed);
}

function hasElapsedTimePassed(event: GameEventClockTime, elapsedTime: ClockTimeElapsed): boolean {
  const { minute, second } = remainingTimeToElapsedTime(event);
  return (
    getPeriodOrdinal(elapsedTime.period) < getPeriodOrdinal(event.period) ||
    (getPeriodOrdinal(elapsedTime.period) === getPeriodOrdinal(event.period) &&
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
  currentGameEvent: GameEventClockTime | GameEventShootout,
  { classModifier, gameIndex, ...goal }: GoalWithUpdateFields,
  goalPauseEventCount: number,
): (GameEvent | PauseEvent)[] {
  return [
    { ...currentGameEvent, type: 'game-update', update: { gameIndex, type: 'start' } },
    {
      ...currentGameEvent,
      type: 'game-update',
      update: { gameIndex, classModifier, goal, type: 'goal' },
    },
    ..._.times(goalPauseEventCount, () => ({ type: 'pause' as const })),
    { ...currentGameEvent, type: 'game-update', update: { gameIndex, type: 'end' } },
  ];
}

export function getAdvanceClockStep(gameCount: number): number {
  const maxGameCount = 16;
  const normalizedGameCount = Math.min(Math.max(gameCount - 1, 0), maxGameCount - 1); // 0–15
  // Spread evenly across min and max clock step according to game count
  return (
    ADVANCE_CLOCK_STEP_MIN +
    Math.floor(
      (normalizedGameCount / maxGameCount) * (ADVANCE_CLOCK_STEP_MAX - ADVANCE_CLOCK_STEP_MIN + 1),
    )
  );
}
