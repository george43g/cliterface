---
name: add-cli-tool
description: Convert CLI tools into visual web-based GUIs for the Cliterface project. Use this skill when asked to add a new CLI tool GUI (e.g., "add jq support", "create docker GUI"), migrate an existing tool prototype to the Stencil architecture, or extend Cliterface with a new tool. Outputs a single self-contained HTML file (dist/index.html) with inlined JS/CSS, built with Stencil v4, Tailwind CSS v4, esbuild, and Bun.
---

# Add CLI Tool

Convert CLI tools into practical, task-oriented web GUIs for Cliterface.

## Parameters

- `cmd` (string, required): The CLI command name (e.g., `jq`, `git`, `docker`, `firebase`, `yabai`)

## Procedure

### 1. Inspect the CLI Tool

Do not launch interactive pagers. Use stdout-only commands:

```bash
env MANPAGER=cat man {{cmd}} | col -b
{{cmd}} --help
{{cmd}} --version
{{cmd}} <subcommand> --help
```

Identify:
- Main modes of operation and common workflows
- Subcommands, flags, and parameter patterns
- Query vs. mutating commands vs. destructive operations
- Output formats (JSON, text, etc.)

### 2. Infer GUI Structure

Translate CLI concepts into GUI affordances:
- **Query/Inspect**: Green buttons, filters/inputs.
- **Actions**: Blue buttons, grouped by task.
- **Destructive**: Red buttons with confirmation.
- **Config**: Dropdowns, toggles, input+button pairs.
- **Raw mode**: Escape hatch with command input field.

### 3. Create Service Module

Create `src/{{cmd}}/{{cmd}}-service.ts`:

```typescript
export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export async function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB - replace with actual native bridge
  console.log('[executeCommand]', cmd);
  return { stdout: 'Mock output', exitCode: 0 };
}

export const {{cmd}} = {
  async query(args: string): Promise<CommandResult> {
    return executeCommand(`{{cmd}} query ${args}`);
  },
};
```

### 4. Create Stencil Component

Create `src/components/{{cmd}}-gui/{{cmd}}-gui.tsx`:

```typescript
import { Component, h, State } from '@stencil/core';
import { executeCommand } from '../../{{cmd}}/{{cmd}}-service';

@Component({
  tag: '{{cmd}}-gui',
  styleUrl: '{{cmd}}-gui.css',
  scoped: true,
})
export class {{cmd}}Gui {
  @State() lastCommand = 'Ready...';
  @State() output = 'Click any button to execute.';

  async executeCmd(cmd: string, confirm = false): Promise<void> {
    if (confirm && !window.confirm(`Execute: ${cmd}?`)) return;
    this.lastCommand = cmd;
    const result = await executeCommand(cmd);
    this.output = result.stdout;
  }

  render() {
    return (
      <div class="pb-16">
        <h1 class="text-3xl mb-5">{{cmd}} GUI</h1>
        {/* Use cli-card, cli-btn, cli-input, cli-select */}
        <div class="cli-card mt-5">
          <div class="cli-cmd-preview">{this.lastCommand}</div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }
}
```

Create layout-only CSS `src/components/{{cmd}}-gui/{{cmd}}-gui.css`:

```css
:host { display: block; width: 100%; }
```

### 5. Add to Dashboard

Edit `src/components/app-dashboard/app-dashboard.tsx`:
1. Add to `tools` array.
2. Add `<{{cmd}}-gui />` case to `renderToolInterface()`.

### 6. Apply Tailwind Styling

Apply Tailwind utilities and global `cli-*` classes (defined in `src/global/input.css`):
- `.cli-card`, `.cli-btn`, `.cli-btn-success`, `.cli-btn-warning`, `.cli-btn-danger`
- `.cli-tab`, `.cli-tab-active`, `.cli-input`, `.cli-select`
- `.cli-output`, `.cli-cmd-preview`, `.cli-badge-sip`, `.cli-badge-safe`

### 7. Build and Verify

Execute `bun run build`.
Verify `dist/index.html` loads locally and rendering/logic works without errors.

## Constraints & Pitfalls

- **Single-file output:** Ensure all assets inline into `dist/index.html`. Do not use dynamic imports (`import()`) or lazy loading.
- **No Shadow DOM:** Use `scoped: true` in Stencil to allow Tailwind classes to apply.
- **Function Replacement:** Always use function replacement for `String.replace()` to avoid `$&` token issues in minified JS (e.g., `html.replace('</body>', () => replacement)`).
- **Stay Faithful to CLI:** Do not invent unsupported flags. Implement only what the CLI supports.

## Output Quality Checklist

- [ ] CLI properly inspected via stdout (man page, help, examples)
- [ ] GUI reflects real workflows (not just flag list)
- [ ] Safe/mutating/destructive visually distinguished
- [ ] Command preview visible before execution
- [ ] Integrated into dashboard
- [ ] Builds successfully and works from `file://`
