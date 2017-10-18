import {button, div, h1, header, section, span} from '@cycle/dom';
import xs from 'xstream';
import _ from 'lodash';
import classNames from 'classnames';

import GameClock from './game-clock';
import gameScore from './game-score';

export default function main(animations) {
  return ({DOM, HTTP}) => {
    const url = 'https://nhl-score-api.herokuapp.com/api/scores/latest';
    return {
      DOM: view(model(intent(DOM, HTTP), animations)),
      HTTP: xs.of({ url })
    };
  };
}

function intent(DOM, HTTP) {
  const scoresWithErrors$ = HTTP
    .select()
    .map(response$ => response$.replaceError(error => xs.of({ error })))
    .flatten()
    .map(response => {
      if (response.error) {
        return response;
      } else {
        const responseJson = JSON.parse(response.text);
        return responseJson.games.length > 0
          ? { success: responseJson }
          : { error: { message: 'No latest scores available.', expected: true } };
      }
    });
  const scores$ = scoresWithErrors$
    .filter(scores => scores.success)
    .map(scores => scores.success.games);

  const playClicks$ = DOM.select('.button--play').events('click')
    .mapTo(true);
  const pauseClicks$ = DOM.select('.button--pause').events('click')
    .mapTo(false);
  const isPlaying$ = xs.merge(playClicks$, pauseClicks$);

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

  const gameClock = GameClock({
    scores$: actions.scores$,
    isPlaying$: actions.isPlaying$,
    props$: xs.of({ interval: 20 })
  });

  return xs.combine(
    scores$,
    actions.isPlaying$.startWith(false),
    actions.status$.startWith('Fetching latest scores...'),
    gameClock.DOM.startWith(span('.clock')),
    gameClock.clock$.startWith(null)
  ).map(([scores, isPlaying, status, clockVtree, clock]) =>
    ({ scores, isPlaying, status, clockVtree, clock, gameCount: scores.length })
  );
}

function createGoalCountSubject(classModifier, gameIndex, animations) {
  const subject$ = new xs.create();
  subject$.fold((acc, curr) => ({ last: curr, changed: acc.last !== curr }), { last: 0 })
    .filter(({ changed }) => changed)
    .addListener({ next: () => animations.highlightGoal(classModifier, gameIndex) });
  return subject$;
}

function view(state$) {
  return state$.map(({scores, isPlaying, status, clockVtree, clock, gameCount}) =>
    div([
      header('.header', renderHeader(clockVtree, clock, gameCount, isPlaying)),
      section('.score-panel', renderScores({ scores, status, clock }))
    ])
  );
}

function renderHeader(clockVtree, clock, gameCount, isPlaying) {
  const hasNotStarted = !clock;
  const isFinished = !!(clock && clock.end && !clock.period);
  const buttonType = isPlaying ? 'pause' : 'play';
  const buttonClass = classNames({
    '.button': true,
    [`.button--${buttonType}`]: gameCount > 0,
    [`.expand--${gameCount}`]: gameCount > 0 && hasNotStarted,
    '.button--hidden': isFinished
  }).replace(/\s/g, '');

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
