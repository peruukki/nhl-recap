import { VNode } from '@cycle/dom';
import { assert } from 'chai';

import Game from 'app/js/components/game';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
} from 'app/js/events/constants';
import { Game as GameT, GameStatus, Goal } from 'app/js/types';

import scoresAllRegularTime from '../../data/latest.json';
import { getGameCard } from '../test-utils';
import { expectedStat, StatValue } from './test-utils';

const inProgressGameProgress = {
  currentPeriod: 1,
  currentPeriodOrdinal: '1st',
  currentPeriodTimeRemaining: { pretty: '08:42', min: 8, sec: 42 },
};

const statIndexes = {
  shots: 1,
  blocked: 2,
  penaltyMin: 3,
  hits: 4,
  giveaways: 5,
  takeaways: 6,
  powerPlay: 7,
  faceOffs: 8,
};

describe('game stats', () => {
  const gameDisplay = GAME_DISPLAY_POST_GAME_FINISHED;

  it('should not be shown when game display state is pre-game', () => {
    const status: GameStatus = { state: 'FINAL' };
    const { teams, goals, gameStats } = scoresAllRegularTime.games[1] as unknown as GameT;
    assertGameStatsAreNotShown(GAME_DISPLAY_PRE_GAME, { status, teams, gameStats }, goals);
  });

  it('should not be shown after playback has started for in-progress games', () => {
    const status = { state: 'LIVE' } as GameStatus;
    const { teams, goals, gameStats } = scoresAllRegularTime.games[1] as unknown as GameT;
    assertGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams, gameStats }, goals);
  });

  it('should not be shown when playback has not reached current progress in in-progress games', () => {
    const status: GameStatus = { state: 'LIVE', progress: inProgressGameProgress };
    const { teams, goals, gameStats } = scoresAllRegularTime.games[1] as unknown as GameT;
    assertGameStatsAreNotShown(GAME_DISPLAY_PLAYBACK, { status, teams, gameStats }, goals);
  });

  it('should not be shown after playback has reached current progress in in-progress games', () => {
    const status: GameStatus = { state: 'LIVE', progress: inProgressGameProgress };
    const { teams, goals, gameStats } = scoresAllRegularTime.games[1] as unknown as GameT;
    assertGameStatsAreNotShown(GAME_DISPLAY_IN_PROGRESS, { status, teams, gameStats }, goals);
  });

  it('should be shown after playback has finished for finished games', () => {
    const status: GameStatus = { state: 'FINAL' };
    const { teams, goals, gameStats } = scoresAllRegularTime.games[1] as unknown as GameT;
    assertGameStatsAreShown(GAME_DISPLAY_POST_GAME_FINISHED, { status, teams, gameStats }, goals);
  });

  it('should be shown after playback has finished for in-progress games', () => {
    const status: GameStatus = { state: 'LIVE', progress: inProgressGameProgress };
    const { teams, goals, gameStats } = scoresAllRegularTime.games[1] as unknown as GameT;
    assertGameStatsAreShown(
      GAME_DISPLAY_POST_GAME_IN_PROGRESS,
      { status, teams, gameStats },
      goals,
    );
  });

  it('should show shots, highlighting the larger one', () => {
    const label = 'Shots';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.shots,
      {
        away: { value: 25 },
        home: { value: 25 },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.shots,
      {
        away: { value: 25 },
        home: { value: 32, className: '--highlight' },
        label,
      },
    );
  });

  it('should show blocked shots, highlighting the larger one', () => {
    const label = 'Blocked';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.blocked,
      {
        away: { value: 5 },
        home: { value: 5 },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.blocked,
      {
        away: { value: 5 },
        home: { value: 7, className: '--highlight' },
        label,
      },
    );
  });

  it('should show penalty minutes, highlighting the smaller one', () => {
    const label = 'Penalty min';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.penaltyMin,
      {
        away: { value: 6 },
        home: { value: 6 },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.penaltyMin,
      {
        away: { value: 13 },
        home: { value: 6, className: '--highlight' },
        label,
      },
    );
  });

  it('should show hits, highlighting the larger one', () => {
    const label = 'Hits';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.hits,
      {
        away: { value: 22 },
        home: { value: 22 },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.hits,
      {
        away: { value: 26, className: '--highlight' },
        home: { value: 22 },
        label,
      },
    );
  });

  it('should show giveaways, highlighting the smaller one', () => {
    const label = 'Giveaways';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.giveaways,
      {
        away: { value: 8 },
        home: { value: 8 },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.giveaways,
      {
        away: { value: 11 },
        home: { value: 8, className: '--highlight' },
        label,
      },
    );
  });

  it('should show takeaways, highlighting the larger one', () => {
    const label = 'Takeaways';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.takeaways,
      {
        away: { value: 5 },
        home: { value: 5 },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.takeaways,
      {
        away: { value: 5 },
        home: { value: 10, className: '--highlight' },
        label,
      },
    );
  });

  it('should show power plays, highlighting the more efficient one', () => {
    const label = 'Power play';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.powerPlay,
      {
        away: { value: '2/4' },
        home: { value: '1/2' },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.powerPlay,
      {
        away: { value: '2/4', className: '--highlight' },
        home: { value: '1/3' },
        label,
      },
    );
  });

  it('should show faceoff percentages, highlighting the better one', () => {
    const label = 'Faceoff-%';

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[0] as unknown as GameT,
      statIndexes.faceOffs,
      {
        away: { value: '50.0' },
        home: { value: '50.0' },
        label,
      },
    );

    assertGameStats(
      gameDisplay,
      scoresAllRegularTime.games[1] as unknown as GameT,
      statIndexes.faceOffs,
      {
        away: { value: '51.1', className: '--highlight' },
        home: { value: '48.9' },
        label,
      },
    );
  });
});

function assertGameStatsAreShown(
  gameDisplay: string,
  { status, teams, gameStats }: Partial<GameT>,
  goals: Goal[],
) {
  assertGameStatsExistence(
    gameDisplay,
    { status, teams, gameStats },
    goals,
    assert.deepEqual,
    'div.stats.stats--game-stats',
  );
}
function assertGameStatsAreNotShown(
  gameDisplay: string,
  { status, teams, gameStats }: Partial<GameT>,
  goals: Goal[],
) {
  assertGameStatsExistence(
    gameDisplay,
    { status, teams, gameStats },
    goals,
    assert.notDeepEqual,
    'div.stats.stats--game-stats',
  );
}
function assertGameStatsExistence(
  gameDisplay: string,
  { status, teams, gameStats }: Partial<GameT>,
  goals: Goal[],
  assertFn: (actual: string | undefined, expected: string) => void,
  selector: string,
) {
  const stats = getGameStats(Game(gameDisplay, { status, teams, gameStats } as GameT, goals, 0));
  assertFn(stats?.sel, selector);
}

function assertGameStats(
  gameDisplay: string,
  { state = 'FINAL', teams, goals, gameStats }: GameT & Partial<GameStatus>,
  statIndex: number,
  renderedRecords: {
    away: StatValue;
    home: StatValue;
    label: string;
  },
) {
  const renderedStats = getGameStats(
    Game(gameDisplay, { status: { state }, teams, gameStats } as GameT, goals, 0),
  )?.children?.[statIndex];
  const expected = expectedStat(renderedRecords);
  assert.deepEqual(renderedStats, expected);
}

function getGameStats(vtree: VNode) {
  return (getGameCard(vtree)?.children?.[1] as VNode).children?.[2] as VNode | undefined;
}
