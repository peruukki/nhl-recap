const getSectionExpandedStateKey = (index: number) => `gallery-section-expanded-${index}`;

export function getSectionExpandedState(index: number): boolean {
  return sessionStorage.getItem(getSectionExpandedStateKey(index)) !== 'false';
}

export function setSectionExpandedState(index: number, open: boolean): void {
  if (open) {
    sessionStorage.removeItem(getSectionExpandedStateKey(index));
  } else {
    sessionStorage.setItem(getSectionExpandedStateKey(index), 'false');
  }
}
