import _ from 'lodash';

import {
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED,
  GAME_STATE_POSTPONED,
  GAME_UPDATE_END,
  GAME_UPDATE_GOAL,
  GAME_UPDATE_START,
  PERIOD_OVERTIME,
  PERIOD_SHOOTOUT,
} from './constants';

export function remainingTimeToElapsedTime({ period, minute, second }) {
  const periodLengthInMinutes = period === 'OT' ? 5 : 20;
  const secondsRemaining = 60 * (minute || 0) + (second || 0);
  const secondsElapsed = periodLengthInMinutes * 60 - secondsRemaining;
  const elapsedMinute = Math.floor(secondsElapsed / 60);
  const elapsedSecond = secondsElapsed - 60 * elapsedMinute;

  return { period, minute: elapsedMinute, second: elapsedSecond };
}

export function elapsedTimeToRemainingTime(time) {
  return remainingTimeToElapsedTime(time);
}

export function hasGameFinished(state) {
  return state === GAME_STATE_FINISHED;
}

export function hasGameStarted(state) {
  return ![GAME_STATE_NOT_STARTED, GAME_STATE_POSTPONED].includes(state);
}

export function isGameInProgress(state) {
  return state === GAME_STATE_IN_PROGRESS;
}

export function hasGoalBeenScored(clock, goal) {
  const { period, min: minute, sec: second } = goal;
  return hasElapsedTimePassed(clock, { period, minute, second });
}

export function hasClockPassedCurrentProgress(clock, status) {
  if (!clock) {
    return false;
  }

  const progressTime = parseProgressTimeRemaining(status.progress);
  if (!progressTime) {
    return false;
  }

  const progressTimeElapsed = remainingTimeToElapsedTime(progressTime);
  return hasElapsedTimePassed(clock, progressTimeElapsed);
}

function hasElapsedTimePassed(clock, elapsedTime) {
  const { minute, second } = remainingTimeToElapsedTime(clock);
  return (
    getPeriodOrdinal(elapsedTime.period) < getPeriodOrdinal(clock.period) ||
    (getPeriodOrdinal(elapsedTime.period) === getPeriodOrdinal(clock.period) &&
      (elapsedTime.minute < minute ||
        (elapsedTime.minute === minute && elapsedTime.second <= second)))
  );
}

function parseProgressTimeRemaining(progress) {
  if (!progress) {
    return null;
  }

  const { min, sec } = progress.currentPeriodTimeRemaining;
  return { period: progress.currentPeriod, minute: min, second: sec };
}

export function getPeriodOrdinal(period) {
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
  currentClock,
  { classModifier, gameIndex, ...goal },
  goalPauseEventCount
) {
  return [
    { ...currentClock, update: { gameIndex, type: GAME_UPDATE_START } },
    { ...currentClock, update: { gameIndex, classModifier, goal, type: GAME_UPDATE_GOAL } },
    ..._.times(goalPauseEventCount, getPauseElement),
    { ...currentClock, update: { gameIndex, type: GAME_UPDATE_END } },
  ];
}

export function getPauseElement() {
  return { pause: true };
}
