import { div, type VNode } from '@cycle/dom';
import { describe, expect, it } from 'vitest';

import { scoresAllRegularTime } from '../test/data';
import type { GameState, GameStatus, StatError } from '../types';
import Expandable from './expandable';
import Game from './game';
import { getGameCard } from './test-utils';

describe('errors panel', () => {
  it('should not show errors with valid data', () => {
    assertErrors({ gameErrors: undefined, expectedErrorTexts: undefined, state: 'FINAL' });
  });

  it('should show appropriate error when all goal data is missing', () => {
    assertErrors({
      gameErrors: [{ error: 'MISSING-ALL-GOALS' }],
      expectedErrorTexts: ['Missing all goal data'],
      state: 'FINAL',
    });
  });

  it("should show appropriate error when some goals' data is missing", () => {
    assertErrors({
      gameErrors: [
        { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 3 } },
      ],
      expectedErrorTexts: ['Missing 1 goal from data'],
      state: 'FINAL',
    });
  });

  it("should show appropriate error when too many goals' data exists", () => {
    assertErrors({
      gameErrors: [
        { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 1 } },
      ],
      expectedErrorTexts: ['1 too many goals in data'],
      state: 'FINAL',
    });
  });

  it('should show appropriate pending goal error when game state is live', () => {
    assertErrors({
      gameErrors: [
        { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 3, scoreCount: 2 } },
      ],
      expectedErrorTexts: ['One goal pending'],
      state: 'LIVE',
    });
  });

  it('should show appropriate unconfirmed goal error when game state is live', () => {
    assertErrors({
      gameErrors: [
        { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 3 } },
      ],
      expectedErrorTexts: ['Last goal unconfirmed'],
      state: 'LIVE',
    });
  });

  it('should show regular goal count mismatch error when game state is live and difference is greater than 1', () => {
    assertErrors({
      gameErrors: [
        { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 4, scoreCount: 2 } },
      ],
      expectedErrorTexts: ['2 too many goals in data'],
      state: 'LIVE',
    });
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

function assertErrors({
  gameErrors,
  expectedErrorTexts,
  state,
}: {
  gameErrors: StatError[] | undefined;
  expectedErrorTexts: string[] | undefined;
  state: GameState;
}) {
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
  const expected = expectedErrorsPanel(expectedErrorTexts, true);
  expect(errorsPanel).toEqual(expected);
}

function getErrorsPanel(vtree: VNode) {
  return getGameCard(vtree)?.children?.[3];
}

function expectedErrorsPanel(errorTexts: string[] | undefined, show: boolean) {
  return errorTexts
    ? Expandable({ show }, [
        div(
          '.game__errors',
          errorTexts.map((errorText) => div(errorText)),
        ),
      ])
    : null;
}
