import { div, span, VNode } from '@cycle/dom';

import { PERIOD_OVERTIME, PERIOD_SHOOTOUT } from '../events/constants';
import type { Goal, Teams } from '../types';
import TeamLogo from './team-logo';

type Props = {
  awayGoals: Goal[];
  homeGoals: Goal[];
  isBeforeGame: boolean;
  latestGoalPeriod?: string;
  teams: Teams;
};

export default function ScorePanel({
  awayGoals,
  homeGoals,
  isBeforeGame,
  latestGoalPeriod,
  teams,
}: Props): VNode {
  const scoreVisibilityClass = isBeforeGame ? '.team-panel__team-score--hidden' : '.fade-in';
  const delimiterVisibilityClass = isBeforeGame ? '' : '.fade-in';
  return div('.score-panel', [
    div('.team-panel.team-panel--away', [
      TeamLogo(teams.away.abbreviation, 'away'),
      span('.team-panel__team-name', teams.away.abbreviation),
      span(`.team-panel__team-score${scoreVisibilityClass}`, [awayGoals.length]),
    ]),
    div(
      `.team-panel__delimiter${delimiterVisibilityClass}`,
      isBeforeGame ? 'at' : renderDelimiter(latestGoalPeriod),
    ),
    div('.team-panel.team-panel--home', [
      span(`.team-panel__team-score${scoreVisibilityClass}`, [homeGoals.length]),
      span('.team-panel__team-name', teams.home.abbreviation),
      TeamLogo(teams.home.abbreviation, 'home'),
    ]),
  ]);
}

function renderDelimiter(period?: string): VNode | string {
  return period === PERIOD_OVERTIME || period === PERIOD_SHOOTOUT || Number(period) > 3
    ? span('.team-panel__delimiter-period', period === PERIOD_SHOOTOUT ? 'SO' : 'OT')
    : '';
}
