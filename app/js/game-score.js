import {div, span} from '@cycle/dom';
import _ from 'lodash';

import {remainingTimeToElapsedTime} from './utils';
import {renderPeriodNumber, renderTime} from './game-clock';

export default function gameScore(clock, teams, goals, goalCounts) {
  const currentGoals = getCurrentGoals(clock, teams, goals);
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home);
  const period = latestGoal ? latestGoal.period : null;

  if (goalCounts) {
    goalCounts.away$.onNext(awayGoals.length);
    goalCounts.home$.onNext(homeGoals.length);
  }

  return div('.game.fade-in', [
    renderScorePanel(teams, awayGoals, homeGoals, period),
    renderLatestGoal(latestGoal)
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

  const {minute, second} = remainingTimeToElapsedTime(clock);
  return goals.filter(goal =>
    (getPeriodOrdinal(goal.period) < getPeriodOrdinal(clock.period)) ||
    (getPeriodOrdinal(goal.period) === getPeriodOrdinal(clock.period) &&
      (goal.min < minute ||
        (goal.min === minute && goal.sec <= second)))
  );
}

function getShootoutGoal(goals, teams) {
  const awayGoals = goals.filter(goal => goal.team === teams.away);
  const homeGoals = goals.filter(goal => goal.team === teams.home);
  const winnersGoals = (awayGoals.length > homeGoals.length) ? awayGoals : homeGoals;
  return _.last(winnersGoals);
}

function getPeriodOrdinal(period) {
  return (period === 'OT') ? 4 : Number(period);
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

export function renderLatestGoalTime(latestGoal) {
  const period = renderPeriodNumber(latestGoal.period);
  const time = renderTime({ minute: latestGoal.min, second: latestGoal.sec });
  return `${period} ${time} ${latestGoal.team}`;
}

export function renderLatestGoalScorer(latestGoal) {
  return latestGoal.goalCount ?
    [
      span('.latest-goal__scorer', `${latestGoal.scorer} `),
      span('.latest-goal__goal-count', `(${latestGoal.goalCount})`)
    ] :
    span('.latest-goal__scorer', `${latestGoal.scorer}`);
}
