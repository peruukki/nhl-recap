import { div, span } from '@cycle/dom';
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
        ? renderSeriesWins(
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

function renderSeriesWins(seriesWins, playoffRound, isChanged) {
  const animationClass = isChanged ? '.fade-in' : '';
  return div(
    `.game__series-wins${animationClass}`,
    getSeriesWinsDescription(seriesWins, playoffRound)
  );
}

function getSeriesWinsDescription(seriesWins, playoffRound) {
  const teamsWithWins = _.map(seriesWins, (wins, team) => ({ team, wins }));
  const sortedByWins = _.sortBy(teamsWithWins, 'wins');
  const leading = _.last(sortedByWins);
  const trailing = _.first(sortedByWins);

  if (leading.wins === 0 && trailing.wins === 0) {
    const roundDescriptions = ['Qualifier', '1st round', '2nd round', 'Semifinal', 'Final'];
    return `${roundDescriptions[playoffRound]} - Game 1`;
  }

  if (leading.wins === trailing.wins) {
    return [
      'Series ',
      span('.series-wins__tied', 'tied'),
      ' ',
      span('.series-wins__tied-count', String(leading.wins)),
      span('.series-wins__delimiter', '-'),
      span('.series-wins__tied-count', String(trailing.wins)),
    ];
  }

  const seriesWinCount = playoffRound === 0 ? 3 : 4;
  return [
    span('.series-wins__leading-team', leading.team),
    leading.wins === seriesWinCount ? ' wins ' : ' leads ',
    span('.series-wins__leading-count', String(leading.wins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__trailing-count', String(trailing.wins)),
  ];
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
