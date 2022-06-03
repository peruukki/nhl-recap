import { div, span, VNode } from '@cycle/dom';
import { format } from 'timeago.js';

import {
  GAME_DISPLAY_IN_PROGRESS,
  GAME_DISPLAY_POST_GAME_FINISHED,
  GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  GAME_DISPLAY_PRE_GAME,
  PERIOD_SHOOTOUT,
} from '../../events/constants';
import {
  GameProgress,
  GameStats as GameStatsT,
  GameStatus,
  Goal,
  isShootoutGoal,
  Teams,
  TeamStats as TeamStatsT,
} from '../../types';
import { truncatePlayerName } from '../../utils/utils';
import { renderPeriodNumber, renderTime } from '../clock';
import GameStats from './stats/game-stats';
import TeamStats from './stats/team-stats';

type Props = {
  currentStats?: TeamStatsT;
  gameDisplay: string;
  gameStats: GameStatsT;
  isPlayoffGame: boolean;
  latestGoal?: Goal;
  preGameStats?: TeamStatsT;
  startTime: string;
  status: GameStatus;
  teams: Teams;
};

export default function InfoPanel({
  currentStats,
  gameDisplay,
  gameStats,
  isPlayoffGame,
  latestGoal,
  preGameStats,
  startTime,
  status,
  teams,
}: Props): VNode {
  const showProgressInfo = [
    GAME_DISPLAY_PRE_GAME,
    GAME_DISPLAY_IN_PROGRESS,
    GAME_DISPLAY_POST_GAME_IN_PROGRESS,
  ].includes(gameDisplay);
  const showGameStats =
    gameStats &&
    [GAME_DISPLAY_POST_GAME_FINISHED, GAME_DISPLAY_POST_GAME_IN_PROGRESS].includes(gameDisplay);
  const showPreGameStats = [GAME_DISPLAY_PRE_GAME, GAME_DISPLAY_POST_GAME_IN_PROGRESS].includes(
    gameDisplay,
  );
  const showAfterGameStats = gameDisplay === GAME_DISPLAY_POST_GAME_FINISHED;
  const teamStats = showPreGameStats ? preGameStats : showAfterGameStats ? currentStats : undefined;

  return div(
    '.game__info-panel',
    {
      class: {
        'game__info-panel--playoff': isPlayoffGame,
        'game__info-panel--with-game-stats': !isPlayoffGame && gameStats,
        'game__info-panel--playoff--with-game-stats': isPlayoffGame && gameStats,
      },
    },
    [
      gameDisplay !== GAME_DISPLAY_PRE_GAME ? renderLatestGoal(latestGoal) : null,
      showProgressInfo
        ? div('.game-description.fade-in', renderGameStatus(status, startTime))
        : null,
      showGameStats ? GameStats(teams, gameStats) : null,
      showPreGameStats || showAfterGameStats
        ? TeamStats(
            teams,
            showProgressInfo || showAfterGameStats,
            showAfterGameStats,
            isPlayoffGame,
            teamStats,
          )
        : null,
    ],
  );
}

function renderLatestGoal(latestGoal?: Goal): VNode {
  return div('.latest-goal', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : ''),
    div('.latest-goal__assists', latestGoal ? renderLatestGoalAssists(latestGoal) : ''),
  ]);
}

export function renderLatestGoalTime(latestGoal: Goal): (VNode | null)[] {
  const period = renderPeriodNumber(latestGoal.period);
  const time = isShootoutGoal(latestGoal)
    ? ''
    : renderTime({ minute: latestGoal.min, second: latestGoal.sec });
  return [
    span(`${period} ${time}`),
    span('.latest-goal__team', latestGoal.team),
    !isShootoutGoal(latestGoal) && latestGoal.strength
      ? span('.latest-goal__strength', latestGoal.strength)
      : null,
    !isShootoutGoal(latestGoal) && latestGoal.emptyNet
      ? span('.latest-goal__empty-net', 'EN')
      : null,
  ];
}

export function renderLatestGoalScorer(latestGoal: Goal): VNode | VNode[] {
  const { player, seasonTotal } = latestGoal.scorer;
  const scorer = truncatePlayerName(player);
  return seasonTotal
    ? [
        span('.latest-goal__scorer', `${scorer} `),
        span('.latest-goal__goal-count', `(${seasonTotal})`),
      ]
    : span('.latest-goal__scorer', scorer);
}

export function renderLatestGoalAssists(latestGoal: Goal): VNode | VNode[] | string {
  if (isShootoutGoal(latestGoal) || !latestGoal.assists) {
    return '';
  }
  if (latestGoal.assists.length === 0) {
    return span('.latest-goal__assists-label', 'Unassisted');
  }
  return [
    div('.latest-goal__assists-label', 'Assists:'),
    ...latestGoal.assists.map((assist) =>
      div('.latest-goal__assist', [
        span('.latest-goal__assister', `${truncatePlayerName(assist.player)} `),
        span('.latest-goal__assist-count', `(${assist.seasonTotal})`),
      ]),
    ),
  ];
}

function renderGameStatus(
  status: Props['status'],
  startTime: Props['startTime'],
): string | (VNode | string)[] {
  switch (status.state) {
    case 'LIVE':
      return renderCurrentProgress(status.progress);
    case 'PREVIEW': {
      const isInFuture = new Date(startTime).getTime() - new Date().getTime() > 0;
      return `Starts ${isInFuture ? format(startTime) : 'soon'}`;
    }
    case 'POSTPONED':
      return 'Postponed';
    default:
      return 'Finished';
  }
}

function renderCurrentProgress(progress: GameProgress): string | (VNode | string)[] {
  const label = 'In progress';
  if (!progress || !progress.currentPeriodOrdinal) {
    return label;
  }
  const progressTime = renderCurrentProgressTime(progress);
  return [`${label}:`, span('.game-description__value', progressTime)];
}

function renderCurrentProgressTime(progress: GameProgress): string {
  if (progress.currentPeriodTimeRemaining.pretty === 'END') {
    return `End of ${progress.currentPeriodOrdinal}`;
  }
  return progress.currentPeriodOrdinal === PERIOD_SHOOTOUT
    ? 'In shootout'
    : `${progress.currentPeriodOrdinal} ${progress.currentPeriodTimeRemaining.pretty}`;
}
