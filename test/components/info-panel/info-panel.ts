import { div, span, VNode } from '@cycle/dom';
import { assert } from 'chai';
import _ from 'lodash';

import Game from 'app/js/components/game';
import {
  renderLatestGoalAssists,
  renderLatestGoalScorer,
  renderLatestGoalTime,
} from 'app/js/components/info-panel/info-panel';
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
import { Game as GameT, GameStatus, Goal, Teams } from 'app/js/types';

import scoresAllRegularTime from '../../data/latest.json';
import scoresMultipleOvertime from '../../data/latest-2-ot.json';
import { getGameCard } from '../test-utils';

describe('info panel', () => {
  describe('latest goal panel', () => {
    it('should show nothing before the playback has reached the first goal scoring time', () => {
      const { teams } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_PLAYBACK, teams, [], null);
    });

    it('should show the latest goal when the playback reaches a goal scoring time', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_PLAYBACK, teams, _.take(goals, 1), _.first(goals) as Goal);
    });

    it('should show the last goal of the game when the playback reaches the end of the game', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_POST_GAME_FINISHED, teams, goals, _.last(goals) as Goal);
    });

    it('should show the last goal of the game after playback has reached current progress in in-progress games', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_IN_PROGRESS, teams, goals, _.last(goals) as Goal);
    });

    it('should show the last goal of an in-progress game when playback has finished', () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      assertLatestGoal(GAME_DISPLAY_POST_GAME_IN_PROGRESS, teams, goals, _.last(goals) as Goal);
    });

    it('should show goals scored in overtime', () => {
      const { teams, goals } = scoresMultipleOvertime.games[0];
      assertLatestGoal(GAME_DISPLAY_PLAYBACK, teams, goals, _.last(goals) as Goal);
    });
  });

  describe('game description', () => {
    it(`should show "Finished" description for game in ${GAME_STATE_FINISHED} state`, () => {
      const { teams, goals, status } = scoresAllRegularTime.games[1] as unknown as GameT;
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'Finished');
    });

    it(`should show game without progress information in ${GAME_STATE_IN_PROGRESS} state as in progress`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status = { state: GAME_STATE_IN_PROGRESS } as GameStatus;
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'In progress');
    });

    it(`should show time remaining progress for game in ${GAME_STATE_IN_PROGRESS} state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
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
          `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`,
        ),
      );
    });

    it(`should show time remaining progress for game in ${GAME_STATE_IN_PROGRESS} state after playback has reached current progress`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
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
          `${status.progress.currentPeriodOrdinal} ${status.progress.currentPeriodTimeRemaining.pretty}`,
        ),
      );
    });

    it(`should show end of period progress for game in ${GAME_STATE_IN_PROGRESS} state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
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
        expectedCurrentProgressDescription(`End of ${status.progress.currentPeriodOrdinal}`),
      );
    });

    it(`should not show remaining time for SO game in ${GAME_STATE_IN_PROGRESS} state`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = {
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
        expectedCurrentProgressDescription('In shootout'),
      );
    });

    it(`should show game in ${GAME_STATE_NOT_STARTED} state and start time in the past as starting soon`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = { state: GAME_STATE_NOT_STARTED };
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'Starts soon');
    });

    it(`should show game in ${GAME_STATE_NOT_STARTED} state and start time in the future as starting in some time`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = { state: GAME_STATE_NOT_STARTED };

      const time = new Date();
      time.setHours(time.getHours() + 3);
      time.setMinutes(time.getMinutes() + 1);
      const startTime = time.toISOString();

      assertGameDescription(
        GAME_DISPLAY_PRE_GAME,
        { status, startTime, teams },
        goals,
        'Starts in 3 hours',
      );
    });

    it(`should show game in ${GAME_STATE_POSTPONED} state as postponed`, () => {
      const { teams, goals } = scoresAllRegularTime.games[1];
      const status: GameStatus = { state: GAME_STATE_POSTPONED };
      assertGameDescription(GAME_DISPLAY_PRE_GAME, { status, teams }, goals, 'Postponed');
    });
  });
});

function assertLatestGoal(
  gameDisplay: string,
  teams: Teams,
  goals: Goal[],
  expectedLatestGoal: Goal | null,
) {
  const latestGoalPanel = getLatestGoalPanel(
    Game(
      gameDisplay,
      { status: { state: GAME_STATE_FINISHED }, teams } as unknown as GameT,
      goals,
      0,
    ),
  );
  const expected = expectedLatestGoalPanel(expectedLatestGoal);
  assert.deepEqual(latestGoalPanel, expected);
}

function assertGameDescription(
  gameDisplay: string,
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

function expectedCurrentProgressDescription(progressTime: string) {
  return ['In progress:', span('.game-description__value', progressTime)];
}

function expectedGameDescription(description: string | (string | VNode)[]) {
  return div('.game-description.fade-in', description);
}
