import { VNode } from '@cycle/dom';
import classNames from 'classnames';

import { renderTeamLogoSVG } from '../../utils/logos';

export default function PlayerLogo(teamId: number): VNode {
  const baseClassName = 'player-logo';
  const classes = classNames({
    [baseClassName]: true,
    [`${baseClassName}--${teamId}`]: true,
  });
  return renderTeamLogoSVG(teamId, classes);
}
