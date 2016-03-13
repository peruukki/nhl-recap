import {h} from '@cycle/dom';
import _ from 'lodash';

import {remainingTimeToElapsedTime} from './utils';
import {renderPeriodNumber, renderTime} from './game-clock';

export default function gameScore(clock, teams, goals) {
  const currentGoals = getCurrentGoals(clock, teams, goals);
  const latestGoal = _.last(currentGoals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home);
  const period = latestGoal ? latestGoal.period : null;

  return h('div.game', [
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
  return h('div.game__score-panel', [
    h('div.team-panel.team-panel--away', [
      h('span.team-panel__team-name', teams.away),
      h('span.team-panel__team-score', [awayGoals.length])
    ]),
    h('div.team-panel__delimiter', renderDelimiter(period)),
    h('div.team-panel.team-panel--home', [
      h('span.team-panel__team-score', [homeGoals.length]),
      h('span.team-panel__team-name', teams.home)
    ])
  ]);
}

function renderDelimiter(period) {
  return (period === 'OT' || period === 'SO') ?
    h('span.team-panel__delimiter-period', period) :
    '–';
}

function renderLatestGoal(latestGoal) {
  return h('div.game__latest-goal-panel', [
    h('div.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    h('div.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : '')
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
      h('span.latest-goal__scorer', `${latestGoal.scorer} `),
      h('span.latest-goal__goal-count', `(${latestGoal.goalCount})`)
    ] :
    h('span.latest-goal__scorer', `${latestGoal.scorer}`);
}
