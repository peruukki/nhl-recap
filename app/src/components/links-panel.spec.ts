import type { VNode } from '@cycle/dom';

import { scoresAllRegularTime } from '../test/data';
import Game from './game';
import { getGameCard } from './test-utils';

describe('links panel', () => {
  const game = scoresAllRegularTime.games[0];
  const gameWithLink = { ...game, links: { gameCenter: 'game-center-link' } };

  it('should not exist if links are missing', () => {
    const linksPanel = getLinksPanel(Game('pre-game', game, [], 0));
    expect(linksPanel).toBeNull();
  });

  it('should not exist if there are no links to show', () => {
    const linksPanel = getLinksPanel(
      Game('pre-game', { ...game, links: { playoffSeries: 'playoff-series-link' } }, [], 0),
    );
    expect(linksPanel).toBeNull();
  });

  it('should show game center link when only it exists', () => {
    const links = getLinksPanelLinks(
      Game('pre-game', { ...game, links: { gameCenter: 'game-center-link' } }, [], 0),
    );
    expect(links[0]).not.toBeNull();
    expect(links[1]).toBeNull();
  });

  it('should show game center and video recap links when all known links exist', () => {
    const links = getLinksPanelLinks(
      Game(
        'pre-game',
        {
          ...game,
          links: {
            gameCenter: 'game-center-link',
            playoffSeries: 'playoff-series-link',
            videoRecap: 'video-recap-link',
          },
        },
        [],
        0,
      ),
    );
    expect(links[0]).not.toBeNull();
    expect(links[1]).not.toBeNull();
  });

  it('should be shown before playback has started', () => {
    const linksPanel = getLinksPanel(Game('pre-game', gameWithLink, [], 0));
    expect(linksPanel).toHaveProperty('data.class.expandable--shown', true);
  });

  it('should be hidden during playback', () => {
    const linksPanel = getLinksPanel(Game('playback', gameWithLink, [], 0));
    expect(linksPanel).toHaveProperty('data.class.expandable--hidden', true);
  });

  it('should be shown in post-game info for finished game', () => {
    const linksPanel = getLinksPanel(Game('post-game-finished', gameWithLink, [], 0));
    expect(linksPanel).toHaveProperty('data.class.expandable--shown', true);
  });

  it('should be shown in post-game info for in-progress game', () => {
    const linksPanel = getLinksPanel(Game('post-game-in-progress', gameWithLink, [], 0));
    expect(linksPanel).toHaveProperty('data.class.expandable--shown', true);
  });
});

function getLinksPanel(vtree: VNode): VNode | undefined {
  return (getGameCard(vtree)?.children?.[2] as VNode | undefined)?.children?.[0] as
    | VNode
    | undefined;
}

function getLinkContainer(vtree: VNode): VNode | undefined {
  return (
    (getLinksPanel(vtree)?.children?.[0] as VNode | undefined)?.children?.[0] as VNode | undefined
  )?.children?.[1] as VNode | undefined;
}

function getLinksPanelLinks(vtree: VNode) {
  return getLinkContainer(vtree)?.children ?? [];
}
