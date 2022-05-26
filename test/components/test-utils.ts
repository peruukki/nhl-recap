import { VNode } from '@cycle/dom';

export function getGameCard(vtree: VNode): string | VNode | undefined {
  return vtree.children?.[0];
}
