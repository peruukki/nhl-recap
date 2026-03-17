---
name: development-guidelines
description: General code style, development workflow, and build/quality tools for nhl-recap.
---

# Development Guidelines Skill

This skill provides general guidance on the code style, development workflow, and tools used across the nhl-recap project.

## Technology Stack

### Build & Quality Tools
- **Vite & Rollup**: Build tools and bundling.
- **TypeScript**: Type checking and compilation.
- **Biome & Stylelint**: Linting and formatting.
- **Vitest**: Unit testing framework.

## Code Style

- **Write concise code**:
  - Only add comments when the implementation or motivation is non-trivial.
  - Infer types when possible.
  - Prefer expression body over block body.
  - Only export types intended for use outside their defining file.

## Development Workflow

### Node.js Version
- Requires **Node.js >= 24.0** (specified in `package.json`).
- Run `nvm use` to set the correct version before running npm commands.

### Main Scripts

```bash
npm run check          # Run all checks (format, lint, type-check, test)
npm run format         # Format code
npm run lint           # Lint JavaScript/TypeScript and SASS
npm run ts             # Type-check TypeScript
npm test               # Run tests
npm run build          # Build application
```

## Related Resources
- [AGENTS.md](../../AGENTS.md) - Project overview and structure.
