import type { GameDisplay } from '../types';

type Panel = 'game-description' | 'game-stats' | 'latest-goal' | 'links' | 'summary' | 'team-stats';

const gameDisplayPanels: Record<GameDisplay, Panel[]> = {
  'pre-game': ['game-description', 'team-stats', 'links'],
  playback: ['latest-goal'],
  'in-progress': ['latest-goal', 'game-description'],
  'pre-summary-finished': ['latest-goal'],
  'pre-summary-in-progress': ['latest-goal', 'game-description'],
  'summary-finished': ['summary'],
  'summary-in-progress': ['summary', 'game-description'],
  'post-game-finished': ['summary', 'game-stats', 'team-stats', 'links'],
  'post-game-in-progress': ['summary', 'game-description', 'game-stats', 'team-stats', 'links'],
};

export function showPanel(gameDisplay: GameDisplay, panel: Panel): boolean {
  return gameDisplayPanels[gameDisplay].includes(panel);
}
