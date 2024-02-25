import { div, span, VNode } from '@cycle/dom';
import _ from 'lodash';

import type { Goal, TeamAbbreviation, TeamPlayoffSeries, Teams } from '../types';

type Props = {
  addCurrentGameToWins: boolean;
  awayGoals: Goal[];
  homeGoals: Goal[];
  playoffSeries?: TeamPlayoffSeries;
  teams: Teams;
};

export default function SeriesWinsPanel({
  addCurrentGameToWins,
  awayGoals,
  homeGoals,
  playoffSeries,
  teams,
}: Props): VNode | null {
  if (!playoffSeries) {
    return null;
  }

  const playoffSeriesWins = getPlayoffSeriesWins(
    teams,
    awayGoals,
    homeGoals,
    playoffSeries,
    addCurrentGameToWins,
  );
  const animationClass = addCurrentGameToWins ? '.fade-in' : '';

  return div(
    `.game__series-wins${animationClass}`,
    getSeriesWinsDescription(playoffSeriesWins, playoffSeries.round),
  );
}

function getSeriesWinsDescription(
  seriesWins: Record<TeamAbbreviation, number>,
  playoffRound: number,
): string | (VNode | string)[] {
  const teamsWithWins = _.map(seriesWins, (wins, team) => ({ team, wins }));
  const sortedByWins = _.sortBy(teamsWithWins, 'wins');
  const leading = _.last(sortedByWins);
  const leadingWins = leading?.wins ?? 0;
  const trailingWins = _.first(sortedByWins)?.wins ?? 0;

  if (leadingWins === 0 && trailingWins === 0) {
    const roundDescriptions = ['Qualifier', '1st round', '2nd round', 'Conference final', 'Final'];
    return `${roundDescriptions[playoffRound]} - Game 1`;
  }

  if (leadingWins === trailingWins) {
    return [
      'Series ',
      span('.series-wins__tied', 'tied'),
      ' ',
      span('.series-wins__tied-count', String(leadingWins)),
      span('.series-wins__delimiter', '-'),
      span('.series-wins__tied-count', String(trailingWins)),
    ];
  }

  const seriesWinCount = playoffRound === 0 ? 3 : 4;
  return [
    span('.series-wins__leading-team', leading?.team),
    leadingWins === seriesWinCount ? ' wins ' : ' leads ',
    span('.series-wins__leading-count', String(leadingWins)),
    span('.series-wins__delimiter', '-'),
    span('.series-wins__trailing-count', String(trailingWins)),
  ];
}

function getPlayoffSeriesWins(
  teams: Teams,
  awayGoals: Goal[],
  homeGoals: Goal[],
  playoffSeries: TeamPlayoffSeries,
  addCurrentGameToWins: boolean,
): Record<TeamAbbreviation, number> {
  return addCurrentGameToWins
    ? getPlayoffSeriesWinsAfterGame(playoffSeries.wins, teams, awayGoals, homeGoals)
    : playoffSeries.wins;
}

function getPlayoffSeriesWinsAfterGame(
  seriesWins: TeamPlayoffSeries['wins'],
  teams: Props['teams'],
  awayGoals: Props['awayGoals'],
  homeGoals: Props['homeGoals'],
): Record<TeamAbbreviation, number> {
  const updatedWinCount =
    awayGoals.length > homeGoals.length
      ? { [teams.away.abbreviation]: seriesWins[teams.away.abbreviation] + 1 }
      : { [teams.home.abbreviation]: seriesWins[teams.home.abbreviation] + 1 };
  return _.merge({}, seriesWins, updatedWinCount);
}
