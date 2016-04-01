import Cycle from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

import scorePanel from './score-panel';
import animations from './animations';

Cycle.run(scorePanel(animations), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
});
