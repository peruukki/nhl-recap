import {h} from '@cycle/dom';

export default function scoreList(responses) {
  const vtree$ = responses.props.getAll()
    .map(props => {
      return h('div.score-list', props.scores ? props.scores.map(renderGame) : []);
    });

  return {
    DOM: vtree$
  };
}

function renderGame(game) {
  return h('game-score', {key: game.teams.away, scores: game.scores, teams: game.teams});
}
