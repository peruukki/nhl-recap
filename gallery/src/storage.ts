const getGameStateToggleOpenKey = (index: number) => `game-state-toggle-open-${index}`;

export function getGameStateToggleOpen(index: number): boolean {
  return sessionStorage.getItem(getGameStateToggleOpenKey(index)) !== 'false';
}

export function setGameStateToggleOpen(index: number, open: boolean): void {
  if (open) {
    sessionStorage.removeItem(getGameStateToggleOpenKey(index));
  } else {
    sessionStorage.setItem(getGameStateToggleOpenKey(index), 'false');
  }
}
