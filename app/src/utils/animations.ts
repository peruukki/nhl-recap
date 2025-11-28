const gameInFocusClass = 'in-focus';
const gameInFrontClass = 'in-front';

function clearGameInFocus(element: HTMLElement): void {
  element.style.transform = '';
  element.classList.remove(gameInFocusClass);
  // Keep element's "in front" styling until it's close to its normal position
  // Use setTimeout instead of ontransitionend due to much better browser support
  // The delay should be smaller than $focus-duration-exit in animations.scss
  setTimeout(() => {
    // Don't make changes if the game has gained focus again
    if (element.classList.contains(gameInFocusClass)) {
      return;
    }
    element.classList.remove(gameInFrontClass);
    // Clear initial position so that it gets recalculated on next animation, to
    // get correct values if the viewport dimensions change
    element.dataset.initialCenterX = '';
    element.dataset.initialCenterY = '';
  }, 250);
}

function storeGameInitialPosition(element: HTMLElement): void {
  const { left, right, top, bottom } = element.getBoundingClientRect();
  element.dataset.initialCenterX = String((left + right) / 2);
  element.dataset.initialCenterY = String((top + bottom) / 2);
}

function animateGame(element: HTMLElement, windowWidth: number, windowHeight: number): void {
  if (!element.dataset.initialCenterX || !element.dataset.initialCenterY) {
    storeGameInitialPosition(element);
  }
  const elementCenterX = parseFloat(element.dataset.initialCenterX!);
  const elementCenterY = parseFloat(element.dataset.initialCenterY!);

  const windowCenterX = windowWidth / 2;
  const windowCenterY = windowHeight / 2;

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

export function highlightGame(gameIndex: number): void {
  const element = document.querySelectorAll<HTMLElement>('.game')[gameIndex];
  setGameInFocus(element, window.innerWidth, window.innerHeight);
}

export function stopGameHighlight(gameIndex: number): void {
  const element = document.querySelectorAll<HTMLElement>('.game')[gameIndex];
  clearGameInFocus(element);
}

export function highlightGoal(classModifier: string, gameIndex: number): void {
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

export function highlightPlayPauseButtonChange(): void {
  const element = document.querySelector('.play-pause-button .icon');
  if (element) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
  }
}

const getAnimationSpeed = () =>
  Number(getComputedStyle(document.documentElement).getPropertyValue('--animation-speed') || '1');

/**
 * Adjusts the given animation duration according to the global animation speed.
 *
 * @param regularDurationMs animation duration with regular animation speed (in milliseconds)
 * @returns adjusted animation duration
 */
export function getAnimationDuration(regularDurationMs: number): number {
  return regularDurationMs / getAnimationSpeed();
}
