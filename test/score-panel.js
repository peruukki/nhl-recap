import {h} from '@cycle/dom';
import Rx from 'rx';
import chai from 'chai';

import scorePanel from '../app/js/score-panel';

const assert = chai.assert;

describe('scorePanel', () => {

  it('should initially show a message about fetching latest scores', (done) => {
    const requests = scorePanel({HTTP: Rx.Observable.empty()});
    requests.DOM.subscribe(vtree => {
      const expected = h('div.score-panel', [
        h('div.status', 'Fetching latest scores...')
      ]);
      assert.deepEqual(vtree, expected);
      done();
    });
  });

});
