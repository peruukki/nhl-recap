import {div, span} from '@cycle/dom';
import _ from 'lodash';
import {assert} from 'chai';

import {default as gameScore, renderLatestGoalTime, renderLatestGoalScorer} from '../app/js/game-score';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from './data/latest-ot-2-so.json';
import scoresAllRegularTimePlayoffs from './data/latest-playoffs.json';
import scoresRegularTimeAndOvertimePlayoffs from './data/latest-playoffs-ot.json';

const finishedState = 'FINAL';
const inProgressState = 'LIVE';
const notStartedState = 'PREVIEW';

describe('gameScore', () => {

  describe('goal counts', () => {

    it('should be hidden in the pre-game info', () => {
      const clock = null;
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 0, 0, '.team-panel__team-score--hidden');
    });

    it('should be hidden if the game has not started', () => {
      const clock = { start: true };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { state: notStartedState, teams, goals }, 0, 0, '.team-panel__team-score--hidden');
    });

    it('should show zero goals in the beginning', () => {
      const clock = { start: true };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 0, 0);
    });

    it('should show zero goals before the clock has reached the first goal scoring time', () => {
      const clock = { period: 1, minute: 10, second: 0 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 0, 0);
    });

    it('should show increase the goal count when the clock reaches a goal scoring time', () => {
      const clock = { period: 1, minute: 8, second: 44 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 1, 0);
    });

    it('should show all the goals of the period when the clock reaches the end of the period', () => {
      const clock = { period: 1, end: true, minute: 0, second: 0 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 1, 1);
    });

    it('should show all the goals of the game when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 2, 3);
    });

    it('should show all the goals of the first period when the clock is running in the second period', () => {
      const clock = { period: 2, minute: 10, second: 0 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertGoalCounts(clock, { teams, goals }, 1, 1);
    });

    it('should show goals scored in overtime', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const {teams, goals} = scoresMultipleOvertime.games[0];
      assertGoalCounts(clock, { teams, goals }, 1, 0);
    });

    it('should show only one shootout goal, for the winning (home) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout.games[1];
      assertGoalCounts(clock, { teams, goals }, 2, 3);
    });

    it('should show only one shootout goal, for the winning (away) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout.games[2];
      assertGoalCounts(clock, { teams, goals }, 2, 1);
    });

  });

  describe('goal delimiter', () => {

    it('should show "at" in the pre-game info', () => {
      const clock = null;
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { teams, goals }, 'at', '');
    });

    it('should show "at" if the game has not started', () => {
      const clock = { start: true };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { state: notStartedState, teams, goals }, 'at', '');
    });

    it('should show "–" when the clock is running in regulation', () => {
      const clock = { period: 3, minute: 19, second: 2 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { teams, goals }, '–');
    });

    it('should show "–" when the clock is running in overtime but there has been no overtime goal', () => {
      const clock = { period: 'OT', minute: 2, second: 56 };
      const {teams, goals} = scoresMultipleOvertime.games[0];
      assertDelimiter(clock, { teams, goals }, '–');
    });

    it('should show "OT" when the clock reaches the scoring time of an overtime goal', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const {teams, goals} = scoresMultipleOvertime.games[0];
      assertDelimiter(clock, { teams, goals }, span('.team-panel__delimiter-period', 'OT'));
    });

    it('should show "–" when the clock reaches shootout but there is no shootout goal', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertDelimiter(clock, { teams, goals }, '–');
    });

    it('should show "SO" when the clock reaches shootout and the game has a shootout goal', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(clock, { teams, goals }, span('.team-panel__delimiter-period', 'SO'));
    });

    it('should show the period of the last goal when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(clock, { teams, goals }, span('.team-panel__delimiter-period', 'SO'));
    });

  });

  describe('latest goal panel', () => {

    it('should show nothing in the beginning', () => {
      const clock = { start: true };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, goals, null);
    });

    it('should show nothing before the clock has reached the first goal scoring time', () => {
      const clock = { period: 1, minute: 10, second: 0 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, goals, null);
    });

    it('should show the latest goal when the clock reaches a goal scoring time', () => {
      const clock = { period: 1, minute: 8, second: 44 };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, goals, _.first(goals));
    });

    it('should show the last goal of the game when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

    it('should show goals scored in overtime', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const {teams, goals} = scoresMultipleOvertime.games[0];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

    it('should show the last shootout goal of the winning (home) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout.games[1];
      assertLatestGoal(clock, teams, goals, _.last(_.dropRight(goals)));
    });

    it('should show the last shootout goal of the winning (away) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout.games[2];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

  });

  describe('pre-game info panel', () => {

    it('should be shown before playback has started', () => {
      const clock = null;
      const status = { state: finishedState };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertPreGameInfoIsShown(clock, { status, teams, goals });
    });

    it('should be shown after playback has started for not started games', () => {
      const clock = { start: true };
      const status = { state: notStartedState };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertPreGameInfoIsShown(clock, { status, teams, goals });
    });

    it('should not be shown after playback has started for in-progress games', () => {
      const clock = { start: true };
      const status = { state: inProgressState };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertPreGameInfoIsNotShown(clock, { status, teams, goals });
    });

    it('should not be shown when playback has not reached current progress in in-progress games', () => {
      const clock = { period: 1, minute: 8, second: 43 };
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 }
        }
      };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertPreGameInfoIsNotShown(clock, { status, teams, goals });
    });

    it('should be shown again after playback has reached current progress in in-progress games', () => {
      const clock = { period: 1, minute: 8, second: 42 };
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 }
        }
      };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertPreGameInfoIsShown(clock, { status, teams, goals });
    });

    it('should not be shown after playback has started for finished games', () => {
      const clock = { start: true };
      const status = { state: finishedState };
      const {teams, goals} = scoresAllRegularTime.games[1];
      assertPreGameInfoIsNotShown(clock, { status, teams, goals });
    });

    it('should show teams\' league records, highlighting the better record', () => {
      const clock = null;
      const delimiter = span('.pre-game-stats__delimiter', '-');

      assertPreGameStats(clock, scoresAllRegularTime.games[0], {
        away: { record: [ '8', delimiter, '4', delimiter, '1' ] },
        home: { record: [ '7', delimiter, '3', delimiter, '3' ] }
      });

      assertPreGameStats(clock, scoresAllRegularTime.games[1], {
        away: { record: [ '8', delimiter, '4', delimiter, '1' ] },
        home: { record: [ '7', delimiter, '2', delimiter, '4' ], className: '--highlight' }
      });
    });

    it('should show teams\' playoff records, highlighting the better record', () => {
      const clock = null;
      const delimiter = span('.pre-game-stats__delimiter', '-');

      assertPreGameStats(clock, scoresAllRegularTimePlayoffs.games[0], {
        away: { record: [ '7', delimiter, '3' ] },
        home: { record: [ '7', delimiter, '3' ] }
      });

      assertPreGameStats(clock, scoresAllRegularTimePlayoffs.games[1], {
        away: { record: [ '7', delimiter, '5' ], className: '--highlight' },
        home: { record: [ '5', delimiter, '9' ] }
      });
    });

    it(`should show no description for game in ${finishedState} state`, () => {
      const clock = null;
      const {teams, goals, status} = scoresAllRegularTime.games[1];
      assertPreGameDescription(clock, { status, teams, goals }, '');
    });

    it(`should show game without progress information in ${inProgressState} state as in progress`, () => {
      const clock = null;
      const {teams, goals} = scoresAllRegularTime.games[1];
      const status = { state: inProgressState };
      assertPreGameDescription(clock, { status, teams, goals }, 'In progress');
    });

    it(`should show time remaining progress for game in ${inProgressState} state`, () => {
      const clock = null;
      const {teams, goals} = scoresAllRegularTime.games[1];
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 }
        }
      };
      assertPreGameDescription(clock, { status, teams, goals },
        `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`);
    });

    it(`should show end of period progress for game in ${inProgressState} state`, () => {
      const clock = null;
      const {teams, goals} = scoresAllRegularTime.games[1];
      const status = {
        state: inProgressState,
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: 'END', min: 0, sec: 0 }
        }
      };
      assertPreGameDescription(clock, { status, teams, goals },
        `End of ${status.progress.currentPeriodOrdinal}`);
    });

    it(`should show game in ${notStartedState} state as not started`, () => {
      const clock = null;
      const {teams, goals} = scoresAllRegularTime.games[1];
      const status = { state: notStartedState };
      assertPreGameDescription(clock, { status, teams, goals }, 'Not started');
    });

  });

  describe('playoff series wins panel', () => {

    it('should not exist if there is no playoff series information', () => {
      const clock = { start: true };
      const {teams, goals, playoffSeries} = scoresAllRegularTime.games[1];
      assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, finishedState, undefined, null);
    });

    it('should show the series tied when teams have the same amount of wins', () => {
      const clock = { start: true };
      const {teams, goals, playoffSeries} = scoresAllRegularTimePlayoffs.games[0];
      assertPlayoffSeriesTied(clock, teams, goals, playoffSeries, finishedState, 1);
    });

    it('should show the team that has more wins leading the series', () => {
      const clock = { start: true };
      const {teams, goals, playoffSeries} = scoresAllRegularTimePlayoffs.games[1];
      assertPlayoffSeriesLead(clock, teams, goals, playoffSeries, finishedState, 'NYR', 2, 1);
    });

    it('should not increase the winning teams\' win counts until all games have ended', () => {
      const clock = { period: 3, end: true };
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesTied(clock, game1.teams, game1.goals, game1.playoffSeries, finishedState, 1);

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesLead(clock, game2.teams, game2.goals, game2.playoffSeries, finishedState, 'ANA', 2, 1);
    });

    it('should not increase win counts for "not started" or "in progress" games after all finished games have ended', () => {
      const clock = { end: true };
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesTied(clock, game1.teams, game1.goals, game1.playoffSeries, inProgressState, 1);

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesLead(clock, game2.teams, game2.goals, game2.playoffSeries, notStartedState, 'ANA', 2, 1);
    });

    it('should increase the winning teams\' win counts after all games have ended', () => {
      const clock = { end: true };
      const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
      assertPlayoffSeriesLead(clock, game1.teams, game1.goals, game1.playoffSeries, finishedState, 'STL', 2, 1, '.fade-in');

      const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
      assertPlayoffSeriesTied(clock, game2.teams, game2.goals, game2.playoffSeries, finishedState, 2, '.fade-in');
    });
  });

});

function assertGoalCounts(clock, {state = finishedState, teams, goals}, awayGoals, homeGoals, visibilityClass = '.fade-in') {
  const teamPanels = getTeamPanels(gameScore(clock, { status: { state }, teams, goals }));
  const expected = expectedTeamPanels(teams, awayGoals, homeGoals, visibilityClass);
  assert.deepEqual(teamPanels, expected);
}

function assertDelimiter(clock, {state = finishedState, teams, goals}, delimiter, visibilityClass = '.fade-in') {
  const delimiterNode = getDelimiter(gameScore(clock, { status: { state }, teams, goals }));
  const expected = expectedDelimiter(delimiter, visibilityClass);
  assert.deepEqual(delimiterNode, expected);
}

function assertLatestGoal(clock, teams, goals, expectedLatestGoal) {
  const latestGoalPanel = getLatestGoalPanel(gameScore(clock, { status: { state: finishedState }, teams, goals }));
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

function assertPreGameInfoIsShown(clock, {status, teams, goals}) {
  assertPreGameInfo(clock, { status, teams, goals }, assert.deepEqual);
}
function assertPreGameInfoIsNotShown(clock, {status, teams, goals}) {
  assertPreGameInfo(clock, { status, teams, goals }, assert.notDeepEqual);
}
function assertPreGameInfo(clock, {status, teams, goals}, assertFn) {
  const preGameInfo = getPreGameInfo(gameScore(clock, { status, teams, goals }));
  assertFn(preGameInfo.sel, 'div.game__pre-game-info-panel');
}

function assertPreGameStats(clock, {state = finishedState, teams, goals, records}, renderedRecords) {
  const preGameStats = getPreGameStats(gameScore(clock, { status: { state }, teams, goals, records }));
  const expected = expectedPreGameStats(renderedRecords);
  assert.deepEqual(preGameStats, expected);
}

function assertPreGameDescription(clock, {status, teams, goals }, description) {
  const preGameDescription = getPreGameDescription(gameScore(clock, { status, teams, goals }));
  const expected = expectedPreGameDescription(description);
  assert.deepEqual(preGameDescription, expected);
}

function assertPlayoffSeriesLead(clock, teams, goals, playoffSeries, state, leadingTeam, leadingWins, trailingWins, animationClass) {
  return assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, state, animationClass, [
    span('.series-wins__leading-team', leadingTeam),
    ' leads ',
    span('.series-wins__leading-count', String(leadingWins)),
    span('.series-wins__delimiter', '–'),
    span('.series-wins__trailing-count', String(trailingWins))
  ]);
}

function assertPlayoffSeriesTied(clock, teams, goals, playoffSeries, state, wins, animationClass) {
  return assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, state, animationClass, [
    'Series ',
    span('.series-wins__tied', 'tied'),
    ' ',
    span('.series-wins__tied-count', String(wins)),
    span('.series-wins__delimiter', '–'),
    span('.series-wins__tied-count', String(wins))
  ]);
}

function assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, state, animationClass, expectedSeriesWinsVtree) {
  const playoffSeriesWinsPanel = getPlayoffSeriesWinsPanel(gameScore(clock, { status: { state }, teams, goals, playoffSeries }));
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
  return vtree.children[0].children
    .filter(node => _.includes(stripHtmlElement(node.sel).split('.'), className));
}

function getLatestGoalPanel(vtree) {
  return vtree.children[1];
}

function getPreGameInfo(vtree) {
  return vtree.children[1];
}

function getPreGameStats(vtree) {
  return vtree.children[1].children[0];
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
      span('.team-panel__team-name', teams.away),
      span('.team-panel__team-score' + visibilityClass, [awayGoals])
    ]),
    div('.team-panel.team-panel--home', [
      span('.team-panel__team-score' + visibilityClass, [homeGoals]),
      span('.team-panel__team-name', teams.home)
    ])
  ];
}

function expectedDelimiter(delimiter, visibilityClass) {
  return div('.team-panel__delimiter' + visibilityClass, delimiter);
}

function expectedLatestGoalPanel(latestGoal) {
  return div('.game__latest-goal-panel', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : '')
  ]);
}

function expectedPreGameStats({away, home}) {
  const valueClass = '.pre-game-stats__value';
  return div('.pre-game-stats', [
    span(`${valueClass}${valueClass}--away${away.className ? valueClass + away.className : ''}`, away.record),
    span('.pre-game-stats__label', 'Record'),
    span(`${valueClass}${valueClass}--home${home.className ? valueClass + home.className : ''}`, home.record),
  ]);
}

function expectedPreGameDescription(description) {
  return div('.pre-game-description.fade-in', description);
}

function expectedPlayoffSeriesWinsPanel(seriesWinsVtree, animationClass) {
  return seriesWinsVtree ?
    div(`.game__series-wins${animationClass || ''}`, seriesWinsVtree) :
    seriesWinsVtree;
}
