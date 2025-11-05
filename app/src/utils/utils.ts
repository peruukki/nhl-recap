import _ from 'lodash';
import type { Team, TeamRecord, TeamStats } from '../types';

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

function areTeamRecordsEqual(record1?: TeamRecord, record2?: TeamRecord): boolean {
  const record1Keys = Object.keys(record1 ?? {}) as (keyof TeamRecord)[];
  const record2Keys = Object.keys(record2 ?? {}) as (keyof TeamRecord)[];
  return (
    record1Keys.length === record2Keys.length &&
    record1Keys.every((key) => record1?.[key] === record2?.[key])
  );
}

export function areTeamStatsEqual({
  currentStats,
  preGameStats,
  teams,
}: {
  currentStats?: Pick<TeamStats, 'records'>;
  preGameStats?: Pick<TeamStats, 'records'>;
  teams: {
    away: Pick<Team, 'abbreviation'>;
    home: Pick<Team, 'abbreviation'>;
  };
}): boolean {
  return (
    areTeamRecordsEqual(
      currentStats?.records[teams.away.abbreviation],
      preGameStats?.records[teams.away.abbreviation],
    ) &&
    areTeamRecordsEqual(
      currentStats?.records[teams.home.abbreviation],
      preGameStats?.records[teams.home.abbreviation],
    )
  );
}
