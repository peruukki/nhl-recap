import _ from 'lodash';
import { assert } from 'chai';

import shootoutEvents from 'app/js/events/shootout-events';
import type { GoalWithUpdateFields } from 'app/js/types';
import { EVENT_COUNT_PER_GOAL } from './period-events';

describe('shootoutEvents', () => {
  const goals: GoalWithUpdateFields[] = [
    {
      period: '3',
      min: 12,
      sec: 5,
      team: 'FLA',
      scorer: { player: 'Alexander Barkov', seasonTotal: 6 },
      assists: [],
      gameIndex: 2,
      classModifier: 'home',
    },
    {
      period: 'OT',
      min: 5,
      sec: 2,
      team: 'CHI',
      scorer: { player: 'Patrik Kane', seasonTotal: 3 },
      assists: [],
      gameIndex: 3,
      classModifier: 'home',
    },
    {
      period: 'SO',
      team: 'TOR',
      scorer: { player: 'Leo Komarov', seasonTotal: 2 },
      gameIndex: 0,
      classModifier: 'home',
    },
    {
      period: 'SO',
      team: 'TOR',
      scorer: { player: 'Martin Marincin', seasonTotal: 1 },
      gameIndex: 0,
      classModifier: 'home',
    },
    {
      period: 'SO',
      team: 'SJS',
      scorer: { player: 'Joe Pavelski', seasonTotal: 5 },
      gameIndex: 1,
      classModifier: 'away',
    },
  ];
  const goalPauseEventCount = 50;

  it('should create update start, goal, pause, and end events for each shootout goal scored, but only once per game', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    assert.deepEqual(clockEvents.length, 2 * EVENT_COUNT_PER_GOAL);

    assert.deepEqual(
      _.take(clockEvents, EVENT_COUNT_PER_GOAL).map((event) =>
        event.type === 'game-update' ? event.update : event,
      ),
      [
        { gameIndex: 0, type: 'START' },
        {
          gameIndex: 0,
          type: 'GOAL',
          classModifier: 'home',
          goal: _.omit(goals[3], ['classModifier', 'gameIndex']),
        },
        ..._.times(goalPauseEventCount, () => ({ type: 'pause' })),
        { gameIndex: 0, type: 'END' },
      ],
      'First shootout game goal events',
    );

    assert.deepEqual(
      _.chain(clockEvents)
        .drop(EVENT_COUNT_PER_GOAL)
        .take(EVENT_COUNT_PER_GOAL)
        .map((event) => (event.type === 'game-update' ? event.update : event))
        .value(),
      [
        { gameIndex: 1, type: 'START' },
        {
          gameIndex: 1,
          type: 'GOAL',
          classModifier: 'away',
          goal: _.omit(goals[4], ['classModifier', 'gameIndex']),
        },
        ..._.times(goalPauseEventCount, () => ({ type: 'pause' })),
        { gameIndex: 1, type: 'END' },
      ],
      'Second shootout game goal events',
    );
  });

  it('should not include shootout end event', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    assert.deepEqual(_.filter(clockEvents, { end: true }), []);
  });
});
