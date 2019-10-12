import {div, span} from '@cycle/dom';
import _ from 'lodash';
import {format} from 'timeago.js';

import {hasClockPassedCurrentProgress, hasGoalBeenScored, truncatePlayerName} from './utils';
import {renderPeriodNumber, renderTime} from './game-clock';
import {renderTeamLogo} from './logos';

export default function gameScore(
  clock,
  {status, startTime, teams, goals, preGameStats = {}, goalCounts},
  gameAnimationIndex
) {
  const currentGoals = getCurrentGoals(clock, teams, goals, status);
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away.abbreviation);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home.abbreviation);
  const period = latestGoal ? latestGoal.period : null;
  const allGamesEnded = clock && clock.end && !clock.period;
  const updatePlayoffSeriesWins = hasGameFinished(status.state) && allGamesEnded;
  const showPreGameStats = !clock || !hasGameStarted(status.state);
  const showProgressInfo = !clock ||
    (isGameInProgress(status.state) && (hasClockPassedCurrentProgress(clock, status) || allGamesEnded));
  const playoffSeriesWins = getPlayoffSeriesWins(teams, awayGoals, homeGoals, preGameStats.playoffSeries, updatePlayoffSeriesWins);

  if (goalCounts) {
    goalCounts.away$.shamefullySendNext(awayGoals.length);
    goalCounts.home$.shamefullySendNext(homeGoals.length);
  }

  return div(`.game.expand--${gameAnimationIndex}`, [
    renderScorePanel(teams, awayGoals, homeGoals, period, showPreGameStats),
    renderInfoPanel(showPreGameStats, showProgressInfo, startTime, teams, preGameStats.records, status,
      !!playoffSeriesWins, latestGoal),
    playoffSeriesWins ? renderSeriesWins(playoffSeriesWins, updatePlayoffSeriesWins) : null
  ]);
}

function getPlayoffSeriesWins(teams, awayGoals, homeGoals, playoffSeries, updatePlayoffSeriesWins) {
  if (playoffSeries) {
    return updatePlayoffSeriesWins ?
      getPlayoffSeriesWinsAfterGame(playoffSeries.wins, teams, awayGoals, homeGoals) :
      playoffSeries.wins;
  } else {
    return null;
  }
}

function getPlayoffSeriesWinsAfterGame(seriesWins, teams, awayGoals, homeGoals) {
  const updatedWinCount = (awayGoals.length > homeGoals.length) ?
    { [teams.away.abbreviation]: seriesWins[teams.away.abbreviation] + 1 } :
    { [teams.home.abbreviation]: seriesWins[teams.home.abbreviation] + 1 };
  return _.merge({}, seriesWins, updatedWinCount);
}

function getCurrentGoals(clock, teams, goals, status) {
  if (!clock || clock.start) {
    return [];
  }
  if (!clock.period || clock.period === 'SO') {
    const nonShootoutGoals = goals.filter(goal => goal.period !== 'SO');
    return (nonShootoutGoals.length === goals.length) ?
      goals :
      nonShootoutGoals.concat(getShootoutGoal(goals, teams, status));
  }

  return goals.filter(_.partial(hasGoalBeenScored, clock));
}

function getShootoutGoal(goals, teams, status) {
  if (isGameInProgress(status.state)) {
    return [];
  }

  const awayGoals = goals.filter(goal => goal.team === teams.away.abbreviation);
  const homeGoals = goals.filter(goal => goal.team === teams.home.abbreviation);
  const winnersGoals = (awayGoals.length > homeGoals.length) ? awayGoals : homeGoals;
  return _.last(winnersGoals);
}

function renderScorePanel(teams, awayGoals, homeGoals, period, showPreGameStats) {
  const scoreVisibilityClass = showPreGameStats ? '.team-panel__team-score--hidden' : '.fade-in';
  const delimiterVisibilityClass = showPreGameStats ? '' : '.fade-in';
  return div('.game__score-panel', [
    div('.team-panel.team-panel--away', [
      renderLogo(teams.away.id, 'away'),
      span('.team-panel__team-name', teams.away.abbreviation),
      span('.team-panel__team-score' + scoreVisibilityClass, [awayGoals.length])
    ]),
    div('.team-panel__delimiter' + delimiterVisibilityClass, showPreGameStats ? 'at' : renderDelimiter(period)),
    div('.team-panel.team-panel--home', [
      span('.team-panel__team-score' + scoreVisibilityClass, [homeGoals.length]),
      span('.team-panel__team-name', teams.home.abbreviation),
      renderLogo(teams.home.id, 'home')
    ])
  ]);
}

function renderLogo(teamId, modifier) {
  return span('.team-logo', [
    renderTeamLogo(teamId, `team-logo__image team-logo__image--${modifier} team-logo__image--${teamId}`)
  ]);
}

function renderDelimiter(period) {
  return (period === 'OT' || period === 'SO' || period > 3) ?
    span('.team-panel__delimiter-period', period === 'SO' ? 'SO' : 'OT') :
    '';
}

function renderInfoPanel(showPreGameStats, showProgressInfo, startTime, teams, records, status, isPlayoffGame, latestGoal) {
  const showLatestGoal = !showPreGameStats && !showProgressInfo;
  const modifierClass = isPlayoffGame ? ' .game__info-panel--playoff' : '';
  return div(`.game__info-panel${modifierClass}`,
    showLatestGoal ?
      renderLatestGoal(latestGoal) :
      renderPreGameInfo(status, startTime, teams, showPreGameStats, showProgressInfo, isPlayoffGame, records)
  );
}

function renderPreGameInfo(status, startTime, teams, showPreGameStats, showProgressInfo, isPlayoffGame, records) {
  const winPctLabel = isPlayoffGame ? 'Win-%' : 'Point-%';
  return [
    showPreGameStats ? renderTeamStats(teams, records, winPctLabel, renderWinPercentage, renderWinPercentage) : null,
    showPreGameStats ? renderTeamStats(teams, records, 'Record', renderWinPercentage, renderRecord, 'spaced') : null,
    showProgressInfo ? div('.game-description.fade-in', renderGameStatus(status, startTime)) : null
  ];
}

function renderTeamStats(teams, values, label, ratingFn, renderFn, modifier = '') {
  const valueClassName = '.team-stats__value';
  const valueClassNameModifer = modifier ? `${valueClassName}--${modifier}` : '';
  const highlightClassNames = getHighlightClassNames(valueClassName, teams, values, ratingFn);
  return div('.team-stats', [
    span(`${valueClassName}${valueClassNameModifer}${valueClassName}--away${highlightClassNames.away}`,
      values ? renderFn(values[teams.away.abbreviation]) : ''),
    span('.team-stats__label', values ? label : ''),
    span(`${valueClassName}${valueClassNameModifer}${valueClassName}--home${highlightClassNames.home}`,
      values ? renderFn(values[teams.home.abbreviation]) : '')
  ]);
}

function getHighlightClassNames(baseClassName, teams, values, ratingFn) {
  if (!values) {
    return { away: '', home: '' };
  }

  const awayRating = ratingFn(values[teams.away.abbreviation]);
  const homeRating = ratingFn(values[teams.home.abbreviation]);

  if (awayRating > homeRating) {
    return { away: `${baseClassName}--highlight`, home: '' };
  } else if (homeRating > awayRating) {
    return { away: '', home: `${baseClassName}--highlight` };
  } else {
    return { away: '', home: '' };
  }
}

function getPointPercentage({ wins, losses, ot = 0 }) {
  const points = 2 * wins + ot;
  const maxPoints = 2 * (wins + losses + ot);
  return points / maxPoints;
}

// eslint-disable-next-line no-unused-vars
function getStreakRating(streak) {
  return streak ? streak.count * getStreakMultiplier(streak.type) : 0;
}

function getStreakMultiplier(type) {
  switch (type) {
    case 'WINS':
      return 1;
    case 'LOSSES':
      return -1;
    default:
      return 0;
  }
}

// eslint-disable-next-line no-unused-vars
function getPlayoffSpotRating({ pointsFromPlayoffSpot }) {
  return parseInt(pointsFromPlayoffSpot);
}

function renderWinPercentage(record) {
  const percentage = getPointPercentage(record);
  if (isNaN(percentage)) {
    return '-';
  }

  const sliceIndex = percentage < 1 ? 1 : 0;
  return percentage
    .toFixed(3)
    .slice(sliceIndex);
}

function renderRecord({ wins, losses, ot }) {
  return ot !== undefined ? `${wins}-${losses}-${ot}` : `${wins}-${losses}`;
}

// eslint-disable-next-line no-unused-vars
function renderStreak(streak) {
  return streak ? `${streak.count} ${renderStreakType(streak)}` : '-';
}

function renderStreakType({ type }) {
  switch (type) {
    case 'WINS':
      return 'W';
    case 'LOSSES':
      return 'L';
    case 'OT':
      return 'OT L';
    default:
      return '';
  }
}

// eslint-disable-next-line no-unused-vars
function renderPlayoffSpot({ pointsFromPlayoffSpot }) {
  return pointsFromPlayoffSpot || '';
}

function renderLatestGoal(latestGoal) {
  return [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : ''),
    div('.latest-goal__assists', latestGoal ? renderLatestGoalAssists(latestGoal) : '')
  ];
}

function renderSeriesWins(seriesWins, isChanged) {
  const animationClass = isChanged ? '.fade-in' : '';
  return div(`.game__series-wins${animationClass}`, getSeriesWinsDescription(seriesWins));
}

function getSeriesWinsDescription(seriesWins) {
  const teamsWithWins = _.map(seriesWins, (wins, team) => ({ team, wins }));
  const sortedByWins = _.sortBy(teamsWithWins, 'wins');
  const leading = _.last(sortedByWins);
  const trailing = _.first(sortedByWins);

  if (leading.wins === trailing.wins) {
    return [
      'Series ',
      span('.series-wins__tied', 'tied'),
      ' ',
      span('.series-wins__tied-count', String(leading.wins)),
      span('.series-wins__delimiter', '–'),
      span('.series-wins__tied-count', String(trailing.wins))
    ];
  } else {
    const seriesWinCount = 4;
    return [
      span('.series-wins__leading-team', leading.team),
      (leading.wins === seriesWinCount) ? ' wins ' : ' leads ',
      span('.series-wins__leading-count', String(leading.wins)),
      span('.series-wins__delimiter', '–'),
      span('.series-wins__trailing-count', String(trailing.wins))
    ];
  }
}

function renderGameStatus(status, startTime) {
  switch (status.state) {
    case 'LIVE':
      return renderCurrentProgress(status.progress);
    case 'PREVIEW':
      {
        const isInFuture = (new Date(startTime) - new Date()) > 0 ;
        return `Starts ${isInFuture ? format(startTime) : 'soon'}`;
      }
    default:
      return 'Finished';
  }
}

function renderCurrentProgress(progress) {
  if (!progress || !progress.currentPeriodOrdinal) {
    return 'In progress';
  } else if (progress.currentPeriodTimeRemaining.pretty === 'END') {
    return `End of ${progress.currentPeriodOrdinal}`;
  } else if (progress.currentPeriodOrdinal === 'SO') {
    return 'In shootout';
  } else {
    return `${progress.currentPeriodOrdinal} ${progress.currentPeriodTimeRemaining.pretty}`;
  }
}

function hasGameFinished(state) {
  return state === 'FINAL';
}

function hasGameStarted(state) {
  return state !== 'PREVIEW';
}

function isGameInProgress(state) {
  return state === 'LIVE';
}

export function renderLatestGoalTime(latestGoal) {
  const period = renderPeriodNumber(latestGoal.period);
  const time = renderTime({ minute: latestGoal.min, second: latestGoal.sec });
  return [
    span(`${period} ${time}`),
    span('.latest-goal__team', latestGoal.team),
    latestGoal.strength ? span('.latest-goal__strength', latestGoal.strength) : null,
    latestGoal.emptyNet ? span('.latest-goal__empty-net', 'EN') : null
  ];
}

export function renderLatestGoalScorer(latestGoal) {
  const {player, seasonTotal} = latestGoal.scorer;
  const scorer = truncatePlayerName(player);
  return seasonTotal ?
    [
      span('.latest-goal__scorer', `${scorer} `),
      span('.latest-goal__goal-count', `(${seasonTotal})`)
    ] :
    span('.latest-goal__scorer', scorer);
}

export function renderLatestGoalAssists(latestGoal) {
  if (!latestGoal.assists) {
    return '';
  }
  if (latestGoal.assists.length === 0) {
    return span('.latest-goal__assists-label', 'Unassisted');
  }
  return [
    div('.latest-goal__assists-label', 'Assists:'),
    ...latestGoal.assists.map(assist =>
      div('.latest-goal__assist', [
        span('.latest-goal__assister', `${truncatePlayerName(assist.player)} `),
        span('.latest-goal__assist-count', `(${assist.seasonTotal})`)
      ])
    )
  ];
}
