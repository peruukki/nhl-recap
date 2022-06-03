import { assert } from 'chai';
import xs, { Stream } from 'xstream';

import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
} from 'app/js/events/constants';
import getGameDisplays$ from 'app/js/events/game-displays';
import type { Game, GameEvent, Scores } from 'app/js/types';
import { addListener } from '../test-utils';

const CLOCK_STATE_NOT_STARTED = 'CLOCK_STATE_NOT_STARTED';
const CLOCK_STATE_IN_PROGRESS = 'CLOCK_STATE_IN_PROGRESS';
const CLOCK_STATE_PASSED_IN_PROGRESS_GAMES = 'CLOCK_STATE_PASSED_IN_PROGRESS_GAMES';
const CLOCK_STATE_END = 'CLOCK_STATE_END';

describe('gameDisplays', () => {
  [
    CLOCK_STATE_NOT_STARTED,
    CLOCK_STATE_IN_PROGRESS,
    CLOCK_STATE_PASSED_IN_PROGRESS_GAMES,
    CLOCK_STATE_END,
  ].forEach((clockState) => {
    ['PREVIEW', 'LIVE', 'FINAL'].forEach((gameState) => {
      const expected = getExpectedGameDisplay(clockState, gameState);

      it(`should return ${expected} for clock state ${clockState} and game state ${gameState}`, (done) => {
        const gameDisplays$ = getGameDisplays$(getClock$(clockState), getScores$(gameState));
        // Ignore intermediate values and assert the last one
        addListener(done, gameDisplays$.last(), (gameDisplays) => {
          assert.deepEqual(gameDisplays, [expected]);
        });
      });
    });
  });

  function getExpectedGameDisplay(clockState: string, gameState: string) {
    const expectedValues = new Map([
      [`${CLOCK_STATE_NOT_STARTED},PREVIEW`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_NOT_STARTED},LIVE`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_NOT_STARTED},FINAL`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_IN_PROGRESS},PREVIEW`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_IN_PROGRESS},LIVE`, GAME_DISPLAY_PLAYBACK],
      [`${CLOCK_STATE_IN_PROGRESS},FINAL`, GAME_DISPLAY_PLAYBACK],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},PREVIEW`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},LIVE`, GAME_DISPLAY_IN_PROGRESS],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},FINAL`, GAME_DISPLAY_PLAYBACK],
      [`${CLOCK_STATE_END},PREVIEW`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_END},LIVE`, GAME_DISPLAY_POST_GAME_IN_PROGRESS],
      [`${CLOCK_STATE_END},FINAL`, GAME_DISPLAY_POST_GAME_FINISHED],
    ]);
    return expectedValues.get(`${clockState},${gameState}`);
  }

  function getClock$(clockState: string): Stream<GameEvent> {
    switch (clockState) {
      case CLOCK_STATE_NOT_STARTED:
        return xs.empty();
      case CLOCK_STATE_IN_PROGRESS:
        return xs.of({ period: 1, minute: 15, second: 38 } as GameEvent);
      case CLOCK_STATE_PASSED_IN_PROGRESS_GAMES:
        return xs.of({ period: 2, minute: 4, second: 56 } as GameEvent);
      case CLOCK_STATE_END:
        return xs.of({ end: true } as GameEvent);
      default:
        throw new Error(`Unexpected clock state ${clockState}`);
    }
  }

  function getScores$(gameState: string): Stream<Scores> {
    return xs.of({
      games: [
        {
          status: {
            state: gameState,
            progress:
              gameState === 'LIVE'
                ? { currentPeriod: 1, currentPeriodTimeRemaining: { min: 1, sec: 5 } }
                : undefined,
          },
        } as Game,
      ],
    });
  }
});
