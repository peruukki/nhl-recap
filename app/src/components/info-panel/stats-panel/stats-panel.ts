import { div } from '@cycle/dom';

import type { GameStats as GameStatsT, TeamStats as TeamStatsT, Teams } from '../../../types';
import GameStats from './game-stats';
import TeamStats from './team-stats';

type Props = {
  gameStats?: GameStatsT;
  isPlayoffGame: boolean;
  showAfterGameStats: boolean;
  showGameStats: boolean;
  showPreGameStats: boolean;
  showProgressInfo: boolean;
  teamStats?: TeamStatsT;
  teams: Teams;
};

export default function StatsPanel({
  gameStats,
  isPlayoffGame,
  showAfterGameStats,
  showGameStats,
  showPreGameStats,
  showProgressInfo,
  teamStats,
  teams,
}: Props) {
  return div(
    '.stats-panel',
    showGameStats || ((showPreGameStats || showAfterGameStats) && teamStats)
      ? [
          showGameStats && gameStats ? GameStats(teams, gameStats) : null,
          (showPreGameStats || showAfterGameStats) && teamStats
            ? TeamStats({
                fadeIn: showProgressInfo || showAfterGameStats,
                isPlayoffGame,
                stats: teamStats,
                teams,
              })
            : null,
        ]
      : null,
  );
}
