import Rx from 'rx';
import _ from 'lodash';
import chai from 'chai';

import periodClock from '../app/js/period-clock';

const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;
const scheduleTime = 200;

const assert = chai.assert;

describe('periodClock', () => {

  // Use short period times to speed up the tests
  const periodLengthInMinutes = 3;

  const firstElement = (minute) => onNext(scheduleTime, { minute, second: 0 });
  const completedElement = onCompleted(scheduleTime);

  it('should run full period if no end time is given', () => {
    const scheduler = new Rx.TestScheduler();
    const clockObserver = scheduler.startScheduler(() => periodClock(periodLengthInMinutes).takeLast(1));

    const lastTimeElement = onNext(scheduleTime, { minute: 0, second: 0, tenthOfASecond: 0 });
    const expected = [lastTimeElement, completedElement];

    assert.deepEqual(clockObserver.messages, expected);
  });

  it('should stop at given end time', () => {
    const scheduler = new Rx.TestScheduler();
    const endTime = { minute: 2, second: 53 };
    const clockObserver = scheduler.startScheduler(() => periodClock(periodLengthInMinutes, endTime));

    const secondElements = _.range(59, endTime.second - 1, -1).map(second =>
      onNext(scheduleTime, { minute: 2, second })
    );
    const expected = [firstElement(periodLengthInMinutes)].concat(secondElements, completedElement);

    assert.deepEqual(clockObserver.messages, expected);
  });

  it('should advance by second for all minutes of a period but the last one', () => {
    const scheduler = new Rx.TestScheduler();
    const clockObserver = scheduler.startScheduler(() =>
      periodClock(periodLengthInMinutes)
        .take((periodLengthInMinutes - 1) * 60 + 1)
    );

    const minutes = _.range(periodLengthInMinutes - 1, 0, -1);
    const secondElements = minutes.map(minute =>
      _.range(59, -1, -1).map(second =>
        onNext(scheduleTime, { minute, second })
      )
    );
    const expected = [firstElement(periodLengthInMinutes)].concat(_.flatten(secondElements), completedElement);

    assert.deepEqual(clockObserver.messages, expected);
  });

  it('should advance by tenth of a second for the last minute of a period', () => {
    const scheduler = new Rx.TestScheduler();
    // Take only the first second to speed up and simplify the test
    const clockObserver = scheduler.startScheduler(() => periodClock(1).take(11));

    const tenthOfASecondElements = _.range(9, -1, -1).map(tenthOfASecond =>
      onNext(scheduleTime, { minute: 0, second: 59, tenthOfASecond })
    );
    const expected = [firstElement(1)].concat(tenthOfASecondElements, completedElement);

    assert.deepEqual(clockObserver.messages, expected);
  });

});
