# AGENTS.md

This document provides essential information for AI agents working on the nhl-recap codebase.

## Project Overview

**nhl-recap** is a web application that plays back goal information from the latest NHL games. It's built for viewing game recaps, particularly useful for checking scores from games played during nighttime.

- **Live URL**: https://peruukki.github.io/nhl-recap/
- **Backend API**: Uses [nhl-score-api](https://github.com/peruukki/nhl-score-api)
- **Date Parameter**: Supports custom dates via URL search parameter `?date=YYYY-MM-DD`

## AI Agent Skills

For specific tasks, please refer to the specialized skills available in the `.agent/skills/` directory:

- **[api-integration](.agent/skills/api-integration/SKILL.md)**: Backend API structure, environment variables, mocking, and utilities.
- **[development-guidelines](.agent/skills/development-guidelines/SKILL.md)**: General code style, development workflow, and build/quality tools.
- **[pwa-management](.agent/skills/pwa-management/SKILL.md)**: Service Worker implementation, Workbox, and PWA build process.
- **[ui-development](.agent/skills/ui-development/SKILL.md)**: UI components, Cycle.js patterns, SASS styles, and the component gallery.

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
