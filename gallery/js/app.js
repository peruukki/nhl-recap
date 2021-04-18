import { div, span } from '@cycle/dom';
import xs from 'xstream';

import renderGame from '../../app/js/components/game';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
} from '../../app/js/events/constants';
import scoresAllRegularTime from '../../test/data/latest.json';

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
      game: {
        description: 'Game in progress',
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
      game: {
        description: 'Game finished',
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
  ];
}

function model(stateDefinitions) {
  const gameData = scoresAllRegularTime.games[1];
  const gameDisplayIndex$ = xs
    .periodic(1000)
    .startWith(-1)
    .map(index => index + 1)
    .take(2);
  const transitionedGameStates$ = gameDisplayIndex$.map(gameDisplayIndex =>
    stateDefinitions.map(({ game, states }) => ({
      gameDescription: game.description,
      games: states.map(state => ({
        description: state.description,
        gameDisplay: state.gameDisplays[gameDisplayIndex],
        gameState: { ...gameData, status: game.status },
        currentGoals: gameData.goals.slice(0, state.goalCount),
      })),
    }))
  );
  return { gameStates$: transitionedGameStates$ };
}

function view({ gameStates$ }) {
  return gameStates$.map(gameStates =>
    div(
      '.score-list',
      gameStates.flatMap(({ gameDescription, games }) => [
        div('.gallery-heading', span('.gallery-heading__description', gameDescription)),
        ...games.map(game =>
          div('.gallery-game', [
            div('.gallery-game__description', [game.description]),
            renderGame(game.gameDisplay, game.gameState, game.currentGoals),
          ])
        ),
      ])
    )
  );
}
