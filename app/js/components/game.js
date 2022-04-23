import { div } from '@cycle/dom';
import _ from 'lodash';

import {
  ERROR_MISSING_ALL_GOALS,
  ERROR_SCORE_AND_GOAL_COUNT_MISMATCH,
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
} from '../events/constants';
import InfoPanel from './info-panel';
import ScorePanel from './score-panel';
import SeriesWinsPanel from './series-wins-panel';

export default function renderGame(
  gameDisplay,
  { status, startTime, teams, gameStats, preGameStats = {}, currentStats = {}, errors },
  currentGoals,
  gameAnimationIndex
) {
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away.abbreviation);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home.abbreviation);
  const period = latestGoal ? latestGoal.period : null;
  const showGameStats =
    gameStats &&
    [GAME_DISPLAY_POST_GAME_FINISHED, GAME_DISPLAY_POST_GAME_IN_PROGRESS].includes(gameDisplay);
  const showPreGameStats = [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_POST_GAME_IN_PROGRESS].includes(
    gameDisplay
  );
  const showAfterGameStats = gameDisplay === GAME_DISPLAY_POST_GAME_FINISHED;
  const updatePlayoffSeriesWins = showAfterGameStats;
  const showLatestGoal = gameDisplay !== GAME_DISPLAY_PRE_GAME;
  const showProgressInfo = [
    GAME_DISPLAY_PRE_GAME,
    GAME_DISPLAY_IN_PROGRESS,
    GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  ].includes(gameDisplay);
  const isBeforeGame = gameDisplay === GAME_DISPLAY_PRE_GAME;

  const teamStats = showPreGameStats ? preGameStats : showAfterGameStats ? currentStats : {};
  const playoffSeriesWins = getPlayoffSeriesWins(
    teams,
    awayGoals,
    homeGoals,
    preGameStats.playoffSeries,
    updatePlayoffSeriesWins
  );
  return div('.game-container', [
    div(`.game.expand--${gameAnimationIndex}`, { class: { [`game--${gameDisplay}`]: true } }, [
      ScorePanel(teams, awayGoals, homeGoals, period, isBeforeGame),
      InfoPanel({
        showGameStats,
        showPreGameStats,
        showLatestGoal,
        showProgressInfo,
        startTime,
        teams,
        gameStats,
        teamStats,
        status,
        isAfterGame: showAfterGameStats,
        isPlayoffGame: !!playoffSeriesWins,
        latestGoal,
      }),
      playoffSeriesWins
        ? SeriesWinsPanel(
            playoffSeriesWins,
            preGameStats.playoffSeries.round,
            updatePlayoffSeriesWins
          )
        : null,
      errors ? renderErrors(errors) : null,
    ]),
  ]);
}

function getPlayoffSeriesWins(teams, awayGoals, homeGoals, playoffSeries, updatePlayoffSeriesWins) {
  if (playoffSeries) {
    return updatePlayoffSeriesWins
      ? getPlayoffSeriesWinsAfterGame(playoffSeries.wins, teams, awayGoals, homeGoals)
      : playoffSeries.wins;
  }
  return null;
}

function getPlayoffSeriesWinsAfterGame(seriesWins, teams, awayGoals, homeGoals) {
  const updatedWinCount =
    awayGoals.length > homeGoals.length
      ? { [teams.away.abbreviation]: seriesWins[teams.away.abbreviation] + 1 }
      : { [teams.home.abbreviation]: seriesWins[teams.home.abbreviation] + 1 };
  return _.merge({}, seriesWins, updatedWinCount);
}

function renderErrors(errors) {
  return div('.game__errors', errors.map(getErrorText));
}

function getErrorText({ error, details = {} }) {
  switch (error) {
    case ERROR_MISSING_ALL_GOALS:
      return 'Missing all goal data';
    case ERROR_SCORE_AND_GOAL_COUNT_MISMATCH: {
      const { goalCount, scoreCount } = details;
      const difference = Math.abs(goalCount - scoreCount);
      const pluralSuffix = difference === 1 ? '' : 's';
      return goalCount < scoreCount
        ? `Missing ${difference} goal${pluralSuffix} from data`
        : `${difference} too many goals in data`;
    }
    default:
      return `Unknown error ${error}`;
  }
}
