import { MainDOMSource, VNode, div, main, span } from '@cycle/dom';
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
} from '../types';
import type { Animations } from '../utils/animations';
import { debugFn } from '../utils/debug';
import { delayAtLeast } from '../utils/delay';
import { getGameAnimationIndexes } from '../utils/utils';
import Clock from './clock';
import Game from './game';
import Header from './header';

type Sources = {
  DOM: MainDOMSource;
  HTTP: HTTPSource;
};

type Sinks = {
  DOM: Stream<VNode>;
  HTTP: Stream<{ url: string }>;
};

type Actions = {
  date?: string;
  isPlaying$: Stream<boolean>;
  playbackHasStarted$: Stream<boolean>;
  status$: Stream<FetchStatus>;
  successApiResponse$: Stream<Scores>;
};

type State = {
  scores: Scores;
  currentGoals: Goal[][];
  isPlaying: boolean;
  status: FetchStatus;
  clockVtree: VNode;
  event: GameEvent | null;
  gameDisplays: GameDisplay[];
  gameCount: number;
};

type FetchStatus = {
  isDone: boolean;
  message?: string;
};

type ApiResponseError = { error: { expected: boolean; message?: string } };
type ApiResponseSuccess = { success: Scores };
type ApiResponse = ApiResponseError | ApiResponseSuccess;
function isSuccessApiResponse(response: ApiResponse): response is ApiResponseSuccess {
  return !!(response as ApiResponseSuccess).success;
}

type Options = { fetchStatusDelayMs: number };

function parseSearchParams($window: Window) {
  const searchParams = new URLSearchParams($window.location.search);
  const dateParam = searchParams.get('date') ?? undefined;
  const isDateParamValid =
    !dateParam || (/^\d{4}-\d{2}-\d{2}$/.test(dateParam) && !isNaN(new Date(dateParam).getTime()));
  return {
    date: dateParam,
    error: !isDateParamValid ? new Error(`Invalid date parameter "${dateParam}".`) : undefined,
  };
}

export default function app(
  animations: Animations,
  $window: Window,
  options: Options,
): (sources: Sources) => Sinks {
  return ({ DOM, HTTP }) => {
    const { date, error } = parseSearchParams($window);
    const error$ = error ? xs.of(error) : xs.empty();
    const url = date ? getApiUrl(date) : getApiUrl();
    return {
      DOM: view(model(intent(DOM, HTTP, error$, $window, options, date), animations)),
      HTTP: error ? xs.empty() : xs.of({ url }),
    };
  };
}

function getApiUrl(date?: string): string {
  const host = import.meta.env.VITE_SCORE_API_HOST ?? 'https://nhl-score-api.herokuapp.com';
  return `${host}/api/scores${date ? `?startDate=${date}` : '/latest'}`;
}

function intent(
  DOM: Sources['DOM'],
  HTTP: Sources['HTTP'],
  error$: Stream<Error>,
  $window: Window,
  options: Options,
  date?: string,
): Actions {
  const apiResponseWithErrors$ = HTTP.select()
    .map((response$) =>
      response$.replaceError((error: unknown) => xs.of({ error }) as unknown as Stream<Response>),
    )
    .flatten()
    .map<ApiResponse>((response) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (response.error) {
        return { error: { expected: false } };
      }
      try {
        const responseJson = JSON.parse(response.text) as Scores | Scores[];
        const scores = Array.isArray(responseJson) ? responseJson[0] : responseJson;
        return scores.games.length > 0
          ? { success: scores }
          : { error: { message: 'No scores available.', expected: true } };
      } catch (error) {
        console.error(error);
        return { error: { expected: false } };
      }
    })
    .compose(delayAtLeast(options.fetchStatusDelayMs))
    .debug(debugFn('apiResponseWithErrors$'));

  const successApiResponse$ = apiResponseWithErrors$
    .filter((response): response is ApiResponseSuccess => isSuccessApiResponse(response))
    .map((response) => response.success);

  const nonApiError$ = error$.map((error) => ({
    error: { message: error.message, expected: true },
  }));

  const apiResponseOrError$ = xs
    .merge(apiResponseWithErrors$, nonApiError$)
    .debug(debugFn('apiResponseOrError$'));

  const playClicks$ = DOM.select('.button--play').events('click').mapTo(true);
  const pauseClicks$ = DOM.select('.button--pause').events('click').mapTo(false);
  const isPlaying$ = xs.merge(playClicks$, pauseClicks$).startWith(false);
  const playbackHasStarted$ = playClicks$.take(1);

  const getUnexpectedErrorMessage = () => {
    const baseMessage = 'Failed to fetch scores';
    const details = !$window.navigator.onLine ? ': the network is offline' : '';
    return `${baseMessage}${details}.`;
  };

  const initialStatusMessage = date
    ? `Fetching scores for ${new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
      })} ${new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      })}`
    : 'Fetching latest scores';

  const status$ = xs
    .merge(
      successApiResponse$.mapTo({ isDone: true }),
      apiResponseOrError$
        .filter((response): response is ApiResponseError => !isSuccessApiResponse(response))
        .map<FetchStatus>(({ error }) => ({
          isDone: true,
          message: error.message ?? getUnexpectedErrorMessage(),
        })),
    )
    .startWith({ isDone: false, message: initialStatusMessage })
    .debug(debugFn('status$'));

  return {
    successApiResponse$,
    isPlaying$,
    playbackHasStarted$,
    status$,
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
          throw new Error(`Unknown game update type ${(gameUpdate as { type: string }).type}`);
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

  const games$ = xs
    .combine(scores$, actions.status$, currentGoals$.startWith([]), gameDisplays$.startWith([]))
    .filter(([scores, status]) => scores.games.length === 0 || status.isDone)
    .debug(debugFn('games$'));

  actions.isPlaying$.addListener({
    next: animations.highlightPlayPauseButtonChange,
  });

  return xs
    .combine(
      games$,
      actions.isPlaying$,
      clock.DOM.startWith(span('.clock')),
      clock.events$.startWith(null as unknown as GameEvent),
    )
    .map<State>(
      ([[scores, status, currentGoals, gameDisplays], isPlaying, clockVtree, clockEvent]) => ({
        scores,
        status,
        currentGoals,
        gameDisplays,
        isPlaying,
        clockVtree,
        event: clockEvent,
        gameCount: scores.games.length,
      }),
    )
    .debug(debugFn('model$'));
}

function view(state$: Stream<State>): Stream<VNode> {
  return state$.map(
    ({ scores, currentGoals, isPlaying, status, clockVtree, event, gameDisplays, gameCount }) =>
      div([
        Header({ clockVtree, event, date: scores.date, gameCount, isPlaying }),
        main(renderScores({ games: scores.games, currentGoals, status, gameDisplays })),
      ]),
  );
}

function renderScores(
  state: Pick<State, 'currentGoals' | 'gameDisplays' | 'status'> & { games: Scores['games'] },
): VNode {
  const gameAnimationIndexes = getGameAnimationIndexes(state.games.length);
  const scoreListClass = classNames({
    '.score-list': true,
    '.score-list--single-game': state.games.length === 1,
  }).replace(/\s/g, '');
  return state.status.isDone && state.games.length > 0
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
    : div(`.status${state.status.isDone ? '.fade-in-fast.nope-animation' : '.fade-in'}`, [
        state.status.message,
        ...(state.status.isDone ? [] : [span('.loader')]),
      ]);
}
