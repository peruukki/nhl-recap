import _ from 'lodash';

import {
  Game,
  GameEndTime,
  GameEvent,
  GameProgress,
  Goal,
  GoalWithUpdateFields,
  PauseEvent,
  PeriodGameEvents,
  TextualPeriod,
  isShootoutGoal,
} from '../types';
import {
  GAMES_START_PAUSE_EVENT_COUNT,
  GAME_PRE_SUMMARY_PAUSE_EVENT_COUNT,
  GAME_SUMMARY_PAUSE_EVENT_COUNT,
  GOAL_PAUSE_EVENT_COUNT,
  PERIOD_END_PAUSE_EVENT_COUNT,
  PERIOD_OVERTIME,
  PERIOD_SHOOTOUT,
} from './constants';
import periodEvents from './period-events';
import shootoutEvents from './shootout-events';
import {
  elapsedTimeToRemainingTime,
  getAdvanceClockStep,
  getPeriodOrdinal,
  hasGameFinished,
} from './utils';

export default function gameEvents(scores: Game[]): (GameEvent | PauseEvent)[] {
  const advanceClockStep = getAdvanceClockStep(scores.length);
  const endTime = getClockEndTime(scores);
  const eventsByPeriod = getAllPeriodEvents(
    scores,
    endTime,
    GOAL_PAUSE_EVENT_COUNT,
    advanceClockStep,
  );
  const completedPeriodEvents = endTime.inProgress
    ? _.dropRight(eventsByPeriod, 1)
    : eventsByPeriod;
  const periodEnds = completedPeriodEvents.map((onePeriodEvents) =>
    appendDelay(
      { period: onePeriodEvents.period, type: 'period-end' },
      PERIOD_END_PAUSE_EVENT_COUNT,
    ),
  );
  const allPeriodEvents = eventsByPeriod.map((onePeriodEvents) => onePeriodEvents.events);
  const periodSequences = _.chain(allPeriodEvents)
    .zip(periodEnds)
    .flatten()
    // @ts-ignore
    .filter<GameEvent>(_.identity)
    .value();

  return _.concat(
    appendDelay({ type: 'start' }, GAMES_START_PAUSE_EVENT_COUNT),
    ...periodSequences,
    appendDelay(
      { type: 'pre-summary', inProgress: !!endTime.inProgress },
      GAME_PRE_SUMMARY_PAUSE_EVENT_COUNT,
    ),
    appendDelay(
      { type: 'summary', inProgress: !!endTime.inProgress },
      GAME_SUMMARY_PAUSE_EVENT_COUNT,
    ),
    {
      type: 'end',
      inProgress: !!endTime.inProgress,
    },
  );
}

function appendDelay(element: GameEvent, multiplier: number): (GameEvent | PauseEvent)[] {
  return [element, ..._.times(multiplier, () => ({ type: 'pause' as const }))];
}

function getAllPeriodEvents(
  scores: Game[],
  endTime: GameEndTime,
  goalPauseEventCount: number,
  advanceClockStep: number,
): PeriodGameEvents[] {
  const allGoalsSorted = getAllGoalsSorted(scores);
  return getRegularPeriodGameEvents(endTime, allGoalsSorted, goalPauseEventCount, advanceClockStep)
    .concat(getOvertimeGameEvents(endTime, allGoalsSorted, goalPauseEventCount, advanceClockStep))
    .concat(getShootoutGameEvents(endTime, allGoalsSorted, goalPauseEventCount));
}

function getRegularPeriodGameEvents(
  endTime: GameEndTime,
  allGoalsSorted: GoalWithUpdateFields[],
  goalPauseEventCount: number,
  advanceClockStep: number,
): PeriodGameEvents[] {
  const partialPeriodNumber = getPartialPeriodNumber(endTime);
  const lastFullPeriodNumber = partialPeriodNumber
    ? partialPeriodNumber - 1
    : getLastFullPeriodNumber(endTime);
  const fullPeriods = _.range(1, lastFullPeriodNumber + 1).map((period) => ({
    period,
    events: periodEvents(period, 20, null, allGoalsSorted, goalPauseEventCount, advanceClockStep),
  }));

  if (partialPeriodNumber) {
    const partialPeriod = {
      period: partialPeriodNumber,
      events: periodEvents(
        partialPeriodNumber,
        20,
        endTime,
        allGoalsSorted,
        goalPauseEventCount,
        advanceClockStep,
      ),
    };
    return fullPeriods.concat(partialPeriod);
  }
  return fullPeriods;
}

function getPartialPeriodNumber(endTime: GameEndTime): number | null {
  return typeof endTime.period === 'number' && !hasLastPeriodEnded(endTime) ? endTime.period : null;
}

function getLastFullPeriodNumber(endTime: GameEndTime): number {
  return typeof endTime.period === 'number' && hasLastPeriodEnded(endTime) ? endTime.period : 3;
}

function hasLastPeriodEnded(endTime: GameEndTime): boolean {
  return endTime.minute === undefined;
}

function getOvertimeGameEvents(
  endTime: GameEndTime,
  allGoalsSorted: GoalWithUpdateFields[],
  goalPauseEventCount: number,
  advanceClockStep: number,
): PeriodGameEvents[] {
  if (endTime.period !== PERIOD_SHOOTOUT && endTime.period !== PERIOD_OVERTIME) {
    return [];
  }
  const periodEnd = endTime.period === PERIOD_OVERTIME ? endTime : null;
  return [
    {
      period: PERIOD_OVERTIME,
      events: periodEvents(
        PERIOD_OVERTIME,
        5,
        periodEnd,
        allGoalsSorted,
        goalPauseEventCount,
        advanceClockStep,
      ),
    },
  ];
}

function getShootoutGameEvents(
  endTime: GameEndTime,
  allGoalsSorted: GoalWithUpdateFields[],
  goalPauseEventCount: number,
): PeriodGameEvents[] {
  return endTime.period === PERIOD_SHOOTOUT
    ? [{ period: PERIOD_SHOOTOUT, events: shootoutEvents(allGoalsSorted, goalPauseEventCount) }]
    : [];
}

function getClockEndTime(scores: Game[]): GameEndTime {
  const gameEndTimes = scores.map(getGameEndTime);
  return (
    _.chain(gameEndTimes)
      .filter(_.identity)
      // @ts-ignore
      .sortBy([getPeriodIteratee, getMinuteIteratee, getSecondIteratee])
      .last()
      .value()
  );
}

function getPeriodIteratee(event: GameEndTime): number {
  return getPeriodOrdinal(event.period);
}

function getMinuteIteratee(event: GameEndTime): number {
  return getTimeValueIteratee(event.minute);
}
function getSecondIteratee(event: GameEndTime): number {
  return getTimeValueIteratee(event.second);
}
function getTimeValueIteratee(value: number | undefined): number {
  // The time value is remaining time and undefined means end of period
  return value === undefined ? 0 : -value;
}

function getGameEndTime(game: Game): GameEndTime | null {
  const isPlayoffGame = !!game.preGameStats && !!game.preGameStats.playoffSeries;
  return game.status && game.status.state === 'LIVE'
    ? getGameEndTimeFromProgress(game.status.progress, isPlayoffGame)
    : getGameEndTimeFromGoals(game.goals);
}

function getGameEndTimeFromProgress(progress: GameProgress, isPlayoffGame: boolean): GameEndTime {
  const { min, sec } = progress.currentPeriodTimeRemaining;
  const hasEnded = min === 0 && sec === 0;
  return {
    period:
      !isPlayoffGame &&
      _.includes([PERIOD_OVERTIME, PERIOD_SHOOTOUT], progress.currentPeriodOrdinal)
        ? (progress.currentPeriodOrdinal as TextualPeriod)
        : progress.currentPeriod,
    minute: hasEnded ? undefined : min,
    second: hasEnded ? undefined : sec,
    inProgress: true,
  };
}

function getGameEndTimeFromGoals(goals: Goal[]): GameEndTime | null {
  const lastGoal = _.last(goals);
  if (!lastGoal) {
    return null;
  }

  if (isShootoutGoal(lastGoal)) {
    return { period: PERIOD_SHOOTOUT };
  }

  const isOverTime = lastGoal.period === PERIOD_OVERTIME || Number(lastGoal.period) > 3;
  return isOverTime
    ? elapsedTimeToRemainingTime({
        period: lastGoal.period === PERIOD_OVERTIME ? lastGoal.period : Number(lastGoal.period),
        minute: lastGoal.min,
        second: lastGoal.sec,
      })
    : { period: 3 };
}

export function getAllGoalsSorted(scores: Game[]): GoalWithUpdateFields[] {
  return _.chain(
    scores.map((game, gameIndex) =>
      _.chain(game.goals)
        .reject(
          (goal) =>
            goal.period === PERIOD_SHOOTOUT && game.status && !hasGameFinished(game.status.state),
        )
        .map((goal) => ({
          ...goal,
          gameIndex,
          classModifier:
            goal.team === game.teams.away.abbreviation ? ('away' as const) : ('home' as const),
        }))
        .value(),
    ),
  )
    .flatten()
    .sortBy(['period', 'min', 'sec'])
    .value();
}
