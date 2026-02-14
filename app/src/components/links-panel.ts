import { a, div, span } from '@cycle/dom';

import type { GameDisplay, Links, Teams } from '../types';
import { showPanel } from '../utils/ui';
import Expandable from './expandable';
import Icon from './icon';

type Props = {
  gameDisplay: GameDisplay;
  links?: Links;
  teams: Teams;
};

function Link({
  ariaLabelSuffix,
  label,
  url,
}: {
  ariaLabelSuffix: string;
  label: string;
  url: string;
}) {
  return a(
    '.links-panel__link',
    {
      props: {
        ariaLabel: `${label} ${ariaLabelSuffix}`,
        href: url,
        rel: 'nofollow noreferrer',
        target: '_blank',
      },
    },
    [label, span('.links-panel__link-icon-container', Icon('externalLink'))],
  );
}

export default function LinksPanel({ gameDisplay, links, teams }: Props) {
  const ariaLabelSuffix = `${teams.away.abbreviation} at ${teams.home.abbreviation}`;
  return links?.gameCenter || links?.videoRecap
    ? Expandable(
        {
          show: showPanel(gameDisplay, 'links'),
        },
        [
          div('.links-panel', [
            div('.links-panel__heading', 'More on nhl.com'),
            div('.links-panel__link-container', [
              links.gameCenter
                ? Link({ ariaLabelSuffix, label: 'Game center', url: links.gameCenter })
                : null,
              links.videoRecap
                ? Link({ ariaLabelSuffix, label: 'Video recap', url: links.videoRecap })
                : null,
            ]),
          ]),
        ],
      )
    : null;
}
