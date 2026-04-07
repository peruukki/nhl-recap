import { div, span, type VNode } from '@cycle/dom';

import type { Teams, TeamValues } from '../../../types';

type Renderable = number | string | VNode;

interface StatProps<T> {
  classFn?: (value: T) => string;
  label: string;
  ratingFn: (value: T) => number | string;
  renderFn: (value: T, side: 'away' | 'home') => Renderable | Renderable[];
  teams: Teams;
  values: TeamValues<T> | undefined;
}

export function renderStat<T>({
  classFn,
  label,
  ratingFn,
  renderFn,
  teams,
  values,
}: StatProps<T>): VNode {
  const valueClassName = '.stat__value';
  const highlightClassNames = getHighlightClassNames(valueClassName, teams, values, ratingFn);
  const getExtraClasses = (value: T | undefined) => {
    if (!value || !classFn) {
      return '';
    }
    const extra = classFn(value);
    return extra ? valueClassName + extra : '';
  };

  return div('.stat', [
    span(
      `${valueClassName}${valueClassName}--away${highlightClassNames.away}${getExtraClasses(
        values?.[teams.away.abbreviation],
      )}`,
      values ? renderFn(values[teams.away.abbreviation], 'away') : '',
    ),
    span('.stat__label', values ? label : ''),
    span(
      `${valueClassName}${valueClassName}--home${highlightClassNames.home}${getExtraClasses(
        values?.[teams.home.abbreviation],
      )}`,
      values ? renderFn(values[teams.home.abbreviation], 'home') : '',
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
