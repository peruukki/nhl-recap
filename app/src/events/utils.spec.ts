import { describe, expect, test } from 'vitest';

import { getAdvanceClockStep } from './utils';

describe('getAdvanceClockStep', () => {
  test.each([
    [0, 3],
    [1, 3],
    [4, 3],
    [5, 4],
    [8, 4],
    [9, 5],
    [12, 5],
    [13, 6],
    [16, 6],
    [20, 6],
  ])('game count of %i returns %i', (gameCount, expected) => {
    expect(getAdvanceClockStep(gameCount)).toEqual(expected);
  });
});
