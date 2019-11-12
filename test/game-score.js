import { div, span } from '@cycle/dom';
import _ from 'lodash';
import { assert } from 'chai';

import {
  default as gameScore,
  delimiter,
  renderLatestGoalTime,
  renderLatestGoalScorer,
  renderLatestGoalAssists
} from '../app/js/game-score';
import { renderTeamLogo } from '../app/js/logos';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from './data/latest-ot-2-so.json';
import scoresAllRegularTimePlayoffs from './data/latest-playoffs.json';
import scoresRegularTimeAndOvertimePlayoffs from './data/latest-playoffs-ot.json';

const finishedState = 'FINAL';
const inProgressState = 'LIVE';
const notStartedState = 'PREVIEW';

const inProgressGameProgress = {
  currentPeriod: 1,
  currentPeriodOrdinal: '1st',
  currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 }
};

const statIndexes = {
  leagueRank: 0,
  pointPct: 1,
  record: 2,
  streak: 3,
  playoffSpotPts: 4
};

describe('gameScore', () => {
  describe('goal counts', () => {
    it('should be hidden in the pre-game info', () => {
      const clock = null;
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, [], 0, 0, '.team-panel__team-score--hidden');
    });

    it('should be hidden if the game has not started', () => {
      const clock = { start: true };
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts(
        clock,
        { state: notStartedState, teams },
        [],
        0,
        0,
        '.team-panel__team-score--hidden'
      );
    });

    it('should show zero goals in the beginning', () => {
      const clock = { start: true };
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, [], 0, 0);
    });

    it('should show zero goals before the clock has reached the first goal scoring time', () => {
      const clock = { period: 1, minute: 10, second: 0 };
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, [], 0, 0);
    });

    it('should increase the goal count when the clock reaches a goal scoring time', () => {
      const clock = { period: 1, minute: 8, second: 44 };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, _.take(goals, 1), 1, 0);
    });

    it('should show all the goals of the period when the clock reaches the end of the period', () => {
      const clock = { period: 1, end: true, minute: 0, second: 0 };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, _.take(goals, 2), 1, 1);
    });

    it('should show all the goals of the game when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, goals, 2, 3);
    });

    it('should show all the goals of the first period when the clock is running in the second period', () => {
      const clock = { period: 2, minute: 10, second: 0 };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams }, _.take(goals, 2), 1, 1);
    });

    it('should show goals scored in overtime', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertGoalCounts(clock, { teams }, goals, 1, 0);
    });
  });

  describe('goal delimiter', () => {
    it('should show "at" in the pre-game info', () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { teams }, goals, 'at', '');
    });

    it('should show "at" if the game has not started', () => {
      const clock = { start: true };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { state: notStartedState, teams }, goals, 'at', '');
    });

    it('should not be shown when the clock is running in regulation', () => {
      const clock = { period: 3, minute: 19, second: 2 };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { teams }, goals, '');
    });

    it('should show "OT" when the clock reaches the scoring time of an overtime goal', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertDelimiter(clock, { teams }, goals, span('.team-panel__delimiter-period', 'OT'));
    });

    it('should not be shown when the clock reaches shootout but there is no shootout goal', () => {
      const clock = { period: 'SO' };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { teams }, goals, '');
    });

    it('should show "SO" when the clock reaches shootout and the game has a shootout goal', () => {
      const clock = { period: 'SO' };
      const { teams, goals } = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(clock, { teams }, goals, span('.team-panel__delimiter-period', 'SO'));
    });

    it('should show the period of the last goal when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const { teams, goals } = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(clock, { teams }, goals, span('.team-panel__delimiter-period', 'SO'));
    });
  });

  describe('latest goal panel', () => {
    it('should show nothing in the beginning', () => {
      const clock = { start: true };
      const { teams } = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, [], null);
    });

    it('should show nothing before the clock has reached the first goal scoring time', () => {
      const clock = { period: 1, minute: 10, second: 0 };
      const { teams } = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, [], null);
    });

    it('should show the latest goal when the clock reaches a goal scoring time', () => {
      const clock = { period: 1, minute: 8, second: 44 };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, _.take(goals, 1), _.first(goals));
    });

    it('should show the last goal of the game when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

    it('should show goals scored in overtime', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });
  });

  describe('pre-game stats', () => {
    it('should be shown before playback has started', () => {
      const clock = null;
      const status = { state: finishedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(clock, { status, teams }, goals);
    });

    it('should be shown after playback has started for not started games', () => {
      const clock = { start: true };
      const status = { state: notStartedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(clock, { status, teams }, goals);
    });

    it('should be shown after playback has finished for not started games', () => {
      const clock = { end: true };
      const status = { state: notStartedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const clock = { start: true };
      const status = { state: inProgressState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const clock = { period: 1, minute: 8, second: 43 };
      const status = { state: inProgressState, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should be shown after playback has reached current progress in in-progress games', () => {
      const clock = { period: 1, minute: 8, second: 42 };
      const status = { state: inProgressState, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(clock, { status, teams }, goals);
    });

    it('should be shown after playback has finished for in-progress games', () => {
      const clock = { end: true };
      const status = { state: inProgressState, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has started for finished games', () => {
      const clock = { start: true };
      const status = { state: finishedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has finished for finished games', () => {
      const clock = { end: true };
      const status = { state: finishedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertPreGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const clock = null;
      const label = 'Point-%';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.654' },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.692', className: '--highlight' },
        label
      });
    });

    it("should show teams' playoff win percentages, highlighting the better one", () => {
      const clock = null;
      const label = 'Win-%';

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[0], statIndexes.pointPct, {
        away: { value: '.700' },
        home: { value: '.700' },
        label
      });

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[1], statIndexes.pointPct, {
        away: { value: '.583', className: '--highlight' },
        home: { value: '.357' },
        label
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const clock = null;
      const label = 'Record';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.record, {
        away: { value: [8, delimiter, 4, delimiter, 1] },
        home: { value: [7, delimiter, 3, delimiter, 3] },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.record, {
        away: { value: [8, delimiter, 4, delimiter, 1] },
        home: { value: [7, delimiter, 2, delimiter, 4], className: '--highlight' },
        label
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const clock = null;
      const label = 'Record';

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[0], statIndexes.record, {
        away: { value: [7, delimiter, 3] },
        home: { value: [7, delimiter, 3] },
        label
      });

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[1], statIndexes.record, {
        away: { value: [7, delimiter, 5], className: '--highlight' },
        home: { value: [5, delimiter, 9] },
        label
      });
    });
  });

  describe('after-game stats', () => {
    it('should not be shown before playback has started', () => {
      const clock = null;
      const status = { state: finishedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has started for not started games', () => {
      const clock = { start: true };
      const status = { state: notStartedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has finished for not started games', () => {
      const clock = { end: true };
      const status = { state: notStartedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const clock = { start: true };
      const status = { state: inProgressState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const clock = { period: 1, minute: 8, second: 43 };
      const status = { state: inProgressState, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const clock = { period: 1, minute: 8, second: 42 };
      const status = { state: inProgressState, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has finished for in-progress games', () => {
      const clock = { end: true };
      const status = { state: inProgressState, progress: inProgressGameProgress };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should not be shown after playback has started for finished games', () => {
      const clock = { start: true };
      const status = { state: finishedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreNotShown(clock, { status, teams }, goals);
    });

    it('should be shown after playback has finished for finished games', () => {
      const clock = { end: true };
      const status = { state: finishedState };
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertAfterGameStatsAreShown(clock, { status, teams }, goals);
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'NHL rank';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.leagueRank, {
        away: { value: '11' },
        home: { value: '8', className: '--highlight' },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.leagueRank, {
        away: { value: '4', className: '--highlight' },
        home: { value: '26' },
        label
      });
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'Point-%';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.pointPct, {
        away: { value: '.679', className: '--highlight' },
        home: { value: '.607' },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.pointPct, {
        away: { value: '.607' },
        home: { value: '.714', className: '--highlight' },
        label
      });
    });

    it("should show teams' playoff win percentages, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'Win-%';

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[0], statIndexes.pointPct, {
        away: { value: '.727', className: '--highlight' },
        home: { value: '.636' },
        label
      });

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[1], statIndexes.pointPct, {
        away: { value: '.538', className: '--highlight' },
        home: { value: '.400' },
        label
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'Record';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.record, {
        away: { value: [9, delimiter, 4, delimiter, 1], className: '--highlight' },
        home: { value: [7, delimiter, 4, delimiter, 3] },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.record, {
        away: { value: [8, delimiter, 5, delimiter, 1] },
        home: { value: [8, delimiter, 2, delimiter, 4], className: '--highlight' },
        label
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'Record';

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[0], statIndexes.record, {
        away: { value: [8, delimiter, 3], className: '--highlight' },
        home: { value: [7, delimiter, 4] },
        label
      });

      assertGameStats(clock, scoresAllRegularTimePlayoffs.games[1], statIndexes.record, {
        away: { value: [7, delimiter, 6], className: '--highlight' },
        home: { value: [6, delimiter, 9] },
        label
      });
    });

    it("should show teams' streaks, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'Streak';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.streak, {
        away: { value: '2 W', className: '--highlight' },
        home: { value: '1 L' },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.streak, {
        away: { value: '2 L' },
        home: { value: '2 W', className: '--highlight' },
        label
      });
    });

    it("should show teams' playoff spot point differences, highlighting the better one", () => {
      const clock = { end: true };
      const label = 'PO spot pts';

      assertGameStats(clock, scoresAllRegularTime.games[0], statIndexes.playoffSpotPts, {
        away: { value: '+4' },
        home: { value: '+4' },
        label
      });

      assertGameStats(clock, scoresAllRegularTime.games[1], statIndexes.playoffSpotPts, {
        away: { value: '+2', className: '--highlight' },
        home: { value: '-2' },
        label
      });
    });
  });

  describe('pre-game description', () => {
    it(`should show "Finished" description for game in ${finishedState} state`, () => {
      const clock = null;
      const { teams, goals, status } = scoresAllRegularTime.games[1];
      assertPreGameDescription(clock, { status, teams }, goals, 'Finished');
    });

    it(`should show game without progress information in ${inProgressState} state as in progress`, () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: inProgressState };
      assertPreGameDescription(clock, { status, teams }, goals, 'In progress');
    });

    it(`should show time remaining progress for game in ${inProgressState} state`, () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 }
        }
      };
      assertPreGameDescription(
        clock,
        { status, teams },
        goals,
        `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`
      );
    });

    it(`should show time remaining progress for game in ${inProgressState} state after playback has reached current progress`, () => {
      const clock = { period: 1, minute: 8, second: 42 };
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 }
        }
      };
      assertPreGameDescription(
        clock,
        { status, teams },
        goals,
        `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`
      );
    });

    it(`should show end of period progress for game in ${inProgressState} state`, () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: 'END', min: 0, sec: 0 }
        }
      };
      assertPreGameDescription(
        clock,
        { status, teams },
        goals,
        `End of ${status.progress.currentPeriodOrdinal}`
      );
    });

    it(`should not show remaining time for SO game in ${inProgressState} state`, () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 5,
          currentPeriodOrdinal: 'SO',
          currentPeriodTimeRemaining: { pretty: '00:00', min: 0, sec: 0 }
        }
      };
      assertPreGameDescription(clock, { status, teams }, goals, 'In shootout');
    });

    it(`should show game in ${notStartedState} state and start time in the past as starting soon`, () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: notStartedState };
      assertPreGameDescription(clock, { status, teams }, goals, 'Starts soon');
    });

    it(`should show game in ${notStartedState} state and start time in the future as starting in some time`, () => {
      const clock = null;
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: notStartedState };

      const time = new Date();
      time.setHours(time.getHours() + 3);
      time.setMinutes(time.getMinutes() + 1);
      const startTime = time.toISOString();

      assertPreGameDescription(clock, { status, startTime, teams }, goals, 'Starts in 3 hours');
    });
  });

  describe('playoff series wins panel', () => {
    it('should not exist if there is no playoff series information', () => {
      const clock = { start: true };
      const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
      assertPlayoffSeriesWins(clock, teams, goals, preGameStats, finishedState, undefined, null);
    });

    it('should show the series tied when teams have the same amount of wins', () => {
      const clock = { start: true };
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[0];
      assertPlayoffSeriesTied(clock, teams, goals, preGameStats, finishedState, 1);
    });

    it('should show the team that has more wins leading the series', () => {
      const clock = { start: true };
      const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
      assertPlayoffSeriesLead(clock, teams, goals, preGameStats, finishedState, 'NYR', 2, 1);
    });

    it("should not increase the winning teams' win counts until all games have ended", () => {
      const clock = { period: 3, end: true };
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesTied(
        clock,
        game1.teams,
        game1.goals,
        game1.preGameStats,
        finishedState,
        1
      );

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesLead(
        clock,
        game2.teams,
        game2.goals,
        game2.preGameStats,
        finishedState,
        'ANA',
        2,
        1
      );
    });

    it('should not increase win counts for "not started" or "in progress" games after all finished games have ended', () => {
      const clock = { end: true };
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesTied(
        clock,
        game1.teams,
        game1.goals,
        game1.preGameStats,
        inProgressState,
        1
      );

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesLead(
        clock,
        game2.teams,
        game2.goals,
        game2.preGameStats,
        notStartedState,
        'ANA',
        2,
        1
      );
    });

    it("should increase the winning teams' win counts after all games have ended", () => {
      const clock = { end: true };
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesLead(
        clock,
        game1.teams,
        game1.goals,
        game1.preGameStats,
        finishedState,
        'STL',
        2,
        1,
        '.fade-in'
      );

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesTied(
        clock,
        game2.teams,
        game2.goals,
        game2.preGameStats,
        finishedState,
        2,
        '.fade-in'
      );
    });
  });
});

function assertGoalCounts(
  clock,
  { state = finishedState, teams },
  currentGoals,
  awayGoals,
  homeGoals,
  visibilityClass = '.fade-in'
) {
  const teamPanels = getTeamPanels(gameScore(clock, { status: { state }, teams }, currentGoals));
  const expected = expectedTeamPanels(teams, awayGoals, homeGoals, visibilityClass);
  assert.deepEqual(teamPanels, expected);
}

function assertDelimiter(
  clock,
  { state = finishedState, teams },
  currentGoals,
  delimiter,
  visibilityClass = '.fade-in'
) {
  const delimiterNode = getDelimiter(gameScore(clock, { status: { state }, teams }, currentGoals));
  const expected = expectedDelimiter(delimiter, visibilityClass);
  assert.deepEqual(delimiterNode, expected);
}

function assertLatestGoal(clock, teams, goals, expectedLatestGoal) {
  const latestGoalPanel = getLatestGoalPanel(
    gameScore(clock, { status: { state: finishedState }, teams }, goals)
  );
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

function assertPreGameStatsAreShown(clock, { status, teams }, goals) {
  assertGameStatsExistence(
    clock,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.game-stats.fade-in'
  );
}
function assertPreGameStatsAreNotShown(clock, { status, teams }, goals) {
  assertGameStatsExistence(
    clock,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.game-stats.fade-in'
  );
}
function assertAfterGameStatsAreShown(clock, { status, teams }, goals) {
  assertGameStatsExistence(
    clock,
    { status, teams },
    goals,
    assert.deepEqual,
    'div.game-stats.game-stats--after-game.fade-in'
  );
}
function assertAfterGameStatsAreNotShown(clock, { status, teams }, goals) {
  assertGameStatsExistence(
    clock,
    { status, teams },
    goals,
    assert.notDeepEqual,
    'div.game-stats.game-stats--after-game.fade-in'
  );
}
function assertGameStatsExistence(clock, { status, teams }, goals, assertFn, selector) {
  const gameStats = getGameStats(gameScore(clock, { status, teams }, goals));
  assertFn(gameStats && gameStats.sel, selector);
}

function assertGameStats(
  clock,
  { state = finishedState, teams, goals, preGameStats, currentStats },
  statIndex,
  renderedRecords
) {
  const renderedStats = getGameStats(
    gameScore(clock, { status: { state }, teams, preGameStats, currentStats }, goals)
  ).children[statIndex];
  const expected = expectedTeamStats(renderedRecords);
  assert.deepEqual(renderedStats, expected);
}

function assertPreGameDescription(clock, { status, startTime, teams }, goals, description) {
  const preGameDescription = getPreGameDescription(
    gameScore(clock, { status, startTime, teams }, goals)
  );
  const expected = expectedPreGameDescription(description);
  assert.deepEqual(preGameDescription, expected);
}

function assertPlayoffSeriesLead(
  clock,
  teams,
  goals,
  preGameStats,
  state,
  leadingTeam,
  leadingWins,
  trailingWins,
  animationClass
) {
  return assertPlayoffSeriesWins(clock, teams, goals, preGameStats, state, animationClass, [
    span('.series-wins__leading-team', leadingTeam),
    ' leads ',
    span('.series-wins__leading-count', String(leadingWins)),
    span('.series-wins__delimiter', '–'),
    span('.series-wins__trailing-count', String(trailingWins))
  ]);
}

function assertPlayoffSeriesTied(clock, teams, goals, preGameStats, state, wins, animationClass) {
  return assertPlayoffSeriesWins(clock, teams, goals, preGameStats, state, animationClass, [
    'Series ',
    span('.series-wins__tied', 'tied'),
    ' ',
    span('.series-wins__tied-count', String(wins)),
    span('.series-wins__delimiter', '–'),
    span('.series-wins__tied-count', String(wins))
  ]);
}

function assertPlayoffSeriesWins(
  clock,
  teams,
  goals,
  preGameStats,
  state,
  animationClass,
  expectedSeriesWinsVtree
) {
  const playoffSeriesWinsPanel = getPlayoffSeriesWinsPanel(
    gameScore(clock, { status: { state }, teams, preGameStats }, goals)
  );
  const expected = expectedPlayoffSeriesWinsPanel(expectedSeriesWinsVtree, animationClass);
  assert.deepEqual(playoffSeriesWinsPanel, expected);
}

function getTeamPanels(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel');
}

function getDelimiter(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel__delimiter')[0];
}

function getGameChildrenWithClass(vtree, className) {
  const stripHtmlElement = sel => sel.replace(/^\w\./, '');
  return vtree.children[0].children.filter(node =>
    _.includes(stripHtmlElement(node.sel).split('.'), className)
  );
}

function getLatestGoalPanel(vtree) {
  return vtree.children[1].children[0];
}

function getGameStats(vtree) {
  return vtree.children[1].children[2];
}

function getPreGameDescription(vtree) {
  return vtree.children[1].children[1];
}

function getPlayoffSeriesWinsPanel(vtree) {
  return vtree.children[2];
}

function expectedTeamPanels(teams, awayGoals, homeGoals, visibilityClass) {
  return [
    div('.team-panel.team-panel--away', [
      span('.team-logo', [
        renderTeamLogo(
          teams.away.id,
          `team-logo__image team-logo__image--away team-logo__image--${teams.away.id}`
        )
      ]),
      span('.team-panel__team-name', teams.away.abbreviation),
      span('.team-panel__team-score' + visibilityClass, [awayGoals])
    ]),
    div('.team-panel.team-panel--home', [
      span('.team-panel__team-score' + visibilityClass, [homeGoals]),
      span('.team-panel__team-name', teams.home.abbreviation),
      span('.team-logo', [
        renderTeamLogo(
          teams.home.id,
          `team-logo__image team-logo__image--home team-logo__image--${teams.home.id}`
        )
      ])
    ])
  ];
}

function expectedDelimiter(delimiter, visibilityClass) {
  return div('.team-panel__delimiter' + visibilityClass, delimiter);
}

function expectedLatestGoalPanel(latestGoal) {
  return div('.latest-goal', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : ''),
    div('.latest-goal__assists', latestGoal ? renderLatestGoalAssists(latestGoal) : '')
  ]);
}

function expectedTeamStats({ away, home, label }) {
  const valueClass = '.team-stats__value';
  return div('.team-stats', [
    span(
      `${valueClass}${valueClass}--away${away.className ? valueClass + away.className : ''}`,
      away.value
    ),
    span('.team-stats__label', label),
    span(
      `${valueClass}${valueClass}--home${home.className ? valueClass + home.className : ''}`,
      home.value
    )
  ]);
}

function expectedPreGameDescription(description) {
  return div('.game-description.fade-in', description);
}

function expectedPlayoffSeriesWinsPanel(seriesWinsVtree, animationClass) {
  return seriesWinsVtree
    ? div(`.game__series-wins${animationClass || ''}`, seriesWinsVtree)
    : seriesWinsVtree;
}
