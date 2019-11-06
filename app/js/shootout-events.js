import _ from 'lodash';

import { getGoalEvents, PERIOD_SHOOTOUT } from './game-events';

export default function shootoutEvents(allGoalsSorted, goalPauseEventCount) {
  return _.chain(allGoalsSorted)
    .filter({ period: PERIOD_SHOOTOUT })
    .uniqBy('gameIndex')
    .map(goal => getGoalEvents({ period: PERIOD_SHOOTOUT }, goal, goalPauseEventCount))
    .flatten()
    .value();
}
