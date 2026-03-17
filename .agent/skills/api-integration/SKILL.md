---
name: api-integration
description: Guidelines for API integration, environment variables, mocking, and utilities in nhl-recap.
---

# API Integration Skill

This skill provides guidance on working with the backend API, environment variables, and utility functions in the nhl-recap project.

## Technology Stack

### Testing & Mocking
- **nock**: HTTP mocking for tests.
- **json-server**: Mock API server for local development.

## Environment Variables

- `VITE_DEBUG`: Debug mode flag (as used in `npm start`).
- `VITE_SCORE_API_HOST`: API host override (defaults to production API; set to `http://localhost:8080` for local development).

## API Integration

- **Default API**: Production nhl-score-api.
- **Local API**: Set `VITE_SCORE_API_HOST=http://localhost:8080` to use a local server.
- **Mock API**: Use `npm run start:server` to run `json-server` with static `server/db.json`.

## Common Tasks

### 1. Adding Utilities
- Add utility functions to `app/src/utils/`.
- Write unit tests in `app/src/utils/*.spec.ts`.
- Use TypeScript for type safety and clarity.

### 2. API Changes
- Update API calls in components using `@cycle/http`.
- Mock API responses in tests using `nock`.
- Update `server/db.json` to include new mock data if needed.

## Testing & Mocking

- Unit tests are located in `app/src/test/` or alongside the source as `*.spec.ts`.
- HTTP requests are mocked with `nock` in tests.
- Run `npm test` or `npm run test:watch` to verify.
