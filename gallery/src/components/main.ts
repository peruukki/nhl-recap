import '../../../app/src/main.scss';
import './main.scss';
import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';

import app from './app';

run(app(), {
  DOM: makeDOMDriver('#app'),
});
