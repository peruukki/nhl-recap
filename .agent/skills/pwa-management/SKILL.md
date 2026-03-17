---
name: pwa-management
description: Guidelines for Service Worker and PWA functionality in nhl-recap.
---

# PWA Management Skill

This skill provides guidance on working with the Service Worker and PWA functionality in the nhl-recap project.

## Service Worker

- **Source**: `app/src/service-worker/service-worker.js`.
- **Build Output**: Built to `public/service-worker.js` using Rollup.
- **Library**: Uses **Workbox** for PWA functionality (including precaching, routing, and caching strategies).

## Common Tasks

### 1. Service Worker Changes
- Modify the source file in `app/src/service-worker/service-worker.js`.
- Rebuild the service worker using `npm run build:sw` or `npm run build`.
- Verify the build output in `public/service-worker.js`.

## Deployment

- The application is deployed to GitHub Pages from the `dist/` directory (on the `gh-pages` branch).
- Run `npm run build` to prepare a complete production build.
