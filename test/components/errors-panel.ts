import { div, VNode } from '@cycle/dom';
import { assert } from 'chai';

import Game from 'app/js/components/game';
import {
  ERROR_SCORE_AND_GOAL_COUNT_MISMATCH,
  ERROR_MISSING_ALL_GOALS,
  GAME_DISPLAY_PLAYBACK,
} from 'app/js/events/constants';
import type { Game as GameT, StatError } from 'app/js/types';

import scoresAllRegularTime from '../data/latest.json';
import { getGameCard } from './test-utils';

describe('errors panel', () => {
  it('should not show errors with valid data', () => {
    assertErrors(undefined, null);
  });

  it('should show appropriate error when all goal data is missing', () => {
    assertErrors([{ error: ERROR_MISSING_ALL_GOALS }], ['Missing all goal data']);
  });

  it("should show appropriate error when some goals' data is missing", () => {
    assertErrors(
      [{ error: ERROR_SCORE_AND_GOAL_COUNT_MISMATCH, details: { goalCount: 2, scoreCount: 3 } }],
      ['Missing 1 goal from data'],
    );
  });

  it("should show appropriate error when too many goals' data exists", () => {
    assertErrors(
      [{ error: ERROR_SCORE_AND_GOAL_COUNT_MISMATCH, details: { goalCount: 2, scoreCount: 1 } }],
      ['1 too many goals in data'],
    );
  });
});

function assertErrors(gameErrors: StatError[] | undefined, expectedErrors: string[] | null) {
  const errorsPanel = getErrorsPanel(
    Game(
      GAME_DISPLAY_PLAYBACK,
      { ...(scoresAllRegularTime.games[0] as unknown as GameT), errors: gameErrors },
      [],
      0,
    ),
  );
  const expected = expectedErrorsPanel(expectedErrors);
  assert.deepEqual(errorsPanel, expected);
}

function getErrorsPanel(vtree: VNode) {
  return getGameCard(vtree)?.children?.[3];
}

function expectedErrorsPanel(errors: string[] | null) {
  return errors ? div('.game__errors', errors) : null;
}
