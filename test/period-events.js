import _ from 'lodash';
import {assert} from 'chai';

import periodEvents from '../app/js/period-events';

// Use short period times to speed up the tests
const periodLengthInMinutes = 3;

const clockAdvanceStep = 3;
const goalDelayMultiplier = 50;

describe('periodEvents', () => {

  it('should include full period events if no end time is given', () => {
    const clockEvents = periodEvents(1, periodLengthInMinutes, null, [], goalDelayMultiplier);
    assert.deepEqual(clockEvents.length, 61);
    assert.deepEqual(_.last(clockEvents), { period: 1, minute: 0, second: 2 });
  });

  it('should stop at given end time', () => {
    const period = 1;
    const endTime = { minute: 2, second: 53 };
    const clockEvents = periodEvents(period, periodLengthInMinutes, endTime, [], goalDelayMultiplier);

    const secondEvents = _.range(59, endTime.second - 1, -clockAdvanceStep)
      .map(second => ({ period, minute: 2, second }));
    const expected = [firstEvent(period, periodLengthInMinutes)].concat(secondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should advance by three seconds for all minutes of a period but the last one', () => {
    const period = 1;
    const clockEventCount = (((periodLengthInMinutes - 1) * 60) / clockAdvanceStep) + 1;
    const clockEvents = _.take(periodEvents(period, periodLengthInMinutes, null, [], goalDelayMultiplier),
      clockEventCount);

    const minutes = _.range(periodLengthInMinutes - 1, 0, -1);
    const seconds = _.range(59, -1, -clockAdvanceStep);
    const secondEvents = _.flatMap(minutes, (minute => seconds
      .map(second => ({ period, minute, second }))));
    const expected = [firstEvent(period, periodLengthInMinutes)].concat(secondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should advance by three seconds for the last minute of any period but the 3rd one', () => {
    [1, 2, 'OT'].forEach(period => {
      // Use only one minute period length to speed up and simplify the test
      const periodLength = 1;
      const clockEvents = periodEvents(period, periodLength, null, [], goalDelayMultiplier);

      const secondEvents = _.range(59, -1, -clockAdvanceStep)
        .map(second => ({ period, minute: 0, second }));
      const expected = [firstEvent(period, periodLength)].concat(secondEvents);

      assert.deepEqual(clockEvents, expected);
    });
  });

  it('should advance by three tenths of a second for the last minute of the 3rd period', () => {
    const period = 3;
    const periodLength = 1;
    // Take only the first second to speed up and simplify the test
    const clockEvents = _.take(periodEvents(period, periodLength, null, [], goalDelayMultiplier), 5);

    const tenthOfASecondEvents = _.range(9, -1, -clockAdvanceStep)
      .map(tenthOfASecond => ({ period, minute: 0, second: 59, tenthOfASecond }));
    const expected = [firstEvent(period, periodLength)].concat(tenthOfASecondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should pause by multiplying events when a goal was scored since last event', () => {
    const assertLastEvent = (goalScoringTimes, expectedGoalScoreCount, description) => {
      const period = 1;
      const periodLength = 20;
      const eventMultiplier = 50;

      const clockEvents = periodEvents(period, periodLength, null, goalScoringTimes, goalDelayMultiplier);
      const eventCount = 401 + (expectedGoalScoreCount * (eventMultiplier - 1));
      const lastTimeEvent = { period: 1, minute: 0, second: 2 };

      assert.deepEqual(clockEvents.length, eventCount);
      assert.deepEqual(_.last(clockEvents), lastTimeEvent, description);
    };

    // Assert that last event is as expected without goal scoring times
    assertLastEvent([], 0, 'last event without goal scoring times');

    // Assert that last event is as expected with goal scoring times
    const goalScoringTimes = [
      { period: 1, min: 1, sec: 1 },
      { period: 1, min: 2, sec: 2 },
      { period: 2, min: 1, sec: 1 }
    ];
    assertLastEvent(goalScoringTimes, 2, 'last event with goal scoring times');
  });

});

function firstEvent(period, minute) {
  return { period, minute, second: 0 };
}
