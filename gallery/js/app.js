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
          gameDisplay: GAME_DISPLAY_PRE_GAME,
        },
        {
          description: 'Playback has passed game’s current progress',
          gameDisplay: GAME_DISPLAY_IN_PROGRESS,
        },
        {
          description: 'Playback finished',
          gameDisplay: GAME_DISPLAY_POST_GAME_IN_PROGRESS,
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
          gameDisplay: GAME_DISPLAY_PRE_GAME,
        },
        {
          description: 'Playback in progress',
          gameDisplay: GAME_DISPLAY_PLAYBACK,
        },
        {
          description: 'Playback finished',
          gameDisplay: GAME_DISPLAY_POST_GAME_FINISHED,
        },
      ],
    },
  ];
}

function model(gameStates) {
  const gameData = scoresAllRegularTime.games[1];
  const gameStates$ = xs.of(
    gameStates.map(({ game, states }, index) => ({
      gameDescription: game.description,
      games: states.map(state => ({
        description: state.description,
        gameDisplay: state.gameDisplay,
        gameState: { ...gameData, status: game.status },
        currentGoals: gameData.goals.slice(0, index % 2 === 0 ? -1 : undefined),
      })),
    }))
  );
  return { gameStates$ };
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
