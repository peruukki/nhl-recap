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

  const awayValue = values?.[teams.away.abbreviation];
  const homeValue = values?.[teams.home.abbreviation];

  return div('.stat', [
    span(
      `${valueClassName}${valueClassName}--away${highlightClassNames.away}${getExtraClasses(
        awayValue,
      )}`,
      awayValue !== undefined ? renderFn(awayValue, 'away') : '',
    ),
    span('.stat__label', values ? label : ''),
    span(
      `${valueClassName}${valueClassName}--home${highlightClassNames.home}${getExtraClasses(
        homeValue,
      )}`,
      homeValue !== undefined ? renderFn(homeValue, 'home') : '',
    ),
  ]);
}

function getHighlightClassNames<T>(
  baseClassName: string,
  teams: Teams,
  values: TeamValues<T> | undefined,
  ratingFn: (value: T) => number | string,
): { away: string; home: string } {
  const awayValue = values?.[teams.away.abbreviation];
  const homeValue = values?.[teams.home.abbreviation];

  if (awayValue === undefined || homeValue === undefined) {
    return { away: '', home: '' };
  }

  const awayRating = ratingFn(awayValue);
  const homeRating = ratingFn(homeValue);

  if (awayRating > homeRating) {
    return { away: `${baseClassName}--highlight`, home: '' };
  }
  if (homeRating > awayRating) {
    return { away: '', home: `${baseClassName}--highlight` };
  }
  return { away: '', home: '' };
}
