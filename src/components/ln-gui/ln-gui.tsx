import { Component, h, State } from '@stencil/core';
import { buildLnCommandFromInput, LN_PRESETS, type LnInput, validateLnInput } from '../../ln/ln-command-builders';
import { LN_COMPANIONS, LN_FLAGS, LN_PITFALLS } from '../../ln/ln-documentation';
import { type CommandResult, lnService } from '../../ln/ln-service';
import { type CommandSegment, parseCommandIntoSegments } from '../../utils/command-builder';

const TAB_DEFINITIONS = [
  { id: 'builder', label: 'Builder' },
  { id: 'explainer', label: 'Symlink vs Hard Link' },
  { id: 'pitfalls', label: 'Pitfalls' },
  { id: 'companions', label: 'Companion Commands' },
];

type TabId = 'builder' | 'explainer' | 'pitfalls' | 'companions';

@Component({
  tag: 'ln-gui',
  styleUrl: 'ln-gui.css',
  scoped: true,
})
export class LnGui {
  @State() activeTab: TabId = 'builder';

  // Builder state
  @State() source = '';
  @State() target = '';
  @State() linkType: 'symbolic' | 'hard' = 'symbolic';
  @State() optForce = false;
  @State() optInteractive = false;
  @State() optNoDeref = false;
  @State() optVerbose = false;
  @State() optPhysical = false;

  // Execution state
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() output = 'Configure a link above and click Create Link.';
  @State() statusMessage = 'Ready';
  @State() validationErrors: string[] = [];

  // Command preview segments
  @State() commandSegments: CommandSegment[] = [];
  @State() highlightedSegment: number | null = null;

  // Confirm-force dialog
  @State() showForceConfirm = false;
  @State() pendingCmd = '';

  // Companion commands output
  @State() companionOutput = '';
  @State() companionStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';

  componentWillLoad() {
    this.rebuildPreview();
  }

  private getCurrentInput(): Partial<LnInput> {
    return {
      source: this.source,
      target: this.target,
      linkType: this.linkType,
      force: this.optForce,
      interactive: this.optInteractive,
      noDeref: this.optNoDeref,
      verbose: this.optVerbose,
      physical: this.optPhysical,
    };
  }

  private rebuildPreview() {
    const input = this.getCurrentInput();
    const validation = validateLnInput(input);
    if (validation.success) {
      const cmd = buildLnCommandFromInput(validation.data);
      this.commandSegments = parseCommandIntoSegments(cmd);
      this.validationErrors = [];
    } else {
      // Build a partial preview even if invalid
      const partialCmd = `ln${this.linkType === 'symbolic' ? ' -s' : ''}${this.optForce ? 'f' : ''} ${this.source || '<source>'} ${this.target || '<target>'}`;
      this.commandSegments = parseCommandIntoSegments(partialCmd);
      this.validationErrors = 'errors' in validation ? (validation.errors as string[]) : [];
    }
  }

  private setTemporaryStatus(message: string, resetTo = 'Ready') {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  async createLink(confirmed = false): Promise<void> {
    const validation = validateLnInput(this.getCurrentInput());
    if (!validation.success) {
      this.validationErrors = (validation as { success: false; errors: string[] }).errors;
      return;
    }

    const cmd = buildLnCommandFromInput(validation.data);

    // Force flag + existing target: show confirm dialog
    if (this.optForce && !confirmed) {
      this.pendingCmd = cmd;
      this.showForceConfirm = true;
      return;
    }

    this.showForceConfirm = false;
    this.status = 'running';
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      const result: CommandResult = await lnService.createLink({
        source: validation.data.source,
        target: validation.data.target,
        options: {
          linkType: validation.data.linkType,
          force: validation.data.force,
          interactive: validation.data.interactive,
          noDeref: validation.data.noDeref,
          verbose: validation.data.verbose,
          physical: validation.data.physical,
        },
      });
      this.handleResult(result);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  confirmForce(): void {
    void this.createLink(true);
  }

  cancelForce(): void {
    this.showForceConfirm = false;
    this.pendingCmd = '';
  }

  private handleResult(result: CommandResult) {
    const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
    this.output = parts.join('\n\n') || (result.exitCode === 0 ? '(success — no output)' : `Exit code ${result.exitCode}`);
    this.status = result.exitCode === 0 ? 'success' : 'error';
    this.statusMessage = result.exitCode === 0 ? 'Done' : `Failed (exit ${result.exitCode})`;
  }

  async runCompanion(kind: 'readlink' | 'realpath' | 'unlink', path: string): Promise<void> {
    if (!path.trim()) {
      this.companionOutput = 'Enter a path above first.';
      return;
    }
    this.companionStatus = 'running';
    this.companionOutput = 'Running...';
    try {
      let result: CommandResult;
      if (kind === 'readlink') result = await lnService.readlink(path);
      else if (kind === 'realpath') result = await lnService.realpath(path);
      else result = await lnService.unlink(path);

      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.companionOutput = parts.join('\n\n') || '(no output)';
      this.companionStatus = result.exitCode === 0 ? 'success' : 'error';
    } catch (err) {
      this.companionOutput = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.companionStatus = 'error';
    }
  }

  loadPreset(preset: (typeof LN_PRESETS)[0]): void {
    this.source = preset.source;
    this.target = preset.target;
    this.linkType = preset.linkType;
    this.optForce = preset.force ?? false;
    this.optNoDeref = preset.noDeref ?? false;
    this.optVerbose = preset.verbose ?? false;
    this.optInteractive = false;
    this.optPhysical = false;
    this.rebuildPreview();
    this.setTemporaryStatus('Preset loaded');
  }

  clearOutput(): void {
    this.output = 'Configure a link above and click Create Link.';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied!');
  }

  // ── Rendering helpers ──────────────────────────────────────────────────────

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button
        key={tab.id}
        type="button"
        class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
        onClick={() => {
          this.activeTab = tab.id as TabId;
        }}
      >
        {tab.label}
      </button>
    ));
  }

  renderCommandPreview() {
    return (
      <div class="cli-cmd-preview">
        {this.commandSegments.map((seg, i) => (
          <span
            key={i}
            role="tooltip"
            class={`cmd-segment cmd-segment-${seg.type} ${this.highlightedSegment === i ? 'cmd-segment-highlight' : ''}`}
            title={seg.description}
            onMouseEnter={() => {
              this.highlightedSegment = i;
            }}
            onMouseLeave={() => {
              this.highlightedSegment = null;
            }}
          >
            {seg.text}
          </span>
        ))}
      </div>
    );
  }

  renderForceConfirm() {
    if (!this.showForceConfirm) return null;
    return (
      <div class="force-confirm-overlay">
        <div class="force-confirm-box">
          <h3 class="text-danger text-lg font-semibold mb-2">Destructive operation — confirm</h3>
          <p class="text-sm text-text2 mb-3">
            The <code>-f</code> flag will silently remove any existing file or link at <strong>{this.target}</strong> before creating the new link.
          </p>
          <pre class="cli-cmd-preview mb-4 text-xs">{this.pendingCmd}</pre>
          <div class="flex gap-3">
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.confirmForce()}>
              Yes, overwrite
            </button>
            <button type="button" class="cli-btn" onClick={() => this.cancelForce()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Builder ───────────────────────────────────────────────────────────

  renderBuilderTab() {
    const isSymlink = this.linkType === 'symbolic';

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Left column: inputs ── */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Link Configuration</h3>

          {/* Link type selector */}
          <div class="mb-4">
            <span class="text-sm text-text2 block mb-2">Link Type</span>
            <div class="flex gap-2">
              <button
                type="button"
                class={`link-type-btn ${this.linkType === 'symbolic' ? 'link-type-btn-active' : ''}`}
                onClick={() => {
                  this.linkType = 'symbolic';
                  this.optPhysical = false;
                  this.rebuildPreview();
                }}
              >
                🔗 Symbolic (soft)
              </button>
              <button
                type="button"
                class={`link-type-btn ${this.linkType === 'hard' ? 'link-type-btn-active link-type-btn-hard' : ''}`}
                onClick={() => {
                  this.linkType = 'hard';
                  this.rebuildPreview();
                }}
              >
                ⛓ Hard link
              </button>
            </div>
          </div>

          {/* Source */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Source (existing file/directory)
            <input
              type="text"
              class={`cli-input w-full font-mono ${this.source && this.validationErrors.some(e => e.startsWith('source')) ? 'cli-input-invalid' : ''}`}
              placeholder="/path/to/existing/file"
              value={this.source}
              onInput={(e: Event) => {
                this.source = (e.target as HTMLInputElement).value;
                this.rebuildPreview();
              }}
            />
          </label>

          {/* Target */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Target (link name / destination path)
            <input
              type="text"
              class={`cli-input w-full font-mono ${this.target && this.validationErrors.some(e => e.startsWith('target')) ? 'cli-input-invalid' : ''}`}
              placeholder="/path/to/link-name"
              value={this.target}
              onInput={(e: Event) => {
                this.target = (e.target as HTMLInputElement).value;
                this.rebuildPreview();
              }}
            />
            <span class="text-xs text-text2">Same argument order as cp: source first, link name second.</span>
          </label>

          {/* Flags */}
          <div class="mb-4">
            <span class="text-sm text-text2 block mb-2">Flags</span>
            <div class="grid grid-cols-2 gap-2">
              <label class="flag-checkbox">
                <input
                  type="checkbox"
                  checked={this.optForce}
                  onChange={(e: Event) => {
                    this.optForce = (e.target as HTMLInputElement).checked;
                    if (this.optForce) this.optInteractive = false;
                    this.rebuildPreview();
                  }}
                />
                <span class="text-danger font-medium">-f Force</span>
                <span class="text-xs text-text2">overwrite target</span>
              </label>
              <label class="flag-checkbox">
                <input
                  type="checkbox"
                  checked={this.optInteractive}
                  onChange={(e: Event) => {
                    this.optInteractive = (e.target as HTMLInputElement).checked;
                    if (this.optInteractive) this.optForce = false;
                    this.rebuildPreview();
                  }}
                />
                <span>-i Interactive</span>
                <span class="text-xs text-text2">prompt before overwrite</span>
              </label>
              <label class="flag-checkbox">
                <input
                  type="checkbox"
                  checked={this.optNoDeref}
                  onChange={(e: Event) => {
                    this.optNoDeref = (e.target as HTMLInputElement).checked;
                    this.rebuildPreview();
                  }}
                />
                <span>-h No-deref</span>
                <span class="text-xs text-text2">don't follow target symlink</span>
              </label>
              <label class="flag-checkbox">
                <input
                  type="checkbox"
                  checked={this.optVerbose}
                  onChange={(e: Event) => {
                    this.optVerbose = (e.target as HTMLInputElement).checked;
                    this.rebuildPreview();
                  }}
                />
                <span>-v Verbose</span>
                <span class="text-xs text-text2">show files as processed</span>
              </label>
              {!isSymlink && (
                <label class="flag-checkbox">
                  <input
                    type="checkbox"
                    checked={this.optPhysical}
                    onChange={(e: Event) => {
                      this.optPhysical = (e.target as HTMLInputElement).checked;
                      this.rebuildPreview();
                    }}
                  />
                  <span>-P Physical</span>
                  <span class="text-xs text-text2">hard link to symlink itself</span>
                </label>
              )}
            </div>
          </div>

          {/* Presets */}
          <div class="mb-4">
            <span class="text-sm text-text2 block mb-2">Quick Presets</span>
            <div class="flex flex-wrap gap-2">
              {LN_PRESETS.map((preset, i) => (
                <button key={i} type="button" class="cli-btn cli-btn-sm" title={preset.description} onClick={() => this.loadPreset(preset)}>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Validation errors */}
          {this.validationErrors.length > 0 && (
            <div class="validation-errors mb-3">
              {this.validationErrors.map((err, i) => (
                <p key={i} class="cli-validation-message invalid">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class={`cli-btn ${this.optForce ? 'cli-btn-danger' : 'cli-btn-success'}`}
              disabled={this.status === 'running' || this.validationErrors.length > 0}
              onClick={() => void this.createLink()}
            >
              {this.optForce ? '⚠ Create Link (force)' : 'Create Link'}
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>

        {/* ── Right column: preview + output ── */}
        <div class="flex flex-col gap-5">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            {this.renderCommandPreview()}
            <div class="mt-3 text-sm">
              Status:{' '}
              <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-warning' : ''}>
                {this.statusMessage}
              </span>
            </div>
          </div>

          {/* Visual diagram */}
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Visual Diagram</h3>
            {this.renderDiagram(isSymlink)}
          </div>

          <div class="cli-card">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-text2 text-base">Output</h3>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => void this.copyOutput()}>
                Copy
              </button>
            </div>
            <pre class={`cli-output ${this.status === 'error' ? 'output-error' : this.status === 'success' ? 'output-success' : ''}`}>{this.output}</pre>
          </div>
        </div>

        {this.renderForceConfirm()}
      </div>
    );
  }

  renderDiagram(isSymlink: boolean) {
    const src = this.source || '/path/to/source';
    const tgt = this.target || '/path/to/link';

    if (isSymlink) {
      return (
        <svg class="link-diagram" viewBox="0 0 420 120" aria-label="Symbolic link diagram">
          {/* Disk storage box */}
          <rect x="10" y="30" width="120" height="60" rx="8" class="diagram-box diagram-inode" />
          <text x="70" y="55" text-anchor="middle" class="diagram-label">
            Inode / Data
          </text>
          <text x="70" y="72" text-anchor="middle" class="diagram-sublabel">
            {src.split('/').pop()}
          </text>

          {/* Arrow from symlink → path pointer → inode */}
          <rect x="190" y="30" width="120" height="60" rx="8" class="diagram-box diagram-symlink" />
          <text x="250" y="55" text-anchor="middle" class="diagram-label">
            Symlink entry
          </text>
          <text x="250" y="72" text-anchor="middle" class="diagram-sublabel">
            {tgt.split('/').pop()}
          </text>

          {/* Path pointer label */}
          <text x="165" y="25" text-anchor="middle" class="diagram-pointer-label">
            stores path →
          </text>

          {/* Arrow */}
          <line x1="190" y1="60" x2="140" y2="60" class="diagram-arrow-line" />
          <polygon points="140,55 130,60 140,65" class="diagram-arrow-head-symlink" />

          {/* Dashed boundary for symlink file itself */}
          <rect x="175" y="15" width="150" height="90" rx="10" class="diagram-dashed" />
          <text x="250" y="115" text-anchor="middle" class="diagram-sublabel">
            link file on disk
          </text>

          {/* Source label */}
          <text x="70" y="105" text-anchor="middle" class="diagram-sublabel">
            target file
          </text>
        </svg>
      );
    }

    // Hard link diagram
    return (
      <svg class="link-diagram" viewBox="0 0 420 120" aria-label="Hard link diagram">
        {/* Shared inode box */}
        <rect x="155" y="25" width="110" height="70" rx="8" class="diagram-box diagram-inode" />
        <text x="210" y="55" text-anchor="middle" class="diagram-label">
          Shared Inode
        </text>
        <text x="210" y="72" text-anchor="middle" class="diagram-sublabel">
          same data
        </text>

        {/* Name A */}
        <rect x="10" y="40" width="110" height="40" rx="6" class="diagram-box diagram-hard" />
        <text x="65" y="65" text-anchor="middle" class="diagram-label">
          {src.split('/').pop() || 'name-a'}
        </text>

        {/* Name B */}
        <rect x="300" y="40" width="110" height="40" rx="6" class="diagram-box diagram-hard" />
        <text x="355" y="65" text-anchor="middle" class="diagram-label">
          {tgt.split('/').pop() || 'name-b'}
        </text>

        {/* Arrows */}
        <line x1="120" y1="60" x2="155" y2="60" class="diagram-arrow-line" />
        <polygon points="155,55 165,60 155,65" class="diagram-arrow-head-hard" />

        <line x1="300" y1="60" x2="265" y2="60" class="diagram-arrow-line" />
        <polygon points="265,55 255,60 265,65" class="diagram-arrow-head-hard" />

        <text x="65" y="105" text-anchor="middle" class="diagram-sublabel">
          directory entry
        </text>
        <text x="355" y="105" text-anchor="middle" class="diagram-sublabel">
          directory entry
        </text>
      </svg>
    );
  }

  // ── Tab: Explainer ─────────────────────────────────────────────────────────

  renderExplainerTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Symbolic link card */}
        <div class="cli-card">
          <h3 class="text-lg font-semibold mb-1 text-info">
            Symbolic (Soft) Link <code class="text-sm font-mono">ln -s</code>
          </h3>
          <p class="text-text2 text-sm mb-4">A symlink is a special file that contains a path string pointing to another file or directory. The OS follows the path at runtime.</p>

          <svg class="link-diagram mb-4" viewBox="0 0 380 130" aria-label="Symlink structure">
            <rect x="10" y="30" width="120" height="65" rx="8" class="diagram-box diagram-inode" />
            <text x="70" y="55" text-anchor="middle" class="diagram-label">
              Inode #42
            </text>
            <text x="70" y="72" text-anchor="middle" class="diagram-sublabel">
              actual data
            </text>
            <text x="70" y="88" text-anchor="middle" class="diagram-sublabel">
              permissions, owner…
            </text>

            <rect x="200" y="30" width="140" height="65" rx="8" class="diagram-box diagram-symlink" />
            <text x="270" y="52" text-anchor="middle" class="diagram-label">
              Symlink Inode #77
            </text>
            <text x="270" y="68" text-anchor="middle" class="diagram-sublabel">
              type: symlink
            </text>
            <text x="270" y="84" text-anchor="middle" class="diagram-sublabel">
              data: "/path/to/target"
            </text>

            <line x1="200" y1="62" x2="140" y2="62" class="diagram-arrow-line" />
            <polygon points="140,57 130,62 140,67" class="diagram-arrow-head-symlink" />
            <text x="170" y="55" text-anchor="middle" class="diagram-pointer-label">
              resolves →
            </text>
          </svg>

          <ul class="text-sm space-y-2">
            <li class="flex gap-2">
              <span class="text-success">✓</span> Can cross filesystem boundaries
            </li>
            <li class="flex gap-2">
              <span class="text-success">✓</span> Can link to directories
            </li>
            <li class="flex gap-2">
              <span class="text-success">✓</span> Link survives target deletion (but becomes dangling)
            </li>
            <li class="flex gap-2">
              <span class="text-success">✓</span> <code>ls -l</code> shows the link path
            </li>
            <li class="flex gap-2">
              <span class="text-danger">✗</span> Breaks if the target is moved/deleted
            </li>
            <li class="flex gap-2">
              <span class="text-danger">✗</span> Slight overhead: OS must resolve the path
            </li>
          </ul>

          <div class="mt-4 p-3 bg-bg3 rounded-lg">
            <p class="text-xs font-mono text-text2 mb-1">Example:</p>
            <code class="text-sm">ln -s /usr/local/bin/python3.12 /usr/local/bin/python</code>
          </div>
        </div>

        {/* Hard link card */}
        <div class="cli-card">
          <h3 class="text-lg font-semibold mb-1 text-warning">
            Hard Link <code class="text-sm font-mono">ln</code>
          </h3>
          <p class="text-text2 text-sm mb-4">
            A hard link is an additional directory entry pointing to the same inode (and thus the same data blocks) as the original file. Both names are completely equal.
          </p>

          <svg class="link-diagram mb-4" viewBox="0 0 380 130" aria-label="Hard link structure">
            <rect x="130" y="25" width="120" height="80" rx="8" class="diagram-box diagram-inode" />
            <text x="190" y="50" text-anchor="middle" class="diagram-label">
              Inode #42
            </text>
            <text x="190" y="67" text-anchor="middle" class="diagram-sublabel">
              data blocks
            </text>
            <text x="190" y="83" text-anchor="middle" class="diagram-sublabel">
              nlink: 2
            </text>

            <rect x="10" y="45" width="90" height="40" rx="6" class="diagram-box diagram-hard" />
            <text x="55" y="70" text-anchor="middle" class="diagram-label">
              file-a
            </text>

            <rect x="280" y="45" width="90" height="40" rx="6" class="diagram-box diagram-hard" />
            <text x="325" y="70" text-anchor="middle" class="diagram-label">
              file-b
            </text>

            <line x1="100" y1="65" x2="130" y2="65" class="diagram-arrow-line" />
            <polygon points="130,60 140,65 130,70" class="diagram-arrow-head-hard" />

            <line x1="280" y1="65" x2="250" y2="65" class="diagram-arrow-line" />
            <polygon points="250,60 240,65 250,70" class="diagram-arrow-head-hard" />

            <text x="55" y="110" text-anchor="middle" class="diagram-sublabel">
              dir entry
            </text>
            <text x="325" y="110" text-anchor="middle" class="diagram-sublabel">
              dir entry
            </text>
          </svg>

          <ul class="text-sm space-y-2">
            <li class="flex gap-2">
              <span class="text-success">✓</span> No dangling links — data persists until all links removed
            </li>
            <li class="flex gap-2">
              <span class="text-success">✓</span> Zero overhead: same inode, same permissions
            </li>
            <li class="flex gap-2">
              <span class="text-success">✓</span> Indistinguishable from original in <code>ls</code>
            </li>
            <li class="flex gap-2">
              <span class="text-danger">✗</span> Cannot cross filesystem boundaries
            </li>
            <li class="flex gap-2">
              <span class="text-danger">✗</span> Cannot link to directories (normally)
            </li>
            <li class="flex gap-2">
              <span class="text-danger">✗</span> Changes to either name affect both
            </li>
          </ul>

          <div class="mt-4 p-3 bg-bg3 rounded-lg">
            <p class="text-xs font-mono text-text2 mb-1">Example:</p>
            <code class="text-sm">ln /usr/local/bin/node-v20.11.0 /usr/local/bin/node</code>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Quick Reference</h3>
          <div class="overflow-x-auto">
            <table class="comparison-table w-full text-sm">
              <thead>
                <tr>
                  <th class="text-left py-2 pr-4">Property</th>
                  <th class="text-info py-2 pr-4">Symbolic</th>
                  <th class="text-warning py-2">Hard</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Cross-filesystem', 'Yes', 'No'],
                  ['Links directories', 'Yes', 'No (normally)'],
                  ['Breaks when target deleted', 'Yes (dangling)', 'No'],
                  ['Own inode', 'Yes (different)', 'No (shared)'],
                  ['Visible in ls -l', 'Shows path', 'Normal file'],
                  ['GNU -r / --relative flag', 'Yes (GNU only)', 'N/A'],
                ].map(([prop, sym, hard], i) => (
                  <tr key={i} class={i % 2 === 0 ? 'row-even' : ''}>
                    <td class="py-2 pr-4 text-text2">{prop}</td>
                    <td class="py-2 pr-4 text-info">{sym}</td>
                    <td class="py-2 text-warning">{hard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Pitfalls ──────────────────────────────────────────────────────────

  renderPitfallsTab() {
    return (
      <div class="grid grid-cols-1 gap-4">
        {LN_PITFALLS.map((pitfall, i) => (
          <div key={i} class="cli-card pitfall-card">
            <h3 class="font-semibold mb-2 text-warning">
              <span class="mr-2">⚠</span>
              {pitfall.title}
            </h3>
            <p class="text-sm text-text2 mb-3">{pitfall.description}</p>
            {pitfall.example && (
              <div class="mb-2">
                <span class="text-xs text-text2 block mb-1">Example:</span>
                <code class="block p-2 bg-bg3 rounded text-sm font-mono">{pitfall.example}</code>
              </div>
            )}
            {pitfall.fix && (
              <div class="fix-box">
                <span class="text-xs text-success font-medium block mb-1">Fix:</span>
                <p class="text-sm">{pitfall.fix}</p>
              </div>
            )}
          </div>
        ))}

        {/* Flag quick reference */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Flag Reference</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LN_FLAGS.map((flag, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex items-center gap-2 mb-1">
                  <code class="font-mono font-bold text-accent">{flag.flag}</code>
                  <span class="font-medium">{flag.title}</span>
                  {flag.destructive && <span class="cli-badge-sip">destructive</span>}
                  {flag.symbolicOnly && <span class="cli-badge-info">symlink only</span>}
                  {flag.hardOnly && <span class="cli-badge-info">hard only</span>}
                </div>
                <p class="text-sm text-text2">{flag.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Companion Commands ────────────────────────────────────────────────

  renderCompanionsTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        {LN_COMPANIONS.map((cmd, i) => {
          let companionInputRef: HTMLInputElement | null = null;
          return (
            <div key={i} class="cli-card">
              <div class="flex items-center gap-3 mb-2">
                <code class="text-accent font-mono font-bold text-lg">{cmd.name}</code>
                <code class="text-text2 text-sm">{cmd.synopsis}</code>
              </div>
              <p class="text-sm text-text2 mb-3">{cmd.description}</p>

              <div class="mb-3">
                <span class="text-xs text-text2 block mb-1">Examples:</span>
                {cmd.examples.map((ex, j) => (
                  <code key={j} class="block p-2 bg-bg3 rounded text-sm font-mono mb-1">
                    {ex}
                  </code>
                ))}
              </div>

              <div class="flex gap-2 items-center">
                <input
                  type="text"
                  class="cli-input flex-1 font-mono"
                  placeholder={`Path for ${cmd.name}…`}
                  ref={el => {
                    companionInputRef = el as HTMLInputElement;
                  }}
                />
                <button
                  type="button"
                  class={`cli-btn cli-btn-sm ${cmd.name === 'unlink' ? 'cli-btn-danger' : 'cli-btn-success'}`}
                  onClick={() => {
                    const path = companionInputRef?.value ?? '';
                    void this.runCompanion(cmd.name as 'readlink' | 'realpath' | 'unlink', path);
                  }}
                >
                  Run {cmd.name}
                </button>
              </div>
            </div>
          );
        })}

        {/* Shared output for companion commands */}
        <div class="cli-card">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-text2 text-base">Companion Output</h3>
            <span class={`text-sm ${this.companionStatus === 'error' ? 'text-danger' : this.companionStatus === 'success' ? 'text-success' : 'text-text2'}`}>
              {this.companionStatus === 'running' ? 'Running…' : this.companionStatus}
            </span>
          </div>
          <pre class="cli-output">{this.companionOutput || 'Run a companion command above to see output.'}</pre>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🪢</span> ln GUI
          </h2>
          <p class="text-text2 text-sm">Symbolic &amp; hard links — visual builder and reference</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'explainer' && this.renderExplainerTab()}
          {this.activeTab === 'pitfalls' && this.renderPitfallsTab()}
          {this.activeTab === 'companions' && this.renderCompanionsTab()}
        </div>
      </div>
    );
  }
}
