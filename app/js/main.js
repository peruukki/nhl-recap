import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import app from './components/app';
import animations from './utils/animations';
import { fetchTeamLogoSVGSymbols } from './utils/logos';

fetchTeamLogoSVGSymbols();

run(app(animations), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});
