import { div, h, MainDOMSource, VNode } from '@cycle/dom';
import xs, { Stream } from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';

import Game from '../../app/src/components/game';
import { scoresAllRegularTime, scoresAllRegularTimePlayoffs } from '../../app/src/test/data';
import type { GameDisplay, GameStats, GameStatus, Game as GameT, Goal } from '../../app/src/types';
import { getGameStateToggleChecked, setGameStateToggleChecked } from './storage';

type Sources = {
  DOM: MainDOMSource;
};

type Sinks = {
  DOM: Stream<VNode>;
};

type Actions = {
  expandCollapseAll$: Stream<'expandAll' | 'collapseAll'>;
  gameStateToggleChange$: Stream<Event>;
  stateDefinitions: GameStateDefinition[];
};

type State = {
  gameStateToggleStates$: Stream<boolean[]>;
  gameStates$: Stream<{ gameDescription: string; games: (GalleryGameT | null)[] }[]>;
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

  const gameStateToggleChange$ = DOM.select('.gallery-game-state')
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
    gameStateToggleChange$,
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

function model({ expandCollapseAll$, gameStateToggleChange$, stateDefinitions }: Actions): State {
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

  const gameStateToggleStateUpdate$ = gameStateToggleChange$.map((event) => {
    const element = event.target as HTMLDetailsElement;
    return {
      type: 'toggleSection' as const,
      open: element.open,
      index: Number(element.dataset.index),
    };
  });

  const expandCollapseAllUpdate$ = expandCollapseAll$.map((action) => ({ type: action }));

  const allToggleUpdates$ = xs.merge(gameStateToggleStateUpdate$, expandCollapseAllUpdate$);

  // Persist across page reloads
  expandCollapseAllUpdate$.addListener({
    next: (update) => {
      const count = stateDefinitions.length * gamesData.length;
      for (let i = 0; i < count; ++i) {
        setGameStateToggleChecked(i, update.type === 'expandAll');
      }
    },
  });
  gameStateToggleStateUpdate$.addListener({
    next: (update) => {
      setGameStateToggleChecked(update.index, update.open);
    },
  });

  const initialGameStateToggleStates = Array(stateDefinitions.length * gamesData.length)
    .fill(null)
    .map((_, index) => getGameStateToggleChecked(index));

  const gameStateToggleStates$ = allToggleUpdates$.fold((openStates, update) => {
    switch (update.type) {
      case 'toggleSection':
        return [
          ...openStates.slice(0, update.index),
          update.open,
          ...openStates.slice(update.index + 1),
        ];
      case 'expandAll':
      case 'collapseAll':
        return openStates.map(() => update.type === 'expandAll');
      default: {
        update satisfies never;
        return openStates;
      }
    }
  }, initialGameStateToggleStates);

  const gameDisplayIndex$ = xs
    .periodic(1000)
    .startWith(-1)
    .map((index) => index + 1)
    .take(4);
  const transitionedGameStates$ = gameDisplayIndex$.map((gameDisplayIndex) =>
    gamesData.flatMap((gameData) =>
      stateDefinitions.map(({ gameStatus, states }) => ({
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
      })),
    ),
  );
  return { gameStateToggleStates$, gameStates$: transitionedGameStates$ };
}

function view({ gameStateToggleStates$, gameStates$ }: State): Stream<VNode> {
  return xs
    .combine(gameStateToggleStates$, gameStates$)
    .map(([gameStateTogglesChecked, gameStates]) => {
      const isAllExpanded = gameStateTogglesChecked.every((state) => state);

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
            { attrs: { 'data-index': index, open: gameStateTogglesChecked[index] } },
            [
              h('summary.gallery-heading', gameDescription),
              div(
                '.gallery-games',
                games.map((game, gameIndex) =>
                  game
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
