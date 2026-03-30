---
name: documentation-guidelines
description: Guidelines for documentation standards and project-specific README files in nhl-recap.
---

# Documentation Guidelines Skill

This skill provides guidance on maintaining and creating documentation in the nhl-recap project.

## Standards

### Headings
- Write headings in **sentence case** instead of title case (e.g., "Main infrastructure" instead of "Main Infrastructure").

### Visualizations
- Use **Mermaid diagrams** for visualizing component hierarchies or complex logic.
- Example structure from `app/src/components/README.md`:
  ```mermaid
  graph TD
      App --> Clock
      App --> Game
      App --> Header
  ```

## Project Documentation Registry

Refer to these files for detailed information on specific areas:

- **[README.md](../../README.md)**: High-level overview, quick start, and deployment.
- **[app/src/components/README.md](../../app/src/components/README.md)**: Detailed component hierarchy, structure, and styling conventions.
- **[tools/README.md](../../tools/README.md)**: Documentation for development tools, specifically the logo visual weight analysis tool.
- **[ANIMATIONS.md](../../app/src/styles/ANIMATIONS.md)**: Detailed animation patterns and implementation details.
