import '../../app/src/main.scss';
import './main-logos.scss';
import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';

import app from './app-logos';

run(app(), {
  DOM: makeDOMDriver('#app'),
});
