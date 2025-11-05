import { areTeamStatsEqual, getGameAnimationIndexes, truncatePlayerName } from './utils';
import { describe, expect, it } from 'vitest';

describe('utils', () => {
  describe('truncatePlayerName', () => {
    it('should not truncate a name shorter than 21 characters', () => {
      const name = 'Ryan Nugent-Hopkinsss';
      expect(truncatePlayerName(name)).toEqual(name);
    });

    it('should truncate a single-part first name of name longer than 20 characters', () => {
      const name = 'Ryannn Nugent-Hopkinss';
      expect(truncatePlayerName(name)).toEqual('R. Nugent-Hopkinss');
    });

    it('should truncate a two-part first name of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre Parenteau';
      expect(truncatePlayerName(name)).toEqual('P.A. Parenteau');
    });

    it('should truncate a three-part first name of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre-Jean Parenteau';
      expect(truncatePlayerName(name)).toEqual('P.A.J. Parenteau');
    });

    it('should truncate only first name of name longer than 20 characters', () => {
      const name = 'Joel-Alexandre Eriksson Ek';
      expect(truncatePlayerName(name)).toEqual('J.A. Eriksson Ek');
    });

    it('should truncate a name longer than given maximum length', () => {
      const name = 'Ryan Nugent';
      expect(truncatePlayerName(name, 10)).toEqual('R. Nugent');
    });

    it('should return only last name if first name truncation is not short enough', () => {
      const name = 'Ryan Nugent-Hopkins';
      expect(truncatePlayerName(name, 15)).toEqual('Nugent-Hopkins');
    });

    it('should count narrow characters as half characters', () => {
      const name = 'Ili J-j'; // 6 narrow letters + 1 regular (space)
      expect(truncatePlayerName(name, 4)).toEqual(name);
    });

    it('should count wide characters as one-and-a-half characters', () => {
      const name = 'Mam Wow'; // 4 wide letters + 3 regular (a, o, space)
      expect(truncatePlayerName(name, 8)).toEqual('M. Wow');
    });
  });

  describe('getAnimationIndexes', () => {
    it('should return empty indexes for zero games', () => {
      expect(getGameAnimationIndexes(0)).toEqual([]);
    });

    it('should return correct indexes for more than zero games', () => {
      expect(getGameAnimationIndexes(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('areTeamStatsEqual', () => {
    const teams = {
      away: { abbreviation: 'TOR' },
      home: { abbreviation: 'MTL' },
    };

    it('should return true when both stats are equal', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(true);
    });

    it('should return false when away team records differ', () => {
      const currentStats = {
        records: {
          TOR: { wins: 11, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return false when home team records differ', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 9, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return false when both team records differ', () => {
      const currentStats = {
        records: {
          TOR: { wins: 11, losses: 5, ot: 2 },
          MTL: { wins: 9, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return true when both stats are undefined', () => {
      expect(areTeamStatsEqual({ currentStats: undefined, preGameStats: undefined, teams })).toBe(
        true,
      );
    });

    it('should return false when currentStats is undefined and preGameStats has records', () => {
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats: undefined, preGameStats, teams })).toBe(false);
    });

    it('should return false when preGameStats is undefined and currentStats has records', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats: undefined, teams })).toBe(false);
    });

    it('should return false when away team record is missing in currentStats', () => {
      const currentStats = {
        records: {
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return false when home team record is missing in currentStats', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return false when ot field differs', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 3 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return false when one record has ot and the other does not', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5, ot: 2 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5 },
          MTL: { wins: 8, losses: 7, ot: 1 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(false);
    });

    it('should return true when records match without ot field', () => {
      const currentStats = {
        records: {
          TOR: { wins: 10, losses: 5 },
          MTL: { wins: 8, losses: 7 },
        },
      };
      const preGameStats = {
        records: {
          TOR: { wins: 10, losses: 5 },
          MTL: { wins: 8, losses: 7 },
        },
      };

      expect(areTeamStatsEqual({ currentStats, preGameStats, teams })).toBe(true);
    });
  });
});
