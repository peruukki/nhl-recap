import {div, span} from '@cycle/dom';
import _ from 'lodash';
import chai from 'chai';

import {default as gameScore, renderLatestGoalTime, renderLatestGoalScorer} from '../app/js/game-score';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from './data/latest-ot-2-so.json';
import scoresAllRegularTimePlayoffs from './data/latest-playoffs.json';

const assert = chai.assert;

describe('gameScore', () => {

  describe('goal counts', () => {

    it('should show zero goals in the beginning', () => {
      const clock = { start: true };
      const {teams, goals} = scoresAllRegularTime[1];
      assertGoalCounts(clock, teams, goals, 0, 0);
    });

    it('should show zero goals before the clock has reached the first goal scoring time', () => {
      const clock = { period: 1, minute: 10, second: 0 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertGoalCounts(clock, teams, goals, 0, 0);
    });

    it('should show increase the goal count when the clock reaches a goal scoring time', () => {
      const clock = { period: 1, minute: 8, second: 44 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertGoalCounts(clock, teams, goals, 1, 0);
    });

    it('should show all the goals of the period when the clock reaches the end of the period', () => {
      const clock = { period: 1, end: true, minute: 0, second: 0 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertGoalCounts(clock, teams, goals, 1, 1);
    });

    it('should show all the goals of the game when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresAllRegularTime[1];
      assertGoalCounts(clock, teams, goals, 2, 3);
    });

    it('should show all the goals of the first period when the clock is running in the second period', () => {
      const clock = { period: 2, minute: 10, second: 0 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertGoalCounts(clock, teams, goals, 1, 1);
    });

    it('should show goals scored in overtime', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const {teams, goals} = scoresMultipleOvertime[0];
      assertGoalCounts(clock, teams, goals, 1, 0);
    });

    it('should show only one shootout goal, for the winning (home) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout[1];
      assertGoalCounts(clock, teams, goals, 2, 3);
    });

    it('should show only one shootout goal, for the winning (away) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout[2];
      assertGoalCounts(clock, teams, goals, 2, 1);
    });

  });

  describe('goal delimiter', () => {

    it('should show "–" when the clock is running in regulation', () => {
      const clock = { period: 3, minute: 19, second: 2 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertDelimiter(clock, teams, goals, '–');
    });

    it('should show "–" when the clock is running in overtime but there has been no overtime goal', () => {
      const clock = { period: 'OT', minute: 2, second: 56 };
      const {teams, goals} = scoresMultipleOvertime[0];
      assertDelimiter(clock, teams, goals, '–');
    });

    it('should show "OT" when the clock reaches the scoring time of an overtime goal', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const {teams, goals} = scoresMultipleOvertime[0];
      assertDelimiter(clock, teams, goals, span('.team-panel__delimiter-period', 'OT'));
    });

    it('should show "–" when the clock reaches shootout but there is no shootout goal', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresAllRegularTime[1];
      assertDelimiter(clock, teams, goals, '–');
    });

    it('should show "SO" when the clock reaches shootout and the game has a shootout goal', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout[1];
      assertDelimiter(clock, teams, goals, span('.team-panel__delimiter-period', 'SO'));
    });

    it('should show the period of the last goal when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresOvertimeAndMultipleShootout[1];
      assertDelimiter(clock, teams, goals, span('.team-panel__delimiter-period', 'SO'));
    });

  });

  describe('latest goal panel', () => {

    it('should show nothing in the beginning', () => {
      const clock = { start: true };
      const {teams, goals} = scoresAllRegularTime[1];
      assertLatestGoal(clock, teams, goals, null);
    });

    it('should show nothing before the clock has reached the first goal scoring time', () => {
      const clock = { period: 1, minute: 10, second: 0 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertLatestGoal(clock, teams, goals, null);
    });

    it('should show the latest goal when the clock reaches a goal scoring time', () => {
      const clock = { period: 1, minute: 8, second: 44 };
      const {teams, goals} = scoresAllRegularTime[1];
      assertLatestGoal(clock, teams, goals, _.first(goals));
    });

    it('should show the last goal of the game when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresAllRegularTime[1];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

    it('should show goals scored in overtime', () => {
      const clock = { period: 'OT', minute: 2, second: 55 };
      const {teams, goals} = scoresMultipleOvertime[0];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

    it('should show the last shootout goal of the winning (home) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout[1];
      assertLatestGoal(clock, teams, goals, _.last(_.dropRight(goals)));
    });

    it('should show the last shootout goal of the winning (away) team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndMultipleShootout[2];
      assertLatestGoal(clock, teams, goals, _.last(goals));
    });

  });

  describe('playoff series wins panel', () => {

    it('should not exist if there is no playoff series information', () => {
      const clock = { start: true };
      const {teams, goals, playoffSeries} = scoresAllRegularTime[1];
      assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, undefined);
    });

    it('should show the series tied when teams have the same amount of wins', () => {
      const clock = { start: true };
      const {teams, goals, playoffSeries} = scoresAllRegularTimePlayoffs[0];
      assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, [
        'Series ',
        span('.series-wins__tied', 'tied'),
        ' ',
        span('.series-wins__tied-count', '1'),
        span('.series-wins__delimiter', '–'),
        span('.series-wins__tied-count', '1')
      ]);
    });

    it('should show the team that has more wins leading the series', () => {
      const clock = { start: true };
      const {teams, goals, playoffSeries} = scoresAllRegularTimePlayoffs[1];
      assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, [
        span('.series-wins__leading-team', 'NYR'),
        ' leads ',
        span('.series-wins__leading-count', '2'),
        span('.series-wins__delimiter', '–'),
        span('.series-wins__trailing-count', '1')
      ]);
    });
  });

});

function assertGoalCounts(clock, teams, goals, awayGoals, homeGoals) {
  const teamPanels = getTeamPanels(gameScore(clock, teams, goals));
  const expected = expectedTeamPanels(teams, awayGoals, homeGoals);
  assert.deepEqual(teamPanels, expected);
}

function assertDelimiter(clock, teams, goals, delimiter) {
  const delimiterNode = getDelimiter(gameScore(clock, teams, goals));
  const expected = expectedDelimiter(delimiter);
  assert.deepEqual(delimiterNode, expected);
}

function assertLatestGoal(clock, teams, goals, expectedLatestGoal) {
  const latestGoalPanel = getLatestGoalPanel(gameScore(clock, teams, goals));
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

function assertPlayoffSeriesWins(clock, teams, goals, playoffSeries, expectedSeriesWinsVtree) {
  const playoffSeriesWinsPanel = getPlayoffSeriesWinsPanel(gameScore(clock, teams, goals, playoffSeries));
  const expected = expectedPlayoffSeriesWinsPanel(expectedSeriesWinsVtree);
  assert.deepEqual(playoffSeriesWinsPanel, expected);
}

function getTeamPanels(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel');
}

function getDelimiter(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel__delimiter')[0];
}

function getGameChildrenWithClass(vtree, className) {
  return vtree.children[0].children
    .filter(node => _.includes(node.properties.className.split(' '), className));
}

function getLatestGoalPanel(vtree) {
  return vtree.children[1];
}

function getPlayoffSeriesWinsPanel(vtree) {
  return vtree.children[2];
}

function expectedTeamPanels(teams, awayGoals, homeGoals) {
  return [
    div('.team-panel.team-panel--away', [
      span('.team-panel__team-name', teams.away),
      span('.team-panel__team-score', [awayGoals])
    ]),
    div('.team-panel.team-panel--home', [
      span('.team-panel__team-score', [homeGoals]),
      span('.team-panel__team-name', teams.home)
    ])
  ];
}

function expectedDelimiter(delimiter) {
  return div('.team-panel__delimiter', delimiter);
}

function expectedLatestGoalPanel(latestGoal) {
  return div('.game__latest-goal-panel', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : '')
  ]);
}

function expectedPlayoffSeriesWinsPanel(seriesWinsVtree) {
  return seriesWinsVtree ?
    div('.game__series-wins', seriesWinsVtree) :
    seriesWinsVtree;
}
