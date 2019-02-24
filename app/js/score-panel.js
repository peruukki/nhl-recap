import {button, div, h1, header, section, span} from '@cycle/dom';
import xs from 'xstream';
import _ from 'lodash';
import classNames from 'classnames';

import GameClock from './game-clock';
import gameScore from './game-score';
import {getGameAnimationIndexes} from './utils';

export default function main(animations) {
  return ({DOM, HTTP}) => {
    const url = getApiUrl();
    return {
      DOM: view(model(intent(DOM, HTTP), animations)),
      HTTP: xs.of({ url })
    };
  };
}

function getApiUrl() {
  const host = process.env.SCORE_API_HOST || 'https://nhl-score-api.herokuapp.com';
  return `${host}/api/scores/latest`;
}

function intent(DOM, HTTP) {
  const apiResponseWithErrors$ = HTTP
    .select()
    .map(response$ => response$.replaceError(error => xs.of({ error })))
    .flatten()
    .map(response => {
      if (response.error) {
        return response;
      } else {
        const responseJson = JSON.parse(response.text);
        return responseJson.games.length > 0
          ? { success: responseJson }
          : { error: { message: 'No latest scores available.', expected: true } };
      }
    });
  const successApiResponse$ = apiResponseWithErrors$
    .filter(scores => scores.success)
    .map(scores => scores.success);

  const playClicks$ = DOM.select('.button--play').events('click')
    .mapTo(true);
  const pauseClicks$ = DOM.select('.button--pause').events('click')
    .mapTo(false);
  const isPlaying$ = xs.merge(playClicks$, pauseClicks$);
  const playbackHasStarted$ = playClicks$.take(1);

  return {
    successApiResponse$,
    isPlaying$,
    playbackHasStarted$,
    status$: apiResponseWithErrors$
      .filter(scores => scores.error)
      .map(scores => scores.error.expected ?
        scores.error.message :
        `Failed to fetch latest scores: ${scores.error.message}.`)
  };
}

function model(actions, animations) {
  const initialState = { date: {}, games: [] };
  const successResponse$ = actions.successApiResponse$.startWith(initialState);

  const scores$ = successResponse$.map(({ date, games }) => ({
    date,
    games: games.map((game, index) =>
      _.extend({}, game, {
        goalCounts: {
          away$: createGoalCountSubject('away', index, animations),
          home$: createGoalCountSubject('home', index, animations)
        }
      })
    )
  }));

  actions.playbackHasStarted$.addListener({ next: () => animations.reduceInfoPanelsHeight() });

  const gameClock = GameClock({
    scores$: actions.successApiResponse$.map(({ games }) => games),
    isPlaying$: actions.isPlaying$,
    props$: xs.of({ interval: 20 })
  });

  return xs.combine(
    scores$,
    actions.isPlaying$.startWith(false),
    actions.status$.startWith('Fetching latest scores...'),
    gameClock.DOM.startWith(span('.clock')),
    gameClock.clock$.startWith(null)
  ).map(([scores, isPlaying, status, clockVtree, clock]) =>
    ({ scores, isPlaying, status, clockVtree, clock, gameCount: scores.games.length })
  );
}

function createGoalCountSubject(classModifier, gameIndex, animations) {
  const subject$ = new xs.create();
  subject$.fold((acc, curr) => ({ last: curr, changed: acc.last !== curr }), { last: 0 })
    .filter(({ changed }) => changed)
    .addListener({ next: () => animations.highlightGoal(classModifier, gameIndex) });
  return subject$;
}

function view(state$) {
  return state$.map(({scores, isPlaying, status, clockVtree, clock, gameCount}) =>
    div([
      header('.header', renderHeader({ clockVtree, clock, gameCount, isPlaying, date: scores.date })),
      section('.score-panel', renderScores({ games: scores.games, status, clock }))
    ])
  );
}

function renderHeader(state) {
  const hasNotStarted = !state.clock;
  const isFinished = !!(state.clock && state.clock.end && !state.clock.period);
  const buttonType = state.isPlaying ? 'pause' : 'play';
  const buttonClass = classNames({
    '.button': true,
    [`.button--${buttonType}`]: state.gameCount > 0,
    [`.expand--${state.gameCount}`]: state.gameCount > 0 && hasNotStarted,
    '.button--hidden': isFinished
  }).replace(/\s/g, '');
  const showDate = hasNotStarted && !!state.date;

  return div('.header__container', [
    h1('.header__title', 'NHL Recap'),
    button(buttonClass),
    showDate ? renderDate(state.date) : state.clockVtree
  ]);
}

function renderScores(state) {
  const gameAnimationIndexes = getGameAnimationIndexes(state.games.length);
  return state.games.length > 0 ?
    div('.score-list', state.games.map((game, index) => gameScore(state.clock, game, gameAnimationIndexes[index]))) :
    div('.status.fade-in', [state.status || 'No scores available.']);
}

function renderDate(date) {
  return span('.date.fade-in-slow', date.pretty);
}
