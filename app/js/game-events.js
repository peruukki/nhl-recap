import _ from 'lodash';

import periodEvents from './period-events';
import {elapsedTimeToRemainingTime} from './utils';

export default function gameEvents(scores) {
  const gamesStartDelayMultiplier = 50;
  const periodEndDelayMultiplier = 150;
  const goalDelayMultiplier = 50;

  const eventsByPeriod = getAllPeriodEvents(scores, goalDelayMultiplier);
  const periodEnds = eventsByPeriod.map(onePeriodEvents => appendDelay(
    getPeriodEndElement(onePeriodEvents.period), periodEndDelayMultiplier)
  );
  const allPeriodEvents = eventsByPeriod.map(onePeriodEvents => onePeriodEvents.events);
  const periodSequences = _.chain()
    .zip(allPeriodEvents, periodEnds)
    .flatten()
    .value();

  return _.concat(
    appendDelay(getGamesStartElement(), gamesStartDelayMultiplier),
    ...periodSequences,
    getGamesEndElement()
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

function getGamesEndElement() {
  return { end: true };
}

function getAllPeriodEvents(scores, goalDelayMultiplier) {
  const endTime = getEndTime(scores);
  const goalScoringTimes = getGoalScoringTimes(scores);
  return getRegularPeriodClocks(endTime, goalScoringTimes, goalDelayMultiplier)
    .concat(getOvertimeClock(endTime, goalScoringTimes, goalDelayMultiplier))
    .concat(getShootoutClock(endTime))
    .filter(value => value);
}

function getRegularPeriodClocks(endTime, goalScoringTimes, goalDelayMultiplier) {
  const partialPeriodNumber = (endTime.period > 3) ? endTime.period : null;
  const fullPeriods = _.range(1, partialPeriodNumber || 4)
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

function getEndTime(scores) {
  const lastGoals = scores.map(game => _.last(game.goals));
  const isShootout = _.some(lastGoals, goal => goal.period === 'SO');

  if (isShootout) {
    return { period: 'SO' };
  } else {
    const lastOvertimeGoalTime = _.chain(lastGoals)
      .filter(goal => goal.period === 'OT' || goal.period > 3)
      .sortBy(['period', 'min', 'sec'])
      .map(goal => ({ period: goal.period, minute: goal.min, second: goal.sec }))
      .last()
      .value();

    return lastOvertimeGoalTime ?
      elapsedTimeToRemainingTime(lastOvertimeGoalTime) :
      { period: 3 };
  }
}

export function getGoalScoringTimes(scores) {
  return _.chain(scores.map(game => game.goals))
    .flatten()
    .sortBy(['period', 'min', 'sec'])
    .value();
}
