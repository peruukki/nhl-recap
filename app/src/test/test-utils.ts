import { Stream } from 'xstream';

export function addListener<T>(
  success: (value?: unknown) => void,
  failure: (error: unknown) => void,
  stream$: Stream<T>,
  assertFn: (value: T) => void,
): void {
  stream$.addListener({
    next: (value) => assertFn(value),
    error: (err) => failure(err),
    complete: success,
  });
}
