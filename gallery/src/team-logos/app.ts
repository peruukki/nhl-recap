import { div, MainDOMSource, VNode } from '@cycle/dom';
import xs, { Stream } from 'xstream';

import ScorePanel from '../../../app/src/components/score-panel';

type Sources = { DOM: MainDOMSource };

type Sinks = { DOM: Stream<VNode> };

type State = { teams$: Stream<string[]> };

export default function main(): (sources: Sources) => Sinks {
  return () => ({ DOM: view(model()) });
}

function model(): State {
  return {
    teams$: xs.of([
      'ANA',
      'BOS',
      'BUF',
      'CGY',
      'CAR',
      'CHI',
      'COL',
      'CBJ',
      'DAL',
      'DET',
      'EDM',
      'FLA',
      'LAK',
      'MIN',
      'MTL',
      'NSH',
      'NJD',
      'NYI',
      'NYR',
      'OTT',
      'PHI',
      'PIT',
      'SJS',
      'SEA',
      'STL',
      'TBL',
      'TOR',
      'UTA',
      'VAN',
      'VGK',
      'WSH',
      'WPG',
    ]),
  };
}

function view(state: State): Stream<VNode> {
  return state.teams$.map((teams) =>
    div(
      '.gallery',
      div(
        '.team-container',
        teams.map((team) =>
          div('.game-container', [
            div('.game', [
              ScorePanel({
                awayGoals: [],
                homeGoals: [],
                isBeforeGame: true,
                teams: { away: { abbreviation: team }, home: { abbreviation: team } },
              }),
            ]),
          ]),
        ),
      ),
    ),
  );
}
