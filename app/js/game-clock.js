import Rx from 'rx';
import {h} from '@cycle/dom';
import _ from 'lodash';

import periodClock from './period-clock';

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
      const delayedClocks = periodClocks.map((periodClock, index) =>
        index === 0 ?
          periodClock.clock :
          periodClock.clock.delay(periodStartDelayInMs, scheduler)
      );
      const allSequences = _.chain()
        .zip(delayedClocks, periodEnds)
        .flatten()
        .value()
        .concat(getGamesEndStream(periodStartDelayInMs, scheduler));

      return Rx.Observable.concat(allSequences);
    });
}

function view(state$) {
  return state$.map(clock =>
    h('div.clock', [
      h('div.period', clock ? renderPeriod(clock) : ''),
      h('div.time', clock ? renderTime(clock) : '')
    ])
  );
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

function getGamesEndStream(delay, scheduler) {
  return Rx.Observable.just({ end: true })
    .delay(delay, scheduler);
}

function getRegularPeriodClocks(endTime, interval, scheduler) {
  const finalPeriodNumber = (endTime.period === 'SO' || endTime.period === 'OT') ? 3 : endTime.period;
  const fullPeriods = _.range(1, finalPeriodNumber).map(period => ({
    period,
    clock: periodClock(period, 20, null, interval, scheduler)
  }));
  const finalPeriod = {
    period: finalPeriodNumber,
    clock: periodClock(finalPeriodNumber, 20, endTime, interval, scheduler)
  };
  return fullPeriods.concat(finalPeriod);
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
    const lastOvertimeGoal = _.chain(lastGoals)
      .filter(goal => goal.period === 'OT' || goal.period > 3)
      .sortByAll(['period', 'min', 'sec'])
      .last()
      .value();

    return lastOvertimeGoal ?
      { period: lastOvertimeGoal.period, minute: lastOvertimeGoal.min, second: lastOvertimeGoal.sec } :
      { period: 3 };
  }
}
function renderPeriod(clock) {
  if (clock.end) {
    return clock.period ? renderPeriodEnd(clock.period) : 'Final';
  } else {
    return renderPeriodNumber(clock.period);
  }
}

function renderPeriodEnd(period) {
  return 'End of ' + renderPeriodNumber(period);
}

function renderPeriodNumber(period) {
  switch (period) {
    case 'OT':
      return 'OT';
    case 'SO':
      return 'SO';
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return period + 'th';
  }
}

function renderTime(clock) {
  if (!clock.minute && !clock.second) {
    return '';
  }

  const showTenthsOfASecond = (clock.tenthOfASecond !== undefined);
  const minute = (clock.minute >= 1) ? clock.minute + ':' : '';
  const second = (clock.second >= 10 || showTenthsOfASecond) ? clock.second : '0' + clock.second;
  const tenthOfASecond = showTenthsOfASecond ? '.' + clock.tenthOfASecond : '';
  return minute + second + tenthOfASecond;
}
