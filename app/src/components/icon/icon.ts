import { div } from '@cycle/dom';
import html from 'snabby';

import cold1 from './cold-1.svg?raw';
import cold2 from './cold-2.svg?raw';
import cold3 from './cold-3.svg?raw';
import externalLink from './external-link.svg?raw';
import hot1 from './hot-1.svg?raw';
import hot2 from './hot-2.svg?raw';
import hot3 from './hot-3.svg?raw';
import pause from './pause.svg?raw';
import play from './play.svg?raw';

const icons = {
  cold1,
  cold2,
  cold3,
  externalLink,
  hot1,
  hot2,
  hot3,
  pause,
  play,
};

export function Icon(name: keyof typeof icons) {
  return div(`.icon.icon--${name}`, html([icons[name]]));
}
