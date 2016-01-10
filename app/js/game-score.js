import {h} from '@cycle/dom';
import _ from 'lodash';

export default function gameScore(clock, teams, goals) {
  const currentGoals = getCurrentGoals(clock, teams, goals);
  const awayGoals = currentGoals.filter(goal => goal.team === teams.away);
  const homeGoals = currentGoals.filter(goal => goal.team === teams.home);
  const period = currentGoals.length > 0 ? _.last(currentGoals).period : null;

  return h('div.game', [
    h('div.team-panel.away', [
      h('span.team-name', teams.away),
      h('span.team-score', [awayGoals.length])
    ]),
    h('div.delimiter', getDelimiter(period)),
    h('div.team-panel.home', [
      h('span.team-score', [homeGoals.length]),
      h('span.team-name', teams.home)
    ])
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

  const periodLengthInMinutes = (clock.period === 'OT') ? 5 : 20;
  const secondsRemaining = 60 * (clock.minute || 0) + (clock.second || 0);
  const secondsElapsed = periodLengthInMinutes * 60 - secondsRemaining;
  const currentMinute = Math.floor(secondsElapsed / 60);
  const currentSecond = secondsElapsed - 60 * currentMinute;

  return goals.filter(goal =>
    (getPeriodOrdinal(goal.period) < getPeriodOrdinal(clock.period)) ||
    (getPeriodOrdinal(goal.period) === getPeriodOrdinal(clock.period) &&
      (goal.min < currentMinute ||
        (goal.min === currentMinute && goal.sec <= currentSecond)))
  );
}

function getShootoutGoal(goals, teams) {
  const awayGoals = goals.filter(goal => goal.team === teams.away);
  const homeGoals = goals.filter(goal => goal.team === teams.home);
  const winnersGoals = (awayGoals.length > homeGoals) ? awayGoals : homeGoals;
  return _.last(winnersGoals);
}

function getPeriodOrdinal(period) {
  return (period === 'OT') ? 4 : Number(period);
}

function getDelimiter(period) {
  return (period === 'OT' || period === 'SO') ?
    h('span.period', period) :
    '–';
}
