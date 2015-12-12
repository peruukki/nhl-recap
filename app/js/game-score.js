import {h} from '@cycle/dom';

export default function gameScore(responses) {
  const vtree$ = responses.props.getAll()
    .map(props => {
      return h('div.game', [
        h('div.team-panel.away', [
          h('span.team-name', props.teams.away),
          h('span.team-score', [props.scores[props.teams.away]])
        ]),
        h('div.delimiter', getDelimiter(props.scores)),
        h('div.team-panel.home', [
          h('span.team-score', [props.scores[props.teams.home]]),
          h('span.team-name', props.teams.home)
        ])
      ]);
    });

  return {
    DOM: vtree$
  };
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
