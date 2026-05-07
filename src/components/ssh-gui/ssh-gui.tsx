import { Component, Fragment, h, State } from '@stencil/core';
import {
  buildConnectCommand,
  buildDynamicForwardCommand,
  buildKeygenCommand,
  buildLocalForwardCommand,
  buildRemoteForwardCommand,
  validateHost,
  validatePort,
} from '../../ssh/ssh-command-builders';
import { getSshManPage } from '../../ssh/ssh-documentation';
import { type CommandResult, executeCommand } from '../../ssh/ssh-service';

const TAB_DEFINITIONS = [
  { id: 'connect', label: 'Connect & Exec' },
  { id: 'forward', label: 'Port Forwarding' },
  { id: 'keys', label: 'Key Management' },
  { id: 'agent', label: 'Agent (ssh-add)' },
  { id: 'known', label: 'known_hosts' },
  { id: 'config', label: 'Config Builder' },
  { id: 'docs', label: 'Documentation' },
  { id: 'raw', label: 'Raw' },
];

@Component({
  tag: 'ssh-gui',
  styleUrl: 'ssh-gui.css',
  scoped: true,
})
export class SshGui {
  // ── Global state ─────────────────────────────────────────────────────────
  @State() activeTab = 'connect';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() output = 'Configure a connection and click Execute.';
  @State() lastCommand = '';

  // ── Connect tab ───────────────────────────────────────────────────────────
  @State() connHost = '';
  @State() connUser = '';
  @State() connPort = '';
  @State() connIdentityFile = '';
  @State() connJumpHost = '';
  @State() connCommand = '';
  @State() connAgentForwarding = false;
  @State() connCompression = false;
  @State() connVerbose = false;
  @State() connHostError = '';
  @State() connPortError = '';

  // ── Port forward tab ──────────────────────────────────────────────────────
  @State() fwdMode: 'local' | 'remote' | 'dynamic' = 'local';
  @State() fwdHost = '';
  @State() fwdUser = '';
  @State() fwdSshPort = '';
  @State() fwdIdentityFile = '';
  @State() fwdBackground = true;
  // local/remote
  @State() fwdLocalPort = '';
  @State() fwdRemoteHost = '';
  @State() fwdRemotePort = '';
  @State() fwdRemotePortR = '';
  @State() fwdLocalHostR = 'localhost';
  @State() fwdLocalPortR = '';
  // dynamic
  @State() fwdDynPort = '';

  // ── Key management tab ────────────────────────────────────────────────────
  @State() keyType: 'ed25519' | 'ecdsa' | 'rsa' = 'ed25519';
  @State() keyBits = '4096';
  @State() keyComment = '';
  @State() keyOutputFile = '';
  @State() keyRounds = '';
  @State() keyFingerprintFile = '';
  @State() keyChangePpFile = '';
  @State() keyRemoveHost = '';

  // ── Agent tab ─────────────────────────────────────────────────────────────
  @State() agentKeyFile = '';
  @State() agentLifetime = '';
  @State() agentConfirm = false;
  @State() agentRemoveFile = '';

  // ── known_hosts tab ───────────────────────────────────────────────────────
  @State() knownFindHost = '';
  @State() knownRemoveHost = '';

  // ── Config builder tab ────────────────────────────────────────────────────
  @State() cfgAlias = '';
  @State() cfgHostname = '';
  @State() cfgUser = '';
  @State() cfgPort = '';
  @State() cfgIdentityFile = '';
  @State() cfgProxyJump = '';
  @State() cfgServerAliveInterval = '60';
  @State() cfgForwardAgent = false;
  @State() cfgCompression = false;
  @State() cfgConfigOutput = '';

  // ── Raw tab ───────────────────────────────────────────────────────────────
  @State() rawCmd = '';

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async run(cmd: string, confirm = false): Promise<void> {
    if (!cmd.trim()) return;
    if (confirm && typeof window !== 'undefined' && !window.confirm(`Execute:\n${cmd}`)) return;

    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running...';
    this.statusMessage = 'Running...';

    try {
      const result: CommandResult = await executeCommand(cmd);
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

  private setStatus(msg: string, resetTo = 'Ready', delayMs = 2500): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, delayMs);
    }
  }

  private clearOutput(): void {
    this.output = 'Configure a connection and click Execute.';
    this.lastCommand = '';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setStatus('Copied!');
  }

  // ── Connect command preview ───────────────────────────────────────────────

  private buildConnectPreview(): string {
    if (!this.connHost) return 'ssh [user@]host [command]';
    try {
      return buildConnectCommand({
        host: this.connHost,
        user: this.connUser || undefined,
        port: this.connPort ? Number(this.connPort) : undefined,
        identityFile: this.connIdentityFile || undefined,
        agentForwarding: this.connAgentForwarding,
        compression: this.connCompression,
        jumpHost: this.connJumpHost || undefined,
        verbose: this.connVerbose,
        command: this.connCommand || undefined,
      });
    } catch {
      return '(invalid — fix the fields above)';
    }
  }

  private validateConnectFields(): boolean {
    let ok = true;
    if (this.connHost) {
      const hv = validateHost(this.connHost);
      this.connHostError = hv.valid ? '' : (hv.error ?? 'Invalid host');
      if (!hv.valid) ok = false;
    } else {
      this.connHostError = 'Host is required';
      ok = false;
    }
    if (this.connPort) {
      const pv = validatePort(Number(this.connPort));
      this.connPortError = pv.valid ? '' : (pv.error ?? 'Invalid port');
      if (!pv.valid) ok = false;
    } else {
      this.connPortError = '';
    }
    return ok;
  }

  // ── Forward command preview ───────────────────────────────────────────────

  private buildForwardPreview(): string {
    try {
      if (this.fwdMode === 'local') {
        return buildLocalForwardCommand({
          host: this.fwdHost || 'host',
          user: this.fwdUser || undefined,
          sshPort: this.fwdSshPort ? Number(this.fwdSshPort) : undefined,
          localPort: this.fwdLocalPort ? Number(this.fwdLocalPort) : 8080,
          remoteHost: this.fwdRemoteHost || 'remote-host',
          remotePort: this.fwdRemotePort ? Number(this.fwdRemotePort) : 80,
          identityFile: this.fwdIdentityFile || undefined,
          background: this.fwdBackground,
        });
      }
      if (this.fwdMode === 'remote') {
        return buildRemoteForwardCommand({
          host: this.fwdHost || 'host',
          user: this.fwdUser || undefined,
          sshPort: this.fwdSshPort ? Number(this.fwdSshPort) : undefined,
          remotePort: this.fwdRemotePortR ? Number(this.fwdRemotePortR) : 9000,
          localHost: this.fwdLocalHostR || 'localhost',
          localPort: this.fwdLocalPortR ? Number(this.fwdLocalPortR) : 3000,
          identityFile: this.fwdIdentityFile || undefined,
          background: this.fwdBackground,
        });
      }
      // dynamic
      return buildDynamicForwardCommand({
        host: this.fwdHost || 'host',
        user: this.fwdUser || undefined,
        sshPort: this.fwdSshPort ? Number(this.fwdSshPort) : undefined,
        localPort: this.fwdDynPort ? Number(this.fwdDynPort) : 1080,
        identityFile: this.fwdIdentityFile || undefined,
        background: this.fwdBackground,
      });
    } catch {
      return '(invalid — fix the fields above)';
    }
  }

  // ── Keygen command preview ────────────────────────────────────────────────

  private buildKeygenPreview(): string {
    try {
      return buildKeygenCommand({
        type: this.keyType,
        bits: this.keyBits ? Number(this.keyBits) : undefined,
        comment: this.keyComment || undefined,
        outputFile: this.keyOutputFile || undefined,
        rounds: this.keyRounds ? Number(this.keyRounds) : undefined,
      });
    } catch {
      return '(invalid — fix the fields above)';
    }
  }

  // ── Config builder ────────────────────────────────────────────────────────

  private buildConfigBlock(): string {
    if (!this.cfgAlias) return '# Fill in the Host Alias field above';
    const lines: string[] = [`Host ${this.cfgAlias}`];
    if (this.cfgHostname) lines.push(`    HostName ${this.cfgHostname}`);
    if (this.cfgUser) lines.push(`    User ${this.cfgUser}`);
    if (this.cfgPort) lines.push(`    Port ${this.cfgPort}`);
    if (this.cfgIdentityFile) lines.push(`    IdentityFile ${this.cfgIdentityFile}`);
    if (this.cfgProxyJump) lines.push(`    ProxyJump ${this.cfgProxyJump}`);
    if (this.cfgForwardAgent) lines.push('    ForwardAgent yes');
    if (this.cfgCompression) lines.push('    Compression yes');
    if (this.cfgServerAliveInterval) lines.push(`    ServerAliveInterval ${this.cfgServerAliveInterval}`);
    return lines.join('\n');
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  private renderStatusBadge() {
    const cls = this.status === 'success' ? 'text-success' : this.status === 'error' ? 'text-danger' : this.status === 'running' ? 'text-warning' : 'text-text2';
    return <span class={cls}>{this.statusMessage}</span>;
  }

  private renderOutputPanel() {
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm">Output — Status: {this.renderStatusBadge()}</span>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        {this.lastCommand && <div class="cli-cmd-preview mb-2">{this.lastCommand}</div>}
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Tab renderers ─────────────────────────────────────────────────────────

  private renderConnectTab() {
    const preview = this.buildConnectPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Connection Parameters</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Host *
              <input
                type="text"
                class={`cli-input ${this.connHostError ? 'cli-input-invalid' : ''}`}
                placeholder="host.example.com"
                value={this.connHost}
                onInput={(e: Event) => {
                  this.connHost = (e.target as HTMLInputElement).value;
                  this.connHostError = '';
                }}
              />
              {this.connHostError && <span class="cli-validation-message invalid">{this.connHostError}</span>}
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              User
              <input type="text" class="cli-input" placeholder="username" value={this.connUser} onInput={(e: Event) => (this.connUser = (e.target as HTMLInputElement).value)} />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Port
              <input
                type="number"
                class={`cli-input ${this.connPortError ? 'cli-input-invalid' : ''}`}
                placeholder="22"
                min="1"
                max="65535"
                value={this.connPort}
                onInput={(e: Event) => {
                  this.connPort = (e.target as HTMLInputElement).value;
                  this.connPortError = '';
                }}
              />
              {this.connPortError && <span class="cli-validation-message invalid">{this.connPortError}</span>}
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Identity File (-i)
              <input
                type="text"
                class="cli-input"
                placeholder="~/.ssh/id_ed25519"
                value={this.connIdentityFile}
                onInput={(e: Event) => (this.connIdentityFile = (e.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2 md:col-span-2">
              Jump Host (-J)
              <input
                type="text"
                class="cli-input"
                placeholder="bastion.example.com"
                value={this.connJumpHost}
                onInput={(e: Event) => (this.connJumpHost = (e.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2 md:col-span-2">
              Remote Command (leave blank for interactive shell)
              <input
                type="text"
                class="cli-input font-mono"
                placeholder='e.g. "ls -la /var/log"'
                value={this.connCommand}
                onInput={(e: Event) => (this.connCommand = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.connAgentForwarding} onChange={(e: Event) => (this.connAgentForwarding = (e.target as HTMLInputElement).checked)} />
              Agent Fwd (-A)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.connCompression} onChange={(e: Event) => (this.connCompression = (e.target as HTMLInputElement).checked)} />
              Compression (-C)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.connVerbose} onChange={(e: Event) => (this.connVerbose = (e.target as HTMLInputElement).checked)} />
              Verbose (-v)
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.validateConnectFields()) return;
                this.run(preview);
              }}
            >
              Connect / Exec
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                if (!this.validateConnectFields()) return;
                this.run(`ssh -G ${this.connUser ? `${this.connUser}@` : ''}${this.connHost}`);
              }}
            >
              Print Config (-G)
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Command Preview</h3>
          <div class="cli-cmd-preview">{preview}</div>

          <div class="mt-5">
            <h3 class="text-text2 text-base mb-3">Quick Connect (Query Algorithms)</h3>
            <p class="text-xs text-text2 mb-3">Queries supported algorithms — safe, read-only.</p>
            <div class="flex flex-wrap gap-2">
              {(['cipher', 'mac', 'kex', 'key', 'sig'] as const).map(alg => (
                <button key={alg} type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(`ssh -Q ${alg}`)}>
                  -Q {alg}
                </button>
              ))}
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('ssh -V')}>
                Version (-V)
              </button>
            </div>
          </div>

          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  private renderForwardTab() {
    const preview = this.buildForwardPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Port Forwarding</h3>

          {/* Mode selector */}
          <div class="flex gap-2 mb-4">
            {(['local', 'remote', 'dynamic'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                class={`cli-btn cli-btn-sm ${this.fwdMode === mode ? 'cli-btn-info' : ''}`}
                onClick={() => {
                  this.fwdMode = mode;
                }}
              >
                {mode === 'local' ? 'Local (-L)' : mode === 'remote' ? 'Remote (-R)' : 'Dynamic (-D)'}
              </button>
            ))}
          </div>

          {/* Common SSH connection fields */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              SSH Host *
              <input
                type="text"
                class="cli-input"
                placeholder="bastion.example.com"
                value={this.fwdHost}
                onInput={(e: Event) => (this.fwdHost = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              SSH User
              <input type="text" class="cli-input" placeholder="username" value={this.fwdUser} onInput={(e: Event) => (this.fwdUser = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              SSH Port
              <input
                type="number"
                class="cli-input"
                placeholder="22"
                min="1"
                max="65535"
                value={this.fwdSshPort}
                onInput={(e: Event) => (this.fwdSshPort = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Identity File
              <input
                type="text"
                class="cli-input"
                placeholder="~/.ssh/id_ed25519"
                value={this.fwdIdentityFile}
                onInput={(e: Event) => (this.fwdIdentityFile = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          {/* Mode-specific fields */}
          {this.fwdMode === 'local' && (
            <Fragment>
              <p class="text-xs text-text2 mb-2">Forward LOCAL_PORT → REMOTE_HOST:REMOTE_PORT through SSH host.</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <label class="flex flex-col gap-1 text-sm text-text2">
                  Local Port
                  <input
                    type="number"
                    class="cli-input"
                    placeholder="8080"
                    min="1"
                    max="65535"
                    value={this.fwdLocalPort}
                    onInput={(e: Event) => (this.fwdLocalPort = (e.target as HTMLInputElement).value)}
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-text2">
                  Remote Host
                  <input
                    type="text"
                    class="cli-input"
                    placeholder="db.internal"
                    value={this.fwdRemoteHost}
                    onInput={(e: Event) => (this.fwdRemoteHost = (e.target as HTMLInputElement).value)}
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-text2">
                  Remote Port
                  <input
                    type="number"
                    class="cli-input"
                    placeholder="5432"
                    min="1"
                    max="65535"
                    value={this.fwdRemotePort}
                    onInput={(e: Event) => (this.fwdRemotePort = (e.target as HTMLInputElement).value)}
                  />
                </label>
              </div>
            </Fragment>
          )}

          {this.fwdMode === 'remote' && (
            <Fragment>
              <p class="text-xs text-text2 mb-2">Expose REMOTE_PORT on SSH host → LOCAL_HOST:LOCAL_PORT on this machine.</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <label class="flex flex-col gap-1 text-sm text-text2">
                  Remote Port
                  <input
                    type="number"
                    class="cli-input"
                    placeholder="9000"
                    min="1"
                    max="65535"
                    value={this.fwdRemotePortR}
                    onInput={(e: Event) => (this.fwdRemotePortR = (e.target as HTMLInputElement).value)}
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-text2">
                  Local Host
                  <input
                    type="text"
                    class="cli-input"
                    placeholder="localhost"
                    value={this.fwdLocalHostR}
                    onInput={(e: Event) => (this.fwdLocalHostR = (e.target as HTMLInputElement).value)}
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-text2">
                  Local Port
                  <input
                    type="number"
                    class="cli-input"
                    placeholder="3000"
                    min="1"
                    max="65535"
                    value={this.fwdLocalPortR}
                    onInput={(e: Event) => (this.fwdLocalPortR = (e.target as HTMLInputElement).value)}
                  />
                </label>
              </div>
            </Fragment>
          )}

          {this.fwdMode === 'dynamic' && (
            <Fragment>
              <p class="text-xs text-text2 mb-2">Create a local SOCKS4/5 proxy on LOCAL_PORT through the SSH host.</p>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
                Local SOCKS Port
                <input
                  type="number"
                  class="cli-input w-40"
                  placeholder="1080"
                  min="1"
                  max="65535"
                  value={this.fwdDynPort}
                  onInput={(e: Event) => (this.fwdDynPort = (e.target as HTMLInputElement).value)}
                />
              </label>
            </Fragment>
          )}

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.fwdBackground} onChange={(e: Event) => (this.fwdBackground = (e.target as HTMLInputElement).checked)} />
            Run in background (-f -N)
          </label>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(preview)}>
            Start Forwarding
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Command Preview</h3>
          <div class="cli-cmd-preview">{preview}</div>
          <p class="text-xs text-text2 mt-2">
            {this.fwdMode === 'local' && 'After connecting: localhost:LOCAL_PORT → REMOTE_HOST:REMOTE_PORT'}
            {this.fwdMode === 'remote' && 'After connecting: remote:REMOTE_PORT → LOCAL_HOST:LOCAL_PORT'}
            {this.fwdMode === 'dynamic' && 'After connecting: configure your app SOCKS5 proxy → localhost:LOCAL_PORT'}
          </p>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  private renderKeysTab() {
    const preview = this.buildKeygenPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Generate Key Pair (ssh-keygen)</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Key Type
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.keyType = (e.target as HTMLSelectElement).value as 'ed25519' | 'ecdsa' | 'rsa';
                  if (this.keyType === 'ed25519') this.keyBits = '';
                }}
              >
                <option value="ed25519" selected={this.keyType === 'ed25519'}>
                  ed25519 (recommended)
                </option>
                <option value="ecdsa" selected={this.keyType === 'ecdsa'}>
                  ecdsa
                </option>
                <option value="rsa" selected={this.keyType === 'rsa'}>
                  rsa
                </option>
              </select>
            </label>

            {(this.keyType === 'rsa' || this.keyType === 'ecdsa') && (
              <div class="flex flex-col gap-1 text-sm text-text2">
                <span>Bits (-b)</span>
                {this.keyType === 'rsa' && (
                  <select class="cli-select" onChange={(e: Event) => (this.keyBits = (e.target as HTMLSelectElement).value)}>
                    <option value="2048" selected={this.keyBits === '2048'}>
                      2048
                    </option>
                    <option value="3072" selected={this.keyBits === '3072'}>
                      3072
                    </option>
                    <option value="4096" selected={this.keyBits === '4096' || this.keyBits === ''}>
                      4096 (recommended)
                    </option>
                  </select>
                )}
                {this.keyType === 'ecdsa' && (
                  <select class="cli-select" onChange={(e: Event) => (this.keyBits = (e.target as HTMLSelectElement).value)}>
                    <option value="256" selected={this.keyBits === '256'}>
                      256
                    </option>
                    <option value="384" selected={this.keyBits === '384'}>
                      384
                    </option>
                    <option value="521" selected={this.keyBits === '521' || this.keyBits === ''}>
                      521
                    </option>
                  </select>
                )}
              </div>
            )}

            <label class="flex flex-col gap-1 text-sm text-text2">
              Comment (-C)
              <input
                type="text"
                class="cli-input"
                placeholder="user@hostname"
                value={this.keyComment}
                onInput={(e: Event) => (this.keyComment = (e.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Output File (-f)
              <input
                type="text"
                class="cli-input font-mono"
                placeholder="~/.ssh/id_ed25519"
                value={this.keyOutputFile}
                onInput={(e: Event) => (this.keyOutputFile = (e.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              KDF Rounds (-a)
              <input
                type="number"
                class="cli-input"
                placeholder="16 (default)"
                min="1"
                max="256"
                value={this.keyRounds}
                onInput={(e: Event) => (this.keyRounds = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="cli-cmd-preview mb-4">{preview}</div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(preview, true)}>
            Generate Key
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Inspect Keys</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Key File (show fingerprint)
            <div class="flex gap-2">
              <input
                type="text"
                class="cli-input flex-1 font-mono"
                placeholder="~/.ssh/id_ed25519.pub"
                value={this.keyFingerprintFile}
                onInput={(e: Event) => (this.keyFingerprintFile = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  if (this.keyFingerprintFile) this.run(`ssh-keygen -l -f ${this.keyFingerprintFile}`);
                }}
              >
                Fingerprint
              </button>
            </div>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Key File (change passphrase)
            <div class="flex gap-2">
              <input
                type="text"
                class="cli-input flex-1 font-mono"
                placeholder="~/.ssh/id_ed25519"
                value={this.keyChangePpFile}
                onInput={(e: Event) => (this.keyChangePpFile = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-sm cli-btn-warning"
                onClick={() => {
                  if (this.keyChangePpFile) this.run(`ssh-keygen -p -f ${this.keyChangePpFile}`, true);
                }}
              >
                Change Passphrase
              </button>
            </div>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Remove host from known_hosts (ssh-keygen -R)
            <div class="flex gap-2">
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="host.example.com"
                value={this.keyRemoveHost}
                onInput={(e: Event) => (this.keyRemoveHost = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-sm cli-btn-danger"
                onClick={() => {
                  if (this.keyRemoveHost) this.run(`ssh-keygen -R ${this.keyRemoveHost}`, true);
                }}
              >
                Remove Host
              </button>
            </div>
          </label>

          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  private renderAgentTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Agent Keys (ssh-add)</h3>

          <div class="flex flex-wrap gap-2 mb-5">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('ssh-add -l')}>
              List Keys (-l)
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('ssh-add -L')}>
              List Public Keys (-L)
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Key File to Add
            <input
              type="text"
              class="cli-input font-mono"
              placeholder="~/.ssh/id_ed25519 (leave blank for defaults)"
              value={this.agentKeyFile}
              onInput={(e: Event) => (this.agentKeyFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Lifetime seconds (-t)
              <input
                type="number"
                class="cli-input"
                placeholder="3600 (1 hour)"
                min="1"
                value={this.agentLifetime}
                onInput={(e: Event) => (this.agentLifetime = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 mt-4">
              <input type="checkbox" checked={this.agentConfirm} onChange={(e: Event) => (this.agentConfirm = (e.target as HTMLInputElement).checked)} />
              Require confirmation (-c)
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                const parts = ['ssh-add'];
                if (this.agentLifetime) parts.push('-t', this.agentLifetime);
                if (this.agentConfirm) parts.push('-c');
                if (this.agentKeyFile) parts.push(this.agentKeyFile);
                this.run(parts.join(' '));
              }}
            >
              Add Key
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Remove Keys</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Remove specific key file
            <div class="flex gap-2">
              <input
                type="text"
                class="cli-input flex-1 font-mono"
                placeholder="~/.ssh/id_ed25519"
                value={this.agentRemoveFile}
                onInput={(e: Event) => (this.agentRemoveFile = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-sm cli-btn-warning"
                onClick={() => {
                  if (this.agentRemoveFile) this.run(`ssh-add -d ${this.agentRemoveFile}`, true);
                }}
              >
                Remove
              </button>
            </div>
          </label>

          <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run('ssh-add -D', true)}>
            Remove ALL Keys from Agent
          </button>

          <p class="text-xs text-text2 mt-2">This removes all identities from the running ssh-agent. Requires confirmation.</p>

          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  private renderKnownHostsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">known_hosts Management</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Find host in known_hosts (ssh-keygen -F)
            <div class="flex gap-2">
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="host.example.com"
                value={this.knownFindHost}
                onInput={(e: Event) => (this.knownFindHost = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  if (this.knownFindHost) this.run(`ssh-keygen -F ${this.knownFindHost}`);
                }}
              >
                Find
              </button>
            </div>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-5">
            Remove host from known_hosts (ssh-keygen -R)
            <div class="flex gap-2">
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="host.example.com"
                value={this.knownRemoveHost}
                onInput={(e: Event) => (this.knownRemoveHost = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-sm cli-btn-danger"
                onClick={() => {
                  if (this.knownRemoveHost) this.run(`ssh-keygen -R ${this.knownRemoveHost}`, true);
                }}
              >
                Remove
              </button>
            </div>
            <span class="text-xs text-text2">Removes the host key entry — useful after server reinstalls</span>
          </label>

          <div class="p-3 bg-bg3 rounded text-sm text-text2">
            <p class="font-medium mb-1">known_hosts location</p>
            <code>~/.ssh/known_hosts</code>
            <p class="mt-2 text-xs">Host keys are automatically stored here on first connect. Remove a stale entry if you see "REMOTE HOST IDENTIFICATION HAS CHANGED".</p>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Tips</h3>
          <ul class="space-y-2 text-sm text-text2">
            <li class="p-2 bg-bg3 rounded">
              <strong class="text-text">StrictHostKeyChecking no</strong>
              <br />
              Add to ssh_config to skip prompt (not recommended for production)
            </li>
            <li class="p-2 bg-bg3 rounded">
              <strong class="text-text">ssh -o "StrictHostKeyChecking accept-new"</strong>
              <br />
              Automatically accept new hosts but reject changed keys
            </li>
            <li class="p-2 bg-bg3 rounded">
              <strong class="text-text">ssh-keyscan host</strong>
              <br />
              Retrieve host keys and add to known_hosts without connecting
            </li>
          </ul>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  private renderConfigBuilderTab() {
    const block = this.buildConfigBlock();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">~/.ssh/config Block Builder</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Host Alias *
              <input type="text" class="cli-input" placeholder="myserver" value={this.cfgAlias} onInput={(e: Event) => (this.cfgAlias = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              HostName
              <input
                type="text"
                class="cli-input"
                placeholder="real.host.example.com"
                value={this.cfgHostname}
                onInput={(e: Event) => (this.cfgHostname = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              User
              <input type="text" class="cli-input" placeholder="username" value={this.cfgUser} onInput={(e: Event) => (this.cfgUser = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Port
              <input
                type="number"
                class="cli-input"
                placeholder="22"
                min="1"
                max="65535"
                value={this.cfgPort}
                onInput={(e: Event) => (this.cfgPort = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              IdentityFile
              <input
                type="text"
                class="cli-input font-mono"
                placeholder="~/.ssh/id_ed25519"
                value={this.cfgIdentityFile}
                onInput={(e: Event) => (this.cfgIdentityFile = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              ProxyJump
              <input
                type="text"
                class="cli-input"
                placeholder="bastion.example.com"
                value={this.cfgProxyJump}
                onInput={(e: Event) => (this.cfgProxyJump = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              ServerAliveInterval (s)
              <input
                type="number"
                class="cli-input"
                placeholder="60"
                min="0"
                value={this.cfgServerAliveInterval}
                onInput={(e: Event) => (this.cfgServerAliveInterval = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="flex gap-4 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.cfgForwardAgent} onChange={(e: Event) => (this.cfgForwardAgent = (e.target as HTMLInputElement).checked)} />
              ForwardAgent yes
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.cfgCompression} onChange={(e: Event) => (this.cfgCompression = (e.target as HTMLInputElement).checked)} />
              Compression yes
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={async () => {
              if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(block);
                this.setStatus('Config block copied to clipboard!');
              }
            }}
          >
            Copy Config Block
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Generated ~/.ssh/config Block</h3>
          <pre class="cli-output">{block}</pre>
          <p class="text-xs text-text2 mt-3">
            Paste this into <code>~/.ssh/config</code> (create if absent). Then connect with: <code>ssh {this.cfgAlias || 'alias'}</code>
          </p>

          <div class="mt-4 p-3 bg-bg3 rounded text-sm">
            <p class="font-medium mb-2 text-text">ControlMaster (multiplexing) — add to config:</p>
            <pre class="text-xs text-text2 font-mono whitespace-pre">{`Host *
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m`}</pre>
          </div>
        </div>
      </div>
    );
  }

  private renderDocsTab() {
    const manPage = getSshManPage();
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{manPage.name}</h2>
          <p class="text-text2 text-sm font-mono mb-3">{manPage.synopsis}</p>
          <p class="whitespace-pre-wrap text-sm mb-5">{manPage.description}</p>

          {manPage.sections.map((section, i) => (
            <div key={i} class="mb-5">
              <h3 class="text-base font-medium mb-2">{section.title}</h3>
              <pre class="cli-output text-sm">{section.content}</pre>
            </div>
          ))}

          <div class="mt-4">
            <h3 class="text-base font-medium mb-2">Examples</h3>
            <div class="space-y-2">
              {manPage.examples.map((ex, i) => (
                <div key={i} class="flex gap-4 items-start p-2 bg-bg3 rounded">
                  <code class="font-mono text-sm flex-1">{ex.command}</code>
                  <span class="text-text2 text-sm">{ex.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderRawTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Raw Command</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="ssh user@host 'uptime'"
              value={this.rawCmd}
              onInput={(e: Event) => (this.rawCmd = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.rawCmd)}>
              Execute
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-danger" onClick={() => this.run(this.rawCmd, true)}>
              Execute (with confirm)
            </button>
          </div>
        </div>
        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🔐</span> SSH GUI
          </h2>
          <p class="text-text2 text-sm">Remote connection manager — connect, forward ports, manage keys & agent</p>
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
          {this.activeTab === 'connect' && this.renderConnectTab()}
          {this.activeTab === 'forward' && this.renderForwardTab()}
          {this.activeTab === 'keys' && this.renderKeysTab()}
          {this.activeTab === 'agent' && this.renderAgentTab()}
          {this.activeTab === 'known' && this.renderKnownHostsTab()}
          {this.activeTab === 'config' && this.renderConfigBuilderTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
          {this.activeTab === 'raw' && this.renderRawTab()}
        </div>
      </div>
    );
  }
}
