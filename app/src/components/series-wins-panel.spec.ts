import { div, span, VNode } from '@cycle/dom';
import { assert } from 'chai';
import _ from 'lodash';

import {
  scoresAllRegularTime,
  scoresAllRegularTimePlayoffs,
  scoresRegularTimeAndOvertimePlayoffs,
} from '../test/data';
import type {
  Game as GameT,
  GameDisplay,
  GameStatus,
  Goal,
  TeamAbbreviation,
  Teams,
  TeamStats,
} from '../types';
import Game from './game';
import { getGameCard } from './test-utils';

describe('playoff series wins panel', () => {
  it('should not exist if there is no playoff series information', () => {
    const { teams, goals, preGameStats } = scoresAllRegularTime.games[1];
    assertPlayoffSeriesWins('playback', teams, goals, preGameStats, 'FINAL', undefined, null);
  });

  it('should show "<Round> - Game 1" for first game of the series', () => {
    const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[2];
    assertPlayoffSeriesWins(
      'playback',
      teams,
      goals,
      preGameStats,
      'FINAL',
      undefined,
      '1st round - Game 1',
    );
  });

  it('should show the series tied when teams have the same amount of wins', () => {
    const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[0];
    assertPlayoffSeriesTied('playback', teams, goals, preGameStats, 'FINAL', 1);
  });

  it('should show the team that has more wins leading the series', () => {
    const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
    assertPlayoffSeriesLead('playback', teams, goals, preGameStats, 'FINAL', 'NYR', 2, 1);
  });

  it('should show the team that has reached 3 wins winning the series in round 0', () => {
    const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
    const modifiedPreGameStats = _.cloneDeep(preGameStats);
    modifiedPreGameStats!.playoffSeries!.round = 0;
    modifiedPreGameStats!.playoffSeries!.wins.NYR = 3;
    assertPlayoffSeriesLead(
      'playback',
      teams,
      goals,
      modifiedPreGameStats,
      'FINAL',
      'NYR',
      3,
      1,
      undefined,
      'wins',
    );
  });

  it('should show the team that has reached 4 wins winning the series in round 1', () => {
    const { teams, goals, preGameStats } = scoresAllRegularTimePlayoffs.games[1];
    const modifiedPreGameStats = _.cloneDeep(preGameStats);
    modifiedPreGameStats!.playoffSeries!.round = 1;
    modifiedPreGameStats!.playoffSeries!.wins.NYR = 4;
    assertPlayoffSeriesLead(
      'playback',
      teams,
      goals,
      modifiedPreGameStats,
      'FINAL',
      'NYR',
      4,
      1,
      undefined,
      'wins',
    );
  });

  it("should not increase the winning teams' win counts until all games have ended", () => {
    const gameDisplay = 'playback';
    const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
    assertPlayoffSeriesTied(gameDisplay, game1.teams, game1.goals, game1.preGameStats, 'FINAL', 1);

    const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
    assertPlayoffSeriesLead(
      gameDisplay,
      game2.teams,
      game2.goals,
      game2.preGameStats,
      'FINAL',
      'ANA',
      2,
      1,
    );
  });

  it('should not increase win counts for "not started" or "in progress" games after all finished games have ended', () => {
    const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
    assertPlayoffSeriesTied('in-progress', game1.teams, game1.goals, game1.preGameStats, 'LIVE', 1);

    const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
    assertPlayoffSeriesLead(
      'pre-game',
      game2.teams,
      game2.goals,
      game2.preGameStats,
      'PREVIEW',
      'ANA',
      2,
      1,
    );
  });

  it("should increase the winning teams' win counts after all games have ended", () => {
    const gameDisplay = 'post-game-finished';
    const game1 = scoresRegularTimeAndOvertimePlayoffs.games[0];
    assertPlayoffSeriesLead(
      gameDisplay,
      game1.teams,
      game1.goals,
      game1.preGameStats,
      'FINAL',
      'STL',
      2,
      1,
      '.fade-in',
    );

    const game2 = scoresRegularTimeAndOvertimePlayoffs.games[1];
    assertPlayoffSeriesTied(
      gameDisplay,
      game2.teams,
      game2.goals,
      game2.preGameStats,
      'FINAL',
      2,
      '.fade-in',
    );
  });
});

function assertPlayoffSeriesLead(
  gameDisplay: GameDisplay,
  teams: Teams,
  goals: Goal[],
  preGameStats: TeamStats | undefined,
  state: GameStatus['state'],
  leadingTeam: TeamAbbreviation,
  leadingWins: number,
  trailingWins: number,
  animationClass?: string,
  leadingText = 'leads',
) {
  return assertPlayoffSeriesWins(gameDisplay, teams, goals, preGameStats, state, animationClass, [
    span('.series-wins__leading-team', leadingTeam),
    ` ${leadingText} `,
    span('.series-wins__leading-count', String(leadingWins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__trailing-count', String(trailingWins)),
  ]);
}

function assertPlayoffSeriesTied(
  gameDisplay: GameDisplay,
  teams: Teams,
  goals: Goal[],
  preGameStats: TeamStats | undefined,
  state: GameStatus['state'],
  wins: number,
  animationClass?: string,
) {
  return assertPlayoffSeriesWins(gameDisplay, teams, goals, preGameStats, state, animationClass, [
    'Series ',
    span('.series-wins__tied', 'tied'),
    ' ',
    span('.series-wins__tied-count', String(wins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__tied-count', String(wins)),
  ]);
}

function assertPlayoffSeriesWins(
  gameDisplay: GameDisplay,
  teams: Teams,
  goals: Goal[],
  preGameStats: TeamStats | undefined,
  state: GameStatus['state'],
  animationClass: string | undefined,
  expectedSeriesWinsVtree: (VNode | string)[] | string | null,
) {
  const playoffSeriesWinsPanel = getPlayoffSeriesWinsPanel(
    Game(gameDisplay, { status: { state }, teams, preGameStats } as GameT, goals, 0),
  );
  const expected = expectedPlayoffSeriesWinsPanel(expectedSeriesWinsVtree, animationClass);
  assert.deepEqual(playoffSeriesWinsPanel, expected);
}

function getPlayoffSeriesWinsPanel(vtree: VNode) {
  return getGameCard(vtree)?.children?.[2];
}

function expectedPlayoffSeriesWinsPanel(
  seriesWinsVtree: (VNode | string)[] | string | null,
  animationClass: string | undefined,
) {
  return seriesWinsVtree
    ? div(`.game__series-wins${animationClass || ''}`, seriesWinsVtree)
    : seriesWinsVtree;
}
