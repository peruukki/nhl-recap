import {div, h1, header, section} from '@cycle/dom';
import Rx from 'rx';
import _ from 'lodash';

import GameClock from './game-clock';
import gameScore from './game-score';

export default function main(animations) {
  return ({HTTP}) => {
    const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
    return {
      DOM: view(model(intent(HTTP, url), animations))
        .sample(0, Rx.Scheduler.requestAnimationFrame),
      HTTP: Rx.Observable.just({ url })
    };
  };
}

function intent(HTTP, url) {
  const scoresWithErrors$ = HTTP
    .filter(res$ => res$.request.url === url)
    .mergeAll()
    .map(response => ({ success: JSON.parse(response.text) }))
    .map(response => (response.success.length > 0) ? response : { error: { message: 'No latest scores available.', expected: true } })
    .catch(error => Rx.Observable.just({ error }))
    .share();
  const scores$ = scoresWithErrors$
    .filter(scores => scores.success)
    .map(scores => scores.success);

  return {
    scores$,
    status$: scoresWithErrors$
      .filter(scores => scores.error)
      .map(scores => scores.error.expected ?
        scores.error.message :
        `Failed to fetch latest scores: ${scores.error.message}.`)
  };
}

function model(actions, animations) {
  const gameClock = GameClock({
    scores$: actions.scores$,
    props$: Rx.Observable.just({ interval: 20 })
  });

  const scores$ = actions.scores$.startWith([])
    .map(games =>
      games.map((game, index) =>
        _.extend({}, game, {
          goalCounts: {
            away$: createGoalCountSubject('away', index, animations),
            home$: createGoalCountSubject('home', index, animations)
          }
        })
      )
    );

  return Rx.Observable.combineLatest(
    scores$,
    actions.status$.startWith('Fetching latest scores...'),
    gameClock.DOM.startWith(''),
    gameClock.clock$.startWith(null),
    (scores, status, clockVtree, clock) => ({ scores, status, clockVtree, clock })
  );
}

function createGoalCountSubject(classModifier, gameIndex, animations) {
  const subject$ = new Rx.Subject();
  subject$.distinctUntilChanged()
    .subscribe(() => animations.highlightGoal(classModifier, gameIndex));
  return subject$;
}

function view(state$) {
  return state$.map(({scores, status, clockVtree, clock}) =>
    div([
      header('.header', renderHeader(clockVtree)),
      section('.score-panel', renderScores({ scores, status, clock }))
    ])
  );
}

function renderHeader(clockVtree) {
  return div('.header__container', [
    h1('.header__title', 'NHL Recap'),
    clockVtree
  ]);
}

function renderScores(state) {
  return state.scores.length > 0 ?
    div('.score-list', state.scores.map(game =>
      gameScore(state.clock, game.teams, game.goals, game.playoffSeries, game.goalCounts))) :
    div('.status.fade-in', [state.status || 'No scores available.']);
}
