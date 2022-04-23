import { div, span } from '@cycle/dom';

export function renderStat(teams, values, label, ratingFn, renderFn) {
  const valueClassName = '.stat__value';
  const highlightClassNames = getHighlightClassNames(valueClassName, teams, values, ratingFn);
  return div('.stat', [
    span(
      `${valueClassName}${valueClassName}--away${highlightClassNames.away}`,
      values ? renderFn(values[teams.away.abbreviation]) : ''
    ),
    span('.stat__label', values ? label : ''),
    span(
      `${valueClassName}${valueClassName}--home${highlightClassNames.home}`,
      values ? renderFn(values[teams.home.abbreviation]) : ''
    ),
  ]);
}

function getHighlightClassNames(baseClassName, teams, values, ratingFn) {
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
