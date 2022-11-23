import { div, MainDOMSource, mockDOMSource, span, VNode } from '@cycle/dom';
import { makeHTTPDriver, RequestInput } from '@cycle/http';
import xs, { Stream } from 'xstream';
import { assert } from 'chai';
import nock from 'nock';

import animations from '../test/test-animations';
import { scoresAllRegularTime as apiResponse } from '../test/data';
import { addListener } from '../test/test-utils';
import app from './app';

describe('app', () => {
  const nhlScoreApiHost = 'https://nhl-score-api.herokuapp.com';
  const nhlScoreApiPath = '/api/scores/latest';
  const nhlScoreApiUrl = nhlScoreApiHost + nhlScoreApiPath;

  it('should initially show a message about fetching latest scores', (done) => {
    const sinks = run(xs.empty());
    addListener(done, sinks.DOM.take(1), (vtree) => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('Fetching latest scores...'));
    });
  });

  it('should fetch latest scores', (done) => {
    const sinks = run(xs.empty());
    addListener(done, sinks.HTTP, (request) => {
      assert.deepEqual(request.url, nhlScoreApiUrl);
    });
  });

  it('should render fetched latest scores', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      const scoreListNode = getScoreListNode(vtree);
      assert.deepEqual(scoreListNode?.sel, 'div.score-list');

      const gameScoreNodes = scoreListNode?.children;
      assert.deepEqual(
        gameScoreNodes?.map((node) => (typeof node !== 'string' ? node.sel : node)),
        ['div.game-container', 'div.game-container'],
      );
    });
  });

  it('should set single game classname', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, { ...apiResponse, games: apiResponse.games.slice(0, 1) });

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      const scoreListNode = getScoreListNode(vtree);
      assert.deepEqual(scoreListNode?.sel, 'div.score-list.score-list--single-game');
    });
  });

  it('should show a delayed and animated play button', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      const playButtonNode = getPlayButtonNode(vtree);
      assert.deepEqual(playButtonNode?.sel, 'button.button.play-pause-button');
    });
  });

  it('should show the date of the latest scores with a slow fade-in', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      assert.deepEqual(getDateNode(vtree), expectedDateVtree('Tue Oct 17'));
    });
  });

  it('should show a message if there are no latest scores available', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, { date: {}, games: [] });

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('No latest scores available.'));
    });
  });

  it('should show a message if fetching latest scores fails due to network offline', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(404, 'Fake error');

    const sinks = run(xs.of(nhlScoreApiUrl), { isOnline: false });
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      assert.deepEqual(
        getStatusNode(vtree),
        expectedStatusVtree('Failed to fetch latest scores: the network is offline.'),
      );
    });
  });

  it('should show a message if fetching latest scores fails due to unknown error', (done) => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(404, 'Fake error');

    const sinks = run(xs.of(nhlScoreApiUrl));
    addListener(done, sinks.DOM.drop(1).take(1), (vtree) => {
      assert.deepEqual(getStatusNode(vtree), expectedStatusVtree('Failed to fetch latest scores.'));
    });
  });
});

function run(httpRequest$: Stream<string>, options = { isOnline: true }) {
  const driver = makeHTTPDriver();
  const $window = { navigator: { onLine: options.isOnline } } as Window;
  return app(
    animations,
    $window,
  )({
    DOM: mockDOMSource({}) as unknown as MainDOMSource,
    HTTP: driver(httpRequest$ as Stream<RequestInput | string>),
  });
}

function expectedStatusVtree(message: string) {
  return div('.status.fade-in', [message]);
}

function expectedDateVtree(date: string) {
  return span('.date.fade-in-slow', date);
}

function getHeaderNode(vtree: VNode) {
  return (vtree.children?.[0] as VNode)?.children?.[0] as VNode | undefined;
}

function getStatusNode(vtree: VNode) {
  return (vtree.children?.[1] as VNode)?.children?.[0] as VNode | undefined;
}

function getPlayButtonNode(vtree: VNode) {
  return getHeaderNode(vtree)?.children?.[1] as VNode | undefined;
}

function getDateNode(vtree: VNode) {
  return getHeaderNode(vtree)?.children?.[2] as VNode | undefined;
}

function getScoreListNode(vtree: VNode) {
  return getStatusNode(vtree);
}
