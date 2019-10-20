import { assert } from 'chai';

import { getGameAnimationIndexes, truncatePlayerName } from '../app/js/utils';

describe('utils', () => {
  describe('truncatePlayerName', () => {
    it('should not truncate a name shorter than 21 characters', () => {
      const name = 'Ryan Nugent-Hopkinss';
      assert.equal(truncatePlayerName(name), name);
    });

    it('should truncate a single-part first name of name longer than 20 characters', () => {
      const name = 'Ryann Nugent-Hopkinss';
      assert.equal(truncatePlayerName(name), 'R. Nugent-Hopkinss');
    });

    it('should truncate a two-part first name of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre Parenteau';
      assert.equal(truncatePlayerName(name), 'P.A. Parenteau');
    });

    it('should truncate a three-part first name of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre-Jean Parenteau';
      assert.equal(truncatePlayerName(name), 'P.A.J. Parenteau');
    });

    it('should truncate multiple first names of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre Jean Parenteau';
      assert.equal(truncatePlayerName(name), 'P.A.J. Parenteau');
    });
  });

  describe('getAnimationIndexes', () => {
    it('should return empty indexes for zero games', () => {
      assert.deepEqual(getGameAnimationIndexes(0), []);
    });

    it('should return correct indexes for an even number of games', () => {
      assert.deepEqual(getGameAnimationIndexes(6), [0, 2, 1, 1, 2, 0]);
    });

    it('should return correct indexes for an odd number of games', () => {
      // Both columns' animations finish at the same time at index 3
      assert.deepEqual(getGameAnimationIndexes(7), [0, 3, 1, 2, 2, 1, 3]);
    });
  });
});
