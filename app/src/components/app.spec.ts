import { div, MainDOMSource, mockDOMSource, span, VNode } from '@cycle/dom';
import { makeHTTPDriver, RequestInput } from '@cycle/http';
import xs, { Stream } from 'xstream';
import nock from 'nock';
import { describe, expect, it } from 'vitest';

import animations from '../test/test-animations';
import { scoresAllRegularTime as apiResponse } from '../test/data';
import { assertStreamValues } from '../test/test-utils';
import app from './app';

describe('app', () => {
  const nhlScoreApiHost = 'https://nhl-score-api.herokuapp.com';
  const nhlScoreApiPath = '/api/scores/latest';
  const nhlScoreApiUrl = nhlScoreApiHost + nhlScoreApiPath;

  it('should initially show a message about fetching latest scores', async () => {
    const sinks = run(xs.empty());
    await assertStreamValues(sinks.DOM.take(1), (vtree) => {
      expect(getStatusNode(vtree)).toEqual(
        expectedStatusVtree(['Fetching latest scores', span('.loader')], '.fade-in'),
      );
    });
  });

  it('should fetch latest scores by default', async () => {
    const sinks = run(xs.empty());
    await assertStreamValues(sinks.HTTP, (request) => {
      expect(request.url).toEqual(nhlScoreApiUrl);
    });
  });

  it('should fetch scores for specific date when date parameter is set', async () => {
    const sinks = run(xs.empty(), { search: '?date=2024-01-15' });
    await assertStreamValues(sinks.HTTP, (request) => {
      expect(request.url).toEqual(`${nhlScoreApiHost}/api/scores?startDate=2024-01-15`);
    });
  });

  it('should render fethed latest scores', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      const scoreListNode = getScoreListNode(vtree);
      expect(scoreListNode?.sel).toEqual('div.score-list');

      const gameScoreNodes = scoreListNode?.children;
      expect(gameScoreNodes?.map((node) => (typeof node !== 'string' ? node.sel : node))).toEqual([
        'div.game-container',
        'div.game-container',
      ]);
    });
  });

  it('should set single game classname', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, { ...apiResponse, games: apiResponse.games.slice(0, 1) });

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      const scoreListNode = getScoreListNode(vtree);
      expect(scoreListNode?.sel).toEqual('div.score-list.score-list--single-game');
    });
  });

  it('should show a delayed and animated play button', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      const playButtonNode = getPlayButtonNode(vtree);
      expect(playButtonNode?.sel).toEqual('button.button.play-pause-button');
    });
  });

  it('should show the date of the latest scores with a fade-in', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, apiResponse);

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      expect(getDateNode(vtree)).toEqual(expectedDateVtree('Tue Oct 17'));
    });
  });

  it('should show a message if there are no latest scores available', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(200, { date: {}, games: [] });

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      expect(getStatusNode(vtree)).toEqual(
        expectedStatusVtree(['No scores available.'], '.fade-in-fast.nope-animation'),
      );
    });
  });

  it('should show a message if fetching latest scores fails due to network offline', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(404, 'Fake error');

    const sinks = run(xs.of(nhlScoreApiUrl), { isOnline: false });
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      expect(getStatusNode(vtree)).toEqual(
        expectedStatusVtree(
          ['Failed to fetch scores: the network is offline.'],
          '.fade-in-fast.nope-animation',
        ),
      );
    });
  });

  it('should show a message if fetching latest scores fails due to non-JSON response content', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(503, '<!DOCTYPE html><html></html>', { 'Content-Type': 'text/html; charset=utf-8' });

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      expect(getStatusNode(vtree)).toEqual(
        expectedStatusVtree(['Failed to fetch scores.'], '.fade-in-fast.nope-animation'),
      );
    });
  });

  it('should show a message if an invalid date parameter is set', async () => {
    const sinks = run(xs.empty(), { search: '?date=oh-no' });
    await assertStreamValues(sinks.DOM.take(1), (vtree) => {
      expect(getStatusNode(vtree)).toEqual(
        expectedStatusVtree(['Invalid date parameter "oh-no".'], '.fade-in-fast.nope-animation'),
      );
    });
  });

  it('should show a message if fetching latest scores fails due to unknown error', async () => {
    nock(nhlScoreApiHost)
      .get(nhlScoreApiPath)
      .times(2) // Dunno why two HTTP requests are sent
      .reply(404, 'Fake error');

    const sinks = run(xs.of(nhlScoreApiUrl));
    await assertStreamValues(sinks.DOM.drop(1).take(1), (vtree) => {
      expect(getStatusNode(vtree)).toEqual(
        expectedStatusVtree(['Failed to fetch scores.'], '.fade-in-fast.nope-animation'),
      );
    });
  });
});

function run(
  httpRequest$: Stream<string>,
  options: { isOnline?: boolean; search?: string } = { isOnline: true, search: '' },
) {
  const driver = makeHTTPDriver();
  const $window = {
    location: { search: options.search ?? '' },
    navigator: { onLine: options.isOnline ?? true },
  } as Window;
  return app(animations, $window, { fetchStatusDelayMs: 0 })({
    DOM: mockDOMSource({}) as unknown as MainDOMSource,
    HTTP: driver(httpRequest$ as Stream<RequestInput | string>),
  });
}

function expectedStatusVtree(status: (string | VNode)[], animationClass: string) {
  return div(`.status${animationClass}`, status);
}

function expectedDateVtree(date: string) {
  return span('.header__date.fade-in', date);
}

function getHeaderNode(vtree: VNode) {
  return (vtree.children?.[0] as VNode | undefined)?.children?.[0] as VNode | undefined;
}

function getStatusNode(vtree: VNode) {
  return (vtree.children?.[1] as VNode | undefined)?.children?.[0] as VNode | undefined;
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
