import Rx from 'rx';
import _ from 'lodash';

export default function periodClock(durationInMinutes, endTime, interval, scheduler) {
  const elements = generateSequence(durationInMinutes, endTime);
  return Rx.Observable.interval(interval, scheduler)
    .takeWhile(index => index < elements.length)
    .map(index => elements[index]);
}

function generateSequence(durationInMinutes, endTime) {
  const lastMinute = (endTime && endTime.minute) || -1;
  const lastSecond = (endTime && endTime.second) || -1;

  // Advance clock by second for all minutes but the last one
  const secondElements = generateSecondElements(durationInMinutes, lastMinute, lastSecond);

  // Advance clock by tenth of a second for the last minute
  const tenthOfASecondElements = (lastMinute < 1) ?
    generateTenthOfASecondElements(lastMinute, lastSecond) :
    [];

  const firstElement = { minute: durationInMinutes, second: 0 };
  return [firstElement].concat(secondElements, tenthOfASecondElements);
}

function generateSecondElements(durationInMinutes, lastMinute, lastSecond) {
  return _.flatten(
    minuteRange(durationInMinutes, lastMinute)
      .map(minute =>
        secondRange(minute, lastMinute, lastSecond)
          .map(second => ({ minute, second }))
      )
  );
}

function generateTenthOfASecondElements(lastMinute, lastSecond) {
  const minute = 0;
  return _.flatten(
    secondRange(minute, lastMinute, lastSecond)
      .map(second =>
        _.range(9, -1, -1)
          .map(tenthOfASecond => ({ minute, second, tenthOfASecond }))
      )
  );
}

function minuteRange(firstMinute, lastMinute) {
  return _.range(firstMinute - 1, Math.max(lastMinute - 1, 0), -1);
}

function secondRange(minute, lastMinute, lastSecond) {
  const rangeEnd = (minute === lastMinute) ? lastSecond - 1 : -1;
  return _.range(59, rangeEnd, -1);
}
