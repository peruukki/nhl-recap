import { button, div, h1, header, section, span } from '@cycle/dom';
import xs from 'xstream';
import classNames from 'classnames';

import { GAME_UPDATE_END, GAME_UPDATE_GOAL, GAME_UPDATE_START } from '../events/constants';
import getGameDisplays$ from '../events/game-displays';
import { getGameAnimationIndexes } from '../utils/utils';
import Clock from './clock';
import renderGame from './game';

export default function main(animations) {
  return ({ DOM, HTTP }) => {
    const url = getApiUrl();
    return {
      DOM: view(model(intent(DOM, HTTP), animations)),
      HTTP: xs.of({ url }),
    };
  };
}

function getApiUrl() {
  const host = process.env.SCORE_API_HOST || 'https://nhl-score-api.herokuapp.com';
  return `${host}/api/scores/latest`;
}

function intent(DOM, HTTP) {
  const apiResponseWithErrors$ = HTTP.select()
    .map(response$ => response$.replaceError(error => xs.of({ error })))
    .flatten()
    .map(response => {
      if (response.error) {
        return response;
      }
      const responseJson = JSON.parse(response.text);
      return responseJson.games.length > 0
        ? { success: responseJson }
        : { error: { message: 'No latest scores available.', expected: true } };
    });
  const successApiResponse$ = apiResponseWithErrors$
    .filter(scores => scores.success)
    .map(scores => scores.success);

  const playClicks$ = DOM.select('.button--play')
    .events('click')
    .mapTo(true);
  const pauseClicks$ = DOM.select('.button--pause')
    .events('click')
    .mapTo(false);
  const isPlaying$ = xs.merge(playClicks$, pauseClicks$);
  const playbackHasStarted$ = playClicks$.take(1);

  return {
    successApiResponse$,
    isPlaying$,
    playbackHasStarted$,
    status$: apiResponseWithErrors$
      .filter(scores => scores.error)
      .map(scores =>
        scores.error.expected
          ? scores.error.message
          : `Failed to fetch latest scores: ${scores.error.message}.`
      ),
  };
}

function model(actions, animations) {
  const initialState = { date: {}, games: [] };
  const scores$ = actions.successApiResponse$.startWith(initialState);

  const clock = Clock({
    scores$: actions.successApiResponse$.map(({ games }) => games),
    isPlaying$: actions.isPlaying$,
    props$: xs.of({ interval: 20 }),
  });

  const gameUpdate$ = clock.clock$.filter(({ update }) => !!update).map(({ update }) => update);
  gameUpdate$.addListener({
    next: gameUpdate => {
      switch (gameUpdate.type) {
        case GAME_UPDATE_END:
          animations.stopGameHighlight(gameUpdate.gameIndex);
          break;
        case GAME_UPDATE_GOAL:
          animations.highlightGoal(gameUpdate.classModifier, gameUpdate.gameIndex);
          break;
        case GAME_UPDATE_START:
          animations.highlightGame(gameUpdate.gameIndex);
          break;
        default:
          throw new Error(`Unknown game update type ${gameUpdate.type}`);
      }
    },
  });

  const initialGoals$ = scores$
    .filter(scores => scores.games.length > 0)
    .map(scores => Array.from({ length: scores.games.length }, () => []));
  const goalUpdate$ = gameUpdate$.filter(update => update.type === GAME_UPDATE_GOAL);
  const currentGoals$ = initialGoals$
    .map(initialGameGoals =>
      goalUpdate$.fold(
        (currentGoals, update) => [
          ...currentGoals.slice(0, update.gameIndex),
          currentGoals[update.gameIndex].concat(update.goal),
          ...currentGoals.slice(update.gameIndex + 1),
        ],
        initialGameGoals
      )
    )
    .flatten();

  const gameDisplays$ = getGameDisplays$(clock.clock$, scores$);

  actions.isPlaying$.addListener({
    next: animations.highlightPlayPauseButtonChange,
  });

  return xs
    .combine(
      scores$,
      currentGoals$.startWith([]),
      actions.isPlaying$.startWith(false),
      actions.status$.startWith('Fetching latest scores...'),
      clock.DOM.startWith(span('.clock')),
      clock.clock$.startWith(null),
      gameDisplays$.startWith([])
    )
    .map(([scores, currentGoals, isPlaying, status, clockVtree, clockEvent, gameDisplays]) => ({
      scores,
      currentGoals,
      isPlaying,
      status,
      clockVtree,
      clock: clockEvent,
      gameDisplays,
      gameCount: scores.games.length,
    }));
}

function view(state$) {
  return state$.map(
    ({ scores, currentGoals, isPlaying, status, clockVtree, clock, gameDisplays, gameCount }) =>
      div([
        header(
          '.header',
          renderHeader({
            clockVtree,
            clock,
            gameCount,
            isPlaying,
            date: scores.date,
          })
        ),
        section(
          '.score-panel',
          renderScores({ games: scores.games, currentGoals, status, gameDisplays })
        ),
      ])
  );
}

function renderHeader(state) {
  const hasNotStarted = !state.clock;
  const isFinished = !!(state.clock && state.clock.end && !state.clock.period);
  const buttonText = state.isPlaying ? 'Pause' : 'Play';
  const buttonType = state.isPlaying ? 'pause' : 'play';
  const dynamicClassNames = {
    [`button--${buttonType}`]: state.gameCount > 0,
    [`expand--${state.gameCount}`]: state.gameCount > 0 && hasNotStarted,
    'button--hidden': isFinished,
  };
  const showDate = hasNotStarted && !!state.date;

  return div('.header__container', [
    h1('.header__title', [span('.all-caps', 'NHL'), ' Recap']),
    button(
      '.button.play-pause-button',
      { class: dynamicClassNames },
      span('.visible-button', span('.visually-hidden', buttonText))
    ),
    showDate ? renderDate(state.date) : state.clockVtree,
  ]);
}

function renderScores(state) {
  const gameAnimationIndexes = getGameAnimationIndexes(state.games.length);
  const scoreListClass = classNames({
    '.score-list': true,
    '.score-list--single-game': state.games.length === 1,
  }).replace(/\s/g, '');
  return state.games.length > 0
    ? div(
        scoreListClass,
        state.games.map((game, index) =>
          renderGame(
            state.gameDisplays[index],
            game,
            state.currentGoals[index] || [],
            gameAnimationIndexes[index]
          )
        )
      )
    : div('.status.fade-in', [state.status || 'No scores available.']);
}

function renderDate(date) {
  return span('.date.fade-in-slow', date.pretty);
}
