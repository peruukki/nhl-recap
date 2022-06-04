import { VNode } from '@cycle/dom';
import { assert } from 'chai';

import { delimiter as renderedDelimiter } from 'app/js/components/info-panel/stats/team-stats';
import { Game as GameT, GameDisplay, GameStatus, Goal } from 'app/js/types';

import scoresAllRegularTime from '../../data/latest.json';
import scoresAllRegularTimePlayoffs from '../../data/latest-playoffs.json';
import Game from '../../../app/js/components/game';
import { expectedStat, StatValue } from './test-utils';
import { getGameCard } from '../test-utils';

const inProgressGameProgress = {
  currentPeriod: 1,
  currentPeriodOrdinal: '1st',
  currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
};

const statIndexes = {
  divisionRank: 1,
  leagueRank: 2,
  pointPct: 3,
  record: 4,
  streak: 5,
  playoffSpotPts: 6,
};

describe('team stats', () => {
  describe('pre-game team stats', () => {
    it('should be shown when game display state is pre-game', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown('pre-game', { status, teams }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: 'LIVE' } as GameStatus;
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('playback', { status, teams }, goals);
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('playback', { status, teams }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('in-progress', { status, teams }, goals);
    });

    it('should not be shown after playback has finished for finished games', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown('post-game-finished', { status, teams }, goals);
    });

    it('should be shown after playback has finished for in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown('post-game-in-progress', { status, teams }, goals);
    });

    it("should show teams' division ranks, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Div. rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0] as unknown as GameT,
        statIndexes.divisionRank,
        {
          away: { value: '7' },
          home: { value: '3', className: '--highlight' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1] as unknown as GameT,
        statIndexes.divisionRank,
        {
          away: { value: '2', className: '--highlight' },
          home: { value: '8' },
          label,
        },
      );
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'NHL rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0] as unknown as GameT,
        statIndexes.leagueRank,
        {
          away: { value: '11' },
          home: { value: '8', className: '--highlight' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1] as unknown as GameT,
        statIndexes.leagueRank,
        {
          away: { value: '4', className: '--highlight' },
          home: { value: '26' },
          label,
        },
      );
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Point-%';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.pointPct,
        {
          away: { value: '.654' },
          home: { value: '.654' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.pointPct,
        {
          away: { value: '.654' },
          home: { value: '.692', className: '--highlight' },
          label,
        },
      );
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = 'pre-game';

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach((game) => {
        assertTeamStats(gameDisplay, game as unknown as GameT, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Record';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
          home: { value: [7, renderedDelimiter, 3, renderedDelimiter, 3] },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
          home: {
            value: [7, renderedDelimiter, 2, renderedDelimiter, 4],
            className: '--highlight',
          },
          label,
        },
      );
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = 'pre-game';
      const label = 'Record';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [7, renderedDelimiter, 3] },
          home: { value: [7, renderedDelimiter, 3] },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [7, renderedDelimiter, 5], className: '--highlight' },
          home: { value: [5, renderedDelimiter, 9] },
          label,
        },
      );
    });
  });

  describe('after-game team stats', () => {
    it('should not be shown before playback has started', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('pre-game', { status, teams }, goals);
    });

    it('should not be shown after playback has started for not started games', () => {
      const status: GameStatus = { state: 'PREVIEW' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('playback', { status, teams }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: 'LIVE' } as GameStatus;
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('playback', { status, teams }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('in-progress', { status, teams }, goals);
    });

    it('should not be shown after playback has started for finished games', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('playback', { status, teams }, goals);
    });

    it('should be shown after playback has finished for finished games', () => {
      const status: GameStatus = { state: 'FINAL' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreShown('post-game-finished', { status, teams }, goals);
    });

    it('should not be shown after playback has finished for in-progress games', () => {
      const status: GameStatus = {
        state: 'LIVE',
        progress: inProgressGameProgress,
      };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown('post-game-in-progress', { status, teams }, goals);
    });

    it("should show teams' division ranks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Div. rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.divisionRank,
        {
          away: { value: '7' },
          home: { value: '3', className: '--highlight' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.divisionRank,
        {
          away: { value: '2', className: '--highlight' },
          home: { value: '8' },
          label,
        },
      );
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'NHL rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.leagueRank,
        {
          away: { value: '11' },
          home: { value: '8', className: '--highlight' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.leagueRank,
        {
          away: { value: '4', className: '--highlight' },
          home: { value: '26' },
          label,
        },
      );
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Point-%';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.pointPct,
        {
          away: { value: '.679', className: '--highlight' },
          home: { value: '.607' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.pointPct,
        {
          away: { value: '.607' },
          home: { value: '.714', className: '--highlight' },
          label,
        },
      );
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = 'post-game-finished';

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach((game) => {
        assertTeamStats(gameDisplay, game as unknown as GameT, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Record';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.record,
        {
          away: {
            value: [9, renderedDelimiter, 4, renderedDelimiter, 1],
            className: '--highlight',
          },
          home: { value: [7, renderedDelimiter, 4, renderedDelimiter, 3] },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [8, renderedDelimiter, 5, renderedDelimiter, 1] },
          home: {
            value: [8, renderedDelimiter, 2, renderedDelimiter, 4],
            className: '--highlight',
          },
          label,
        },
      );
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Record';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [8, renderedDelimiter, 3], className: '--highlight' },
          home: { value: [7, renderedDelimiter, 4] },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1] as unknown as GameT,
        statIndexes.record,
        {
          away: { value: [7, renderedDelimiter, 6], className: '--highlight' },
          home: { value: [6, renderedDelimiter, 9] },
          label,
        },
      );
    });

    it("should show teams' streaks, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'Streak';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.streak,
        {
          away: { value: '2 W', className: '--highlight' },
          home: { value: '1 L' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.streak,
        {
          away: { value: '2 L' },
          home: { value: '2 W', className: '--highlight' },
          label,
        },
      );
    });

    it("should show teams' playoff spot point differences, highlighting the better one", () => {
      const gameDisplay = 'post-game-finished';
      const label = 'PO spot pts';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[0] as unknown as GameT,
        statIndexes.playoffSpotPts,
        {
          away: { value: '+4' },
          home: { value: '+4' },
          label,
        },
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTime.games[1] as unknown as GameT,
        statIndexes.playoffSpotPts,
        {
          away: { value: '+2', className: '--highlight' },
          home: { value: '-2' },
          label,
        },
      );
    });
  });
});

function assertPreGameStatsAreShown(
  gameDisplay: GameDisplay,
  { status, teams }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.stats.stats--team-stats',
  );
}
function assertPreGameStatsAreNotShown(
  gameDisplay: GameDisplay,
  { status, teams }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--team-stats',
  );
}
function assertAfterGameStatsAreShown(
  gameDisplay: GameDisplay,
  { status, teams }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.stats.stats--team-stats.stats--after-game',
  );
}
function assertAfterGameStatsAreNotShown(
  gameDisplay: GameDisplay,
  { status, teams }: Partial<GameT>,
  goals: Goal[],
) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--team-stats.stats--after-game',
  );
}
function assertStatsExistence(
  gameDisplay: GameDisplay,
  { status, teams }: Partial<GameT>,
  goals: Goal[],
  assertFn: (actual: string | undefined, expected: string) => void,
  selector: string,
) {
  const stats = getTeamStats(Game(gameDisplay, { status, teams } as GameT, goals, 0));
  assertFn(stats?.sel, selector);
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
  assert.deepEqual(renderedStats, expected);
}

function getTeamStats(vtree: VNode) {
  return (getGameCard(vtree)?.children?.[1] as VNode).children?.[3] as VNode | undefined;
}
