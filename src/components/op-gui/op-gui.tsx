import { Component, h, State } from '@stencil/core';
import {
  buildInjectCommand,
  buildItemDeleteCommand,
  buildItemGetCommand,
  buildItemListCommand,
  buildOpReference,
  buildReadCommand,
  buildRunCommand,
  ITEM_CATEGORY_PRESETS,
  OP_CATEGORIES,
  type OpCategory,
} from '../../op/op-command-builders';
import { getOpManPage } from '../../op/op-documentation';
import { validateOpReference } from '../../op/op-service';
import { type CommandResult, executeCommand } from '../../yabai/yabai-service';

const TABS = [
  { id: 'auth', label: 'Auth' },
  { id: 'items', label: 'Items' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'read', label: 'Read' },
  { id: 'run', label: 'Run / Inject' },
  { id: 'service-accounts', label: 'Service Accounts' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'docs', label: 'Docs' },
];

@Component({
  tag: 'op-gui',
  styleUrl: 'op-gui.css',
  scoped: true,
})
export class OpGui {
  @State() activeTab = 'auth';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select a tab and execute a command.';

  // ── Auth tab state ────────────────────────────────────────────
  @State() authAccount = '';

  // ── Items tab state ───────────────────────────────────────────
  @State() itemVault = '';
  @State() itemCategory: OpCategory | '' = '';
  @State() itemTags = '';
  @State() itemIncludeArchive = false;
  @State() itemName = '';
  @State() itemFields = '';
  @State() itemOtp = false;
  @State() itemDeleteTarget = '';
  @State() itemArchiveOnDelete = true;
  @State() confirmDeleteVisible = false;

  // ── Vaults tab state ──────────────────────────────────────────
  @State() vaultName = '';

  // ── Read tab state ────────────────────────────────────────────
  @State() refVault = '';
  @State() refItem = '';
  @State() refField = '';
  @State() refCustom = '';
  @State() refOutputFile = '';
  @State() refReveal = false;
  @State() refValidation: { valid: boolean; error?: string } | null = null;

  // ── Run / Inject tab state ────────────────────────────────────
  @State() runCommand = '';
  @State() runEnvFile = '';
  @State() runNoMasking = false;
  @State() injectInFile = '';
  @State() injectOutFile = '';

  // ── Service Account tab state ─────────────────────────────────
  @State() saName = '';
  @State() saVaults = '';
  @State() saExpires = '';

  // ── Plugin tab state ──────────────────────────────────────────
  @State() pluginName = '';

  // ── Helpers ───────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private async run(cmd: string): Promise<void> {
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Executing...';
    this.statusMessage = 'Running...';
    try {
      const res: CommandResult = await executeCommand(cmd);
      const sections = [res.stdout?.trim(), res.stderr?.trim() ? `stderr:\n${res.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = res.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = res.exitCode === 0 ? 'Completed' : `Failed (exit ${res.exitCode})`;
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied!');
  }

  clearOutput(): void {
    this.output = 'Select a tab and execute a command.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Output panel ──────────────────────────────────────────────

  renderOutputPanel() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';
    return (
      <div class="cli-card mt-5">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-text2">
            Status: <span class={statusColor}>{this.statusMessage}</span>
          </span>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview mb-3">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Auth tab ─────────────────────────────────────────────────

  renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Account Status</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Account (optional — shorthand, sign-in address, or ID)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my.1password.com or shorthand"
              value={this.authAccount}
              onInput={(e: Event) => (this.authAccount = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              title="Query — shows current account info"
              onClick={() => {
                const flag = this.authAccount ? ` --account ${this.authAccount}` : '';
                void this.run(`op whoami${flag} --format json`);
              }}
            >
              whoami
            </button>
            <button type="button" class="cli-btn" title="Query — list all locally configured accounts" onClick={() => void this.run('op account list --format json')}>
              account list
            </button>
            <button
              type="button"
              class="cli-btn"
              title="Query — get details for current account"
              onClick={() => {
                const flag = this.authAccount ? ` --account ${this.authAccount}` : '';
                void this.run(`op account get${flag} --format json`);
              }}
            >
              account get
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Sign Out</h3>
          <p class="text-sm text-text2 mb-4">Sign out of one or all accounts. This will end active sessions.</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              onClick={() => {
                if (typeof window !== 'undefined' && !window.confirm('Sign out of the current account?')) return;
                const flag = this.authAccount ? ` --account ${this.authAccount}` : '';
                void this.run(`op signout${flag}`);
              }}
            >
              signout
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (typeof window !== 'undefined' && !window.confirm('Sign out of ALL accounts?')) return;
                void this.run('op signout --all');
              }}
            >
              signout --all
            </button>
          </div>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Items tab ─────────────────────────────────────────────────

  renderItemsTab() {
    const listCmd = buildItemListCommand({
      vault: this.itemVault || undefined,
      categories: this.itemCategory ? [this.itemCategory as OpCategory] : undefined,
      tags: this.itemTags || undefined,
      includeArchive: this.itemIncludeArchive,
    });

    const getCmd = this.itemName
      ? buildItemGetCommand(this.itemName, {
          vault: this.itemVault || undefined,
          fields: this.itemFields || undefined,
          otp: this.itemOtp,
        })
      : '';

    const deleteCmd = this.itemDeleteTarget
      ? buildItemDeleteCommand(this.itemDeleteTarget, {
          vault: this.itemVault || undefined,
          archive: this.itemArchiveOnDelete,
        })
      : '';

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List Items */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            List Items
            <span class="cli-badge-safe ml-2">query</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Vault (optional)
              <input
                type="text"
                class="cli-input"
                placeholder="Vault name or ID"
                value={this.itemVault}
                onInput={(e: Event) => (this.itemVault = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Category (optional)
              <select class="cli-select" onChange={(e: Event) => (this.itemCategory = (e.target as HTMLSelectElement).value as OpCategory | '')}>
                <option value="" selected={this.itemCategory === ''}>
                  All categories
                </option>
                {OP_CATEGORIES.map(c => (
                  <option key={c} value={c} selected={this.itemCategory === c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Tags (comma-separated)
              <input type="text" class="cli-input" placeholder="tag1,tag2" value={this.itemTags} onInput={(e: Event) => (this.itemTags = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 mt-5">
              <input type="checkbox" checked={this.itemIncludeArchive} onChange={(e: Event) => (this.itemIncludeArchive = (e.target as HTMLInputElement).checked)} />
              Include Archive
            </label>
          </div>

          <div class="cli-cmd-preview mb-3">{listCmd}</div>

          <div class="flex flex-wrap gap-2 mb-3">
            {ITEM_CATEGORY_PRESETS.map(preset => (
              <button
                key={preset.label}
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  this.itemCategory = preset.categories.length > 0 ? (preset.categories[0] as OpCategory) : '';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => void this.run(listCmd)}>
            List Items
          </button>
        </div>

        {/* Get Item */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Get Item
            <span class="cli-badge-safe ml-2">query</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Item name or ID
            <input
              type="text"
              class="cli-input w-full"
              placeholder="Netflix, database-prod, item ID..."
              value={this.itemName}
              onInput={(e: Event) => (this.itemName = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Fields (optional, e.g. label=username,label=password)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="label=username,label=password"
              value={this.itemFields}
              onInput={(e: Event) => (this.itemFields = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.itemOtp} onChange={(e: Event) => (this.itemOtp = (e.target as HTMLInputElement).checked)} />
            Get OTP (--otp)
          </label>

          {getCmd && <div class="cli-cmd-preview mb-3">{getCmd}</div>}

          <button type="button" class="cli-btn cli-btn-success" disabled={!this.itemName} onClick={() => getCmd && void this.run(getCmd)}>
            Get Item
          </button>
        </div>

        {/* Delete Item */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">
            Delete / Archive Item
            <span class="cli-badge-sip ml-2">destructive</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Item name or ID
              <input
                type="text"
                class="cli-input"
                placeholder="item name or ID"
                value={this.itemDeleteTarget}
                onInput={(e: Event) => (this.itemDeleteTarget = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 mt-5">
              <input type="checkbox" checked={this.itemArchiveOnDelete} onChange={(e: Event) => (this.itemArchiveOnDelete = (e.target as HTMLInputElement).checked)} />
              Archive instead of delete (--archive)
            </label>
          </div>

          {deleteCmd && <div class="cli-cmd-preview mb-3">{deleteCmd}</div>}

          <button
            type="button"
            class="cli-btn cli-btn-danger"
            disabled={!this.itemDeleteTarget}
            onClick={() => {
              if (!this.itemDeleteTarget) return;
              const action = this.itemArchiveOnDelete ? 'archive' : 'permanently delete';
              if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to ${action} "${this.itemDeleteTarget}"?`)) return;
              void this.run(deleteCmd);
            }}
          >
            {this.itemArchiveOnDelete ? 'Archive Item' : 'Delete Item'}
          </button>

          {!this.itemArchiveOnDelete && <p class="text-danger text-xs mt-2">Warning: permanent deletion cannot be undone. Consider using --archive instead.</p>}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Vaults tab ────────────────────────────────────────────────

  renderVaultsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            List & Inspect Vaults
            <span class="cli-badge-safe ml-2">query</span>
          </h3>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => void this.run('op vault list --format json')}>
              vault list
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Vault name or ID
            <input
              type="text"
              class="cli-input w-full"
              placeholder="Production, vault-uuid..."
              value={this.vaultName}
              onInput={(e: Event) => (this.vaultName = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="cli-cmd-preview mb-3">{this.vaultName ? `op vault get ${JSON.stringify(this.vaultName)} --format json` : 'op vault get <vault>'}</div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!this.vaultName}
            onClick={() => this.vaultName && void this.run(`op vault get ${JSON.stringify(this.vaultName)} --format json`)}
          >
            vault get
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Documents
            <span class="cli-badge-safe ml-2">query</span>
          </h3>

          <div class="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => void this.run(this.vaultName ? `op document list --vault ${JSON.stringify(this.vaultName)} --format json` : 'op document list --format json')}
            >
              document list
            </button>
          </div>

          <p class="text-xs text-text2">Use the Vault field above to scope documents to a specific vault.</p>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Read tab ─────────────────────────────────────────────────

  renderReadTab() {
    const builtRef = buildOpReference(this.refVault, this.refItem, this.refField);
    const activeRef = this.refCustom.trim() || builtRef;
    const validation = activeRef ? validateOpReference(activeRef) : null;
    const readCmd = activeRef
      ? buildReadCommand(activeRef, {
          outputFile: this.refOutputFile || undefined,
        })
      : '';

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Build Secret Reference
            <span class="cli-badge-safe ml-2">query</span>
          </h3>
          <p class="text-sm text-text2 mb-4">
            Construct an <code>op://Vault/Item/Field</code> reference. Secret values are never displayed here — use the reveal option only when necessary.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Vault
              <input type="text" class="cli-input" placeholder="Production" value={this.refVault} onInput={(e: Event) => (this.refVault = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Item
              <input type="text" class="cli-input" placeholder="Database" value={this.refItem} onInput={(e: Event) => (this.refItem = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Field
              <input type="text" class="cli-input" placeholder="password" value={this.refField} onInput={(e: Event) => (this.refField = (e.target as HTMLInputElement).value)} />
            </label>
          </div>

          {builtRef && (
            <div class="op-ref-badge mb-3">
              <code>{builtRef}</code>
            </div>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Or paste / type a reference directly
            <input
              type="text"
              class={`cli-input w-full font-mono ${validation && !validation.valid ? 'cli-input-invalid' : ''}`}
              placeholder="op://Vault/Item/field"
              value={this.refCustom}
              onInput={(e: Event) => (this.refCustom = (e.target as HTMLInputElement).value)}
            />
            {validation && !validation.valid && <span class="cli-validation-message invalid">{validation.error}</span>}
            {validation?.valid && <span class="cli-validation-message valid">Valid reference</span>}
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Save to file (optional, --out-file)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="./secret.txt"
              value={this.refOutputFile}
              onInput={(e: Event) => (this.refOutputFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.refReveal} onChange={(e: Event) => (this.refReveal = (e.target as HTMLInputElement).checked)} />
            <span class="text-warning">Reveal secret in output (opt-in)</span>
          </label>

          {readCmd && <div class="cli-cmd-preview mb-3">{readCmd}</div>}

          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!activeRef || (!!validation && !validation.valid)}
            onClick={() => {
              if (!activeRef) return;
              if (!this.refReveal) {
                this.output =
                  '[Secret value concealed — enable "Reveal secret in output" to view]\n\nCommand was NOT executed to protect your secret. Enable reveal, then click again.';
                this.lastCommand = readCmd;
                this.status = 'idle';
                this.statusMessage = 'Concealed';
                return;
              }
              if (typeof window !== 'undefined' && !window.confirm(`This will output the secret value. Execute:\n${readCmd}`)) return;
              void this.run(readCmd);
            }}
          >
            op read
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Reference Examples</h3>
          <div class="space-y-2">
            {[
              {
                ref: 'op://Production/Database/password',
                desc: 'DB password from Production vault',
              },
              {
                ref: 'op://Dev/API/key',
                desc: 'API key from Dev vault',
              },
              {
                ref: 'op://app-prod/db/one-time password?attribute=otp',
                desc: 'TOTP code via query parameter',
              },
              {
                ref: 'op://Servers/ssh key/private key?ssh-format=openssh',
                desc: 'SSH private key in OpenSSH format',
              },
            ].map((ex, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-center mb-1">
                  <code class="text-xs font-mono text-info">{ex.ref}</code>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm"
                    onClick={() => {
                      this.refCustom = ex.ref;
                    }}
                  >
                    Use
                  </button>
                </div>
                <p class="text-xs text-text2">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Run / Inject tab ─────────────────────────────────────────

  renderRunInjectTab() {
    const runCmd = buildRunCommand(this.runCommand, {
      envFile: this.runEnvFile || undefined,
      noMasking: this.runNoMasking,
    });

    const injectCmd = buildInjectCommand({
      inFile: this.injectInFile || undefined,
      outFile: this.injectOutFile || undefined,
    });

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* op run */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            op run
            <span class="cli-badge-info ml-2">action</span>
          </h3>
          <p class="text-sm text-text2 mb-4">Run a command with op:// secret references resolved as environment variables. Secrets are masked in output by default.</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command to run
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="node server.js"
              value={this.runCommand}
              onInput={(e: Event) => (this.runCommand = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Env file (optional, --env-file)
            <input
              type="text"
              class="cli-input w-full"
              placeholder=".env"
              value={this.runEnvFile}
              onInput={(e: Event) => (this.runEnvFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.runNoMasking} onChange={(e: Event) => (this.runNoMasking = (e.target as HTMLInputElement).checked)} />
            <span class="text-warning">Disable secret masking (--no-masking)</span>
          </label>

          {this.runCommand && <div class="cli-cmd-preview mb-3">{runCmd}</div>}

          <button type="button" class="cli-btn" disabled={!this.runCommand} onClick={() => this.runCommand && void this.run(runCmd)}>
            Execute op run
          </button>

          <div class="mt-3 p-3 bg-bg3 rounded text-xs text-text2">
            <strong>Example .env:</strong>
            <pre class="mt-1 font-mono">
              DB_PASSWORD=op://Production/Database/password{'\n'}
              API_KEY=op://Dev/MyApp/api-key
            </pre>
          </div>
        </div>

        {/* op inject */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            op inject
            <span class="cli-badge-info ml-2">action</span>
          </h3>
          <p class="text-sm text-text2 mb-4">
            Render a config template with {'{{ op://... }}'} placeholders replaced by real secrets. Delete the output file when no longer needed.
          </p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Input template file (-i)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="config.yml.tpl"
              value={this.injectInFile}
              onInput={(e: Event) => (this.injectInFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Output file (-o, optional — omit to use stdout)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="config.yml"
              value={this.injectOutFile}
              onInput={(e: Event) => (this.injectOutFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="cli-cmd-preview mb-3">{injectCmd}</div>

          <button type="button" class="cli-btn" onClick={() => void this.run(injectCmd)}>
            Execute op inject
          </button>

          <div class="mt-3 p-3 bg-bg3 rounded text-xs text-text2">
            <strong>Example template:</strong>
            <pre class="mt-1 font-mono">
              db_password: {'{{ op://Production/Database/password }}'}
              {'\n'}
              api_key: {'{{ op://Dev/App/api-key }}'}
            </pre>
          </div>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Service Accounts tab ──────────────────────────────────────

  renderServiceAccountsTab() {
    const createCmd = this.saName
      ? [
          'op service-account create',
          JSON.stringify(this.saName),
          ...this.saVaults
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => `--vaults ${JSON.stringify(v)}`),
          this.saExpires ? `--expires-in ${this.saExpires}` : '',
        ]
          .filter(Boolean)
          .join(' ')
      : '';

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Rate Limit
            <span class="cli-badge-safe ml-2">query</span>
          </h3>
          <p class="text-sm text-text2 mb-3">Check API rate limit usage for the current service account (requires OP_SERVICE_ACCOUNT_TOKEN).</p>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => void this.run('op service-account ratelimit --format json')}>
            ratelimit
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Create Service Account
            <span class="cli-badge-info ml-2">action</span>
          </h3>
          <p class="text-sm text-danger text-xs mb-3">The token is shown only once at creation. Store it securely immediately.</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Account name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="CI/CD Service Account"
              value={this.saName}
              onInput={(e: Event) => (this.saName = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Vaults (comma-separated, format: vault-id[:permission])
            <input
              type="text"
              class="cli-input w-full"
              placeholder="vault-uuid:read_items, vault-uuid2"
              value={this.saVaults}
              onInput={(e: Event) => (this.saVaults = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Expires in (optional, e.g. 30d, 6m, 1y)
            <input type="text" class="cli-input w-full" placeholder="90d" value={this.saExpires} onInput={(e: Event) => (this.saExpires = (e.target as HTMLInputElement).value)} />
          </label>

          {createCmd && <div class="cli-cmd-preview mb-3">{createCmd}</div>}

          <button type="button" class="cli-btn" disabled={!this.saName} onClick={() => createCmd && void this.run(createCmd)}>
            Create Service Account
          </button>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Plugins tab ───────────────────────────────────────────────

  renderPluginsTab() {
    const KNOWN_PLUGINS = ['aws', 'github', 'gcloud', 'npm', 'stripe', 'heroku', 'netlify', 'terraform'];

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Plugin Management
            <span class="cli-badge-safe ml-2">query</span>
          </h3>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => void this.run('op plugin list')}>
              plugin list
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => void this.run('op plugin inspect')}>
              plugin inspect
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Plugin name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="aws, github, gcloud..."
              value={this.pluginName}
              onInput={(e: Event) => (this.pluginName = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 mb-3">
            {KNOWN_PLUGINS.map(p => (
              <button key={p} type="button" class={`cli-btn cli-btn-sm ${this.pluginName === p ? 'cli-btn-info' : ''}`} onClick={() => (this.pluginName = p)}>
                {p}
              </button>
            ))}
          </div>

          {this.pluginName && <div class="cli-cmd-preview mb-3">{`op plugin init ${this.pluginName}`}</div>}

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn" disabled={!this.pluginName} onClick={() => this.pluginName && void this.run(`op plugin init ${this.pluginName}`)}>
              plugin init
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (typeof window !== 'undefined' && !window.confirm('Clear all shell plugin configurations?')) return;
                void this.run('op plugin clear');
              }}
            >
              plugin clear (all)
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">How Shell Plugins Work</h3>
          <div class="space-y-3 text-sm text-text2">
            <p>
              Shell plugins let 1Password securely inject credentials into third-party CLIs (AWS, GitHub, etc.) using biometric authentication instead of storing secrets in
              plaintext config files.
            </p>
            <div class="p-3 bg-bg3 rounded">
              <p class="font-medium text-text mb-1">Setup flow:</p>
              <ol class="list-decimal list-inside space-y-1">
                <li>
                  Run <code>op plugin init aws</code>
                </li>
                <li>Follow prompts to link your AWS credentials item</li>
                <li>
                  Run <code>aws s3 ls</code> — op prompts for biometrics
                </li>
              </ol>
            </div>
            <div class="p-3 bg-bg3 rounded">
              <p class="font-medium text-text mb-1">Supported CLIs include:</p>
              <p>aws, azure, gcloud, github, npm, stripe, netlify, heroku, and more.</p>
            </div>
          </div>
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }

  // ── Docs tab ──────────────────────────────────────────────────

  renderDocsTab() {
    const page = getOpManPage();
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{page.name}</h2>
          <p class="text-text2 text-sm font-mono mb-3">{page.synopsis}</p>
          <p class="text-sm mb-6">{page.description}</p>

          {page.sections.map((section, i) => (
            <div key={i} class="mb-6">
              <h3 class="text-lg font-medium mb-2">{section.title}</h3>
              <pre class="cli-output text-sm">{section.content}</pre>
            </div>
          ))}

          <div class="mt-6">
            <h3 class="text-lg font-medium mb-2">Examples</h3>
            <div class="space-y-2">
              {page.examples.map((ex, i) => (
                <div key={i} class="flex gap-4 items-start p-2 bg-bg3 rounded">
                  <code class="font-mono text-sm flex-1 text-info">{ex.command}</code>
                  <span class="text-text2 text-sm">{ex.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🔑</span> 1Password CLI
          </h2>
          <p class="text-text2 text-sm">Secret manager (op) — secrets are never displayed without explicit opt-in</p>
        </header>

        <div class="op-security-notice mb-4">
          <strong>Security notice:</strong> This GUI builds and previews commands only. Secret values are concealed by default. Use the opt-in reveal option only when necessary,
          and never in shared or recorded sessions.
        </div>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => (this.activeTab = tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div class="tab-content">
          {this.activeTab === 'auth' && this.renderAuthTab()}
          {this.activeTab === 'items' && this.renderItemsTab()}
          {this.activeTab === 'vaults' && this.renderVaultsTab()}
          {this.activeTab === 'read' && this.renderReadTab()}
          {this.activeTab === 'run' && this.renderRunInjectTab()}
          {this.activeTab === 'service-accounts' && this.renderServiceAccountsTab()}
          {this.activeTab === 'plugins' && this.renderPluginsTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
        </div>
      </div>
    );
  }
}
