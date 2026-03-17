---
name: ui-development
description: Guidelines for creating and modifying UI components and styles in nhl-recap.
---

# UI Development Skill

This skill provides guidance on working with the Cycle.js based UI and SASS styles in the nhl-recap project.

## Technology Stack

### Core Frameworks
- **Cycle.js**: Reactive framework for building user interfaces.
- **xstream**: Reactive streams library (used by Cycle.js).
- **snabby**: Virtual DOM library (hyperscript syntax).

### Styles
- **SASS**: CSS preprocessing.

## Component Gallery

The component gallery is a development tool for viewing components in different states.

- **URL**: http://localhost:8008/nhl-recap/gallery/ (trailing slash required)
- **Location**: `gallery/` directory

## Common Tasks

### 1. Adding a New Component
- Create the component file in `app/src/components/`.
- Follow Cycle.js patterns (sources/sinks).
- Add a corresponding `.scss` file in the same directory (or `app/src/styles/` if global).
- Use BEM naming convention for CSS classes.
- Write unit tests in a `*.spec.ts` file.

### 2. Modifying Styles
- Use BEM naming convention.
- Component-specific styles should be in the component's directory or `app/src/styles/`.
- Global styles are in `app/src/styles/`.
- Run `npm run lint` (or specifically `npm run lint:css`) to verify your changes.

## Related Resources
- [ANIMATIONS.md](../../app/src/styles/ANIMATIONS.md) - Detailed animation patterns.
- [README.md](../../app/src/components/README.md) - Component hierarchy and structure.
