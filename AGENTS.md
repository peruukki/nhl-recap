# AGENTS.md

This document provides essential information for AI agents working on the nhl-recap codebase.

## Project Overview

**nhl-recap** is a web application that plays back goal information from the latest NHL games. It's built for viewing game recaps, particularly useful for checking scores from games played during nighttime.

- **Live URL**: https://peruukki.github.io/nhl-recap/
- **Backend API**: Uses [nhl-score-api](https://github.com/peruukki/nhl-score-api)
- **Date Parameter**: Supports custom dates via URL search parameter `?date=YYYY-MM-DD`

## AI Agent Skills

For specific tasks, please refer to the specialized skills available in the `.agent/skills/` directory:

- **[api-integration](.agent/skills/api-integration/SKILL.md)**: Backend API structure, environment variables, mocking with `nock`, and utility functions.
- **[pwa-management](.agent/skills/pwa-management/SKILL.md)**: Service Worker implementation, Workbox, and PWA build process.
- **[ui-development](.agent/skills/ui-development/SKILL.md)**: UI components, Cycle.js patterns, SASS styles, and the component gallery.

## Technology Stack

### Core Frameworks
- **Cycle.js**: Reactive framework for building user interfaces.
- **xstream**: Reactive streams library (used by Cycle.js).
- **snabby**: Virtual DOM library (hyperscript syntax).

### Build & Quality Tools
- **Vite & Rollup**: Build tools and bundling.
- **TypeScript**: Type checking and compilation.
- **SASS**: CSS preprocessing.
- **Biome & Stylelint**: Linting and formatting.
- **Vitest**: Unit testing framework.

## Project Structure

```
nhl-recap/
├── app/                    # Main application source
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── events/         # Event handling
│   │   ├── service-worker/ # Service worker code
│   │   ├── styles/         # Component-specific styles
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
├── gallery/                # Component gallery (development tool)
├── public/                 # Build output directory
├── server/                 # Mock API server (json-server)
└── tsconfig.json, biome.json, etc. # Configuration files
```

## Key Conventions

### Documentation
- Write headings in sentence case instead of title case.

### Code Style
- Write concise code:
  - Only add comments when the implementation or motivation is non-trivial.
  - Infer types when possible.
  - Prefer expression body over block body.
  - Only export types intended for use outside their defining file.

## Development Workflow

**Important:** Run `nvm use` to set the correct Node.js version before running any npm commands.

### Main Scripts

```bash
npm run check          # Run all checks (format, lint, type-check, test)
npm run format         # Format code
npm run lint           # Lint JS/TS and SASS
npm run ts             # Type-check TypeScript
npm test               # Run tests
npm run build          # Build application
```

## Node.js Version

- Requires **Node.js >= 24.0** (specified in `package.json`).
