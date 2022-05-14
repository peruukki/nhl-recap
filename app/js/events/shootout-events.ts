import * as _ from 'lodash';

import type { GameEvent, GoalWithUpdateFields, PauseEvent } from '../types';
import { PERIOD_SHOOTOUT } from './constants';
import { getGoalEvents } from './utils';

export default function shootoutEvents(
  allGoalsSorted: GoalWithUpdateFields[],
  goalPauseEventCount: number,
): (GameEvent | PauseEvent)[] {
  const finalShootoutGoals = getShootoutGoalForEachGame(allGoalsSorted);
  return _.chain(finalShootoutGoals)
    .map((goal) => getGoalEvents({ period: PERIOD_SHOOTOUT }, goal, goalPauseEventCount))
    .flatten()
    .value();
}

function getShootoutGoalForEachGame(
  allGoalsSorted: GoalWithUpdateFields[],
): GoalWithUpdateFields[] {
  return _.chain(allGoalsSorted)
    .filter({ period: PERIOD_SHOOTOUT })
    .groupBy('gameIndex')
    .map((goalsByGame) =>
      _.chain(goalsByGame).groupBy('team').values().maxBy('length').last().value(),
    )
    .value();
}
