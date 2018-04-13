import {div, span} from '@cycle/dom';
import _ from 'lodash';

import {hasGoalBeenScored, truncatePlayerName} from './utils';
import {renderPeriodNumber, renderTime} from './game-clock';

export default function gameScore(clock, {state, teams, goals, records, playoffSeries, goalCounts}) {
  const currentGoals = getCurrentGoals(clock, teams, goals);
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home);
  const period = latestGoal ? latestGoal.period : null;
  const showPreGameInfo = !clock || !hasGameFinished(state);
  const allGamesEnded = clock && clock.end && !clock.period;
  const playoffSeriesWins = getPlayoffSeriesWins(teams, awayGoals, homeGoals, playoffSeries, allGamesEnded);

  if (goalCounts) {
    goalCounts.away$.shamefullySendNext(awayGoals.length);
    goalCounts.home$.shamefullySendNext(homeGoals.length);
  }

  return div('.game.expand', [
    renderScorePanel(teams, awayGoals, homeGoals, period, showPreGameInfo),
    showPreGameInfo ? renderPreGameInfo(state, teams, records) : renderLatestGoal(latestGoal),
    playoffSeriesWins ? renderSeriesWins(playoffSeriesWins, allGamesEnded) : null
  ]);
}

function getPlayoffSeriesWins(teams, awayGoals, homeGoals, playoffSeries, allGamesEnded) {
  if (playoffSeries) {
    return allGamesEnded ?
      getPlayoffSeriesWinsAfterGame(playoffSeries.wins, teams, awayGoals, homeGoals) :
      playoffSeries.wins;
  } else {
    return null;
  }
}

function getPlayoffSeriesWinsAfterGame(seriesWins, teams, awayGoals, homeGoals) {
  const updatedWinCount = (awayGoals.length > homeGoals.length) ?
    { [teams.away]: seriesWins[teams.away] + 1 } :
    { [teams.home]: seriesWins[teams.home] + 1 };
  return _.merge({}, seriesWins, updatedWinCount);
}

function getCurrentGoals(clock, teams, goals) {
  if (!clock || clock.start) {
    return [];
  }
  if (!clock.period || clock.period === 'SO') {
    const nonShootoutGoals = goals.filter(goal => goal.period !== 'SO');
    return (nonShootoutGoals.length === goals.length) ?
      goals :
      nonShootoutGoals.concat(getShootoutGoal(goals, teams));
  }

  return goals.filter(_.partial(hasGoalBeenScored, clock));
}

function getShootoutGoal(goals, teams) {
  const awayGoals = goals.filter(goal => goal.team === teams.away);
  const homeGoals = goals.filter(goal => goal.team === teams.home);
  const winnersGoals = (awayGoals.length > homeGoals.length) ? awayGoals : homeGoals;
  return _.last(winnersGoals);
}

function renderScorePanel(teams, awayGoals, homeGoals, period, showPreGameInfo) {
  const scoreVisibilityClass = showPreGameInfo ? '.team-panel__team-score--hidden' : '.fade-in';
  const delimiterVisibilityClass = showPreGameInfo ? '' : '.fade-in';
  return div('.game__score-panel', [
    div('.team-panel.team-panel--away', [
      span('.team-panel__team-name', teams.away),
      span('.team-panel__team-score' + scoreVisibilityClass, [awayGoals.length])
    ]),
    div('.team-panel__delimiter' + delimiterVisibilityClass, showPreGameInfo ? 'at' : renderDelimiter(period)),
    div('.team-panel.team-panel--home', [
      span('.team-panel__team-score' + scoreVisibilityClass, [homeGoals.length]),
      span('.team-panel__team-name', teams.home)
    ])
  ]);
}

function renderDelimiter(period) {
  return (period === 'OT' || period === 'SO' || period > 3) ?
    span('.team-panel__delimiter-period', period === 'SO' ? 'SO' : 'OT') :
    '–';
}

function renderPreGameInfo(state, teams, records) {
  const valueClassName = '.pre-game-stats__value';
  const highlightClassNames = getHighlightClassNames(valueClassName, teams, records);
  return div('.game__pre-game-info-panel', [
    div('.pre-game-stats', [
      span(`${valueClassName}${valueClassName}--away${highlightClassNames.away}`,
        records ? renderRecord(records[teams.away]) : ''),
      span('.pre-game-stats__label', records ? 'Record' : ''),
      span(`${valueClassName}${valueClassName}--home${highlightClassNames.home}`,
        records ? renderRecord(records[teams.home]) : '')
    ]),
    div('.pre-game-description', renderGameState(state))
  ]);
}

function getHighlightClassNames(baseClassName, teams, records) {
  if (!records) {
    return { away: '', home: '' };
  }

  const awayWinPercentage = getWinPercentage(records[teams.away]);
  const homeWinPercentage = getWinPercentage(records[teams.home]);

  if (awayWinPercentage > homeWinPercentage) {
    return { away: `${baseClassName}--highlight`, home: '' };
  } else if (homeWinPercentage > awayWinPercentage) {
    return { away: '', home: `${baseClassName}--highlight` };
  } else {
    return { away: '', home: '' };
  }
}

function getWinPercentage({ wins, losses, ot = 0 }) {
  const points = 2 * wins + ot;
  const maxPoints = 2 * (wins + losses + ot);
  return points / maxPoints;
}

function renderRecord(record) {
  return [
    `${Math.max(record.wins || 0, 0)}`,
    span('.pre-game-stats__delimiter', '-'),
    `${Math.max(record.losses || 0, 0)}`,
    ...renderOtLosses(record)
  ];
}

function renderOtLosses(record) {
  return record.ot === undefined
    ? []
    : [
      span('.pre-game-stats__delimiter', '-'),
      `${Math.max(record.ot, 0)}`
    ];
}

function renderLatestGoal(latestGoal) {
  return div('.game__latest-goal-panel', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : '')
  ]);
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

function renderGameState(state) {
  switch (state) {
    case 'LIVE': return 'In progress';
    case 'PREVIEW': return 'Not started';
    default: return '';
  }
}

export function hasGameFinished(state) {
  return state === 'FINAL';
}

export function renderLatestGoalTime(latestGoal) {
  const period = renderPeriodNumber(latestGoal.period);
  const time = renderTime({ minute: latestGoal.min, second: latestGoal.sec });
  return [
    span(`${period} ${time} ${latestGoal.team}`),
    latestGoal.strength ? span('.latest-goal__strength', latestGoal.strength) : null,
    latestGoal.emptyNet ? span('.latest-goal__empty-net', 'EN') : null
  ];
}

export function renderLatestGoalScorer(latestGoal) {
  const scorer = truncatePlayerName(latestGoal.scorer);
  return latestGoal.goalCount ?
    [
      span('.latest-goal__scorer', `${scorer} `),
      span('.latest-goal__goal-count', `(${latestGoal.goalCount})`)
    ] :
    span('.latest-goal__scorer', scorer);
}
