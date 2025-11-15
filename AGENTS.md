# AGENTS.md

This document provides essential information for AI agents working on the nhl-recap codebase.

## Project Overview

**nhl-recap** is a web application that plays back goal information from the latest NHL games. It's built for viewing game recaps, particularly useful for checking scores from games played during nighttime (e.g., in Finland).

- **Live URL**: https://peruukki.github.io/nhl-recap/
- **Backend API**: Uses [nhl-score-api](https://github.com/peruukki/nhl-score-api)
- **Date Parameter**: Supports custom dates via URL search parameter `?date=YYYY-MM-DD` (e.g., `?date=2025-06-17`)

## Technology Stack

### Core Framework

- **Cycle.js** - Reactive framework for building user interfaces
- **xstream** - Reactive streams library (used by Cycle.js)
- **snabby** - Virtual DOM library (hyperscript syntax)

### Build Tools

- **Vite** - Build tool and dev server
- **TypeScript** - Type checking and compilation
- **Rollup** - Service worker bundling
- **SASS** - CSS preprocessing

### Testing

- **Vitest** - Unit testing framework
- **nock** - HTTP mocking for tests

### Code Quality

- **ESLint** - JavaScript/TypeScript linting
- **Stylelint** - SASS/CSS linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

### Dependencies

- `@cycle/dom` - Cycle.js DOM driver
- `@cycle/http` - Cycle.js HTTP driver
- `@cycle/run` - Cycle.js runtime
- `classnames` - Conditional CSS class utility
- `lodash` - Utility functions
- `timeago.js` - Relative time formatting
- **Workbox** - Service worker/PWA functionality (precaching, routing, strategies, expiration)

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
│   │   ├── main.ts         # Application entry point
│   │   └── main.scss       # Main stylesheet
│   └── styles/             # Global styles
├── gallery/                # Component gallery (development tool)
├── public/                 # Build output directory
├── server/                 # Mock API server (json-server)
│   └── db.json             # Mock data
├── dist/                   # Deployment directory (gh-pages branch)
├── vite.config.ts          # Vite configuration
├── rollup.config.js        # Rollup configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── stylelint.config.mjs    # Stylelint configuration
```

## Key Conventions

### Documentation

- Write headings in sentence case instead of title case

### CSS/SASS Naming

- **BEM (Block-Element-Modifier)** naming convention is used throughout the project
- Example: `.block__element--modifier`
- Lint scripts use `css` suffix (not `sass`) for uniformity

### Code Style

- JavaScript/TypeScript formatting via **Prettier**
- TypeScript is used for type safety
- ES modules (`"type": "module"` in package.json)
- Write concise code:
  - only add comments when the implementation is non-trivial or the motivation for the code is unclear
  - infer types when possible
  - prefer expression body over block body

### Component Structure

- Components follow Cycle.js patterns (sources and sinks)
- Components are organized in `app/src/components/`
- Styles are co-located with components in `*.scss` files

## Development Workflow

**Important:** Run `nvm use` to set the correct Node.js version before running any npm commands in a new shell.

### Component Gallery

Development tool for viewing components in different states:

- URL: http://localhost:8008/nhl-recap/gallery/ (trailing slash required)
- Located in `gallery/` directory

### Code Quality Checks

**Run all checks** (format, lint, type-check, test):

```bash
npm run check
```

**Format code**:

```bash
npm run format
```

**Lint JavaScript/TypeScript**:

```bash
npm run lint:js
```

**Lint SASS**:

```bash
npm run lint:css
```

**Type-check TypeScript**:

```bash
npm run ts
```

### Testing

**Run tests**:

```bash
npm test
```

**Run tests with coverage**:

```bash
npm run test:coverage
```

**Run tests in watch mode**:

```bash
npm run test:watch
```

### Building

**Build application**:

```bash
npm run build
```

- Builds app to `public/` directory
- Also builds service worker

## Important Files

### Entry Points

- `app/src/main.ts` - Application entry point
- `app/src/main.scss` - Main stylesheet
- `index.html` - HTML entry point

### Configuration Files

- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint rules
- `stylelint.config.mjs` - Stylelint rules
- `rollup.config.js` - Service worker bundling config

### Environment Variables

- `VITE_DEBUG` - Debug mode flag (used in `npm start`)
- `VITE_SCORE_API_HOST` - API host override (defaults to production API, set to `http://localhost:8080` for local)

### Service Worker

- `app/src/service-worker/service-worker.js` - Service worker source
- Built to `public/service-worker.js` using Rollup
- Uses Workbox for PWA functionality (precaching, routing, caching strategies)

## API Integration

- **Default API**: Production nhl-score-api (GitHub-hosted)
- **Local API**: Set `VITE_SCORE_API_HOST=http://localhost:8080` to use local server
- **Mock API**: Use `npm run start:server` for json-server with static `server/db.json`

## Deployment

- **Primary method**: GitHub Actions workflow (`.github/workflows/deployment.yml`)
- **Alternative method**: `npm run deploy` script
  - Builds app
  - Clones `gh-pages` branch to `dist/`
  - Copies build to `dist/`
  - Commits and pushes to `gh-pages` branch

## Testing Approach

- Unit tests in `app/src/test/` or `*.spec.ts` files
- Uses Vitest for testing framework
- HTTP requests are mocked with `nock` in tests
- Test files typically end with `.spec.ts`

## Node.js Version

- Requires **Node.js >= 22.0** (specified in `package.json` engines)

## Common Tasks for AI Agents

1. **Adding a new component**:
   - Create component in `app/src/components/`
   - Follow Cycle.js patterns (sources/sinks)
   - Add corresponding `.scss` file with BEM naming
   - Write tests in `*.spec.ts` file

2. **Modifying styles**:
   - Use BEM naming convention
   - Component styles in component directories
   - Global styles in `app/src/styles/`
   - Run `npm run lint:css` to verify

3. **Adding utilities**:
   - Add to `app/src/utils/`
   - Write tests in `app/src/utils/*.spec.ts`
   - Use TypeScript for type safety

4. **API changes**:
   - Update API calls in components using `@cycle/http`
   - Mock API responses in tests using `nock`
   - Test with local API using `npm run start:local`

5. **Service worker changes**:
   - Modify `app/src/service-worker/service-worker.js`
   - Rebuild with `npm run build:sw` or `npm run build`

## Notes

- The project uses ES modules (`"type": "module"`)
- Service worker is built separately using Rollup
- Component gallery available at `/gallery/` for development
- Date parameter format: `YYYY-MM-DD` in URL query string
- PWA functionality enabled via Workbox service worker
