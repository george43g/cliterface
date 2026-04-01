# add-cli-tool

Use this skill when you are asked to add a new CLI tool GUI to Cliterface.

## Input

- `cmd` (string): the CLI command name to wrap in a GUI, for example `jq`, `git`, `docker`, `firebase`, or `yabai`.

## Purpose

Convert an existing CLI into a practical, task-oriented, one-page web GUI inside this repo's existing architecture.

The output must fit Cliterface's constraints:

- single self-contained `dist/index.html`
- works from `file://`
- prerendered for instant paint
- interactive after the bundled JS loads
- built with Stencil components, Tailwind utilities, scoped CSS, and the existing bundling pipeline

Do not build a documentation viewer. Build a usable GUI.

## Product framing

Cliterface is not just a launcher for raw shell commands. It is a visual IDE for system tools and shell workflows.

When designing the GUI for a tool, optimize for:

- common tasks first
- clear command construction
- visibility into what the command does
- progressive disclosure for advanced options
- safe vs mutating action separation
- a UI that teaches the tool while also operating it

The long-term product direction includes:

- tooltips and inline help sourced from man pages/docs
- hoverable command segments that explain what each piece does
- contextual compatibility hints between flags, targets, formats, and modes
- schema-based validation for command composition
- command explanation and command generation via AI
- regex or syntax validation derived from docs when feasible
- saved state and reusable context (projects, labels, targets, env info, versions, history)
- potential chaining of one command's output into another

You do not need to implement all of these for every tool, but you should design with them in mind and leave clear extension points.

## Repository constraints you must follow

Read `AGENTS.md` first and follow it.

Important repo rules:

- Use **Stencil** web components.
- Use **Tailwind CSS v4** via the existing CLI pipeline in `src/global/input.css`.
- Use `scoped: true`, not Shadow DOM.
- Keep component CSS files layout-only when possible.
- Do not introduce lazy loading or external assets.
- The final app must continue to work from `file://`.
- The only execution boundary is the existing command bridge pattern like `executeCommand(cmd)`.

Do not break the current build pipeline:

- `bun run build`
- `bun run dev`
- `bun run stencil`
- `bun run bundle`

## Required first step: inspect the CLI properly

Before building any UI, inspect the CLI in a non-interactive way.

Do not stop at `cmd --help`.

You must systematically inspect the tool surface area using stdout/stderr output only. Do not launch pagers, TUIs, editors, or anything interactive.

### Minimum CLI inspection checklist

Run whichever of these are valid for the tool:

```bash path=null start=null
env MANPAGER=cat man {{cmd}} | col -b
{{cmd}} --help
{{cmd}} --version
```

Then inspect help for major subcommands or modes. Examples:

```bash path=null start=null
{{cmd}} <subcommand> --help
{{cmd}} help <subcommand>
```

Also inspect:

- major command groups
- high-frequency workflows
- machine-readable modes such as JSON output if they exist
- selectors, filters, targets, global flags, output flags, config flags, and destructive actions

If the CLI has many subcommands, do not inspect everything blindly. Identify the main clusters first, then inspect representative commands within each cluster.

### Man page handling

Never use interactive man output.

Prefer forms like:

```bash path=null start=null
env MANPAGER=cat man {{cmd}} | col -b
env PAGER=cat man {{cmd}} | col -b
```

Choose the variant that works and preserves readable text.

## Optional documentation lookup

If Context7 or other authoritative docs are available, use them as supplemental context.

Priority order:

1. installed/local CLI behavior
2. local man page text
3. authoritative docs
4. never invent unsupported flags or workflows

If local output and online docs conflict, prefer the installed/local version unless you have strong evidence the local output is incomplete or outdated.

## What you must infer from the CLI

From the collected material, identify:

- main modes of operation
- major subcommands
- repeated argument patterns
- parameter types
- selectors and filters
- common workflows
- read-only/query actions vs mutating actions
- destructive or risky operations
- plain text vs structured output
- whether the tool is daemon-based, query-driven, action-driven, config-driven, or pipeline-oriented

Then translate that into a GUI model.

## UX translation rules

Do not mirror the CLI literally.

Instead, create a practical, task-oriented one-page interface that:

- groups related actions into logical tabs, cards, or sections
- exposes common actions as buttons, selects, toggles, and inputs
- makes advanced functionality available without overwhelming the first view
- shows the exact command that will run
- allows the generated command to be edited before execution when appropriate
- shows stdout/stderr clearly
- separates safe actions from risky actions visually
- includes inline hints/tooltips derived from the docs
- includes a raw-command escape hatch for unsupported or advanced usage

Prefer workflows like:

- query / inspect
- create / update / mutate
- config / preferences
- service / daemon control
- advanced / raw

Instead of a giant flat list of flags.

## Validation and command-compatibility guidance

When the CLI has combinable subcommands, flags, selectors, targets, formats, or modes:

- encode the command model explicitly
- validate combinations in code instead of relying only on UI convention
- disable or de-emphasize incompatible inputs
- highlight compatible inputs based on current selections
- group related flags visually by category
- provide short explanatory hints for why something is valid or invalid

For richer tools, prefer schema-driven validation.

If appropriate, add `zod` schemas for:

- command builder state
- parsed form values
- combinable option groups
- output validation for structured responses

Use regex validation only when the CLI syntax is documented clearly enough to justify it.

Do not fabricate syntax rules.

## Execution model

Do not pretend the browser can directly execute native shell commands.

Use the established bridge pattern:

```ts path=null start=null
async function executeCommand(cmd: string) {
  // stub for native bridge
}
```

Wire all tool actions through the service layer for that tool.

Current repo convention:

- tool-specific types and command helpers live under `src/<tool>/`
- UI lives under `src/components/<tool>-gui/`

If no backend exists yet:

- provide a stub
- return realistic mock data where useful
- structure the service so it can later be swapped for Tauri, Electron, WKWebView, HTTP, or another native bridge

## Implementation steps in this repo

For a new tool `{{cmd}}`, follow this structure:

1. Create a tool service module under `src/{{cmd}}/`
2. Create a Stencil component under `src/components/{{cmd}}-gui/`
3. Add the tool to the dashboard card list in `src/components/app-dashboard/app-dashboard.tsx`
4. Add a render path for the tool in the dashboard's tool switch
5. Use Tailwind utilities and existing `cli-*` classes from `src/global/input.css`
6. Keep component CSS layout-focused and use `scoped: true`

Typical files:

```text path=null start=null
src/{{cmd}}/{{cmd}}-service.ts
src/components/{{cmd}}-gui/{{cmd}}-gui.tsx
src/components/{{cmd}}-gui/{{cmd}}-gui.css
```

### Service-layer expectations

The service module should usually contain:

- `CommandResult`-style types if needed
- tool-specific response types
- helper methods grouped by command family
- a single `executeCommand()` bridge
- mock responses for common read-only flows until a real backend exists

### UI expectations

The GUI should usually contain:

- top-level title and status area
- tabbed or sectioned workflows
- command preview
- output/results panel
- raw command mode
- safe/risky visual labels
- inline help where useful

## Reuse and modularity guidance

Keep the code DRY and modular.

If multiple tools need the same patterns, prefer shared abstractions for:

- command preview display
- output/result panels
- validation helpers
- risk badges
- tooltips/help popovers
- state persistence helpers

Do not prematurely over-abstract if only one tool uses something, but build with future reuse in mind.

## Product-level feature guidance

When deciding what to include for a new tool, consider whether the tool benefits from:

- command explanation
- hover explanations for command segments
- doc snippets next to inputs
- history of executed commands
- saved presets or saved targets
- environment/context display
- version/status display
- pipeline chaining to future tools

Not every tool needs every feature, but every tool should feel like part of the same visual shell-IDE ecosystem.

## Safety guidance

Always distinguish between:

- read-only inspection
- reversible mutation
- destructive actions

Destructive actions should be clearly labeled and may require stronger confirmation UX.

Never invent flags, arguments, or workflows not supported by the inspected CLI/docs.

## Verification checklist

Before finishing:

1. Run the repo build and verify the tool compiles:

```bash path=null start=null
bun run build
```

2. Run relevant tests if present:

```bash path=null start=null
bun run test
```

3. Run lint/format checks:

```bash path=null start=null
bun run lint
```

4. Verify the new tool appears on the dashboard.
5. Verify the tool view renders correctly in `dist/index.html`.
6. Verify at least one read-only flow works through the service stub.
7. Confirm the output still works as a single self-contained file.

## Deliverable standard

A successful implementation means:

- the CLI was properly inspected
- the UI reflects real workflows from the tool
- the tool is integrated into the dashboard
- the architecture matches this repo's Stencil/Tailwind/single-file setup
- the code is easy to extend toward richer features like schema validation, doc-driven hints, and AI-assisted command building

## Notes for larger tools

For broad CLIs like `git`, `docker`, `gcloud`, `firebase`, or `awk`/`sed` ecosystems:

- do not try to expose everything at once
- identify the highest-value workflows first
- implement a coherent MVP
- keep raw mode available for unsupported operations
- leave room for follow-up expansion

If the requested tool is especially large or ambiguous, create a plan before implementing.
