import { div, span, VNode } from '@cycle/dom';

import type { TeamValues, Teams } from '../../../types';

type Renderable = number | string | VNode;

export function renderStat<T>(
  teams: Teams,
  values: TeamValues<T> | undefined,
  label: string,
  ratingFn: (value: T) => number | string,
  renderFn: (value: T) => Renderable | Renderable[],
): VNode {
  const valueClassName = '.stat__value';
  const highlightClassNames = getHighlightClassNames(valueClassName, teams, values, ratingFn);
  return div('.stat', [
    span(
      `${valueClassName}${valueClassName}--away${highlightClassNames.away}`,
      values ? renderFn(values[teams.away.abbreviation]) : '',
    ),
    span('.stat__label', values ? label : ''),
    span(
      `${valueClassName}${valueClassName}--home${highlightClassNames.home}`,
      values ? renderFn(values[teams.home.abbreviation]) : '',
    ),
  ]);
}

function getHighlightClassNames<T>(
  baseClassName: string,
  teams: Teams,
  values: TeamValues<T> | undefined,
  ratingFn: (value: T) => number | string,
): { away: string; home: string } {
  if (!values) {
    return { away: '', home: '' };
  }

  const awayRating = ratingFn(values[teams.away.abbreviation]);
  const homeRating = ratingFn(values[teams.home.abbreviation]);

  if (awayRating > homeRating) {
    return { away: `${baseClassName}--highlight`, home: '' };
  }
  if (homeRating > awayRating) {
    return { away: '', home: `${baseClassName}--highlight` };
  }
  return { away: '', home: '' };
}
