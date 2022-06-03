import { div, span, VNode } from '@cycle/dom';
import xs, { Stream } from 'xstream';

import Game from '../../app/js/components/game';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
} from '../../app/js/events/constants';
import scoresAllRegularTime from '../../test/data/latest.json';
import scoresAllRegularTimePlayoffs from '../../test/data/latest-playoffs.json';
import type { Game as GameT, GameStats, GameStatus, Goal } from '../../app/js/types';

type Sinks = {
  DOM: Stream<VNode>;
};

type Actions = GameStateDefinition[];

type State = {
  gameStates$: Stream<{ gameDescription: string; games: (GalleryGameT | null)[] }[]>;
};

type GalleryGameT = {
  currentGoals: Goal[];
  description: string;
  gameDisplay: string;
  gameState: GameT & {
    status: string;
    gameStats: GameStats;
  };
};

type GameStateDefinition = {
  gameStatus: {
    description: string;
    gameStats?: undefined;
    status: GameStatus;
  };
  states: ({
    description: string;
    gameDisplays: string[];
    goalCount: number;
  } | null)[];
};

export default function main(): () => Sinks {
  return () => ({ DOM: view(model(intent())) });
}

function intent(): Actions {
  const progress = {
    currentPeriod: 3,
    currentPeriodOrdinal: '3rd',
    currentPeriodTimeRemaining: { pretty: '00:05', min: 0, sec: 5 },
  };
  return [
    {
      gameStatus: {
        description: 'in progress',
        status: { state: 'LIVE', progress },
      },
      states: [
        {
          description: 'Playback not started',
          gameDisplays: [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_PRE_GAME],
          goalCount: 4,
        },
        {
          description: 'Playback has passed game’s current progress',
          gameDisplays: [GAME_DISPLAY_PLAYBACK, GAME_DISPLAY_IN_PROGRESS],
          goalCount: 4,
        },
        {
          description: 'Playback finished',
          gameDisplays: [GAME_DISPLAY_IN_PROGRESS, GAME_DISPLAY_POST_GAME_IN_PROGRESS],
          goalCount: 4,
        },
      ],
    },
    {
      gameStatus: {
        description: 'finished',
        status: { state: 'FINAL' },
      },
      states: [
        {
          description: 'Playback not started',
          gameDisplays: [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_PRE_GAME],
          goalCount: 5,
        },
        {
          description: 'Playback in progress',
          gameDisplays: [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_PLAYBACK],
          goalCount: 0,
        },
        {
          description: 'Playback finished',
          gameDisplays: [GAME_DISPLAY_PLAYBACK, GAME_DISPLAY_POST_GAME_FINISHED],
          goalCount: 5,
        },
      ],
    },
    {
      gameStatus: {
        description: 'not started',
        status: { state: 'PREVIEW' },
        gameStats: undefined,
      },
      states: [
        {
          description: 'Playback in any state',
          gameDisplays: [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_PRE_GAME],
          goalCount: 0,
        },
        null,
        null,
      ],
    },
  ];
}

function model(stateDefinitions: Actions): State {
  const gamesData = [
    { description: 'Regular season game', data: scoresAllRegularTime.games[1] as unknown as GameT },
    {
      description: 'Playoff game',
      data: scoresAllRegularTimePlayoffs.games[1] as unknown as GameT,
    },
  ];
  const gameDisplayIndex$ = xs
    .periodic(1000)
    .startWith(-1)
    .map((index) => index + 1)
    .take(2);
  const transitionedGameStates$ = gameDisplayIndex$.map((gameDisplayIndex) =>
    gamesData.flatMap((gameData) =>
      stateDefinitions.map(({ gameStatus, states }) => ({
        gameDescription: `${gameData.description} ${gameStatus.description}`,
        games: states.map((state) =>
          state
            ? ({
                description: state.description,
                gameDisplay: state.gameDisplays[gameDisplayIndex],
                gameState: {
                  ...gameData.data,
                  status: gameStatus.status,
                  // eslint-disable-next-line no-prototype-builtins
                  gameStats: gameStatus.hasOwnProperty('gameStats')
                    ? gameStatus.gameStats
                    : gameData.data.gameStats,
                },
                currentGoals: gameData.data.goals.slice(0, state.goalCount),
              } as GalleryGameT)
            : null,
        ),
      })),
    ),
  );
  return { gameStates$: transitionedGameStates$ };
}

function view({ gameStates$ }: State): Stream<VNode> {
  return gameStates$.map((gameStates) =>
    div(
      '.score-list',
      gameStates.flatMap(({ gameDescription, games }) => [
        div('.gallery-heading', span('.gallery-heading__description', gameDescription)),
        ...games.map((game, gameIndex) =>
          game
            ? div('.gallery-game', [
                div('.gallery-game__description', [game.description]),
                Game(game.gameDisplay, game.gameState, game.currentGoals, gameIndex),
              ])
            : div(),
        ),
      ]),
    ),
  );
}
