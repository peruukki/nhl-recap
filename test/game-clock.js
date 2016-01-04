import Rx from 'rx';
import _ from 'lodash';
import chai from 'chai';

import gameClock from '../app/js/game-clock';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndShootout from './data/latest-ot-so.json';

const scheduleInterval = 1;

const assert = chai.assert;

describe('gameClock', () => {

  it('should run for 3 periods if no games went to overtime or shootout', () => {
    const messages = scheduleClock(scoresAllRegularTime);

    const periodEndElements = getMessageValues(getPeriodEndMessages(messages));
    const periods = _.pluck(periodEndElements, 'period');
    assert.deepEqual(periods, [1, 2, 3]);

    const lastClockElement = getLastClockElementWithTime(messages);
    assert.deepEqual(lastClockElement, { period: 3, minute: 0, second: 0, tenthOfASecond: 0 });
  });

  it('should run until last overtime goal if games went to overtime and none went to shootout', () => {
    const messages = scheduleClock(scoresMultipleOvertime);

    const periodEndElements = getMessageValues(getPeriodEndMessages(messages));
    const periods = _.pluck(periodEndElements, 'period');
    assert.deepEqual(periods, [1, 2, 3, 'OT']);

    const lastClockElement = getLastClockElementWithTime(messages);
    assert.deepEqual(lastClockElement, { period: 'OT', minute: 2, second: 37 });
  });

  it('should run until shootout if games went to shootout', () => {
    const messages = scheduleClock(scoresOvertimeAndShootout);

    const periodEndElements = getMessageValues(getPeriodEndMessages(messages));
    const periods = _.pluck(periodEndElements, 'period');
    assert.deepEqual(periods, [1, 2, 3, 'OT', 'SO']);

    const lastClockElement = getLastClockElementWithTime(messages);
    assert.deepEqual(lastClockElement, { period: 'SO' });
  });

  it('should have a delay before starting each period', () => {
    const periodStartDelay = 3000 + scheduleInterval;
    const messages = scheduleClock(scoresOvertimeAndShootout);

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

});

function scheduleClock(scores, transformFn) {
  const transform = transformFn || (x => x);
  const scheduler = new Rx.TestScheduler();
  const clock$ = gameClock(scores, scheduleInterval, scheduler);
  const clockObserver = scheduler.startScheduler(() => transform(clock$), { disposed: 30000 });
  return _.dropRight(clockObserver.messages); // Drop last 'completed' element
}

function getMessageValue(message) {
  return _.property('value.value')(message);
}

function getMessageValues(messages) {
  return messages.map(getMessageValue);
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
