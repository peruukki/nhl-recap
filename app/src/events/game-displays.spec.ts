import { describe, expect, it } from 'vitest';
import xs, { Stream } from 'xstream';

import { addListener } from '../test/test-utils';
import type { Game, GameEvent, Scores } from '../types';
import getGameDisplays$ from './game-displays';

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

      it(`should return ${expected} for clock state ${clockState} and game state ${gameState}`, () =>
        new Promise((done) => {
          const gameDisplays$ = getGameDisplays$(getClock$(clockState), getScores$(gameState));
          // Ignore intermediate values and assert the last one
          addListener(done, gameDisplays$.last(), (gameDisplays) => {
            expect(gameDisplays).toEqual([expected]);
          });
        }));
    });
  });

  function getExpectedGameDisplay(clockState: string, gameState: string) {
    const expectedValues = new Map([
      [`${CLOCK_STATE_NOT_STARTED},PREVIEW`, 'pre-game'],
      [`${CLOCK_STATE_NOT_STARTED},LIVE`, 'pre-game'],
      [`${CLOCK_STATE_NOT_STARTED},FINAL`, 'pre-game'],
      [`${CLOCK_STATE_IN_PROGRESS},PREVIEW`, 'pre-game'],
      [`${CLOCK_STATE_IN_PROGRESS},LIVE`, 'playback'],
      [`${CLOCK_STATE_IN_PROGRESS},FINAL`, 'playback'],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},PREVIEW`, 'pre-game'],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},LIVE`, 'in-progress'],
      [`${CLOCK_STATE_PASSED_IN_PROGRESS_GAMES},FINAL`, 'playback'],
      [`${CLOCK_STATE_END},PREVIEW`, 'pre-game'],
      [`${CLOCK_STATE_END},LIVE`, 'post-game-in-progress'],
      [`${CLOCK_STATE_END},FINAL`, 'post-game-finished'],
    ]);
    return expectedValues.get(`${clockState},${gameState}`);
  }

  function getClock$(clockState: string): Stream<GameEvent> {
    switch (clockState) {
      case CLOCK_STATE_NOT_STARTED:
        return xs.empty();
      case CLOCK_STATE_IN_PROGRESS:
        return xs.of({ type: 'clock', period: 1, minute: 15, second: 38 } as GameEvent);
      case CLOCK_STATE_PASSED_IN_PROGRESS_GAMES:
        return xs.of({ type: 'clock', period: 2, minute: 4, second: 56 } as GameEvent);
      case CLOCK_STATE_END:
        return xs.of({ type: 'end' } as GameEvent);
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
