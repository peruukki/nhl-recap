import {h} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import Rx from 'rx';
import chai from 'chai';
import nock from 'nock';

import scorePanel from '../app/js/score-panel';
import apiResponse from './data/latest.json';

const assert = chai.assert;

describe('scorePanel', () => {

  const nhlScoreApiHost = 'https://nhl-score-api.herokuapp.com';
  const nhlScoreApiPath = '/api/scores/latest';
  const nhlScoreApiUrl = nhlScoreApiHost + nhlScoreApiPath;

  it('should initially show a message about fetching latest scores', (done) => {
    const requests = run(Rx.Observable.empty());
    requests.DOM.subscribe(vtree => {
      assert.deepEqual(vtree, expectedStatusMessageVtree('Fetching latest scores...'));
      done();
    });
  });

  it('should fetch latest scores', (done) => {
    const requests = run(Rx.Observable.empty());
    requests.HTTP.subscribe(requestUrl => {
      assert.deepEqual(requestUrl, nhlScoreApiUrl);
      done();
    });
  });

  it('should render fetched latest scores', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .reply(200, apiResponse);

    const requests = run(Rx.Observable.just(nhlScoreApiUrl));
    requests.DOM.skip(1).subscribe(vtree => {
      const scorePanelNode = vtree.children[0];
      const gameScoreNodes = scorePanelNode.children;
      assert.deepEqual(gameScoreNodes.map(node => node.properties.className), ['game', 'game']);
      done();
    });
  });

  it('should show a message if fetching latest scores fails', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .reply(404, 'Fake error');

    const requests = run(Rx.Observable.just(nhlScoreApiUrl));
    requests.DOM.skip(1).subscribe(vtree => {
      assert.deepEqual(vtree, expectedStatusMessageVtree('Failed to fetch latest scores: Not Found.'));
      done();
    });
  });

});

function run(httpRequest$) {
  const driver = makeHTTPDriver();
  return scorePanel({ HTTP: driver(httpRequest$) });
}

function expectedStatusMessageVtree(message) {
  return h('div.score-panel', [
    h('div.status', message)
  ]);
}
