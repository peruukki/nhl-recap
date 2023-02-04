import fromDiagram from 'xstream/extra/fromDiagram';

import { delayAtLeast } from './delay';

describe('delayAtLeast', () => {
  it('emits only after given delay if source stream emits before it', (done) => {
    const stream = fromDiagram('123|', { timeUnit: 20 }).compose(delayAtLeast(30));
    const expected = ['2', '3'];
    stream.addListener({
      next: (x: string) => {
        expect(x).toEqual(expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        expect(expected).toHaveLength(0);
        done();
      },
    });
  });

  it('emits first value from source stream if passed zero delay', (done) => {
    const stream = fromDiagram('1|', { timeUnit: 20 }).compose(delayAtLeast(0));
    const expected = ['1'];
    stream.addListener({
      next: (x: string) => {
        expect(x).toEqual(expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        expect(expected).toHaveLength(0);
        done();
      },
    });
  });

  it('does not emit if source stream does not emit', (done) => {
    const stream = fromDiagram('---|', { timeUnit: 20 }).compose(delayAtLeast(30));
    stream.addListener({
      next: () => fail(new Error('Stream should not emit')),
      error: (err: Error) => done(err),
      complete: () => done(),
    });
  });
});
