import xs from 'xstream';

import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
  PLAYBACK_FINISHED,
  PLAYBACK_IN_PROGRESS,
} from './constants';
import {
  hasClockPassedCurrentProgress,
  hasGameFinished,
  hasGameStarted,
  isGameInProgress,
} from './utils';

export default function getGameDisplays$(clock$, scores$) {
  const initialgameDisplays$ = scores$
    .filter(scores => scores.games.length > 0)
    .map(scores => Array.from({ length: scores.games.length }, () => GAME_DISPLAY_PRE_GAME));
  const gameDisplays$ = xs.combine(scores$, clock$).map(([scores, clock]) => {
    const playbackState = clock.end && !clock.period ? PLAYBACK_FINISHED : PLAYBACK_IN_PROGRESS;
    return scores.games.map(game => {
      if (!hasGameStarted(game.status.state)) {
        return GAME_DISPLAY_PRE_GAME;
      }
      if (
        playbackState === PLAYBACK_IN_PROGRESS &&
        isGameInProgress(game.status.state) &&
        hasClockPassedCurrentProgress(clock, game.status)
      ) {
        return GAME_DISPLAY_IN_PROGRESS;
      }
      if (playbackState === PLAYBACK_FINISHED) {
        return hasGameFinished(game.status.state)
          ? GAME_DISPLAY_POST_GAME_FINISHED
          : GAME_DISPLAY_POST_GAME_IN_PROGRESS;
      }
      return GAME_DISPLAY_PLAYBACK;
    });
  });
  const gameDisplaysWithInitialValues$ = xs.merge(initialgameDisplays$, gameDisplays$);
  return gameDisplaysWithInitialValues$;
}
