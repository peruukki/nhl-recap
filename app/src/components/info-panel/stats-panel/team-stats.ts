import { div, span, type VNode } from '@cycle/dom';

import type { TeamRecord, TeamStats as TeamStatsT, TeamStreak, Teams } from '../../../types';
import { getGamesPlayed, REGULAR_SEASON_GAME_COUNT } from '../../../utils/utils';
import Icon from '../../icon';
import { renderStat } from './common';

type Props = {
  fadeIn: boolean;
  isPlayoffGame: boolean;
  showGamesLeft: boolean;
  stats?: TeamStatsT;
  statsType: 'afterGame' | 'preGame';
  teams: Teams;
};

export default function TeamStats({
  fadeIn,
  isPlayoffGame,
  showGamesLeft,
  stats,
  statsType,
  teams,
}: Props): VNode {
  return div(
    '.stats',
    { class: { 'fade-in': fadeIn } },
    [
      div('.stats__heading', 'Team stats'),
      div('.stats__subheading', statsType === 'preGame' ? 'before game' : 'after game'),
      renderStat(teams, stats?.standings, 'Div. rank', getDivisionRankRating, renderDivisionRank),
      renderStat(
        teams,
        stats?.standings,
        'Conf. rank',
        getConferenceRankRating,
        renderConferenceRank,
      ),
      renderStat(teams, stats?.standings, 'NHL rank', getLeagueRankRating, renderLeagueRank),
      renderStat(
        teams,
        isPlayoffGame ? undefined : stats?.records,
        'Point-%',
        renderWinPercentage,
        renderWinPercentage,
      ),
      renderStat(
        teams,
        stats?.records,
        isPlayoffGame ? 'Season pts' : 'Record',
        isPlayoffGame ? getRegularSeasonPoints : renderWinPercentage,
        isPlayoffGame ? getRegularSeasonPoints : renderRecord,
      ),
      showGamesLeft && !isPlayoffGame
        ? renderStat(teams, stats?.records, 'Games left', getGamesRemaining, getGamesRemaining)
        : null,
      renderStat(
        teams,
        isPlayoffGame ? undefined : stats?.standings,
        'PO spot pts',
        getPlayoffSpotRating,
        renderPlayoffSpot,
        getPlayoffSpotClass,
      ),
      renderStat(
        teams,
        stats?.streaks ?? undefined,
        'Streak',
        getStreakRating,
        renderStreak,
        getStreakClass,
      ),
    ].filter((vnode): vnode is VNode => !!vnode),
  );
}

function getPointPercentage({ wins, losses, ot = 0 }: TeamRecord): number {
  const points = 2 * wins + ot;
  const maxPoints = 2 * (wins + losses + ot);
  return points / maxPoints;
}

function getStreakRating(streak?: TeamStreak): number {
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

function getConferenceRankRating({ conferenceRank }: { conferenceRank: string }): number {
  return -parseInt(conferenceRank, 10);
}

function getLeagueRankRating({ leagueRank }: { leagueRank: string }): number {
  return -parseInt(leagueRank, 10);
}

function getRegularSeasonPoints(record: TeamRecord): number {
  return 2 * record.wins + (record.ot ?? 0);
}

function getGamesRemaining(record: TeamRecord): number {
  return REGULAR_SEASON_GAME_COUNT - getGamesPlayed(record);
}

function renderWinPercentage(record: TeamRecord, _side?: 'away' | 'home'): string {
  const percentage = getPointPercentage(record);
  if (Number.isNaN(percentage)) {
    return '-';
  }

  const sliceIndex = percentage < 1 ? 1 : 0;
  return percentage.toFixed(3).slice(sliceIndex);
}

export const delimiter = span('.stat__delimiter', ['-']);

function renderRecord(
  { wins, losses, ot }: TeamRecord,
  _side?: 'away' | 'home',
): (VNode | number)[] {
  return ot !== undefined ? [wins, delimiter, losses, delimiter, ot] : [wins, delimiter, losses];
}

function renderStreak(
  streak: TeamStreak | undefined,
  side: 'away' | 'home',
): string | (VNode | string)[] {
  if (!streak) {
    return '-';
  }
  const text = `${streak.count} ${renderStreakType(streak)}`;
  const icon = renderStreakIcon(streak);
  if (!icon) {
    return text;
  }

  return side === 'away' ? [icon, span(text)] : [span(text), icon];
}

function renderStreakIcon(streak: TeamStreak): VNode | null {
  if (streak.count < 3 || streak.type === 'OT') {
    return null;
  }
  const type = streak.type === 'WINS' ? 'hot' : 'cold';
  const level = streak.count >= 10 ? 3 : streak.count >= 6 ? 2 : 1;
  return Icon(`${type}${level}`);
}

function getStreakClass(streak?: TeamStreak): string {
  if (!streak || streak.count < 3 || streak.type === 'OT') {
    return '';
  }
  const type = streak.type === 'WINS' ? 'win' : 'loss';
  const level = streak.count >= 10 ? 3 : streak.count >= 6 ? 2 : 1;
  return `--streak-${type}-${level}`;
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

function renderPlayoffSpot(
  { pointsFromPlayoffSpot }: { pointsFromPlayoffSpot: string },
  side: 'away' | 'home',
): string | (VNode | string)[] {
  if (!pointsFromPlayoffSpot) {
    return '-';
  }
  const text = pointsFromPlayoffSpot;
  const icon = renderPlayoffSpotIcon(parseInt(pointsFromPlayoffSpot, 10));
  if (!icon) {
    return text;
  }
  return side === 'away' ? [icon, span(text)] : [span(text), icon];
}

function renderPlayoffSpotIcon(pointDiff: number): VNode | null {
  if (pointDiff >= -5 && pointDiff <= -3) {
    return Icon('playoffSpotFar');
  }
  if (pointDiff >= -2 && pointDiff <= -1) {
    return Icon('playoffSpotClose');
  }
  if (pointDiff >= 0 && pointDiff <= 2) {
    return Icon('playoffSpotIn');
  }
  if (pointDiff >= 3 && pointDiff <= 5) {
    return Icon('playoffSpotSafe');
  }
  return null;
}

function getPlayoffSpotClass(standing?: { pointsFromPlayoffSpot: string }): string {
  if (!standing) {
    return '';
  }
  const pointDiff = parseInt(standing.pointsFromPlayoffSpot, 10);

  const classes = [];
  if (pointDiff >= -5 && pointDiff <= -3) {
    classes.push('--playoff-spot-far');
  } else if (pointDiff >= -2 && pointDiff <= -1) {
    classes.push('--playoff-spot-close');
  } else if (pointDiff >= 0 && pointDiff <= 2) {
    classes.push('--playoff-spot-in');
  } else if (pointDiff >= 3 && pointDiff <= 5) {
    classes.push('--playoff-spot-safe');
  }

  if (classes.length > 0) {
    if (standing.pointsFromPlayoffSpot.startsWith('+')) {
      classes.push('--positive');
    } else if (standing.pointsFromPlayoffSpot.startsWith('-')) {
      classes.push('--negative');
    }
  }

  return classes.join('.stat__value');
}

function renderDivisionRank(
  { divisionRank }: { divisionRank: string },
  _side?: 'away' | 'home',
): string {
  return divisionRank || '-';
}

function renderConferenceRank(
  { conferenceRank }: { conferenceRank: string },
  _side?: 'away' | 'home',
): string {
  return conferenceRank || '-';
}

function renderLeagueRank({ leagueRank }: { leagueRank: string }, _side?: 'away' | 'home'): string {
  return leagueRank || '-';
}
