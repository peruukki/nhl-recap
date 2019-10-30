import _ from 'lodash';
import { assert } from 'chai';

import shootoutEvents from '../app/js/shootout-events';

describe('shootoutEvents', () => {
  const goals = [
    { period: 3, team: 'FLA', scorer: { player: 'Alexander Barkov' }, update: { gameIndex: 2 } },
    { period: 'OT', team: 'CHI', scorer: { player: 'Patrik Kane' }, update: { gameIndex: 3 } },
    { period: 'SO', team: 'TOR', scorer: { player: 'Leo Komarov' }, update: { gameIndex: 0 } },
    { period: 'SO', team: 'TOR', scorer: { player: 'Martin Marincin' }, update: { gameIndex: 0 } },
    { period: 'SO', team: 'SJS', scorer: { player: 'Joe Pavelski' }, update: { gameIndex: 1 } }
  ];
  const goalPauseEventCount = 50;

  it('should pause by extra clock events for each shootout goal scored, but only once per game', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    assert.deepEqual(clockEvents.length, 2 * goalPauseEventCount);

    assert.deepEqual(
      _.take(clockEvents, goalPauseEventCount),
      _.times(goalPauseEventCount, () => ({ period: 'SO', update: { gameIndex: 0 } }))
    );

    assert.deepEqual(
      _.chain(clockEvents)
        .drop(goalPauseEventCount)
        .take(goalPauseEventCount)
        .value(),
      _.times(goalPauseEventCount, () => ({ period: 'SO', update: { gameIndex: 1 } }))
    );
  });

  it('should not include shootout end event', () => {
    const clockEvents = shootoutEvents(goals, goalPauseEventCount);

    assert.deepEqual(_.filter(clockEvents, { end: true }), []);
  });
});
