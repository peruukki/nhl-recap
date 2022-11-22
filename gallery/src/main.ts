import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';

import { fetchTeamLogoSVGSymbols } from '../../app/src/utils/logos';
import app from './app';

fetchTeamLogoSVGSymbols();

run(app(), {
  DOM: makeDOMDriver('#app'),
});
