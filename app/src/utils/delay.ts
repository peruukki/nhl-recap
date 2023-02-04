import xs, { Stream } from 'xstream';

/**
 * Delays source stream emits at least by given delay.
 *
 * If the source stream emits values before given delay has passed, the last value is emitted once
 * the delay has passed. Any values after the delay has passed are emitted immediately.
 *
 * @param delayMs how long to wait at least before emitting
 * @returns delayed stream
 */
export function delayAtLeast<T>(delayMs: number): (stream$: Stream<T>) => Stream<T> {
  return (stream$) =>
    xs.combine(stream$, xs.periodic(delayMs).take(1)).map(([streamValue]) => streamValue);
}
