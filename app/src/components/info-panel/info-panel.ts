import { div, span, type VNode } from '@cycle/dom';
import classNames from 'classnames';
import { format } from 'timeago.js';

import { PERIOD_SHOOTOUT } from '../../events/constants';
import {
  type GameDisplay,
  type GameProgress,
  type GameStats as GameStatsT,
  type GameStatus,
  type Goal,
  type GoalInGamePlay,
  isShootoutGoal,
  type Rosters,
  type TeamStats as TeamStatsT,
  type Teams,
} from '../../types';
import { showPanel } from '../../utils/ui';
import { areTeamStatsEqual, truncatePlayerName } from '../../utils/utils';
import { renderPeriodNumber, renderTime } from '../clock';
import Expandable from '../expandable';
import PlayerLogo from './player-logo';
import StartingGoaliesPanel from './starting-goalies-panel';
import StatsPanel, { type TeamStatsInfo } from './stats-panel';

type Props = {
  currentGoals: Goal[];
  currentStats?: TeamStatsT;
  gameDisplay: GameDisplay;
  gameStats?: GameStatsT;
  isPlayoffGame: boolean;
  latestGoal?: Goal;
  preGameStats?: TeamStatsT;
  rosters?: Rosters;
  startTime: string;
  status: GameStatus;
  teams: Teams;
};

function getTeamStatsInfo({
  currentStats,
  gameDisplay,
  preGameStats,
  teams,
}: {
  currentStats?: TeamStatsT;
  gameDisplay: GameDisplay;
  preGameStats?: TeamStatsT;
  teams: Teams;
}): TeamStatsInfo {
  const isPreGameDisplayState = ['pre-game', 'post-game-in-progress'].includes(gameDisplay);
  const isAfterGameDisplayState = gameDisplay === 'post-game-finished';

  const showPreGameStats =
    isPreGameDisplayState ||
    (isAfterGameDisplayState && areTeamStatsEqual({ currentStats, preGameStats, teams }));
  const showPostGameStats = isAfterGameDisplayState && !showPreGameStats;
  const show = showPreGameStats || showPostGameStats;
  const stats = showPreGameStats ? preGameStats : showPostGameStats ? currentStats : undefined;

  return show && stats
    ? {
        isAfterGameDisplayState,
        show: true,
        stats,
        type: showPreGameStats ? 'preGame' : 'afterGame',
      }
    : { show: false };
}

export default function InfoPanel({
  currentGoals,
  currentStats,
  gameDisplay,
  gameStats,
  isPlayoffGame,
  latestGoal,
  preGameStats,
  rosters,
  startTime,
  status,
  teams,
}: Props): VNode {
  const showProgressInfo = showPanel(gameDisplay, 'game-description');
  const showGameStats = !!gameStats && showPanel(gameDisplay, 'game-stats');
  const showStartingGoalies = !!rosters && showPanel(gameDisplay, 'starting-goalies');

  const teamStatsInfo = getTeamStatsInfo({ currentStats, gameDisplay, preGameStats, teams });

  return div('.info-panel', { class: { 'info-panel--with-game-stats': !!gameStats } }, [
    div('.info-panel__section.info-panel__section--latest-goal-or-summary', [
      gameDisplay !== 'pre-game'
        ? renderLatestGoalOrSummary(teams, gameDisplay, currentGoals, latestGoal)
        : null,
    ]),
    div('.info-panel__section.info-panel__section--game-description', [
      Expandable({ show: showProgressInfo }, [
        div('.game-description.fade-in', renderGameStatus(status, startTime)),
      ]),
    ]),
    div('.info-panel__section.info-panel__section--starting-goalies', [
      Expandable(
        { show: showStartingGoalies },
        [rosters ? StartingGoaliesPanel({ rosters, teams }) : null].filter((vnode) => !!vnode),
      ),
    ]),
    div('.info-panel__section.info-panel__section--stats-panel', [
      Expandable({ show: showGameStats || teamStatsInfo.show }, [
        StatsPanel({
          gameStats,
          isPlayoffGame,
          showGameStats,
          showProgressInfo,
          teamStatsInfo,
          teams,
        }),
      ]),
    ]),
  ]);
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
            topPointScorers.map(({ player, teamAbbreviation, goals, assists }) =>
              div('.summary__point-scorer', [
                PlayerLogo(teamAbbreviation),
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
    return { teamAbbreviation: team.abbreviation, pointScorers: teamPointScorers };
  });

  const allPointScorers = pointScorersPerTeam.flatMap(({ teamAbbreviation, pointScorers }) =>
    Array.from(pointScorers.values()).map((points) => ({ teamAbbreviation, ...points })),
  );
  const sortedPointScorers = allPointScorers.sort(
    (a, b) =>
      ([b.points - a.points, b.goals - a.goals, b.assists - a.assists].find((diff) => diff) ??
        b.goalsSeason + b.assistsSeason - (a.goalsSeason + a.assistsSeason)) ||
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
  return showPanel(gameDisplay, 'summary')
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
  if (isShootoutGoal(latestGoal)) {
    return '';
  }
  if (latestGoal.assists.length === 0) {
    return span('.latest-goal__assists-label', 'Unassisted');
  }
  return [
    div('.latest-goal__assists-label', 'Assists'),
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
      const isInFuture = new Date(startTime).getTime() - Date.now() > 0;
      return `Starts ${isInFuture ? format(startTime) : 'soon'}`;
    }
    case 'POSTPONED':
      return 'Postponed';
    default:
      return 'Finished';
  }
}

function renderCurrentProgress(progress?: GameProgress): string | (VNode | string)[] {
  const label = 'In progress';
  if (!progress?.currentPeriodOrdinal) {
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
