import { button, div, h1, header, span, VNode } from '@cycle/dom';

import type { GameEvent, Scores } from '../types';
import Icon from './icon';

type Props = {
  clockVtree: VNode;
  date: Scores['date'];
  event: GameEvent | null;
  gameCount: number;
  isPlaying: boolean;
};

export default function Header({ clockVtree, date, event, gameCount, isPlaying }: Props) {
  const hasNotStarted = !event;
  const isFinished = event?.type === 'end';
  const buttonText = isPlaying ? 'Pause' : 'Play';
  const buttonType = isPlaying ? 'pause' : 'play';
  const showIcon = gameCount > 0;

  const dynamicClassNames = {
    [`button--${buttonType}`]: showIcon,
    'expand--last': gameCount > 0 && hasNotStarted,
    'button--hidden': isFinished,
  };

  return header(
    '.header',
    div('.header__container', [
      h1('.header__title', [span('.all-caps', 'NHL'), ' Recap']),
      button(
        '.button.play-pause-button',
        { props: { ariaLive: 'polite' }, class: dynamicClassNames },
        [
          span('.visible-button', [
            showIcon ? Icon(buttonType) : null,
            span('.visually-hidden', buttonText),
          ]),
        ],
      ),
      hasNotStarted && date ? span('.header__date.fade-in-slow', date.pretty) : clockVtree,
    ]),
  );
}
