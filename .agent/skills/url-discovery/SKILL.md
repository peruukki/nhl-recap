---
name: url-discovery
description: Valid app, gallery, and API URLs for the nhl-recap project.
---

# URL Discovery Skill

Use these URLs for viewing the application and its component gallery in the browser.

## Application URLs

- **Main Application**: `http://localhost:8009/nhl-recap/`
- **Component Gallery**: `http://localhost:8009/nhl-recap/gallery/components`
- **Team Logos Gallery**: `http://localhost:8009/nhl-recap/gallery/team-logos`

## API URLs

- **Mock API**: `http://localhost:8081`
- **Local API Override**: Set `VITE_SCORE_API_HOST=http://localhost:8080` to use a custom local API instead of the mock server.

## Serving

The application and gallery are served using **Vite**.
- **Run `npm start`** to start the development server against the **production API**.
- **Run `npm run start:local`** to start the development server against the **local mock API** (requires `npm run start:server`).
- **Run `npm run start:server`** to start the **local mock API server** on port 8081.
