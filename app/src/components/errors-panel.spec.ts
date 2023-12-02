import { div, VNode } from '@cycle/dom';

import { scoresAllRegularTime } from '../test/data';
import type { StatError } from '../types';
import Game from './game';
import { getGameCard } from './test-utils';

describe('errors panel', () => {
  it('should not show errors with valid data', () => {
    assertErrors(undefined, null);
  });

  it('should show appropriate error when all goal data is missing', () => {
    assertErrors([{ error: 'MISSING-ALL-GOALS' }], ['Missing all goal data']);
  });

  it("should show appropriate error when some goals' data is missing", () => {
    assertErrors(
      [{ error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 3 } }],
      ['Missing 1 goal from data'],
    );
  });

  it("should show appropriate error when too many goals' data exists", () => {
    assertErrors(
      [{ error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 2, scoreCount: 1 } }],
      ['1 too many goals in data'],
    );
  });
});

function assertErrors(gameErrors: StatError[] | undefined, expectedErrors: string[] | null) {
  const errorsPanel = getErrorsPanel(
    Game('playback', { ...scoresAllRegularTime.games[0], errors: gameErrors }, [], 0),
  );
  const expected = expectedErrorsPanel(expectedErrors);
  expect(errorsPanel).toEqual(expected);
}

function getErrorsPanel(vtree: VNode) {
  return getGameCard(vtree)?.children?.[3];
}

function expectedErrorsPanel(errors: string[] | null) {
  return errors
    ? div(
        '.game__errors',
        errors.map((error) => div(error)),
      )
    : null;
}
