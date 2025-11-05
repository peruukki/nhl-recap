import _ from 'lodash';

const narrowCharacters = ['i', 'j', 'l', 'I', 'J', '-', '.'];
const wideCharacters = ['m', 'w', 'M', 'W'];

function getNameLength(name: string) {
  return (
    name.split('').reduce((sum, c) => {
      if (narrowCharacters.includes(c)) {
        return sum + 5;
      }
      if (wideCharacters.includes(c)) {
        return sum + 15;
      }
      return sum + 10;
    }, 0) / 10
  );
}

export function truncatePlayerName(name: string, maxLength = 20): string {
  if (getNameLength(name) <= maxLength) {
    return name;
  }

  const names = name.split(' ');
  const firstName = _.first(names) ?? '';
  const lastNames = _.drop(names).join(' ');
  const abbreviatedFirstName = firstName.split('-').map((namePart) => `${namePart[0]}.`);
  const truncatedName = `${abbreviatedFirstName.join('')} ${lastNames}`;
  return getNameLength(truncatedName) <= maxLength ? truncatedName : lastNames;
}

export function getGameAnimationIndexes(gameCount: number): number[] {
  return Array.from({ length: gameCount }, (value, index) => index);
}
