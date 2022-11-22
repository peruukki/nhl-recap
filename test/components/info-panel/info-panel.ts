import { div, span, VNode } from '@cycle/dom';
import { assert } from 'chai';
import _ from 'lodash';

import Game from 'app/src/components/game';
import {
  renderLatestGoalAssists,
  renderLatestGoalScorer,
  renderLatestGoalTime,
} from 'app/src/components/info-panel/info-panel';
import type { Game as GameT, GameDisplay, GameStatus, Goal, Teams } from 'app/src/types';

import { renderTeamLogoSVG } from 'app/src/utils/logos';
import { scoresAllRegularTime, scoresMultipleOvertime } from '../../data';
import { getGameCard } from '../test-utils';

type PointScorer = { player: string; teamId: number; goals: number; assists: number };

describe('info panel', () => {
  describe('latest goal / summary panel', () => {
    it('should show nothing before the playback has reached the first goal scoring time', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertLatestGoal('playback', teams, [], null);
    });

    it('should show the latest goal when the playback reaches a goal scoring time', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal('playback', teams, _.take(goals, 1), _.first(goals) as Goal);
    });

    it('should show the summary when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const pointScorers = [
        { player: 'Derick Brassard', teamId: 3, goals: 2, assists: 1 },
        { player: 'Mats Zuccarello', teamId: 3, goals: 1, assists: 0 },
        { player: 'Corey Perry', teamId: 24, goals: 1, assists: 0 },
      ];
      assertSummary('summary-finished', teams, goals, pointScorers);
      assertSummary('post-game-finished', teams, goals, pointScorers);
    });

    it('should show the last goal of the game after playback has reached current progress in in-progress games', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal('in-progress', teams, goals, _.last(goals) as Goal);
    });

    it('should show the summary of an in-progress game when playback has finished', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const pointScorers = [
        { player: 'Derick Brassard', teamId: 3, goals: 2, assists: 1 },
        { player: 'Mats Zuccarello', teamId: 3, goals: 1, assists: 0 },
        { player: 'Corey Perry', teamId: 24, goals: 1, assists: 0 },
      ];
      assertSummary('summary-in-progress', teams, goals, pointScorers);
      assertSummary('post-game-in-progress', teams, goals, pointScorers);
    });

    it('should show goals scored in overtime', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertLatestGoal('playback', teams, goals, _.last(goals) as Goal);
    });
  });

  describe('game description', () => {
    it(`should show "Finished" description for game in FINAL state`, () => {
      const { teams, goals, status } = scoresAllRegularTime.games[1];
      assertGameDescription('pre-game', { status, teams }, goals, 'Finished');
    });

    it(`should show game without progress information in LIVE state as in progress`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: 'LIVE' } as GameStatus;
      assertGameDescription('pre-game', { status, teams }, goals, 'In progress');
    });

    it(`should show time remaining progress for game in LIVE state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
        state: 'LIVE',
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
        },
      };
      assertGameDescription(
        'pre-game',
        { status, teams },
        goals,
        expectedCurrentProgressDescription(
          `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`,
        ),
      );
    });

    it(`should show time remaining progress for game in LIVE state after playback has reached current progress`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
        state: 'LIVE',
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
        },
      };
      assertGameDescription(
        'in-progress',
        { status, teams },
        goals,
        expectedCurrentProgressDescription(
          `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`,
        ),
      );
    });

    it(`should show end of period progress for game in LIVE state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
        state: 'LIVE',
        progress: {
          currentPeriod: 1,
          currentPeriodOrdinal: '1st',
          currentPeriodTimeRemaining: { pretty: 'END', min: 0, sec: 0 },
        },
      };
      assertGameDescription(
        'pre-game',
        { status, teams },
        goals,
        expectedCurrentProgressDescription(`End of ${status.progress.currentPeriodOrdinal}`),
      );
    });

    it(`should not show remaining time for SO game in LIVE state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
        state: 'LIVE',
        progress: {
          currentPeriod: 5,
          currentPeriodOrdinal: 'SO',
          currentPeriodTimeRemaining: { pretty: '00:00', min: 0, sec: 0 },
        },
      };
      assertGameDescription(
        'pre-game',
        { status, teams },
        goals,
        expectedCurrentProgressDescription('In shootout'),
      );
    });

    it(`should show game in PREVIEW state and start time in the past as starting soon`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = { state: 'PREVIEW' };
      assertGameDescription('pre-game', { status, teams }, goals, 'Starts soon');
    });

    it(`should show game in PREVIEW state and start time in the future as starting in some time`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = { state: 'PREVIEW' };

      const time = new Date();
      time.setHours(time.getHours() + 3);
      time.setMinutes(time.getMinutes() + 1);
      const startTime = time.toISOString();

      assertGameDescription('pre-game', { status, startTime, teams }, goals, 'Starts in 3 hours');
    });

    it(`should show game in POSTPONED state as postponed`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = { state: 'POSTPONED' };
      assertGameDescription('pre-game', { status, teams }, goals, 'Postponed');
    });
  });
});

function assertLatestGoal(
  gameDisplay: GameDisplay,
  teams: Teams,
  goals: Goal[],
  expectedLatestGoal: Goal | null,
) {
  const latestGoalPanel = getLatestGoalPanel(
    Game(gameDisplay, { status: { state: 'FINAL' }, teams } as unknown as GameT, goals, 0),
  );
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

function assertSummary(
  gameDisplay: GameDisplay,
  teams: Teams,
  goals: Goal[],
  pointScorers: PointScorer[],
) {
  const summaryPanel = getSummaryPanel(
    Game(gameDisplay, { status: { state: 'FINAL' }, teams } as unknown as GameT, goals, 0),
  );
  const expected = expectedSummaryPanel(pointScorers);
  assert.deepEqual(summaryPanel, expected);
}

function assertGameDescription(
  gameDisplay: GameDisplay,
  { status, startTime, teams }: Partial<GameT>,
  goals: Goal[],
  description: string | (string | VNode)[],
) {
  const gameDescription = getGameDescription(
    Game(gameDisplay, { status, startTime, teams } as unknown as GameT, goals, 0),
  );
  const expected = expectedGameDescription(description);
  assert.deepEqual(gameDescription, expected);
}

function getLatestGoalPanel(vtree: VNode) {
  return (getGameCard(vtree)?.children?.[1] as VNode).children?.[0] as VNode | undefined;
}

function getSummaryPanel(vtree: VNode) {
  return getLatestGoalPanel(vtree);
}

function getGameDescription(vtree: VNode) {
  return (getGameCard(vtree)?.children?.[1] as VNode).children?.[1] as VNode | undefined;
}

function expectedLatestGoalPanel(latestGoal: Goal | null) {
  return div('.latest-goal', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : ''),
    div('.latest-goal__assists', latestGoal ? renderLatestGoalAssists(latestGoal) : ''),
  ]);
}

function expectedSummaryPanel(pointScorers: PointScorer[]) {
  return div('.summary.fade-in', [
    div('.summary__heading', 'Top scorers'),
    div(
      '.summary__point-scorers',
      pointScorers.map(({ player, teamId, goals, assists }) =>
        div('.summary__point-scorer', [
          renderTeamLogoSVG(teamId, `player-logo player-logo--${teamId}`),
          span('.player', player),
          span('.points', renderPointsText(goals, assists)),
        ]),
      ),
    ),
  ]);
}

function renderPointsText(goals: number, assists: number) {
  if (goals && assists) {
    return `${goals} G, ${assists} A`;
  }
  if (goals) {
    return `${goals} ${goals === 1 ? 'goal' : 'goals'}`;
  }
  return `${assists} ${assists === 1 ? 'assist' : 'assists'}`;
}

function expectedCurrentProgressDescription(progressTime: string) {
  return ['In progress:', span('.game-description__value', progressTime)];
}

function expectedGameDescription(description: string | (string | VNode)[]) {
  return div('.game-description.fade-in', description);
}
