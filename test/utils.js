import chai from 'chai';

import {truncatePlayerName} from '../app/js/utils';

const assert = chai.assert;

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
});
