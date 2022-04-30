import { div, span } from '@cycle/dom';
import { assert } from 'chai';
import _ from 'lodash';

import Game from 'app/js/components/game';
import {
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
} from 'app/js/events/constants';
import { renderTeamLogo } from 'app/js/utils/logos';

import scoresAllRegularTime from '../data/latest.json';
import scoresMultipleOvertime from '../data/latest-2-ot.json';
import scoresOvertimeAndMultipleShootout from '../data/latest-ot-2-so.json';
import { getGameCard } from '../test-utils';

describe('score panel', () => {
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
