function highlightGoal(classModifier, gameIndex) {
  highlightGoalCountChange(classModifier, gameIndex);
  highlightLatestGoalChange(classModifier, gameIndex);
}

function highlightGoalCountChange(classModifier, gameIndex) {
  const element = document.querySelectorAll(`.team-panel--${classModifier} > .team-panel__team-score`)[gameIndex];
  if (element) {
    const highlightDuration = 1000;
    element.animate([{ color: 'black' }, { color: 'white' }], highlightDuration);
  }
}

function highlightLatestGoalChange(classModifier, gameIndex) {
  const element = document.querySelectorAll('.game__latest-goal-panel')[gameIndex];
  if (element) {
    const highlightDuration = 500;
    element.animate([{ opacity: 0 }, { opacity: 1 }], highlightDuration);
  }
}

export default { highlightGoal };
