import { span, VNode } from '@cycle/dom';
import classNames from 'classnames';

import { renderTeamLogoSVG } from '../utils/logos';

export default function TeamLogo(teamAbbreviation: string, modifier?: string): VNode {
  const baseClassName = 'team-logo__image';
  const scoreListClass = classNames({
    [baseClassName]: true,
    [`${baseClassName}--${modifier}`]: !!modifier,
    [`${baseClassName}--${teamAbbreviation}`]: true,
  });
  return span('.team-logo', [renderTeamLogoSVG(teamAbbreviation, scoreListClass)]);
}
