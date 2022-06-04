import { div, span, VNode } from '@cycle/dom';
import { assert } from 'chai';
import _ from 'lodash';

import Game from 'app/js/components/game';
import { renderTeamLogo } from 'app/js/utils/logos';
import type { Game as GameT, GameDisplay, GameStatus, Goal, Teams } from 'app/js/types';

import {
  scoresAllRegularTime,
  scoresMultipleOvertime,
  scoresOvertimeAndMultipleShootout,
} from '../data';
import { getGameCard } from './test-utils';

describe('score panel', () => {
  describe('goal counts', () => {
    it('should be hidden in the pre-game info', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts('pre-game', { teams }, [], 0, 0, '.team-panel__team-score--hidden');
    });

    it('should show zero goals before the playback has reached the first goal scoring time', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertGoalCounts('playback', { teams }, [], 0, 0);
    });

    it('should show current goal counts when goals have been scored', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts('playback', { teams }, _.take(goals, 2), 1, 1);
    });

    it('should show all the goals of the game when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertGoalCounts('post-game-finished', { teams }, goals, 2, 3);
    });

    it('should show goals scored in overtime', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertGoalCounts('playback', { teams }, goals, 1, 0);
    });
  });

  describe('goal delimiter', () => {
    it('should show "at" in the pre-game info', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter('pre-game', { teams }, goals, 'at', '');
    });

    it('should not be shown during the playback of a started game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter('playback', { teams }, goals, '');
    });

    it('should show "OT" when the playback reaches the scoring time of an overtime goal', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertDelimiter('playback', { teams }, goals, span('.team-panel__delimiter-period', 'OT'));
    });

    it('should not be shown when the playback reaches shootout but there is no shootout goal', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertDelimiter('playback', { teams }, goals, '');
    });

    it('should show "SO" when the playback reaches shootout and the game has a shootout goal', () => {
      const { teams, goals } = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter('playback', { teams }, goals, span('.team-panel__delimiter-period', 'SO'));
    });

    it('should show the period of the last goal when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresOvertimeAndMultipleShootout.games[1];
      assertDelimiter(
        'post-game-finished',
        { teams },
        goals,
        span('.team-panel__delimiter-period', 'SO'),
      );
    });
  });
});

function assertGoalCounts(
  gameDisplay: GameDisplay,
  { state = 'FINAL', teams }: { state?: GameStatus['state']; teams: Teams },
  currentGoals: Goal[],
  awayGoals: number,
  homeGoals: number,
  visibilityClass = '.fade-in',
) {
  const teamPanels = getTeamPanels(
    Game(gameDisplay, { status: { state }, teams } as GameT, currentGoals, 0),
  );
  const expected = expectedTeamPanels(teams, awayGoals, homeGoals, visibilityClass);
  assert.deepEqual(teamPanels, expected);
}

function assertDelimiter(
  gameDisplay: GameDisplay,
  { state = 'FINAL', teams }: { state?: GameStatus['state']; teams: Teams },
  currentGoals: Goal[],
  delimiter: VNode | string,
  visibilityClass = '.fade-in',
) {
  const delimiterNode = getDelimiter(
    Game(gameDisplay, { status: { state } as GameStatus, teams } as GameT, currentGoals, 0),
  );
  const expected = expectedDelimiter(delimiter, visibilityClass);
  assert.deepEqual(delimiterNode, expected);
}

function getTeamPanels(vtree: VNode) {
  return getGameChildrenWithClass(vtree, 'team-panel');
}

function getDelimiter(vtree: VNode) {
  return getGameChildrenWithClass(vtree, 'team-panel__delimiter')?.[0];
}

function getGameChildrenWithClass(vtree: VNode, className: string) {
  const stripHtmlElement = (sel?: string) => sel?.replace(/^\w\./, '');
  return (getGameCard(vtree)?.children?.[0] as VNode)?.children?.filter((node) =>
    _.includes(stripHtmlElement(typeof node !== 'string' ? node.sel : node)?.split('.'), className),
  );
}

function expectedTeamPanels(
  teams: Teams,
  awayGoals: number,
  homeGoals: number,
  visibilityClass: string,
) {
  return [
    div('.team-panel.team-panel--away', [
      span('.team-logo', [
        renderTeamLogo(
          teams.away.id,
          `team-logo__image team-logo__image--away team-logo__image--${teams.away.id}`,
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
          `team-logo__image team-logo__image--home team-logo__image--${teams.home.id}`,
        ),
      ]),
    ]),
  ];
}

function expectedDelimiter(delimiter: VNode | string, visibilityClass: string) {
  return div(`.team-panel__delimiter${visibilityClass}`, delimiter);
}
