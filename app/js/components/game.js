import { div } from '@cycle/dom';
import _ from 'lodash';

import {
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
} from '../events/constants';
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
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away.abbreviation);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home.abbreviation);
  const showGameStats =
    gameStats &&
    [GAME_DISPLAY_POST_GAME_FINISHED, GAME_DISPLAY_POST_GAME_IN_PROGRESS].includes(gameDisplay);
  const showPreGameStats = [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_POST_GAME_IN_PROGRESS].includes(
    gameDisplay
  );
  const showAfterGameStats = gameDisplay === GAME_DISPLAY_POST_GAME_FINISHED;

  const teamStats = showPreGameStats ? preGameStats : showAfterGameStats ? currentStats : {};
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
        showGameStats,
        showPreGameStats,
        startTime,
        teams,
        gameStats,
        teamStats,
        status,
        isAfterGame: showAfterGameStats,
        isPlayoffGame: !!preGameStats.playoffSeries,
        latestGoal,
      }),
      SeriesWinsPanel({
        teams,
        awayGoals,
        homeGoals,
        playoffSeries: preGameStats.playoffSeries,
        addCurrentGameToWins: showAfterGameStats,
      }),
      ErrorsPanel(errors),
    ]),
  ]);
}
