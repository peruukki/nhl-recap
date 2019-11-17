import { assert } from 'chai';
import xs from 'xstream';

import gameDisplays from '../app/js/game-displays';
import { addListener } from './test-utils';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED
} from '../app/js/utils';

const CLOCK_STATE_NOT_STARTED = 'CLOCK_STATE_NOT_STARTED';
const CLOCK_STATE_IN_PROGRESS = 'CLOCK_STATE_IN_PROGRESS';
const CLOCK_STATE_PASSED_IN_PROGRESS_GAMES = 'CLOCK_STATE_PASSED_IN_PROGRESS_GAMES';
const CLOCK_STATE_END = 'CLOCK_STATE_END';

describe('gameDisplays', () => {
  [
    CLOCK_STATE_NOT_STARTED,
    CLOCK_STATE_IN_PROGRESS,
    CLOCK_STATE_PASSED_IN_PROGRESS_GAMES,
    CLOCK_STATE_END
  ].forEach(clockState => {
    [GAME_STATE_NOT_STARTED, GAME_STATE_IN_PROGRESS, GAME_STATE_FINISHED].forEach(gameState => {
      const expected = getExpectedGameDisplay(clockState, gameState);

      it(`should return ${expected} for clock state ${clockState} and game state ${gameState}`, done => {
        const gameDisplays$ = gameDisplays(getClock$(clockState), getScores$(gameState));
        // Ignore intermediate values and assert the last one
        addListener(done, gameDisplays$.last(), gameDisplays => {
          assert.deepEqual(gameDisplays, [expected]);
        });
      });
    });
  });

  function getExpectedGameDisplay(clockState, gameState) {
    const expectedValues = new Map([
      [`${CLOCK_STATE_NOT_STARTED},${GAME_STATE_NOT_STARTED}`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_NOT_STARTED},${GAME_STATE_IN_PROGRESS}`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_NOT_STARTED},${GAME_STATE_FINISHED}`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_IN_PROGRESS},${GAME_STATE_NOT_STARTED}`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_IN_PROGRESS},${GAME_STATE_IN_PROGRESS}`, GAME_DISPLAY_PLAYBACK],
      [`${CLOCK_STATE_IN_PROGRESS},${GAME_STATE_FINISHED}`, GAME_DISPLAY_PLAYBACK],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},${GAME_STATE_NOT_STARTED}`, GAME_DISPLAY_PRE_GAME],
      [
        `${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},${GAME_STATE_IN_PROGRESS}`,
        GAME_DISPLAY_IN_PROGRESS
      ],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},${GAME_STATE_FINISHED}`, GAME_DISPLAY_PLAYBACK],
      [`${CLOCK_STATE_END},${GAME_STATE_NOT_STARTED}`, GAME_DISPLAY_PRE_GAME],
      [`${CLOCK_STATE_END},${GAME_STATE_IN_PROGRESS}`, GAME_DISPLAY_IN_PROGRESS],
      [`${CLOCK_STATE_END},${GAME_STATE_FINISHED}`, GAME_DISPLAY_POST_GAME]
    ]);
    return expectedValues.get(`${clockState},${gameState}`);
  }

  function getClock$(clockState) {
    switch (clockState) {
      case CLOCK_STATE_NOT_STARTED:
        return xs.empty();
      case CLOCK_STATE_IN_PROGRESS:
        return xs.of({ period: 1, minute: 15, second: 38 });
      case CLOCK_STATE_PASSED_IN_PROGRESS_GAMES:
        return xs.of({ period: 2, minute: 4, second: 56 });
      case CLOCK_STATE_END:
        return xs.of({ end: true });
      default:
        throw new Error(`Unexpected clock state ${clockState}`);
    }
  }

  function getScores$(gameState) {
    return xs.of({
      games: [
        {
          status: {
            state: gameState,
            progress:
              gameState === GAME_STATE_IN_PROGRESS
                ? { currentPeriod: 1, currentPeriodTimeRemaining: { min: 1, sec: 5 } }
                : undefined
          }
        }
      ]
    });
  }
});
