import { Stream } from 'xstream';

export function addListener<T>(
  done: (error?: Error) => void,
  stream$: Stream<T>,
  assertFn: (value: T) => void,
): void {
  stream$.addListener({
    next: (value) => assertFn(value),
    error: (err) => done(err),
    complete: done,
  });
}
