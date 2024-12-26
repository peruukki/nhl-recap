const gameInFocusClass = 'in-focus';
const gameInFrontClass = 'in-front';

function clearGameInFocus(element: HTMLElement): void {
  element.style.transform = '';
  element.classList.remove(gameInFocusClass);
  // Keep element's "in front" styling until it reaches its normal position
  // Use setTimeout instead of ontransitionend due to much better browser support
  // The delay should match $focus-duration in animations.scss
  setTimeout(() => {
    // Keep the game in front if it has gained focus again
    if (!element.classList.contains(gameInFocusClass)) {
      element.classList.remove(gameInFrontClass);
    }
  }, 250);
}

function animateGame(element: HTMLElement, windowWidth: number, windowHeight: number): void {
  const { left, right, top, bottom } = element.getBoundingClientRect();

  const windowCenterX = windowWidth / 2;
  const windowCenterY = windowHeight / 2;
  const elementCenterX = (left + right) / 2;
  const elementCenterY = (top + bottom) / 2;

  const translateX = windowCenterX - elementCenterX;
  const translateY = windowCenterY - elementCenterY;
  const scale = 1.2;
  element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function setGameInFocus(element: HTMLElement, windowWidth: number, windowHeight: number): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    animateGame(element, windowWidth, windowHeight);
    element.classList.add(gameInFrontClass);
  }
  element.classList.add(gameInFocusClass);
}

function highlightGame(gameIndex: number): void {
  const element = document.querySelectorAll<HTMLElement>('.game')[gameIndex];
  setGameInFocus(element, window.innerWidth, window.innerHeight);
}

function stopGameHighlight(gameIndex: number): void {
  const element = document.querySelectorAll<HTMLElement>('.game')[gameIndex];
  clearGameInFocus(element);
}

function highlightGoal(classModifier: string, gameIndex: number): void {
  highlightGoalCountChange(classModifier, gameIndex);
  highlightLatestGoalChange(gameIndex);
}

function highlightGoalCountChange(classModifier: string, gameIndex: number): void {
  const element = document.querySelectorAll(
    `.team-panel--${classModifier} > .team-panel__team-score`,
  )[gameIndex];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (element) {
    element.animate([{ color: 'black' }, { color: '#fac02d' }], { duration: 1000 });
  }
}

function highlightLatestGoalChange(gameIndex: number): void {
  const element = document.querySelectorAll('.info-panel')[gameIndex];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (element) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 750 });
  }
}

function highlightPlayPauseButtonChange(): void {
  const element = document.querySelector('.play-pause-button');
  if (element) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
  }
}

const animations = {
  highlightGame,
  highlightGoal,
  highlightPlayPauseButtonChange,
  stopGameHighlight,
};
export default animations;

export type Animations = typeof animations;
