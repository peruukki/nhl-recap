import {h} from '@cycle/dom';
import _ from 'lodash';
import chai from 'chai';

import gameScore from '../app/js/game-score';
import scoresAllRegularTime from './data/latest.json';
import scoresMultipleOvertime from './data/latest-2-ot.json';
import scoresOvertimeAndShootout from './data/latest-ot-so.json';

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

    it('should show only one shootout goal, for the winning team', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndShootout[1];
      assertGoalCounts(clock, teams, goals, 2, 3);
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
      assertDelimiter(clock, teams, goals, h('span.period', 'OT'));
    });

    it('should show "–" when the clock reaches shootout but there is no shootout goal', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresAllRegularTime[1];
      assertDelimiter(clock, teams, goals, '–');
    });

    it('should show "SO" when the clock reaches shootout and the game has a shootout goal', () => {
      const clock = { period: 'SO' };
      const {teams, goals} = scoresOvertimeAndShootout[1];
      assertDelimiter(clock, teams, goals, h('span.period', 'SO'));
    });

    it('should show the period of the last goal when the clock reaches the end of the game', () => {
      const clock = { end: true };
      const {teams, goals} = scoresOvertimeAndShootout[1];
      assertDelimiter(clock, teams, goals, h('span.period', 'SO'));
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

function getTeamPanels(vtree) {
  return getGameChildrenWithClass(vtree, 'team-panel');
}

function getDelimiter(vtree) {
  return getGameChildrenWithClass(vtree, 'delimiter')[0];
}

function getGameChildrenWithClass(vtree, className) {
  return vtree.children
    .filter(node => _.includes(node.properties.className.split(' '), className));
}

function expectedTeamPanels(teams, awayGoals, homeGoals) {
  return [
    h('div.team-panel.away', [
      h('span.team-name', teams.away),
      h('span.team-score', [awayGoals])
    ]),
    h('div.team-panel.home', [
      h('span.team-score', [homeGoals]),
      h('span.team-name', teams.home)
    ])
  ];
}

function expectedDelimiter(delimiter) {
  return h('div.delimiter', delimiter);
}
