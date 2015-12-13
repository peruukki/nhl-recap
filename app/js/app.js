import Cycle from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

import scorePanel from './score-panel';

Cycle.run(scorePanel, {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
});
