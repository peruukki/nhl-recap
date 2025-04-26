import { describe, expect, it } from 'vitest';

import { getTeamStatCount } from './stat-counts';

describe('getTeamStatCount', () => {
  describe('for non-playff game', () => {
    const isPlayoffGame = false;

    it('returns 0 with no stat keys', () => {
      expect(getTeamStatCount([], isPlayoffGame)).toBe(0);
    });
    it('returns 2 with records stat key', () => {
      expect(getTeamStatCount(['records'], isPlayoffGame)).toBe(2);
    });
    it('returns 7 with all stat keys and an extra key', () => {
      expect(getTeamStatCount(['records', 'standings', 'streaks', 'extra'], isPlayoffGame)).toBe(7);
    });
  });

  describe('for playff game', () => {
    const isPlayoffGame = true;

    it('returns 0 with no stat keys', () => {
      expect(getTeamStatCount([], isPlayoffGame)).toBe(0);
    });
    it('returns 4 with records and standings stat keys', () => {
      expect(getTeamStatCount(['records', 'standings'], isPlayoffGame)).toBe(4);
    });
    it('returns 5 with all stat keys and an extra key', () => {
      expect(getTeamStatCount(['records', 'standings', 'streaks', 'extra'], isPlayoffGame)).toBe(5);
    });
  });
});
