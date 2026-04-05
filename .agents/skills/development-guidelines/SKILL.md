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

## Testing

- **Avoid ALL_CAPS in test descriptions**:
  - Do not capitalize words like "NOT" (e.g., use "should not" instead of "should NOT"). Use regular capitalization throughout.

## Code Style

- **Write concise code**:
  - Only add comments when the implementation or motivation is non-trivial.
  - Infer types when possible.
  - Prefer expression body over block body.
  - Only export types intended for use outside their defining file.

## TypeScript Best Practices

- **Avoid type casts**:
  - Do not use `as` (e.g., `as any`, `as TeamRecord`) to bypass type checking.
  - Use type narrowing (e.g., `if` checks, `typeof`, `instanceof`) to handle optional or union types.
  - In unit tests, provide complete mock data that satisfies the required types instead of casting to `any` or `unknown`.
  - Prefer proper type definitions or narrowing over `!` (non-null assertion).
  - Leverage `Pick`, `Omit`, and `Partial` to create derivative types instead of duplicating or casting.
  - Use `Record<K, V>` for mapping keys to values.
- **Avoid plain boolean parameters**:
  - Favor options objects over multiple boolean parameters (e.g., `{ showGamesLeft: true }` instead of `true`). This improves call-site readability and makes the code more extensible.

## Ordering & Sorting

- **Always sort properties and list items alphabetically** whenever it makes sense and doesn't change behavior. This applies to:
  - Source code (e.g., object properties, import members).
  - Configuration files (e.g., `package.json` scripts/dependencies, `tsconfig.json` options).
  - Documentation (e.g., lists of features or tools).

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

**Use `npm run check` by default; use individual scripts only when you have a specific reason to.**

## Related Resources
- [AGENTS.md](../../AGENTS.md) - Project overview and structure.
