import { describe, expect, it } from 'vitest';
import fromDiagram from 'xstream/extra/fromDiagram';

import { delayAtLeast } from './delay';

describe('delayAtLeast', () => {
  it('emits only after given delay if source stream emits before it', () =>
    new Promise<unknown>((done) => {
      const stream = fromDiagram('123|', { timeUnit: 20 }).compose(delayAtLeast(30));
      const expected = ['2', '3'];
      stream.addListener({
        next: (x: string) => {
          expect(x).toEqual(expected.shift());
        },
        error: (err: unknown) => done(err),
        complete: () => {
          expect(expected).toHaveLength(0);
          done(undefined);
        },
      });
    }));

  it('emits first value from source stream if passed zero delay', () =>
    new Promise((done) => {
      const stream = fromDiagram('1|', { timeUnit: 20 }).compose(delayAtLeast(0));
      const expected = ['1'];
      stream.addListener({
        next: (x: string) => {
          expect(x).toEqual(expected.shift());
        },
        error: (err: unknown) => done(err),
        complete: () => {
          expect(expected).toHaveLength(0);
          done(undefined);
        },
      });
    }));

  it('does not emit if source stream does not emit', () =>
    new Promise((done) => {
      const stream = fromDiagram('---|', { timeUnit: 20 }).compose(delayAtLeast(30));
      stream.addListener({
        next: () => {
          throw new Error('Stream should not emit');
        },
        error: (err: unknown) => done(err),
        complete: () => done(undefined),
      });
    }));
});
