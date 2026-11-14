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

### 2. Testing the Service Worker Locally
- The service worker is **disabled** during `npm start` (Vite dev server) because Vite serves modules dynamically via HMR, so the precache manifest has no entries to serve offline.
- To test locally, use `npm run start:production` which creates a production build and previews it:
  1. Run `npm run start:production` to build the app and serve it on `localhost:8009`.
  2. Load the page and confirm the service worker is installed in **Application → Service Workers** in Chrome DevTools.
  3. Select **Offline** and de-select **Bypass for network** in the Service Workers panel and reload to verify offline behavior.

## Deployment

- The application is deployed to GitHub Pages from the `dist/` directory (on the `gh-pages` branch).
- Run `npm run build` to prepare a complete production build.
