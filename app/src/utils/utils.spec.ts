import { getGameAnimationIndexes, truncatePlayerName } from './utils';

describe('utils', () => {
  describe('truncatePlayerName', () => {
    it('should not truncate a name shorter than 21 characters', () => {
      const name = 'Ryan Nugent-Hopkinsss';
      expect(truncatePlayerName(name)).toEqual(name);
    });

    it('should truncate a single-part first name of name longer than 20 characters', () => {
      const name = 'Ryannn Nugent-Hopkinss';
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

    it('should count narrow characters as half characters', () => {
      const name = 'Ili J-j'; // 6 narrow letters + 1 regular (space)
      expect(truncatePlayerName(name, 4)).toEqual(name);
    });

    it('should count wide characters as one-and-a-half characters', () => {
      const name = 'Mam Wow'; // 4 wide letters + 3 regular (a, o, space)
      expect(truncatePlayerName(name, 8)).toEqual('M. Wow');
    });
  });

  describe('getAnimationIndexes', () => {
    it('should return empty indexes for zero games', () => {
      expect(getGameAnimationIndexes(0)).toEqual([]);
    });

    it('should return correct indexes for an even number of games', () => {
      expect(getGameAnimationIndexes(8)).toEqual([0, 14, 2, 12, 4, 10, 6, 8]);
    });

    it('should return correct indexes for an odd number of games', () => {
      expect(getGameAnimationIndexes(7)).toEqual([0, 14, 2, 11, 5, 9, 7]);
    });
  });
});
