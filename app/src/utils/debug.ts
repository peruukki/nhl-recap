const eventCounts = new Map<string, number>();

/**
 * Returns a function to pass to a stream's .debug() method. Logs events with `console.debug()`.
 * Includes the number of times the function has been called for the same label.
 *
 * To enable debug logging, set the `VITE_DEBUG` environment variable to `true`.
 *
 * @param label the label for the stream's logs, usually the name of the stream
 * @returns a function to pass to a stream's .debug() method
 */
export const debugFn =
  import.meta.env.VITE_DEBUG === 'true'
    ? (label: string) => (event: unknown) => {
        const count = (eventCounts.get(label) ?? 0) + 1;
        eventCounts.set(label, count);
        console.debug(`${label} (${count})`, event);
      }
    : () => () => undefined;
