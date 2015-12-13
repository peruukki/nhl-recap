import {h} from '@cycle/dom';

export default function gameScore(teams, scores) {
  return h('div.game', [
    h('div.team-panel.away', [
      h('span.team-name', teams.away),
      h('span.team-score', [scores[teams.away]])
    ]),
    h('div.delimiter', getDelimiter(scores)),
    h('div.team-panel.home', [
      h('span.team-score', [scores[teams.home]]),
      h('span.team-name', teams.home)
    ])
  ]);
}

function getDelimiter(scores) {
  const periodElement = (label) => h('span.period', [label]);

  if (scores.overtime) {
    return periodElement('OT');
  } else if (scores.shootout) {
    return periodElement('SO');
  } else {
    return '–';
  }
}
