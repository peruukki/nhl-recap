import _ from 'lodash';

export function truncatePlayerName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) {
    return name;
  }

  const names = name.split(' ');
  const firstNames = _.dropRight(names);
  const abbreviatedFirstNames = _.flatten(
    firstNames.map((firstName) => firstName.split('-').map((namePart) => `${namePart[0]}.`)),
  );
  const truncatedName = `${abbreviatedFirstNames.join('')} ${_.last(names)}`;
  return truncatedName.length <= maxLength ? truncatedName : _.last(names) ?? '';
}

export function getGameAnimationIndexes(gameCount: number): number[] {
  return _.times(gameCount, (index) => {
    const isEven = index % 2 === 0;
    // Animate first column (evens) from top to bottom, second column (odds) from bottom to top
    return isEven ? index / 2 : Math.floor((gameCount - index) / 2);
  });
}
