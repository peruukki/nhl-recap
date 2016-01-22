import {h} from '@cycle/dom';
import Rx from 'rx';

import GameClock from './game-clock';
import gameScore from './game-score';

export default function main({HTTP}) {
  const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
  return {
    DOM: view(model(intent(HTTP, url)))
      .sample(0, Rx.Scheduler.requestAnimationFrame),
    HTTP: Rx.Observable.just(url)
  };
}

function intent(HTTP, url) {
  const scoresWithErrors$ = HTTP
    .filter(res$ => res$.request === url)
    .mergeAll()
    .map(response => ({ success: JSON.parse(response.text) }))
    .catch(error => Rx.Observable.just({ error }))
    .share();
  const scores$ = scoresWithErrors$
    .filter(scores => scores.success)
    .map(scores => scores.success);

  return {
    scores$,
    status$: scoresWithErrors$
      .filter(scores => scores.error)
      .map(scores => `Failed to fetch latest scores: ${scores.error.message}.`)
  };
}

function model(actions) {
  const gameClock = GameClock({
    scores$: actions.scores$,
    props$: Rx.Observable.just({ interval: 20 })
  });

  return Rx.Observable.combineLatest(
    actions.scores$.startWith(null),
    actions.status$.startWith('Fetching latest scores...'),
    gameClock.DOM.startWith(''),
    gameClock.clock$.startWith(null),
    (scores, status, clockVtree, clock) => ({ scores, status, clockVtree, clock })
  );
}

function view(state$) {
  return state$.map(({scores, status, clockVtree, clock}) =>
    h('div.score-panel', [clockVtree, renderScores({ scores, status, clock })])
  );
}

function renderScores(state) {
  return state.scores ?
    h('div.score-list', state.scores.map(game => gameScore(state.clock, game.teams, game.goals))) :
    h('div.status', [state.status]);
}
