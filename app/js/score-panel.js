import {h} from '@cycle/dom';
import Rx from 'rx';

import {gameClock, renderClock} from './game-clock';
import gameScore from './game-score';

export default function scorePanel(responses) {
  const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
  const request$ = Rx.Observable.just(url);
  const clockIntervalMs = 10;

  const state$ = responses.HTTP
    .filter(res$ => res$.request === url)
    .mergeAll()
    .map(res => ({scores: JSON.parse(res.text)}))
    .catch(err => Rx.Observable.just({status: `Failed to fetch latest scores: ${err.message}.`}))
    .startWith({status: 'Fetching latest scores...'});

  const clock$ = state$
    .filter(state => state.scores)
    .flatMapLatest(state => gameClock(state.scores, clockIntervalMs))
    .startWith(null);

  const scoreListVtree$ = state$
    .map(renderScores);

  const clockVtree$ = clock$
    .map(renderClock);

  const vtree$ = Rx.Observable.combineLatest(clockVtree$, scoreListVtree$,
    (clockVtree, scoreListVtree) => h('div.score-panel', [clockVtree, scoreListVtree])
  );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}

function renderScores(state) {
  return state.scores ?
    h('div.score-list', state.scores.map(game => gameScore(game.teams, game.scores))) :
    h('div.status', [state.status]);
}
