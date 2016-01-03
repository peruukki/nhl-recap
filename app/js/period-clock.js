import Rx from 'rx';
import _ from 'lodash';

export default function periodClock(durationInMinutes, endTime) {
  return Rx.Observable.create(observer => {
    // Push initial time
    observer.onNext({ minute: durationInMinutes, second: 0 });

    const lastMinute = (endTime && endTime.minute) || -1;
    const lastSecond = (endTime && endTime.second) || -1;

    // Advance clock by second for all minutes but the last one
    _.forEach(minuteRange(durationInMinutes, lastMinute), (minute) => {
      _.forEach(secondRange(minute, lastMinute, lastSecond), (second) => {
        observer.onNext({ minute, second });
      });
    });

    if (lastMinute < 1) {
      // Advance clock by tenth of a second for the last minute
      const minute = 0;
      _.forEach(secondRange(minute, lastMinute, lastSecond), (second) => {
        _.forEach(_.range(9, -1, -1), (tenthOfASecond) => {
          observer.onNext({ minute, second, tenthOfASecond });
        });
      });
    }

    observer.onCompleted();
  });
}

function minuteRange(firstMinute, lastMinute) {
  return _.range(firstMinute - 1, Math.max(lastMinute - 1, 0), -1);
}

function secondRange(minute, lastMinute, lastSecond) {
  const rangeEnd = (minute === lastMinute) ? lastSecond - 1 : -1;
  return _.range(59, rangeEnd, -1);
}
