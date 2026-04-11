import { describe, expect, it } from 'vitest';

import { getSeasonGameCount } from './seasons';

describe('seasons', () => {
  describe('getSeasonGameCount', () => {
    it('should return the correct game count for known seasons', () => {
      expect(getSeasonGameCount(19941995)).toEqual(48);
      expect(getSeasonGameCount(20202021)).toEqual(56);
      expect(getSeasonGameCount(20252026)).toEqual(82);
    });

    it('should return the latest season count for unknown future season IDs', () => {
      expect(getSeasonGameCount(20402041)).toEqual(82);
    });
  });
});
