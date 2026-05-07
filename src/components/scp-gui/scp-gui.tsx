import { Component, h, State } from '@stencil/core';
import { scpExamples, scpPresets } from '../../scp/scp-command-builders';
import { getScpManPage } from '../../scp/scp-documentation';
import { buildScpCommand, type ScpOptions, scpService, validateBandwidth, validateHost, validatePort } from '../../scp/scp-service';
import { type CommandSegment, parseCommandIntoSegments } from '../../utils/command-builder';

type Tab = 'builder' | 'presets' | 'examples' | 'docs';
type Direction = 'upload' | 'download' | 'remote-to-remote';

const TAB_DEFS: { id: Tab; label: string }[] = [
  { id: 'builder', label: 'Builder' },
  { id: 'presets', label: 'Presets' },
  { id: 'examples', label: 'Examples' },
  { id: 'docs', label: 'Documentation' },
];

@Component({
  tag: 'scp-gui',
  styleUrl: 'scp-gui.css',
  scoped: true,
})
export class ScpGui {
  // ── Tab ──────────────────────────────────────────────────────
  @State() activeTab: Tab = 'builder';

  // ── Direction / paths ─────────────────────────────────────────
  @State() direction: Direction = 'upload';
  @State() localPath = '';
  @State() remoteHost = '';
  @State() remotePath = '';
  @State() src2 = '';
  @State() dst2 = '';

  // ── Options ───────────────────────────────────────────────────
  @State() recursive = false;
  @State() preserve = false;
  @State() quiet = false;
  @State() verbose = false;
  @State() compress = false;
  @State() batch = false;
  @State() legacyScp = false;
  @State() threeParty = false;

  @State() port = '';
  @State() identityFile = '';
  @State() bandwidthLimit = '';
  @State() jumpHost = '';
  @State() sshConfig = '';

  // ── Validation ────────────────────────────────────────────────
  @State() portError = '';
  @State() hostError = '';
  @State() bandwidthError = '';

  // ── Execution ─────────────────────────────────────────────────
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() output = 'Build an scp command and click Execute.';
  @State() lastCommand = 'Ready…';

  // ── Command preview segments ───────────────────────────────────
  @State() commandSegments: CommandSegment[] = [];
  @State() highlightedSegmentIndex: number | null = null;

  componentWillLoad() {
    this.refreshSegments();
  }

  // ── Helpers ───────────────────────────────────────────────────

  private buildOptions(): ScpOptions {
    return {
      recursive: this.recursive || undefined,
      preserve: this.preserve || undefined,
      quiet: this.quiet || undefined,
      verbose: this.verbose || undefined,
      compress: this.compress || undefined,
      batch: this.batch || undefined,
      legacyScp: this.legacyScp || undefined,
      threeParty: this.threeParty || undefined,
      port: this.port ? Number(this.port) : undefined,
      identityFile: this.identityFile || undefined,
      bandwidthLimit: this.bandwidthLimit ? Number(this.bandwidthLimit) : undefined,
      jumpHost: this.jumpHost || undefined,
      sshConfig: this.sshConfig || undefined,
    };
  }

  private buildSourceDest(): { src: string; dst: string } {
    if (this.direction === 'remote-to-remote') {
      return { src: this.src2 || '[src-host:path]', dst: this.dst2 || '[dst-host:path]' };
    }
    const remote = `${this.remoteHost || '[host]'}:${this.remotePath || '[/remote/path]'}`;
    const local = this.localPath || '[/local/path]';
    if (this.direction === 'upload') {
      return { src: local, dst: remote };
    }
    return { src: remote, dst: local };
  }

  private buildCommand(): string {
    const { src, dst } = this.buildSourceDest();
    return buildScpCommand(src, dst, this.buildOptions());
  }

  private refreshSegments() {
    this.commandSegments = parseCommandIntoSegments(this.buildCommand());
  }

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private validateAll(): boolean {
    const portV = validatePort(this.port);
    const hostV = validateHost(this.remoteHost);
    const bwV = validateBandwidth(this.bandwidthLimit);
    this.portError = portV.message || '';
    this.hostError = hostV.message || '';
    this.bandwidthError = bwV.message || '';
    return portV.valid && hostV.valid && bwV.valid;
  }

  // ── Actions ───────────────────────────────────────────────────

  async executeCommand(): Promise<void> {
    if (!this.validateAll()) {
      this.status = 'error';
      this.statusMessage = 'Fix validation errors first';
      return;
    }
    const cmd = this.buildCommand();
    const hasPlaceholder = cmd.includes('[');
    if (hasPlaceholder) {
      this.output = 'Please fill in source and destination paths before executing.';
      this.status = 'error';
      this.statusMessage = 'Incomplete command';
      return;
    }

    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Executing…';
    this.statusMessage = 'Running…';

    try {
      const result = await scpService.execute(cmd);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  clearOutput(): void {
    this.output = 'Build an scp command and click Execute.';
    this.lastCommand = 'Ready…';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  async copyCommand(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.buildCommand());
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

  loadPreset(index: number): void {
    const preset = scpPresets[index];
    if (!preset) return;
    this.direction = preset.direction as Direction;

    if (preset.direction === 'remote-to-remote') {
      this.src2 = preset.source;
      this.dst2 = preset.destination;
    } else if (preset.direction === 'upload') {
      this.localPath = preset.source;
      const colonIdx = preset.destination.indexOf(':');
      this.remoteHost = colonIdx > -1 ? preset.destination.slice(0, colonIdx) : preset.destination;
      this.remotePath = colonIdx > -1 ? preset.destination.slice(colonIdx + 1) : '';
    } else {
      const colonIdx = preset.source.indexOf(':');
      this.remoteHost = colonIdx > -1 ? preset.source.slice(0, colonIdx) : preset.source;
      this.remotePath = colonIdx > -1 ? preset.source.slice(colonIdx + 1) : '';
      this.localPath = preset.destination;
    }

    const o = preset.options;
    this.recursive = !!o.recursive;
    this.preserve = !!o.preserve;
    this.quiet = !!o.quiet;
    this.verbose = !!o.verbose;
    this.compress = !!o.compress;
    this.batch = !!o.batch;
    this.legacyScp = !!o.legacyScp;
    this.threeParty = !!o.threeParty;
    this.port = o.port ? String(o.port) : '';
    this.identityFile = o.identityFile || '';
    this.bandwidthLimit = o.bandwidthLimit ? String(o.bandwidthLimit) : '';
    this.jumpHost = o.jumpHost || '';
    this.sshConfig = o.sshConfig || '';

    this.activeTab = 'builder';
    this.refreshSegments();
    this.setTemporaryStatus('Preset loaded');
  }

  loadExample(command: string): void {
    this.lastCommand = command;
    this.output = `Command loaded:\n${command}\n\nSwitch to Builder tab to adjust or click Execute Raw below.`;
    this.status = 'idle';
    this.statusMessage = 'Ready';
    this.setTemporaryStatus('Example loaded');
  }

  // ── Render helpers ────────────────────────────────────────────

  renderTabs() {
    return (
      <div class="border-b border-accent2 mb-4">
        {TAB_DEFS.map(tab => (
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
    );
  }

  renderCommandPreview() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';

    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm font-medium">Command Preview</span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyCommand()}>
            Copy
          </button>
        </div>
        <div class="cli-cmd-preview">
          {this.commandSegments.map((seg, i) => (
            <span
              key={i}
              role="note"
              class={`cmd-seg cmd-seg-${seg.type} ${this.highlightedSegmentIndex === i ? 'cmd-seg-highlight' : ''}`}
              title={seg.description}
              onMouseEnter={() => {
                this.highlightedSegmentIndex = i;
              }}
              onMouseLeave={() => {
                this.highlightedSegmentIndex = null;
              }}
            >
              {seg.text}
            </span>
          ))}
        </div>
        <div class="flex items-center gap-2 mt-2 text-sm">
          <span class="text-text2">Status:</span>
          <span class={statusColor}>{this.statusMessage}</span>
        </div>
      </div>
    );
  }

  renderOutput() {
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm font-medium">Output</span>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderDirectionPicker() {
    const dirs: { id: Direction; label: string; desc: string }[] = [
      { id: 'upload', label: 'Upload', desc: 'Local → Remote' },
      { id: 'download', label: 'Download', desc: 'Remote → Local' },
      { id: 'remote-to-remote', label: 'Remote → Remote', desc: 'Via local host (-3)' },
    ];
    return (
      <div class="flex flex-wrap gap-2 mb-4">
        {dirs.map(d => (
          <button
            key={d.id}
            type="button"
            class={`cli-btn ${this.direction === d.id ? 'cli-btn-info' : 'cli-btn-sm'}`}
            onClick={() => {
              this.direction = d.id;
              this.refreshSegments();
            }}
            title={d.desc}
          >
            {d.label}
            <span class="text-xs ml-1 opacity-70">{d.desc}</span>
          </button>
        ))}
      </div>
    );
  }

  renderPathFields() {
    if (this.direction === 'remote-to-remote') {
      return (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <label class="flex flex-col gap-1 text-sm text-text2">
            Source (host1:path)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="user@host1:/data/file.txt"
              value={this.src2}
              onInput={(e: Event) => {
                this.src2 = (e.target as HTMLInputElement).value;
                this.refreshSegments();
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2">
            Destination (host2:path)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="user@host2:/dest/"
              value={this.dst2}
              onInput={(e: Event) => {
                this.dst2 = (e.target as HTMLInputElement).value;
                this.refreshSegments();
              }}
            />
          </label>
        </div>
      );
    }

    const isUpload = this.direction === 'upload';
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <label class="flex flex-col gap-1 text-sm text-text2">
          Local Path
          <input
            type="text"
            class="cli-input w-full font-mono"
            placeholder={isUpload ? './file.txt or ./dir/' : './destination/'}
            value={this.localPath}
            onInput={(e: Event) => {
              this.localPath = (e.target as HTMLInputElement).value;
              this.refreshSegments();
            }}
          />
        </label>
        <div class="flex flex-col gap-3">
          <label class="flex flex-col gap-1 text-sm text-text2">
            Remote Host (user@host)
            <input
              type="text"
              class={`cli-input w-full font-mono ${this.hostError ? 'cli-input-invalid' : ''}`}
              placeholder="user@hostname"
              value={this.remoteHost}
              onInput={(e: Event) => {
                this.remoteHost = (e.target as HTMLInputElement).value;
                const v = validateHost(this.remoteHost);
                this.hostError = v.message || '';
                this.refreshSegments();
              }}
            />
            {this.hostError && <span class="text-danger text-xs">{this.hostError}</span>}
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2">
            Remote Path
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder={isUpload ? '/home/user/dest/' : '/remote/file.txt'}
              value={this.remotePath}
              onInput={(e: Event) => {
                this.remotePath = (e.target as HTMLInputElement).value;
                this.refreshSegments();
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  renderFlagToggles() {
    const bools: { key: string; label: string; flag: string; desc: string }[] = [
      { key: 'recursive', label: 'Recursive', flag: '-r', desc: 'Recursively copy directories (follows symlinks)' },
      { key: 'preserve', label: 'Preserve', flag: '-p', desc: 'Preserve mtimes, atimes, and mode bits' },
      { key: 'compress', label: 'Compress', flag: '-C', desc: 'Enable SSH compression' },
      { key: 'quiet', label: 'Quiet', flag: '-q', desc: 'Suppress progress meter and diagnostics' },
      { key: 'verbose', label: 'Verbose', flag: '-v', desc: 'Print SSH debug messages' },
      { key: 'batch', label: 'Batch', flag: '-B', desc: 'Batch mode: fail instead of prompting for passwords' },
      { key: 'legacyScp', label: 'Legacy (-O)', flag: '-O', desc: 'Force legacy SCP protocol (needed for OpenSSH < 9.0 servers)' },
      { key: 'threeParty', label: 'Via Local (-3)', flag: '-3', desc: 'Route remote-to-remote through local host' },
    ];

    return (
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {bools.map(f => (
          <label key={String(f.key)} class="flex items-center gap-2 text-sm text-text2 cursor-pointer" title={f.desc}>
            <input
              type="checkbox"
              checked={!!(this as Record<string, unknown>)[f.key]}
              onChange={(e: Event) => {
                (this as Record<string, unknown>)[f.key as string] = (e.target as HTMLInputElement).checked;
                this.refreshSegments();
              }}
            />
            <span>
              <span class="text-info font-mono text-xs">{f.flag}</span> {f.label}
            </span>
          </label>
        ))}
      </div>
    );
  }

  renderAdvancedFields() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <label class="flex flex-col gap-1 text-sm text-text2">
          Port (-P)
          <input
            type="number"
            class={`cli-input w-full ${this.portError ? 'cli-input-invalid' : ''}`}
            placeholder="22"
            min="1"
            max="65535"
            value={this.port}
            onInput={(e: Event) => {
              this.port = (e.target as HTMLInputElement).value;
              const v = validatePort(this.port);
              this.portError = v.message || '';
              this.refreshSegments();
            }}
          />
          {this.portError && <span class="text-danger text-xs">{this.portError}</span>}
        </label>

        <label class="flex flex-col gap-1 text-sm text-text2">
          Identity File (-i)
          <input
            type="text"
            class="cli-input w-full font-mono"
            placeholder="~/.ssh/id_ed25519"
            value={this.identityFile}
            onInput={(e: Event) => {
              this.identityFile = (e.target as HTMLInputElement).value;
              this.refreshSegments();
            }}
          />
        </label>

        <label class="flex flex-col gap-1 text-sm text-text2">
          Bandwidth Limit (-l) Kbit/s
          <input
            type="number"
            class={`cli-input w-full ${this.bandwidthError ? 'cli-input-invalid' : ''}`}
            placeholder="e.g. 1000"
            min="1"
            value={this.bandwidthLimit}
            onInput={(e: Event) => {
              this.bandwidthLimit = (e.target as HTMLInputElement).value;
              const v = validateBandwidth(this.bandwidthLimit);
              this.bandwidthError = v.message || '';
              this.refreshSegments();
            }}
          />
          {this.bandwidthError && <span class="text-danger text-xs">{this.bandwidthError}</span>}
          {this.bandwidthLimit && !this.bandwidthError && <span class="text-xs text-text2">≈ {Math.round(Number(this.bandwidthLimit) / 8)} KB/s</span>}
        </label>

        <label class="flex flex-col gap-1 text-sm text-text2">
          Jump Host (-J)
          <input
            type="text"
            class="cli-input w-full font-mono"
            placeholder="bastion.example.com"
            value={this.jumpHost}
            onInput={(e: Event) => {
              this.jumpHost = (e.target as HTMLInputElement).value;
              this.refreshSegments();
            }}
          />
        </label>

        <label class="flex flex-col gap-1 text-sm text-text2">
          SSH Config (-F)
          <input
            type="text"
            class="cli-input w-full font-mono"
            placeholder="~/.ssh/config"
            value={this.sshConfig}
            onInput={(e: Event) => {
              this.sshConfig = (e.target as HTMLInputElement).value;
              this.refreshSegments();
            }}
          />
        </label>
      </div>
    );
  }

  renderBuilderTab() {
    return (
      <div>
        <div class="cli-card mb-4">
          <h3 class="text-text2 text-base mb-3 font-medium">Direction</h3>
          {this.renderDirectionPicker()}
        </div>

        <div class="cli-card mb-4">
          <h3 class="text-text2 text-base mb-3 font-medium">Paths</h3>
          {this.renderPathFields()}
        </div>

        <div class="cli-card mb-4">
          <h3 class="text-text2 text-base mb-3 font-medium">Flags</h3>
          {this.renderFlagToggles()}

          <details class="mt-2">
            <summary class="text-sm text-text2 cursor-pointer select-none mb-3">Advanced options…</summary>
            <div class="mt-3">{this.renderAdvancedFields()}</div>
          </details>
        </div>

        {this.renderCommandPreview()}

        <div class="flex flex-wrap gap-2 mt-4">
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeCommand()} disabled={this.status === 'running'}>
            {this.status === 'running' ? 'Running…' : 'Execute'}
          </button>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyCommand()}>
            Copy Command
          </button>
          <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
            Clear
          </button>
        </div>

        {this.renderOutput()}

        <div class="mt-4 p-3 rounded-lg bg-bg3 border border-warning text-sm text-warning">
          <strong>Warning:</strong> scp overwrites the destination without confirmation. Unlike <code>cp -i</code>, there is no interactive prompt. Double-check your destination
          path before executing.
          {!this.legacyScp && (
            <div class="mt-1 text-text2">
              Tip: OpenSSH 9.0+ uses SFTP by default. Enable <strong>Legacy (-O)</strong> if the server does not support SFTP.
            </div>
          )}
        </div>
      </div>
    );
  }

  renderPresetsTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scpPresets.map((preset, i) => (
          <div key={i} class="cli-card">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="font-medium">{preset.name}</span>
                <span
                  class={`ml-2 text-xs px-2 py-0.5 rounded ${
                    preset.direction === 'upload' ? 'bg-info text-bg' : preset.direction === 'download' ? 'bg-success text-bg' : 'bg-warning text-bg'
                  }`}
                >
                  {preset.direction}
                </span>
              </div>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.loadPreset(i)}>
                Load
              </button>
            </div>
            <p class="text-text2 text-xs mb-2">{preset.description}</p>
            <code class="text-xs block font-mono text-text2 bg-bg3 px-2 py-1 rounded break-all">
              {preset.source} → {preset.destination}
            </code>
          </div>
        ))}
      </div>
    );
  }

  renderExamplesTab() {
    const categories: Array<{ id: string; label: string }> = [
      { id: 'upload', label: 'Upload' },
      { id: 'download', label: 'Download' },
      { id: 'remote-to-remote', label: 'Remote-to-Remote' },
      { id: 'advanced', label: 'Advanced' },
    ];
    return (
      <div>
        {categories.map(cat => {
          const items = scpExamples.filter(e => e.category === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id} class="mb-6">
              <h3 class="text-text font-medium mb-3">{cat.label}</h3>
              <div class="space-y-3">
                {items.map((ex, i) => (
                  <div key={i} class="cli-card">
                    <div class="flex justify-between items-start mb-1">
                      <span class="font-medium text-sm">{ex.name}</span>
                      <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.loadExample(ex.command)}>
                        Load
                      </button>
                    </div>
                    <code class="block text-xs font-mono mb-1 text-success bg-bg3 px-2 py-1 rounded break-all">{ex.command}</code>
                    <p class="text-text2 text-xs">{ex.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  renderDocsTab() {
    const man = getScpManPage();
    return (
      <div class="cli-card">
        <h2 class="text-xl font-semibold mb-1">{man.name}</h2>
        <p class="text-text2 text-sm mb-4 font-mono">{man.synopsis}</p>
        <p class="whitespace-pre-wrap text-sm mb-6">{man.description}</p>

        {man.sections.map((sec, i) => (
          <div key={i} class="mb-6">
            <h3 class="text-base font-medium mb-2">{sec.title}</h3>
            <pre class="cli-output text-xs">{sec.content}</pre>
          </div>
        ))}

        <div class="mt-6">
          <h3 class="text-base font-medium mb-2">Examples</h3>
          <div class="space-y-2">
            {man.examples.map((ex, i) => (
              <div key={i} class="flex gap-4 items-start p-2 bg-bg3 rounded">
                <code class="font-mono text-xs flex-1 text-success break-all">{ex.command}</code>
                <span class="text-text2 text-xs shrink-0 max-w-40 text-right">{ex.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>📤</span> scp GUI
          </h2>
          <p class="text-text2 text-sm">Secure copy over SSH — visual interface for scp</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'presets' && this.renderPresetsTab()}
          {this.activeTab === 'examples' && this.renderExamplesTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
        </div>
      </div>
    );
  }
}
