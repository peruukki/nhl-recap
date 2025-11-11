import type { GameStatus } from '../../../app/src/types';
import { scoresAllRegularTime, scoresAllRegularTimePlayoffs } from '../../../app/src/test/data';

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

const progress = {
  currentPeriod: 3,
  currentPeriodOrdinal: '3rd',
  currentPeriodTimeRemaining: { pretty: '00:05', min: 0, sec: 5 },
};

export const stateDefinitions: GameStateDefinition[] = [
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
];

export const gamesData = [
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
