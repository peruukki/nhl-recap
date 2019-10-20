import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import scorePanel from './score-panel';
import animations from './animations';
import { fetchTeamLogoSVGSymbols } from './logos';

fetchTeamLogoSVGSymbols();

run(scorePanel(animations), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
});
