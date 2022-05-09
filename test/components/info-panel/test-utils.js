import { div, span } from '@cycle/dom';

export function expectedStat({ away, home, label }) {
  const valueClass = '.stat__value';
  return div('.stat', [
    span(
      `${valueClass}${valueClass}--away${away.className ? valueClass + away.className : ''}`,
      away.value,
    ),
    span('.stat__label', label),
    span(
      `${valueClass}${valueClass}--home${home.className ? valueClass + home.className : ''}`,
      home.value,
    ),
  ]);
}
