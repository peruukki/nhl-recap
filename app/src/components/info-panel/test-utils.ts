import { div, span, type VNode } from '@cycle/dom';

import { getGameCard } from '../test-utils';

export type StatValue = { className?: string; value: number | string | (VNode | number)[] };

export function getInfoPanel(vtree: VNode): VNode | undefined {
  return getGameCard(vtree)?.children?.[1] as VNode | undefined;
}

export function getStartingGoaliesPanel(vtree: VNode): VNode | undefined {
  const infoPanel = getInfoPanel(vtree);
  const section = infoPanel?.children?.[2] as VNode | undefined;
  const activeExpandable = (section?.children?.filter(Boolean) as VNode[] | undefined)?.find(
    (child) => child.data?.class?.['expandable--shown'],
  );
  return (activeExpandable?.children?.[0] as VNode | undefined)?.children?.[0] as VNode | undefined;
}

export function getStatsPanel(vtree: VNode): VNode | undefined {
  const infoPanel = getInfoPanel(vtree);
  const section = infoPanel?.children?.[3] as VNode | undefined;
  const activeExpandable = (section?.children?.filter(Boolean) as VNode[] | undefined)?.find(
    (child) => child.data?.class?.['expandable--shown'],
  );
  return (activeExpandable?.children?.[0] as VNode | undefined)?.children?.[0] as VNode | undefined;
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
