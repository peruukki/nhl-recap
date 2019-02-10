import {div, span} from '@cycle/dom';
import {mockDOMSource} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import xs from 'xstream';
import {assert} from 'chai';
import nock from 'nock';

import scorePanel from '../app/js/score-panel';
import apiResponse from './data/latest.json';
import animations from './animations';

describe('scorePanel', () => {

  const nhlScoreApiHost = 'https://nhl-score-api.herokuapp.com';
  const nhlScoreApiPath = '/api/scores/latest';
  const nhlScoreApiUrl = nhlScoreApiHost + nhlScoreApiPath;

  it('should initially show a message about fetching latest scores', (done) => {
    const sinks = run(xs.empty());
    addListener(done, sinks.DOM.take(1), vtree => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('Fetching latest scores...'));
    });
  });

  it('should fetch latest scores', (done) => {
    const sinks = run(xs.empty());
    addListener(done, sinks.HTTP, request => {
      assert.deepEqual(request.url, nhlScoreApiUrl);
    });
  });

  it('should render fetched latest scores', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), vtree => {
      const gameScoreNodes = getScoreListNode(vtree).children;
      assert.deepEqual(gameScoreNodes.map(node => node.sel), ['div.game.expand--0', 'div.game.expand--0']);
    });
  });

  it('should show a delayed and animated play button', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), vtree => {
      const playButtonNode = getPlayButtonNode(vtree);
      assert.deepEqual(playButtonNode.sel, 'button.button.button--play.expand--2');
    });
  });

  it('should show the date of the latest scores with a slow fade-in', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), vtree => {
      assert.deepEqual(getDateNode(vtree), expectedDateVtree('Tue Oct 17'));
    });
  });

  it('should show a message if there are no latest scores available', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, { date: {}, games: [] });

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), vtree => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('No latest scores available.'));
    });
  });

  it('should show a message if fetching latest scores fails', (done) => {
    nock(nhlScoreApiHost).get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(404, 'Fake error');

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), vtree => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('Failed to fetch latest scores: Not Found.'));
    });
  });

});

function run(httpRequest$) {
  const driver = makeHTTPDriver();
  return scorePanel(animations)({ DOM: mockDOMSource({}), HTTP: driver(httpRequest$) });
}

function addListener(done, stream$, assertFn) {
  stream$.addListener({
    next: value => assertFn(value),
    error: err => done(err),
    complete: done
  });
}

function expectedStatusVtree(message) {
  return div('.status.fade-in', [message]);
}

function expectedDateVtree(date) {
  return span('.date.fade-in-slow', date);
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

function getDateNode(vtree) {
  return getHeaderNode(vtree).children[2];
}

function getScoreListNode(vtree) {
  return getStatusNode(vtree);
}
