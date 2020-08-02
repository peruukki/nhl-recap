import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import scorePanel from './components/score-panel';
import animations from './utils/animations';
import { fetchTeamLogoSVGSymbols } from './utils/logos';

fetchTeamLogoSVGSymbols();

run(scorePanel(animations), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});
