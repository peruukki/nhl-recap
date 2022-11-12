const getGameStateToggleCheckedKey = (index: number) => `game-state-toggle-checked-${index}`;

export function getGameStateToggleChecked(index: number): boolean {
  return sessionStorage.getItem(getGameStateToggleCheckedKey(index)) !== 'false';
}

export function setGameStateToggleChecked(index: number, checked: boolean): void {
  if (checked) {
    sessionStorage.removeItem(getGameStateToggleCheckedKey(index));
  } else {
    sessionStorage.setItem(getGameStateToggleCheckedKey(index), 'false');
  }
}
