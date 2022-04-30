import { assert } from 'chai';

import Game from 'app/js/components/game';
import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_PLAYBACK,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
  GAME_STATE_FINISHED,
  GAME_STATE_IN_PROGRESS,
} from 'app/js/events/constants';

import scoresAllRegularTime from '../../data/latest.json';
import { getGameCard } from '../../test-utils';
import { expectedStat } from './test-utils';

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

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.shots, {
      away: { value: 25 },
      home: { value: 25 },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.shots, {
      away: { value: 25 },
      home: { value: 32, className: '--highlight' },
      label,
    });
  });

  it('should show blocked shots, highlighting the larger one', () => {
    const label = 'Blocked';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.blocked, {
      away: { value: 5 },
      home: { value: 5 },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.blocked, {
      away: { value: 5 },
      home: { value: 7, className: '--highlight' },
      label,
    });
  });

  it('should show penalty minutes, highlighting the smaller one', () => {
    const label = 'Penalty min';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.penaltyMin, {
      away: { value: 6 },
      home: { value: 6 },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.penaltyMin, {
      away: { value: 13 },
      home: { value: 6, className: '--highlight' },
      label,
    });
  });

  it('should show hits, highlighting the larger one', () => {
    const label = 'Hits';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.hits, {
      away: { value: 22 },
      home: { value: 22 },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.hits, {
      away: { value: 26, className: '--highlight' },
      home: { value: 22 },
      label,
    });
  });

  it('should show giveaways, highlighting the smaller one', () => {
    const label = 'Giveaways';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.giveaways, {
      away: { value: 8 },
      home: { value: 8 },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.giveaways, {
      away: { value: 11 },
      home: { value: 8, className: '--highlight' },
      label,
    });
  });

  it('should show takeaways, highlighting the larger one', () => {
    const label = 'Takeaways';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.takeaways, {
      away: { value: 5 },
      home: { value: 5 },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.takeaways, {
      away: { value: 5 },
      home: { value: 10, className: '--highlight' },
      label,
    });
  });

  it('should show power plays, highlighting the more efficient one', () => {
    const label = 'Power play';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.powerPlay, {
      away: { value: '2/4' },
      home: { value: '1/2' },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.powerPlay, {
      away: { value: '2/4', className: '--highlight' },
      home: { value: '1/3' },
      label,
    });
  });

  it('should show faceoff percentages, highlighting the better one', () => {
    const label = 'Faceoff-%';

    assertGameStats(gameDisplay, scoresAllRegularTime.games[0], statIndexes.faceOffs, {
      away: { value: '50.0' },
      home: { value: '50.0' },
      label,
    });

    assertGameStats(gameDisplay, scoresAllRegularTime.games[1], statIndexes.faceOffs, {
      away: { value: '51.1', className: '--highlight' },
      home: { value: '48.9' },
      label,
    });
  });
});

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

function getGameStats(vtree) {
  return getGameCard(vtree).children[1].children[2];
}
