import { div, span } from '@cycle/dom';
import _ from 'lodash';

export default function SeriesWinsPanel(seriesWins, playoffRound, isChanged) {
  const animationClass = isChanged ? '.fade-in' : '';
  return div(
    `.game__series-wins${animationClass}`,
    getSeriesWinsDescription(seriesWins, playoffRound)
  );
}

function getSeriesWinsDescription(seriesWins, playoffRound) {
  const teamsWithWins = _.map(seriesWins, (wins, team) => ({ team, wins }));
  const sortedByWins = _.sortBy(teamsWithWins, 'wins');
  const leading = _.last(sortedByWins);
  const trailing = _.first(sortedByWins);

  if (leading.wins === 0 && trailing.wins === 0) {
    const roundDescriptions = ['Qualifier', '1st round', '2nd round', 'Semifinal', 'Final'];
    return `${roundDescriptions[playoffRound]} - Game 1`;
  }

  if (leading.wins === trailing.wins) {
    return [
      'Series ',
      span('.series-wins__tied', 'tied'),
      ' ',
      span('.series-wins__tied-count', String(leading.wins)),
      span('.series-wins__delimiter', '-'),
      span('.series-wins__tied-count', String(trailing.wins)),
    ];
  }

  const seriesWinCount = playoffRound === 0 ? 3 : 4;
  return [
    span('.series-wins__leading-team', leading.team),
    leading.wins === seriesWinCount ? ' wins ' : ' leads ',
    span('.series-wins__leading-count', String(leading.wins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__trailing-count', String(trailing.wins)),
  ];
}
