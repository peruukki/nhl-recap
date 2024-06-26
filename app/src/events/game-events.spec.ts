import _ from 'lodash';
import { describe, expect, it } from 'vitest';

import type { GameEvent, PauseEvent } from '../types';
import gameEvents, { getAllGoalsSorted } from './game-events';

import {
  scoresAllLive,
  scoresAllRegularTime,
  scoresLiveProgressedMoreThanFinished,
  scoresLiveEndOfOT,
  scoresLiveEndOf2OT,
  scoresLiveSO,
  scoresMultipleOvertime,
  scoresOvertimeAndMultipleShootout,
  scoresRegularTimeAndOvertimePlayoffs,
} from '../test/data';

const periodEndPauseEventCount = 150;

describe('gameEvents', () => {
  it('should include 3 periods if no games went to overtime or shootout', () => {
    const events = gameEvents(scoresAllRegularTime.games);

    // Check that regulation periods were included
    assertPeriodEndEvents(events, [1, 2, 3]);

    // Check that there were no other period end events
    expect(getPeriodEndEvents(events).length).toEqual(3);
  });

  it('should include events until last overtime goal if games went to overtime and none went to shootout', () => {
    const events = gameEvents(scoresMultipleOvertime.games);

    // Check that regulation periods and overtime were included
    assertPeriodEndEvents(events, [1, 2, 3, 'OT']);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    expect(lastTimeEvent).toEqual({
      type: 'game-update',
      period: 'OT',
      minute: 2,
      second: 23,
      update: { gameIndex: 1, type: 'end' },
    });
  });

  it('should include events until last playoff overtime goal', () => {
    const events = gameEvents(scoresRegularTimeAndOvertimePlayoffs.games);

    // Check that regulation and overtime periods were included
    assertPeriodEndEvents(events, [1, 2, 3, 4, 5]);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    expect(lastTimeEvent).toEqual({
      type: 'game-update',
      period: 5,
      minute: 0,
      second: 23,
      update: { gameIndex: 1, type: 'end' },
    });
  });

  it('should include events until shootout if games went to shootout', () => {
    const events = gameEvents(scoresOvertimeAndMultipleShootout.games);

    // Check that regulation periods, overtime and shootout were included
    assertPeriodEndEvents(events, [1, 2, 3, 'OT', 'SO']);

    const lastClockElement = getLastNonEndOrPauseEvent(events);
    expect(lastClockElement).toEqual({
      type: 'game-update',
      period: 'SO',
      update: { gameIndex: 2, type: 'end' },
    });
  });

  it('should include events until most progressed game if no games have finished', () => {
    const events = gameEvents(scoresAllLive.games);

    // Check that expected regulation periods were included
    assertPeriodEndEvents(events, [1, 2]);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    expect(lastTimeEvent).toEqual({
      type: 'clock',
      period: 3,
      minute: 0,
      second: 53,
      tenthOfASecond: 0,
    });
  });

  it('should include events until most progressed game even if some games have finished', () => {
    const events = gameEvents(scoresLiveProgressedMoreThanFinished.games);

    // Check that expected regulation periods were included
    assertPeriodEndEvents(events, [1, 2, 3, 4]);

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    expect(lastTimeEvent).toEqual({ type: 'clock', period: 5, minute: 11, second: 2 });
  });

  it('should include 20 minute overtime events if game is live at the end of overtime', () => {
    const events = gameEvents(scoresLiveEndOfOT.games);

    // Check the last event
    expect(_.last(events)).toEqual({ type: 'end', inProgress: true });

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    expect(lastTimeEvent).toEqual({ type: 'clock', period: 4, minute: 0, second: 0 });

    // Check that the last period lasted 20 minutes
    expect(_.some(events, { type: 'clock', period: 4, minute: 20, second: 0 })).toBe(true);
  });

  it('should include 20 minute overtime events if game is live at the end of second overtime', () => {
    const events = gameEvents(scoresLiveEndOf2OT.games);

    // Check the last event
    expect(_.last(events)).toEqual({ type: 'end', inProgress: true });

    // Check the last event with time
    const lastTimeEvent = getLastNonEndOrPauseEvent(events);
    expect(lastTimeEvent).toEqual({ type: 'clock', period: 5, minute: 0, second: 0 });

    // Check that the last period lasted 20 minutes
    expect(_.some(events, { type: 'clock', period: 5, minute: 20, second: 0 })).toBe(true);
  });

  it('should pause after each period end event', () => {
    const events = gameEvents(scoresOvertimeAndMultipleShootout.games);

    // Check period pause event count after period end events
    assertPeriodEndPauseEventsCount(events, [1, 2, 3, 'OT', 'SO']);
  });

  it('should have a final "end" event as the last event', () => {
    const events = gameEvents(scoresAllRegularTime.games);
    expect(_.last(events)).toEqual({ type: 'end', inProgress: false });
  });

  it('should have a final "end" event with inProgress flag if no games have finished', () => {
    const events = gameEvents(scoresAllLive.games);
    expect(_.last(events)).toEqual({ type: 'end', inProgress: true });
  });

  it('should sort all goals correctly', () => {
    const allGoalsSorted = getAllGoalsSorted(scoresMultipleOvertime.games);

    const expectedAllGoalsSorted = _.flatten([
      _.dropRight(scoresMultipleOvertime.games[1].goals).map((goal) => ({
        ...goal,
        classModifier: goal.team === 'ANA' ? ('away' as const) : ('home' as const),
        gameIndex: 1,
      })),
      scoresMultipleOvertime.games[0].goals.map((goal) => ({
        ...goal,
        classModifier: 'away' as const,
        gameIndex: 0,
      })),
      _.takeRight(scoresMultipleOvertime.games[1].goals).map((goal) => ({
        ...goal,
        classModifier: goal.team === 'ANA' ? ('away' as const) : ('home' as const),
        gameIndex: 1,
      })),
    ]);

    expect(allGoalsSorted).toEqual(expectedAllGoalsSorted);
  });

  it('should leave out shootout goals from unfinished games from all sorted goals', () => {
    const allGoalsSorted = getAllGoalsSorted(scoresLiveSO.games);
    expect(allGoalsSorted).toEqual([]);
  });
});

function assertPeriodEndEvents(events: (GameEvent | PauseEvent)[], periods: (number | string)[]) {
  const periodsWithEndEvent = _.chain(events)
    .filter((event) => event.type === 'period-end')
    .map('period')
    .uniq()
    .value();
  expect(periodsWithEndEvent).toEqual(periods);
}

function assertPeriodEndPauseEventsCount(
  events: (GameEvent | PauseEvent)[],
  periods: (number | string)[],
) {
  periods.forEach((period) => {
    const periodEndEventIndex = _.findIndex(
      events,
      (event) => event.type === 'period-end' && event.period === period,
    );
    const pauseEventsAfterPeriodEndEvent = _.takeWhile(
      events.slice(periodEndEventIndex + 1),
      (event) => event.type === 'pause',
    );
    expect(pauseEventsAfterPeriodEndEvent.length).toEqual(periodEndPauseEventCount);
  });
}

function getPeriodEndEvents(events: (GameEvent | PauseEvent)[]) {
  return events.filter((event) => event.type === 'period-end');
}

function getLastNonEndOrPauseEvent(events: (GameEvent | PauseEvent)[]) {
  return _.findLast(
    events,
    (event) => !['end', 'pause', 'period-end', 'pre-summary', 'summary'].includes(event.type),
  );
}
