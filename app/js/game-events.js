import _ from 'lodash';

import periodEvents from './period-events';
import {elapsedTimeToRemainingTime, getPeriodOrdinal} from './utils';

export default function gameEvents(scores) {
  const gamesStartDelayMultiplier = 50;
  const periodEndDelayMultiplier = 150;
  const goalDelayMultiplier = 50;

  const endTime = getClockEndTime(scores);
  const eventsByPeriod = getAllPeriodEvents(scores, endTime, goalDelayMultiplier);
  const completedPeriodEvents = endTime.inProgress ? _.dropRight(eventsByPeriod, 1) : eventsByPeriod;
  const periodEnds = completedPeriodEvents.map(onePeriodEvents => appendDelay(
    getPeriodEndElement(onePeriodEvents.period), periodEndDelayMultiplier)
  );
  const allPeriodEvents = eventsByPeriod.map(onePeriodEvents => onePeriodEvents.events);
  const periodSequences = _.chain()
    .zip(allPeriodEvents, periodEnds)
    .flatten()
    .filter(_.identity)
    .value();

  return _.concat(
    appendDelay(getGamesStartElement(), gamesStartDelayMultiplier),
    ...periodSequences,
    getGamesEndElement(endTime.inProgress)
  );
}

function appendDelay(element, multiplier) {
  return _.times(multiplier, () => element);
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

function getAllPeriodEvents(scores, endTime, goalDelayMultiplier) {
  const goalScoringTimes = getGoalScoringTimes(scores);
  return getRegularPeriodClocks(endTime, goalScoringTimes, goalDelayMultiplier)
    .concat(getOvertimeClock(endTime, goalScoringTimes, goalDelayMultiplier))
    .concat(getShootoutClock(endTime))
    .filter(_.identity);
}

function getRegularPeriodClocks(endTime, goalScoringTimes, goalDelayMultiplier) {
  const partialPeriodNumber = getPartialPeriodNumber(endTime);
  const lastFullPeriodNumber = partialPeriodNumber ? partialPeriodNumber - 1 : getLastFullPeriodNumber(endTime);
  const fullPeriods = _.range(1, lastFullPeriodNumber + 1)
    .map(period => ({ period: period, events: periodEvents(period, 20, null, goalScoringTimes, goalDelayMultiplier) }));

  if (partialPeriodNumber) {
    const partialPeriod = {
      period: partialPeriodNumber,
      events: periodEvents(partialPeriodNumber, 20, endTime, goalScoringTimes, goalDelayMultiplier)
    };
    return fullPeriods.concat(partialPeriod);
  } else {
    return fullPeriods;
  }
}

function getPartialPeriodNumber(endTime) {
  return (!isNaN(endTime.period) && !hasLastPeriodEnded(endTime)) ? endTime.period : null;
}

function getLastFullPeriodNumber(endTime) {
  return (!isNaN(endTime.period) && hasLastPeriodEnded(endTime)) ? endTime.period : 3;
}

function hasLastPeriodEnded(endTime) {
  return endTime.minute === undefined;
}

function getOvertimeClock(endTime, goalScoringTimes, goalDelayMultiplier) {
  if (endTime.period !== 'SO' && endTime.period !== 'OT') {
    return null;
  } else {
    const periodEnd = (endTime.period === 'OT') ? endTime : null;
    return { period: 'OT', events: periodEvents('OT', 5, periodEnd, goalScoringTimes, goalDelayMultiplier) };
  }
}

function getShootoutClock(endTime) {
  return endTime.period === 'SO' ?
    { period: 'SO', events: [{ period: 'SO' }] } :
    null;
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
  return (value === undefined) ? 0 : -value;
}

function getGameEndTime(game) {
  return (game.status && game.status.state === 'LIVE') ?
    getGameEndTimeFromProgress(game.status.progress, !!game.playoffSeries) :
    getGameEndTimeFromGoals(game.goals);
}

function getGameEndTimeFromProgress(progress, isPlayoffGame) {
  const {min, sec} = progress.currentPeriodTimeRemaining;
  const hasEnded = min === 0 && sec === 0;
  return {
    period: !isPlayoffGame && _.includes(['OT', 'SO'], progress.currentPeriodOrdinal)
      ? progress.currentPeriodOrdinal
      : progress.currentPeriod,
    minute: hasEnded ? undefined : min,
    second: hasEnded ? undefined : sec,
    inProgress: true
  };
}

function getGameEndTimeFromGoals(goals) {
  const lastGoal = _.last(goals);
  if (!lastGoal) {
    return null;
  }

  const isOverTime = lastGoal.period === 'OT' || lastGoal.period > 3;
  const isShootout = lastGoal.period === 'SO';

  if (isOverTime) {
    return elapsedTimeToRemainingTime({ period: lastGoal.period, minute: lastGoal.min, second: lastGoal.sec });
  } else if (isShootout) {
    return { period: 'SO' };
  } else {
    return { period: 3 };
  }
}

export function getGoalScoringTimes(scores) {
  return _.chain(scores.map(game => game.goals))
    .flatten()
    .sortBy(['period', 'min', 'sec'])
    .value();
}
