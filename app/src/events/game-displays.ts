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
      const isPlaybackFinished = ['end', 'pre-summary', 'summary'].includes(event.type);
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
        if (event.type === 'pre-summary') {
          return hasGameFinished(game.status.state)
            ? 'pre-summary-finished'
            : 'pre-summary-in-progress';
        }
        if (event.type === 'summary') {
          return hasGameFinished(game.status.state) ? 'summary-finished' : 'summary-in-progress';
        }
        if (event.type === 'end') {
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
