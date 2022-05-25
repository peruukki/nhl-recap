import * as _ from 'lodash';

import type {
  GameEvent,
  GoalWithUpdateFields,
  GameEndTime,
  GameEventClockTime,
  PauseEvent,
} from '../types';
import { getGoalEvents, hasGoalBeenScored } from './utils';

const advanceClockStep = 3;

export default function periodEvents(
  period: number | 'OT',
  durationInMinutes: number,
  endTime: Pick<GameEndTime, 'minute' | 'second'> | null,
  allGoalsSorted: GoalWithUpdateFields[],
  goalPauseEventCount: number,
): (GameEvent | PauseEvent)[] {
  const lastMinute = endTime?.minute ?? -1;
  const lastSecond = endTime?.second ?? -1;

  // Advance clock by second for all minutes but the last one of the 3rd period
  const allSecondEvents = generateSecondEvents(period, durationInMinutes, lastMinute, lastSecond);
  const secondEvents =
    period === 3
      ? _.dropRightWhile(allSecondEvents, (event) => event.minute === 0)
      : allSecondEvents;

  // Advance clock by tenth of a second for the last minute of the 3rd period
  const tenthOfASecondEvents =
    period === 3 && lastMinute < 1
      ? generateTenthOfASecondEvents(period, lastMinute, lastSecond)
      : [];

  const firstEvent: GameEventClockTime = { period, minute: durationInMinutes, second: 0 };
  const sequence = [firstEvent].concat(secondEvents, tenthOfASecondEvents);
  return createGoalEvents(sequence, allGoalsSorted, goalPauseEventCount);
}

function generateSecondEvents(
  period: GameEventClockTime['period'],
  durationInMinutes: number,
  lastMinute: number,
  lastSecond: number,
): GameEventClockTime[] {
  return _.flatten(
    minuteRange(durationInMinutes, lastMinute).map((minute) =>
      secondRange(minute, lastMinute, lastSecond).map((second) => ({
        period,
        minute,
        second,
      })),
    ),
  );
}

function generateTenthOfASecondEvents(
  period: GameEventClockTime['period'],
  lastMinute: number,
  lastSecond: number,
): GameEventClockTime[] {
  const minute = 0;
  return _.flatten(
    secondRange(minute, lastMinute, lastSecond).map((second) =>
      _.range(9, -1, -advanceClockStep).map((tenthOfASecond) => ({
        period,
        minute,
        second,
        tenthOfASecond,
      })),
    ),
  );
}

function minuteRange(firstMinute: number, lastMinute: number): number[] {
  return _.range(firstMinute - 1, Math.max(lastMinute - 1, -1), -1);
}

function secondRange(minute: number, lastMinute: number, lastSecond: number): number[] {
  const rangeEnd = minute === lastMinute ? Math.max(lastSecond - advanceClockStep, -1) : -1;
  const initialRange = _.range(59, rangeEnd, -advanceClockStep);
  // Ensure the final seconds of the last minute are included
  const isLastMinute = minute === lastMinute || (minute === 0 && lastMinute === -1);
  const lastIncludedSecond = _.last(initialRange) as number;
  const areFinalSecondsExcluded = isLastMinute && lastSecond < lastIncludedSecond;
  return areFinalSecondsExcluded ? initialRange.concat(0) : initialRange;
}

function createGoalEvents(
  clockEvents: GameEventClockTime[],
  allGoalsSorted: GoalWithUpdateFields[],
  goalPauseEventCount: number,
): (GameEvent | PauseEvent)[] {
  return _.take<GameEvent | PauseEvent>(clockEvents).concat(
    _.flatten(
      _.zip(_.dropRight(clockEvents), _.drop(clockEvents)).map(([previousClock, currentClock]) => {
        const goalsScoredSincePreviousTime = getGoalsScoredInTimeRange(
          previousClock as GameEventClockTime,
          currentClock as GameEventClockTime,
          allGoalsSorted,
        );
        return goalsScoredSincePreviousTime.length === 0
          ? [currentClock as GameEvent]
          : _.flatten(
              goalsScoredSincePreviousTime.map((goal) =>
                getGoalEvents(currentClock as GameEvent, goal, goalPauseEventCount),
              ),
            );
      }),
    ),
  );
}

function getGoalsScoredInTimeRange(
  previousClock: GameEventClockTime,
  currentClock: GameEventClockTime,
  allGoalsSorted: GoalWithUpdateFields[],
): GoalWithUpdateFields[] {
  const previousLastGoalFilter = _.partial(hasGoalBeenScored, previousClock);
  const currentLastGoalFilter = _.partial(hasGoalBeenScored, currentClock);

  const previousLastGoalIndex = _.findLastIndex(allGoalsSorted, previousLastGoalFilter);
  const currentLastGoalIndex = _.findLastIndex(allGoalsSorted, currentLastGoalFilter);

  return allGoalsSorted.slice(previousLastGoalIndex + 1, currentLastGoalIndex + 1);
}
