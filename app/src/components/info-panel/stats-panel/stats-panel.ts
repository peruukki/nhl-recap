import { div } from '@cycle/dom';

import type { GameStats as GameStatsT, TeamStats as TeamStatsT, Teams } from '../../../types';
import GameStats from './game-stats';
import TeamStats from './team-stats';

type Props = {
  gameStats?: GameStatsT;
  isPlayoffGame: boolean;
  showGameStats: boolean;
  showProgressInfo: boolean;
  teamStatsInfo: TeamStatsInfo;
  teams: Teams;
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
  showGameStats,
  showProgressInfo,
  teamStatsInfo,
  teams,
}: Props) {
  return div(
    '.stats-panel',
    showGameStats || teamStatsInfo.show
      ? [
          showGameStats && gameStats ? GameStats(teams, gameStats) : null,
          teamStatsInfo.show
            ? TeamStats({
                fadeIn: showProgressInfo || teamStatsInfo.isAfterGameDisplayState,
                isPlayoffGame,
                stats: teamStatsInfo.stats,
                statsType: teamStatsInfo.type,
                teams,
              })
            : null,
        ]
      : null,
  );
}
