import { div } from '@cycle/dom';

import type { GameStats as GameStatsT, TeamStats as TeamStatsT, Teams } from '../../../types';
import GameStats from './game-stats';
import TeamStats from './team-stats';

type Props = {
  gameStats?: GameStatsT;
  isPlayoffGame: boolean;
  seasonId: number;
  showGamesLeft: boolean;
  showGameStats: boolean;
  showProgressInfo: boolean;
  teams: Teams;
  teamStatsInfo: TeamStatsInfo;
};

export type TeamStatsInfo =
  | { show: false }
  | {
      isAfterGameDisplayState: boolean;
      show: true;
      stats: TeamStatsT | undefined;
      type: 'afterGame' | 'preGame';
    };

export default function StatsPanel({
  gameStats,
  isPlayoffGame,
  seasonId,
  showGamesLeft,
  showGameStats,
  showProgressInfo,
  teams,
  teamStatsInfo,
}: Props) {
  return div('.stats-panel', [
    div('.stats-panel__container', [
      showGameStats && gameStats ? GameStats(teams, gameStats) : null,
      teamStatsInfo.show
        ? TeamStats({
            fadeIn: showProgressInfo || teamStatsInfo.isAfterGameDisplayState,
            isPlayoffGame,
            seasonId,
            showGamesLeft,
            stats: teamStatsInfo.stats,
            statsType: teamStatsInfo.type,
            teams,
          })
        : null,
    ]),
  ]);
}
