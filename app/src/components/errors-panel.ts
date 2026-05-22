import { div, type VNode } from '@cycle/dom';

import type { GameState, StatError } from '../types';
import Expandable from './expandable';

export default function ErrorsPanel(
  errors: StatError[] | undefined,
  state: GameState,
  show: boolean,
): VNode | null {
  return errors
    ? Expandable({ show }, [
        div(
          '.game__errors',
          errors.map((error) => div(getErrorText(error, state))),
        ),
      ])
    : null;
}

function getErrorText(error: StatError, state: GameState): string {
  switch (error.error) {
    case 'MISSING-ALL-GOALS':
      return 'Missing all goal data';
    case 'SCORE-AND-GOAL-COUNT-MISMATCH': {
      const { goalCount, scoreCount } = error.details;
      if (state === 'LIVE') {
        if (goalCount === scoreCount + 1) {
          return 'One goal pending';
        }
        if (scoreCount === goalCount + 1) {
          return 'Last goal unconfirmed';
        }
      }
      const difference = Math.abs(goalCount - scoreCount);
      const pluralSuffix = difference === 1 ? '' : 's';
      return goalCount < scoreCount
        ? `Missing ${difference} goal${pluralSuffix} from data`
        : `${difference} too many goals in data`;
    }
    default:
      return `Unknown error ${JSON.stringify(error)}`;
  }
}
