import { div } from '@cycle/dom';

import type { GameStats as GameStatsT, Teams } from '../../../types';
import { renderStat } from './common';

export default function GameStats(teams: Teams, stats: GameStatsT) {
  return div('.stats.stats--game-stats', [
    div('.stats__heading', 'Game stats'),
    renderStat(teams, stats.shots, 'Shots', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.blocked, 'Blocked', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.pim, 'Penalty min', getNegativeNumericalRating, renderPlainValue),
    renderStat(teams, stats.hits, 'Hits', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.giveaways, 'Giveaways', getNegativeNumericalRating, renderPlainValue),
    renderStat(teams, stats.takeaways, 'Takeaways', getPositiveNumericalRating, renderPlainValue),
    renderStat(
      teams,
      stats.powerPlay,
      'Power play',
      ({ percentage }) => getPositiveNumericalRating(percentage),
      renderPowerPlay,
    ),
    renderStat(
      teams,
      stats.faceOffWinPercentage,
      'Faceoff-%',
      getPositiveNumericalRating,
      renderPlainValue,
    ),
  ]);
}

function getPositiveNumericalRating(value: number | string): number {
  return Number(value);
}

function getNegativeNumericalRating(value: number | string): number {
  return -Number(value);
}

function renderPlainValue(value: number | string): number | string {
  return value;
}

function renderPowerPlay({
  goals,
  opportunities,
}: {
  goals: number;
  opportunities: number;
}): string {
  return `${goals}/${opportunities}`;
}
