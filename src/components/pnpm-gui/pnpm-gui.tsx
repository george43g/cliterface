import { Component, h, State } from '@stencil/core';
import {
  buildAddCommand,
  buildAuditCommand,
  buildConfigCommand,
  buildInstallCommand,
  buildPatchCommand,
  buildPublishCommand,
  buildRemoveCommand,
  buildRunCommand,
  buildUpdateCommand,
  type PnpmAddOptions,
  type PnpmAuditOptions,
  type PnpmConfigOptions,
  type PnpmInstallOptions,
  type PnpmPatchOptions,
  type PnpmPublishOptions,
  type PnpmRunOptions,
  type PnpmUpdateOptions,
} from '../../pnpm/pnpm-command-builders';
import { type CommandResult, pnpmService } from '../../pnpm/pnpm-service';

const TABS = [
  { id: 'install', label: 'Install' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'audit', label: 'Audit' },
  { id: 'patch', label: 'Patch' },
  { id: 'store', label: 'Store' },
  { id: 'publish', label: 'Publish' },
  { id: 'config', label: 'Config' },
];

@Component({
  tag: 'pnpm-gui',
  styleUrl: 'pnpm-gui.css',
  scoped: true,
})
export class PnpmGui {
  @State() activeTab = 'install';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select an action to run a pnpm command.';
  @State() statusMessage = 'Ready';

  // ── Install tab ──────────────────────────────────────────────
  @State() installOpts: PnpmInstallOptions = { frozenLockfile: false, ignoreScripts: false, filter: '' };

  // ── Add/Remove tab (part of Install) ────────────────────────
  @State() addOpts: PnpmAddOptions = { packages: '', dev: false, optional: false, peer: false, exact: false, global: false, filter: '' };
  @State() removePackage = '';
  @State() removeGlobal = false;
  @State() removeFilter = '';
  @State() updateOpts: PnpmUpdateOptions = { packages: '', recursive: false, latest: false, dev: false, prod: false, filter: '' };

  // ── Scripts tab ──────────────────────────────────────────────
  @State() runOpts: PnpmRunOptions = { script: '', filter: '', recursive: false, parallel: false };
  @State() execCmd = '';
  @State() execFilter = '';
  @State() dlxPkg = '';

  // ── Workspaces tab ───────────────────────────────────────────
  @State() wsFilter = '';
  @State() wsScript = '';
  @State() wsParallel = false;
  @State() whyPackage = '';
  @State() listDepth = '0';
  @State() listRecursive = false;

  // ── Audit tab ────────────────────────────────────────────────
  @State() auditOpts: PnpmAuditOptions = { dev: false, prod: false, json: false, level: '', fix: false };

  // ── Patch tab ────────────────────────────────────────────────
  @State() patchOpts: PnpmPatchOptions = { action: 'patch', pkgOrDir: '' };

  // ── Store tab ────────────────────────────────────────────────
  // (no extra state needed beyond buttons)

  // ── Publish tab ──────────────────────────────────────────────
  @State() publishOpts: PnpmPublishOptions = { dryRun: true, tag: '', access: '', recursive: false, noGitChecks: false };

  // ── Config tab ───────────────────────────────────────────────
  @State() configOpts: PnpmConfigOptions = { action: 'list', key: '', value: '', global: false, json: false };

  // ── Helpers ──────────────────────────────────────────────────

  private setTemporaryStatus(msg: string, reset = 'Ready'): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = reset;
      }, 2000);
    }
  }

  private async exec(cmd: string, runner: () => Promise<CommandResult>, needsConfirm = false): Promise<void> {
    if (needsConfirm && typeof window !== 'undefined' && !window.confirm(`Run: ${cmd}?`)) return;
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running…';
    this.statusMessage = 'Running…';
    try {
      const result = await runner();
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

  private clearOutput(): void {
    this.output = 'Select an action to run a pnpm command.';
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
    this.setTemporaryStatus('Copied!');
  }

  // ── Renderers ────────────────────────────────────────────────

  private renderOutputPanel() {
    const statusColor = this.status === 'success' ? 'text-success' : this.status === 'error' ? 'text-danger' : this.status === 'running' ? 'text-warning' : 'text-text2';

    return (
      <div class="cli-card mt-5">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm">
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
        <div class="cli-cmd-preview">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Install Tab ──────────────────────────────────────────────

  private renderInstallTab() {
    const installCmd = buildInstallCommand(this.installOpts);
    const addCmd = buildAddCommand(this.addOpts);
    const removeCmd = buildRemoveCommand(this.removePackage, this.removeGlobal, this.removeFilter);
    const updateCmd = buildUpdateCommand(this.updateOpts);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Install */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Install All Dependencies</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.installOpts.frozenLockfile}
                onChange={(e: Event) => {
                  this.installOpts = { ...this.installOpts, frozenLockfile: (e.target as HTMLInputElement).checked };
                }}
              />
              --frozen-lockfile (CI mode)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.installOpts.ignoreScripts}
                onChange={(e: Event) => {
                  this.installOpts = { ...this.installOpts, ignoreScripts: (e.target as HTMLInputElement).checked };
                }}
              />
              --ignore-scripts
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Workspace filter (--filter)
              <input
                type="text"
                class="cli-input"
                placeholder="e.g. @scope/pkg or ./packages/*"
                value={this.installOpts.filter}
                onInput={(e: Event) => {
                  this.installOpts = { ...this.installOpts, filter: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{installCmd}</div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => this.exec(installCmd, () => pnpmService.install({ frozenLockfile: this.installOpts.frozenLockfile, ignoreScrips: this.installOpts.ignoreScripts }))}
          >
            pnpm install
          </button>
        </div>

        {/* Add */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Add Package</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Package(s)
              <input
                type="text"
                class="cli-input"
                placeholder="e.g. react zod@3 lodash"
                value={this.addOpts.packages}
                onInput={(e: Event) => {
                  this.addOpts = { ...this.addOpts, packages: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.addOpts.dev}
                  onChange={(e: Event) => {
                    this.addOpts = { ...this.addOpts, dev: (e.target as HTMLInputElement).checked, optional: false, peer: false };
                  }}
                />
                -D devDependency
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.addOpts.optional}
                  onChange={(e: Event) => {
                    this.addOpts = { ...this.addOpts, optional: (e.target as HTMLInputElement).checked, dev: false, peer: false };
                  }}
                />
                -O optional
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.addOpts.peer}
                  onChange={(e: Event) => {
                    this.addOpts = { ...this.addOpts, peer: (e.target as HTMLInputElement).checked, dev: false, optional: false };
                  }}
                />
                --save-peer
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.addOpts.exact}
                  onChange={(e: Event) => {
                    this.addOpts = { ...this.addOpts, exact: (e.target as HTMLInputElement).checked };
                  }}
                />
                -E exact version
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.addOpts.global}
                  onChange={(e: Event) => {
                    this.addOpts = { ...this.addOpts, global: (e.target as HTMLInputElement).checked };
                  }}
                />
                -g global
              </label>
            </div>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --filter
              <input
                type="text"
                class="cli-input"
                placeholder="workspace filter"
                value={this.addOpts.filter}
                onInput={(e: Event) => {
                  this.addOpts = { ...this.addOpts, filter: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{addCmd}</div>
          <button
            type="button"
            class="cli-btn"
            onClick={() =>
              this.exec(addCmd, () =>
                pnpmService.add(this.addOpts.packages, {
                  dev: this.addOpts.dev,
                  optional: this.addOpts.optional,
                  peer: this.addOpts.peer,
                  exact: this.addOpts.exact,
                  global: this.addOpts.global,
                  filter: this.addOpts.filter,
                }),
              )
            }
          >
            pnpm add
          </button>
        </div>

        {/* Remove */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Remove Package</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Package name
              <input
                type="text"
                class="cli-input"
                placeholder="e.g. lodash"
                value={this.removePackage}
                onInput={(e: Event) => {
                  this.removePackage = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.removeGlobal}
                onChange={(e: Event) => {
                  this.removeGlobal = (e.target as HTMLInputElement).checked;
                }}
              />
              -g global
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --filter
              <input
                type="text"
                class="cli-input"
                placeholder="workspace filter"
                value={this.removeFilter}
                onInput={(e: Event) => {
                  this.removeFilter = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{removeCmd}</div>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => this.exec(removeCmd, () => pnpmService.remove(this.removePackage, { global: this.removeGlobal, filter: this.removeFilter }), true)}
          >
            pnpm remove
          </button>
        </div>

        {/* Update */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Update Packages</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Package pattern (leave blank for all)
              <input
                type="text"
                class="cli-input"
                placeholder="e.g. react* or typescript"
                value={this.updateOpts.packages}
                onInput={(e: Event) => {
                  this.updateOpts = { ...this.updateOpts, packages: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.updateOpts.latest}
                  onChange={(e: Event) => {
                    this.updateOpts = { ...this.updateOpts, latest: (e.target as HTMLInputElement).checked };
                  }}
                />
                --latest (ignore ranges)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.updateOpts.recursive}
                  onChange={(e: Event) => {
                    this.updateOpts = { ...this.updateOpts, recursive: (e.target as HTMLInputElement).checked };
                  }}
                />
                -r recursive
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.updateOpts.dev}
                  onChange={(e: Event) => {
                    this.updateOpts = { ...this.updateOpts, dev: (e.target as HTMLInputElement).checked, prod: false };
                  }}
                />
                -D devOnly
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.updateOpts.prod}
                  onChange={(e: Event) => {
                    this.updateOpts = { ...this.updateOpts, prod: (e.target as HTMLInputElement).checked, dev: false };
                  }}
                />
                -P prodOnly
              </label>
            </div>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --filter
              <input
                type="text"
                class="cli-input"
                placeholder="workspace filter"
                value={this.updateOpts.filter}
                onInput={(e: Event) => {
                  this.updateOpts = { ...this.updateOpts, filter: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{updateCmd}</div>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn"
              onClick={() =>
                this.exec(updateCmd, () =>
                  pnpmService.update(this.updateOpts.packages, {
                    recursive: this.updateOpts.recursive,
                    latest: this.updateOpts.latest,
                    dev: this.updateOpts.dev,
                    prod: this.updateOpts.prod,
                  }),
                )
              }
            >
              pnpm update
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.exec('pnpm outdated', () => pnpmService.outdated({ recursive: this.updateOpts.recursive }))}>
              Check outdated
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scripts Tab ──────────────────────────────────────────────

  private renderScriptsTab() {
    const runCmd = buildRunCommand(this.runOpts);
    const execPreview = `pnpm exec${this.execFilter ? ` --filter "${this.execFilter}"` : ''} ${this.execCmd}`.trim();
    const dlxPreview = `pnpm dlx ${this.dlxPkg}`.trim();

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Run script */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Run Script</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Script name
              <input
                type="text"
                class="cli-input"
                placeholder="e.g. build, test, dev"
                value={this.runOpts.script}
                onInput={(e: Event) => {
                  this.runOpts = { ...this.runOpts, script: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --filter
              <input
                type="text"
                class="cli-input"
                placeholder="workspace filter"
                value={this.runOpts.filter}
                onInput={(e: Event) => {
                  this.runOpts = { ...this.runOpts, filter: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.runOpts.recursive}
                  onChange={(e: Event) => {
                    this.runOpts = { ...this.runOpts, recursive: (e.target as HTMLInputElement).checked };
                  }}
                />
                -r recursive
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.runOpts.parallel}
                  onChange={(e: Event) => {
                    this.runOpts = { ...this.runOpts, parallel: (e.target as HTMLInputElement).checked };
                  }}
                />
                --parallel
              </label>
            </div>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{runCmd}</div>
          <button type="button" class="cli-btn" onClick={() => this.exec(runCmd, () => pnpmService.run(this.runOpts.script, this.runOpts.filter))}>
            pnpm run
          </button>
        </div>

        {/* exec */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Exec</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Command
              <input
                type="text"
                class="cli-input font-mono"
                placeholder="e.g. node -e 'console.log(1)'"
                value={this.execCmd}
                onInput={(e: Event) => {
                  this.execCmd = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --filter
              <input
                type="text"
                class="cli-input"
                placeholder="workspace filter"
                value={this.execFilter}
                onInput={(e: Event) => {
                  this.execFilter = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{execPreview}</div>
          <button type="button" class="cli-btn" onClick={() => this.exec(execPreview, () => pnpmService.exec(this.execCmd, this.execFilter))}>
            pnpm exec
          </button>
        </div>

        {/* dlx */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">DLX (Run without installing)</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Package + args
              <input
                type="text"
                class="cli-input font-mono"
                placeholder="e.g. create-react-app my-app"
                value={this.dlxPkg}
                onInput={(e: Event) => {
                  this.dlxPkg = (e.target as HTMLInputElement).value;
                }}
              />
              <span class="text-xs text-text2">Fetches from registry and runs without installing as dep</span>
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{dlxPreview}</div>
          <button type="button" class="cli-btn" onClick={() => this.exec(dlxPreview, () => pnpmService.dlx(this.dlxPkg))}>
            pnpm dlx
          </button>
        </div>

        {/* init */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Initialize</h3>
          <p class="text-text2 text-sm mb-4">Create a package.json in the current directory.</p>
          <div class="cli-cmd-preview text-sm mb-3">pnpm init</div>
          <button type="button" class="cli-btn" onClick={() => this.exec('pnpm init', () => pnpmService.init())}>
            pnpm init
          </button>
        </div>
      </div>
    );
  }

  // ── Workspaces Tab ───────────────────────────────────────────

  private renderWorkspacesTab() {
    const filterHint = 'Supports: pkg-name, @scope/*, ./path, {./pkg1,./pkg2}, ...main, [tag]';
    const listCmd = `pnpm list${this.listRecursive ? ' -r' : ''} --depth ${this.listDepth}${this.wsFilter ? ` --filter "${this.wsFilter}"` : ''}`;
    const whyCmd = `pnpm why${this.wsFilter ? ` --filter "${this.wsFilter}"` : ''} ${this.whyPackage}`.trim();
    const runCmd = `pnpm run -r${this.wsParallel ? ' --parallel' : ''}${this.wsFilter ? ` --filter "${this.wsFilter}"` : ''} ${this.wsScript}`.trim();

    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Workspace Filter</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            --filter pattern
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. @myorg/*, ./packages/*, ...^upstream"
              value={this.wsFilter}
              onInput={(e: Event) => {
                this.wsFilter = (e.target as HTMLInputElement).value;
              }}
            />
            <span class="text-xs text-text2">{filterHint}</span>
          </label>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* List */}
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">List / ls</h3>
            <div class="flex flex-col gap-3 mb-4">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.listRecursive}
                  onChange={(e: Event) => {
                    this.listRecursive = (e.target as HTMLInputElement).checked;
                  }}
                />
                -r recursive
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                --depth
                <select
                  class="cli-select"
                  onChange={(e: Event) => {
                    this.listDepth = (e.target as HTMLSelectElement).value;
                  }}
                >
                  <option value="0" selected={this.listDepth === '0'}>
                    0 (direct only)
                  </option>
                  <option value="1" selected={this.listDepth === '1'}>
                    1
                  </option>
                  <option value="2" selected={this.listDepth === '2'}>
                    2
                  </option>
                  <option value="-1" selected={this.listDepth === '-1'}>
                    -1 (projects only)
                  </option>
                  <option value="Infinity" selected={this.listDepth === 'Infinity'}>
                    Infinity (all)
                  </option>
                </select>
              </label>
            </div>
            <div class="cli-cmd-preview text-sm mb-3">{listCmd}</div>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.exec(listCmd, () =>
                  pnpmService.list({ recursive: this.listRecursive, depth: this.listDepth === 'Infinity' ? undefined : Number(this.listDepth), filter: this.wsFilter }),
                )
              }
            >
              pnpm list
            </button>
          </div>

          {/* Why */}
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Why (dependency graph)</h3>
            <div class="flex flex-col gap-3 mb-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Package name
                <input
                  type="text"
                  class="cli-input"
                  placeholder="e.g. typescript"
                  value={this.whyPackage}
                  onInput={(e: Event) => {
                    this.whyPackage = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>
            <div class="cli-cmd-preview text-sm mb-3">{whyCmd}</div>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.exec(whyCmd, () => pnpmService.why(this.whyPackage))}>
              pnpm why
            </button>
          </div>

          {/* Recursive run */}
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Recursive Script Run</h3>
            <div class="flex flex-col gap-3 mb-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Script name
                <input
                  type="text"
                  class="cli-input"
                  placeholder="e.g. build, test"
                  value={this.wsScript}
                  onInput={(e: Event) => {
                    this.wsScript = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.wsParallel}
                  onChange={(e: Event) => {
                    this.wsParallel = (e.target as HTMLInputElement).checked;
                  }}
                />
                --parallel
              </label>
            </div>
            <div class="cli-cmd-preview text-sm mb-3">{runCmd}</div>
            <button type="button" class="cli-btn" onClick={() => this.exec(runCmd, () => pnpmService.run(this.wsScript, this.wsFilter))}>
              pnpm run -r
            </button>
          </div>

          {/* dedupe + doctor */}
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Maintenance</h3>
            <div class="flex flex-col gap-4">
              <div>
                <p class="text-text2 text-sm mb-2">Remove duplicate packages from the lockfile.</p>
                <div class="cli-cmd-preview text-sm mb-2">pnpm dedupe</div>
                <button type="button" class="cli-btn" onClick={() => this.exec('pnpm dedupe', () => pnpmService.dedupe())}>
                  pnpm dedupe
                </button>
              </div>
              <div>
                <p class="text-text2 text-sm mb-2">Check for issues with environment and config.</p>
                <div class="cli-cmd-preview text-sm mb-2">pnpm doctor</div>
                <button type="button" class="cli-btn cli-btn-success" onClick={() => this.exec('pnpm doctor', () => pnpmService.doctor())}>
                  pnpm doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Audit Tab ────────────────────────────────────────────────

  private renderAuditTab() {
    const auditCmd = buildAuditCommand(this.auditOpts);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Security Audit</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Minimum severity
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.auditOpts = { ...this.auditOpts, level: (e.target as HTMLSelectElement).value as PnpmAuditOptions['level'] };
                }}
              >
                <option value="" selected={this.auditOpts.level === ''}>
                  All (low+)
                </option>
                <option value="low" selected={this.auditOpts.level === 'low'}>
                  Low
                </option>
                <option value="moderate" selected={this.auditOpts.level === 'moderate'}>
                  Moderate
                </option>
                <option value="high" selected={this.auditOpts.level === 'high'}>
                  High
                </option>
                <option value="critical" selected={this.auditOpts.level === 'critical'}>
                  Critical
                </option>
              </select>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.auditOpts.dev}
                  onChange={(e: Event) => {
                    this.auditOpts = { ...this.auditOpts, dev: (e.target as HTMLInputElement).checked, prod: false };
                  }}
                />
                -D devOnly
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.auditOpts.prod}
                  onChange={(e: Event) => {
                    this.auditOpts = { ...this.auditOpts, prod: (e.target as HTMLInputElement).checked, dev: false };
                  }}
                />
                -P prodOnly
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.auditOpts.json}
                  onChange={(e: Event) => {
                    this.auditOpts = { ...this.auditOpts, json: (e.target as HTMLInputElement).checked };
                  }}
                />
                --json
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.auditOpts.fix}
                  onChange={(e: Event) => {
                    this.auditOpts = { ...this.auditOpts, fix: (e.target as HTMLInputElement).checked };
                  }}
                />
                --fix (add overrides)
              </label>
            </div>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{auditCmd}</div>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.exec(auditCmd, () =>
                  pnpmService.audit({
                    dev: this.auditOpts.dev,
                    prod: this.auditOpts.prod,
                    json: this.auditOpts.json,
                    level: this.auditOpts.level,
                    fix: this.auditOpts.fix,
                  }),
                )
              }
            >
              pnpm audit
            </button>
            {this.auditOpts.fix && <span class="cli-badge-sip">writes package.json</span>}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">About Audit</h3>
          <p class="text-text2 text-sm leading-relaxed">Checks installed packages against the npm advisory database for known vulnerabilities.</p>
          <ul class="mt-3 text-sm space-y-2 text-text2">
            <li>
              • <strong class="text-text">low</strong> — informational
            </li>
            <li>
              • <strong class="text-text">moderate</strong> — needs attention
            </li>
            <li>
              • <strong class="text-text">high</strong> — fix soon
            </li>
            <li>
              • <strong class="text-text">critical</strong> — fix immediately
            </li>
          </ul>
          <p class="mt-3 text-sm text-text2">
            Use <code>--fix</code> to auto-add <code>overrides</code> in package.json to pin non-vulnerable versions.
          </p>
        </div>
      </div>
    );
  }

  // ── Patch Tab ────────────────────────────────────────────────

  private renderPatchTab() {
    const patchCmd = buildPatchCommand(this.patchOpts);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Patch / Patch-Commit / Patch-Remove</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Action
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.patchOpts = { ...this.patchOpts, action: (e.target as HTMLSelectElement).value as PnpmPatchOptions['action'] };
                }}
              >
                <option value="patch" selected={this.patchOpts.action === 'patch'}>
                  patch — prepare for patching
                </option>
                <option value="patch-commit" selected={this.patchOpts.action === 'patch-commit'}>
                  patch-commit — commit the patch
                </option>
                <option value="patch-remove" selected={this.patchOpts.action === 'patch-remove'}>
                  patch-remove — remove a patch
                </option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              {this.patchOpts.action === 'patch'
                ? 'Package spec (name@version)'
                : this.patchOpts.action === 'patch-commit'
                  ? 'Edit directory path'
                  : 'Package spec to remove patch'}
              <input
                type="text"
                class="cli-input font-mono"
                placeholder={this.patchOpts.action === 'patch' ? 'e.g. lodash@4.17.21' : this.patchOpts.action === 'patch-commit' ? '/tmp/lodash@4.17.21' : 'e.g. lodash@4.17.21'}
                value={this.patchOpts.pkgOrDir}
                onInput={(e: Event) => {
                  this.patchOpts = { ...this.patchOpts, pkgOrDir: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{patchCmd}</div>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class={`cli-btn ${this.patchOpts.action === 'patch-remove' ? 'cli-btn-danger' : ''}`}
              onClick={() =>
                this.exec(
                  patchCmd,
                  () => {
                    if (this.patchOpts.action === 'patch') return pnpmService.patch(this.patchOpts.pkgOrDir);
                    if (this.patchOpts.action === 'patch-commit') return pnpmService.patchCommit(this.patchOpts.pkgOrDir);
                    return pnpmService.patchRemove(this.patchOpts.pkgOrDir);
                  },
                  this.patchOpts.action === 'patch-remove',
                )
              }
            >
              {patchCmd}
            </button>
            {this.patchOpts.action === 'patch-remove' && <span class="cli-badge-sip">destructive</span>}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Patch Workflow</h3>
          <ol class="text-sm space-y-3 text-text2">
            <li class="flex gap-2">
              <span class="text-accent font-bold">1.</span>
              <div>
                <code class="text-text">pnpm patch lodash@4.17.21</code>
                <p class="text-xs mt-1">Extracts the package to a temp dir for editing.</p>
              </div>
            </li>
            <li class="flex gap-2">
              <span class="text-accent font-bold">2.</span>
              <div>Edit files in the output directory.</div>
            </li>
            <li class="flex gap-2">
              <span class="text-accent font-bold">3.</span>
              <div>
                <code class="text-text">pnpm patch-commit /tmp/lodash@4.17.21</code>
                <p class="text-xs mt-1">Generates a .patch file and adds it to pnpm-workspace.yaml.</p>
              </div>
            </li>
            <li class="flex gap-2">
              <span class="text-accent font-bold">4.</span>
              <div>
                <code class="text-text">pnpm patch-remove lodash@4.17.21</code>
                <p class="text-xs mt-1">Removes the patch from the project.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // ── Store Tab ────────────────────────────────────────────────

  private renderStoreTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Store Commands</h3>
          <div class="flex flex-col gap-4">
            <div>
              <p class="text-text2 text-sm mb-2">Show path to the content-addressable store.</p>
              <div class="cli-cmd-preview text-sm mb-2">pnpm store path</div>
              <button type="button" class="cli-btn cli-btn-success" onClick={() => this.exec('pnpm store path', () => pnpmService.storePath())}>
                store path
              </button>
            </div>
            <div>
              <p class="text-text2 text-sm mb-2">Check for modified packages in the store (exits 0 if all OK).</p>
              <div class="cli-cmd-preview text-sm mb-2">pnpm store status</div>
              <button type="button" class="cli-btn cli-btn-success" onClick={() => this.exec('pnpm store status', () => pnpmService.storeStatus())}>
                store status
              </button>
            </div>
            <div>
              <p class="text-text2 text-sm mb-2">Remove unreferenced packages. Safe, but future installs may be slower.</p>
              <div class="cli-cmd-preview text-sm mb-2">pnpm store prune</div>
              <div class="flex gap-2 flex-wrap">
                <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.exec('pnpm store prune', () => pnpmService.storePrune(false), true)}>
                  store prune
                </button>
                <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.exec('pnpm store prune --force', () => pnpmService.storePrune(true), true)}>
                  store prune --force
                </button>
              </div>
              <p class="text-xs text-danger mt-2">--force also removes alien directories not created by pnpm.</p>
            </div>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">About the Store</h3>
          <p class="text-text2 text-sm leading-relaxed">
            pnpm uses a content-addressable store to deduplicate packages across projects. All packages are stored once and hard-linked into <code>node_modules</code>.
          </p>
          <p class="text-text2 text-sm leading-relaxed mt-3">
            <strong class="text-text">store prune</strong> is non-destructive for active projects — it only removes packages that are no longer referenced by any lockfile on disk.
          </p>
          <p class="text-text2 text-sm leading-relaxed mt-3">
            <strong class="text-text">store status</strong> verifies integrity of cached packages (detects manual edits).
          </p>
        </div>
      </div>
    );
  }

  // ── Publish Tab ──────────────────────────────────────────────

  private renderPublishTab() {
    const publishCmd = buildPublishCommand(this.publishOpts);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Publish to Registry</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.publishOpts.dryRun}
                onChange={(e: Event) => {
                  this.publishOpts = { ...this.publishOpts, dryRun: (e.target as HTMLInputElement).checked };
                }}
              />
              --dry-run (simulate, no publish)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.publishOpts.recursive}
                onChange={(e: Event) => {
                  this.publishOpts = { ...this.publishOpts, recursive: (e.target as HTMLInputElement).checked };
                }}
              />
              -r recursive (all workspace pkgs)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.publishOpts.noGitChecks}
                onChange={(e: Event) => {
                  this.publishOpts = { ...this.publishOpts, noGitChecks: (e.target as HTMLInputElement).checked };
                }}
              />
              --no-git-checks (skip branch/dirty checks)
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --tag
              <input
                type="text"
                class="cli-input"
                placeholder="latest (default)"
                value={this.publishOpts.tag}
                onInput={(e: Event) => {
                  this.publishOpts = { ...this.publishOpts, tag: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              --access
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.publishOpts = { ...this.publishOpts, access: (e.target as HTMLSelectElement).value as PnpmPublishOptions['access'] };
                }}
              >
                <option value="" selected={this.publishOpts.access === ''}>
                  Default
                </option>
                <option value="public" selected={this.publishOpts.access === 'public'}>
                  public
                </option>
                <option value="restricted" selected={this.publishOpts.access === 'restricted'}>
                  restricted
                </option>
              </select>
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{publishCmd}</div>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class={`cli-btn ${!this.publishOpts.dryRun ? 'cli-btn-danger' : ''}`}
              onClick={() =>
                this.exec(
                  publishCmd,
                  () =>
                    pnpmService.publish({
                      dryRun: this.publishOpts.dryRun,
                      tag: this.publishOpts.tag,
                      access: this.publishOpts.access,
                      recursive: this.publishOpts.recursive,
                      noGitChecks: this.publishOpts.noGitChecks,
                    }),
                  !this.publishOpts.dryRun,
                )
              }
            >
              pnpm publish
            </button>
            {!this.publishOpts.dryRun && <span class="cli-badge-sip">publishes to registry</span>}
            {this.publishOpts.dryRun && <span class="cli-badge-safe">dry-run</span>}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Link / Unlink</h3>
          <div class="flex flex-col gap-4">
            <div>
              <p class="text-text2 text-sm mb-2">Link the current project globally or link a local directory as a dependency.</p>
              <div class="cli-cmd-preview text-sm mb-2">pnpm link</div>
              <button type="button" class="cli-btn" onClick={() => this.exec('pnpm link', () => pnpmService.link())}>
                pnpm link
              </button>
            </div>
            <div>
              <p class="text-text2 text-sm mb-2">Remove linked package and reinstall from registry.</p>
              <div class="cli-cmd-preview text-sm mb-2">pnpm unlink</div>
              <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.exec('pnpm unlink', () => pnpmService.unlink())}>
                pnpm unlink
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Config Tab ───────────────────────────────────────────────

  private renderConfigTab() {
    const configCmd = buildConfigCommand(this.configOpts);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Config Management</h3>
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Action
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.configOpts = { ...this.configOpts, action: (e.target as HTMLSelectElement).value as PnpmConfigOptions['action'] };
                }}
              >
                <option value="list" selected={this.configOpts.action === 'list'}>
                  list — show all settings
                </option>
                <option value="get" selected={this.configOpts.action === 'get'}>
                  get — read a key
                </option>
                <option value="set" selected={this.configOpts.action === 'set'}>
                  set — write a key
                </option>
                <option value="delete" selected={this.configOpts.action === 'delete'}>
                  delete — remove a key
                </option>
              </select>
            </label>

            {this.configOpts.action !== 'list' && (
              <label class="flex flex-col gap-1 text-sm text-text2">
                Key
                <input
                  type="text"
                  class="cli-input font-mono"
                  placeholder="e.g. store-dir, registry, node-linker"
                  value={this.configOpts.key}
                  onInput={(e: Event) => {
                    this.configOpts = { ...this.configOpts, key: (e.target as HTMLInputElement).value };
                  }}
                />
              </label>
            )}

            {this.configOpts.action === 'set' && (
              <label class="flex flex-col gap-1 text-sm text-text2">
                Value
                <input
                  type="text"
                  class="cli-input font-mono"
                  placeholder="e.g. hoisted, https://registry.npmjs.org/"
                  value={this.configOpts.value}
                  onInput={(e: Event) => {
                    this.configOpts = { ...this.configOpts, value: (e.target as HTMLInputElement).value };
                  }}
                />
              </label>
            )}

            {this.configOpts.action === 'list' && (
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.configOpts.json}
                  onChange={(e: Event) => {
                    this.configOpts = { ...this.configOpts, json: (e.target as HTMLInputElement).checked };
                  }}
                />
                --json
              </label>
            )}

            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.configOpts.global}
                onChange={(e: Event) => {
                  this.configOpts = { ...this.configOpts, global: (e.target as HTMLInputElement).checked };
                }}
              />
              -g global config
            </label>
          </div>
          <div class="cli-cmd-preview text-sm mb-3">{configCmd}</div>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class={`cli-btn ${this.configOpts.action === 'delete' ? 'cli-btn-danger' : this.configOpts.action === 'list' || this.configOpts.action === 'get' ? 'cli-btn-success' : ''}`}
              onClick={() => {
                const opts = this.configOpts;
                this.exec(
                  configCmd,
                  () => {
                    if (opts.action === 'list') return pnpmService.configList(opts.json);
                    if (opts.action === 'get') return pnpmService.configGet(opts.key);
                    if (opts.action === 'set') return pnpmService.configSet(opts.key, opts.value, opts.global);
                    return pnpmService.configDelete(opts.key, opts.global);
                  },
                  opts.action === 'delete',
                );
              }}
            >
              pnpm config {this.configOpts.action}
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Common Config Keys</h3>
          <div class="space-y-2 text-sm">
            {[
              { key: 'registry', desc: 'Package registry URL' },
              { key: 'store-dir', desc: 'Path to the store directory' },
              { key: 'node-linker', desc: 'hoisted | isolated | pnp' },
              { key: 'shamefully-hoist', desc: 'Hoist all deps to root node_modules' },
              { key: 'public-hoist-pattern', desc: 'Packages to hoist (glob)' },
              { key: 'auto-install-peers', desc: 'Auto-install missing peer deps' },
              { key: 'prefer-frozen-lockfile', desc: 'Fail if lockfile would change' },
              { key: 'strict-peer-dependencies', desc: 'Error on unmet peer deps' },
              { key: 'package-manager-strict', desc: 'Enforce packageManager field' },
            ].map(item => (
              <div key={item.key} class="flex justify-between items-center p-2 bg-bg3 rounded">
                <code class="text-info text-xs">{item.key}</code>
                <span class="text-text2 text-xs ml-2 text-right">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🚀</span> pnpm GUI
          </h2>
          <p class="text-text2 text-sm">Visual interface for pnpm — Performant npm</p>
        </header>

        <div class="flex flex-wrap gap-1 border-b border-accent2 mb-4 pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`cli-tab${this.activeTab === tab.id ? ' cli-tab-active' : ''}`}
              onClick={() => {
                this.activeTab = tab.id;
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div class="tab-content">
          {this.activeTab === 'install' && this.renderInstallTab()}
          {this.activeTab === 'scripts' && this.renderScriptsTab()}
          {this.activeTab === 'workspaces' && this.renderWorkspacesTab()}
          {this.activeTab === 'audit' && this.renderAuditTab()}
          {this.activeTab === 'patch' && this.renderPatchTab()}
          {this.activeTab === 'store' && this.renderStoreTab()}
          {this.activeTab === 'publish' && this.renderPublishTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }
}
