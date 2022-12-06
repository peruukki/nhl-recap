import _ from 'lodash';

export function truncatePlayerName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) {
    return name;
  }

  const names = name.split(' ');
  const firstName = _.first(names) ?? '';
  const lastNames = _.drop(names).join(' ');
  const abbreviatedFirstName = firstName.split('-').map((namePart) => `${namePart[0]}.`);
  const truncatedName = `${abbreviatedFirstName.join('')} ${lastNames}`;
  return truncatedName.length <= maxLength ? truncatedName : lastNames;
}

export function getGameAnimationIndexes(gameCount: number): number[] {
  return _.times(gameCount, (index) => {
    const isEven = index % 2 === 0;
    // Animate first column (evens) from top to bottom, second column (odds) from bottom to top
    return isEven ? index / 2 : Math.floor((gameCount - index) / 2);
  });
}
