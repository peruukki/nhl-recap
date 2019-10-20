import _ from 'lodash';
import { assert } from 'chai';

import periodEvents from '../app/js/period-events';

// Use short period times to speed up the tests
const periodLengthInMinutes = 3;

const clockAdvanceStep = 3;
const goalPauseEventCount = 50;

describe('periodEvents', () => {
  it('should include full period events if no end time is given', () => {
    const clockEvents = periodEvents(1, periodLengthInMinutes, null, [], goalPauseEventCount);
    assert.deepEqual(clockEvents.length, 61);
    assert.deepEqual(_.last(clockEvents), { period: 1, minute: 0, second: 2 });
  });

  it('should stop at given end time', () => {
    const period = 1;
    const endTime = { minute: 2, second: 53 };
    const clockEvents = periodEvents(
      period,
      periodLengthInMinutes,
      endTime,
      [],
      goalPauseEventCount
    );

    const secondEvents = _.range(59, endTime.second - 1, -clockAdvanceStep).map(second => ({
      period,
      minute: 2,
      second
    }));
    const expected = [firstEvent(period, periodLengthInMinutes)].concat(secondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should advance by three seconds for all minutes of a period but the last one', () => {
    const period = 1;
    const clockEventCount = ((periodLengthInMinutes - 1) * 60) / clockAdvanceStep + 1;
    const clockEvents = _.take(
      periodEvents(period, periodLengthInMinutes, null, [], goalPauseEventCount),
      clockEventCount
    );

    const minutes = _.range(periodLengthInMinutes - 1, 0, -1);
    const seconds = _.range(59, -1, -clockAdvanceStep);
    const secondEvents = _.flatMap(minutes, minute =>
      seconds.map(second => ({ period, minute, second }))
    );
    const expected = [firstEvent(period, periodLengthInMinutes)].concat(secondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should advance by three seconds for the last minute of any period but the 3rd one', () => {
    [1, 2, 'OT'].forEach(period => {
      // Use only one minute period length to speed up and simplify the test
      const periodLength = 1;
      const clockEvents = periodEvents(period, periodLength, null, [], goalPauseEventCount);

      const secondEvents = _.range(59, -1, -clockAdvanceStep).map(second => ({
        period,
        minute: 0,
        second
      }));
      const expected = [firstEvent(period, periodLength)].concat(secondEvents);

      assert.deepEqual(clockEvents, expected);
    });
  });

  it('should advance by three tenths of a second for the last minute of the 3rd period', () => {
    const period = 3;
    const periodLength = 1;
    // Take only the first second to speed up and simplify the test
    const clockEvents = _.take(
      periodEvents(period, periodLength, null, [], goalPauseEventCount),
      5
    );

    const tenthOfASecondEvents = _.range(9, -1, -clockAdvanceStep).map(tenthOfASecond => ({
      period,
      minute: 0,
      second: 59,
      tenthOfASecond
    }));
    const expected = [firstEvent(period, periodLength)].concat(tenthOfASecondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should pause by extra clock events when goals were scored since last event', () => {
    const assertLastEvent = (allGoalsSorted, expectedGoalCount, expectedIndexes, description) => {
      const period = 1;
      const periodLength = 20;
      const goalPauseEventCount = 50;

      const clockEvents = periodEvents(
        period,
        periodLength,
        null,
        allGoalsSorted,
        goalPauseEventCount
      );
      const eventCount = 401 + expectedGoalCount * goalPauseEventCount;
      const lastTimeEvent = { period: 1, minute: 0, second: 2 };

      assert.deepEqual(clockEvents.length, eventCount);
      assert.deepEqual(_.last(clockEvents), lastTimeEvent, description);

      expectedIndexes.forEach(index => {
        const eventsWithGameIndex = clockEvents.filter(({ gameIndex }) => gameIndex === index);
        assert.deepEqual(eventsWithGameIndex.length, goalPauseEventCount);
      });
    };

    // Assert that last event is as expected without goal scoring times
    assertLastEvent([], 0, [], 'last event without goal scoring times');

    // Assert that last event is as expected with goal scoring times
    const allGoalsSortedWithMultipleGoalsAtDifferingTimes = [
      { period: 1, min: 1, sec: 1, gameIndex: 5 },
      { period: 1, min: 2, sec: 2, gameIndex: 1 },
      { period: 2, min: 1, sec: 1, gameIndex: 2 }
    ];
    assertLastEvent(
      allGoalsSortedWithMultipleGoalsAtDifferingTimes,
      2,
      [5, 1],
      'last event with goal scoring times with goals at different times'
    );

    const allGoalsSortedWithMultipleGoalsAtTheSameTime = [
      { period: 1, min: 1, sec: 1, gameIndex: 4 },
      { period: 1, min: 1, sec: 1, gameIndex: 3 },
      { period: 2, min: 1, sec: 1, gameIndex: 0 }
    ];
    assertLastEvent(
      allGoalsSortedWithMultipleGoalsAtTheSameTime,
      2,
      [4, 3],
      'last event with goal scoring times with simultaneous goals'
    );
  });
});

function firstEvent(period, minute) {
  return { period, minute, second: 0 };
}
