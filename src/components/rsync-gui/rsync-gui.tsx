import { Component, h, State } from '@stencil/core';
import { describeOptions, getCommandIntent, RSYNC_PRESETS, validatePath, validateSizeString } from '../../rsync/rsync-command-builders';
import { buildRsyncCommand, type RsyncOptions, rsyncService } from '../../rsync/rsync-service';

const TAB_DEFINITIONS = [
  { id: 'builder', label: 'Builder' },
  { id: 'presets', label: 'Presets' },
  { id: 'filters', label: 'Filters' },
  { id: 'network', label: 'Network' },
  { id: 'dryrun', label: 'Dry Run' },
];

const DEFAULT_OPTS: RsyncOptions = {
  source: '',
  destination: '',
  archive: true,
  verbose: true,
  humanReadable: true,
  progress2: false,
  stats: false,
  compress: false,
  partialProgress: false,
  inplace: false,
  wholeFile: false,
  dryRun: false,
  delete: false,
  deleteAfter: false,
  deleteExcluded: false,
  removeSourceFiles: false,
  rsh: '',
  bwlimit: '',
  excludes: [],
  includes: [],
  excludeFrom: '',
  includeFrom: '',
  filesFrom: '',
  filterRules: [],
  backup: false,
  backupDir: '',
  suffix: '',
  linkDest: '',
  maxSize: '',
  minSize: '',
  append: false,
  appendVerify: false,
  checksum: false,
};

@Component({
  tag: 'rsync-gui',
  styleUrl: 'rsync-gui.css',
  scoped: true,
})
export class RsyncGui {
  @State() activeTab = 'builder';
  @State() opts: RsyncOptions = { ...DEFAULT_OPTS };
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() output = 'Build a command and click Execute (or try Dry Run first).';
  @State() lastCommand = 'rsync --help';

  // Filter tab scratch state
  @State() newExclude = '';
  @State() newInclude = '';
  @State() newFilterRule = '';

  // Validation messages
  @State() sourceError = '';
  @State() destError = '';
  @State() maxSizeError = '';
  @State() minSizeError = '';

  // Confirm state for destructive ops
  @State() pendingDestructive = false;

  private get commandIntent(): 'danger' | 'sync' | 'query' {
    return getCommandIntent(this.opts);
  }

  private get commandPreview(): string {
    if (!this.opts.source && !this.opts.destination) {
      return 'rsync [options] <source> <destination>';
    }
    const safe: RsyncOptions = {
      ...this.opts,
      source: this.opts.source || '<source>',
      destination: this.opts.destination || '<destination>',
    };
    return buildRsyncCommand(safe);
  }

  private setOpts(patch: Partial<RsyncOptions>): void {
    this.opts = { ...this.opts, ...patch };
  }

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2500);
    }
  }

  private validatePaths(): boolean {
    const sv = validatePath(this.opts.source);
    const dv = validatePath(this.opts.destination);
    this.sourceError = sv.message ?? '';
    this.destError = dv.message ?? '';
    return sv.valid && dv.valid;
  }

  private validateSizes(): boolean {
    const maxV = validateSizeString(this.opts.maxSize ?? '');
    const minV = validateSizeString(this.opts.minSize ?? '');
    this.maxSizeError = maxV.message ?? '';
    this.minSizeError = minV.message ?? '';
    return maxV.valid && minV.valid;
  }

  async executeCommand(forceDryRun = false): Promise<void> {
    if (!this.validatePaths() || !this.validateSizes()) return;

    const isDestructive = this.opts.delete || this.opts.deleteAfter || this.opts.deleteExcluded || this.opts.removeSourceFiles;
    if (isDestructive && !forceDryRun && !this.pendingDestructive) {
      this.pendingDestructive = true;
      return;
    }
    this.pendingDestructive = false;

    const runOpts: RsyncOptions = forceDryRun ? { ...this.opts, dryRun: true } : { ...this.opts };
    const cmd = buildRsyncCommand(runOpts);
    this.lastCommand = cmd;
    this.status = 'running';
    this.output = 'Running...';
    this.statusMessage = 'Running...';

    try {
      const result = await rsyncService.execute(cmd);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || JSON.stringify(result, null, 2);
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  cancelDestructive(): void {
    this.pendingDestructive = false;
  }

  loadPreset(presetId: string): void {
    const preset = RSYNC_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    this.opts = {
      ...DEFAULT_OPTS,
      ...preset.options,
      source: this.opts.source,
      destination: this.opts.destination,
    };
    this.setTemporaryStatus(`Preset "${preset.name}" loaded`);
  }

  async copyCommand(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.commandPreview);
    this.setTemporaryStatus('Command copied!');
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Output copied!');
  }

  resetAll(): void {
    this.opts = { ...DEFAULT_OPTS };
    this.output = 'Build a command and click Execute (or try Dry Run first).';
    this.lastCommand = 'rsync --help';
    this.status = 'idle';
    this.statusMessage = 'Ready';
    this.sourceError = '';
    this.destError = '';
    this.maxSizeError = '';
    this.minSizeError = '';
    this.pendingDestructive = false;
  }

  addExclude(): void {
    if (!this.newExclude.trim()) return;
    this.setOpts({ excludes: [...(this.opts.excludes ?? []), this.newExclude.trim()] });
    this.newExclude = '';
  }

  removeExclude(i: number): void {
    this.setOpts({ excludes: (this.opts.excludes ?? []).filter((_, idx) => idx !== i) });
  }

  addInclude(): void {
    if (!this.newInclude.trim()) return;
    this.setOpts({ includes: [...(this.opts.includes ?? []), this.newInclude.trim()] });
    this.newInclude = '';
  }

  removeInclude(i: number): void {
    this.setOpts({ includes: (this.opts.includes ?? []).filter((_, idx) => idx !== i) });
  }

  addFilterRule(): void {
    if (!this.newFilterRule.trim()) return;
    this.setOpts({ filterRules: [...(this.opts.filterRules ?? []), this.newFilterRule.trim()] });
    this.newFilterRule = '';
  }

  removeFilterRule(i: number): void {
    this.setOpts({ filterRules: (this.opts.filterRules ?? []).filter((_, idx) => idx !== i) });
  }

  renderCommandPreview() {
    const intent = this.commandIntent;
    const intentLabel = intent === 'danger' ? 'DESTRUCTIVE' : intent === 'query' ? 'DRY RUN' : 'SYNC';
    const badgeClass = intent === 'danger' ? 'cli-badge-danger' : intent === 'query' ? 'cli-badge-safe' : 'cli-badge-info';

    return (
      <div
        class={`cli-cmd-preview rsync-preview-${intent}`}
        style={{ borderLeftColor: intent === 'danger' ? 'var(--color-danger)' : intent === 'query' ? 'var(--color-success)' : 'var(--color-info)' }}
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-text2 text-xs">Command</span>
          <span class={badgeClass}>{intentLabel}</span>
          <button type="button" class="cli-btn cli-btn-sm ml-auto" onClick={() => this.copyCommand()}>
            Copy
          </button>
        </div>
        <code class="text-sm break-all">{this.commandPreview}</code>
      </div>
    );
  }

  renderDestructiveConfirm() {
    if (!this.pendingDestructive) return null;
    return (
      <div class="rsync-confirm-overlay">
        <div class="rsync-confirm-box">
          <div class="text-danger text-lg font-bold mb-2">Destructive Operation Warning</div>
          <p class="text-text2 text-sm mb-3">
            This command includes flags that can permanently delete or move files (<code>--delete</code>, <code>--delete-after</code>, <code>--delete-excluded</code>, or{' '}
            <code>--remove-source-files</code>). Are you sure?
          </p>
          <div class="flex gap-3">
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.executeCommand(false)}>
              Yes, execute (destructive)
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeCommand(true)}>
              Execute as dry run instead
            </button>
            <button type="button" class="cli-btn" onClick={() => this.cancelDestructive()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderOutputPanel() {
    return (
      <div class="cli-card">
        <div class="flex items-center justify-between mb-2">
          <span class="text-text2 text-sm">
            Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2'}>{this.statusMessage}</span>
          </span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
            Copy output
          </button>
        </div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderBuilderTab() {
    const archiveChecked = this.opts.archive ?? false;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Source / Destination */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Source &amp; Destination</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Source
              <input
                type="text"
                class={`cli-input w-full font-mono ${this.sourceError ? 'cli-input-invalid' : ''}`}
                placeholder="/local/path/  or  user@host:/remote/"
                value={this.opts.source}
                onInput={(e: Event) => {
                  this.setOpts({ source: (e.target as HTMLInputElement).value });
                  this.sourceError = '';
                }}
              />
              {this.sourceError && <span class="cli-validation-message invalid">{this.sourceError}</span>}
              <span class="text-xs text-text2">
                Trailing slash <code>/</code> = sync <em>contents</em>; no slash = sync the <em>directory itself</em>
              </span>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Destination
              <input
                type="text"
                class={`cli-input w-full font-mono ${this.destError ? 'cli-input-invalid' : ''}`}
                placeholder="/local/dest/  or  user@host:/remote/dest/"
                value={this.opts.destination}
                onInput={(e: Event) => {
                  this.setOpts({ destination: (e.target as HTMLInputElement).value });
                  this.destError = '';
                }}
              />
              {this.destError && <span class="cli-validation-message invalid">{this.destError}</span>}
            </label>
          </div>

          {/* Trailing-slash visual hint */}
          <div class="mt-3 p-3 rounded-lg bg-bg3 text-xs text-text2">
            <strong class="text-text">Trailing-slash semantics: </strong>
            <code class="text-success">src/</code> → copies <em>contents</em> of src into dest &nbsp;|&nbsp;
            <code class="text-warning">src</code> → copies the <em>directory src itself</em> into dest
          </div>
        </div>

        {/* Mode */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Mode Flags</h3>
          <label class="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={archiveChecked} onChange={(e: Event) => this.setOpts({ archive: (e.target as HTMLInputElement).checked })} />
            <span class="font-medium">-a archive</span>
            <span class="text-text2 text-xs">(= -rlptgoD)</span>
          </label>
          {!archiveChecked && (
            <div class="grid grid-cols-2 gap-2 ml-4">
              {(
                [
                  { key: 'recursive', flag: '-r', label: 'recursive' },
                  { key: 'links', flag: '-l', label: 'symlinks' },
                  { key: 'perms', flag: '-p', label: 'perms' },
                  { key: 'times', flag: '-t', label: 'times' },
                  { key: 'group', flag: '-g', label: 'group' },
                  { key: 'owner', flag: '-o', label: 'owner' },
                  { key: 'devices', flag: '-D', label: 'devices' },
                ] as Array<{ key: keyof RsyncOptions; flag: string; label: string }>
              ).map(item => (
                <label key={item.key} class="flex items-center gap-2 text-sm text-text2">
                  <input type="checkbox" checked={!!this.opts[item.key]} onChange={(e: Event) => this.setOpts({ [item.key]: (e.target as HTMLInputElement).checked })} />
                  <code>{item.flag}</code> {item.label}
                </label>
              ))}
            </div>
          )}

          <div class="mt-4 border-t border-bg3 pt-4">
            <h4 class="text-text2 text-xs uppercase mb-2">Transfer Behaviour</h4>
            <div class="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'compress', flag: '-z', label: 'compress' },
                  { key: 'partialProgress', flag: '-P', label: 'partial+progress' },
                  { key: 'inplace', flag: '--inplace', label: 'in-place write' },
                  { key: 'wholeFile', flag: '-W', label: 'whole-file' },
                  { key: 'append', flag: '--append', label: 'append' },
                  { key: 'appendVerify', flag: '--append-verify', label: 'append+verify' },
                  { key: 'checksum', flag: '-c', label: 'checksum diff' },
                ] as Array<{ key: keyof RsyncOptions; flag: string; label: string }>
              ).map(item => (
                <label key={item.key} class="flex items-center gap-2 text-sm text-text2">
                  <input type="checkbox" checked={!!this.opts[item.key]} onChange={(e: Event) => this.setOpts({ [item.key]: (e.target as HTMLInputElement).checked })} />
                  <code>{item.flag}</code> {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Display + Size Limits */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Display &amp; Output</h3>
          <div class="grid grid-cols-2 gap-2 mb-4">
            {(
              [
                { key: 'verbose', flag: '-v', label: 'verbose' },
                { key: 'humanReadable', flag: '-h', label: 'human readable' },
                { key: 'progress2', flag: '--info=progress2', label: 'progress bar' },
                { key: 'stats', flag: '--stats', label: 'stats summary' },
              ] as Array<{ key: keyof RsyncOptions; flag: string; label: string }>
            ).map(item => (
              <label key={item.key} class="flex items-center gap-2 text-sm text-text2">
                <input type="checkbox" checked={!!this.opts[item.key]} onChange={(e: Event) => this.setOpts({ [item.key]: (e.target as HTMLInputElement).checked })} />
                <code>{item.flag}</code> {item.label}
              </label>
            ))}
          </div>

          <h4 class="text-text2 text-xs uppercase mb-2">Size Limits</h4>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max size
              <input
                type="text"
                class={`cli-input ${this.maxSizeError ? 'cli-input-invalid' : ''}`}
                placeholder="e.g. 100M"
                value={this.opts.maxSize ?? ''}
                onInput={(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  this.setOpts({ maxSize: v });
                  this.maxSizeError = validateSizeString(v).message ?? '';
                }}
              />
              {this.maxSizeError && <span class="cli-validation-message invalid">{this.maxSizeError}</span>}
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Min size
              <input
                type="text"
                class={`cli-input ${this.minSizeError ? 'cli-input-invalid' : ''}`}
                placeholder="e.g. 1K"
                value={this.opts.minSize ?? ''}
                onInput={(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  this.setOpts({ minSize: v });
                  this.minSizeError = validateSizeString(v).message ?? '';
                }}
              />
              {this.minSizeError && <span class="cli-validation-message invalid">{this.minSizeError}</span>}
            </label>
          </div>

          <h4 class="text-text2 text-xs uppercase mb-2 mt-4">Backup</h4>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.opts.backup ?? false} onChange={(e: Event) => this.setOpts({ backup: (e.target as HTMLInputElement).checked })} />
              <code>--backup</code>
            </label>
          </div>
          {this.opts.backup && (
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Backup dir
                <input
                  type="text"
                  class="cli-input"
                  placeholder="../backups/"
                  value={this.opts.backupDir ?? ''}
                  onInput={(e: Event) => this.setOpts({ backupDir: (e.target as HTMLInputElement).value })}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Suffix
                <input
                  type="text"
                  class="cli-input"
                  placeholder=".bak"
                  value={this.opts.suffix ?? ''}
                  onInput={(e: Event) => this.setOpts({ suffix: (e.target as HTMLInputElement).value })}
                />
              </label>
            </div>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mt-3">
            Hard-link dest (<code>--link-dest</code>)
            <input
              type="text"
              class="cli-input"
              placeholder="../latest"
              value={this.opts.linkDest ?? ''}
              onInput={(e: Event) => this.setOpts({ linkDest: (e.target as HTMLInputElement).value })}
            />
          </label>
        </div>

        {/* Destructive options */}
        <div class="cli-card xl:col-span-2 border border-danger/30">
          <h3 class="text-danger text-base mb-3">Destructive Options (use with caution)</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={this.opts.delete ?? false}
                onChange={(e: Event) => this.setOpts({ delete: (e.target as HTMLInputElement).checked, deleteAfter: false })}
              />
              <code class="text-danger">--delete</code>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={this.opts.deleteAfter ?? false}
                onChange={(e: Event) => this.setOpts({ deleteAfter: (e.target as HTMLInputElement).checked, delete: false })}
              />
              <code class="text-danger">--delete-after</code>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={this.opts.deleteExcluded ?? false}
                onChange={(e: Event) => this.setOpts({ deleteExcluded: (e.target as HTMLInputElement).checked })}
              />
              <code class="text-danger">--delete-excluded</code>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={this.opts.removeSourceFiles ?? false}
                onChange={(e: Event) => this.setOpts({ removeSourceFiles: (e.target as HTMLInputElement).checked })}
              />
              <code class="text-danger">--remove-source-files</code>
            </label>
          </div>
          {(this.opts.delete || this.opts.deleteAfter || this.opts.deleteExcluded || this.opts.removeSourceFiles) && (
            <div class="mt-3 p-2 rounded bg-danger/10 text-danger text-xs">Destructive flags active — execution will require confirmation.</div>
          )}
        </div>

        {/* Command preview + Execute */}
        <div class="cli-card xl:col-span-2">
          {this.renderCommandPreview()}
          <div class="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              class={`cli-btn ${this.commandIntent === 'danger' ? 'cli-btn-danger' : this.commandIntent === 'query' ? 'cli-btn-success' : 'cli-btn-info'}`}
              onClick={() => this.executeCommand()}
            >
              {this.commandIntent === 'query' ? 'Execute (Dry Run)' : this.commandIntent === 'danger' ? 'Execute (Destructive)' : 'Execute'}
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeCommand(true)}>
              Dry Run Preview
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.resetAll()}>
              Reset All
            </button>
          </div>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  renderPresetsTab() {
    const categories = ['sync', 'backup', 'transfer', 'resume'] as const;
    return (
      <div class="grid grid-cols-1 gap-5">
        {categories.map(cat => {
          const presets = RSYNC_PRESETS.filter(p => p.category === cat);
          if (presets.length === 0) return null;
          return (
            <div key={cat} class="cli-card">
              <h3 class="text-text2 text-base mb-3 capitalize">{cat}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {presets.map(preset => {
                  const btnClass = preset.intent === 'danger' ? 'cli-btn cli-btn-danger' : preset.intent === 'query' ? 'cli-btn cli-btn-success' : 'cli-btn';
                  const notes = describeOptions(preset.options);
                  return (
                    <div key={preset.id} class="rsync-preset-card">
                      <div class="font-medium mb-1">{preset.name}</div>
                      <p class="text-xs text-text2 mb-2">{preset.description}</p>
                      {notes.length > 0 && (
                        <ul class="text-xs text-text2 list-disc pl-4 mb-2 space-y-1">
                          {notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        class={`${btnClass} cli-btn-sm w-full`}
                        onClick={() => {
                          this.loadPreset(preset.id);
                          this.activeTab = 'builder';
                        }}
                      >
                        Load preset
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Current command</h3>
          {this.renderCommandPreview()}
        </div>
      </div>
    );
  }

  renderFiltersTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Exclude patterns */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Exclude patterns (<code>--exclude</code>)
          </h3>
          <div class="flex gap-2 mb-3">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="*.log, .git/, tmp/"
              value={this.newExclude}
              onInput={(e: Event) => {
                this.newExclude = (e.target as HTMLInputElement).value;
              }}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.addExclude();
              }}
            />
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.addExclude()}>
              Add
            </button>
          </div>
          {(this.opts.excludes ?? []).length > 0 && (
            <div class="flex flex-wrap gap-2">
              {(this.opts.excludes ?? []).map((ex, i) => (
                <span key={i} class="inline-flex items-center gap-1 px-2 py-1 bg-bg3 rounded text-sm font-mono">
                  {ex}
                  <button type="button" class="text-danger ml-1" onClick={() => this.removeExclude(i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div class="mt-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              <code>--exclude-from</code> file
              <input
                type="text"
                class="cli-input font-mono"
                placeholder=".rsyncignore"
                value={this.opts.excludeFrom ?? ''}
                onInput={(e: Event) => this.setOpts({ excludeFrom: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>
        </div>

        {/* Include patterns */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Include patterns (<code>--include</code>)
          </h3>
          <div class="flex gap-2 mb-3">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="*.ts, src/"
              value={this.newInclude}
              onInput={(e: Event) => {
                this.newInclude = (e.target as HTMLInputElement).value;
              }}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.addInclude();
              }}
            />
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.addInclude()}>
              Add
            </button>
          </div>
          {(this.opts.includes ?? []).length > 0 && (
            <div class="flex flex-wrap gap-2">
              {(this.opts.includes ?? []).map((inc, i) => (
                <span key={i} class="inline-flex items-center gap-1 px-2 py-1 bg-bg3 rounded text-sm font-mono text-success">
                  {inc}
                  <button type="button" class="text-danger ml-1" onClick={() => this.removeInclude(i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div class="mt-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              <code>--include-from</code> file
              <input
                type="text"
                class="cli-input font-mono"
                placeholder="/path/to/includes.txt"
                value={this.opts.includeFrom ?? ''}
                onInput={(e: Event) => this.setOpts({ includeFrom: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>

          <div class="mt-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              <code>--files-from</code> (explicit file list)
              <input
                type="text"
                class="cli-input font-mono"
                placeholder="/path/to/filelist.txt"
                value={this.opts.filesFrom ?? ''}
                onInput={(e: Event) => this.setOpts({ filesFrom: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>
        </div>

        {/* Filter rules */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">
            Filter rules (<code>--filter</code>)
          </h3>
          <p class="text-text2 text-xs mb-3">
            rsync filter rules: <code>+ pattern</code> = include, <code>- pattern</code> = exclude,
            <code>: .rsync-filter</code> = merge per-dir filter, <code>H pattern</code> = hide.
          </p>
          <div class="flex gap-2 mb-3">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="- *.log  or  + important.log"
              value={this.newFilterRule}
              onInput={(e: Event) => {
                this.newFilterRule = (e.target as HTMLInputElement).value;
              }}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.addFilterRule();
              }}
            />
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.addFilterRule()}>
              Add
            </button>
          </div>
          {(this.opts.filterRules ?? []).length > 0 && (
            <div class="space-y-1">
              {(this.opts.filterRules ?? []).map((rule, i) => (
                <div key={i} class="flex items-center gap-2 p-2 bg-bg3 rounded font-mono text-sm">
                  <span class="flex-1">{rule}</span>
                  <button type="button" class="text-danger" onClick={() => this.removeFilterRule(i)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  renderNetworkTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Remote Shell (<code>-e</code> / <code>--rsh</code>)
          </h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Shell expression
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="ssh  or  ssh -p 2222 -i ~/.ssh/key"
              value={this.opts.rsh ?? ''}
              onInput={(e: Event) => this.setOpts({ rsh: (e.target as HTMLInputElement).value })}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            {[
              { label: 'ssh (default)', value: 'ssh' },
              { label: 'ssh -p 2222', value: 'ssh -p 2222' },
              { label: 'ssh -i ~/.ssh/id_rsa', value: 'ssh -i ~/.ssh/id_rsa' },
              { label: 'ssh -C (compress)', value: 'ssh -C' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                class={`cli-btn cli-btn-sm ${this.opts.rsh === opt.value ? 'cli-btn-info' : ''}`}
                onClick={() => this.setOpts({ rsh: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Bandwidth Limit (<code>--bwlimit</code>)
          </h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Limit (KB/s)
            <input
              type="text"
              class="cli-input font-mono"
              placeholder="1024"
              value={this.opts.bwlimit ?? ''}
              onInput={(e: Event) => this.setOpts({ bwlimit: (e.target as HTMLInputElement).value })}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            {['256', '512', '1024', '5120', '10240'].map(v => (
              <button key={v} type="button" class={`cli-btn cli-btn-sm ${this.opts.bwlimit === v ? 'cli-btn-info' : ''}`} onClick={() => this.setOpts({ bwlimit: v })}>
                {v} KB/s
              </button>
            ))}
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.setOpts({ bwlimit: '' })}>
              Unlimited
            </button>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-2">Current command</h3>
          {this.renderCommandPreview()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  renderDryRunTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card border border-success/30">
          <h3 class="text-success text-base mb-2">
            Dry Run Mode (<code>-n</code> / <code>--dry-run</code>)
          </h3>
          <p class="text-text2 text-sm mb-4">
            A dry run performs all checks and logs what <em>would</em> happen, but never writes or deletes anything. Always run a dry run before executing a destructive sync.
          </p>

          <div class="mb-4">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={this.opts.dryRun ?? false} onChange={(e: Event) => this.setOpts({ dryRun: (e.target as HTMLInputElement).checked })} />
              <span>
                Enable dry run (<code>-n</code>) globally
              </span>
            </label>
          </div>

          {this.renderCommandPreview()}

          <div class="flex flex-wrap gap-3 mt-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeCommand(true)}>
              Execute Dry Run
            </button>
            <button type="button" class={`cli-btn ${this.commandIntent === 'danger' ? 'cli-btn-danger' : 'cli-btn-info'}`} onClick={() => this.executeCommand()}>
              Execute Real Sync
            </button>
          </div>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        {this.renderDestructiveConfirm()}

        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🔄</span> rsync GUI
          </h2>
          <p class="text-text2 text-sm">Fast incremental file sync — rich command builder with profile presets</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">
          {TAB_DEFINITIONS.map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
              onClick={() => {
                this.activeTab = tab.id;
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div class="tab-content">
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'presets' && this.renderPresetsTab()}
          {this.activeTab === 'filters' && this.renderFiltersTab()}
          {this.activeTab === 'network' && this.renderNetworkTab()}
          {this.activeTab === 'dryrun' && this.renderDryRunTab()}
        </div>
      </div>
    );
  }
}
