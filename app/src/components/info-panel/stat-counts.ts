import type { TeamStats } from '../../types';

export type StatKey = Exclude<keyof TeamStats, 'playoffSeries'>;

const anyGameStatCounts: Record<string, number> = {
  records: 1,
  standings: 3,
  streaks: 1,
} satisfies Record<StatKey, number>;

const nonPlayoffGameStatCounts: Record<string, number> = {
  records: 1,
  standings: 1,
  streaks: 0,
} satisfies Record<StatKey, number>;

export function getTeamStatCount(statKeys: string[], isPlayoffGame: boolean) {
  return statKeys.reduce(
    (count, stat) =>
      count +
      (anyGameStatCounts[stat] ?? 0) +
      (isPlayoffGame ? 0 : (nonPlayoffGameStatCounts[stat] ?? 0)),
    0,
  );
}
