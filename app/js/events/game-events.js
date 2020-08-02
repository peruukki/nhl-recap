import _ from 'lodash';

import { PERIOD_OVERTIME, PERIOD_SHOOTOUT } from './constants';
import periodEvents from './period-events';
import shootoutEvents from './shootout-events';
import {
  elapsedTimeToRemainingTime,
  getPauseElement,
  getPeriodOrdinal,
  hasGameFinished,
} from './utils';

export default function gameEvents(scores) {
  // These event counts determine for how many number of extra events we pause the clock
  const pauseMultiplier = 50;
  const gamesStartPauseEventCount = 1 * pauseMultiplier;
  const periodEndPauseEventCount = 3 * pauseMultiplier;
  const goalPauseEventCount = 2 * pauseMultiplier;

  const endTime = getClockEndTime(scores);
  const eventsByPeriod = getAllPeriodEvents(scores, endTime, goalPauseEventCount);
  const completedPeriodEvents = endTime.inProgress
    ? _.dropRight(eventsByPeriod, 1)
    : eventsByPeriod;
  const periodEnds = completedPeriodEvents.map(onePeriodEvents =>
    appendDelay(getPeriodEndElement(onePeriodEvents.period), periodEndPauseEventCount)
  );
  const allPeriodEvents = eventsByPeriod.map(onePeriodEvents => onePeriodEvents.events);
  const periodSequences = _.chain()
    .zip(allPeriodEvents, periodEnds)
    .flatten()
    .filter(_.identity)
    .value();

  return _.concat(
    appendDelay(getGamesStartElement(), gamesStartPauseEventCount),
    ...periodSequences,
    getGamesEndElement(endTime.inProgress)
  );
}

function appendDelay(element, multiplier) {
  return [element, ..._.times(multiplier, getPauseElement)];
}

function getPeriodEndElement(period) {
  return { period, end: true };
}

function getGamesStartElement() {
  return { start: true };
}

function getGamesEndElement(inProgress) {
  return inProgress ? { end: true, inProgress } : { end: true };
}

function getAllPeriodEvents(scores, endTime, goalPauseEventCount) {
  const allGoalsSorted = getAllGoalsSorted(scores);
  return getRegularPeriodClocks(endTime, allGoalsSorted, goalPauseEventCount)
    .concat(getOvertimeClock(endTime, allGoalsSorted, goalPauseEventCount))
    .concat(getShootoutClock(endTime, allGoalsSorted, goalPauseEventCount))
    .filter(_.identity);
}

function getRegularPeriodClocks(endTime, allGoalsSorted, goalPauseEventCount) {
  const partialPeriodNumber = getPartialPeriodNumber(endTime);
  const lastFullPeriodNumber = partialPeriodNumber
    ? partialPeriodNumber - 1
    : getLastFullPeriodNumber(endTime);
  const fullPeriods = _.range(1, lastFullPeriodNumber + 1).map(period => ({
    period,
    events: periodEvents(period, 20, null, allGoalsSorted, goalPauseEventCount),
  }));

  if (partialPeriodNumber) {
    const partialPeriod = {
      period: partialPeriodNumber,
      events: periodEvents(partialPeriodNumber, 20, endTime, allGoalsSorted, goalPauseEventCount),
    };
    return fullPeriods.concat(partialPeriod);
  }
  return fullPeriods;
}

function getPartialPeriodNumber(endTime) {
  return !isNaN(endTime.period) && !hasLastPeriodEnded(endTime) ? endTime.period : null;
}

function getLastFullPeriodNumber(endTime) {
  return !isNaN(endTime.period) && hasLastPeriodEnded(endTime) ? endTime.period : 3;
}

function hasLastPeriodEnded(endTime) {
  return endTime.minute === undefined;
}

function getOvertimeClock(endTime, allGoalsSorted, goalPauseEventCount) {
  if (endTime.period !== PERIOD_SHOOTOUT && endTime.period !== PERIOD_OVERTIME) {
    return null;
  }
  const periodEnd = endTime.period === PERIOD_OVERTIME ? endTime : null;
  return {
    period: PERIOD_OVERTIME,
    events: periodEvents(PERIOD_OVERTIME, 5, periodEnd, allGoalsSorted, goalPauseEventCount),
  };
}

function getShootoutClock(endTime, allGoalsSorted, goalPauseEventCount) {
  return endTime.period === PERIOD_SHOOTOUT
    ? { period: PERIOD_SHOOTOUT, events: shootoutEvents(allGoalsSorted, goalPauseEventCount) }
    : null;
}

function getClockEndTime(scores) {
  const gameEndTimes = scores.map(getGameEndTime);
  return _.chain(gameEndTimes)
    .filter(_.identity)
    .sortBy([getPeriodIteratee, getMinuteIteratee, getSecondIteratee])
    .last()
    .value();
}

function getPeriodIteratee(event) {
  return getPeriodOrdinal(event.period);
}

function getMinuteIteratee(event) {
  return getTimeValueIteratee(event.minute);
}
function getSecondIteratee(event) {
  return getTimeValueIteratee(event.second);
}
function getTimeValueIteratee(value) {
  // The time value is remaining time and undefined means end of period
  return value === undefined ? 0 : -value;
}

function getGameEndTime(game) {
  const isPlayoffGame = !!game.preGameStats && !!game.preGameStats.playoffSeries;
  return game.status && game.status.state === 'LIVE'
    ? getGameEndTimeFromProgress(game.status.progress, isPlayoffGame)
    : getGameEndTimeFromGoals(game.goals);
}

function getGameEndTimeFromProgress(progress, isPlayoffGame) {
  const { min, sec } = progress.currentPeriodTimeRemaining;
  const hasEnded = min === 0 && sec === 0;
  return {
    period:
      !isPlayoffGame &&
      _.includes([PERIOD_OVERTIME, PERIOD_SHOOTOUT], progress.currentPeriodOrdinal)
        ? progress.currentPeriodOrdinal
        : progress.currentPeriod,
    minute: hasEnded ? undefined : min,
    second: hasEnded ? undefined : sec,
    inProgress: true,
  };
}

function getGameEndTimeFromGoals(goals) {
  const lastGoal = _.last(goals);
  if (!lastGoal) {
    return null;
  }

  const isOverTime = lastGoal.period === PERIOD_OVERTIME || lastGoal.period > 3;
  const isShootout = lastGoal.period === PERIOD_SHOOTOUT;

  if (isOverTime) {
    return elapsedTimeToRemainingTime({
      period: lastGoal.period,
      minute: lastGoal.min,
      second: lastGoal.sec,
    });
  }
  return isShootout ? { period: PERIOD_SHOOTOUT } : { period: 3 };
}

export function getAllGoalsSorted(scores) {
  return _.chain(
    scores.map((game, gameIndex) =>
      _.chain(game.goals)
        .reject(
          goal =>
            goal.period === PERIOD_SHOOTOUT && game.status && !hasGameFinished(game.status.state)
        )
        .map(goal => ({
          ...goal,
          gameIndex,
          classModifier: goal.team === game.teams.away.abbreviation ? 'away' : 'home',
        }))
        .value()
    )
  )
    .flatten()
    .sortBy(['period', 'min', 'sec'])
    .value();
}
