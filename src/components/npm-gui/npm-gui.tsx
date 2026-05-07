import { Component, h, State } from '@stencil/core';
import { validatePackageSpec } from '../../npm/npm-command-builders';
import {
  buildConfigCmd,
  buildInstallCmd,
  buildPublishCmd,
  buildRunCmd,
  buildUninstallCmd,
  buildUpdateCmd,
  buildVersionCmd,
  type NpmInstallFlags,
  type NpmVersionBump,
} from '../../npm/npm-service';
import { executeCommand } from '../../yabai/yabai-service';

type CommandStatus = 'idle' | 'running' | 'success' | 'error';

type ActiveTab = 'install' | 'scripts' | 'audit' | 'versioning' | 'publish' | 'workspaces' | 'config' | 'auth';

const TAB_DEFINITIONS: { id: ActiveTab; label: string }[] = [
  { id: 'install', label: 'Install/Uninstall' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'audit', label: 'Audit' },
  { id: 'versioning', label: 'Versioning' },
  { id: 'publish', label: 'Publish' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'config', label: 'Config' },
  { id: 'auth', label: 'Auth' },
];

@Component({
  tag: 'npm-gui',
  styleUrl: 'npm-gui.css',
  scoped: true,
})
export class NpmGui {
  // ── Global state ──────────────────────────────────────────────
  @State() activeTab: ActiveTab = 'install';
  @State() status: CommandStatus = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select an action to execute an npm command.';
  @State() statusMessage = 'Ready';

  // ── Install/Uninstall tab ─────────────────────────────────────
  @State() installPackages = '';
  @State() installFlags: NpmInstallFlags = {};
  @State() installWorkspace = '';
  @State() uninstallPackages = '';
  @State() uninstallGlobal = false;
  @State() uninstallWorkspace = '';
  @State() updatePackages = '';
  @State() updateGlobal = false;
  @State() lsDepth = 1;
  @State() lsGlobal = false;
  @State() outdatedGlobal = false;
  @State() viewPackage = '';
  @State() viewField = '';
  @State() searchTerm = '';
  @State() linkPackage = '';

  // ── Scripts tab ───────────────────────────────────────────────
  @State() scriptName = '';
  @State() scriptWorkspace = '';
  @State() scriptAllWorkspaces = false;
  @State() execPackage = '';
  @State() execArgs = '';
  @State() initName = '';
  @State() initYes = false;

  // ── Audit tab ─────────────────────────────────────────────────
  // (no extra state needed)

  // ── Versioning tab ────────────────────────────────────────────
  @State() versionBump: NpmVersionBump = 'patch';
  @State() versionNoGitTag = false;
  @State() versionPreid = '';

  // ── Publish tab ───────────────────────────────────────────────
  @State() publishTag = '';
  @State() publishAccess: '' | 'public' | 'restricted' = '';
  @State() publishDryRun = false;

  // ── Workspaces tab ────────────────────────────────────────────
  @State() wsInstallPackages = '';
  @State() wsInstallFlags: NpmInstallFlags = {};
  @State() wsTarget = '';
  @State() wsScript = '';
  @State() wsAllWorkspaces = false;

  // ── Config tab ────────────────────────────────────────────────
  @State() configKey = '';
  @State() configValue = '';

  // ── Auth tab ─────────────────────────────────────────────────
  @State() tokenId = '';
  @State() tokenCidr = '';
  @State() pkgKey = '';
  @State() pkgValue = '';

  // ── Validation ───────────────────────────────────────────────
  @State() validationError = '';

  // ── Helpers ──────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private async run(cmd: string, confirm = false): Promise<void> {
    if (confirm) {
      if (typeof window === 'undefined' || !window.confirm(`Execute: ${cmd}?`)) return;
    }
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running...';
    this.statusMessage = 'Running...';
    try {
      const result = await executeCommand(cmd);
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

  private validate(packages: string): boolean {
    if (!packages.trim()) return true; // empty = install all, valid
    const result = validatePackageSpec(packages.trim().split(/\s+/)[0]);
    if (!result.valid) {
      this.validationError = result.error ?? 'Invalid package spec';
      return false;
    }
    this.validationError = '';
    return true;
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
    this.output = 'Select an action to execute an npm command.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
    this.validationError = '';
  }

  // ── Render helpers ────────────────────────────────────────────

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button
        type="button"
        key={tab.id}
        class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
        onClick={() => {
          this.activeTab = tab.id;
          this.validationError = '';
        }}
      >
        {tab.label}
      </button>
    ));
  }

  renderOutputPanel() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-info' : '';
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

  // ── Tab: Install/Uninstall ────────────────────────────────────

  renderInstallTab() {
    const installCmd = buildInstallCmd(this.installPackages, this.installFlags, this.installWorkspace || undefined);
    const uninstallCmd = buildUninstallCmd(this.uninstallPackages, this.uninstallGlobal, this.uninstallWorkspace || undefined);
    const updateCmd = buildUpdateCmd(this.updatePackages, this.updateGlobal);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Install */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Install <span class="cli-badge-safe">query</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Package(s) — leave empty to install all dependencies
            <input
              type="text"
              class={`cli-input w-full font-mono ${this.validationError ? 'cli-input-invalid' : ''}`}
              placeholder="react react-dom  or  lodash@4.17"
              value={this.installPackages}
              onInput={(e: Event) => {
                this.installPackages = (e.target as HTMLInputElement).value;
                this.validationError = '';
              }}
            />
            {this.validationError && <span class="cli-validation-message invalid">{this.validationError}</span>}
          </label>

          <div class="grid grid-cols-2 gap-2 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.installFlags.saveDev}
                onChange={(e: Event) => {
                  this.installFlags = { ...this.installFlags, saveDev: (e.target as HTMLInputElement).checked };
                }}
              />
              --save-dev (-D)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.installFlags.savePeer}
                onChange={(e: Event) => {
                  this.installFlags = { ...this.installFlags, savePeer: (e.target as HTMLInputElement).checked };
                }}
              />
              --save-peer
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.installFlags.saveExact}
                onChange={(e: Event) => {
                  this.installFlags = { ...this.installFlags, saveExact: (e.target as HTMLInputElement).checked };
                }}
              />
              --save-exact (-E)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.installFlags.global}
                onChange={(e: Event) => {
                  this.installFlags = { ...this.installFlags, global: (e.target as HTMLInputElement).checked };
                }}
              />
              --global (-g)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 col-span-2">
              <input
                type="checkbox"
                checked={this.installFlags.legacyPeerDeps}
                onChange={(e: Event) => {
                  this.installFlags = { ...this.installFlags, legacyPeerDeps: (e.target as HTMLInputElement).checked };
                }}
              />
              --legacy-peer-deps
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Workspace (-w)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="packages/app"
              value={this.installWorkspace}
              onInput={(e: Event) => {
                this.installWorkspace = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{installCmd}</div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (this.validate(this.installPackages)) this.run(installCmd);
              }}
            >
              Install
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm ci')}>
              npm ci
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm install')}>
              Install All
            </button>
          </div>
        </div>

        {/* Uninstall */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Uninstall <span class="cli-badge-sip">action</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Package(s)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="lodash  or  react react-dom"
              value={this.uninstallPackages}
              onInput={(e: Event) => {
                this.uninstallPackages = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex gap-4 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.uninstallGlobal}
                onChange={(e: Event) => {
                  this.uninstallGlobal = (e.target as HTMLInputElement).checked;
                }}
              />
              --global
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Workspace (-w)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="packages/app"
              value={this.uninstallWorkspace}
              onInput={(e: Event) => {
                this.uninstallWorkspace = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{uninstallCmd}</div>

          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (!this.uninstallPackages.trim()) return;
              this.run(uninstallCmd, true);
            }}
          >
            Uninstall
          </button>
        </div>

        {/* Update */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Update <span class="cli-badge-sip">action</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Package(s) — empty = update all
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="react  or  leave empty for all"
              value={this.updatePackages}
              onInput={(e: Event) => {
                this.updatePackages = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.updateGlobal}
              onChange={(e: Event) => {
                this.updateGlobal = (e.target as HTMLInputElement).checked;
              }}
            />
            --global
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{updateCmd}</div>

          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.run(updateCmd)}>
              Update
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm dedupe')}>
              Dedupe
            </button>
          </div>
        </div>

        {/* Query */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Query <span class="cli-badge-safe">query</span>
          </h3>

          <div class="mb-4">
            <p class="text-sm text-text2 mb-2">List installed packages</p>
            <div class="flex gap-3 items-center mb-2">
              <label class="text-sm text-text2">
                Depth:
                <input
                  type="number"
                  class="cli-input w-16 ml-2"
                  min="0"
                  max="10"
                  value={this.lsDepth}
                  onInput={(e: Event) => {
                    this.lsDepth = parseInt((e.target as HTMLInputElement).value, 10) || 1;
                  }}
                />
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.lsGlobal}
                  onChange={(e: Event) => {
                    this.lsGlobal = (e.target as HTMLInputElement).checked;
                  }}
                />
                Global
              </label>
            </div>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run(`npm ls --depth=${this.lsDepth}${this.lsGlobal ? ' --global' : ''}`)}>
              npm ls
            </button>
          </div>

          <div class="mb-4 border-t border-accent2 pt-4">
            <p class="text-sm text-text2 mb-2">Outdated packages</p>
            <div class="flex gap-3 items-center mb-2">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.outdatedGlobal}
                  onChange={(e: Event) => {
                    this.outdatedGlobal = (e.target as HTMLInputElement).checked;
                  }}
                />
                Global
              </label>
            </div>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run(`npm outdated${this.outdatedGlobal ? ' --global' : ''}`)}>
              npm outdated
            </button>
          </div>

          <div class="mb-4 border-t border-accent2 pt-4">
            <p class="text-sm text-text2 mb-2">View package info</p>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                class="cli-input flex-1 font-mono"
                placeholder="react"
                value={this.viewPackage}
                onInput={(e: Event) => {
                  this.viewPackage = (e.target as HTMLInputElement).value;
                }}
              />
              <input
                type="text"
                class="cli-input w-24 font-mono"
                placeholder="version"
                value={this.viewField}
                onInput={(e: Event) => {
                  this.viewField = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                if (this.viewPackage.trim()) this.run(`npm view ${this.viewPackage.trim()}${this.viewField ? ` ${this.viewField}` : ''}`);
              }}
            >
              npm view
            </button>
          </div>

          <div class="border-t border-accent2 pt-4">
            <p class="text-sm text-text2 mb-2">Search registry</p>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                class="cli-input flex-1 font-mono"
                placeholder="search term"
                value={this.searchTerm}
                onInput={(e: Event) => {
                  this.searchTerm = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                if (this.searchTerm.trim()) this.run(`npm search ${this.searchTerm.trim()}`);
              }}
            >
              npm search
            </button>
          </div>
        </div>

        {/* Link */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">
            Link / Unlink <span class="cli-badge-sip">action</span>
          </h3>
          <div class="flex gap-3 items-end">
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Package name (empty = link current dir)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="my-local-package"
                value={this.linkPackage}
                onInput={(e: Event) => {
                  this.linkPackage = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.run(`npm link${this.linkPackage.trim() ? ` ${this.linkPackage.trim()}` : ''}`)}>
              npm link
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run(`npm unlink${this.linkPackage.trim() ? ` ${this.linkPackage.trim()}` : ''}`, true)}>
              npm unlink
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Scripts ──────────────────────────────────────────────

  renderScriptsTab() {
    const runCmd = buildRunCmd(this.scriptName, this.scriptWorkspace || undefined, this.scriptAllWorkspaces);
    const execCmd = `npm exec -- ${this.execPackage}${this.execArgs.trim() ? ` ${this.execArgs.trim()}` : ''}`;

    const QUICK_SCRIPTS = ['start', 'build', 'test', 'lint', 'dev', 'format', 'typecheck', 'preview'];

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* run-script */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Run Script <span class="cli-badge-sip">action</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Script name
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="build"
              value={this.scriptName}
              onInput={(e: Event) => {
                this.scriptName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Workspace (-w)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="packages/app"
              value={this.scriptWorkspace}
              onInput={(e: Event) => {
                this.scriptWorkspace = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.scriptAllWorkspaces}
              onChange={(e: Event) => {
                this.scriptAllWorkspaces = (e.target as HTMLInputElement).checked;
              }}
            />
            --workspaces (all)
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{runCmd}</div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (this.scriptName.trim()) this.run(runCmd);
            }}
          >
            Run
          </button>
        </div>

        {/* Quick scripts */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Quick Scripts</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_SCRIPTS.map(s => (
              <button
                key={s}
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  this.scriptName = s;
                  this.run(`npm run ${s}`);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* exec / npx */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            exec / npx <span class="cli-badge-safe">query</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Package
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="create-react-app"
              value={this.execPackage}
              onInput={(e: Event) => {
                this.execPackage = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Arguments
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="my-app --template typescript"
              value={this.execArgs}
              onInput={(e: Event) => {
                this.execArgs = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{execCmd}</div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (this.execPackage.trim()) this.run(execCmd);
            }}
          >
            exec
          </button>
        </div>

        {/* init / create */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Init / Create <span class="cli-badge-sip">action</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Template (npm create) — empty = npm init
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="vite@latest"
              value={this.initName}
              onInput={(e: Event) => {
                this.initName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.initYes}
              onChange={(e: Event) => {
                this.initYes = (e.target as HTMLInputElement).checked;
              }}
            />
            -y (accept defaults)
          </label>

          <div class="flex gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                const cmd = this.initName.trim() ? `npm create ${this.initName.trim()}` : `npm init${this.initYes ? ' -y' : ''}`;
                this.run(cmd);
              }}
            >
              Init / Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Audit ────────────────────────────────────────────────

  renderAuditTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Security Audit <span class="cli-badge-safe">query</span>
          </h3>
          <p class="text-sm text-text2 mb-4">Scan installed packages for known vulnerabilities.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('npm audit')}>
              npm audit
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.run('npm audit fix', true)}>
              audit fix
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run('npm audit fix --force', true)}>
              audit fix --force
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Health &amp; Maintenance <span class="cli-badge-safe">query</span>
          </h3>
          <p class="text-sm text-text2 mb-4">Inspect project health and funding.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('npm doctor')}>
              npm doctor
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm fund')}>
              npm fund
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm cache verify')}>
              cache verify
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run('npm cache clean --force', true)}>
              cache clean
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Versioning ───────────────────────────────────────────

  renderVersioningTab() {
    const BUMPS: NpmVersionBump[] = ['patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'];
    const versionCmd = buildVersionCmd(this.versionBump, this.versionNoGitTag, this.versionPreid || undefined);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Version Bump <span class="cli-badge-danger">destructive</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Bump type
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.versionBump = (e.target as HTMLSelectElement).value as NpmVersionBump;
              }}
            >
              {BUMPS.map(b => (
                <option key={b} value={b} selected={this.versionBump === b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.versionNoGitTag}
              onChange={(e: Event) => {
                this.versionNoGitTag = (e.target as HTMLInputElement).checked;
              }}
            />
            --no-git-tag-version
          </label>

          {(this.versionBump === 'prerelease' || this.versionBump.startsWith('pre')) && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Pre-release id (--preid)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="alpha"
                value={this.versionPreid}
                onInput={(e: Event) => {
                  this.versionPreid = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          )}

          <div class="cli-cmd-preview text-xs mb-3">{versionCmd}</div>

          <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run(versionCmd, true)}>
            Bump Version
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Quick Bumps <span class="cli-badge-danger">destructive</span>
          </h3>
          <p class="text-sm text-text2 mb-4">One-click version bumps. Each will confirm before executing.</p>
          <div class="grid grid-cols-3 gap-2">
            {(['patch', 'minor', 'major'] as NpmVersionBump[]).map(b => (
              <button key={b} type="button" class="cli-btn cli-btn-sm cli-btn-danger" onClick={() => this.run(`npm version ${b}`, true)}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Publish ──────────────────────────────────────────────

  renderPublishTab() {
    const publishCmd = buildPublishCmd(this.publishTag || undefined, this.publishAccess || undefined, this.publishDryRun);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Publish <span class="cli-badge-danger">destructive</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Tag (--tag)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="latest  or  beta"
              value={this.publishTag}
              onInput={(e: Event) => {
                this.publishTag = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Access (--access)
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.publishAccess = (e.target as HTMLSelectElement).value as '' | 'public' | 'restricted';
              }}
            >
              <option value="">— default —</option>
              <option value="public">public</option>
              <option value="restricted">restricted</option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.publishDryRun}
              onChange={(e: Event) => {
                this.publishDryRun = (e.target as HTMLInputElement).checked;
              }}
            />
            --dry-run
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{publishCmd}</div>

          <div class="flex gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                this.publishDryRun = true;
                this.run(buildPublishCmd(this.publishTag || undefined, this.publishAccess || undefined, true));
              }}
            >
              Dry Run
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run(publishCmd, true)}>
              Publish
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Pack <span class="cli-badge-safe">query</span>
          </h3>
          <p class="text-sm text-text2 mb-4">Create a tarball from the package without publishing.</p>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('npm pack')}>
            npm pack
          </button>
        </div>
      </div>
    );
  }

  // ── Tab: Workspaces ───────────────────────────────────────────

  renderWorkspacesTab() {
    const wsInstallCmd = buildInstallCmd(this.wsInstallPackages, this.wsInstallFlags, this.wsTarget || undefined);
    const wsRunCmd = buildRunCmd(this.wsScript, this.wsTarget || undefined, this.wsAllWorkspaces);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Workspace Info <span class="cli-badge-safe">query</span>
          </h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('npm query .workspace')}>
              List workspaces
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm ls --workspaces')}>
              ls --workspaces
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm prefix')}>
              npm prefix
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Install in Workspace <span class="cli-badge-sip">action</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Workspace path (-w)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="packages/app"
              value={this.wsTarget}
              onInput={(e: Event) => {
                this.wsTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Package(s)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="lodash"
              value={this.wsInstallPackages}
              onInput={(e: Event) => {
                this.wsInstallPackages = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex gap-3 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.wsInstallFlags.saveDev}
                onChange={(e: Event) => {
                  this.wsInstallFlags = { ...this.wsInstallFlags, saveDev: (e.target as HTMLInputElement).checked };
                }}
              />
              --save-dev
            </label>
          </div>

          <div class="cli-cmd-preview text-xs mb-3">{wsInstallCmd}</div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(wsInstallCmd)}>
            Install
          </button>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">
            Run Script in Workspace <span class="cli-badge-sip">action</span>
          </h3>

          <div class="flex gap-3 items-end flex-wrap">
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Script name
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="build"
                value={this.wsScript}
                onInput={(e: Event) => {
                  this.wsScript = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Workspace (-w)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="packages/app"
                value={this.wsTarget}
                onInput={(e: Event) => {
                  this.wsTarget = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.wsAllWorkspaces}
                onChange={(e: Event) => {
                  this.wsAllWorkspaces = (e.target as HTMLInputElement).checked;
                }}
              />
              --workspaces (all)
            </label>
          </div>

          <div class="cli-cmd-preview text-xs mt-3 mb-3">{wsRunCmd}</div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (this.wsScript.trim()) this.run(wsRunCmd);
            }}
          >
            Run
          </button>
        </div>
      </div>
    );
  }

  // ── Tab: Config ───────────────────────────────────────────────

  renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Config Get / List <span class="cli-badge-safe">query</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Key (empty = list all)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="registry"
              value={this.configKey}
              onInput={(e: Event) => {
                this.configKey = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(buildConfigCmd(this.configKey.trim() ? 'get' : 'list', this.configKey.trim()))}>
              {this.configKey.trim() ? 'config get' : 'config list'}
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('npm config list')}>
              List All
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Config Set <span class="cli-badge-sip">action</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Key
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="registry"
              value={this.configKey}
              onInput={(e: Event) => {
                this.configKey = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Value
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="https://registry.npmjs.org/"
              value={this.configValue}
              onInput={(e: Event) => {
                this.configValue = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{buildConfigCmd('set', this.configKey, this.configValue)}</div>

          <button
            type="button"
            class="cli-btn cli-btn-warning"
            onClick={() => {
              if (this.configKey.trim() && this.configValue.trim()) {
                this.run(buildConfigCmd('set', this.configKey.trim(), this.configValue.trim()), true);
              }
            }}
          >
            config set
          </button>
        </div>

        {/* pkg */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">
            pkg — package.json manipulation <span class="cli-badge-sip">action</span>
          </h3>
          <div class="flex gap-3 items-end flex-wrap">
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Key (e.g. <code>version</code>, <code>scripts.build</code>)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="version"
                value={this.pkgKey}
                onInput={(e: Event) => {
                  this.pkgKey = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Value (for set)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="1.0.0"
                value={this.pkgValue}
                onInput={(e: Event) => {
                  this.pkgValue = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <div class="flex gap-2 mt-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(`npm pkg get${this.pkgKey.trim() ? ` ${this.pkgKey.trim()}` : ''}`)}>
              pkg get
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              onClick={() => {
                if (this.pkgKey.trim() && this.pkgValue.trim()) {
                  this.run(`npm pkg set ${this.pkgKey.trim()}="${this.pkgValue.trim()}"`, true);
                }
              }}
            >
              pkg set
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: Auth ─────────────────────────────────────────────────

  renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Authentication <span class="cli-badge-safe">query</span>
          </h3>
          <p class="text-sm text-text2 mb-4">Manage your npm account session.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('npm whoami')}>
              whoami
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.run('npm login')}>
              login
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run('npm logout', true)}>
              logout
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            Tokens <span class="cli-badge-sip">action</span>
          </h3>

          <div class="mb-4">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run('npm token list')}>
              token list
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            CIDR whitelist (for create, optional)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="192.168.1.0/24"
              value={this.tokenCidr}
              onInput={(e: Event) => {
                this.tokenCidr = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-warning mb-4"
            onClick={() => {
              const cmd = `npm token create${this.tokenCidr.trim() ? ` --cidr=${this.tokenCidr.trim()}` : ''}`;
              this.run(cmd, true);
            }}
          >
            token create
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Token ID (for revoke)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="token-id"
              value={this.tokenId}
              onInput={(e: Event) => {
                this.tokenId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (this.tokenId.trim()) this.run(`npm token revoke ${this.tokenId.trim()}`, true);
            }}
          >
            token revoke
          </button>
        </div>
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>📦</span> npm GUI
            <span class="text-sm font-normal text-text2">Node package manager</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for npm — install, script, audit, publish, config, auth</p>
        </header>

        <div class="flex flex-wrap gap-1 border-b border-accent2 mb-4 pb-1">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'install' && this.renderInstallTab()}
          {this.activeTab === 'scripts' && this.renderScriptsTab()}
          {this.activeTab === 'audit' && this.renderAuditTab()}
          {this.activeTab === 'versioning' && this.renderVersioningTab()}
          {this.activeTab === 'publish' && this.renderPublishTab()}
          {this.activeTab === 'workspaces' && this.renderWorkspacesTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'auth' && this.renderAuthTab()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }
}
