import xs, { Stream } from 'xstream';

import { GameEvent, GameEventClockTime, isClockTimeEvent, isEndEvent, Scores } from '../types';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
} from './constants';
import {
  hasClockPassedCurrentProgress,
  hasGameFinished,
  hasGameStarted,
  isGameInProgress,
} from './utils';

export default function getGameDisplays$(
  clock$: Stream<GameEvent>,
  scores$: Stream<Scores>,
): Stream<string[]> {
  const initialgameDisplays$ = scores$
    .filter((scores) => scores.games.length > 0)
    .map((scores) => Array.from({ length: scores.games.length }, () => GAME_DISPLAY_PRE_GAME));
  const gameDisplays$ = xs.combine(scores$, clock$).map(([scores, clock]) => {
    const isPlaybackFinished = isEndEvent(clock) && !isClockTimeEvent(clock);
    return scores.games.map((game) => {
      if (!hasGameStarted(game.status.state)) {
        return GAME_DISPLAY_PRE_GAME;
      }
      if (
        !isPlaybackFinished &&
        isGameInProgress(game.status.state) &&
        hasClockPassedCurrentProgress(clock as GameEventClockTime, game.status)
      ) {
        return GAME_DISPLAY_IN_PROGRESS;
      }
      if (isPlaybackFinished) {
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
