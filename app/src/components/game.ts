import { div, type VNode } from '@cycle/dom';
import _ from 'lodash';

import type { GameDisplay, Game as GameT, Goal } from '../types';
import ErrorsPanel from './errors-panel';
import InfoPanel from './info-panel';
import LinksPanel from './links-panel';
import ScorePanel from './score-panel';
import SeriesWinsPanel from './series-wins-panel';

export default function Game(
  gameDisplay: GameDisplay,
  {
    status,
    startTime,
    teams,
    gameStats,
    preGameStats,
    currentStats,
    rosters,
    links,
    errors,
  }: GameT,
  currentGoals: Goal[],
  gameAnimationIndex: number,
  { showGamesLeft = false }: { showGamesLeft?: boolean } = {},
): VNode {
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter((goal) => goal.team === teams.away.abbreviation);
  const homeGoals = currentGoals.filter((goal) => goal.team === teams.home.abbreviation);

  return div('.game-container', [
    div(`.game.expand--${gameAnimationIndex}`, { class: { [`game--${gameDisplay}`]: true } }, [
      ScorePanel({
        teams,
        awayGoals,
        homeGoals,
        latestGoalPeriod: latestGoal?.period,
        isBeforeGame: gameDisplay === 'pre-game',
      }),
      InfoPanel({
        currentGoals,
        currentStats,
        gameDisplay,
        gameStats,
        isPlayoffGame: !!preGameStats?.playoffSeries,
        latestGoal,
        preGameStats,
        rosters,
        showGamesLeft,
        startTime,
        status,
        teams,
      }),
      div('.game__secondary-panel', [
        LinksPanel({ gameDisplay, links, teams }),
        SeriesWinsPanel({
          teams,
          awayGoals,
          homeGoals,
          playoffSeries: preGameStats?.playoffSeries,
          addCurrentGameToWins: gameDisplay === 'post-game-finished',
        }),
      ]),
      ErrorsPanel(errors),
    ]),
  ]);
}
