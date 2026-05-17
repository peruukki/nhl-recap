import { div, type VNode } from '@cycle/dom';

import type { StatError } from '../types';
import Expandable from './expandable';

export default function ErrorsPanel(errors: StatError[] | undefined, show: boolean): VNode | null {
  return errors
    ? Expandable({ show }, [
        div(
          '.game__errors',
          errors.map((error) => div(getErrorText(error))),
        ),
      ])
    : null;
}

function getErrorText(error: StatError): string {
  switch (error.error) {
    case 'MISSING-ALL-GOALS':
      return 'Missing all goal data';
    case 'SCORE-AND-GOAL-COUNT-MISMATCH': {
      const { goalCount, scoreCount } = error.details;
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
