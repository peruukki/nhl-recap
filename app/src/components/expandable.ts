import { div, type VNode } from '@cycle/dom';

export default function Expandable({ show }: { show: boolean }, children: VNode[]) {
  const baseClassName = 'expandable';
  return div(
    `.${baseClassName}`,
    {
      attrs: { 'aria-hidden': show ? 'false' : 'true' },
      class: { [`${baseClassName}--${show ? 'shown' : 'hidden'}`]: true },
    },
    [div(`.${baseClassName}__container`, children)],
  );
}
