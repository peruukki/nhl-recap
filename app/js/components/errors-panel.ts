import { div, VNode } from '@cycle/dom';

import { ERROR_MISSING_ALL_GOALS, ERROR_SCORE_AND_GOAL_COUNT_MISMATCH } from '../events/constants';
import type { StatError } from '../types';

export default function ErrorsPanel(errors?: StatError[]): VNode | null {
  return errors ? div('.game__errors', errors.map(getErrorText)) : null;
}

function getErrorText(error: StatError): string {
  switch (error.error) {
    case ERROR_MISSING_ALL_GOALS:
      return 'Missing all goal data';
    case ERROR_SCORE_AND_GOAL_COUNT_MISMATCH: {
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
