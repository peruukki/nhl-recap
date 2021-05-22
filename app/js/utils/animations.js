const gameInFocusClass = 'in-focus';
const gameInFrontClass = 'in-front';

function clearGameInFocus(element) {
  element.style.transform = null;
  element.classList.remove(gameInFocusClass);
  // Keep element's "in front" styling until it reaches its normal position
  // Use setTimeout instead of ontransitionend due to much better browser support
  // The delay should match $focus-duration in _base.scss
  setTimeout(() => {
    // Keep the game in front if it has gained focus again
    if (!element.classList.contains(gameInFocusClass)) {
      element.classList.remove(gameInFrontClass);
    }
  }, 250);
}

function setGameInFocus(element, windowWidth, windowHeight) {
  const { left, right, top, bottom } = element.getBoundingClientRect();

  const windowCenterX = windowWidth / 2;
  const windowCenterY = windowHeight / 2;
  const elementCenterX = (left + right) / 2;
  const elementCenterY = (top + bottom) / 2;

  const translateX = windowCenterX - elementCenterX;
  const translateY = windowCenterY - elementCenterY;
  const scale = 1.2;
  element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  element.classList.add(gameInFrontClass);
  element.classList.add(gameInFocusClass);
}

function highlightGame(gameIndex) {
  const element = document.querySelectorAll('.game')[gameIndex];
  setGameInFocus(element, window.innerWidth, window.innerHeight);
}

function stopGameHighlight(gameIndex) {
  const element = document.querySelectorAll('.game')[gameIndex];
  clearGameInFocus(element);
}

function highlightGoal(classModifier, gameIndex) {
  highlightGoalCountChange(classModifier, gameIndex);
  highlightLatestGoalChange(gameIndex);
}

function highlightGoalCountChange(classModifier, gameIndex) {
  const element = document.querySelectorAll(
    `.team-panel--${classModifier} > .team-panel__team-score`
  )[gameIndex];
  if (element) {
    element.animate([{ color: 'black' }, { color: '#fac02d' }], { duration: 1000 });
  }
}

function highlightLatestGoalChange(gameIndex) {
  const element = document.querySelectorAll('.game__info-panel')[gameIndex];
  if (element) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 750 });
  }
}

function highlightPlayPauseButtonChange() {
  const element = document.querySelector('.play-pause-button');
  if (element) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
  }
}

export default {
  highlightGame,
  highlightGoal,
  highlightPlayPauseButtonChange,
  stopGameHighlight,
};
