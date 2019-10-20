import _ from 'lodash';

import { hasGoalBeenScored } from './utils';

const advanceClockStep = 3;

export default function periodEvents(
  period,
  durationInMinutes,
  endTime,
  goalScoringTimes,
  goalDelayMultiplier
) {
  const lastMinute = endTime ? endTime.minute : -1;
  const lastSecond = endTime ? endTime.second : -1;

  // Advance clock by second for all minutes but the last one of the 3rd period
  const allSecondEvents = generateSecondEvents(period, durationInMinutes, lastMinute, lastSecond);
  const secondEvents =
    period === 3 ? _.dropRightWhile(allSecondEvents, event => event.minute === 0) : allSecondEvents;

  // Advance clock by tenth of a second for the last minute of the 3rd period
  const tenthOfASecondEvents =
    period === 3 && lastMinute < 1
      ? generateTenthOfASecondEvents(period, lastMinute, lastSecond)
      : [];

  const firstEvent = { period, minute: durationInMinutes, second: 0 };
  const sequence = [firstEvent].concat(secondEvents, tenthOfASecondEvents);
  return multiplyGoalScoringTimeEvents(sequence, goalScoringTimes, goalDelayMultiplier);
}

function generateSecondEvents(period, durationInMinutes, lastMinute, lastSecond) {
  return _.flatten(
    minuteRange(durationInMinutes, lastMinute).map(minute =>
      secondRange(minute, lastMinute, lastSecond).map(second => ({
        period,
        minute,
        second
      }))
    )
  );
}

function generateTenthOfASecondEvents(period, lastMinute, lastSecond) {
  const minute = 0;
  return _.flatten(
    secondRange(minute, lastMinute, lastSecond).map(second =>
      _.range(9, -1, -advanceClockStep).map(tenthOfASecond => ({
        period,
        minute,
        second,
        tenthOfASecond
      }))
    )
  );
}

function minuteRange(firstMinute, lastMinute) {
  return _.range(firstMinute - 1, Math.max(lastMinute - 1, -1), -1);
}

function secondRange(minute, lastMinute, lastSecond) {
  const rangeEnd = minute === lastMinute ? lastSecond - 1 : -1;
  return _.range(59, rangeEnd, -advanceClockStep);
}

function multiplyGoalScoringTimeEvents(clockEvents, goalScoringTimes, goalDelayMultiplier) {
  return _.take(clockEvents).concat(
    _.flatten(
      _.zip(_.dropRight(clockEvents), _.drop(clockEvents)).map(([previousClock, currentClock]) => {
        const count = wasGoalScoredInRange(previousClock, currentClock, goalScoringTimes)
          ? goalDelayMultiplier
          : 1;
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
