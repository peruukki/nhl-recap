import { div, VNode } from '@cycle/dom';
import _ from 'lodash';

import type { GameDisplay, Game as GameT, Goal } from '../types';
import ErrorsPanel from './errors-panel';
import InfoPanel from './info-panel';
import LinksPanel from './links-panel';
import ScorePanel from './score-panel';
import SeriesWinsPanel from './series-wins-panel';

export default function Game(
  gameDisplay: GameDisplay,
  { status, startTime, teams, gameStats, preGameStats, currentStats, links, errors }: GameT,
  currentGoals: Goal[],
  gameAnimationIndex: number,
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
        gameDisplay,
        startTime,
        teams,
        gameStats,
        preGameStats,
        currentStats,
        status,
        isPlayoffGame: !!preGameStats?.playoffSeries,
        currentGoals,
        latestGoal,
      }),
      SeriesWinsPanel({
        teams,
        awayGoals,
        homeGoals,
        playoffSeries: preGameStats?.playoffSeries,
        addCurrentGameToWins: gameDisplay === 'post-game-finished',
      }),
      LinksPanel({ gameDisplay, links }),
      ErrorsPanel(errors),
    ]),
  ]);
}
