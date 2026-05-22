import { div, type VNode } from '@cycle/dom';
import { describe, expect, it } from 'vitest';

import { scoresAllRegularTime } from '../test/data';
import type { GameState, GameStatus, StatError } from '../types';
import Expandable from './expandable';
import Game from './game';
import { getGameCard } from './test-utils';

describe('errors panel', () => {
  it('should not show errors with valid data', () => {
    assertErrors(undefined);
  });

  it('should show appropriate error when all goal data is missing', () => {
    assertErrors([{ error: 'MISSING-ALL-GOALS' }]);
  });

  it("should show appropriate error when some goals' data is missing", () => {
    assertErrors([
      { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 3 } },
    ]);
  });

  it("should show appropriate error when too many goals' data exists", () => {
    assertErrors([
      { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 1 } },
    ]);
  });

  it('should show appropriate pending goal error when game state is live', () => {
    assertErrors(
      [{ error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 3, scoreCount: 2 } }],
      'LIVE',
    );
  });

  it('should show appropriate unconfirmed goal error when game state is live', () => {
    assertErrors(
      [{ error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 3 } }],
      'LIVE',
    );
  });

  it('should show regular goal count mismatch error when game state is live and difference is greater than 1', () => {
    assertErrors(
      [{ error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 4, scoreCount: 2 } }],
      'LIVE',
    );
  });

  it('should not show errors during playback', () => {
    const gameErrors = [{ error: 'MISSING-ALL-GOALS' }] as StatError[];
    const errorsPanel = getErrorsPanel(
      Game('playback', { ...scoresAllRegularTime.games[0], errors: gameErrors }, [], 0),
    );
    expect(errorsPanel).toHaveProperty('data.class.expandable--hidden', true);
  });

  it('should not show errors during pre-summary', () => {
    const gameErrors = [{ error: 'MISSING-ALL-GOALS' }] as StatError[];
    const errorsPanel = getErrorsPanel(
      Game('pre-summary-finished', { ...scoresAllRegularTime.games[0], errors: gameErrors }, [], 0),
    );
    expect(errorsPanel).toHaveProperty('data.class.expandable--hidden', true);
  });

  it('should not show errors during summary', () => {
    const gameErrors = [{ error: 'MISSING-ALL-GOALS' }] as StatError[];
    const errorsPanel = getErrorsPanel(
      Game('summary-finished', { ...scoresAllRegularTime.games[0], errors: gameErrors }, [], 0),
    );
    expect(errorsPanel).toHaveProperty('data.class.expandable--hidden', true);
  });
});

function assertErrors(gameErrors: StatError[] | undefined, state: GameState = 'FINAL') {
  const status: GameStatus =
    state === 'LIVE'
      ? {
          progress: {
            currentPeriod: 3,
            currentPeriodOrdinal: '3rd',
            currentPeriodTimeRemaining: { min: 0, pretty: '00:00', sec: 0 },
          },
          state,
        }
      : { state };
  const errorsPanel = getErrorsPanel(
    Game(
      'post-game-finished',
      {
        ...scoresAllRegularTime.games[0],
        errors: gameErrors,
        status,
      },
      [],
      0,
    ),
  );
  const expected = expectedErrorsPanel(gameErrors, state, true);
  expect(errorsPanel).toEqual(expected);
}

function getErrorsPanel(vtree: VNode) {
  return getGameCard(vtree)?.children?.[3];
}

function expectedErrorsPanel(errors: StatError[] | undefined, state: GameState, show: boolean) {
  return errors
    ? Expandable({ show }, [
        div(
          '.game__errors',
          errors.map((error) => div(getErrorText(error, state))),
        ),
      ])
    : null;
}

function getErrorText(error: StatError, state: GameState): string {
  switch (error.error) {
    case 'MISSING-ALL-GOALS':
      return 'Missing all goal data';
    case 'SCORE-AND-GOAL-COUNT-MISMATCH': {
      const { goalCount, scoreCount } = error.details;
      if (state === 'LIVE') {
        if (goalCount === scoreCount + 1) {
          return 'One goal pending';
        }
        if (scoreCount === goalCount + 1) {
          return 'Last goal unconfirmed';
        }
      }
      const difference = Math.abs(goalCount - scoreCount);
      const pluralSuffix = difference === 1 ? '' : 's';
      return goalCount < scoreCount
        ? `Missing ${difference} goal${pluralSuffix} from data`
        : `${difference} too many goals in data`;
    }
    default:
      return `Unknown error ${JSON.stringify(error)}`;
  }
}
