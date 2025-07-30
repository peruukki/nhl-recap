import { div, h, MainDOMSource, VNode } from '@cycle/dom';
import xs, { Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import fromEvent from 'xstream/extra/fromEvent';

import Game from '../../app/src/components/game';
import { scoresAllRegularTime, scoresAllRegularTimePlayoffs } from '../../app/src/test/data';
import type { GameDisplay, GameStats, GameStatus, Game as GameT, Goal } from '../../app/src/types';
import { getSectionExpandedState, setSectionExpandedState } from './storage';

type Sources = {
  DOM: MainDOMSource;
};

type Sinks = {
  DOM: Stream<VNode>;
};

type Actions = {
  expandCollapseAll$: Stream<'expandAll' | 'collapseAll'>;
  expandCollapseSingle$: Stream<Event>;
  stateDefinitions: GameStateDefinition[];
};

type State = {
  gameStates$: Stream<{ gameDescription: string; games: (GalleryGameT | null)[] }[]>;
  sectionExpandedStates$: Stream<boolean[]>;
};

type GalleryGameT = {
  currentGoals: Goal[];
  description: string;
  gameDisplay: GameDisplay;
  gameState: GameT & {
    status: string;
    gameStats: GameStats;
  };
};

type GameStateDefinition = {
  gameStatus: {
    description: string;
    gameStats?: undefined;
    status: GameStatus;
  };
  states: ({
    description: string;
    gameDisplays: string[];
    goalCount: number;
  } | null)[];
};

export default function main(): (sources: Sources) => Sinks {
  return ({ DOM }) => ({ DOM: view(model(intent(DOM))) });
}

function intent(DOM: Sources['DOM']): Actions {
  const expandCollapseAll$ = DOM.select('.expand-collapse-all')
    .events('click')
    .map((event) => {
      const button = event.target as HTMLButtonElement;
      return button.textContent?.startsWith('Expand') ? 'expandAll' : 'collapseAll';
    });

  const expandCollapseSingle$ = DOM.select('.gallery-game-state')
    .elements()
    .map((elements) => xs.merge(...elements.map((element) => fromEvent(element, 'toggle'))))
    .flatten();

  const progress = {
    currentPeriod: 3,
    currentPeriodOrdinal: '3rd',
    currentPeriodTimeRemaining: { pretty: '00:05', min: 0, sec: 5 },
  };
  return {
    expandCollapseAll$,
    expandCollapseSingle$,
    stateDefinitions: [
      {
        gameStatus: {
          description: 'in progress',
          status: { state: 'LIVE', progress },
        },
        states: [
          {
            description: 'Playback not started',
            gameDisplays: ['pre-game', 'pre-game', 'pre-game', 'pre-game'],
            goalCount: 4,
          },
          {
            description: 'Playback has passed game’s current progress',
            gameDisplays: ['playback', 'in-progress', 'in-progress', 'in-progress'],
            goalCount: 4,
          },
          {
            description: 'Playback finished',
            gameDisplays: [
              'in-progress',
              'pre-summary-in-progress',
              'summary-in-progress',
              'post-game-in-progress',
            ],
            goalCount: 4,
          },
        ],
      },
      {
        gameStatus: {
          description: 'finished',
          status: { state: 'FINAL' },
        },
        states: [
          {
            description: 'Playback not started',
            gameDisplays: ['pre-game', 'pre-game', 'pre-game', 'pre-game'],
            goalCount: 5,
          },
          {
            description: 'Playback in progress',
            gameDisplays: ['pre-game', 'playback', 'playback', 'playback'],
            goalCount: 0,
          },
          {
            description: 'Playback finished',
            gameDisplays: [
              'playback',
              'pre-summary-finished',
              'summary-finished',
              'post-game-finished',
            ],
            goalCount: 5,
          },
        ],
      },
      {
        gameStatus: {
          description: 'not started',
          status: { state: 'PREVIEW' },
          gameStats: undefined,
        },
        states: [
          {
            description: 'Playback in any state',
            gameDisplays: ['pre-game', 'pre-game', 'pre-game', 'pre-game'],
            goalCount: 0,
          },
          null,
          null,
        ],
      },
    ],
  };
}

function model({ expandCollapseAll$, expandCollapseSingle$, stateDefinitions }: Actions): State {
  const gamesData = [
    { description: 'Regular season game', data: scoresAllRegularTime.games[1] },
    {
      description: 'Playoff game',
      data: scoresAllRegularTimePlayoffs.games[1],
    },
    {
      description: 'Regular season game with errors',
      data: {
        ...scoresAllRegularTime.games[1],
        errors: [
          { error: 'MISSING-ALL-GOALS' },
          { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 3, scoreCount: 5 } },
        ],
      },
    },
    {
      description: 'Playoff game with error',
      data: {
        ...scoresAllRegularTimePlayoffs.games[1],
        errors: [
          { error: 'SCORE-AND-GOAL-COUNT-MISMATCH', details: { goalCount: 3, scoreCount: 5 } },
        ],
      },
    },
  ];

  const initialSectionExpandedStates = Array(stateDefinitions.length * gamesData.length)
    .fill(null)
    .map((_, index) => getSectionExpandedState(index));

  const singleSectionExpandedStateChanges$ = expandCollapseSingle$.map((event) => {
    const element = event.target as HTMLDetailsElement;
    return [{ open: element.open, index: Number(element.dataset.index) }];
  });

  // Transform expand/collapse all to single section updates
  const expandCollapseAllChanges$ = expandCollapseAll$.map((action) =>
    initialSectionExpandedStates.map((_, index) => ({ open: action === 'expandAll', index })),
  );

  const sectionExpandedStateChanges$ = xs.merge(
    singleSectionExpandedStateChanges$,
    expandCollapseAllChanges$,
  );

  // Persist across page reloads
  sectionExpandedStateChanges$.addListener({
    next: (updates) => {
      updates.forEach((update) => setSectionExpandedState(update.index, update.open));
    },
  });

  const sectionExpandedStates$ = sectionExpandedStateChanges$.fold(
    (openStates, updates) =>
      updates.reduce(
        (acc, update) => [
          ...acc.slice(0, update.index),
          update.open,
          ...acc.slice(update.index + 1),
        ],
        openStates,
      ),
    initialSectionExpandedStates,
  );

  const sectionGameDisplayIndexes$ = initialSectionExpandedStates.map((_, index) =>
    sectionExpandedStates$
      .map((openStates) => openStates[index])
      .compose(dropRepeats())
      .filter((isOpen) => isOpen)
      .map(() =>
        xs
          .periodic(1000)
          .startWith(-1)
          .map((i) => i + 1)
          .take(4),
      )
      .flatten(),
  );

  const transitionedGameStates$ = xs.combine(...sectionGameDisplayIndexes$).map((displayIndexes) =>
    gamesData.flatMap((gameData) =>
      stateDefinitions.map(({ gameStatus, states }, defIdx) => {
        const sectionIndex = gamesData.indexOf(gameData) * stateDefinitions.length + defIdx;
        const gameDisplayIndex = displayIndexes[sectionIndex];
        return {
          gameDescription: `${gameData.description} ${gameStatus.description}`,
          games: states.map((state) =>
            state
              ? ({
                  description: state.description,
                  gameDisplay: state.gameDisplays[gameDisplayIndex],
                  gameState: {
                    ...gameData.data,
                    status: gameStatus.status,
                    gameStats:
                      'gameStats' in gameStatus ? gameStatus.gameStats : gameData.data.gameStats,
                  },
                  currentGoals: gameData.data.goals.slice(0, state.goalCount),
                } as GalleryGameT)
              : null,
          ),
        };
      }),
    ),
  );
  return { sectionExpandedStates$, gameStates$: transitionedGameStates$ };
}

function view({ sectionExpandedStates$, gameStates$ }: State): Stream<VNode> {
  return xs
    .combine(sectionExpandedStates$, gameStates$)
    .map(([sectionExpandedStates, gameStates]) => {
      const isAllExpanded = sectionExpandedStates.every((isOpen) => isOpen);

      return div('.gallery', [
        div('.gallery-controls', [
          h(
            'button.expand-collapse-all',
            { attrs: { type: 'button' } },
            isAllExpanded ? 'Collapse all' : 'Expand all',
          ),
        ]),
        ...gameStates.flatMap(({ gameDescription, games }, index) => [
          h(
            'details.gallery-game-state',
            { attrs: { 'data-index': index, open: sectionExpandedStates[index] } },
            [
              h('summary.gallery-heading', gameDescription),
              div(
                '.gallery-games',
                games.map((game, gameIndex) =>
                  game && sectionExpandedStates[index]
                    ? div('.gallery-game', [
                        div('.gallery-game__description', [game.description]),
                        Game(game.gameDisplay, game.gameState, game.currentGoals, gameIndex),
                      ])
                    : div(),
                ),
              ),
            ],
          ),
        ]),
      ]);
    });
}
