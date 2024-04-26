import { a, div } from '@cycle/dom';
import type { GameDisplay, Links } from '../types';
import Expandable from './expandable';

function Link(label: string, url: string) {
  return a(
    '.links-panel__link',
    { props: { href: url, rel: 'nofollow noreferrer', target: '_blank' } },
    label,
  );
}

export default function LinksPanel({
  gameDisplay,
  links,
}: {
  gameDisplay: GameDisplay;
  links?: Links;
}) {
  return links?.gameCenter || links?.videoRecap
    ? Expandable(
        {
          show: ['pre-game', 'post-game-finished', 'post-game-in-progress'].includes(gameDisplay),
        },
        [
          div('.links-panel', [
            div('.links-panel__heading', 'More on nhl.com'),
            div('.links-panel__link-container', [
              links.gameCenter ? Link('Game center', links.gameCenter) : null,
              links.videoRecap ? Link('Video recap', links.videoRecap) : null,
            ]),
          ]),
        ],
      )
    : null;
}
