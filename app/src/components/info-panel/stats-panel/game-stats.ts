import { div } from '@cycle/dom';

import type { GameStats as GameStatsT, Teams } from '../../../types';
import { renderStat } from './common';

export default function GameStats(teams: Teams, stats: GameStatsT) {
  return div('.stats.stats--game-stats', [
    div('.stats__heading', 'Game stats'),
    renderStat({
      label: 'Shots',
      ratingFn: getPositiveNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.shots,
    }),
    renderStat({
      label: 'Blocked',
      ratingFn: getPositiveNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.blocked,
    }),
    renderStat({
      label: 'Penalty min',
      ratingFn: getNegativeNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.pim,
    }),
    renderStat({
      label: 'Hits',
      ratingFn: getPositiveNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.hits,
    }),
    renderStat({
      label: 'Giveaways',
      ratingFn: getNegativeNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.giveaways,
    }),
    renderStat({
      label: 'Takeaways',
      ratingFn: getPositiveNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.takeaways,
    }),
    renderStat({
      label: 'Power play',
      ratingFn: ({ percentage }) => getPositiveNumericalRating(percentage),
      renderFn: renderPowerPlay,
      teams,
      values: stats.powerPlay,
    }),
    renderStat({
      label: 'Faceoff-%',
      ratingFn: getPositiveNumericalRating,
      renderFn: renderPlainValue,
      teams,
      values: stats.faceOffWinPercentage,
    }),
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
