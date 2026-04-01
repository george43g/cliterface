# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Cliterface is a Stencil-based web application that provides visual GUIs for command-line tools. Currently implements a GUI for yabai (macOS window manager). Built as a single-file HTML app with inlined CSS/JS.

## Commands

```bash
bun run dev          # Development server with hot reload (Stencil dev mode)
bun run dev:full     # Dev server + Tailwind CSS watcher
bun run build        # Production build: Tailwind + Stencil + single-file bundle
bun run test         # Run all tests
bun run test:watch   # Run tests in watch mode
bun run lint         # Biome linter check
bun run lint:fix     # Biome lint with auto-fix
bun run format       # Biome format with auto-fix
bun run generate     # Generate new Stencil component (scaffold)
```

### Testing

Two test project types configured in `vitest.config.ts`:
- **Unit tests**: Files matching `*.unit.test.{ts,tsx}` - run with Stencil environment
- **Component tests**: Files matching `*.cmp.test.{ts,tsx}` - run with Playwright in Chromium

To run a specific test file:
```bash
bun run test src/utils/utils.unit.test.ts
```

## Architecture

### Component Structure
- `src/components/app-dashboard/` - Main entry point, tool selection UI that routes to tool-specific components
- `src/components/yabai-gui/` - yabai window manager GUI with tabbed interface (Query, Windows, Spaces, Displays, Config, Rules, Signals, Service, Raw)
- `src/components/cli-root/` - Basic CLI input component

### Service Layer
`src/yabai/yabai-service.ts` - Central service for yabai command execution. **Currently a stub** returning mock data. The `executeCommand()` function needs integration with a native bridge (Tauri, Electron, WKWebView, or HTTP API) to execute actual shell commands.

### Styling
- Tailwind CSS v4 configured via `src/global/input.css`
- Custom theme tokens defined in `@theme` block (colors, fonts)
- Reusable component classes in `@layer components` (cli-btn, cli-card, cli-tab, etc.)
- Build process: Tailwind CLI writes to `src/global/output.css`, Stencil uses this as global style

### Build Pipeline
1. `build:tailwind` - Tailwind CLI processes input.css → output.css
2. `build:stencil` - Stencil compiles components, prerenders HTML to `www/`
3. `build:bundle` - Custom `build.ts` bundles everything into a single `dist/index.html` with inlined JS/CSS

### Output Targets (stencil.config.ts)
- `dist` - Standard distribution with lazy loading
- `dist-custom-elements` - Standalone custom elements with auto-define behavior
- `www` - Prerendered static site for development/bundling