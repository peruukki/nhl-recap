import { div, span, VNode } from '@cycle/dom';

import { getGameCard } from '../test-utils';

export type StatValue = { className?: string; value: number | string | (VNode | number)[] };

export function getInfoPanel(vtree: VNode): VNode | undefined {
  return getGameCard(vtree)?.children?.[1] as VNode | undefined;
}

export function getStatsPanel(vtree: VNode): VNode | undefined {
  return getInfoPanel(vtree)?.children?.[2] as VNode | undefined;
}

export function expectedStat({
  away,
  home,
  label,
}: {
  away: StatValue;
  home: StatValue;
  label: string;
}) {
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
