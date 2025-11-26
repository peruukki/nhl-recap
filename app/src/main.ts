import './main.scss';
import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import app from './components/app';
import registerServiceWorker from './service-worker/register-sw';

if (import.meta.env.PROD) {
  registerServiceWorker();
}

run(app(window, { fetchStatusExitDurationMs: 200, fetchStatusShowDurationMs: 1200 }), {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});
