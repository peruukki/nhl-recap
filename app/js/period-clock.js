import Rx from 'rx';
import _ from 'lodash';

import {hasGoalBeenScored} from './utils';

const advanceClockStep = 3;

export default function periodClock(period, durationInMinutes, endTime, goalScoringTimes, interval, scheduler) {
  const elements = generateSequence(period, durationInMinutes, endTime, goalScoringTimes);
  return Rx.Observable.interval(interval, scheduler)
    .takeWhile(index => index < elements.length)
    .map(index => elements[index]);
}

function generateSequence(period, durationInMinutes, endTime, goalScoringTimes) {
  const lastMinute = endTime ? endTime.minute : -1;
  const lastSecond = endTime ? endTime.second : -1;

  // Advance clock by second for all minutes but the last one of the 3rd period
  const allSecondElements = generateSecondElements(period, durationInMinutes, lastMinute, lastSecond);
  const secondElements = (period === 3) ? _.dropRight(allSecondElements, 60) : allSecondElements;

  // Advance clock by tenth of a second for the last minute of the 3rd period
  const tenthOfASecondElements = (period === 3) && (lastMinute < 1) ?
    generateTenthOfASecondElements(period, lastMinute, lastSecond) :
    [];

  const firstElement = { period, minute: durationInMinutes, second: 0 };
  const sequence = [firstElement].concat(secondElements, tenthOfASecondElements);
  return multiplyGoalScoringTimeElements(sequence, goalScoringTimes);
}

function generateSecondElements(period, durationInMinutes, lastMinute, lastSecond) {
  return _.flatten(
    minuteRange(durationInMinutes, lastMinute)
      .map(minute =>
        secondRange(minute, lastMinute, lastSecond)
          .map(second => ({ period, minute, second }))
      )
  );
}

function generateTenthOfASecondElements(period, lastMinute, lastSecond) {
  const minute = 0;
  return _.flatten(
    secondRange(minute, lastMinute, lastSecond)
      .map(second =>
        _.range(9, -1, -advanceClockStep)
          .map(tenthOfASecond => ({ period, minute, second, tenthOfASecond }))
      )
  );
}

function minuteRange(firstMinute, lastMinute) {
  return _.range(firstMinute - 1, Math.max(lastMinute - 1, -1), -1);
}

function secondRange(minute, lastMinute, lastSecond) {
  const rangeEnd = (minute === lastMinute) ? lastSecond - 1 : -1;
  return _.range(59, rangeEnd, -advanceClockStep);
}

function multiplyGoalScoringTimeElements(clockElements, goalScoringTimes) {
  const multiplier = 50;
  return _.take(clockElements).concat(
    _.flatten(
      _.zip(_.dropRight(clockElements), _.drop(clockElements))
        .map(([previousClock, currentClock]) => {
            const count = wasGoalScoredInRange(previousClock, currentClock, goalScoringTimes) ? multiplier : 1;
            return _.times(count, () => currentClock);
          })
    )
  );
}

function wasGoalScoredInRange(previousClock, currentClock, goalScoringTimes) {
  const previousLastGoalFilter = _.partial(hasGoalBeenScored, previousClock);
  const currentLastGoalFilter = _.partial(hasGoalBeenScored, currentClock);

  const previousLastGoalIndex = _.findLastIndex(goalScoringTimes, previousLastGoalFilter);
  const currentLastGoalIndex = _.findLastIndex(goalScoringTimes, currentLastGoalFilter);

  return previousLastGoalIndex !== currentLastGoalIndex;
}
