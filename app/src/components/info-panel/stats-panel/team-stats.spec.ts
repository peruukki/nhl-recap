import { span, type VNode } from '@cycle/dom';
import { describe, expect, it } from 'vitest';

import { scoresAllRegularTime, scoresAllRegularTimePlayoffs } from '../../../test/data';
import type { GameDisplay, GameStatus, Game as GameT, Goal } from '../../../types';
import Game from '../../game';
import Icon from '../../icon';
import { expectedStat, getStatsPanel, type StatValue } from '../test-utils';
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
        away: {
          value: [Icon('cold1'), span('4 L')],
          className: '--streak-loss-1',
        },
        home: { value: '2 W', className: '--highlight' },
        label,
      });
    });

    it("should show teams' streaks with CSS classes for emojis", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Streak';

      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            streaks: {
              STL: { count: 3, type: 'WINS' },
              BOS: { count: 6, type: 'WINS' },
            },
          },
        } as GameT,
        statIndexes.streak,
        {
          away: {
            value: [Icon('hot1'), span('3 W')],
            className: '--streak-win-1',
          },
          home: {
            value: [span('6 W'), Icon('hot2')],
            className: '--highlight.stat__value--streak-win-2',
          },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            streaks: {
              STL: { count: 10, type: 'LOSSES' },
              BOS: { count: 3, type: 'LOSSES' },
            },
          },
        } as GameT,
        statIndexes.streak,
        {
          away: {
            value: [Icon('cold3'), span('10 L')],
            className: '--streak-loss-3',
          },
          home: {
            value: [span('3 L'), Icon('cold1')],
            className: '--highlight.stat__value--streak-loss-1',
          },
          label,
        },
      );
    });

    it("should show teams' playoff spot point differences, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'PO spot pts';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.playoffSpotPts, {
        away: {
          value: [Icon('playoffSpotSafe'), span('+4')],
          className: '--playoff-spot-safe',
        },
        home: {
          value: [span('+4'), Icon('playoffSpotSafe')],
          className: '--playoff-spot-safe',
        },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.playoffSpotPts, {
        away: {
          value: [Icon('playoffSpotIn'), span('+2')],
          className: '--highlight.stat__value--playoff-spot-in',
        },
        home: {
          value: [span('-2'), Icon('playoffSpotClose')],
          className: '--playoff-spot-close',
        },
        label,
      });
    });

    it("should show teams' playoff spot icons for all categories", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'PO spot pts';

      // Far: -5 to -3
      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            standings: {
              STL: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.STL,
                pointsFromPlayoffSpot: '-4',
              },
              BOS: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.BOS,
                pointsFromPlayoffSpot: '-3',
              },
            },
          },
        } as GameT,
        statIndexes.playoffSpotPts,
        {
          away: {
            value: [Icon('playoffSpotFar'), span('-4')],
            className: '--playoff-spot-far',
          },
          home: {
            value: [span('-3'), Icon('playoffSpotFar')],
            className: '--highlight.stat__value--playoff-spot-far',
          },
          label,
        },
      );

      // Close: -2 to -1
      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            standings: {
              STL: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.STL,
                pointsFromPlayoffSpot: '-2',
              },
              BOS: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.BOS,
                pointsFromPlayoffSpot: '-1',
              },
            },
          },
        } as GameT,
        statIndexes.playoffSpotPts,
        {
          away: {
            value: [Icon('playoffSpotClose'), span('-2')],
            className: '--playoff-spot-close',
          },
          home: {
            value: [span('-1'), Icon('playoffSpotClose')],
            className: '--highlight.stat__value--playoff-spot-close',
          },
          label,
        },
      );

      // In: 0 to +2
      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            standings: {
              STL: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.STL,
                pointsFromPlayoffSpot: '0',
              },
              BOS: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.BOS,
                pointsFromPlayoffSpot: '+2',
              },
            },
          },
        } as GameT,
        statIndexes.playoffSpotPts,
        {
          away: {
            value: [Icon('playoffSpotIn'), span('0')],
            className: '--playoff-spot-in',
          },
          home: {
            value: [span('+2'), Icon('playoffSpotIn')],
            className: '--highlight.stat__value--playoff-spot-in',
          },
          label,
        },
      );

      // Safe: +3 to +5
      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            standings: {
              STL: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.STL,
                pointsFromPlayoffSpot: '+3',
              },
              BOS: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.BOS,
                pointsFromPlayoffSpot: '+5',
              },
            },
          },
        } as GameT,
        statIndexes.playoffSpotPts,
        {
          away: {
            value: [Icon('playoffSpotSafe'), span('+3')],
            className: '--playoff-spot-safe',
          },
          home: {
            value: [span('+5'), Icon('playoffSpotSafe')],
            className: '--highlight.stat__value--playoff-spot-safe',
          },
          label,
        },
      );

      // No icon: outside -5..+5
      assertTeamStats(
        gameDisplay,
        {
          ...scoresAllRegularTime.games[0],
          currentStats: {
            ...scoresAllRegularTime.games[0].currentStats,
            standings: {
              STL: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.STL,
                pointsFromPlayoffSpot: '-8',
              },
              BOS: {
                ...scoresAllRegularTime.games[0].currentStats!.standings!.BOS,
                pointsFromPlayoffSpot: '+10',
              },
            },
          },
        } as GameT,
        statIndexes.playoffSpotPts,
        {
          away: { value: '-8' },
          home: { value: '+10', className: '--highlight' },
          label,
        },
      );
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
  const statsPanel = getStatsPanel(vtree);
  const statsPanelContainer = statsPanel?.children?.[0] as VNode | undefined;
  return statsPanelContainer?.children?.[1] as VNode | undefined;
}

function getTeamStatsSubheading(teamStatsVTree?: VNode): string | undefined {
  return (teamStatsVTree?.children?.[1] as VNode).text;
}
