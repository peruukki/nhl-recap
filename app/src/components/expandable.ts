import { VNode, div } from '@cycle/dom';

export default function Expandable({ show }: { show: boolean }, children: VNode[]) {
  const baseClassName = 'expandable';
  return div(
    `.${baseClassName}`,
    { class: { [`${baseClassName}--${show ? 'shown' : 'hidden'}`]: true } },
    [div(`.${baseClassName}__container`, children)],
  );
}
