function highlightGoal(classModifier, gameIndex) {
  highlightGoalCountChange(classModifier, gameIndex);
  highlightLatestGoalChange(gameIndex);
}

function highlightGoalCountChange(classModifier, gameIndex) {
  const element = document.querySelectorAll(`.team-panel--${classModifier} > .team-panel__team-score`)[gameIndex];
  if (element) {
    const highlightDuration = 1000;
    element.animate([{ color: 'black' }, { color: '#fac02d' }], highlightDuration);
  }
}

function highlightLatestGoalChange(gameIndex) {
  const element = document.querySelectorAll('.game__info-panel')[gameIndex];
  if (element) {
    const highlightDuration = 500;
    element.animate([{ opacity: 0 }, { opacity: 1 }], highlightDuration);
  }
}

function setInfoPanelsPlaybackHeight() {
  document.querySelectorAll('.game__info-panel')
    .forEach(element => element.classList.add('increased-height'));
}

function setInfoPanelsFinalHeight() {
  document.querySelectorAll('.game__info-panel')
    .forEach(element => element.classList.add('final'));
}

export default { highlightGoal, setInfoPanelsPlaybackHeight, setInfoPanelsFinalHeight };
