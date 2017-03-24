import Rx from 'rx';
import {span} from '@cycle/dom';

import gameEvents from './game-events';

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
      const events = gameEvents(scores);
      return Rx.Observable.concat(events.map(event =>
        Rx.Observable.just(event).delay(interval, scheduler)
      ));
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
    case 4:
    case '4':
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
      return `${period - 3}OT`;
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
