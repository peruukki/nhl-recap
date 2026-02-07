# Animations

Animations are a key part of the app's user experience. They are implemented using a mix of CSS transitions, SCSS keyframe animations, and JavaScript (Web Animations API).

## Technical Overview

The application uses a unified animation speed control through a CSS variable `--animation-speed`. This variable is respected by both CSS and JavaScript animations.

### 1. Staggered Entrance Animations

When the game list loads, cards appear with a staggered "expand and slide" effect.

- **Source**: [animations.scss](../styles/animations.scss)
- **Mechanism**: SCSS `@for` loop generating classes `.expand--0` through `.expand--15`.
- **Timing**: Uses a custom `cubic-bezier` function for non-linear staggering delays.
- **Accessibility**: Replaces transforms with a simple fade-in when `prefers-reduced-motion` is detected.

### 2. Game Highlighting & Focus

High-interest games or active playback can trigger a "focus" state that centers and scales a game card.

- **Logic**: [animations.ts](../utils/animations.ts) calculates viewport coordinates for centering.
- **Styles**: [game.scss](../components/game.scss) handles smooth transitions for `transform` and `background-color`.
- **Depth**: Uses `.in-front` class to manage `z-index` and `box-shadow` during the transition.

### 3. Event Highlighting (Playback)

Visual feedback during game recap playback.

- **Goal Scoring**: Animates the score text color to gold (`#fac02d`) using `element.animate()`.
- **State Changes**: The play/pause button icon and info panels use short fades to transition between states.
- **Source**: [animations.ts](../utils/animations.ts)

### 4. Interactive Feedback

- **"Nope" Animation**: A horizontal shake effect applied to status messages on error or "no data" states.
- **Delayed Animations**: Mixins like `delayed-animation` provide consistent timing for secondary panel appearances.

## Accessibility

All animations are designed to respect the `prefers-reduced-motion` media query.

- In CSS, complex transforms are often disabled or replaced with simple opacity fades.
- In JS, coordinate-based animations are bypassed in favor of immediate state changes or basic fades.
