import _ from 'lodash';

import { PERIOD_SHOOTOUT } from './constants';
import { getGoalEvents } from './utils';

export default function shootoutEvents(allGoalsSorted, goalPauseEventCount) {
  const finalShootoutGoals = getShootoutGoalForEachGame(allGoalsSorted);
  return _.chain(finalShootoutGoals)
    .map((goal) => getGoalEvents({ period: PERIOD_SHOOTOUT }, goal, goalPauseEventCount))
    .flatten()
    .value();
}

function getShootoutGoalForEachGame(allGoalsSorted) {
  return _.chain(allGoalsSorted)
    .filter({ period: PERIOD_SHOOTOUT })
    .groupBy('gameIndex')
    .map((goalsByGame) =>
      _.chain(goalsByGame).groupBy('team').values().maxBy('length').last().value()
    );
}
