import {h} from '@cycle/dom';
import Rx from 'rx';

import gameScore from './game-score';

export default function ScorePanel(responses) {
  const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
  const request$ = Rx.Observable.just(url);
  const vtree$ = responses.HTTP
    .filter(res$ => res$.request === url)
    .mergeAll()
    .map(res => ({scores: res.text}))
    .catch(err => Rx.Observable.just({status: `Failed to fetch latest scores: ${err.message}.`}))
    .startWith({status: 'Fetching latest scores...'})
    .map(state =>
      h('div.scorePanel', [
        state.scores ?
          renderScoreList(JSON.parse(state.scores)) :
          h('div.status', [state.status])
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}

function renderScoreList(scores) {
  return h('div.score-list', scores ?
    scores.map(game => gameScore(game.teams, game.scores)) :
    []);
}
