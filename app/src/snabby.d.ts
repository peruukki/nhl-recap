declare module 'snabby' {
  const html: {
    (strings: string[]): import('@cycle/dom').VNode;
    (strings: TemplateStringsArray, ...values: unknown[]): import('@cycle/dom').VNode;
  };
  export default html;
}
