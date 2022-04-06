import { div, span } from '@cycle/dom';
import _ from 'lodash';
import { assert } from 'chai';

import renderGame, {
  delimiter as renderedDelimiter,
  renderLatestGoalTime,
  renderLatestGoalScorer,
  renderLatestGoalAssists,
} from '../../app/js/components/game';
import {
  ERROR_SCORE_AND_GOAL_COUNT_MISMATCH,
  ERROR_MISSING_ALL_GOALS,
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED,
  GAME_STATE_POSTPONED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
} from '../../app/js/events/constants';
import { renderTeamLogo } from '../../app/js/utils/logos';
import scoresAllRegularTime from '../data/latest.json';
import scoresMultipleOvertime from '../data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from '../data/latest-ot-2-so.json';
import scoresAllRegularTimePlayoffs from '../data/latest-playoffs.json';
import scoresRegularTimeAndOvertimePlayoffs from '../data/latest-playoffs-ot.json';

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

describe('game', () => {
  describe('goal counts', () => {
    it('should be hidden in the pre-game info', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts(
        GAME_DISPLAY_PRE_GAME,
        { teams },
        [],
        0,
        0,
        '.team-panel__team-score--hidden'
      );
    });

    it('should show zero goals before the playback has reached the first goal scoring time', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts(GAME_DISPLAY_PLAYBACK, { teams }, [], 0, 0);
    });

    it('should show current goal counts when goals have been scored', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts(GAME_DISPLAY_PLAYBACK, { teams }, _.take(goals, 2), 1, 1);
    });

    it('should show all the goals of the game when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts(GAME_DISPLAY_POST_GAME_FINISHED, { teams }, goals, 2, 3);
    });

    it('should show goals scored in overtime', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertGoalCounts(GAME_DISPLAY_PLAYBACK, { teams }, goals, 1, 0);
    });
  });

  describe('goal delimiter', () => {
    it('should show "at" in the pre-game info', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(GAME_DISPLAY_PRE_GAME, { teams }, goals, 'at', '');
    });

    it('should not be shown during the playback of a started game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(GAME_DISPLAY_PLAYBACK, { teams }, goals, '');
    });

    it('should show "OT" when the playback reaches the scoring time of an overtime goal', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertDelimiter(
        GAME_DISPLAY_PLAYBACK,
        { teams },
        goals,
        span('.team-panel__delimiter-period', 'OT')
      );
    });

    it('should not be shown when the playback reaches shootout but there is no shootout goal', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(GAME_DISPLAY_PLAYBACK, { teams }, goals, '');
    });

    it('should show "SO" when the playback reaches shootout and the game has a shootout goal', () => {
      const { teams, goals } = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(
        GAME_DISPLAY_PLAYBACK,
        { teams },
        goals,
        span('.team-panel__delimiter-period', 'SO')
      );
    });

    it('should show the period of the last goal when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(
        GAME_DISPLAY_POST_GAME_FINISHED,
        { teams },
        goals,
        span('.team-panel__delimiter-period', 'SO')
      );
    });
  });

  describe('latest goal panel', () => {
    it('should show nothing before the playback has reached the first goal scoring time', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_PLAYBACK, teams, [], null);
    });

    it('should show the latest goal when the playback reaches a goal scoring time', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_PLAYBACK, teams, _.take(goals, 1), _.first(goals));
    });

    it('should show the last goal of the game when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_POST_GAME_FINISHED, teams, goals, _.last(goals));
    });

    it('should show the last goal of the game after playback has reached current progress in in-progress games', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_IN_PROGRESS, teams, goals, _.last(goals));
    });

    it('should show the last goal of an in-progress game when playback has finished', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_POST_GAME_IN_PROGRESS, teams, goals, _.last(goals));
    });

    it('should show goals scored in overtime', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertLatestGoal(GAME_DISPLAY_PLAYBACK, teams, goals, _.last(goals));
    });
  });

  describe('pre-game stats', () => {
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

      assertGameStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        statIndexes.divisionRank,
        {
          away: { value: '7' },
          home: { value: '3', className: '--highlight' },
          label,
        }
      );

      assertGameStats(
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

      assertGameStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], statIndexes.leagueRank, {
        away: { value: '11' },
        home: { value: '8', className: '--highlight' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], statIndexes.leagueRank, {
        away: { value: '4', className: '--highlight' },
        home: { value: '26' },
        label,
      });
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Point-%';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.654' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.692', className: '--highlight' },
        label,
      });
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach(game => {
        assertGameStats(gameDisplay, game, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Record';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 3, renderedDelimiter, 3] },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 2, renderedDelimiter, 4], className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Record';

      assertGameStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], statIndexes.record, {
        away: { value: [7, renderedDelimiter, 3] },
        home: { value: [7, renderedDelimiter, 3] },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], statIndexes.record, {
        away: { value: [7, renderedDelimiter, 5], className: '--highlight' },
        home: { value: [5, renderedDelimiter, 9] },
        label,
      });
    });
  });

  describe('after-game stats', () => {
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

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.divisionRank, {
        away: { value: '7' },
        home: { value: '3', className: '--highlight' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.divisionRank, {
        away: { value: '2', className: '--highlight' },
        home: { value: '8' },
        label,
      });
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'NHL rank';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.leagueRank, {
        away: { value: '11' },
        home: { value: '8', className: '--highlight' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.leagueRank, {
        away: { value: '4', className: '--highlight' },
        home: { value: '26' },
        label,
      });
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Point-%';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.pointPct, {
        away: { value: '.679', className: '--highlight' },
        home: { value: '.607' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.pointPct, {
        away: { value: '.607' },
        home: { value: '.714', className: '--highlight' },
        label,
      });
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach(game => {
        assertGameStats(gameDisplay, game, statIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Record';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.record, {
        away: { value: [9, renderedDelimiter, 4, renderedDelimiter, 1], className: '--highlight' },
        home: { value: [7, renderedDelimiter, 4, renderedDelimiter, 3] },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 5, renderedDelimiter, 1] },
        home: { value: [8, renderedDelimiter, 2, renderedDelimiter, 4], className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Record';

      assertGameStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], statIndexes.record, {
        away: { value: [8, renderedDelimiter, 3], className: '--highlight' },
        home: { value: [7, renderedDelimiter, 4] },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], statIndexes.record, {
        away: { value: [7, renderedDelimiter, 6], className: '--highlight' },
        home: { value: [6, renderedDelimiter, 9] },
        label,
      });
    });

    it("should show teams' streaks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Streak';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.streak, {
        away: { value: '2 W', className: '--highlight' },
        home: { value: '1 L' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.streak, {
        away: { value: '2 L' },
        home: { value: '2 W', className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff spot point differences, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'PO spot pts';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.playoffSpotPts, {
        away: { value: '+4' },
        home: { value: '+4' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.playoffSpotPts, {
        away: { value: '+2', className: '--highlight' },
        home: { value: '-2' },
        label,
      });
    });
  });

  describe('game description', () => {
    it(`should show "Finished" description for game in ${GAME_STATE_FINISHED} state`, () => {
      const { teams, goals, status } = scoresAllRegularTime.games[1];
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'Finished');
    });

    it(`should show game without progress information in ${GAME_STATE_IN_PROGRESS} state as in progress`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: GAME_STATE_IN_PROGRESS };
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'In progress');
    });

    it(`should show time remaining progress for game in ${GAME_STATE_IN_PROGRESS} state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: GAME_STATE_IN_PROGRESS,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
        },
      };
      assertGameDescription(
        GAME_DISPLAY_PRE_GAME,
        { status, teams },
        goals,
        expectedCurrentProgressDescription(
          `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`
        )
      );
    });

    it(`should show time remaining progress for game in ${GAME_STATE_IN_PROGRESS} state after playback has reached current progress`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: GAME_STATE_IN_PROGRESS,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
        },
      };
      assertGameDescription(
        GAME_DISPLAY_IN_PROGRESS,
        { status, teams },
        goals,
        expectedCurrentProgressDescription(
          `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`
        )
      );
    });

    it(`should show end of period progress for game in ${GAME_STATE_IN_PROGRESS} state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: GAME_STATE_IN_PROGRESS,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: 'END', min: 0, sec: 0 },
        },
      };
      assertGameDescription(
        GAME_DISPLAY_PRE_GAME,
        { status, teams },
        goals,
        expectedCurrentProgressDescription(`End of ${status.progress.currentPeriodOrdinal}`)
      );
    });

    it(`should not show remaining time for SO game in ${GAME_STATE_IN_PROGRESS} state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: GAME_STATE_IN_PROGRESS,
        progress: {
          currentPeriod: 5,
          currentPeriodOrdinal: 'SO',
          currentPeriodTimeRemaining: { pretty: '00:00', min: 0, sec: 0 },
        },
      };
      assertGameDescription(
        GAME_DISPLAY_PRE_GAME,
        { status, teams },
        goals,
        expectedCurrentProgressDescription('In shootout')
      );
    });

    it(`should show game in ${GAME_STATE_NOT_STARTED} state and start time in the past as starting soon`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: GAME_STATE_NOT_STARTED };
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'Starts soon');
    });

    it(`should show game in ${GAME_STATE_NOT_STARTED} state and start time in the future as starting in some time`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: GAME_STATE_NOT_STARTED };

      const time = new Date();
      time.setHours(time.getHours() + 3);
      time.setMinutes(time.getMinutes() + 1);
      const startTime = time.toISOString();

      assertGameDescription(
        GAME_DISPLAY_PRE_GAME,
        { status, startTime, teams },
        goals,
        'Starts in 3 hours'
      );
    });

    it(`should show game in ${GAME_STATE_POSTPONED} state as postponed`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: GAME_STATE_POSTPONED };
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'Postponed');
    });
  });

  describe('playoff series wins panel', () => {
    it('should not exist if there is no playoff series information', () => {
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPlayoffSeriesWins(
        GAME_DISPLAY_PLAYBACK,
        teams,
        goals,
        preGameStats,
        GAME_STATE_FINISHED,
        undefined,
        null
      );
    });

    it('should show "<Round> - Game 1" for first game of the series', () => {
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[2];
      assertPlayoffSeriesWins(
        GAME_DISPLAY_PLAYBACK,
        teams,
        goals,
        preGameStats,
        GAME_STATE_FINISHED,
        undefined,
        '1st round - Game 1'
      );
    });

    it('should show the series tied when teams have the same amount of wins', () => {
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[0];
      assertPlayoffSeriesTied(
        GAME_DISPLAY_PLAYBACK,
        teams,
        goals,
        preGameStats,
        GAME_STATE_FINISHED,
        1
      );
    });

    it('should show the team that has more wins leading the series', () => {
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
      assertPlayoffSeriesLead(
        GAME_DISPLAY_PLAYBACK,
        teams,
        goals,
        preGameStats,
        GAME_STATE_FINISHED,
        'NYR',
        2,
        1
      );
    });

    it('should show the team that has reached 3 wins winning the series in round 0', () => {
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
      preGameStats.playoffSeries.round = 0;
      preGameStats.playoffSeries.wins.NYR = 3;
      assertPlayoffSeriesLead(
        GAME_DISPLAY_PLAYBACK,
        teams,
        goals,
        preGameStats,
        GAME_STATE_FINISHED,
        'NYR',
        3,
        1,
        undefined,
        'wins'
      );
    });

    it('should show the team that has reached 4 wins winning the series in round 1', () => {
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
      preGameStats.playoffSeries.round = 1;
      preGameStats.playoffSeries.wins.NYR = 4;
      assertPlayoffSeriesLead(
        GAME_DISPLAY_PLAYBACK,
        teams,
        goals,
        preGameStats,
        GAME_STATE_FINISHED,
        'NYR',
        4,
        1,
        undefined,
        'wins'
      );
    });

    it("should not increase the winning teams' win counts until all games have ended", () => {
      const gameDisplay = GAME_DISPLAY_PLAYBACK;
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesTied(
        gameDisplay,
        game1.teams,
        game1.goals,
        game1.preGameStats,
        GAME_STATE_FINISHED,
        1
      );

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesLead(
        gameDisplay,
        game2.teams,
        game2.goals,
        game2.preGameStats,
        GAME_STATE_FINISHED,
        'ANA',
        2,
        1
      );
    });

    it('should not increase win counts for "not started" or "in progress" games after all finished games have ended', () => {
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesTied(
        GAME_DISPLAY_IN_PROGRESS,
        game1.teams,
        game1.goals,
        game1.preGameStats,
        GAME_STATE_IN_PROGRESS,
        1
      );

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesLead(
        GAME_DISPLAY_PRE_GAME,
        game2.teams,
        game2.goals,
        game2.preGameStats,
        GAME_STATE_NOT_STARTED,
        'ANA',
        2,
        1
      );
    });

    it("should increase the winning teams' win counts after all games have ended", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesLead(
        gameDisplay,
        game1.teams,
        game1.goals,
        game1.preGameStats,
        GAME_STATE_FINISHED,
        'STL',
        2,
        1,
        '.fade-in'
      );

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesTied(
        gameDisplay,
        game2.teams,
        game2.goals,
        game2.preGameStats,
        GAME_STATE_FINISHED,
        2,
        '.fade-in'
      );
    });
  });

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
        ['Missing 1 goal from data']
      );
    });

    it("should show appropriate error when too many goals' data exists", () => {
      assertErrors(
        [{ error: ERROR_SCORE_AND_GOAL_COUNT_MISMATCH, details: { goalCount: 2, scoreCount: 1 } }],
        ['1 too many goals in data']
      );
    });
  });
});

function assertGoalCounts(
  gameDisplay,
  { state = GAME_STATE_FINISHED, teams },
  currentGoals,
  awayGoals,
  homeGoals,
  visibilityClass = '.fade-in'
) {
  const teamPanels = getTeamPanels(
    renderGame(gameDisplay, { status: { state }, teams }, currentGoals)
  );
  const expected = expectedTeamPanels(teams, awayGoals, homeGoals, visibilityClass);
  assert.deepEqual(teamPanels, expected);
}

function assertDelimiter(
  gameDisplay,
  { state = GAME_STATE_FINISHED, teams },
  currentGoals,
  delimiter,
  visibilityClass = '.fade-in'
) {
  const delimiterNode = getDelimiter(
    renderGame(gameDisplay, { status: { state }, teams }, currentGoals)
  );
  const expected = expectedDelimiter(delimiter, visibilityClass);
  assert.deepEqual(delimiterNode, expected);
}

function assertLatestGoal(gameDisplay, teams, goals, expectedLatestGoal) {
  const latestGoalPanel = getLatestGoalPanel(
    renderGame(gameDisplay, { status: { state: GAME_STATE_FINISHED }, teams }, goals)
  );
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

function assertPreGameStatsAreShown(gameDisplay, { status, teams }, goals) {
  assertGameStatsExistence(gameDisplay, { status, teams }, goals, assert.deepEqual, 'div.stats');
}
function assertPreGameStatsAreNotShown(gameDisplay, { status, teams }, goals) {
  assertGameStatsExistence(gameDisplay, { status, teams }, goals, assert.notDeepEqual, 'div.stats');
}
function assertAfterGameStatsAreShown(gameDisplay, { status, teams }, goals) {
  assertGameStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.stats.stats--after-game'
  );
}
function assertAfterGameStatsAreNotShown(gameDisplay, { status, teams }, goals) {
  assertGameStatsExistence(
    gameDisplay,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--after-game'
  );
}
function assertGameStatsExistence(gameDisplay, { status, teams }, goals, assertFn, selector) {
  const gameStats = getGameStats(renderGame(gameDisplay, { status, teams }, goals));
  assertFn(gameStats && gameStats.sel, selector);
}

function assertGameStats(
  gameDisplay,
  { state = GAME_STATE_FINISHED, teams, goals, preGameStats, currentStats },
  statIndex,
  renderedRecords
) {
  const renderedStats = getGameStats(
    renderGame(gameDisplay, { status: { state }, teams, preGameStats, currentStats }, goals)
  ).children[statIndex];
  const expected = expectedStat(renderedRecords);
  assert.deepEqual(renderedStats, expected);
}

function assertGameDescription(gameDisplay, { status, startTime, teams }, goals, description) {
  const gameDescription = getGameDescription(
    renderGame(gameDisplay, { status, startTime, teams }, goals)
  );
  const expected = expectedGameDescription(description);
  assert.deepEqual(gameDescription, expected);
}

function assertPlayoffSeriesLead(
  gameDisplay,
  teams,
  goals,
  preGameStats,
  state,
  leadingTeam,
  leadingWins,
  trailingWins,
  animationClass,
  leadingText = 'leads'
) {
  return assertPlayoffSeriesWins(gameDisplay, teams, goals, preGameStats, state, animationClass, [
    span('.series-wins__leading-team', leadingTeam),
    ` ${leadingText} `,
    span('.series-wins__leading-count', String(leadingWins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__trailing-count', String(trailingWins)),
  ]);
}

function assertPlayoffSeriesTied(
  gameDisplay,
  teams,
  goals,
  preGameStats,
  state,
  wins,
  animationClass
) {
  return assertPlayoffSeriesWins(gameDisplay, teams, goals, preGameStats, state, animationClass, [
    'Series ',
    span('.series-wins__tied', 'tied'),
    ' ',
    span('.series-wins__tied-count', String(wins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__tied-count', String(wins)),
  ]);
}

function assertPlayoffSeriesWins(
  gameDisplay,
  teams,
  goals,
  preGameStats,
  state,
  animationClass,
  expectedSeriesWinsVtree
) {
  const playoffSeriesWinsPanel = getPlayoffSeriesWinsPanel(
    renderGame(gameDisplay, { status: { state }, teams, preGameStats }, goals)
  );
  const expected = expectedPlayoffSeriesWinsPanel(expectedSeriesWinsVtree, animationClass);
  assert.deepEqual(playoffSeriesWinsPanel, expected);
}

function assertErrors(gameErrors, expectedErrors) {
  const errorsPanel = getErrorsPanel(
    renderGame(GAME_DISPLAY_PLAYBACK, { ...scoresAllRegularTime.games[0], errors: gameErrors }, [])
  );
  const expected = expectedErrorsPanel(expectedErrors);
  assert.deepEqual(errorsPanel, expected);
}

function getTeamPanels(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel');
}

function getDelimiter(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel__delimiter')[0];
}

function getGameChildrenWithClass(vtree, className) {
  const stripHtmlElement = sel => sel.replace(/^\w\./, '');
  return getGameCard(vtree).children[0].children.filter(node =>
    _.includes(stripHtmlElement(node.sel).split('.'), className)
  );
}

function getLatestGoalPanel(vtree) {
  return getGameCard(vtree).children[1].children[0];
}

function getGameStats(vtree) {
  return getGameCard(vtree).children[1].children[2];
}

function getGameDescription(vtree) {
  return getGameCard(vtree).children[1].children[1];
}

function getPlayoffSeriesWinsPanel(vtree) {
  return getGameCard(vtree).children[2];
}

function getErrorsPanel(vtree) {
  return getGameCard(vtree).children[3];
}

function getGameCard(vtree) {
  return vtree.children[0];
}

function expectedTeamPanels(teams, awayGoals, homeGoals, visibilityClass) {
  return [
    div('.team-panel.team-panel--away', [
      span('.team-logo', [
        renderTeamLogo(
          teams.away.id,
          `team-logo__image team-logo__image--away team-logo__image--${teams.away.id}`
        ),
      ]),
      span('.team-panel__team-name', teams.away.abbreviation),
      span(`.team-panel__team-score${visibilityClass}`, [awayGoals]),
    ]),
    div('.team-panel.team-panel--home', [
      span(`.team-panel__team-score${visibilityClass}`, [homeGoals]),
      span('.team-panel__team-name', teams.home.abbreviation),
      span('.team-logo', [
        renderTeamLogo(
          teams.home.id,
          `team-logo__image team-logo__image--home team-logo__image--${teams.home.id}`
        ),
      ]),
    ]),
  ];
}

function expectedDelimiter(delimiter, visibilityClass) {
  return div(`.team-panel__delimiter${visibilityClass}`, delimiter);
}

function expectedLatestGoalPanel(latestGoal) {
  return div('.latest-goal', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : ''),
    div('.latest-goal__assists', latestGoal ? renderLatestGoalAssists(latestGoal) : ''),
  ]);
}

function expectedStat({ away, home, label }) {
  const valueClass = '.stat__value';
  return div('.stat', [
    span(
      `${valueClass}${valueClass}--away${away.className ? valueClass + away.className : ''}`,
      away.value
    ),
    span('.stat__label', label),
    span(
      `${valueClass}${valueClass}--home${home.className ? valueClass + home.className : ''}`,
      home.value
    ),
  ]);
}

function expectedCurrentProgressDescription(progressTime) {
  return ['In progress:', span('.game-description__value', progressTime)];
}

function expectedGameDescription(description) {
  return div('.game-description.fade-in', description);
}

function expectedPlayoffSeriesWinsPanel(seriesWinsVtree, animationClass) {
  return seriesWinsVtree
    ? div(`.game__series-wins${animationClass || ''}`, seriesWinsVtree)
    : seriesWinsVtree;
}

function expectedErrorsPanel(errors) {
  return errors ? div('.game__errors', errors) : null;
}
