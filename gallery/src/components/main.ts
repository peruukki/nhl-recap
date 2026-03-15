import '../../../app/src/main.scss';
import './main.scss';

import { makeDOMDriver } from '@cycle/dom';
import { run } from '@cycle/run';

import app from './app';

run(app(), {
  DOM: makeDOMDriver('#app'),
});
