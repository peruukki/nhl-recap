import _ from 'lodash';
import { assert } from 'chai';

import shootoutEvents from '../app/js/shootout-events';
import { GAME_UPDATE_START, GAME_UPDATE_GOAL, GAME_UPDATE_END } from '../app/js/game-events';
import { EVENT_COUNT_PER_GOAL } from './period-events';

describe('shootoutEvents', () => {
  const goals = [
    {
      period: 3,
      team: 'FLA',
      scorer: { player: 'Alexander Barkov' },
      gameIndex: 2,
      classModifier: 'home'
    },
    {
      period: 'OT',
      team: 'CHI',
      scorer: { player: 'Patrik Kane' },
      gameIndex: 3,
      classModifier: 'home'
    },
    {
      period: 'SO',
      team: 'TOR',
      scorer: { player: 'Leo Komarov' },
      gameIndex: 0,
      classModifier: 'home'
    },
    {
      period: 'SO',
      team: 'TOR',
      scorer: { player: 'Martin Marincin' },
      gameIndex: 0,
      classModifier: 'home'
    },
    {
      period: 'SO',
      team: 'SJS',
      scorer: { player: 'Joe Pavelski' },
      gameIndex: 1,
      classModifier: 'away'
    }
  ];
  const goalPauseEventCount = 50;

  it('should create update start, goal, pause, and end events for each shootout goal scored, but only once per game', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    assert.deepEqual(clockEvents.length, 2 * EVENT_COUNT_PER_GOAL);

    assert.deepEqual(
      _.take(clockEvents, EVENT_COUNT_PER_GOAL).map(event => event.update || event),
      [
        { gameIndex: 0, type: GAME_UPDATE_START },
        {
          gameIndex: 0,
          type: GAME_UPDATE_GOAL,
          classModifier: 'home',
          goal: _.omit(goals[3], ['classModifier', 'gameIndex'])
        },
        ..._.times(goalPauseEventCount, () => ({ pause: true })),
        { gameIndex: 0, type: GAME_UPDATE_END }
      ],
      'First shootout game goal events'
    );

    assert.deepEqual(
      _.chain(clockEvents)
        .drop(EVENT_COUNT_PER_GOAL)
        .take(EVENT_COUNT_PER_GOAL)
        .map(event => event.update || event)
        .value(),
      [
        { gameIndex: 1, type: GAME_UPDATE_START },
        {
          gameIndex: 1,
          type: GAME_UPDATE_GOAL,
          classModifier: 'away',
          goal: _.omit(goals[4], ['classModifier', 'gameIndex'])
        },
        ..._.times(goalPauseEventCount, () => ({ pause: true })),
        { gameIndex: 1, type: GAME_UPDATE_END }
      ],
      'Second shootout game goal events'
    );
  });

  it('should not include shootout end event', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    assert.deepEqual(_.filter(clockEvents, { end: true }), []);
  });
});
