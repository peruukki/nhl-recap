import { div } from '@cycle/dom';

import { renderStat } from './common';

export default function GameStats(teams, stats) {
  return div('.stats.stats--game-stats', { class: { 'fade-in': true } }, [
    div('.stats__heading', 'Game stats'),
    renderStat(teams, stats.shots, 'Shots', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.blocked, 'Blocked', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.pim, 'Penalty min', getNegativeNumericalRating, renderPlainValue),
    renderStat(teams, stats.hits, 'Hits', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.giveaways, 'Giveaways', getNegativeNumericalRating, renderPlainValue),
    renderStat(teams, stats.takeaways, 'Takeaways', getPositiveNumericalRating, renderPlainValue),
    renderStat(teams, stats.powerPlay, 'Power play', getPowerPlayRating, renderPowerPlay),
    renderStat(
      teams,
      stats.faceOffWinPercentage,
      'Faceoff-%',
      getPositiveNumericalRating,
      renderPlainValue,
    ),
  ]);
}

function getPositiveNumericalRating(value) {
  return Number(value);
}

function getNegativeNumericalRating(value) {
  return -Number(value);
}

function getPowerPlayRating({ percentage }) {
  return percentage;
}

function renderPlainValue(value) {
  return value;
}

function renderPowerPlay({ goals, opportunities }) {
  return `${goals}/${opportunities}`;
}
