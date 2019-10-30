import _ from 'lodash';

import { PERIOD_SHOOTOUT } from './game-events';

export default function shootoutEvents(allGoalsSorted, goalPauseEventCount) {
  return _.chain(allGoalsSorted)
    .filter({ period: PERIOD_SHOOTOUT })
    .uniqBy('update.gameIndex')
    .map(({ update }) => _.times(goalPauseEventCount, () => ({ update, period: PERIOD_SHOOTOUT })))
    .flatten()
    .value();
}
