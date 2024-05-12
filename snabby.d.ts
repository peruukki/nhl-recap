import type { VNode } from '@cycle/dom';

declare module 'snabby' {
  function html(strings: string[]): VNode;
  function html(strings: TemplateStringsArray, ...values: unknown[]): VNode;
  export = html;
}
