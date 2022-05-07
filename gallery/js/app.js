import { div, span } from '@cycle/dom';
import xs from 'xstream';

import Game from '../../app/js/components/game';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED,
} from '../../app/js/events/constants';
import scoresAllRegularTime from '../../test/data/latest.json';
import scoresAllRegularTimePlayoffs from '../../test/data/latest-playoffs.json';

export default function main() {
  return () => ({ DOM: view(model(intent())) });
}

function intent() {
  const progress = {
    currentPeriod: 3,
    currentPeriodOrdinal: '3rd',
    currentPeriodTimeRemaining: { pretty: '00:05', min: 0, sec: 5 },
  };
  return [
    {
      gameStatus: {
        description: 'in progress',
        status: { state: GAME_STATE_IN_PROGRESS, progress },
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
        status: { state: GAME_STATE_FINISHED },
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
        status: { state: GAME_STATE_NOT_STARTED },
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

function model(stateDefinitions) {
  const gamesData = [
    { description: 'Regular season game', data: scoresAllRegularTime.games[1] },
    { description: 'Playoff game', data: scoresAllRegularTimePlayoffs.games[1] },
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
            ? {
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
              }
            : null
        ),
      }))
    )
  );
  return { gameStates$: transitionedGameStates$ };
}

function view({ gameStates$ }) {
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
            : div()
        ),
      ])
    )
  );
}
