import Rx from 'rx';
import {span} from '@cycle/dom';
import _ from 'lodash';

import periodClock from './period-clock';
import {elapsedTimeToRemainingTime} from './utils';

export default function GameClock(sources) {
  const state$ = model(intent(sources));
  return {
    DOM: view(state$),
    clock$: state$
  };
}

function intent(sources) {
  const {scores$, props$} = sources;
  return { scores$, props$ };
}

function model(actions) {
  return Rx.Observable.combineLatest(actions.scores$, actions.props$)
    .flatMapLatest(([scores, props]) => {
      const {interval, scheduler} = props;
      const periodStartDelayInMs = 3000;
      const periodClocks = getPeriodClocks(scores, interval, scheduler);
      const periodEnds = periodClocks.map(periodClock => getPeriodEndStream(periodClock.period, interval, scheduler));
      const delayedClocks = periodClocks.map(periodClock => periodClock.clock
        .delay(periodStartDelayInMs, scheduler));
      const periodSequences = _.chain()
        .zip(delayedClocks, periodEnds)
        .flatten()
        .value();

      return Rx.Observable.concat(
        getGamesStartStream(),
        ...periodSequences,
        getGamesEndStream(periodStartDelayInMs, scheduler)
      );
    });
}

function view(state$) {
  return state$.map(clock => {
    const time = clock ? renderTime(clock) : '';
    const animationClass = time ? '.fade-in-fast' : '';
    return span(`.clock${animationClass}`, [
      span('.clock__period', clock ? renderPeriod(clock) : ''),
      time ? span('.clock__time', time) : ''
    ]);
  });
}

function getPeriodClocks(scores, interval, scheduler) {
  const endTime = getEndTime(scores);
  return getRegularPeriodClocks(endTime, interval, scheduler)
    .concat(getOvertimeClock(endTime, interval, scheduler))
    .concat(getShootoutClock(endTime, interval, scheduler))
    .filter(value => value);
}

function getPeriodEndStream(period, interval, scheduler) {
  return Rx.Observable.just({ period, end: true })
    .delay(interval, scheduler);
}

function getGamesStartStream() {
  return Rx.Observable.just({ start: true });
}

function getGamesEndStream(delay, scheduler) {
  return Rx.Observable.just({ end: true })
    .delay(delay, scheduler);
}

function getRegularPeriodClocks(endTime, interval, scheduler) {
  const partialPeriodNumber = (endTime.period > 3) ? endTime.period : null;
  const fullPeriods = _.range(1, partialPeriodNumber || 4).map(period => ({
    period,
    clock: periodClock(period, 20, null, interval, scheduler)
  }));

  if (partialPeriodNumber) {
    const partialPeriod = {
      period: partialPeriodNumber,
      clock: periodClock(partialPeriodNumber, 20, endTime, interval, scheduler)
    };
    return fullPeriods.concat(partialPeriod);
  } else {
    return fullPeriods;
  }
}

function getOvertimeClock(endTime, interval, scheduler) {
  if (endTime.period !== 'SO' && endTime.period !== 'OT') {
    return null;
  } else {
    const periodEnd = (endTime.period === 'OT') ? endTime : null;
    return { period: 'OT', clock: periodClock('OT', 5, periodEnd, interval, scheduler) };
  }
}

function getShootoutClock(endTime, interval, scheduler) {
  return endTime.period === 'SO' ?
    { period: 'SO', clock: Rx.Observable.just({ period: 'SO' }).delay(interval, scheduler) } :
    null;
}

function getEndTime(scores) {
  const lastGoals = scores.map(game => _.last(game.goals));
  const isShootout = _.any(lastGoals, goal => goal.period === 'SO');

  if (isShootout) {
    return { period: 'SO' };
  } else {
    const lastOvertimeGoalTime = _.chain(lastGoals)
      .filter(goal => goal.period === 'OT' || goal.period > 3)
      .sortByAll(['period', 'min', 'sec'])
      .map(goal => ({ period: goal.period, minute: goal.min, second: goal.sec }))
      .last()
      .value();

    return lastOvertimeGoalTime ?
      elapsedTimeToRemainingTime(lastOvertimeGoalTime) :
      { period: 3 };
  }
}

function renderPeriod(clock) {
  if (clock.start) {
    return span('.fade-in', 'Starting...');
  } else if (clock.end) {
    return clock.period ? span('.fade-in', renderPeriodEnd(clock.period)) : span('.fade-in-fast', 'Final');
  } else {
    return renderPeriodNumber(clock.period);
  }
}

function renderPeriodEnd(period) {
  return 'End of ' + renderPeriodNumber(period);
}

export function renderPeriodNumber(period) {
  switch (period) {
    case 'OT':
      return 'OT';
    case 'SO':
      return 'SO';
    case 1:
    case '1':
      return '1st';
    case 2:
    case '2':
      return '2nd';
    case 3:
    case '3':
      return '3rd';
    default:
      return period + 'th';
  }
}

export function renderTime(clock) {
  if (!clock.minute && !clock.second) {
    return '';
  }

  const showTenthsOfASecond = (clock.tenthOfASecond !== undefined);
  const minute = !showTenthsOfASecond ? clock.minute + ':' : '';
  const second = (clock.second >= 10 || showTenthsOfASecond) ? clock.second : '0' + clock.second;
  const tenthOfASecond = showTenthsOfASecond ? '.' + clock.tenthOfASecond : '';
  return minute + second + tenthOfASecond;
}
