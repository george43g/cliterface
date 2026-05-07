import { Component, Event, type EventEmitter, h, State } from '@stencil/core';
import { PS_CHEAT, PS_FIELDS_REFERENCE, PS_STATES } from '../../ps/ps-documentation';
import {
  buildPsFilterCommand,
  buildPsListCommand,
  buildPsSortCommand,
  buildPsTreeCommand,
  type CommandResult,
  FORMAT_PRESETS,
  isValidPidList,
  type PsListOptions,
  psService,
  type SortColumn,
  VALID_SORT_COLUMNS,
} from '../../ps/ps-service';

const TAB_DEFINITIONS = [
  { id: 'list', label: 'List' },
  { id: 'filter', label: 'Filter' },
  { id: 'tree', label: 'Tree' },
  { id: 'sort-format', label: 'Sort / Format' },
  { id: 'cheatsheet', label: 'Cheatsheet' },
];

type CommandStatus = 'idle' | 'running' | 'success' | 'error';

@Component({
  tag: 'ps-gui',
  styleUrl: 'ps-gui.css',
  scoped: true,
})
export class PsGui {
  // ── Shared state ───────────────────────────────────────────────────────
  @State() activeTab = 'list';
  @State() status: CommandStatus = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select options and click Execute to query processes.';
  @State() statusMessage = 'Ready';

  // ── List tab state ─────────────────────────────────────────────────────
  @State() listMode: PsListOptions['mode'] = 'bsd-aux';
  @State() listUser = '';
  @State() listPids = '';
  @State() listPidsError = '';
  @State() listThreads = false;
  @State() listWide = false;

  // ── Filter tab state ───────────────────────────────────────────────────
  @State() filterUser = '';
  @State() filterPids = '';
  @State() filterPidsError = '';
  @State() filterCommand = '';
  @State() filterState = '';

  // ── Tree tab state ─────────────────────────────────────────────────────
  // (no state needed beyond output panel)

  // ── Sort / Format tab state ────────────────────────────────────────────
  @State() sortFormatPreset = 'default';
  @State() sortFormatFields = 'pid,user,%cpu,%mem,rss,vsz,comm';
  @State() sortBy: SortColumn = '%cpu';
  @State() sortDesc = true;
  @State() sortWide = false;

  @Event() commandExecuted: EventEmitter<CommandResult>;

  // ── Helpers ────────────────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private async runCommand(cmd: string): Promise<void> {
    this.lastCommand = cmd;
    this.status = 'running';
    this.output = 'Executing…';
    this.statusMessage = 'Running…';

    try {
      const result = await psService.custom(cmd);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
      this.commandExecuted.emit(result);
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private clearOutput(): void {
    this.output = 'Select options and click Execute to query processes.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied to clipboard');
  }

  // ── List tab ────────────────────────────────────────────────────────────

  private buildListPreview(): string {
    return buildPsListCommand({
      mode: this.listMode,
      user: this.listUser || undefined,
      pids: this.listPids || undefined,
      threads: this.listThreads,
      wideOutput: this.listWide,
    });
  }

  private executeList(): void {
    if (this.listPids && !isValidPidList(this.listPids)) {
      this.listPidsError = 'PIDs must be positive integers, comma-separated';
      return;
    }
    this.listPidsError = '';
    this.runCommand(this.buildListPreview());
  }

  private renderListTab() {
    const preview = this.buildListPreview();

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">List Processes</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Mode
            <select
              class="cli-select"
              onChange={e => {
                this.listMode = (e.target as HTMLSelectElement).value as PsListOptions['mode'];
              }}
            >
              <option value="bsd-aux" selected={this.listMode === 'bsd-aux'}>
                BSD — ps aux (all, with stats)
              </option>
              <option value="posix-ef" selected={this.listMode === 'posix-ef'}>
                POSIX/GNU — ps -ef (all, full format)
              </option>
              <option value="posix-A" selected={this.listMode === 'posix-A'}>
                POSIX — ps -A (all processes)
              </option>
              <option value="own" selected={this.listMode === 'own'}>
                Own processes only — ps
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Filter by user (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. root, george"
              value={this.listUser}
              onInput={e => {
                this.listUser = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Filter by PID(s) (optional, comma-separated)
            <input
              type="text"
              class={`cli-input w-full ${this.listPidsError ? 'cli-input-invalid' : ''}`}
              placeholder="e.g. 1, 42, 8192"
              value={this.listPids}
              onInput={e => {
                this.listPids = (e.target as HTMLInputElement).value;
                this.listPidsError = '';
              }}
            />
            {this.listPidsError && <span class="cli-validation-message invalid">{this.listPidsError}</span>}
          </label>

          <div class="flex flex-wrap gap-4 mb-5">
            <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
              <input
                type="checkbox"
                checked={this.listThreads}
                onChange={e => {
                  this.listThreads = (e.target as HTMLInputElement).checked;
                }}
              />
              Show threads (-M)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
              <input
                type="checkbox"
                checked={this.listWide}
                onChange={e => {
                  this.listWide = (e.target as HTMLInputElement).checked;
                }}
              />
              Wide output (-w)
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeList()}>
              Execute
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                this.listMode = 'bsd-aux';
                this.listUser = '';
                this.listPids = '';
                this.listPidsError = '';
                this.listThreads = false;
                this.listWide = false;
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Quick Commands</h3>
          <div class="grid grid-cols-1 gap-2 mb-4">
            {[
              { label: 'All processes (BSD)', cmd: 'ps aux' },
              { label: 'All processes (POSIX)', cmd: 'ps -ef' },
              { label: 'Own processes', cmd: 'ps' },
              { label: 'High CPU (sorted)', cmd: 'ps aux -r' },
              { label: 'High memory (sorted)', cmd: 'ps aux -m' },
              { label: 'Full format', cmd: 'ps -f' },
              { label: 'With thread detail', cmd: 'ps aux -M' },
            ].map(item => (
              <button key={item.cmd} type="button" class="cli-btn cli-btn-sm text-left" onClick={() => this.runCommand(item.cmd)} title={item.cmd}>
                <span class="font-medium">{item.label}</span>
                <code class="ml-2 text-xs opacity-70">{item.cmd}</code>
              </button>
            ))}
          </div>

          <h4 class="text-text2 text-sm mb-2">Command Preview</h4>
          <div class="cli-cmd-preview font-mono text-sm break-all">{preview}</div>
        </div>
      </div>
    );
  }

  // ── Filter tab ──────────────────────────────────────────────────────────

  private buildFilterPreview(): string {
    return buildPsFilterCommand({
      user: this.filterUser || undefined,
      pids: this.filterPids || undefined,
      command: this.filterCommand || undefined,
      state: this.filterState || undefined,
    });
  }

  private executeFilter(): void {
    if (this.filterPids && !isValidPidList(this.filterPids)) {
      this.filterPidsError = 'PIDs must be positive integers, comma-separated';
      return;
    }
    this.filterPidsError = '';

    // If only PIDs specified, use -p directly
    if (this.filterPids && !this.filterUser && !this.filterCommand && !this.filterState) {
      const clean = this.filterPids
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(',');
      this.runCommand(`ps -p ${clean}`);
      return;
    }

    this.runCommand(this.buildFilterPreview());
  }

  private renderFilterTab() {
    const preview = this.buildFilterPreview();

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Filter Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            User name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. root"
              value={this.filterUser}
              onInput={e => {
                this.filterUser = (e.target as HTMLInputElement).value;
              }}
            />
            <span class="text-xs text-text2">Matches the USER column (grep, case-insensitive)</span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            PID(s) — comma-separated
            <input
              type="text"
              class={`cli-input w-full ${this.filterPidsError ? 'cli-input-invalid' : ''}`}
              placeholder="e.g. 1, 42, 8192"
              value={this.filterPids}
              onInput={e => {
                this.filterPids = (e.target as HTMLInputElement).value;
                this.filterPidsError = '';
              }}
            />
            {this.filterPidsError && <span class="cli-validation-message invalid">{this.filterPidsError}</span>}
            <span class="text-xs text-text2">Uses ps -p for direct PID lookup</span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Command name / keyword
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. node, python, Safari"
              value={this.filterCommand}
              onInput={e => {
                this.filterCommand = (e.target as HTMLInputElement).value;
              }}
            />
            <span class="text-xs text-text2">Greps the COMMAND column (case-insensitive)</span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-5">
            Process state
            <select
              class="cli-select"
              onChange={e => {
                this.filterState = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="" selected={this.filterState === ''}>
                Any state
              </option>
              {PS_STATES.map(s => (
                <option key={s.code} value={s.code} selected={this.filterState === s.code}>
                  {s.code} — {s.meaning}
                </option>
              ))}
            </select>
          </label>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeFilter()}>
              Execute
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                this.filterUser = '';
                this.filterPids = '';
                this.filterPidsError = '';
                this.filterCommand = '';
                this.filterState = '';
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Command Preview</h3>
          <div class="cli-cmd-preview font-mono text-sm break-all">{preview}</div>

          <h4 class="text-text2 text-sm mt-4 mb-2">Process States Reference</h4>
          <div class="space-y-1">
            {PS_STATES.map(s => (
              <div key={s.code} class="flex gap-3 text-sm">
                <code class="text-accent font-bold w-5 shrink-0">{s.code}</code>
                <span class="text-text2">{s.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tree tab ────────────────────────────────────────────────────────────

  private renderTreeTab() {
    const cmd = buildPsTreeCommand();

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Process Tree</h3>
          <p class="text-text2 text-sm mb-4">
            Visualise the process hierarchy. Uses <code>pstree</code> if available (install via Homebrew: <code>brew install pstree</code>), otherwise falls back to{' '}
            <code>ps -ef</code>.
          </p>

          <div class="cli-cmd-preview font-mono text-sm mb-5">{cmd}</div>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCommand(cmd)}>
              Run pstree
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runCommand('ps -ef')}>
              ps -ef (fallback)
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runCommand('ps -f')}>
              ps -f (own tree)
            </button>
          </div>

          <div class="p-3 bg-bg3 rounded-lg text-sm text-text2">
            <p class="font-medium mb-2">Real-time monitoring (separate tools):</p>
            <ul class="space-y-1 list-disc list-inside">
              <li>
                <code>top</code> — built-in, interactive process monitor
              </li>
              <li>
                <code>htop</code> — enhanced top (<code>brew install htop</code>)
              </li>
              <li>
                <code>btop</code> — modern resource monitor (<code>brew install btop</code>)
              </li>
            </ul>
            <p class="mt-2 text-xs">These run interactively in a terminal — not launachable from this GUI.</p>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Tree View Tips</h3>
          <div class="space-y-3">
            {[
              {
                cmd: 'pstree',
                description: 'Full tree of all processes (requires pstree)',
              },
              {
                cmd: 'pstree -p',
                description: 'Include PIDs in tree output',
              },
              {
                cmd: 'pstree -u',
                description: 'Show owning user beside each process',
              },
              {
                cmd: 'ps -ef | grep <name>',
                description: 'Find a process and see its PPID for manual tree traversal',
              },
              {
                cmd: 'ps -f -p $(pgrep node)',
                description: 'Full format for all node processes',
              },
            ].map(item => (
              <div key={item.cmd} class="p-2 bg-bg3 rounded">
                <div class="flex justify-between items-start gap-2">
                  <code class="text-sm text-accent">{item.cmd}</code>
                  <button type="button" class="cli-btn cli-btn-sm shrink-0" onClick={() => this.runCommand(item.cmd)}>
                    Run
                  </button>
                </div>
                <p class="text-xs text-text2 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Sort / Format tab ────────────────────────────────────────────────────

  private buildSortFormatPreview(): string {
    return buildPsSortCommand({
      fields: this.sortFormatFields,
      sortBy: this.sortBy,
      sortDesc: this.sortDesc,
      wideOutput: this.sortWide,
    });
  }

  private applyPreset(presetId: string): void {
    const preset = FORMAT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    this.sortFormatPreset = presetId;
    this.sortFormatFields = preset.fields;
  }

  private renderSortFormatTab() {
    const preview = this.buildSortFormatPreview();

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Output Format &amp; Sort</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Format Preset
            <select class="cli-select" onChange={e => this.applyPreset((e.target as HTMLSelectElement).value)}>
              {FORMAT_PRESETS.map(p => (
                <option key={p.id} value={p.id} selected={this.sortFormatPreset === p.id}>
                  {p.label}
                </option>
              ))}
              <option value="custom" selected={this.sortFormatPreset === 'custom'}>
                Custom…
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Output fields (<code>-o</code>)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g. pid,user,%cpu,%mem,comm"
              value={this.sortFormatFields}
              onInput={e => {
                this.sortFormatFields = (e.target as HTMLInputElement).value;
                this.sortFormatPreset = 'custom';
              }}
            />
            <span class="text-xs text-text2">Comma-separated field names (see Cheatsheet for full list)</span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Sort by
            <select
              class="cli-select"
              onChange={e => {
                this.sortBy = (e.target as HTMLSelectElement).value as SortColumn;
              }}
            >
              {VALID_SORT_COLUMNS.map(col => (
                <option key={col} value={col} selected={this.sortBy === col}>
                  {col}
                </option>
              ))}
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={this.sortDesc}
              onChange={e => {
                this.sortDesc = (e.target as HTMLInputElement).checked;
              }}
            />
            Descending order
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={this.sortWide}
              onChange={e => {
                this.sortWide = (e.target as HTMLInputElement).checked;
              }}
            />
            Wide output (-w, no column truncation)
          </label>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCommand(this.buildSortFormatPreview())}>
              Execute
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                this.sortFormatPreset = 'default';
                this.sortFormatFields = FORMAT_PRESETS[0].fields;
                this.sortBy = '%cpu';
                this.sortDesc = true;
                this.sortWide = false;
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Command Preview</h3>
          <div class="cli-cmd-preview font-mono text-sm break-all mb-5">{preview}</div>

          <h4 class="text-text2 text-sm mb-3">Format Presets</h4>
          <div class="space-y-2">
            {FORMAT_PRESETS.map(p => (
              <button
                key={p.id}
                type="button"
                class={`cli-btn cli-btn-sm w-full text-left ${this.sortFormatPreset === p.id ? 'cli-btn-info' : ''}`}
                onClick={() => this.applyPreset(p.id)}
              >
                <div class="font-medium">{p.label}</div>
                <code class="text-xs opacity-70">{p.fields}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Cheatsheet tab ──────────────────────────────────────────────────────

  private renderCheatsheetTab() {
    return (
      <div class="space-y-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">BSD vs GNU/POSIX Cross-Reference</h3>
          <p class="text-sm text-text2 mb-4">
            <code>ps</code> is famously inconsistent across platforms. macOS ships BSD ps; Linux ships GNU/procps ps. Flags without a dash are BSD-style; flags with a dash are
            POSIX-style.
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-bg3">
                  <th class="text-left py-2 px-3 text-text2">Goal</th>
                  <th class="text-left py-2 px-3 text-accent">BSD (macOS)</th>
                  <th class="text-left py-2 px-3 text-info">GNU (Linux)</th>
                  <th class="text-left py-2 px-3 text-success">POSIX</th>
                </tr>
              </thead>
              <tbody>
                {PS_CHEAT.map((row, i) => (
                  <tr key={i} class={`border-b border-bg3 ${i % 2 === 0 ? 'bg-bg3 bg-opacity-30' : ''}`}>
                    <td class="py-2 px-3 font-medium">{row.goal}</td>
                    <td class="py-2 px-3">
                      <code class="text-accent">{row.bsd}</code>
                    </td>
                    <td class="py-2 px-3">
                      <code class="text-info">{row.gnu}</code>
                    </td>
                    <td class="py-2 px-3">
                      <code class="text-success">{row.posix}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div class="mt-4 space-y-2">
            {PS_CHEAT.map((row, i) => (
              <details key={i} class="text-sm">
                <summary class="cursor-pointer text-text2 hover:text-text">{row.goal} — notes</summary>
                <p class="mt-1 ml-4 text-text2 text-xs">{row.notes}</p>
              </details>
            ))}
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Output Fields (-o)</h3>
            <div class="space-y-1">
              {PS_FIELDS_REFERENCE.map(f => (
                <div key={f.field} class="flex gap-3 text-sm">
                  <code class="text-accent font-mono w-16 shrink-0">{f.field}</code>
                  <span class="text-text2">{f.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Process States</h3>
            <div class="space-y-2 mb-5">
              {PS_STATES.map(s => (
                <div key={s.code} class="flex gap-3 text-sm">
                  <code class="text-accent font-bold w-5 shrink-0">{s.code}</code>
                  <span class="text-text2">{s.meaning}</span>
                </div>
              ))}
            </div>

            <h3 class="text-text2 text-base mb-3">Key Flag Summary</h3>
            <div class="space-y-1 text-sm">
              {[
                { flag: 'a', desc: "Other users' processes (BSD)" },
                { flag: 'u', desc: 'User-oriented format (BSD)' },
                { flag: 'x', desc: 'Include processes w/o tty (BSD)' },
                { flag: '-e / -A', desc: 'All processes (POSIX)' },
                { flag: '-f', desc: 'Full format' },
                { flag: '-o fields', desc: 'Custom output columns' },
                { flag: '-p pid', desc: 'Specific PIDs' },
                { flag: '-u user', desc: 'Specific user' },
                { flag: '-M', desc: 'Show threads (BSD)' },
                { flag: '-r', desc: 'Sort by CPU (BSD)' },
                { flag: '-m', desc: 'Sort by memory (BSD)' },
                { flag: '--sort=col', desc: 'Sort column (GNU)' },
                { flag: '--forest', desc: 'Tree view (GNU)' },
              ].map(item => (
                <div key={item.flag} class="flex gap-3">
                  <code class="text-accent font-mono w-24 shrink-0">{item.flag}</code>
                  <span class="text-text2">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Output panel ────────────────────────────────────────────────────────

  private renderOutputPanel() {
    const statusColors: Record<CommandStatus, string> = {
      idle: 'text-text2',
      running: 'text-info',
      success: 'text-success',
      error: 'text-danger',
    };
    const statusIcons: Record<CommandStatus, string> = {
      idle: '○',
      running: '⏳',
      success: '✓',
      error: '✗',
    };

    return (
      <div class="cli-card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <span class={`font-semibold ${statusColors[this.status]}`}>{statusIcons[this.status]}</span>
            <span class="text-sm text-text2">{this.statusMessage}</span>
          </div>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy Output
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>

        <div class="mb-2">
          <span class="text-xs text-text2">Last command:</span>
          <code class="text-xs bg-bg3 px-2 py-1 rounded ml-2 font-mono break-all">{this.lastCommand}</code>
        </div>

        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Tabs ────────────────────────────────────────────────────────────────

  private renderTabs() {
    return (
      <div class="cli-tabs-container">
        {TAB_DEFINITIONS.map(tab => (
          <button
            type="button"
            key={tab.id}
            class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  render() {
    return (
      <div class="pb-16">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-3xl flex items-center gap-2">
            <span>📊</span> ps GUI
          </h1>
          <span class="text-sm text-text2">Process Status</span>
        </div>

        {this.renderTabs()}

        <div class="mt-4">
          {this.activeTab === 'list' && this.renderListTab()}
          {this.activeTab === 'filter' && this.renderFilterTab()}
          {this.activeTab === 'tree' && this.renderTreeTab()}
          {this.activeTab === 'sort-format' && this.renderSortFormatTab()}
          {this.activeTab === 'cheatsheet' && this.renderCheatsheetTab()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }
}
