import { div, span } from '@cycle/dom';
import { format } from 'timeago.js';

import {
  GAME_STATE_IN_PROGRESS,
  GAME_STATE_NOT_STARTED,
  GAME_STATE_POSTPONED,
  PERIOD_SHOOTOUT,
} from '../../events/constants';
import { truncatePlayerName } from '../../utils/utils';
import { renderPeriodNumber, renderTime } from '../clock';
import GameStats from './stats/game-stats';
import TeamStats from './stats/team-stats';

export default function InfoPanel({
  showGameStats,
  showPreGameStats,
  showLatestGoal,
  showProgressInfo,
  startTime,
  teams,
  gameStats,
  teamStats,
  status,
  isAfterGame,
  isPlayoffGame,
  latestGoal,
}) {
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
      showLatestGoal ? renderLatestGoal(latestGoal) : null,
      showProgressInfo
        ? div('.game-description.fade-in', renderGameStatus(status, startTime))
        : null,
      showGameStats ? GameStats(teams, gameStats) : null,
      showPreGameStats || isAfterGame
        ? TeamStats(teams, showProgressInfo || isAfterGame, isAfterGame, isPlayoffGame, teamStats)
        : null,
    ]
  );
}

function renderLatestGoal(latestGoal) {
  return div('.latest-goal', [
    div('.latest-goal__time', latestGoal ? renderLatestGoalTime(latestGoal) : ''),
    div('.latest-goal__scorer', latestGoal ? renderLatestGoalScorer(latestGoal) : ''),
    div('.latest-goal__assists', latestGoal ? renderLatestGoalAssists(latestGoal) : ''),
  ]);
}

export function renderLatestGoalTime(latestGoal) {
  const period = renderPeriodNumber(latestGoal.period);
  const time = renderTime({ minute: latestGoal.min, second: latestGoal.sec });
  return [
    span(`${period} ${time}`),
    span('.latest-goal__team', latestGoal.team),
    latestGoal.strength ? span('.latest-goal__strength', latestGoal.strength) : null,
    latestGoal.emptyNet ? span('.latest-goal__empty-net', 'EN') : null,
  ];
}

export function renderLatestGoalScorer(latestGoal) {
  const { player, seasonTotal } = latestGoal.scorer;
  const scorer = truncatePlayerName(player);
  return seasonTotal
    ? [
        span('.latest-goal__scorer', `${scorer} `),
        span('.latest-goal__goal-count', `(${seasonTotal})`),
      ]
    : span('.latest-goal__scorer', scorer);
}

export function renderLatestGoalAssists(latestGoal) {
  if (!latestGoal.assists) {
    return '';
  }
  if (latestGoal.assists.length === 0) {
    return span('.latest-goal__assists-label', 'Unassisted');
  }
  return [
    div('.latest-goal__assists-label', 'Assists:'),
    ...latestGoal.assists.map(assist =>
      div('.latest-goal__assist', [
        span('.latest-goal__assister', `${truncatePlayerName(assist.player)} `),
        span('.latest-goal__assist-count', `(${assist.seasonTotal})`),
      ])
    ),
  ];
}

function renderGameStatus(status, startTime) {
  switch (status.state) {
    case GAME_STATE_IN_PROGRESS:
      return renderCurrentProgress(status.progress);
    case GAME_STATE_NOT_STARTED: {
      const isInFuture = new Date(startTime) - new Date() > 0;
      return `Starts ${isInFuture ? format(startTime) : 'soon'}`;
    }
    case GAME_STATE_POSTPONED:
      return 'Postponed';
    default:
      return 'Finished';
  }
}

function renderCurrentProgress(progress) {
  const label = 'In progress';
  if (!progress || !progress.currentPeriodOrdinal) {
    return label;
  }
  const progressTime = renderCurrentProgressTime(progress);
  return [`${label}:`, span('.game-description__value', progressTime)];
}

function renderCurrentProgressTime(progress) {
  if (progress.currentPeriodTimeRemaining.pretty === 'END') {
    return `End of ${progress.currentPeriodOrdinal}`;
  }
  return progress.currentPeriodOrdinal === PERIOD_SHOOTOUT
    ? 'In shootout'
    : `${progress.currentPeriodOrdinal} ${progress.currentPeriodTimeRemaining.pretty}`;
}
