import _ from 'lodash';

export const GAME_DISPLAY_PRE_GAME = 'GAME_DISPLAY_PRE_GAME';
export const GAME_DISPLAY_PLAYBACK = 'GAME_DISPLAY_PLAYBACK';
export const GAME_DISPLAY_IN_PROGRESS = 'GAME_DISPLAY_IN_PROGRESS';
export const GAME_DISPLAY_POST_GAME = 'GAME_DISPLAY_POST_GAME';

export const GAME_STATE_FINISHED = 'FINAL';
export const GAME_STATE_IN_PROGRESS = 'LIVE';
export const GAME_STATE_NOT_STARTED = 'PREVIEW';

export const GAME_UPDATE_START = 'START';
export const GAME_UPDATE_GOAL = 'GOAL';
export const GAME_UPDATE_END = 'END';

export const PERIOD_OVERTIME = 'OT';
export const PERIOD_SHOOTOUT = 'SO';

export const PLAYBACK_NOT_STARTED = 'PLAYBACK_NOT_STARTED';
export const PLAYBACK_IN_PROGRESS = 'PLAYBACK_IN_PROGRESS';
export const PLAYBACK_FINISHED = 'PLAYBACK_FINISHED';

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
  return state !== GAME_STATE_NOT_STARTED;
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

export function truncatePlayerName(name) {
  const maxLength = 20;
  if (name.length <= maxLength) {
    return name;
  }

  const names = name.split(' ');
  const firstNames = _.dropRight(names);
  const abbreviatedFirstNames = _.flatten(
    firstNames.map(firstName => firstName.split('-').map(namePart => `${namePart[0]}.`))
  );
  return `${abbreviatedFirstNames.join('')} ${_.last(names)}`;
}

export function getGameAnimationIndexes(gameCount) {
  return _.times(gameCount, index => {
    const isEven = index % 2 === 0;
    // Animate first column (evens) from top to bottom, second column (odds) from bottom to top
    return isEven ? index / 2 : Math.floor((gameCount - index) / 2);
  });
}
