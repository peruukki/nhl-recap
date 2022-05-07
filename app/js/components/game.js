import { div } from '@cycle/dom';
import _ from 'lodash';

import { GAME_DISPLAY_POST_GAME_FINISHED, GAME_DISPLAY_PRE_GAME } from '../events/constants';
import ErrorsPanel from './errors-panel';
import InfoPanel from './info-panel';
import ScorePanel from './score-panel';
import SeriesWinsPanel from './series-wins-panel';

export default function Game(
  gameDisplay,
  { status, startTime, teams, gameStats, preGameStats = {}, currentStats = {}, errors },
  currentGoals,
  gameAnimationIndex
) {
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter((goal) => goal.team === teams.away.abbreviation);
  const homeGoals = currentGoals.filter((goal) => goal.team === teams.home.abbreviation);

  return div('.game-container', [
    div(`.game.expand--${gameAnimationIndex}`, { class: { [`game--${gameDisplay}`]: true } }, [
      ScorePanel({
        teams,
        awayGoals,
        homeGoals,
        latestGoalPeriod: latestGoal ? latestGoal.period : null,
        isBeforeGame: gameDisplay === GAME_DISPLAY_PRE_GAME,
      }),
      InfoPanel({
        gameDisplay,
        startTime,
        teams,
        gameStats,
        preGameStats,
        currentStats,
        status,
        isPlayoffGame: !!preGameStats.playoffSeries,
        latestGoal,
      }),
      SeriesWinsPanel({
        teams,
        awayGoals,
        homeGoals,
        playoffSeries: preGameStats.playoffSeries,
        addCurrentGameToWins: gameDisplay === GAME_DISPLAY_POST_GAME_FINISHED,
      }),
      ErrorsPanel(errors),
    ]),
  ]);
}
