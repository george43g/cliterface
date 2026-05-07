import { Component, h, State } from '@stencil/core';
import {
  APP_PLATFORMS,
  buildDeployCommand,
  buildEmulatorCommand,
  buildFunctionsLogCommand,
  DEPLOY_TARGETS,
  EMULATOR_OPTIONS,
  INIT_FEATURES,
} from '../../firebase/firebase-command-builders';
import { getFirebaseManPage } from '../../firebase/firebase-documentation';
import { type CommandResult, firebaseService } from '../../firebase/firebase-service';

const TAB_DEFINITIONS = [
  { id: 'auth', label: 'Auth' },
  { id: 'projects', label: 'Projects' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'functions', label: 'Functions' },
  { id: 'firestore', label: 'Firestore/RTDB' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'emulators', label: 'Emulators' },
  { id: 'extensions', label: 'Extensions' },
  { id: 'apps', label: 'Apps' },
  { id: 'docs', label: 'Docs' },
  { id: 'raw', label: 'Raw' },
];

@Component({
  tag: 'firebase-gui',
  styleUrl: 'firebase-gui.css',
  scoped: true,
})
export class FirebaseGui {
  @State() activeTab = 'auth';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() output = 'Select a command to get started.';
  @State() lastCommand = 'Ready...';
  @State() statusMessage = 'Ready';

  // Auth tab
  @State() logoutEmail = '';

  // Projects tab
  @State() projectId = '';
  @State() projectAlias = '';

  // Deploy tab
  @State() deployProject = '';
  @State() deployMessage = '';
  @State() deployOnly: string[] = [];
  @State() deployExcept: string[] = [];
  @State() deployForce = false;
  @State() deployDryRun = false;

  // Functions tab
  @State() functionsProject = '';
  @State() functionsLogOnly = '';
  @State() functionsLogLines = 50;

  // Firestore tab
  @State() firestoreProject = '';
  @State() firestorePath = '';
  @State() firestoreRecursive = false;
  @State() firestoreForce = false;
  // RTDB tab
  @State() rtdbPath = '/';
  @State() rtdbProject = '';

  // Hosting tab
  @State() hostingProject = '';
  @State() hostingChannelId = '';

  // Emulators tab
  @State() emulatorSelected: string[] = [];
  @State() emulatorImportDir = '';

  // Apps tab
  @State() appPlatform = 'WEB';
  @State() appDisplayName = '';
  @State() appListPlatform = '';

  // Init tab (inside Projects)
  @State() initFeatures: string[] = [];

  // Raw tab
  @State() rawCommand = '';

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private setTemporaryStatus(msg: string): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = 'Ready';
      }, 2500);
    }
  }

  private async run(label: string, fn: () => Promise<CommandResult>, confirm = false): Promise<void> {
    if (confirm && typeof window !== 'undefined' && !window.confirm(`Execute: ${label}?`)) return;
    this.status = 'running';
    this.lastCommand = label;
    this.output = 'Running...';
    this.statusMessage = 'Running...';
    try {
      const result = await fn();
      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `[stderr]\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Exit ${result.exitCode}`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private toggleSet(current: string[], value: string): string[] {
    return current.includes(value) ? current.filter(v => v !== value) : [...current, value];
  }

  private deployCommandPreview(): string {
    return buildDeployCommand({
      projectId: this.deployProject || undefined,
      only: this.deployOnly.length > 0 ? this.deployOnly : undefined,
      except: this.deployExcept.length > 0 ? this.deployExcept : undefined,
      message: this.deployMessage || undefined,
      force: this.deployForce,
      dryRun: this.deployDryRun,
    });
  }

  private emulatorCommandPreview(): string {
    return buildEmulatorCommand({
      only: this.emulatorSelected.length > 0 ? this.emulatorSelected : undefined,
      importDir: this.emulatorImportDir || undefined,
    });
  }

  private functionsLogPreview(): string {
    return buildFunctionsLogCommand({
      projectId: this.functionsProject || undefined,
      only: this.functionsLogOnly || undefined,
      lines: this.functionsLogLines,
    });
  }

  // ── Tab rendering ────────────────────────────────────────────────────────────

  renderTabs() {
    return (
      <div class="flex flex-wrap gap-1 border-b border-accent2 mb-4 pb-1">
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
    );
  }

  renderStatusBar() {
    const color = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-warning' : 'text-text2';
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-text2">
            Status: <span class={color}>{this.statusMessage}</span>
          </span>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(this.output);
                this.setTemporaryStatus('Copied');
              }
            }}
          >
            Copy Output
          </button>
        </div>
        <div class="cli-cmd-preview">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Auth Tab ─────────────────────────────────────────────────────────────────

  renderAuthTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Authentication</h3>
          <div class="flex flex-col gap-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('firebase login', () => firebaseService.login())}>
              Login
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run('firebase login:ci', () => firebaseService.loginCI())}>
              Login (CI Token)
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Logout</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Email (optional — leave blank to log out all)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="user@example.com"
              value={this.logoutEmail}
              onInput={(e: Event) => {
                this.logoutEmail = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() =>
              this.run(this.logoutEmail ? `firebase logout ${this.logoutEmail}` : 'firebase logout', () => firebaseService.logout(this.logoutEmail || undefined), true)
            }
          >
            Logout
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Projects Tab ──────────────────────────────────────────────────────────────

  renderProjectsTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Projects</h3>
          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run('firebase projects:list', () => firebaseService.projectsList())}>
            List Projects
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project ID / Alias
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-firebase-project"
              value={this.projectId}
              onInput={(e: Event) => {
                this.projectId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.projectId.trim()) return;
                this.run(`firebase use ${this.projectId}`, () => firebaseService.use(this.projectId));
              }}
            >
              Use Project
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.run('firebase use --clear', () => firebaseService.useClear(), true)}>
              Clear Active
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Init Features</h3>
          <p class="text-xs text-text2 mb-3">Select features to preview the init command (actual init is interactive).</p>
          <div class="grid grid-cols-2 gap-2 mb-3">
            {INIT_FEATURES.map(feat => (
              <label key={feat.id} class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.initFeatures.includes(feat.id)}
                  onChange={() => {
                    this.initFeatures = this.toggleSet(this.initFeatures, feat.id);
                  }}
                />
                {feat.label}
              </label>
            ))}
          </div>
          <div class="cli-cmd-preview text-xs">{this.initFeatures.length > 0 ? `firebase init ${this.initFeatures.join(',')}` : 'firebase init'}</div>
          <p class="text-xs text-text2 mt-2">
            Note: <code>firebase init</code> is interactive — run it in your terminal.
          </p>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Deploy Tab ────────────────────────────────────────────────────────────────

  renderDeployTab() {
    const preview = this.deployCommandPreview();
    return (
      <div class="grid grid-cols-1 gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Deploy Options</h3>

            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Project ID (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="my-project"
                value={this.deployProject}
                onInput={(e: Event) => {
                  this.deployProject = (e.target as HTMLInputElement).value;
                }}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Deploy Message (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="v2.0 release"
                value={this.deployMessage}
                onInput={(e: Event) => {
                  this.deployMessage = (e.target as HTMLInputElement).value;
                }}
              />
            </label>

            <div class="flex gap-4 mb-3">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.deployDryRun}
                  onChange={(e: Event) => {
                    this.deployDryRun = (e.target as HTMLInputElement).checked;
                  }}
                />
                Dry Run
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.deployForce}
                  onChange={(e: Event) => {
                    this.deployForce = (e.target as HTMLInputElement).checked;
                  }}
                />
                Force
              </label>
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Target Selection</h3>

            <p class="text-xs text-text2 mb-2">Deploy Only</p>
            <div class="grid grid-cols-2 gap-2 mb-4">
              {DEPLOY_TARGETS.map(t => (
                <label key={t.id} class="flex items-center gap-2 text-sm text-text2" title={t.description}>
                  <input
                    type="checkbox"
                    checked={this.deployOnly.includes(t.id)}
                    onChange={() => {
                      this.deployOnly = this.toggleSet(this.deployOnly, t.id);
                      if (this.deployOnly.includes(t.id)) {
                        this.deployExcept = this.deployExcept.filter(v => v !== t.id);
                      }
                    }}
                  />
                  {t.label}
                </label>
              ))}
            </div>

            <p class="text-xs text-text2 mb-2">Deploy Except</p>
            <div class="grid grid-cols-2 gap-2">
              {DEPLOY_TARGETS.map(t => (
                <label key={t.id} class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.deployExcept.includes(t.id)}
                    onChange={() => {
                      this.deployExcept = this.toggleSet(this.deployExcept, t.id);
                      if (this.deployExcept.includes(t.id)) {
                        this.deployOnly = this.deployOnly.filter(v => v !== t.id);
                      }
                    }}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{preview}</div>
          <div class="flex gap-2 mt-3">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.run(
                  preview,
                  () =>
                    firebaseService.deploy({
                      projectId: this.deployProject || undefined,
                      only: this.deployOnly.length > 0 ? this.deployOnly : undefined,
                      except: this.deployExcept.length > 0 ? this.deployExcept : undefined,
                      message: this.deployMessage || undefined,
                      force: this.deployForce,
                      dryRun: this.deployDryRun,
                    }),
                  !this.deployDryRun,
                )
              }
            >
              {this.deployDryRun ? 'Dry Run' : 'Deploy'}
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning cli-btn-sm"
              onClick={() => {
                this.deployOnly = [];
                this.deployExcept = [];
                this.deployProject = '';
                this.deployMessage = '';
                this.deployForce = false;
                this.deployDryRun = false;
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Functions Tab ─────────────────────────────────────────────────────────────

  renderFunctionsTab() {
    const logPreview = this.functionsLogPreview();
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Functions</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project ID (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-project"
              value={this.functionsProject}
              onInput={(e: Event) => {
                this.functionsProject = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success mb-4"
            onClick={() =>
              this.run(`firebase${this.functionsProject ? ` --project ${this.functionsProject}` : ''} functions:list`, () =>
                firebaseService.functionsList(this.functionsProject || undefined),
              )
            }
          >
            List Functions
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Function Logs</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Function Name(s) (optional, comma-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="myFunction,otherFunc"
              value={this.functionsLogOnly}
              onInput={(e: Event) => {
                this.functionsLogOnly = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Lines
            <input
              type="number"
              class="cli-input w-24"
              min="1"
              max="500"
              value={this.functionsLogLines}
              onInput={(e: Event) => {
                this.functionsLogLines = parseInt((e.target as HTMLInputElement).value, 10) || 50;
              }}
            />
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{logPreview}</div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(logPreview, () =>
                firebaseService.functionsLog({
                  projectId: this.functionsProject || undefined,
                  only: this.functionsLogOnly || undefined,
                  lines: this.functionsLogLines,
                }),
              )
            }
          >
            Fetch Logs
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Firestore/RTDB Tab ────────────────────────────────────────────────────────

  renderFirestoreTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Cloud Firestore</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project ID (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-project"
              value={this.firestoreProject}
              onInput={(e: Event) => {
                this.firestoreProject = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex gap-2 mb-4">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.run(`firebase${this.firestoreProject ? ` --project ${this.firestoreProject}` : ''} firestore:indexes`, () =>
                  firebaseService.firestoreIndexes(this.firestoreProject || undefined),
                )
              }
            >
              List Indexes
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.run(`firebase${this.firestoreProject ? ` --project ${this.firestoreProject}` : ''} firestore:databases:list`, () =>
                  firebaseService.firestoreDatabasesList(this.firestoreProject || undefined),
                )
              }
            >
              List Databases
            </button>
          </div>

          <hr class="border-bg3 my-3" />

          <h4 class="text-sm font-medium text-danger mb-2">Delete Document/Collection</h4>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Path
            <input
              type="text"
              class="cli-input w-full"
              placeholder="/users/userId"
              value={this.firestorePath}
              onInput={(e: Event) => {
                this.firestorePath = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-4 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.firestoreRecursive}
                onChange={(e: Event) => {
                  this.firestoreRecursive = (e.target as HTMLInputElement).checked;
                }}
              />
              Recursive (-r)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.firestoreForce}
                onChange={(e: Event) => {
                  this.firestoreForce = (e.target as HTMLInputElement).checked;
                }}
              />
              Force (-f)
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (!this.firestorePath.trim()) return;
              const cmd = `firebase${this.firestoreProject ? ` --project ${this.firestoreProject}` : ''} firestore:delete "${this.firestorePath}"${this.firestoreRecursive ? ' --recursive' : ''}${this.firestoreForce ? ' --force' : ''}`;
              this.run(
                cmd,
                () =>
                  firebaseService.firestoreDelete(this.firestorePath, {
                    recursive: this.firestoreRecursive,
                    force: this.firestoreForce,
                    projectId: this.firestoreProject || undefined,
                  }),
                true,
              );
            }}
          >
            Delete Path
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Realtime Database</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project ID (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-project"
              value={this.rtdbProject}
              onInput={(e: Event) => {
                this.rtdbProject = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Database Path
            <input
              type="text"
              class="cli-input w-full"
              placeholder="/"
              value={this.rtdbPath}
              onInput={(e: Event) => {
                this.rtdbPath = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const path = this.rtdbPath || '/';
              const cmd = `firebase${this.rtdbProject ? ` --project ${this.rtdbProject}` : ''} database:get "${path}"`;
              this.run(cmd, () => firebaseService.databaseGet(path, this.rtdbProject || undefined));
            }}
          >
            Get Data
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Hosting Tab ───────────────────────────────────────────────────────────────

  renderHostingTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Hosting Sites</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project ID (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-project"
              value={this.hostingProject}
              onInput={(e: Event) => {
                this.hostingProject = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(`firebase${this.hostingProject ? ` --project ${this.hostingProject}` : ''} hosting:sites:list`, () =>
                firebaseService.hostingSitesList(this.hostingProject || undefined),
              )
            }
          >
            List Sites
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Preview Channels</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Channel ID
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-preview"
              value={this.hostingChannelId}
              onInput={(e: Event) => {
                this.hostingChannelId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.run(`firebase${this.hostingProject ? ` --project ${this.hostingProject}` : ''} hosting:channel:list`, () =>
                  firebaseService.hostingChannelList(this.hostingProject || undefined),
                )
              }
            >
              List Channels
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.hostingChannelId.trim()) return;
                this.run(`firebase${this.hostingProject ? ` --project ${this.hostingProject}` : ''} hosting:channel:create ${this.hostingChannelId}`, () =>
                  firebaseService.hostingChannelCreate(this.hostingChannelId, this.hostingProject || undefined),
                );
              }}
            >
              Create Channel
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.hostingChannelId.trim()) return;
                this.run(`firebase${this.hostingProject ? ` --project ${this.hostingProject}` : ''} hosting:channel:deploy ${this.hostingChannelId}`, () =>
                  firebaseService.hostingChannelDeploy(this.hostingChannelId, this.hostingProject || undefined),
                );
              }}
            >
              Deploy to Channel
            </button>
          </div>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Emulators Tab ─────────────────────────────────────────────────────────────

  renderEmulatorsTab() {
    const preview = this.emulatorCommandPreview();
    return (
      <div class="grid grid-cols-1 gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Emulators</h3>

            <p class="text-xs text-text2 mb-2">Select emulators to start (none = all):</p>
            <div class="grid grid-cols-2 gap-2 mb-4">
              {EMULATOR_OPTIONS.map(e => (
                <label key={e.id} class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.emulatorSelected.includes(e.id)}
                    onChange={() => {
                      this.emulatorSelected = this.toggleSet(this.emulatorSelected, e.id);
                    }}
                  />
                  {e.label}
                </label>
              ))}
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Options</h3>

            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Import data from directory
              <input
                type="text"
                class="cli-input w-full"
                placeholder="./emulator-data"
                value={this.emulatorImportDir}
                onInput={(e: Event) => {
                  this.emulatorImportDir = (e.target as HTMLInputElement).value;
                }}
              />
            </label>

            <div class="cli-cmd-preview text-xs mb-3">{preview}</div>
            <p class="text-xs text-text2">Note: emulators start in the foreground. Confirm before launching.</p>
          </div>
        </div>

        <div class="cli-card">
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(
                preview,
                () => firebaseService.emulatorsStart(this.emulatorSelected.length > 0 ? this.emulatorSelected : undefined, this.emulatorImportDir || undefined),
                true,
              )
            }
          >
            Start Emulators
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Extensions Tab ────────────────────────────────────────────────────────────

  renderExtensionsTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Extensions</h3>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('firebase ext:list', () => firebaseService.extList())}>
            List Installed Extensions
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">App Hosting Backends</h3>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('firebase apphosting:backends:list', () => firebaseService.apphostingBackendsList())}>
            List Backends
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Apps Tab ──────────────────────────────────────────────────────────────────

  renderAppsTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Apps</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Platform filter
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.appListPlatform = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="" selected={this.appListPlatform === ''}>
                All Platforms
              </option>
              {APP_PLATFORMS.map(p => (
                <option key={p.value} value={p.value} selected={this.appListPlatform === p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(`firebase apps:list${this.appListPlatform ? ` ${this.appListPlatform}` : ''}`, () => firebaseService.appsList(this.appListPlatform || undefined))
            }
          >
            List Apps
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create App</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Platform
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.appPlatform = (e.target as HTMLSelectElement).value;
              }}
            >
              {APP_PLATFORMS.map(p => (
                <option key={p.value} value={p.value} selected={this.appPlatform === p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Display Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="My App"
              value={this.appDisplayName}
              onInput={(e: Event) => {
                this.appDisplayName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview text-xs mb-3">{`firebase apps:create ${this.appPlatform} "${this.appDisplayName || '<display name>'}"`}</div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.appDisplayName.trim()) return;
              this.run(`firebase apps:create ${this.appPlatform} "${this.appDisplayName}"`, () => firebaseService.appsCreate(this.appPlatform, this.appDisplayName));
            }}
          >
            Create App
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Docs Tab ──────────────────────────────────────────────────────────────────

  renderDocsTab() {
    const man = getFirebaseManPage();
    return (
      <div class="grid grid-cols-1 gap-4">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{man.name}</h2>
          <p class="text-text2 text-sm mb-3">{man.synopsis}</p>
          <p class="mb-4">{man.description}</p>

          {man.sections.map((section, i) => (
            <div key={i} class="mb-5">
              <h3 class="text-base font-medium mb-2">{section.title}</h3>
              <pre class="cli-output text-xs">{section.content}</pre>
            </div>
          ))}

          <h3 class="text-base font-medium mb-2">Examples</h3>
          <div class="space-y-2">
            {man.examples.map((ex, i) => (
              <div key={i} class="flex gap-4 items-start p-2 bg-bg3 rounded">
                <code class="font-mono text-sm flex-1">{ex.command}</code>
                <span class="text-text2 text-sm">{ex.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Raw Tab ────────────────────────────────────────────────────────────────────

  renderRawTab() {
    return (
      <div class="grid grid-cols-1 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Raw Command</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command (prefix with <code>firebase</code> or omit it)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="firebase projects:list"
              value={this.rawCommand}
              onInput={(e: Event) => {
                this.rawCommand = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const cmd = this.rawCommand.trim();
              if (!cmd) return;
              this.run(cmd, () => firebaseService.raw(cmd));
            }}
          >
            Execute
          </button>
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }

  // ── Root render ────────────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🔥</span> Firebase CLI
          </h2>
          <p class="text-text2 text-sm">Firebase project &amp; service management</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'auth' && this.renderAuthTab()}
          {this.activeTab === 'projects' && this.renderProjectsTab()}
          {this.activeTab === 'deploy' && this.renderDeployTab()}
          {this.activeTab === 'functions' && this.renderFunctionsTab()}
          {this.activeTab === 'firestore' && this.renderFirestoreTab()}
          {this.activeTab === 'hosting' && this.renderHostingTab()}
          {this.activeTab === 'emulators' && this.renderEmulatorsTab()}
          {this.activeTab === 'extensions' && this.renderExtensionsTab()}
          {this.activeTab === 'apps' && this.renderAppsTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
          {this.activeTab === 'raw' && this.renderRawTab()}
        </div>
      </div>
    );
  }
}
