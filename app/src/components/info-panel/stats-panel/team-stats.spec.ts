import { VNode } from '@cycle/dom';
import { describe, expect, it } from 'vitest';

import { scoresAllRegularTime, scoresAllRegularTimePlayoffs } from '../../../test/data';
import type { Game as GameT, GameDisplay, GameStatus, Goal } from '../../../types';
import Game from '../../game';
import { expectedStat, getStatsPanel, StatValue } from '../test-utils';
import { delimiter as renderedDelimiter } from './team-stats';

const inProgressGameProgress = {
  currentPeriod: 1,
  currentPeriodOrdinal: '1st',
  currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
};

const statIndexes = {
  divisionRank: 2,
  conferenceRank: 3,
  leagueRank: 4,
  pointPct: 5,
  recordOrSeasonPts: 6,
  playoffSpotPts: 7,
  streak: 8,
};

describe('team stats', () => {
  describe('pre-game team stats', () => {
    it('should be shown when game display state is pre-game', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown('pre-game', { status, teams, preGameStats }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: 'LIVE' } as GameStatus;
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('playback', { status, teams, preGameStats }, goals);
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('playback', { status, teams, preGameStats }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('in-progress', { status, teams, preGameStats }, goals);
    });

    it('should not be shown after playback has finished for finished games', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals, preGameStats, currentStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(
        'post-game-finished',
        { status, teams, preGameStats, currentStats },
        goals,
      );
    });

    it('should be shown after playback has finished for finished games whose current stats have not be updated', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(
        'post-game-finished',
        { status, teams, preGameStats, currentStats: preGameStats },
        goals,
      );
    });

    it('should be shown after playback has finished for in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown('post-game-in-progress', { status, teams, preGameStats }, goals);
    });

    it("should show teams' division ranks, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Div. rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        statIndexes.divisionRank,
        {
          away: { value: '7' },
          home: { value: '3', className: '--highlight' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        statIndexes.divisionRank,
        {
          away: { value: '2', className: '--highlight' },
          home: { value: '8' },
          label,
        },
      );
    });

    it("should show teams' conference ranks, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Conf. rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        statIndexes.conferenceRank,
        {
          away: { value: '8' },
          home: { value: '5', className: '--highlight' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        statIndexes.conferenceRank,
        {
          away: { value: '3', className: '--highlight' },
          home: { value: '14' },
          label,
        },
      );
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'NHL rank';

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], statIndexes.leagueRank, {
        away: { value: '11' },
        home: { value: '8', className: '--highlight' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], statIndexes.leagueRank, {
        away: { value: '4', className: '--highlight' },
        home: { value: '26' },
        label,
      });
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Point-%';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.654' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.692', className: '--highlight' },
        label,
      });
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = 'pre-game';

      expect(scoresAllRegularTimePlayoffs.games.length).toBe(3);
      scoresAllRegularTimePlayoffs.games.forEach((game) => {
        assertTeamStats(gameDisplay, game, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' records in regular season games, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.recordOrSeasonPts, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 3, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.recordOrSeasonPts, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: {
          value: [7, renderedDelimiter, 2, renderedDelimiter, 4],
          className: '--highlight',
        },
        label,
      });
    });

    it("should show teams' regular season points in playoff games, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Season pts';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        statIndexes.recordOrSeasonPts,
        {
          away: { value: '99', className: '--highlight' },
          home: { value: '91' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        statIndexes.recordOrSeasonPts,
        {
          away: { value: '105' },
          home: { value: '105' },
          label,
        },
      );
    });
  });

  describe('after-game team stats', () => {
    it('should not be shown before playback has started', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('pre-game', { status, teams, currentStats }, goals);
    });

    it('should not be shown after playback has started for not started games', () => {
      const status: GameStatus = { state: 'PREVIEW' };
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('playback', { status, teams, currentStats }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: 'LIVE' } as GameStatus;
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('playback', { status, teams, currentStats }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('in-progress', { status, teams, currentStats }, goals);
    });

    it('should not be shown after playback has started for finished games', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('playback', { status, teams, currentStats }, goals);
    });

    it('should be shown after playback has finished for finished games', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreShown('post-game-finished', { status, teams, currentStats }, goals);
    });

    it('should not be shown after playback has finished for in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals, currentStats } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(
        'post-game-in-progress',
        { status, teams, currentStats },
        goals,
      );
    });

    it("should show teams' division ranks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Div. rank';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.divisionRank, {
        away: { value: '7' },
        home: { value: '3', className: '--highlight' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.divisionRank, {
        away: { value: '2', className: '--highlight' },
        home: { value: '8' },
        label,
      });
    });

    it("should show teams' conference ranks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Conf. rank';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.conferenceRank, {
        away: { value: '9' },
        home: { value: '5', className: '--highlight' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.conferenceRank, {
        away: { value: '3', className: '--highlight' },
        home: { value: '14' },
        label,
      });
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'NHL rank';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.leagueRank, {
        away: { value: '11' },
        home: { value: '8', className: '--highlight' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.leagueRank, {
        away: { value: '4', className: '--highlight' },
        home: { value: '26' },
        label,
      });
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Point-%';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.pointPct, {
        away: { value: '.679', className: '--highlight' },
        home: { value: '.607' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.pointPct, {
        away: { value: '.607' },
        home: { value: '.714', className: '--highlight' },
        label,
      });
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = 'post-game-finished';

      expect(scoresAllRegularTimePlayoffs.games.length).toBe(3);
      scoresAllRegularTimePlayoffs.games.forEach((game) => {
        assertTeamStats(gameDisplay, game, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' records in regular season games, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.recordOrSeasonPts, {
        away: {
          value: [9, renderedDelimiter, 4, renderedDelimiter, 1],
          className: '--highlight',
        },
        home: { value: [7, renderedDelimiter, 4, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.recordOrSeasonPts, {
        away: { value: [8, renderedDelimiter, 5, renderedDelimiter, 1] },
        home: {
          value: [8, renderedDelimiter, 2, renderedDelimiter, 4],
          className: '--highlight',
        },
        label,
      });
    });

    it("should show teams' regular season points in playoff games, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Season pts';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        statIndexes.recordOrSeasonPts,
        {
          away: { value: '99', className: '--highlight' },
          home: { value: '91' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        statIndexes.recordOrSeasonPts,
        {
          away: { value: '105' },
          home: { value: '105' },
          label,
        },
      );
    });

    it("should show teams' streaks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Streak';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.streak, {
        away: { value: '2 W', className: '--highlight' },
        home: { value: '1 L' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.streak, {
        away: { value: '2 L' },
        home: { value: '2 W', className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff spot point differences, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'PO spot pts';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.playoffSpotPts, {
        away: { value: '+4' },
        home: { value: '+4' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.playoffSpotPts, {
        away: { value: '+2', className: '--highlight' },
        home: { value: '-2' },
        label,
      });
    });
  });
});

function assertPreGameStatsAreShown(
  gameDisplay: GameDisplay,
  { status, teams, preGameStats, currentStats }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(
    gameDisplay,
    { status, teams, preGameStats, currentStats },
    goals,
    (vtree?: VNode) => {
      expect(vtree?.sel).toEqual('div.stats');
      expect(getTeamStatsSubheading(vtree)).toEqual('before game');
    },
  );
}
function assertPreGameStatsAreNotShown(
  gameDisplay: GameDisplay,
  { status, teams, preGameStats }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(gameDisplay, { status, teams, preGameStats }, goals, (vtree?: VNode) =>
    expect(vtree?.sel).not.toEqual('div.stats'),
  );
}
function assertAfterGameStatsAreShown(
  gameDisplay: GameDisplay,
  { status, teams, currentStats }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(gameDisplay, { status, teams, currentStats }, goals, (vtree?: VNode) => {
    expect(vtree?.sel).toEqual('div.stats');
    expect(getTeamStatsSubheading(vtree)).toEqual('after game');
  });
}
function assertAfterGameStatsAreNotShown(
  gameDisplay: GameDisplay,
  { status, teams, currentStats }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(gameDisplay, { status, teams, currentStats }, goals, (vtree?: VNode) =>
    expect(vtree?.sel).not.toEqual('div.stats'),
  );
}
function assertStatsExistence(
  gameDisplay: GameDisplay,
  { status, teams, preGameStats, currentStats }: Partial<GameT>,
  goals: Goal[],
  assertFn: (actual?: VNode) => void,
) {
  const stats = getTeamStats(
    Game(gameDisplay, { status, teams, preGameStats, currentStats } as GameT, goals, 0),
  );
  assertFn(stats);
}

function assertTeamStats(
  gameDisplay: GameDisplay,
  { state = 'FINAL', teams, goals, preGameStats, currentStats }: GameT & Partial<GameStatus>,
  statIndex: number,
  renderedRecords: {
    away: StatValue;
    home: StatValue;
    label: string;
  },
) {
  const renderedStats = getTeamStats(
    Game(gameDisplay, { status: { state }, teams, preGameStats, currentStats } as GameT, goals, 0),
  )?.children?.[statIndex];
  const expected = expectedStat(renderedRecords);
  expect(renderedStats).toEqual(expected);
}

function getTeamStats(vtree: VNode) {
  return getStatsPanel(vtree)?.children?.[1] as VNode | undefined;
}

function getTeamStatsSubheading(teamStatsVTree?: VNode): string | undefined {
  return (teamStatsVTree?.children?.[1] as VNode).text;
}
