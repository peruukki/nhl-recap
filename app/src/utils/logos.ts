import { img, VNode } from '@cycle/dom';

export function renderTeamLogoSVG(teamAbbreviation: string, className: string): VNode {
  return img({
    attrs: {
      alt: '',
      class: className,
      src: `https://assets.nhle.com/logos/nhl/svg/${teamAbbreviation}_dark.svg`,
    },
  });
}
