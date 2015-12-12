import Cycle from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

import gameScore from './game-score';
import scoreList from './score-list';
import scorePanel from './score-panel';

Cycle.run(scorePanel, {
  DOM: makeDOMDriver('#app', {
    'score-list': scoreList,
    'game-score': gameScore
  }),
  HTTP: makeHTTPDriver()
});
