import { VNode } from '@cycle/dom';
import classNames from 'classnames';

import { renderTeamLogoSVG } from '../../utils/logos';

export default function PlayerLogo(teamAbbreviation: string): VNode {
  const baseClassName = 'player-logo';
  const teamLogoBaseClassName = 'team-logo__image';
  const classes = classNames({
    [baseClassName]: true,
    [`${baseClassName}--${teamAbbreviation}`]: true,
    [`${teamLogoBaseClassName}--${teamAbbreviation}`]: true,
  });
  return renderTeamLogoSVG(teamAbbreviation, classes);
}
