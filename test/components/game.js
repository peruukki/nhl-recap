import { div, span } from '@cycle/dom';
import _ from 'lodash';
import { assert } from 'chai';

import Game from 'app/js/components/game';
import {
  renderLatestGoalAssists,
  renderLatestGoalScorer,
  renderLatestGoalTime,
} from 'app/js/components/info-panel/info-panel';
import { delimiter as renderedDelimiter } from 'app/js/components/info-panel/stats/team-stats';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED,
  GAME_STATE_POSTPONED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
} from 'app/js/events/constants';
import { renderTeamLogo } from 'app/js/utils/logos';

import scoresAllRegularTime from '../data/latest.json';
import scoresMultipleOvertime from '../data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from '../data/latest-ot-2-so.json';
import scoresAllRegularTimePlayoffs from '../data/latest-playoffs.json';
import { getGameCard } from '../test-utils';

const inProgressGameProgress = {
  currentPeriod: 1,
  currentPeriodOrdinal: '1st',
  currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
};

const gameStatIndexes = {
  shots: 1,
  blocked: 2,
  penaltyMin: 3,
  hits: 4,
  giveaways: 5,
  takeaways: 6,
  powerPlay: 7,
  faceOffs: 8,
};

const teamStatIndexes = {
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

  describe('game stats', () => {
    const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;

    it('should not be shown when game display state is pre-game', () => {
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals, gameStats } = scoresAllRegularTime.games[1];
      assertGameStatsAreNotShown(GAME_DISPLAY_PRE_GAME, { status, teams, gameStats }, goals);
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS };
      const { teams, goals, gameStats } = scoresAllRegularTime.games[1];
      assertGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams, gameStats }, goals);
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals, gameStats } = scoresAllRegularTime.games[1];
      assertGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams, gameStats }, goals);
    });

    it('should not be shown after playback has reached current progress in in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals, gameStats } = scoresAllRegularTime.games[1];
      assertGameStatsAreNotShown(GAME_DISPLAY_IN_PROGRESS, { status, teams, gameStats }, goals);
    });

    it('should be shown after playback has finished for finished games', () => {
      const status = { state: GAME_STATE_FINISHED };
      const { teams, goals, gameStats } = scoresAllRegularTime.games[1];
      assertGameStatsAreShown(GAME_DISPLAY_POST_GAME_FINISHED, { status, teams, gameStats }, goals);
    });

    it('should be shown after playback has finished for in-progress games', () => {
      const status = { state: GAME_STATE_IN_PROGRESS, progress: inProgressGameProgress };
      const { teams, goals, gameStats } = scoresAllRegularTime.games[1];
      assertGameStatsAreShown(
        GAME_DISPLAY_POST_GAME_IN_PROGRESS,
        { status, teams, gameStats },
        goals
      );
    });

    it('should show shots, highlighting the larger one', () => {
      const label = 'Shots';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.shots, {
        away: { value: 25 },
        home: { value: 25 },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.shots, {
        away: { value: 25 },
        home: { value: 32, className: '--highlight' },
        label,
      });
    });

    it('should show blocked shots, highlighting the larger one', () => {
      const label = 'Blocked';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.blocked, {
        away: { value: 5 },
        home: { value: 5 },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.blocked, {
        away: { value: 5 },
        home: { value: 7, className: '--highlight' },
        label,
      });
    });

    it('should show penalty minutes, highlighting the smaller one', () => {
      const label = 'Penalty min';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.penaltyMin, {
        away: { value: 6 },
        home: { value: 6 },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.penaltyMin, {
        away: { value: 13 },
        home: { value: 6, className: '--highlight' },
        label,
      });
    });

    it('should show hits, highlighting the larger one', () => {
      const label = 'Hits';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.hits, {
        away: { value: 22 },
        home: { value: 22 },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.hits, {
        away: { value: 26, className: '--highlight' },
        home: { value: 22 },
        label,
      });
    });

    it('should show giveaways, highlighting the smaller one', () => {
      const label = 'Giveaways';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.giveaways, {
        away: { value: 8 },
        home: { value: 8 },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.giveaways, {
        away: { value: 11 },
        home: { value: 8, className: '--highlight' },
        label,
      });
    });

    it('should show takeaways, highlighting the larger one', () => {
      const label = 'Takeaways';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.takeaways, {
        away: { value: 5 },
        home: { value: 5 },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.takeaways, {
        away: { value: 5 },
        home: { value: 10, className: '--highlight' },
        label,
      });
    });

    it('should show power plays, highlighting the more efficient one', () => {
      const label = 'Power play';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.powerPlay, {
        away: { value: '2/4' },
        home: { value: '1/2' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.powerPlay, {
        away: { value: '2/4', className: '--highlight' },
        home: { value: '1/3' },
        label,
      });
    });

    it('should show faceoff percentages, highlighting the better one', () => {
      const label = 'Faceoff-%';

      assertGameStats(gameDisplay, scoresAllRegularTime.games[0], gameStatIndexes.faceOffs, {
        away: { value: '50.0' },
        home: { value: '50.0' },
        label,
      });

      assertGameStats(gameDisplay, scoresAllRegularTime.games[1], gameStatIndexes.faceOffs, {
        away: { value: '51.1', className: '--highlight' },
        home: { value: '48.9' },
        label,
      });
    });
  });

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
        teamStatIndexes.divisionRank,
        {
          away: { value: '7' },
          home: { value: '3', className: '--highlight' },
          label,
        }
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        teamStatIndexes.divisionRank,
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

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[0],
        teamStatIndexes.leagueRank,
        {
          away: { value: '11' },
          home: { value: '8', className: '--highlight' },
          label,
        }
      );

      assertTeamStats(
        gameDisplay,
        scoresAllRegularTimePlayoffs.games[1],
        teamStatIndexes.leagueRank,
        {
          away: { value: '4', className: '--highlight' },
          home: { value: '26' },
          label,
        }
      );
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Point-%';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.654' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.pointPct, {
        away: { value: '.654' },
        home: { value: '.692', className: '--highlight' },
        label,
      });
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach(game => {
        assertTeamStats(gameDisplay, game, teamStatIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.record, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 3, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.record, {
        away: { value: [8, renderedDelimiter, 4, renderedDelimiter, 1] },
        home: { value: [7, renderedDelimiter, 2, renderedDelimiter, 4], className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_PRE_GAME;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], teamStatIndexes.record, {
        away: { value: [7, renderedDelimiter, 3] },
        home: { value: [7, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], teamStatIndexes.record, {
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

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.divisionRank, {
        away: { value: '7' },
        home: { value: '3', className: '--highlight' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.divisionRank, {
        away: { value: '2', className: '--highlight' },
        home: { value: '8' },
        label,
      });
    });

    it("should show teams' league ranks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'NHL rank';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.leagueRank, {
        away: { value: '11' },
        home: { value: '8', className: '--highlight' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.leagueRank, {
        away: { value: '4', className: '--highlight' },
        home: { value: '26' },
        label,
      });
    });

    it("should show teams' point percentages, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Point-%';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.pointPct, {
        away: { value: '.679', className: '--highlight' },
        home: { value: '.607' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.pointPct, {
        away: { value: '.607' },
        home: { value: '.714', className: '--highlight' },
        label,
      });
    });

    it("should not show teams' playoff win percentages", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;

      assert.lengthOf(scoresAllRegularTimePlayoffs.games, 3);
      scoresAllRegularTimePlayoffs.games.forEach(game => {
        assertTeamStats(gameDisplay, game, teamStatIndexes.pointPct, {
          away: { value: '' },
          home: { value: '' },
          label: '',
        });
      });
    });

    it("should show teams' regular season records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.record, {
        away: { value: [9, renderedDelimiter, 4, renderedDelimiter, 1], className: '--highlight' },
        home: { value: [7, renderedDelimiter, 4, renderedDelimiter, 3] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.record, {
        away: { value: [8, renderedDelimiter, 5, renderedDelimiter, 1] },
        home: { value: [8, renderedDelimiter, 2, renderedDelimiter, 4], className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff records, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Record';

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[0], teamStatIndexes.record, {
        away: { value: [8, renderedDelimiter, 3], className: '--highlight' },
        home: { value: [7, renderedDelimiter, 4] },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTimePlayoffs.games[1], teamStatIndexes.record, {
        away: { value: [7, renderedDelimiter, 6], className: '--highlight' },
        home: { value: [6, renderedDelimiter, 9] },
        label,
      });
    });

    it("should show teams' streaks, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'Streak';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.streak, {
        away: { value: '2 W', className: '--highlight' },
        home: { value: '1 L' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.streak, {
        away: { value: '2 L' },
        home: { value: '2 W', className: '--highlight' },
        label,
      });
    });

    it("should show teams' playoff spot point differences, highlighting the better one", () => {
      const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;
      const label = 'PO spot pts';

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[0], teamStatIndexes.playoffSpotPts, {
        away: { value: '+4' },
        home: { value: '+4' },
        label,
      });

      assertTeamStats(gameDisplay, scoresAllRegularTime.games[1], teamStatIndexes.playoffSpotPts, {
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
});

function assertGoalCounts(
  gameDisplay,
  { state = GAME_STATE_FINISHED, teams },
  currentGoals,
  awayGoals,
  homeGoals,
  visibilityClass = '.fade-in'
) {
  const teamPanels = getTeamPanels(Game(gameDisplay, { status: { state }, teams }, currentGoals));
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
  const delimiterNode = getDelimiter(Game(gameDisplay, { status: { state }, teams }, currentGoals));
  const expected = expectedDelimiter(delimiter, visibilityClass);
  assert.deepEqual(delimiterNode, expected);
}

function assertLatestGoal(gameDisplay, teams, goals, expectedLatestGoal) {
  const latestGoalPanel = getLatestGoalPanel(
    Game(gameDisplay, { status: { state: GAME_STATE_FINISHED }, teams }, goals)
  );
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

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

function assertGameStatsAreShown(gameDisplay, { status, teams, gameStats }, goals) {
  assertGameStatsExistence(
    gameDisplay,
    { status, teams, gameStats },
    goals,
    assert.deepEqual,
    'div.stats.stats--game-stats'
  );
}
function assertGameStatsAreNotShown(gameDisplay, { status, teams, gameStats }, goals) {
  assertGameStatsExistence(
    gameDisplay,
    { status, teams, gameStats },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--game-stats'
  );
}
function assertGameStatsExistence(
  gameDisplay,
  { status, teams, gameStats },
  goals,
  assertFn,
  selector
) {
  const stats = getGameStats(Game(gameDisplay, { status, teams, gameStats }, goals));
  assertFn(stats && stats.sel, selector);
}

function assertGameStats(
  gameDisplay,
  { state = GAME_STATE_FINISHED, teams, goals, gameStats },
  statIndex,
  renderedRecords
) {
  const renderedStats = getGameStats(
    Game(gameDisplay, { status: { state }, teams, gameStats }, goals)
  ).children[statIndex];
  const expected = expectedStat(renderedRecords);
  assert.deepEqual(renderedStats, expected);
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

function assertGameDescription(gameDisplay, { status, startTime, teams }, goals, description) {
  const gameDescription = getGameDescription(
    Game(gameDisplay, { status, startTime, teams }, goals)
  );
  const expected = expectedGameDescription(description);
  assert.deepEqual(gameDescription, expected);
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

function getTeamStats(vtree) {
  return getGameCard(vtree).children[1].children[3];
}

function getGameDescription(vtree) {
  return getGameCard(vtree).children[1].children[1];
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
