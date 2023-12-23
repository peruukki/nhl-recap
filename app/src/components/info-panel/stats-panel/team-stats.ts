import { div, span, VNode } from '@cycle/dom';

import type { TeamRecord, Teams, TeamStats as TeamStatsT, TeamStreak } from '../../../types';
import { renderStat } from './common';

export default function TeamStats(
  teams: Teams,
  fadeIn: boolean,
  isPlayoffGame: boolean,
  stats?: TeamStatsT,
): VNode {
  return div('.stats', { class: { 'fade-in': fadeIn } }, [
    div('.stats__heading', 'Team stats'),
    renderStat(teams, stats?.standings, 'Div. rank', getDivisionRankRating, renderDivisionRank),
    renderStat(teams, stats?.standings, 'NHL rank', getLeagueRankRating, renderLeagueRank),
    renderStat(
      teams,
      isPlayoffGame ? undefined : stats?.records,
      'Point-%',
      renderWinPercentage,
      renderWinPercentage,
    ),
    renderStat(teams, stats?.records, 'Record', renderWinPercentage, renderRecord),
    renderStat(teams, stats?.streaks || undefined, 'Streak', getStreakRating, renderStreak),
    renderStat(
      teams,
      isPlayoffGame ? undefined : stats?.standings,
      'PO spot pts',
      getPlayoffSpotRating,
      renderPlayoffSpot,
    ),
  ]);
}

function getPointPercentage({ wins, losses, ot = 0 }: TeamRecord): number {
  const points = 2 * wins + ot;
  const maxPoints = 2 * (wins + losses + ot);
  return points / maxPoints;
}

function getStreakRating(streak: TeamStreak): number {
  return streak ? streak.count * getStreakMultiplier(streak.type) : 0;
}

function getStreakMultiplier(type: TeamStreak['type']): number {
  switch (type) {
    case 'WINS':
      return 1;
    case 'LOSSES':
      return -1;
    default:
      return 0;
  }
}

function getPlayoffSpotRating({
  pointsFromPlayoffSpot,
}: {
  pointsFromPlayoffSpot: string;
}): number {
  return parseInt(pointsFromPlayoffSpot, 10);
}

function getDivisionRankRating({ divisionRank }: { divisionRank: string }): number {
  return -parseInt(divisionRank, 10);
}

function getLeagueRankRating({ leagueRank }: { leagueRank: string }): number {
  return -parseInt(leagueRank, 10);
}

function renderWinPercentage(record: TeamRecord): string {
  const percentage = getPointPercentage(record);
  if (isNaN(percentage)) {
    return '-';
  }

  const sliceIndex = percentage < 1 ? 1 : 0;
  return percentage.toFixed(3).slice(sliceIndex);
}

export const delimiter = span('.stat__delimiter', ['-']);

function renderRecord({ wins, losses, ot }: TeamRecord): (VNode | number)[] {
  return ot !== undefined ? [wins, delimiter, losses, delimiter, ot] : [wins, delimiter, losses];
}

function renderStreak(streak?: TeamStreak): string {
  return streak ? `${streak.count} ${renderStreakType(streak)}` : '-';
}

function renderStreakType({ type }: TeamStreak): string {
  switch (type) {
    case 'WINS':
      return 'W';
    case 'LOSSES':
      return 'L';
    case 'OT':
      return 'OT L';
    default:
      return '';
  }
}

function renderPlayoffSpot({ pointsFromPlayoffSpot }: { pointsFromPlayoffSpot: string }): string {
  return pointsFromPlayoffSpot || '';
}

function renderDivisionRank({ divisionRank }: { divisionRank: string }): string {
  return divisionRank || '';
}

function renderLeagueRank({ leagueRank }: { leagueRank: string }): string {
  return leagueRank || '';
}
