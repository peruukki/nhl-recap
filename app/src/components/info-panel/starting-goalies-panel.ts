import { div, span, type VNode } from '@cycle/dom';

import type { Rosters, Teams } from '../../types';
import { truncatePlayerName } from '../../utils/utils';
import PlayerLogo from './player-logo';

type Props = {
  rosters: Rosters;
  teams: Teams;
};

export default function StartingGoaliesPanel({ rosters, teams }: Props): VNode | null {
  const awayStartingGoalie = rosters.away.dressedPlayers.find(
    (player) => player.position === 'G' && player.startingLineup,
  );
  const homeStartingGoalie = rosters.home.dressedPlayers.find(
    (player) => player.position === 'G' && player.startingLineup,
  );

  if (!awayStartingGoalie || !homeStartingGoalie) {
    return null;
  }

  return div(
    '.starting-goalies',
    div('.starting-goalies__container.fade-in', [
      div('.starting-goalies__heading', 'Starting goalies'),
      div('.starting-goalies__goalies', [
        PlayerLogo(teams.away.abbreviation),
        span('.number', awayStartingGoalie.number),
        span('.name', truncatePlayerName(awayStartingGoalie.name, 25)),
        PlayerLogo(teams.home.abbreviation),
        span('.number', homeStartingGoalie.number),
        span('.name', truncatePlayerName(homeStartingGoalie.name, 25)),
      ]),
    ]),
  );
}
