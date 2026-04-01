# AGENTS.md

This file provides guidance to AI agents (Warp/Oz, Cursor, Copilot, etc.) when working with code in this repository.

## Project Overview

**Cliterface** (CLI + Interface) is a framework for building visual web GUIs for command-line tools. Each tool gets a rich, interactive panel — buttons, tabs, dropdowns, output panes — that wraps the underlying CLI. The output is a **single self-contained HTML file** with all JS and CSS inlined, designed to run instantly from `file://` in any system web view (WKWebView, WebView2, CEF, etc.) with **no server required**.

The first tool implemented is **yabai** (macOS tiling window manager). The architecture is intentionally generic so that new tool GUIs can be added as Stencil components and plugged into the dashboard.

### Design Goals

- **Single-file output**: One `dist/index.html` with inlined JS, CSS, and prerendered HTML. No external assets, no network requests, no lazy loading.
- **Instant paint**: HTML is server-side prerendered so the UI appears immediately on load, before JS executes.
- **WebView-first**: Optimized for embedding in native app web views. Must work on `file://` protocol. No service workers, no routing, no history API.
- **Lightweight**: Target < 60 KB total. No heavy frameworks. Stencil compiles to vanilla custom elements.
- **Native bridge ready**: A single `executeCommand()` function is the only integration point. Swap the stub for a Tauri invoke, Electron IPC, WKWebView message handler, or HTTP call.

## Tech Stack

- **Components**: [Stencil](https://stenciljs.com/) v4 — web component compiler (TSX → custom elements)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 — utility-first CSS via CLI
- **Bundling**: [esbuild](https://esbuild.github.io/) — bundles all component JS into one file
- **Prerendering**: Stencil Hydrate — server-side renders HTML at build time
- **Runtime**: Bun — script runner, package manager, file watcher
- **Linting**: [Biome](https://biomejs.dev/) — linting and formatting
- **Testing**: Vitest + Playwright — unit and component browser tests

### Why This Stack

- **Stencil over React/Vue/Svelte**: Compiles to native custom elements with zero runtime framework. The output is vanilla JS that registers `<app-dashboard>`, `<yabai-gui>`, etc. via `customElements.define()`. No virtual DOM library ships to the client.
- **Tailwind CLI over PostCSS plugin**: The `stencil-tailwind-plugin` does not work with external `styleUrl` CSS files (it expects inline styles in JSX). The Tailwind CLI approach is simpler, more reliable, and decoupled from Stencil's build.
- **Scoped CSS over Shadow DOM**: Shadow DOM prevents global Tailwind utility classes from reaching component internals. All components use `scoped: true`, which adds attribute-based selectors for style isolation while keeping global styles accessible.
- **esbuild over Stencil's lazy loader**: Stencil's default `www` output uses dynamic `import()` for lazy loading, which fails on `file://` due to CORS restrictions. esbuild bundles everything into a single static ES module.

## Commands

```bash
bun run build        # Full production build: Tailwind → Stencil → esbuild → single HTML
bun run dev          # Full rebuild + watch mode (Tailwind watch + file watcher, rebuilds on changes)

bun run test         # Run all tests (unit + component)
bun run test:watch   # Run tests in watch mode
bun run lint         # Biome linter check
bun run lint:fix     # Biome lint with auto-fix
bun run format       # Biome format with auto-fix
bun run check        # Biome check + fix (lint + format combined)
bun run generate     # Scaffold a new Stencil component
```

### Build Sub-Steps (rarely run individually)

```bash
bun run tailwind:build  # Tailwind CLI: input.css → output.css (minified)
bun run tailwind:watch  # Tailwind CLI in watch mode
bun run stencil         # Stencil build: compiles components + hydrate module
bun run bundle          # build.ts: esbuild + prerender + inline → dist/index.html
```

### Testing

Configured in `vitest.config.ts` with two project types:

- **Unit tests** (`*.unit.test.{ts,tsx}`): Run in Stencil's simulated environment. For logic, services, utilities.
- **Component tests** (`*.cmp.test.{ts,tsx}`): Run in real Chromium via Playwright. For DOM interaction, rendering, events.

```bash
bun run test src/utils/utils.unit.test.ts   # Run a specific test file
```

## Repository Structure

```
cliterface/
├── AGENTS.md                  # This file
├── biome.json                 # Biome linter/formatter config
├── build.ts                   # Single-file bundler (esbuild + hydrate + inline)
├── dev.ts                     # File watcher for development rebuilds
├── package.json               # Scripts and dependencies
├── stencil.config.ts          # Stencil compiler configuration
├── vitest.config.ts           # Test configuration (unit + browser)
├── tsconfig.json              # TypeScript config
│
├── src/
│   ├── index.html             # Dev-mode HTML shell (references build/ assets)
│   ├── index.ts               # Stencil entry point
│   ├── components.d.ts        # Auto-generated component type declarations
│   │
│   ├── global/
│   │   ├── input.css           # Tailwind v4 config: @theme tokens, @layer base/components
│   │   └── output.css          # Generated by Tailwind CLI (gitignored)
│   │
│   ├── components/
│   │   ├── app-dashboard/      # Root component: tool selection grid → routes to tool GUIs
│   │   ├── yabai-gui/          # yabai GUI: tabbed interface for all yabai commands
│   │   ├── cli-root/           # Minimal CLI input component (placeholder)
│   │   └── my-component/       # Stencil starter component (scaffold example)
│   │
│   ├── yabai/
│   │   └── yabai-service.ts    # Command execution service (stub with mock data)
│   │
│   └── utils/
│       ├── utils.ts            # Shared utilities
│       └── utils.unit.test.ts  # Unit test example
│
├── dist/                       # Build output (gitignored)
│   ├── index.html              # THE OUTPUT: single self-contained file
│   ├── components/             # Stencil custom-elements output (intermediate)
│   └── hydrate/                # Stencil SSR module (intermediate)
│
└── www/                        # Stencil www output (intermediate, gitignored)
    └── build/
        └── cliterface.css      # Processed global CSS
```

## Build Pipeline

The `bun run build` command runs three stages sequentially:

### Stage 1: Tailwind CSS (`tailwind:build`)

```
src/global/input.css  →  Tailwind CLI (--minify)  →  src/global/output.css
```

`input.css` contains:
- `@import 'tailwindcss'` — the Tailwind v4 entry point
- `@theme { ... }` — design tokens (colors, fonts) exposed as CSS custom properties and Tailwind utilities (e.g. `text-accent`, `bg-bg2`)
- `@layer base { ... }` — base body styles
- `@layer components { ... }` — reusable `.cli-btn`, `.cli-card`, `.cli-tab`, `.cli-input`, `.cli-output`, etc.

Tailwind scans all `src/**/*.tsx` files for utility class usage and generates only the CSS actually needed.

### Stage 2: Stencil Compile (`stencil`)

Stencil reads `stencil.config.ts` and produces two output targets:

1. **`dist-custom-elements`** → `dist/components/`
   - Each component becomes a standalone JS file that calls `customElements.define()` on import.
   - `auto-define-custom-elements` behavior means no manual registration needed.
   - `externalRuntime: false` bundles Stencil's ~10 KB runtime into each component.

2. **`www`** → `www/`
   - Produces `www/build/cliterface.css` (the global CSS processed through Stencil).
   - Also produces the hydrate module at `dist/hydrate/index.mjs` for SSR.
   - The `www` HTML output itself is not used — only the CSS and hydrate module matter.

### Stage 3: Bundle & Inline (`bundle` → `build.ts`)

This is the custom build script that produces the final `dist/index.html`:

1. **esbuild bundle**: Creates a virtual entry that imports `dist/components/index.js` (runtime) and all component files. esbuild bundles and tree-shakes into a single minified ES module.

2. **CSS read**: Reads the processed CSS from `www/build/cliterface.css` (falls back to `src/global/output.css`).

3. **Prerender**: Uses Stencil's hydrate `renderToString()` to server-side render `<app-dashboard>` into full HTML. This gives an instant visual paint on load.

4. **Hydration marker cleanup**: Strips Stencil SSR attributes (`s-id`, `c-id`, `hydrated` class) since the `dist-custom-elements` runtime does not support hydration — it always does a full client-side render.

5. **Script injection with safety escaping**:
   - Escapes `</` → `<\/` in JS to prevent premature `<script>` tag closure.
   - Uses a **function replacement** in `String.prototype.replace()` to avoid `$&` and `$'` patterns in minified JS being interpreted as replacement tokens (this was a critical bug — see Known Pitfalls).
   - Injects a bootstrap `<script>` that clears prerendered children from `<app-dashboard>` before the module script runs, preventing content duplication.

6. **Write**: Outputs `dist/index.html`.

### Development Workflow (`bun run dev`)

1. Runs `bun run build` once for an initial full build.
2. Starts two concurrent processes via `concurrently`:
   - **Tailwind watch**: Regenerates `output.css` on class changes in TSX files.
   - **File watcher** (`dev.ts`): Watches `src/` for changes, debounces 300ms, then runs `stencil build && build.ts`. Tailwind output changes also trigger a rebuild.
3. Open `dist/index.html` directly in a browser. Reload after changes.

There is no dev server or HMR — the output is always a fully built single file. This ensures dev and production behavior are identical.

## Architecture

### Component Model

All components use Stencil's `scoped: true` mode (not Shadow DOM). This means:
- Component styles are scoped via auto-generated `sc-{tag}` CSS class attributes.
- Global Tailwind utility classes work inside components without any workarounds.
- Component `.css` files contain only layout-specific rules (`:host` display, structural containers). All visual styling uses Tailwind utilities directly in JSX.

### Component Hierarchy

```
<app-dashboard>
  ├── Tool card grid (dashboard view)
  │   ├── yabai card → navigates to <yabai-gui>
  │   ├── jq card (coming soon)
  │   ├── docker card (coming soon)
  │   └── ...
  └── Tool interface (when a tool is selected)
      ├── <yabai-gui> — tabbed interface with query/action/config panels
      └── (future tool components)
```

`app-dashboard` manages routing via a `@State() selectedTool` property. No router library — just conditional rendering.

### Service Layer / Native Bridge

`src/yabai/yabai-service.ts` exports:
- `executeCommand(cmd: string): Promise<CommandResult>` — the single integration point.
- `yabai` object — typed helper methods (`yabai.query()`, `yabai.window()`, `yabai.space()`, etc.).
- TypeScript interfaces for all yabai data types (`YabaiWindow`, `YabaiSpace`, `YabaiDisplay`, etc.).

**Currently a stub** returning mock data. To connect to a real system, replace the body of `executeCommand()` with one of:
```typescript
// Tauri
return await invoke('execute', { command: cmd });
// Electron
return await ipcRenderer.invoke('exec', cmd);
// WKWebView (macOS/iOS)
return await window.webkit.messageHandlers.exec.postMessage(cmd);
// HTTP API
const res = await fetch('/api/exec', { method: 'POST', body: cmd });
return await res.json();
```

The component code does not need to change — only this one function.

### Styling System

The design system is defined entirely in `src/global/input.css`:

**Theme tokens** (available as Tailwind utilities and CSS custom properties):
- `--color-bg`, `--color-bg2`, `--color-bg3` — background layers
- `--color-accent`, `--color-accent2` — interactive/highlight colors
- `--color-text`, `--color-text2` — text colors
- `--color-success`, `--color-warning`, `--color-danger`, `--color-info` — semantic colors
- `--font-sans`, `--font-mono` — font stacks

**Reusable classes** (in `@layer components`):
- `.cli-btn`, `.cli-btn-sm`, `.cli-btn-success`, `.cli-btn-warning`, `.cli-btn-danger` — buttons
- `.cli-card` — content cards
- `.cli-tab`, `.cli-tab-active` — tab navigation
- `.cli-input`, `.cli-select` — form inputs
- `.cli-output` — terminal-style output pane
- `.cli-cmd-preview` — command preview box
- `.cli-badge-sip`, `.cli-badge-safe` — status badges

Components mix these classes with Tailwind utilities in JSX: `<button class="cli-btn cli-btn-success">`.

## Adding a New Tool GUI

1. Generate a component: `bun run generate` → enter tag name (e.g. `docker-gui`).
2. Set `scoped: true` in the `@Component` decorator (remove `shadow: true` if present).
3. Import and use the service pattern from `yabai-service.ts` or create a new service under `src/{tool}/`.
4. Add a card entry in `app-dashboard.tsx`'s `tools` array.
5. Add a `case` in `app-dashboard.tsx`'s `renderToolInterface()` switch.
6. Use `cli-*` component classes and Tailwind utilities for consistent styling.

## Known Pitfalls

### Inline Script Escaping (`build.ts`)

When inlining JS into a `<script>` tag inside HTML, two hazards exist:

1. **`</` sequences in JS**: The HTML parser sees `</` and closes the script tag prematurely. Fix: escape all `</` as `<\/` in the bundled JS before inlining.

2. **`$&` and `$'` replacement patterns**: JavaScript's `String.prototype.replace()` interprets `$&` in the replacement string as "insert the matched text" and `$'` as "insert text after the match." Minified JS is full of `$&` patterns (e.g. `e.$&&t.$&&`). If you use a string replacement like `html.replace('</body>', templateWithJs)`, every `$&` in the JS gets expanded to the matched text (`</body>`), corrupting the output. **Fix: always use a function replacement** — `html.replace('</body>', () => replacement)` — which bypasses all pattern interpretation.

### Prerender + Custom Elements Duplication

Stencil's `dist-custom-elements` runtime does not support hydration. When a custom element connects, it always performs a full client-side render by appending new DOM children. If the element already has prerendered children from SSR, you get doubled content. **Fix: a synchronous bootstrap script clears custom-element children before the module script executes.** The prerendered HTML still provides instant paint; the clearing is imperceptible since the module re-renders identical content immediately.

### Shadow DOM vs Scoped CSS

Do not change components to `shadow: true`. Tailwind utility classes are global and cannot penetrate Shadow DOM boundaries. If you need style isolation, use `scoped: true` (the current default), which scopes via attribute selectors while keeping global styles accessible.

### Tailwind Plugin Incompatibility

`stencil-tailwind-plugin` v2.x does not work with Stencil components that use `styleUrl` (external CSS files). It expects inline styles in JSX. Do not install it. Use the Tailwind CLI approach instead.

### File Protocol Restrictions

The `file://` protocol blocks `import()` dynamic imports (CORS) and `fetch()` to relative paths. This is why esbuild bundles everything statically and all assets are inlined. Do not introduce lazy loading or external resource references.
