import _ from 'lodash';
import { assert } from 'chai';

import { PERIOD_OVERTIME } from 'app/js/events/constants';
import periodEvents from 'app/js/events/period-events';
import type { GameEndTime, GoalWithUpdateFields } from 'app/js/types';

export const EVENT_COUNTS = {
  start: 1,
  goal: 1,
  pause: 50,
  end: 1,
};
export const EVENT_COUNT_PER_GOAL =
  EVENT_COUNTS.start + EVENT_COUNTS.goal + EVENT_COUNTS.pause + EVENT_COUNTS.end;

// Use short period times to speed up the tests
const periodLengthInMinutes = 3;

const clockAdvanceStep = 3;
const goalPauseEventCount = 50;

const baseGoal = {
  classModifier: 'home' as const,
  team: 'TOR',
  scorer: { player: 'Auston Matthews', seasonTotal: 60 },
  assists: [],
};

describe('periodEvents', () => {
  it('should include full period events if no end time is given', () => {
    const clockEvents = periodEvents(1, periodLengthInMinutes, null, [], goalPauseEventCount);
    assert.deepEqual(clockEvents.length, 62);
    assert.deepEqual(_.last(clockEvents), { type: 'clock', period: 1, minute: 0, second: 0 });
  });

  it('should stop at given end time', () => {
    const period = 1;
    const endTime = { minute: 2, second: 53 };
    const clockEvents = periodEvents(
      period,
      periodLengthInMinutes,
      endTime,
      [],
      goalPauseEventCount,
    );

    const secondEvents = _.range(59, endTime.second - 1, -clockAdvanceStep).map((second) => ({
      type: 'clock' as const,
      period,
      minute: 2,
      second,
    }));
    const expected = [firstEvent(period, periodLengthInMinutes)].concat(secondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should advance by three seconds for all minutes of a period but the last one', () => {
    const period = 1;
    const clockEventCount = ((periodLengthInMinutes - 1) * 60) / clockAdvanceStep + 1;
    const clockEvents = _.take(
      periodEvents(period, periodLengthInMinutes, null, [], goalPauseEventCount),
      clockEventCount,
    );

    const minutes = _.range(periodLengthInMinutes - 1, 0, -1);
    const seconds = _.range(59, -1, -clockAdvanceStep);
    const secondEvents = _.flatMap(minutes, (minute) =>
      seconds.map((second) => ({ type: 'clock' as const, period, minute, second })),
    );
    const expected = [firstEvent(period, periodLengthInMinutes)].concat(secondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should advance by three seconds for the last minute of any period but the 3rd one', () => {
    ([1, 2, 'OT'] as const).forEach((period) => {
      // Use only one minute period length to speed up and simplify the test
      const periodLength = 1;
      const clockEvents = periodEvents(period, periodLength, null, [], goalPauseEventCount);

      const secondEvents = _.range(59, -1, -clockAdvanceStep)
        .concat(0)
        .map((second) => ({
          type: 'clock' as const,
          period,
          minute: 0,
          second,
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
      5,
    );

    const tenthOfASecondEvents = _.range(9, -1, -clockAdvanceStep).map((tenthOfASecond) => ({
      type: 'clock' as const,
      period,
      minute: 0,
      second: 59,
      tenthOfASecond,
    }));
    const expected = [firstEvent(period, periodLength)].concat(tenthOfASecondEvents);

    assert.deepEqual(clockEvents, expected);
  });

  it('should create update start, goal, pause, and end events when goals were scored since last event', () => {
    const assertGoalEvents = (
      allGoalsSorted: GoalWithUpdateFields[],
      expectedGameIndexes: number[],
      description: string,
    ) => {
      const period = 1;
      const periodLength = 20;

      const clockEvents = periodEvents(
        period,
        periodLength,
        null,
        allGoalsSorted,
        EVENT_COUNTS.pause,
      );

      assert.deepEqual(
        _.last(clockEvents),
        { type: 'clock', period: 1, minute: 0, second: 0 },
        description,
      );

      expectedGameIndexes.forEach((gameIndex) => {
        const eventIndexWithGameIndex = _.findIndex(
          clockEvents,
          (event) => event.type === 'game-update' && event.update.gameIndex === gameIndex,
        );
        assert.deepEqual(
          clockEvents
            .slice(eventIndexWithGameIndex, eventIndexWithGameIndex + EVENT_COUNT_PER_GOAL)
            .map((event) => _.omit(event.type === 'game-update' ? event.update : event, 'goal')),
          [
            { gameIndex, type: 'start' },
            { gameIndex, type: 'goal', classModifier: 'home' },
            ..._.times(EVENT_COUNTS.pause, () => ({ type: 'pause' })),
            { gameIndex, type: 'end' },
          ],
          description,
        );
      });
    };

    // Assert that last event is as expected without goal scoring times
    assertGoalEvents([], [], 'goal events without goal scoring times');

    // Assert that last event is as expected with goal scoring times
    const allGoalsSortedWithMultipleGoalsAtDifferingTimes = [
      { ...baseGoal, period: '1', min: 1, sec: 1, gameIndex: 5 },
      { ...baseGoal, period: '1', min: 2, sec: 2, gameIndex: 1 },
      { ...baseGoal, period: '2', min: 1, sec: 1, gameIndex: 2 },
    ];
    assertGoalEvents(
      allGoalsSortedWithMultipleGoalsAtDifferingTimes,
      [5, 1],
      'goal events with goal scoring times with goals at different times',
    );

    const allGoalsSortedWithMultipleGoalsAtTheSameTime = [
      { ...baseGoal, period: '1', min: 1, sec: 1, gameIndex: 4 },
      { ...baseGoal, period: '1', min: 1, sec: 1, gameIndex: 3 },
      { ...baseGoal, period: '2', min: 1, sec: 1, gameIndex: 0 },
    ];
    assertGoalEvents(
      allGoalsSortedWithMultipleGoalsAtTheSameTime,
      [4, 3],
      'goal events with goal scoring times with simultaneous goals',
    );
  });

  it('should include goal scored on the last second of a regular period', () => {
    assertFinalSecondsGoalUpdate({ period: 1, min: 19, sec: 59 }, 20, null);
  });

  it('should include non-clock-stopping goal scored on the last second of an OT period', () => {
    assertFinalSecondsGoalUpdate({ period: PERIOD_OVERTIME, min: 4, sec: 59 }, 5, null);
  });

  it('should include clock-stopping goal scored on the last second of an OT period', () => {
    assertFinalSecondsGoalUpdate({ period: PERIOD_OVERTIME, min: 4, sec: 59 }, 5, {
      period: PERIOD_OVERTIME,
      minute: 0,
      second: 1,
    });
  });
});

it('should include clock-stopping goal scored on the second that the clock stops', () => {
  assertFinalSecondsGoalUpdate(
    { period: PERIOD_OVERTIME, min: 2, sec: 0 },
    5,
    {
      period: PERIOD_OVERTIME,
      minute: 3,
      second: 0,
    },
    { minute: 3, second: 0 },
  );
});

function assertFinalSecondsGoalUpdate(
  goalTime: { period: number | 'OT'; min: number; sec: number },
  periodLength: number,
  gameEndTime: GameEndTime | null,
  updateTime = { minute: 0, second: 0 },
) {
  const goal: GoalWithUpdateFields = {
    ...baseGoal,
    ...goalTime,
    period: String(goalTime.period),
    gameIndex: 1,
  };
  const clockEvents = periodEvents(
    goalTime.period,
    periodLength,
    gameEndTime,
    [goal],
    goalPauseEventCount,
  );

  const expected = {
    type: 'game-update' as const,
    period: goalTime.period,
    minute: updateTime.minute,
    second: updateTime.second,
    update: {
      type: 'goal' as const,
      gameIndex: goal.gameIndex,
      classModifier: goal.classModifier,
      goal: _.pick(goal, ['period', 'min', 'sec', 'scorer', 'assists', 'team']),
    },
  };
  assert.deepEqual(_.filter(clockEvents, { update: { type: 'goal' } }), [expected]);
}

function firstEvent(period: number | 'OT', minute: number) {
  return { type: 'clock' as const, period, minute, second: 0 };
}
