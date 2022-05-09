import { div, span } from '@cycle/dom';

import { renderStat } from './common';

export default function TeamStats(teams, fadeIn, showAfterGameStats, isPlayoffGame, stats) {
  const modifierClass = showAfterGameStats ? '.stats--after-game' : '';
  return div(`.stats.stats--team-stats${modifierClass}`, { class: { 'fade-in': fadeIn } }, [
    div('.stats__heading', 'Team stats'),
    renderStat(teams, stats.standings, 'Div. rank', getDivisionRankRating, renderDivisionRank),
    renderStat(teams, stats.standings, 'NHL rank', getLeagueRankRating, renderLeagueRank),
    renderStat(
      teams,
      isPlayoffGame ? null : stats.records,
      'Point-%',
      renderWinPercentage,
      renderWinPercentage,
    ),
    renderStat(teams, stats.records, 'Record', renderWinPercentage, renderRecord),
    renderStat(teams, stats.streaks, 'Streak', getStreakRating, renderStreak),
    renderStat(
      teams,
      isPlayoffGame ? null : stats.standings,
      'PO spot pts',
      getPlayoffSpotRating,
      renderPlayoffSpot,
    ),
  ]);
}

function getPointPercentage({ wins, losses, ot = 0 }) {
  const points = 2 * wins + ot;
  const maxPoints = 2 * (wins + losses + ot);
  return points / maxPoints;
}

function getStreakRating(streak) {
  return streak ? streak.count * getStreakMultiplier(streak.type) : 0;
}

function getStreakMultiplier(type) {
  switch (type) {
    case 'WINS':
      return 1;
    case 'LOSSES':
      return -1;
    default:
      return 0;
  }
}

function getPlayoffSpotRating({ pointsFromPlayoffSpot }) {
  return parseInt(pointsFromPlayoffSpot, 10);
}

function getDivisionRankRating({ divisionRank }) {
  return -parseInt(divisionRank, 10);
}

function getLeagueRankRating({ leagueRank }) {
  return -parseInt(leagueRank, 10);
}

function renderWinPercentage(record) {
  const percentage = getPointPercentage(record);
  if (isNaN(percentage)) {
    return '-';
  }

  const sliceIndex = percentage < 1 ? 1 : 0;
  return percentage.toFixed(3).slice(sliceIndex);
}

export const delimiter = span('.stat__delimiter', ['-']);

function renderRecord({ wins, losses, ot }) {
  return ot !== undefined ? [wins, delimiter, losses, delimiter, ot] : [wins, delimiter, losses];
}

function renderStreak(streak) {
  return streak ? `${streak.count} ${renderStreakType(streak)}` : '-';
}

function renderStreakType({ type }) {
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

function renderPlayoffSpot({ pointsFromPlayoffSpot }) {
  return pointsFromPlayoffSpot || '';
}

function renderDivisionRank({ divisionRank }) {
  return divisionRank || '';
}

function renderLeagueRank({ leagueRank }) {
  return leagueRank || '';
}
