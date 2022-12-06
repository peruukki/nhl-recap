import { getGameAnimationIndexes, truncatePlayerName } from './utils';

describe('utils', () => {
  describe('truncatePlayerName', () => {
    it('should not truncate a name shorter than 21 characters', () => {
      const name = 'Ryan Nugent-Hopkinss';
      expect(truncatePlayerName(name)).toEqual(name);
    });

    it('should truncate a single-part first name of name longer than 20 characters', () => {
      const name = 'Ryann Nugent-Hopkinss';
      expect(truncatePlayerName(name)).toEqual('R. Nugent-Hopkinss');
    });

    it('should truncate a two-part first name of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre Parenteau';
      expect(truncatePlayerName(name)).toEqual('P.A. Parenteau');
    });

    it('should truncate a three-part first name of name longer than 20 characters', () => {
      const name = 'Pierre-Alexandre-Jean Parenteau';
      expect(truncatePlayerName(name)).toEqual('P.A.J. Parenteau');
    });

    it('should truncate only first name of name longer than 20 characters', () => {
      const name = 'Joel-Alexandre Eriksson Ek';
      expect(truncatePlayerName(name)).toEqual('J.A. Eriksson Ek');
    });

    it('should truncate a name longer than given maximum length', () => {
      const name = 'Ryan Nugent';
      expect(truncatePlayerName(name, 10)).toEqual('R. Nugent');
    });

    it('should return only last name if first name truncation is not short enough', () => {
      const name = 'Ryan Nugent-Hopkins';
      expect(truncatePlayerName(name, 15)).toEqual('Nugent-Hopkins');
    });
  });

  describe('getAnimationIndexes', () => {
    it('should return empty indexes for zero games', () => {
      expect(getGameAnimationIndexes(0)).toEqual([]);
    });

    it('should return correct indexes for an even number of games', () => {
      expect(getGameAnimationIndexes(6)).toEqual([0, 2, 1, 1, 2, 0]);
    });

    it('should return correct indexes for an odd number of games', () => {
      // Both columns' animations finish at the same time at index 3
      expect(getGameAnimationIndexes(7)).toEqual([0, 3, 1, 2, 2, 1, 3]);
    });
  });
});
