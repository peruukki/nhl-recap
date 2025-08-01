import { div, h, MainDOMSource, VNode } from '@cycle/dom';
import xs, { Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import fromEvent from 'xstream/extra/fromEvent';

import Game from '../../app/src/components/game';
import type { GameDisplay, GameStats, Game as GameT, Goal } from '../../app/src/types';
import { gamesData, stateDefinitions } from './data';
import { getSectionExpandedState, setSectionExpandedState } from './storage';

type Sources = {
  DOM: MainDOMSource;
};

type Sinks = {
  DOM: Stream<VNode>;
};

type Actions = {
  expandCollapseAll$: Stream<'expand' | 'collapse'>;
  expandCollapseSections$: Stream<Stream<'expand' | 'collapse'>[]>;
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

export default function main(): (sources: Sources) => Sinks {
  return ({ DOM }) => ({ DOM: view(model(intent(DOM))) });
}

function intent(DOM: Sources['DOM']): Actions {
  const expandCollapseAll$ = DOM.select('.expand-collapse-all')
    .events('click')
    .map((event) => {
      const button = event.target as HTMLButtonElement;
      return button.textContent?.startsWith('Expand') ? 'expand' : 'collapse';
    });

  const expandCollapseSections$ = DOM.select('.gallery-game-state')
    .elements()
    .filter((elements) => elements.length > 0)
    .map((elements) =>
      elements.map((element) => {
        const details = element as HTMLDetailsElement;
        return fromEvent(details, 'toggle').mapTo(
          details.open ? ('expand' as const) : ('collapse' as const),
        );
      }),
    );

  return {
    expandCollapseAll$,
    expandCollapseSections$,
  };
}

function model({ expandCollapseAll$, expandCollapseSections$ }: Actions): State {
  const initialSectionExpandedStates = Array(stateDefinitions.length * gamesData.length)
    .fill(null)
    .map((_, index) => getSectionExpandedState(index));

  const sectionExpandedStates$ = expandCollapseSections$
    .map((expandCollapseSections) =>
      xs.combine(
        ...expandCollapseSections.map((expandCollapseSection$, index) =>
          xs
            .merge(expandCollapseSection$, expandCollapseAll$)
            .map((action) => action === 'expand')
            // Get an up-to-date state from local storage
            .startWith(getSectionExpandedState(index)),
        ),
      ),
    )
    .flatten()
    .compose(
      dropRepeats(
        (prevStates, nextStates) =>
          prevStates.length === nextStates.length &&
          prevStates.every((_, index) => prevStates[index] === nextStates[index]),
      ),
    )
    .startWith(initialSectionExpandedStates);

  // Persist across page reloads
  sectionExpandedStates$.addListener({
    next: (sectionsExpanded) => {
      sectionsExpanded.forEach((isExpanded, index) => setSectionExpandedState(index, isExpanded));
    },
  });

  const sectionGameDisplayIndexes$ = initialSectionExpandedStates.map((_, index) =>
    sectionExpandedStates$
      .map((openStates) => openStates[index])
      .compose(dropRepeats())
      .filter((isExpanded) => isExpanded)
      .map(() =>
        xs
          .periodic(1000)
          .startWith(-1)
          .map((i) => i + 1)
          .take(4),
      )
      .flatten()
      .startWith(-1),
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
      const isAllExpanded = sectionExpandedStates.every((isExpanded) => isExpanded);

      return div('.gallery', [
        div('.gallery-controls', [
          h(
            'button.expand-collapse-all',
            { attrs: { type: 'button' } },
            isAllExpanded ? 'Collapse all' : 'Expand all',
          ),
        ]),
        ...gameStates.flatMap(({ gameDescription, games }, index) => [
          h('details.gallery-game-state', { attrs: { open: sectionExpandedStates[index] } }, [
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
          ]),
        ]),
      ]);
    });
}
