import { Stream } from 'xstream';

/**
 * Calls `assertFn` for each value of `stream$`.
 *
 * @param stream$ An xstream Stream to listen to
 * @param assertFn An assertion function
 * @returns a Promise that resolves if the stream completes and rejects if the stream aborts due to an error
 */
export function assertStreamValues<Value>(
  stream$: Stream<Value>,
  assertFn: (value: Value) => void,
): Promise<void> {
  return new Promise((resolve, reject) =>
    stream$.addListener({
      next: (value) => assertFn(value),
      error: (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))),
      complete: resolve,
    }),
  );
}
