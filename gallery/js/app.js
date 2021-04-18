import { div } from '@cycle/dom';
import xs from 'xstream';

import renderGame from '../../app/js/components/game';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  PLAYBACK_FINISHED,
  PLAYBACK_IN_PROGRESS,
  PLAYBACK_NOT_STARTED,
} from '../../app/js/events/constants';
import scoresAllRegularTime from '../../test/data/latest.json';

export default function main() {
  return () => ({ DOM: view(model()) });
}

function model() {
  const progress = {
    currentPeriod: 3,
    currentPeriodOrdinal: '3rd',
    currentPeriodTimeRemaining: { pretty: '00:05', min: 0, sec: 5 },
  };
  const stateCombinations = [
    [
      'Playback not started',
      PLAYBACK_NOT_STARTED,
      GAME_DISPLAY_PRE_GAME,
      { state: GAME_STATE_IN_PROGRESS, progress },
    ],
    [
      'Playback in progress, hasn’t passed game’s current progress',
      PLAYBACK_IN_PROGRESS,
      GAME_DISPLAY_PLAYBACK,
      { state: GAME_STATE_FINISHED },
    ],
    [
      'Playback in progress, has passed game’s current progress',
      PLAYBACK_IN_PROGRESS,
      GAME_DISPLAY_IN_PROGRESS,
      { state: GAME_STATE_IN_PROGRESS, progress },
    ],
    [
      'Playback finished, game still in progress',
      PLAYBACK_FINISHED,
      GAME_DISPLAY_IN_PROGRESS,
      { state: GAME_STATE_IN_PROGRESS, progress },
    ],
    [
      'Playback finished, game finished',
      PLAYBACK_FINISHED,
      GAME_DISPLAY_POST_GAME,
      { state: GAME_STATE_FINISHED },
    ],
  ];
  const game = scoresAllRegularTime.games[1];
  const games$ = xs.of(
    stateCombinations.map(([description, playbackState, gameDisplay, status], index) => ({
      description,
      playbackState,
      gameDisplay,
      gameState: { ...game, status },
      currentGoals: game.goals.slice(0, index % 2 === 0 ? -1 : undefined),
    }))
  );
  return { games$ };
}

function view({ games$ }) {
  return games$.map(games => {
    return div(
      '.score-list',
      games.map(game =>
        div('.gallery-game', [
          div('.gallery-game__description', [game.description]),
          renderGame(game.gameDisplay, game.gameState, game.currentGoals),
        ])
      )
    );
  });
}
