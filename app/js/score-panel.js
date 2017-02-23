import {button, div, h1, header, section} from '@cycle/dom';
import Rx from 'rx';
import _ from 'lodash';

import GameClock from './game-clock';
import gameScore from './game-score';

export default function main(animations) {
  return ({DOM, HTTP}) => {
    const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
    return {
      DOM: view(model(intent(DOM, HTTP, url), animations))
        .sample(0, Rx.Scheduler.requestAnimationFrame),
      HTTP: Rx.Observable.just({ url })
    };
  };
}

function intent(DOM, HTTP, url) {
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

  const playClicks$ = DOM.select('.button--play').events('click')
    .map(() => true);
  const pauseClicks$ = DOM.select('.button--pause').events('click')
    .map(() => false);
  const isPlaying$ = Rx.Observable.merge(playClicks$, pauseClicks$);

  return {
    scores$,
    isPlaying$,
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
    actions.isPlaying$.startWith(false),
    actions.status$.startWith('Fetching latest scores...'),
    gameClock.DOM.startWith(''),
    gameClock.clock$.startWith(null),
    (scores, isPlaying, status, clockVtree, clock) =>
      ({ scores, isPlaying, status, clockVtree, clock, gameCount: scores.length })
  );
}

function createGoalCountSubject(classModifier, gameIndex, animations) {
  const subject$ = new Rx.Subject();
  subject$.distinctUntilChanged()
    .subscribe(() => animations.highlightGoal(classModifier, gameIndex));
  return subject$;
}

function view(state$) {
  return state$.map(({scores, isPlaying, status, clockVtree, clock, gameCount}) =>
    div([
      header('.header', renderHeader(clockVtree, gameCount, isPlaying)),
      section('.score-panel', renderScores({ scores, status, clock }))
    ])
  );
}

function renderHeader(clockVtree, gameCount, isPlaying) {
  const buttonType = isPlaying ? 'pause' : 'play';
  const buttonClass = gameCount ? `.button .button--${buttonType} .expand--${gameCount}` : '.button';

  return div('.header__container', [
    h1('.header__title', 'NHL Recap'),
    button(buttonClass),
    clockVtree
  ]);
}

function renderScores(state) {
  return state.scores.length > 0 ?
    div('.score-list', state.scores.map(game =>
      gameScore(state.clock, game.teams, game.goals, game.playoffSeries, game.goalCounts))) :
    div('.status.fade-in', [state.status || 'No scores available.']);
}
