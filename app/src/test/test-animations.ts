import { Animations } from 'app/src/utils/animations';

function highlightGame(gameIndex: number): void {}

function highlightGoal(classModifier: string, gameIndex: number): void {}

function highlightPlayPauseButtonChange(): void {}

function stopGameHighlight(gameIndex: number): void {}

const animations: Animations = {
  highlightGame,
  highlightGoal,
  highlightPlayPauseButtonChange,
  stopGameHighlight,
};
export default animations;
