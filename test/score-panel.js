import {div} from '@cycle/dom';
import {mockDOMSource} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import Rx from 'rx';
import chai from 'chai';
import nock from 'nock';

import scorePanel from '../app/js/score-panel';
import apiResponse from './data/latest.json';
import animations from './animations';

const assert = chai.assert;

describe('scorePanel', () => {

  const nhlScoreApiHost = 'https://nhl-score-api.herokuapp.com';
  const nhlScoreApiPath = '/api/scores/latest';
  const nhlScoreApiUrl = nhlScoreApiHost + nhlScoreApiPath;

  it('should initially show a message about fetching latest scores', (done) => {
    const requests = run(Rx.Observable.empty());
    requests.DOM.subscribe(vtree => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('Fetching latest scores...'));
      done();
    });
  });

  it('should fetch latest scores', (done) => {
    const requests = run(Rx.Observable.empty());
    requests.HTTP.subscribe(request => {
      assert.deepEqual(request.url, nhlScoreApiUrl);
      done();
    });
  });

  it('should render fetched latest scores', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .reply(200, apiResponse);

    const requests = run(Rx.Observable.just(nhlScoreApiUrl));
    requests.DOM.skip(1).take(1).subscribe(vtree => {
      const gameScoreNodes = getScoreListNode(vtree).children;
      assert.deepEqual(gameScoreNodes.map(node => node.properties.className), ['game expand', 'game expand']);
      done();
    });
  });

  it('should show a delayed and animated play button', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .reply(200, apiResponse);

    const requests = run(Rx.Observable.just(nhlScoreApiUrl));
    requests.DOM.skip(1).take(1).subscribe(vtree => {
      const playButtonNode = getPlayButtonNode(vtree);
      assert.deepEqual(playButtonNode.properties.className, 'button button--play expand--2');
      done();
    });
  });

  it('should show a message if there are no latest scores available', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .reply(200, []);

    const requests = run(Rx.Observable.just(nhlScoreApiUrl));
    requests.DOM.skip(1).subscribe(vtree => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('No latest scores available.'));
      done();
    });
  });

  it('should show a message if fetching latest scores fails', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .reply(404, 'Fake error');

    const requests = run(Rx.Observable.just(nhlScoreApiUrl));
    requests.DOM.skip(1).subscribe(vtree => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('Failed to fetch latest scores: Not Found.'));
      done();
    });
  });

});

function run(httpRequest$) {
  const driver = makeHTTPDriver();
  return scorePanel(animations)({ DOM: mockDOMSource(), HTTP: driver(httpRequest$) });
}

function expectedStatusVtree(message) {
  return div('.status.fade-in', message);
}

function getHeaderNode(vtree) {
  return vtree.children[0].children[0];
}

function getStatusNode(vtree) {
  return vtree.children[1].children[0];
}

function getPlayButtonNode(vtree) {
  return getHeaderNode(vtree).children[1];
}

function getScoreListNode(vtree) {
  return getStatusNode(vtree);
}
