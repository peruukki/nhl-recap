export function addListener(done, stream$, assertFn) {
  stream$.addListener({
    next: (value) => assertFn(value),
    error: (err) => done(err),
    complete: done,
  });
}
