import {h} from '@cycle/dom';
import _ from 'lodash';

export default function gameScore(clock, teams, goals) {
  const currentGoals = getCurrentGoals(clock, goals);
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

function getCurrentGoals(clock, goals) {
  if (!clock) {
    return [];
  }
  if (!clock.period || clock.period === 'SO') {
    return goals;
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

function getPeriodOrdinal(period) {
  return (period === 'OT') ? 4 : Number(period);
}

function getDelimiter(period) {
  return (period === 'OT' || period === 'SO') ?
    h('span.period', period) :
    '–';
}
