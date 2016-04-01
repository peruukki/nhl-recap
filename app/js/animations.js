function highlightGoalCountChange(classModifier, gameIndex) {
  const element = document.querySelectorAll(`.team-panel--${classModifier} > .team-panel__team-score`)[gameIndex];
  if (element) {
    const highlightDuration = 1000;
    element.animate([{ color: 'white' }, { color: 'black' }], highlightDuration);
  }
}

export default { highlightGoalCountChange };
