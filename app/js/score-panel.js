import {h} from '@cycle/dom';
import Rx from 'rx';

import {gameClock, renderClock} from './game-clock';
import gameScore from './game-score';

export default function main({HTTP}) {
  const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
  return {
    DOM: view(model(intent(HTTP, url))),
    HTTP: Rx.Observable.just(url)
  };
}

function intent(HTTP, url) {
  const clockIntervalMs = 10;
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
      .map(scores => `Failed to fetch latest scores: ${scores.error.message}.`),
    clock$: scores$
      .flatMapLatest(scores => gameClock(scores, clockIntervalMs))
  };
}

function model(actions) {
  return Rx.Observable.combineLatest(
    actions.scores$.startWith(null),
    actions.status$.startWith('Fetching latest scores...'),
    actions.clock$.startWith(null),
    (scores, status, clock) => ({ scores, status, clock })
  );
}

function view(state$) {
  return state$.map(({scores, status, clock}) =>
    h('div.score-panel', [renderClock(clock), renderScores({ scores, status })])
  );
}

function renderScores(state) {
  return state.scores ?
    h('div.score-list', state.scores.map(game => gameScore(game.teams, game.scores))) :
    h('div.status', [state.status]);
}
