import _ from 'lodash';
import { assert } from 'chai';

import gameEvents, { getAllGoalSorted } from '../app/js/game-events';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from './data/latest-ot-2-so.json';
import scoresAllLive from './data/latest-live.json';
import scoresLiveProgressedMoreThanFinished from './data/latest-live-2-ot.json';
import scoresLiveEndOfOT from './data/latest-live-end-of-ot.json';
import scoresLiveEndOf2OT from './data/latest-live-end-of-2-ot.json';

const periodEndPauseEventCount = 150;

describe('gameEvents', () => {
  it('should include 3 periods if no games went to overtime or shootout', () => {
    const events = gameEvents(scoresAllRegularTime.games);

    // Check that regulation periods were included
    assertPeriodEndEvents(events, [1, 2, 3]);

    // Check that there were no other period end events
    assert.equal(getPeriodEndEvents(events).length, 3, 'All period end events count');
  });

  it('should include events until last overtime goal if games went to overtime and none went to shootout', () => {
    const events = gameEvents(scoresMultipleOvertime.games);

    // Check that regulation periods and overtime were included
    assertPeriodEndEvents(events, [1, 2, 3, 'OT']);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    assert.deepEqual(lastTimeEvent, {
      period: 'OT',
      minute: 2,
      second: 23,
      update: { gameIndex: 1, type: 'END' }
    });
  });

  it('should include events until shootout if games went to shootout', () => {
    const events = gameEvents(scoresOvertimeAndMultipleShootout.games);

    // Check that regulation periods, overtime and shootout were included
    assertPeriodEndEvents(events, [1, 2, 3, 'OT', 'SO']);

    const lastClockElement = getLastNonEndOrPauseEvent(events);
    assert.deepEqual(lastClockElement, {
      period: 'SO',
      update: { gameIndex: 2, type: 'END' }
    });
  });

  it('should include events until most progressed game if no games have finished', () => {
    const events = gameEvents(scoresAllLive.games);

    // Check that expected regulation periods were included
    assertPeriodEndEvents(events, [1, 2]);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    assert.deepEqual(lastTimeEvent, { period: 3, minute: 0, second: 53, tenthOfASecond: 0 });
  });

  it('should include events until most progressed game even if some games have finished', () => {
    const events = gameEvents(scoresLiveProgressedMoreThanFinished.games);

    // Check that expected regulation periods were included
    assertPeriodEndEvents(events, [1, 2, 3, 4]);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    assert.deepEqual(lastTimeEvent, { period: 5, minute: 11, second: 2 });
  });

  it('should include 20 minute overtime events if game is live at the end of overtime', () => {
    const events = gameEvents(scoresLiveEndOfOT.games);

    // Check the last event
    assert.deepEqual(_.last(events), { end: true, inProgress: true });

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    assert.deepEqual(lastTimeEvent, { period: 4, minute: 0, second: 2 });

    // Check that the last period lasted 20 minutes
    assert.isTrue(_.some(events, { period: 4, minute: 20, second: 0 }));
  });

  it('should include 20 minute overtime events if game is live at the end of second overtime', () => {
    const events = gameEvents(scoresLiveEndOf2OT.games);

    // Check the last event
    assert.deepEqual(_.last(events), { end: true, inProgress: true });

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    assert.deepEqual(lastTimeEvent, { period: 5, minute: 0, second: 2 });

    // Check that the last period lasted 20 minutes
    assert.isTrue(_.some(events, { period: 5, minute: 20, second: 0 }));
  });

  it('should pause after each period end event', () => {
    const events = gameEvents(scoresOvertimeAndMultipleShootout.games);

    // Check period pause event count after period end events
    assertPeriodEndPauseEventsCount(events, [1, 2, 3, 'OT', 'SO']);
  });

  it('should have a final "end" event as the last event', () => {
    const events = gameEvents(scoresAllRegularTime.games);
    assert.deepEqual(_.last(events), { end: true });
  });

  it('should have a final "end" event with inProgress flag if no games have finished', () => {
    const events = gameEvents(scoresAllLive.games);
    assert.deepEqual(_.last(events), { end: true, inProgress: true });
  });

  it('should sort all goals correctly', () => {
    const allGoalsSorted = getAllGoalSorted(scoresMultipleOvertime.games);

    const expectedAllGoalsSorted = _.flatten([
      _.dropRight(scoresMultipleOvertime.games[1].goals).map(goal => ({
        ...goal,
        classModifier: goal.team === 'ANA' ? 'away' : 'home',
        gameIndex: 1
      })),
      scoresMultipleOvertime.games[0].goals.map(goal => ({
        ...goal,
        classModifier: 'away',
        gameIndex: 0
      })),
      _.takeRight(scoresMultipleOvertime.games[1].goals).map(goal => ({
        ...goal,
        classModifier: goal.team === 'ANA' ? 'away' : 'home',
        gameIndex: 1
      }))
    ]);

    assert.deepEqual(allGoalsSorted, expectedAllGoalsSorted);
  });
});

function assertPeriodEndEvents(events, periods) {
  const periodsWithEndEvent = _.chain(events)
    .filter(event => event.period && event.end)
    .map('period')
    .uniq()
    .value();
  assert.deepEqual(periodsWithEndEvent, periods, `End events exist only for period(s) ${periods}`);
}

function assertPeriodEndPauseEventsCount(events, periods) {
  periods.forEach(period => {
    const periodEndEventIndex = _.findIndex(events, event => event.end && event.period === period);
    const pauseEventsAfterPeriodEndEvent = _.takeWhile(
      events.slice(periodEndEventIndex + 1),
      'pause'
    );
    assert.equal(
      pauseEventsAfterPeriodEndEvent.length,
      periodEndPauseEventCount,
      `Period ${period} end pause events count`
    );
  });
}

function getPeriodEndEvents(events) {
  return events.filter(event => event.period && event.end);
}

function getLastNonEndOrPauseEvent(events) {
  return _.findLast(events, event => !event.end && !event.pause);
}
