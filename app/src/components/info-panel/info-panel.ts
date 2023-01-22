import { div, span, VNode } from '@cycle/dom';
import classNames from 'classnames';
import { format } from 'timeago.js';

import { PERIOD_SHOOTOUT } from '../../events/constants';
import {
  GameDisplay,
  GameProgress,
  GameStats as GameStatsT,
  GameStatus,
  Goal,
  GoalInGamePlay,
  isShootoutGoal,
  Teams,
  TeamStats as TeamStatsT,
} from '../../types';
import { truncatePlayerName } from '../../utils/utils';
import { renderPeriodNumber, renderTime } from '../clock';
import PlayerLogo from './player-logo';
import GameStats from './stats/game-stats';
import TeamStats from './stats/team-stats';

type Props = {
  currentGoals: Goal[];
  currentStats?: TeamStatsT;
  gameDisplay: GameDisplay;
  gameStats: GameStatsT;
  isPlayoffGame: boolean;
  latestGoal?: Goal;
  preGameStats?: TeamStatsT;
  startTime: string;
  status: GameStatus;
  teams: Teams;
};

export default function InfoPanel({
  currentGoals,
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
    'pre-game',
    'in-progress',
    'pre-summary-in-progress',
    'summary-in-progress',
    'post-game-in-progress',
  ].includes(gameDisplay);
  const showGameStats =
    gameStats && ['post-game-finished', 'post-game-in-progress'].includes(gameDisplay);
  const showPreGameStats = ['pre-game', 'post-game-in-progress'].includes(gameDisplay);
  const showAfterGameStats = gameDisplay === 'post-game-finished';
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
      gameDisplay !== 'pre-game'
        ? renderLatestGoalOrSummary(teams, gameDisplay, currentGoals, latestGoal)
        : null,
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

function renderSummary(teams: Teams, allGoals: Goal[]) {
  const topPointScorers = getTopPointScorers(teams, allGoals);
  return div(
    '.summary.fade-in',
    topPointScorers.length
      ? [
          div('.summary__heading', 'Top scorers'),
          div(
            '.summary__point-scorers',
            topPointScorers.map(({ player, teamId, goals, assists }) =>
              div('.summary__point-scorer', [
                PlayerLogo(teamId),
                ...renderPlayerAndPoints(player, goals, assists),
              ]),
            ),
          ),
        ]
      : null,
  );
}

function getTopPointScorers(teams: Teams, allGoals: Goal[]) {
  const nonShootoutGoals = allGoals.filter((goal): goal is GoalInGamePlay => !isShootoutGoal(goal));

  const pointScorersPerTeam = [teams.away, teams.home].map((team) => {
    const teamPointScorers = nonShootoutGoals
      .filter((goal) => goal.team === team.abbreviation)
      .reduce(
        (pointScorers, goal) => {
          const scorerPoints = pointScorers.get(goal.scorer.playerId);
          pointScorers.set(goal.scorer.playerId, {
            player: goal.scorer.player,
            goals: (scorerPoints?.goals ?? 0) + 1,
            assists: scorerPoints?.assists ?? 0,
            points: (scorerPoints?.points ?? 0) + 1,
            goalsSeason: goal.scorer.seasonTotal,
            assistsSeason: scorerPoints?.assistsSeason ?? 0,
          });
          goal.assists.forEach(({ player, playerId, seasonTotal }) => {
            const assisterPoints = pointScorers.get(playerId);
            pointScorers.set(playerId, {
              player,
              goals: assisterPoints?.goals ?? 0,
              assists: (assisterPoints?.assists ?? 0) + 1,
              points: (assisterPoints?.points ?? 0) + 1,
              goalsSeason: assisterPoints?.goalsSeason ?? 0,
              assistsSeason: seasonTotal,
            });
          });
          return pointScorers;
        },
        new Map<
          number,
          {
            player: string;
            goals: number;
            assists: number;
            points: number;
            goalsSeason: number;
            assistsSeason: number;
          }
        >(),
      );
    return { teamId: team.id, pointScorers: teamPointScorers };
  });

  const allPointScorers = pointScorersPerTeam.flatMap(({ teamId, pointScorers }) =>
    Array.from(pointScorers.values()).map((points) => ({ teamId, ...points })),
  );
  const sortedPointScorers = allPointScorers.sort(
    (a, b) =>
      [b.points - a.points, b.goals - a.goals, b.assists - a.assists].find((diff) => diff) ||
      b.goalsSeason + b.assistsSeason - (a.goalsSeason + a.assistsSeason) ||
      (a.assists > a.goals ? b.assistsSeason - a.assistsSeason : b.goalsSeason - a.goalsSeason),
  );
  return sortedPointScorers.slice(0, (sortedPointScorers[3]?.points ?? 0) > 1 ? 4 : 3);
}

function renderPlayerAndPoints(player: string, goals: number, assists: number) {
  return [
    span('.player', truncatePlayerName(player, 15)),
    span('.points', renderPointsText(goals, assists)),
  ];
}

function renderPointsText(goals: number, assists: number) {
  const goalsClassName = classNames({ '.goals': true, '.goals--highlight': goals >= 3 }).replace(
    /\s/g,
    '',
  );
  if (goals && assists) {
    return [span(goalsClassName, `${goals} G`), `, ${assists} A`];
  }
  if (goals) {
    return span(goalsClassName, `${goals} ${goals === 1 ? 'goal' : 'goals'}`);
  }
  return `${assists} ${assists === 1 ? 'assist' : 'assists'}`;
}

function renderLatestGoalOrSummary(
  teams: Teams,
  gameDisplay: GameDisplay,
  goals: Goal[],
  latestGoal?: Goal,
) {
  return [
    'summary-in-progress',
    'summary-finished',
    'post-game-finished',
    'post-game-in-progress',
  ].includes(gameDisplay)
    ? renderSummary(teams, goals)
    : renderLatestGoal(latestGoal);
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
