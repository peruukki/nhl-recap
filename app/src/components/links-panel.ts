import { a, div } from '@cycle/dom';
import type { GameDisplay, Links } from '../types';

function Link(label: string, url: string) {
  return a(
    '.game__links__link',
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
  return ['pre-game', 'post-game-finished', 'post-game-in-progress'].includes(gameDisplay) && links
    ? div('.game__links', [
        div('.game__links__heading', 'More on nhl.com'),
        links.gameCenter ? Link('Game center', links.gameCenter) : null,
        links.videoRecap ? Link('Video recap', links.videoRecap) : null,
      ])
    : null;
}
