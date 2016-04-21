import {div, span} from '@cycle/dom';
import _ from 'lodash';

import {hasGoalBeenScored, truncatePlayerName} from './utils';
import {renderPeriodNumber, renderTime} from './game-clock';

export default function gameScore(clock, teams, goals, playoffSeries, goalCounts) {
  const currentGoals = getCurrentGoals(clock, teams, goals);
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home);
  const period = latestGoal ? latestGoal.period : null;

  if (goalCounts) {
    goalCounts.away$.onNext(awayGoals.length);
    goalCounts.home$.onNext(homeGoals.length);
  }

  return div('.game.expand', [
    renderScorePanel(teams, awayGoals, homeGoals, period),
    renderLatestGoal(latestGoal),
    playoffSeries ? renderSeriesWins(playoffSeries.wins) : null
  ]);
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

function renderScorePanel(teams, awayGoals, homeGoals, period) {
  return div('.game__score-panel', [
    div('.team-panel.team-panel--away', [
      span('.team-panel__team-name', teams.away),
      span('.team-panel__team-score', [awayGoals.length])
    ]),
    div('.team-panel__delimiter', renderDelimiter(period)),
    div('.team-panel.team-panel--home', [
      span('.team-panel__team-score', [homeGoals.length]),
      span('.team-panel__team-name', teams.home)
    ])
  ]);
}

function renderDelimiter(period) {
  return (period === 'OT' || period === 'SO') ?
    span('.team-panel__delimiter-period', period) :
    '–';
}

function renderLatestGoal(latestGoal) {
  return div('.game__latest-goal-panel', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : '')
  ]);
}

function renderSeriesWins(seriesWins) {
  return div('.game__series-wins', getSeriesWinsDescription(seriesWins));
}

function getSeriesWinsDescription(seriesWins) {
  const teamsWithWins = _.map(seriesWins, (wins, team) => ({ team, wins }));
  const sortedByWins = _.sortBy(teamsWithWins, 'wins');
  const leading = _.last(sortedByWins);
  const trailing = _.first(sortedByWins);

  if (leading.wins === trailing.wins) {
    return [
      span('Series tied '),
      span('.series-wins__tied', String(leading.wins)),
      span('.series-wins__delimiter', '–'),
      span('.series-wins__tied', String(trailing.wins))
    ];
  } else {
    return [
      span('.series-wins__leading-team', leading.team),
      span(' leads '),
      span('.series-wins__leading', String(leading.wins)),
      span('.series-wins__delimiter', '–'),
      span('.series-wins__trailing', String(trailing.wins))
    ];
  }
}

export function renderLatestGoalTime(latestGoal) {
  const period = renderPeriodNumber(latestGoal.period);
  const time = renderTime({ minute: latestGoal.min, second: latestGoal.sec });
  return `${period} ${time} ${latestGoal.team}`;
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
