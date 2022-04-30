import { assert } from 'chai';

import { delimiter as renderedDelimiter } from 'app/js/components/info-panel/stats/team-stats';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED,
} from 'app/js/events/constants';

import scoresAllRegularTime from '../../data/latest.json';
import scoresAllRegularTimePlayoffs from '../../data/latest-playoffs.json';
import Game from '../../../app/js/components/game';
import { expectedStat } from './test-utils';
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
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(GAME_DISPLAY_PRE_GAME, { status, teams }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams }, goals);
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(GAME_DISPLAY_IN_PROGRESS, { status, teams }, goals);
    });

    it('should not be shown after playback has finished for finished games', () => {
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(GAME_DISPLAY_POST_GAME_FINISHED, { status, teams }, goals);
    });

    it('should be shown after playback has finished for in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(GAME_DISPLAY_POST_GAME_IN_PROGRESS, { status, teams }, goals);
    });

    it("should show teams' division ranks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Div. rank';

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        statIndexes.divisionRank,
        {
          away: { value: '7' },
          home: { value: '3', className: '--highlight' },
          label,
        }
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        statIndexes.divisionRank,
        {
          away: { value: '2', className: '--highlight' },
          home: { value: '8' },
          label,
        }
      );
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
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
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
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
      const gameDisplay = GAME_DISPLAY_PRE_GAME;

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach(game => {
        assertTeamStats(gameDisplay, game, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 3, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 2, renderedDelimiter, 4], className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], statIndexes.record, {
        away: { value: [7, renderedDelimiter, 3] },
        home: { value: [7, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], statIndexes.record, {
        away: { value: [7, renderedDelimiter, 5], className: '--highlight' },
        home: { value: [5, renderedDelimiter, 9] },
        label,
      });
    });
  });

  describe('after-game team stats', () => {
    it('should not be shown before playback has started', () => {
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(GAME_DISPLAY_PRE_GAME, { status, teams }, goals);
    });

    it('should not be shown after playback has started for not started games', () => {
      const status = { state: GAME_STATE_NOT_STARTED };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(GAME_DISPLAY_IN_PROGRESS, { status, teams }, goals);
    });

    it('should not be shown after playback has started for finished games', () => {
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams }, goals);
    });

    it('should be shown after playback has finished for finished games', () => {
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreShown(GAME_DISPLAY_POST_GAME_FINISHED, { status, teams }, goals);
    });

    it('should not be shown after playback has finished for in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(GAME_DISPLAY_POST_GAME_IN_PROGRESS, { status, teams }, goals);
    });

    it("should show teams' division ranks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
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

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
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
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
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
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach(game => {
        assertTeamStats(gameDisplay, game, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.record, {
        away: { value: [9, renderedDelimiter, 4, renderedDelimiter, 1], className: '--highlight' },
        home: { value: [7, renderedDelimiter, 4, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 5, renderedDelimiter, 1] },
        home: { value: [8, renderedDelimiter, 2, renderedDelimiter, 4], className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 3], className: '--highlight' },
        home: { value: [7, renderedDelimiter, 4] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], statIndexes.record, {
        away: { value: [7, renderedDelimiter, 6], className: '--highlight' },
        home: { value: [6, renderedDelimiter, 9] },
        label,
      });
    });

    it("should show teams' streaks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
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
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
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

function assertPreGameStatsAreShown(gameDisplay, { status, teams }, goals) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.stats.stats--team-stats'
  );
}
function assertPreGameStatsAreNotShown(gameDisplay, { status, teams }, goals) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--team-stats'
  );
}
function assertAfterGameStatsAreShown(gameDisplay, { status, teams }, goals) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.stats.stats--team-stats.stats--after-game'
  );
}
function assertAfterGameStatsAreNotShown(gameDisplay, { status, teams }, goals) {
  assertStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--team-stats.stats--after-game'
  );
}
function assertStatsExistence(gameDisplay, { status, teams }, goals, assertFn, selector) {
  const stats = getTeamStats(Game(gameDisplay, { status, teams }, goals));
  assertFn(stats && stats.sel, selector);
}

function assertTeamStats(
  gameDisplay,
  { state = GAME_STATE_FINISHED, teams, goals, preGameStats, currentStats },
  statIndex,
  renderedRecords
) {
  const renderedStats = getTeamStats(
    Game(gameDisplay, { status: { state }, teams, preGameStats, currentStats }, goals)
  ).children[statIndex];
  const expected = expectedStat(renderedRecords);
  assert.deepEqual(renderedStats, expected);
}

function getTeamStats(vtree) {
  return getGameCard(vtree).children[1].children[3];
}