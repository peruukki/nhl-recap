import './main.scss';
import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import app from './components/app';
import registerServiceWorker from './service-worker/register-sw';
import animations from './utils/animations';

if (import.meta.env.PROD) {
  registerServiceWorker();
}

run(app(animations, window, { fetchStatusDelayMs: 1200 }), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});
