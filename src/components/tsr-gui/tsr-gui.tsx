import { Component, h, State } from '@stencil/core';
import { getTsrManPage, tsrEntryPointPresets } from '../../tsr/tsr-documentation';
import { buildTsrCommand, type TsrOptions, tsrService } from '../../tsr/tsr-service';

const TAB_DEFINITIONS = [
  { id: 'scan', label: 'Scan' },
  { id: 'apply', label: 'Apply' },
  { id: 'config', label: 'Config' },
  { id: 'docs', label: 'Docs' },
];

@Component({
  tag: 'tsr-gui',
  styleUrl: 'tsr-gui.css',
  scoped: true,
})
export class TsrGui {
  @State() activeTab = 'scan';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'Ready...';
  @State() output = 'Configure entry points and click Scan to find unused TypeScript code.';

  // Entry points
  @State() entryPoints: string[] = [];
  @State() newEntryPoint = '';
  @State() entryPointError = '';

  // Options
  @State() projectPath = '';
  @State() recursive = false;
  @State() includeDTs = false;

  // Config tab additions
  @State() presetIndex = 0;

  private buildOptions(write: boolean): TsrOptions {
    const opts: TsrOptions = { write };
    if (this.projectPath.trim()) opts.project = this.projectPath.trim();
    if (this.recursive) opts.recursive = true;
    if (this.includeDTs) opts.includeDTs = true;
    return opts;
  }

  private buildPreview(write: boolean): string {
    if (this.entryPoints.length === 0) {
      return `tsr ${write ? '--write ' : ''}<entryPoint>`;
    }
    return buildTsrCommand(this.entryPoints, this.buildOptions(write));
  }

  private validateEntryPoint(pattern: string): string {
    if (!pattern.trim()) return 'Pattern cannot be empty';
    try {
      new RegExp(pattern);
      return '';
    } catch {
      return 'Invalid regular expression';
    }
  }

  addEntryPoint(): void {
    const err = this.validateEntryPoint(this.newEntryPoint);
    if (err) {
      this.entryPointError = err;
      return;
    }
    if (this.entryPoints.includes(this.newEntryPoint.trim())) {
      this.entryPointError = 'Pattern already added';
      return;
    }
    this.entryPoints = [...this.entryPoints, this.newEntryPoint.trim()];
    this.newEntryPoint = '';
    this.entryPointError = '';
  }

  removeEntryPoint(index: number): void {
    this.entryPoints = this.entryPoints.filter((_, i) => i !== index);
  }

  loadPreset(pattern: string): void {
    if (!pattern) return;
    const err = this.validateEntryPoint(pattern);
    if (err) return;
    if (!this.entryPoints.includes(pattern)) {
      this.entryPoints = [...this.entryPoints, pattern];
    }
  }

  clearOutput(): void {
    this.output = 'Configure entry points and click Scan to find unused TypeScript code.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(this.output);
    const prev = this.statusMessage;
    this.statusMessage = 'Copied!';
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = prev;
      }, 1800);
    }
  }

  async runScan(): Promise<void> {
    if (this.entryPoints.length === 0) {
      this.output = 'Error: add at least one entry point pattern before scanning.';
      this.status = 'error';
      this.statusMessage = 'No entry points';
      return;
    }

    this.status = 'running';
    this.statusMessage = 'Scanning…';
    const opts = this.buildOptions(false);
    this.lastCommand = buildTsrCommand(this.entryPoints, opts);
    this.output = 'Scanning for unused TypeScript code…';

    try {
      const result = await tsrService.scan(this.entryPoints, opts);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Scan complete' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async runApply(): Promise<void> {
    if (this.entryPoints.length === 0) {
      this.output = 'Error: add at least one entry point pattern before applying.';
      this.status = 'error';
      this.statusMessage = 'No entry points';
      return;
    }

    const cmd = buildTsrCommand(this.entryPoints, this.buildOptions(true));

    if (
      typeof window === 'undefined' ||
      !window.confirm(`This will PERMANENTLY modify your TypeScript files.\n\nCommand:\n${cmd}\n\nMake sure you have committed your changes first.\n\nProceed?`)
    ) {
      return;
    }

    this.status = 'running';
    this.statusMessage = 'Applying…';
    this.lastCommand = cmd;
    this.output = 'Removing unused TypeScript code…';

    try {
      const result = await tsrService.apply(this.entryPoints, this.buildOptions(true));
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output — nothing to remove, or all changes applied silently)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Apply complete' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  // ─── Shared sub-renders ────────────────────────────────────────────────────

  renderEntryPointsCard(forApply = false) {
    return (
      <div class="cli-card">
        <h3 class="text-text2 text-base mb-3">Entry Points (regex patterns)</h3>

        <div class="flex gap-2 mb-2">
          <input
            type="text"
            class={`cli-input flex-1 font-mono ${this.entryPointError ? 'cli-input-invalid' : ''}`}
            placeholder="e.g. src/index\\.ts$"
            value={this.newEntryPoint}
            onInput={(e: Event) => {
              this.newEntryPoint = (e.target as HTMLInputElement).value;
              this.entryPointError = '';
            }}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') this.addEntryPoint();
            }}
          />
          <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.addEntryPoint()}>
            Add
          </button>
        </div>

        {this.entryPointError && <p class="cli-validation-message invalid mb-2">{this.entryPointError}</p>}

        {this.entryPoints.length > 0 ? (
          <div class="flex flex-wrap gap-2 mb-3">
            {this.entryPoints.map((ep, i) => (
              <span key={i} class="entry-point-tag">
                <span>{ep}</span>
                <button type="button" title="Remove" onClick={() => this.removeEntryPoint(i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p class="text-text2 text-sm mb-3">No entry points added yet. Add at least one.</p>
        )}

        <div class="mt-2">
          <p class="text-xs text-text2 block mb-1">Quick presets</p>
          <div class="flex flex-wrap gap-2">
            {tsrEntryPointPresets
              .filter(p => p.pattern)
              .map((preset, i) => (
                <button key={i} type="button" class="cli-btn cli-btn-sm" title={preset.description} onClick={() => this.loadPreset(preset.pattern)}>
                  {preset.label}
                </button>
              ))}
          </div>
        </div>

        {forApply && (
          <div class="destructive-banner mt-4">
            <strong>Warning:</strong> Apply mode permanently modifies files on disk. Commit your work before running.
          </div>
        )}

        {!forApply && <div class="scan-banner mt-4">Scan is read-only — no files are modified.</div>}
      </div>
    );
  }

  renderOutputCard() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-warning' : 'text-text2';

    return (
      <div class="cli-card">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-text2 text-base">
            Status: <span class={statusColor}>{this.statusMessage}</span>
          </h3>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>

        <div class="cli-cmd-preview">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────

  renderScanTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="flex flex-col gap-5">
          {this.renderEntryPointsCard(false)}

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Command Preview</h3>
            <div class="cli-cmd-preview font-mono">{this.buildPreview(false)}</div>
            <div class="flex flex-wrap gap-2 mt-4">
              <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runScan()} disabled={this.status === 'running'}>
                {this.status === 'running' ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>
        </div>

        {this.renderOutputCard()}
      </div>
    );
  }

  renderApplyTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="flex flex-col gap-5">
          {this.renderEntryPointsCard(true)}

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Command Preview</h3>
            <div class="cli-cmd-preview font-mono">{this.buildPreview(true)}</div>
            <div class="flex flex-wrap gap-2 mt-4">
              <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.runApply()} disabled={this.status === 'running'}>
                {this.status === 'running' ? 'Applying…' : 'Apply (--write)'}
              </button>
              <span class="text-xs text-danger self-center">Destructive — modifies files</span>
            </div>
          </div>
        </div>

        {this.renderOutputCard()}
      </div>
    );
  }

  renderConfigTab() {
    const scanPreview = this.buildPreview(false);
    const applyPreview = this.buildPreview(true);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="flex flex-col gap-5">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-4">Project Settings</h3>

            <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
              tsconfig.json path
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="tsconfig.json (default)"
                value={this.projectPath}
                onInput={(e: Event) => {
                  this.projectPath = (e.target as HTMLInputElement).value;
                }}
              />
              <span class="text-xs">Leave blank to use tsconfig.json in the project root</span>
            </label>

            <div class="flex flex-col gap-3">
              <label class="flex items-center gap-3 text-sm text-text2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={this.recursive}
                  onChange={(e: Event) => {
                    this.recursive = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span>
                  <strong>--recursive</strong> — run multiple passes until no more unused code is found
                </span>
              </label>

              <label class="flex items-center gap-3 text-sm text-text2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={this.includeDTs}
                  onChange={(e: Event) => {
                    this.includeDTs = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span>
                  <strong>--include-d-ts</strong> — also check <code>.d.ts</code> declaration files
                </span>
              </label>
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Entry Points</h3>
            {this.renderEntryPointsCard(false)}
          </div>
        </div>

        <div class="flex flex-col gap-5">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Generated Commands</h3>

            <p class="text-xs text-text2 uppercase tracking-wide block mb-1">Scan (read-only)</p>
            <div class="cli-cmd-preview mb-4">{scanPreview}</div>

            <p class="text-xs text-danger uppercase tracking-wide block mb-1">Apply (--write, destructive)</p>
            <div class="cli-cmd-preview">{applyPreview}</div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Safety Checklist</h3>
            <ul class="text-sm text-text2 space-y-2 list-none">
              <li>
                ☑ Run <strong>Scan</strong> first to understand impact
              </li>
              <li>☑ Commit all pending changes before applying</li>
              <li>☑ Verify entry points cover all public API roots</li>
              <li>☑ Add test-file patterns as entry points to avoid deletion</li>
              <li>
                ☑ Use <strong>--recursive</strong> only when you want cascaded cleanup
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  renderDocsTab() {
    const man = getTsrManPage();
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{man.name}</h2>
          <p class="text-text2 text-sm mb-2 font-mono">{man.synopsis}</p>
          <p class="text-sm mb-5">{man.description}</p>

          {man.sections.map((section, i) => (
            <div key={i} class="mb-5">
              <h3 class="text-base font-semibold text-accent mb-2">{section.title}</h3>
              <pre class="cli-output text-sm">{section.content}</pre>
            </div>
          ))}

          <div class="mt-4">
            <h3 class="text-base font-semibold text-accent mb-3">Examples</h3>
            <div class="space-y-2">
              {man.examples.map((ex, i) => (
                <div key={i} class="flex flex-col sm:flex-row gap-2 items-start p-3 bg-bg3 rounded-lg">
                  <code class="font-mono text-sm text-success flex-1 whitespace-pre-wrap">{ex.command}</code>
                  <span class="text-text2 text-sm sm:text-right sm:max-w-xs">{ex.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Root render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🩺</span> tsr GUI
            <span class="text-sm font-normal text-text2">ts-remove-unused</span>
          </h2>
          <p class="text-text2 text-sm">TypeScript dead-code remover — find and remove unused exports, declarations, and files</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex gap-1">
          {TAB_DEFINITIONS.map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''} ${tab.id === 'apply' ? 'text-danger' : ''}`}
              onClick={() => {
                this.activeTab = tab.id;
              }}
            >
              {tab.label}
              {tab.id === 'apply' && <span class="ml-1 text-xs opacity-70">⚠</span>}
            </button>
          ))}
        </div>

        <div class="tab-content">
          {this.activeTab === 'scan' && this.renderScanTab()}
          {this.activeTab === 'apply' && this.renderApplyTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
        </div>
      </div>
    );
  }
}
