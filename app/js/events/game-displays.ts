import xs, { Stream } from 'xstream';

import { GameDisplay, GameEvent, GameEventClockTime, Scores } from '../types';
import {
  hasClockPassedCurrentProgress,
  hasGameFinished,
  hasGameStarted,
  isGameInProgress,
} from './utils';

export default function getGameDisplays$(
  events$: Stream<GameEvent>,
  scores$: Stream<Scores>,
): Stream<GameDisplay[]> {
  const initialgameDisplays$ = scores$
    .filter((scores) => scores.games.length > 0)
    .map((scores) =>
      Array.from<ArrayLike<never>, GameDisplay>({ length: scores.games.length }, () => 'pre-game'),
    );
  const gameDisplays$: Stream<GameDisplay[]> = xs
    .combine(scores$, events$)
    .map(([scores, event]) => {
      const isPlaybackFinished = event.type === 'end';
      return scores.games.map((game) => {
        if (!hasGameStarted(game.status.state)) {
          return 'pre-game';
        }
        if (
          !isPlaybackFinished &&
          isGameInProgress(game.status.state) &&
          hasClockPassedCurrentProgress(event as GameEventClockTime, game.status)
        ) {
          return 'in-progress';
        }
        if (isPlaybackFinished) {
          return hasGameFinished(game.status.state)
            ? 'post-game-finished'
            : 'post-game-in-progress';
        }
        return 'playback';
      });
    });
  const gameDisplaysWithInitialValues$ = xs.merge(initialgameDisplays$, gameDisplays$);
  return gameDisplaysWithInitialValues$;
}
