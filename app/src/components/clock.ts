import xs, { Stream } from 'xstream';
import { span, VNode } from '@cycle/dom';

import { PERIOD_OVERTIME, PERIOD_SHOOTOUT } from '../events/constants';
import gameEvents from '../events/game-events';
import type { Game, GameEvent, GameEventClockTime, Period } from '../types';

type Sources = {
  scores$: Stream<Game[]>;
  isPlaying$: Stream<boolean>;
  props$: Stream<{ interval: number }>;
};

type Sinks = {
  events$: Stream<GameEvent>;
  DOM: Stream<VNode>;
};

type Actions = Sources;

export default function Clock(sources: Sources): Sinks {
  const state$ = model(intent(sources));
  return {
    DOM: view(state$),
    events$: state$,
  };
}

function intent(sources: Sources): Actions {
  const { scores$, isPlaying$, props$ } = sources;
  return { scores$, isPlaying$, props$ };
}

function model(actions: Actions): Stream<GameEvent> {
  const ticks$ = actions.props$.map((props) => xs.periodic(props.interval)).flatten();
  const events$ = actions.scores$.map((scores) => gameEvents(scores));
  const eventIndex$ = xs
    .combine(actions.isPlaying$, ticks$)
    .filter(([isPlaying]) => isPlaying)
    .fold((acc) => acc + 1, -1)
    .drop(1);
  const eventsEnd$ = xs
    .combine(events$, eventIndex$)
    .filter(([events, eventIndex]) => eventIndex >= events.length);

  return xs
    .combine(events$, eventIndex$)
    .endWhen(eventsEnd$)
    .map(([events, eventIndex]) => events[eventIndex])
    .filter<GameEvent>((event): event is GameEvent => event.type !== 'pause');
}

function view(state$: Stream<GameEvent>) {
  return state$.map((event) => {
    const isUpdateEvent = ['clock', 'game-update'].includes(event.type);
    const animationClass = isUpdateEvent ? '.fade-in-fast' : '';
    return span(`.clock${animationClass}`, [
      span('.clock__period', renderPeriod(event)),
      isUpdateEvent ? span('.clock__time', renderTime(event as GameEventClockTime)) : '',
    ]);
  });
}

function renderPeriod(event: GameEvent): VNode | string {
  if (event.type === 'start') {
    return span('.fade-in', 'Starting...');
  }
  if (event.type === 'period-end') {
    return span('.fade-in', renderPeriodEnd(event.period));
  }
  if (event.type === 'end' || event.type === 'pre-summary' || event.type === 'summary') {
    return span(
      event.type === 'pre-summary' ? '.fade-in-fast' : '',
      event.inProgress ? 'In progress' : 'Final',
    );
  }
  return renderPeriodNumber(event.period as Period);
}

function renderPeriodEnd(period: Period): string {
  return `End of ${renderPeriodNumber(period)}`;
}

export function renderPeriodNumber(period: Period): string {
  switch (period) {
    case PERIOD_OVERTIME:
    case 4:
    case '4':
      return 'OT';
    case PERIOD_SHOOTOUT:
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
      return `${Number(period) - 3}OT`;
  }
}

export function renderTime(clock: {
  minute?: number;
  second?: number;
  tenthOfASecond?: number;
}): string {
  if (clock.minute === undefined && clock.second === undefined) {
    return '';
  }

  const showTenthsOfASecond = clock.tenthOfASecond !== undefined;
  const minute = !showTenthsOfASecond ? `${clock.minute}:` : '';
  const second =
    (clock.second ?? 0) >= 10 || showTenthsOfASecond ? String(clock.second) : `0${clock.second}`;
  const tenthOfASecond = showTenthsOfASecond ? `.${clock.tenthOfASecond}` : '';
  return minute + second + tenthOfASecond;
}
