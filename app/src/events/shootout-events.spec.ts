import _ from 'lodash';

import type { GoalWithUpdateFields } from '../types';
import shootoutEvents from './shootout-events';
import { EVENT_COUNT_PER_GOAL } from './test-utils';

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

    expect(clockEvents.length).toEqual(2 * EVENT_COUNT_PER_GOAL);

    expect(
      _.take(clockEvents, EVENT_COUNT_PER_GOAL).map((event) =>
        event.type === 'game-update' ? event.update : event,
      ),
    ).toEqual([
      { gameIndex: 0, type: 'start' },
      {
        gameIndex: 0,
        type: 'goal',
        classModifier: 'home',
        goal: _.omit(goals[3], ['classModifier', 'gameIndex']),
      },
      ..._.times(goalPauseEventCount, () => ({ type: 'pause' })),
      { gameIndex: 0, type: 'end' },
    ]);

    expect(
      _.chain(clockEvents)
        .drop(EVENT_COUNT_PER_GOAL)
        .take(EVENT_COUNT_PER_GOAL)
        .map((event) => (event.type === 'game-update' ? event.update : event))
        .value(),
    ).toEqual([
      { gameIndex: 1, type: 'start' },
      {
        gameIndex: 1,
        type: 'goal',
        classModifier: 'away',
        goal: _.omit(goals[4], ['classModifier', 'gameIndex']),
      },
      ..._.times(goalPauseEventCount, () => ({ type: 'pause' })),
      { gameIndex: 1, type: 'end' },
    ]);
  });

  it('should not include shootout end event', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    expect(_.filter(clockEvents, { end: true })).toEqual([]);
  });
});
