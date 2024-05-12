import { div } from '@cycle/dom';
import html from 'snabby';

import pause from './pause.svg?raw';
import play from './play.svg?raw';

const icons = { pause, play };

export function Icon(name: keyof typeof icons) {
  return div('.icon', html([icons[name]]));
}
