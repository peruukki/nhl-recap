import { VNode } from '@cycle/dom';

export function getGameCard(vtree: VNode): VNode | undefined {
  return (vtree.children as VNode[] | undefined)?.[0];
}
