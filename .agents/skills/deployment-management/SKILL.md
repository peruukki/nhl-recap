---
name: deployment-management
description: Guidelines for triggering and managing deployments using GitHub Actions and local scripts.
---

# Deployment Management Skill

This skill provides instructions for deploying the nhl-recap application to GitHub Pages.

## Deployment Methods

### 1. GitHub Actions (Preferred)
Deployments are managed via the **Deployment** workflow (`deployment.yml`). This is the standard way to deploy and ensures all checks pass in a clean environment.

- **Triggering the workflow:**
  Use the GitHub CLI (`gh`) to trigger the workflow from the `master` branch:
  ```bash
  gh workflow run Deployment --ref master
  ```

- **Authentication:**
  Ensure the CLI is authenticated. Check status with:
  ```bash
  gh auth status
  ```
  If not authenticated or the token is invalid, ask the user to run `gh auth login`.

- **Monitoring progress:**
  View the status of the triggered run:
  ```bash
  gh run list --workflow Deployment --limit 1
  ```
  Watch a running workflow:
  ```bash
  gh run watch
  ```

### 2. Local Deployment Script (Alternative)
A local script is available for emergency or manual deployments that bypass the remote CI environment (though it still runs a build).

```bash
npm run deploy
```
This script:
1. Builds the app.
2. Clones the `gh-pages` branch.
3. Cleans and copies the new build.
4. Commits and pushes to `origin gh-pages`.

## Verification Before Deployment

Always run all project checks before triggering a deployment:
```bash
npm run check
```

## Related Resources
- [.github/workflows/deployment.yml](../../.github/workflows/deployment.yml)
- [package.json](../../package.json)
