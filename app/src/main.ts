import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import app from './components/app';
import registerServiceWorker from './service-worker/register-sw';
import animations from './utils/animations';
import { fetchTeamLogoSVGSymbols } from './utils/logos';

registerServiceWorker();

fetchTeamLogoSVGSymbols();

run(app(animations, window, { fetchStatusDelayMs: 1000 }), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});
