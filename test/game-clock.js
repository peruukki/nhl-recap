import Rx from 'rx';
import _ from 'lodash';
import chai from 'chai';

import {default as GameClock, getGoalScoringTimes} from '../app/js/game-clock';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from './data/latest-ot-2-so.json';

const scheduleInterval = 1;

const assert = chai.assert;

describe('GameClock', () => {

  it('should run for 3 periods if no games went to overtime or shootout', () => {
    const messages = scheduleClock(scoresAllRegularTime);

    // Check that all period clocks ran until the end
    const periodEndElementIndexes = getPeriodEndMessageIndexes(messages);
    assertPeriodEnds(messages, [1, 2, 3], periodEndElementIndexes);
  });

  it('should run until last overtime goal if games went to overtime and none went to shootout', () => {
    const messages = scheduleClock(scoresMultipleOvertime);

    // Check that regulation period clocks ran until the end
    const allPeriodEndElementIndexes = getPeriodEndMessageIndexes(messages);
    const regulationPeriodEndElementIndexes = _.dropRight(allPeriodEndElementIndexes);
    assertPeriodEnds(messages, [1, 2, 3], regulationPeriodEndElementIndexes);

    const lastClockElement = getLastClockElementWithTime(messages);
    assert.deepEqual(lastClockElement, { period: 'OT', minute: 2, second: 23 });
  });

  it('should run until shootout if games went to shootout', () => {
    const messages = scheduleClock(scoresOvertimeAndMultipleShootout);

    // Check that period clocks ran until the end
    const allPeriodEndElementIndexes = getPeriodEndMessageIndexes(messages);
    const timedPeriodEndElementIndexes = _.dropRight(allPeriodEndElementIndexes);
    assertPeriodEnds(messages, [1, 2, 3, 'OT'], timedPeriodEndElementIndexes);

    const lastClockElement = getLastClockElementWithTime(messages);
    assert.deepEqual(lastClockElement, { period: 'SO' });
  });

  it('should have a delay before starting each period', () => {
    const periodStartDelay = 3000 + scheduleInterval;
    const messages = scheduleClock(scoresOvertimeAndMultipleShootout);

    const periodEndElementIndexes = getPeriodEndMessageIndexes(messages);
    assert.lengthOf(periodEndElementIndexes, 5);

    _.dropRight(periodEndElementIndexes) // Drop last period end
      .forEach(index => {
        const interval = messages[index + 1].time - messages[index].time;
        assert.equal(interval, periodStartDelay);
      });
  });

  it('should have a final "end" message as the last element', () => {
    const messages = scheduleClock(scoresAllRegularTime);

    const lastClockElement = getMessageValue(_.last(messages));
    assert.deepEqual(lastClockElement, { end: true });
  });

  it('should determine correct goal scoring times', () => {
    const goalScoringTimes = getGoalScoringTimes(scoresMultipleOvertime);

    const expectedGoalScoringTimes = _.flatten([
      _.dropRight(scoresMultipleOvertime[1].goals),
      scoresMultipleOvertime[0].goals,
      _.takeRight(scoresMultipleOvertime[1].goals)
    ]);

    assert.deepEqual(goalScoringTimes, expectedGoalScoringTimes);
  });

});

function scheduleClock(scores, transformFn = _.identity) {
  const scheduler = new Rx.TestScheduler();
  const {clock$} = GameClock({
    scores$: Rx.Observable.just(scores),
    props$: Rx.Observable.just({ interval: scheduleInterval, scheduler })
  });
  const clockObserver = scheduler.startScheduler(() => transformFn(clock$), { disposed: 30000 });
  return _.dropRight(clockObserver.messages); // Drop last 'completed' element
}

function assertPeriodEnds(messages, periods, periodEndElementIndexes) {
  _.zip(periods, periodEndElementIndexes)
    .forEach(([period, index]) => {
      const lastPeriodTimeElement = getMessageValue(messages[index - 1]);
      const normalizedTimeElement = _.omit(lastPeriodTimeElement, 'tenthOfASecond');
      assert.deepEqual(normalizedTimeElement, { period, minute: 0, second: 2 });
    });
}

function getMessageValue(message) {
  return _.property('value.value')(message);
}

function getPeriodEndMessages(messages) {
  return messages.filter(message => {
    const value = getMessageValue(message);
    return value && value.period && value.end;
  });
}

function getPeriodEndMessageIndexes(messages) {
  const periodEndMessages = getPeriodEndMessages(messages);
  return periodEndMessages.map(message => _.findIndex(messages, message));
}

function getLastClockElementWithTime(messages) {
  // Skip final "end" and "period end" messages
  return getMessageValue(_.last(_.dropRight(messages, 2)));
}
