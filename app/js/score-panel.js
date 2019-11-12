import { button, div, h1, header, section, span } from '@cycle/dom';
import xs from 'xstream';
import classNames from 'classnames';

import GameClock from './game-clock';
import { GAME_UPDATE_END, GAME_UPDATE_GOAL, GAME_UPDATE_START } from './game-events';
import gameScore, { hasGameFinished } from './game-score';
import { getGameAnimationIndexes } from './utils';

export default function main(animations) {
  return ({ DOM, HTTP }) => {
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
  const apiResponseWithErrors$ = HTTP.select()
    .map(response$ => response$.replaceError(error => xs.of({ error })))
    .flatten()
    .map(response => {
      if (response.error) {
        return response;
      } else {
        const responseJson = JSON.parse(response.text);
        return responseJson.games.length > 0
          ? { success: responseJson }
          : {
              error: { message: 'No latest scores available.', expected: true }
            };
      }
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
      )
  };
}

function model(actions, animations) {
  const initialState = { date: {}, games: [] };
  const scores$ = actions.successApiResponse$.startWith(initialState);

  const gameClock = GameClock({
    scores$: actions.successApiResponse$.map(({ games }) => games),
    isPlaying$: actions.isPlaying$,
    props$: xs.of({ interval: 20 })
  });

  actions.playbackHasStarted$.addListener({
    next: () => animations.setInfoPanelsPlaybackHeight()
  });
  actions.successApiResponse$
    .filter(({ games }) => games.some(game => hasGameFinished(game.status.state)))
    .addListener({
      next: () =>
        gameClock.clock$.addListener({
          complete: () => animations.setInfoPanelsFinalHeight()
        })
    });
  const gameUpdate$ = gameClock.clock$.filter(({ update }) => !!update).map(({ update }) => update);

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
    }
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
          ...currentGoals.slice(update.gameIndex + 1)
        ],
        initialGameGoals
      )
    )
    .flatten();

  return xs
    .combine(
      scores$,
      currentGoals$.startWith([]),
      actions.isPlaying$.startWith(false),
      actions.status$.startWith('Fetching latest scores...'),
      gameClock.DOM.startWith(span('.clock')),
      gameClock.clock$.startWith(null)
    )
    .map(([scores, currentGoals, isPlaying, status, clockVtree, clock]) => ({
      scores,
      currentGoals,
      isPlaying,
      status,
      clockVtree,
      clock,
      gameCount: scores.games.length
    }));
}

function view(state$) {
  return state$.map(({ scores, currentGoals, isPlaying, status, clockVtree, clock, gameCount }) =>
    div([
      header(
        '.header',
        renderHeader({
          clockVtree,
          clock,
          gameCount,
          isPlaying,
          date: scores.date
        })
      ),
      section('.score-panel', renderScores({ games: scores.games, currentGoals, status, clock }))
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
    h1('.header__title', [span('.all-caps', 'NHL'), ' Recap']),
    button(buttonClass),
    showDate ? renderDate(state.date) : state.clockVtree
  ]);
}

function renderScores(state) {
  const gameAnimationIndexes = getGameAnimationIndexes(state.games.length);
  return state.games.length > 0
    ? div(
        '.score-list',
        state.games.map((game, index) =>
          gameScore(state.clock, game, state.currentGoals[index] || [], gameAnimationIndexes[index])
        )
      )
    : div('.status.fade-in', [state.status || 'No scores available.']);
}

function renderDate(date) {
  return span('.date.fade-in-slow', date.pretty);
}
