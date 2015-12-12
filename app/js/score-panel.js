import {h} from '@cycle/dom';
import Rx from 'rx';

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
          h('score-list', {scores: JSON.parse(state.scores)}) :
          h('div.status', [state.status])
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}
