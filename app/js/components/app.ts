import { button, div, h1, header, MainDOMSource, section, span, VNode } from '@cycle/dom';
import { HTTPSource, Response } from '@cycle/http';
import classNames from 'classnames';
import xs, { Stream } from 'xstream';

import getGameDisplays$ from '../events/game-displays';
import type {
  GameDisplay,
  GameEvent,
  GameEventGameUpdate,
  GameUpdateGoal,
  Goal,
  Scores,
  ScoresDate,
} from '../types';
import type { Animations } from '../utils/animations';
import { getGameAnimationIndexes } from '../utils/utils';
import Clock from './clock';
import Game from './game';

type Sources = {
  DOM: MainDOMSource;
  HTTP: HTTPSource;
};

type Sinks = {
  DOM: Stream<VNode>;
  HTTP: Stream<{ url: string }>;
};

type Actions = {
  successApiResponse$: Stream<Scores>;
  isPlaying$: Stream<boolean>;
  playbackHasStarted$: Stream<boolean>;
  status$: Stream<string>;
};

type State = {
  scores: Scores;
  currentGoals: Goal[][];
  isPlaying: boolean;
  status: string;
  clockVtree: VNode;
  event: GameEvent | null;
  gameDisplays: GameDisplay[];
  gameCount: number;
};

type ApiResponseError = { error: { expected: boolean; message?: string } };
type ApiResponseSuccess = { success: Scores };
type ApiResponse = ApiResponseError | ApiResponseSuccess;
function isSuccessApiResponse(response: ApiResponse): response is ApiResponseSuccess {
  return !!(response as ApiResponseSuccess).success;
}

export default function main(animations: Animations, $window: Window): (sources: Sources) => Sinks {
  return ({ DOM, HTTP }) => {
    const url = getApiUrl();
    return {
      DOM: view(model(intent(DOM, HTTP, $window), animations)),
      HTTP: xs.of({ url }),
    };
  };
}

function getApiUrl(): string {
  const host = process.env.SCORE_API_HOST || 'https://nhl-score-api.herokuapp.com';
  return `${host}/api/scores/latest`;
}

function intent(DOM: Sources['DOM'], HTTP: Sources['HTTP'], $window: Window): Actions {
  const apiResponseWithErrors$ = HTTP.select()
    .map((response$) =>
      response$.replaceError((error) => xs.of({ error }) as unknown as Stream<Response>),
    )
    .flatten()
    .map<ApiResponse>((response) => {
      if (response.error) {
        return { error: { expected: false } };
      }
      const responseJson = JSON.parse(response.text) as Scores;
      return responseJson.games.length > 0
        ? { success: responseJson }
        : { error: { message: 'No latest scores available.', expected: true } };
    });
  const successApiResponse$ = apiResponseWithErrors$
    .filter((response): response is ApiResponseSuccess => isSuccessApiResponse(response))
    .map((response) => response.success);

  const playClicks$ = DOM.select('.button--play').events('click').mapTo(true);
  const pauseClicks$ = DOM.select('.button--pause').events('click').mapTo(false);
  const isPlaying$ = xs.merge(playClicks$, pauseClicks$);
  const playbackHasStarted$ = playClicks$.take(1);

  const getUnexpectedErrorMessage = () => {
    const baseMessage = 'Failed to fetch latest scores';
    const details = !$window.navigator.onLine ? ': the network is offline' : '';
    return `${baseMessage}${details}.`;
  };

  return {
    successApiResponse$,
    isPlaying$,
    playbackHasStarted$,
    status$: apiResponseWithErrors$
      .filter((response): response is ApiResponseError => !isSuccessApiResponse(response))
      .map(({ error }) => error.message || getUnexpectedErrorMessage()),
  };
}

function model(actions: Actions, animations: Animations): Stream<State> {
  const initialState = { games: [] };
  const scores$ = actions.successApiResponse$.startWith(initialState);

  const clock = Clock({
    scores$: actions.successApiResponse$.map(({ games }) => games),
    isPlaying$: actions.isPlaying$,
    props$: xs.of({ interval: 20 }),
  });

  const gameUpdate$ = clock.events$
    .filter((event): event is GameEventGameUpdate => event.type === 'game-update')
    .map(({ update }) => update);
  gameUpdate$.addListener({
    next: (gameUpdate) => {
      switch (gameUpdate.type) {
        case 'end':
          animations.stopGameHighlight(gameUpdate.gameIndex);
          break;
        case 'goal':
          animations.highlightGoal(gameUpdate.classModifier, gameUpdate.gameIndex);
          break;
        case 'start':
          animations.highlightGame(gameUpdate.gameIndex);
          break;
        default:
          throw new Error(`Unknown game update type ${(gameUpdate as any).type}`);
      }
    },
  });

  const initialGoals$ = scores$
    .filter((scores) => scores.games.length > 0)
    .map((scores) =>
      Array.from<ArrayLike<never>, Goal[]>({ length: scores.games.length }, () => []),
    );
  const goalUpdate$ = gameUpdate$.filter(
    (update): update is GameUpdateGoal => update.type === 'goal',
  );
  const currentGoals$ = initialGoals$
    .map((initialGameGoals) =>
      goalUpdate$.fold(
        (currentGoals, update) => [
          ...currentGoals.slice(0, update.gameIndex),
          currentGoals[update.gameIndex].concat(update.goal),
          ...currentGoals.slice(update.gameIndex + 1),
        ],
        initialGameGoals,
      ),
    )
    .flatten();

  const gameDisplays$ = getGameDisplays$(clock.events$, scores$);

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
      clock.events$.startWith(null as unknown as GameEvent),
      gameDisplays$.startWith([]),
    )
    .map<State>(
      ([scores, currentGoals, isPlaying, status, clockVtree, clockEvent, gameDisplays]) => ({
        scores,
        currentGoals,
        isPlaying,
        status,
        clockVtree,
        event: clockEvent,
        gameDisplays,
        gameCount: scores.games.length,
      }),
    );
}

function view(state$: Stream<State>): Stream<VNode> {
  return state$.map(
    ({ scores, currentGoals, isPlaying, status, clockVtree, event, gameDisplays, gameCount }) =>
      div([
        header(
          '.header',
          renderHeader({
            clockVtree,
            event,
            gameCount,
            isPlaying,
            date: scores.date,
          }),
        ),
        section(
          '.score-panel',
          renderScores({ games: scores.games, currentGoals, status, gameDisplays }),
        ),
      ]),
  );
}

function renderHeader(
  state: Pick<State, 'event' | 'clockVtree' | 'gameCount' | 'isPlaying'> & { date: Scores['date'] },
): VNode {
  const hasNotStarted = !state.event;
  const isFinished = state.event?.type === 'end';
  const buttonText = state.isPlaying ? 'Pause' : 'Play';
  const buttonType = state.isPlaying ? 'pause' : 'play';
  const dynamicClassNames = {
    [`button--${buttonType}`]: state.gameCount > 0,
    [`expand--${state.gameCount}`]: state.gameCount > 0 && hasNotStarted,
    'button--hidden': isFinished,
  };

  return div('.header__container', [
    h1('.header__title', [span('.all-caps', 'NHL'), ' Recap']),
    button('.button.play-pause-button', { class: dynamicClassNames }, [
      span('.visible-button', span('.visually-hidden', buttonText)),
    ]),
    hasNotStarted && state.date ? renderDate(state.date) : state.clockVtree,
  ]);
}

function renderScores(
  state: Pick<State, 'currentGoals' | 'gameDisplays' | 'status'> & { games: Scores['games'] },
): VNode {
  const gameAnimationIndexes = getGameAnimationIndexes(state.games.length);
  const scoreListClass = classNames({
    '.score-list': true,
    '.score-list--single-game': state.games.length === 1,
  }).replace(/\s/g, '');
  return state.games.length > 0
    ? div(
        scoreListClass,
        state.games.map((game, index) =>
          Game(
            state.gameDisplays[index],
            game,
            state.currentGoals[index] || [],
            gameAnimationIndexes[index],
          ),
        ),
      )
    : div('.status.fade-in', [state.status || 'No scores available.']);
}

function renderDate(date: ScoresDate): VNode {
  return span('.date.fade-in-slow', date.pretty);
}
