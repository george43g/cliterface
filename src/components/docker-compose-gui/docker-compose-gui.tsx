import { Component, h, State } from '@stencil/core';
import {
  buildBuildCommand,
  buildDownCommand,
  buildExecCommand,
  buildLogsCommand,
  buildPsCommand,
  buildRunCommand,
  buildScaleCommand,
  buildUpCommand,
} from '../../docker-compose/docker-compose-command-builders';
import { type CommandResult, dockerCompose, validateServiceName, validateServiceNames } from '../../docker-compose/docker-compose-service';

const TABS = [
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'services', label: 'Services' },
  { id: 'logs', label: 'Logs' },
  { id: 'config', label: 'Config' },
  { id: 'build', label: 'Build' },
];

@Component({
  tag: 'docker-compose-gui',
  styleUrl: 'docker-compose-gui.css',
  scoped: true,
})
export class DockerComposeGui {
  @State() activeTab = 'lifecycle';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select an action to execute a docker compose command.';
  @State() statusMessage = 'Ready';

  // ── Lifecycle (Up/Down) tab state ──────────────────────────────────────
  @State() upServices = '';
  @State() upDetach = true;
  @State() upBuild = false;
  @State() upForceRecreate = false;
  @State() upNoRecreate = false;
  @State() upRemoveOrphans = false;
  @State() upPull: 'always' | 'missing' | 'never' = 'missing';
  @State() upScale = '';

  @State() downServices = '';
  @State() downVolumes = false;
  @State() downRemoveOrphans = false;
  @State() downRmi: '' | 'all' | 'local' = '';
  @State() downTimeout = 0;

  @State() restartServices = '';
  @State() stopServices = '';
  @State() stopTimeout = 0;
  @State() startServices = '';

  // ── Services tab state ─────────────────────────────────────────────────
  @State() psServices = '';
  @State() psAll = false;
  @State() execService = '';
  @State() execCommand = 'sh';
  @State() execUser = '';
  @State() execWorkdir = '';
  @State() execDetach = false;
  @State() runService = '';
  @State() runCommand = '';
  @State() runRm = true;
  @State() runDetach = false;
  @State() runNoTty = false;
  @State() runUser = '';
  @State() runEnv = '';
  @State() scaleService = '';
  @State() scaleCount = 2;
  @State() pauseServices = '';
  @State() unpauseServices = '';

  // ── Logs tab state ─────────────────────────────────────────────────────
  @State() logsServices = '';
  @State() logsFollow = false;
  @State() logsTail = 'all';
  @State() logsTimestamps = false;

  // ── Config tab state ───────────────────────────────────────────────────
  @State() portService = '';
  @State() portPrivate = '';
  @State() cpSrc = '';
  @State() cpDst = '';
  @State() topServices = '';
  @State() killServices = '';
  @State() killSignal = '';
  @State() rmServices = '';
  @State() rmForce = false;
  @State() rmStop = false;

  // ── Build tab state ────────────────────────────────────────────────────
  @State() buildServices = '';
  @State() buildNoCache = false;
  @State() buildPull = false;
  @State() buildQuiet = false;
  @State() pullServices = '';
  @State() pushServices = '';

  // ── Service name validation ────────────────────────────────────────────

  private validateSvc(name: string): boolean {
    if (!name.trim()) return true; // empty = all services, valid
    const names = name.split(/[\s,]+/).filter(Boolean);
    return names.every(n => validateServiceName(n).valid);
  }

  // ── Core execute ───────────────────────────────────────────────────────

  private async runResult(promise: Promise<CommandResult>, cmd: string, confirm = false): Promise<void> {
    if (confirm && typeof window !== 'undefined') {
      if (!window.confirm(`Execute: ${cmd}?`)) return;
    }
    this.lastCommand = cmd;
    this.status = 'running';
    this.output = 'Executing...';
    this.statusMessage = 'Running...';
    try {
      const result = await promise;
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private setTemporaryStatus(msg: string): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = 'Ready';
      }, 2000);
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
    this.output = 'Select an action to execute a docker compose command.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Render helpers ─────────────────────────────────────────────────────

  private svcInputClass(value: string): string {
    return `cli-input w-full ${value && !this.validateSvc(value) ? 'cli-input-invalid' : ''}`;
  }

  private svcError(value: string): string | null {
    if (!value.trim() || this.validateSvc(value)) return null;
    return 'Invalid service name(s) — use lowercase letters, numbers, hyphens, underscores';
  }

  private renderStatusBadge() {
    const cls = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-warning' : 'text-text2';
    return <span class={cls}>{this.statusMessage}</span>;
  }

  private renderOutputPane() {
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm">Status: {this.renderStatusBadge()}</span>
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

  private renderSvcInput(label: string, value: string, onInput: (v: string) => void, placeholder = 'all services') {
    const err = this.svcError(value);
    return (
      <label class="flex flex-col gap-1 text-sm text-text2">
        {label}
        <input type="text" class={this.svcInputClass(value)} placeholder={placeholder} value={value} onInput={(e: Event) => onInput((e.target as HTMLInputElement).value)} />
        {err && <span class="cli-validation-message invalid">{err}</span>}
      </label>
    );
  }

  // ── Lifecycle tab ──────────────────────────────────────────────────────

  private renderUpPreview(): string {
    return buildUpCommand({
      services: validateServiceNames(this.upServices),
      detach: this.upDetach,
      build: this.upBuild,
      forceRecreate: this.upForceRecreate,
      noRecreate: this.upNoRecreate,
      removeOrphans: this.upRemoveOrphans,
      pull: this.upPull,
      scale: this.upScale || undefined,
    });
  }

  private renderDownPreview(): string {
    return buildDownCommand({
      services: validateServiceNames(this.downServices),
      volumes: this.downVolumes,
      removeOrphans: this.downRemoveOrphans,
      rmi: this.downRmi,
      timeout: this.downTimeout,
    });
  }

  renderLifecycleTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* UP */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Up
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.upServices, v => {
              this.upServices = v;
            })}
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.upDetach}
                  onChange={(e: Event) => {
                    this.upDetach = (e.target as HTMLInputElement).checked;
                  }}
                />
                Detach (-d)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.upBuild}
                  onChange={(e: Event) => {
                    this.upBuild = (e.target as HTMLInputElement).checked;
                  }}
                />
                Build (--build)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.upForceRecreate}
                  onChange={(e: Event) => {
                    this.upForceRecreate = (e.target as HTMLInputElement).checked;
                    this.upNoRecreate = false;
                  }}
                />
                Force Recreate
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.upNoRecreate}
                  onChange={(e: Event) => {
                    this.upNoRecreate = (e.target as HTMLInputElement).checked;
                    this.upForceRecreate = false;
                  }}
                />
                No Recreate
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.upRemoveOrphans}
                  onChange={(e: Event) => {
                    this.upRemoveOrphans = (e.target as HTMLInputElement).checked;
                  }}
                />
                Remove Orphans
              </label>
            </div>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Pull
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.upPull = (e.target as HTMLSelectElement).value as 'always' | 'missing' | 'never';
                }}
              >
                <option value="missing" selected={this.upPull === 'missing'}>
                  missing (default)
                </option>
                <option value="always" selected={this.upPull === 'always'}>
                  always
                </option>
                <option value="never" selected={this.upPull === 'never'}>
                  never
                </option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Scale (e.g. api=3)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="service=N"
                value={this.upScale}
                onInput={(e: Event) => {
                  this.upScale = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="cli-cmd-preview text-xs">{this.renderUpPreview()}</div>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.runResult(
                  dockerCompose.up({
                    services: validateServiceNames(this.upServices),
                    detach: this.upDetach,
                    build: this.upBuild,
                    forceRecreate: this.upForceRecreate,
                    noRecreate: this.upNoRecreate,
                    removeOrphans: this.upRemoveOrphans,
                    pull: this.upPull,
                  }),
                  this.renderUpPreview(),
                )
              }
            >
              Up
            </button>
          </div>
        </div>

        {/* DOWN */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Down
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.downServices, v => {
              this.downServices = v;
            })}
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.downVolumes}
                  onChange={(e: Event) => {
                    this.downVolumes = (e.target as HTMLInputElement).checked;
                  }}
                />
                Remove Volumes (-v)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.downRemoveOrphans}
                  onChange={(e: Event) => {
                    this.downRemoveOrphans = (e.target as HTMLInputElement).checked;
                  }}
                />
                Remove Orphans
              </label>
            </div>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Remove Images
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.downRmi = (e.target as HTMLSelectElement).value as '' | 'all' | 'local';
                }}
              >
                <option value="" selected={this.downRmi === ''}>
                  none
                </option>
                <option value="local" selected={this.downRmi === 'local'}>
                  local
                </option>
                <option value="all" selected={this.downRmi === 'all'}>
                  all
                </option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Timeout (seconds, 0=default)
              <input
                type="number"
                class="cli-input w-32"
                min="0"
                value={this.downTimeout}
                onInput={(e: Event) => {
                  this.downTimeout = parseInt((e.target as HTMLInputElement).value, 10) || 0;
                }}
              />
            </label>
            <div class="cli-cmd-preview text-xs">{this.renderDownPreview()}</div>
            <div class="flex gap-2">
              <button
                type="button"
                class="cli-btn"
                onClick={() =>
                  this.runResult(
                    dockerCompose.down({
                      services: validateServiceNames(this.downServices),
                      removeOrphans: this.downRemoveOrphans,
                      rmi: this.downRmi || undefined,
                      timeout: this.downTimeout,
                    }),
                    this.renderDownPreview(),
                    true,
                  )
                }
              >
                Down
              </button>
              {this.downVolumes && (
                <button
                  type="button"
                  class="cli-btn cli-btn-danger"
                  onClick={() =>
                    this.runResult(
                      dockerCompose.down({
                        services: validateServiceNames(this.downServices),
                        volumes: true,
                        removeOrphans: this.downRemoveOrphans,
                        rmi: this.downRmi || undefined,
                        timeout: this.downTimeout,
                      }),
                      this.renderDownPreview(),
                      true,
                    )
                  }
                >
                  Down -v (destructive)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Start / Stop / Restart */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Start / Stop / Restart</h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.startServices, v => {
              this.startServices = v;
            })}
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.runResult(dockerCompose.start(validateServiceNames(this.startServices)), `docker compose start ${this.startServices}`.trim())}
              >
                Start
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-warning"
                onClick={() =>
                  this.runResult(
                    dockerCompose.stop(validateServiceNames(this.startServices), this.stopTimeout || undefined),
                    `docker compose stop ${this.startServices}`.trim(),
                    true,
                  )
                }
              >
                Stop
              </button>
              <button
                type="button"
                class="cli-btn"
                onClick={() => this.runResult(dockerCompose.restart(validateServiceNames(this.startServices)), `docker compose restart ${this.startServices}`.trim(), true)}
              >
                Restart
              </button>
            </div>
          </div>
        </div>

        {/* Pause / Unpause */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Pause / Unpause</h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.pauseServices, v => {
              this.pauseServices = v;
            })}
            <div class="flex gap-2">
              <button
                type="button"
                class="cli-btn cli-btn-warning"
                onClick={() => this.runResult(dockerCompose.pause(validateServiceNames(this.pauseServices)), `docker compose pause ${this.pauseServices}`.trim())}
              >
                Pause
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.runResult(dockerCompose.unpause(validateServiceNames(this.pauseServices)), `docker compose unpause ${this.pauseServices}`.trim())}
              >
                Unpause
              </button>
            </div>
          </div>
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Services tab ───────────────────────────────────────────────────────

  renderServicesTab() {
    const psCmd = buildPsCommand({ services: validateServiceNames(this.psServices), all: this.psAll });
    const execCmd = buildExecCommand({ service: this.execService, command: this.execCommand, user: this.execUser, workdir: this.execWorkdir, detach: this.execDetach });
    const runCmd = buildRunCommand({
      service: this.runService,
      command: this.runCommand,
      rm: this.runRm,
      detach: this.runDetach,
      noTty: this.runNoTty,
      user: this.runUser,
      env: this.runEnv,
    });
    const scaleCmd = this.scaleService ? buildScaleCommand({ [this.scaleService]: this.scaleCount }) : 'docker compose scale ...';

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ps */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> List Containers (ps)
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.psServices, v => {
              this.psServices = v;
            })}
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.psAll}
                onChange={(e: Event) => {
                  this.psAll = (e.target as HTMLInputElement).checked;
                }}
              />
              Show all (including stopped)
            </label>
            <div class="cli-cmd-preview text-xs">{psCmd}</div>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runResult(dockerCompose.ps(validateServiceNames(this.psServices)), psCmd)}>
              List Containers
            </button>
          </div>
        </div>

        {/* exec */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Exec
          </h3>
          <div class="flex flex-col gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Service *
              <input
                type="text"
                class={`cli-input w-full ${this.execService && !validateServiceName(this.execService).valid ? 'cli-input-invalid' : ''}`}
                placeholder="api"
                value={this.execService}
                onInput={(e: Event) => {
                  this.execService = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Command
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="sh"
                value={this.execCommand}
                onInput={(e: Event) => {
                  this.execCommand = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                User (-u)
                <input
                  type="text"
                  class="cli-input"
                  placeholder="root"
                  value={this.execUser}
                  onInput={(e: Event) => {
                    this.execUser = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Workdir (-w)
                <input
                  type="text"
                  class="cli-input"
                  placeholder="/app"
                  value={this.execWorkdir}
                  onInput={(e: Event) => {
                    this.execWorkdir = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.execDetach}
                onChange={(e: Event) => {
                  this.execDetach = (e.target as HTMLInputElement).checked;
                }}
              />
              Detach (-d)
            </label>
            <div class="cli-cmd-preview text-xs">{execCmd}</div>
            <button
              type="button"
              class="cli-btn"
              disabled={!this.execService || !this.execCommand}
              onClick={() =>
                this.runResult(
                  dockerCompose.exec({ service: this.execService, command: this.execCommand, user: this.execUser, workdir: this.execWorkdir, detach: this.execDetach }),
                  execCmd,
                )
              }
            >
              Exec
            </button>
          </div>
        </div>

        {/* run */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Run One-Off
          </h3>
          <div class="flex flex-col gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Service *
              <input
                type="text"
                class={`cli-input w-full ${this.runService && !validateServiceName(this.runService).valid ? 'cli-input-invalid' : ''}`}
                placeholder="api"
                value={this.runService}
                onInput={(e: Event) => {
                  this.runService = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Command *
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="node migrate.js"
                value={this.runCommand}
                onInput={(e: Event) => {
                  this.runCommand = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.runRm}
                  onChange={(e: Event) => {
                    this.runRm = (e.target as HTMLInputElement).checked;
                  }}
                />
                Remove (--rm)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.runDetach}
                  onChange={(e: Event) => {
                    this.runDetach = (e.target as HTMLInputElement).checked;
                  }}
                />
                Detach (-d)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.runNoTty}
                  onChange={(e: Event) => {
                    this.runNoTty = (e.target as HTMLInputElement).checked;
                  }}
                />
                No TTY (-T)
              </label>
            </div>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Env (-e KEY=VALUE)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="NODE_ENV=production"
                value={this.runEnv}
                onInput={(e: Event) => {
                  this.runEnv = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="cli-cmd-preview text-xs">{runCmd}</div>
            <button
              type="button"
              class="cli-btn"
              disabled={!this.runService || !this.runCommand}
              onClick={() =>
                this.runResult(
                  dockerCompose.run({
                    service: this.runService,
                    command: this.runCommand,
                    rm: this.runRm,
                    detach: this.runDetach,
                    noTty: this.runNoTty,
                    user: this.runUser,
                    env: this.runEnv || undefined,
                  }),
                  runCmd,
                )
              }
            >
              Run
            </button>
          </div>
        </div>

        {/* scale */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Scale
          </h3>
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Service *
                <input
                  type="text"
                  class={`cli-input ${this.scaleService && !validateServiceName(this.scaleService).valid ? 'cli-input-invalid' : ''}`}
                  placeholder="api"
                  value={this.scaleService}
                  onInput={(e: Event) => {
                    this.scaleService = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Replicas
                <input
                  type="number"
                  class="cli-input"
                  min="0"
                  value={this.scaleCount}
                  onInput={(e: Event) => {
                    this.scaleCount = parseInt((e.target as HTMLInputElement).value, 10) || 1;
                  }}
                />
              </label>
            </div>
            <div class="cli-cmd-preview text-xs">{scaleCmd}</div>
            <button
              type="button"
              class="cli-btn"
              disabled={!this.scaleService}
              onClick={() => this.runResult(dockerCompose.scale({ [this.scaleService]: this.scaleCount }), scaleCmd, true)}
            >
              Scale
            </button>
          </div>
        </div>

        {/* top + images */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Inspect
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.topServices, v => {
              this.topServices = v;
            })}
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.runResult(dockerCompose.top(validateServiceNames(this.topServices)), `docker compose top ${this.topServices}`.trim())}
              >
                Top (processes)
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.runResult(dockerCompose.stats(validateServiceNames(this.topServices)), `docker compose stats --no-stream ${this.topServices}`.trim())}
              >
                Stats
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.runResult(dockerCompose.images(validateServiceNames(this.topServices)), `docker compose images ${this.topServices}`.trim())}
              >
                Images
              </button>
              <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runResult(dockerCompose.ls(), 'docker compose ls')}>
                List Projects (ls)
              </button>
            </div>
          </div>
        </div>

        {/* kill + rm (destructive) */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                background: 'var(--color-danger)',
                color: 'white',
                marginLeft: '0',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              destructive
            </span>
            Kill / Remove
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.killServices, v => {
              this.killServices = v;
            })}
            <label class="flex flex-col gap-1 text-sm text-text2">
              Kill Signal (e.g. SIGTERM)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="SIGKILL"
                value={this.killSignal}
                onInput={(e: Event) => {
                  this.killSignal = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.rmForce}
                  onChange={(e: Event) => {
                    this.rmForce = (e.target as HTMLInputElement).checked;
                  }}
                />
                Force rm (-f)
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.rmStop}
                  onChange={(e: Event) => {
                    this.rmStop = (e.target as HTMLInputElement).checked;
                  }}
                />
                Stop first (-s)
              </label>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="cli-btn cli-btn-danger"
                onClick={() =>
                  this.runResult(dockerCompose.kill(validateServiceNames(this.killServices), this.killSignal || undefined), `docker compose kill ${this.killServices}`.trim(), true)
                }
              >
                Kill
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-danger"
                onClick={() =>
                  this.runResult(dockerCompose.rm(validateServiceNames(this.killServices), this.rmForce, this.rmStop), `docker compose rm ${this.killServices}`.trim(), true)
                }
              >
                Remove (rm)
              </button>
            </div>
          </div>
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Logs tab ───────────────────────────────────────────────────────────

  renderLogsTab() {
    const logsCmd = buildLogsCommand({
      services: validateServiceNames(this.logsServices),
      follow: this.logsFollow,
      tail: this.logsTail !== 'all' ? this.logsTail : undefined,
      timestamps: this.logsTimestamps,
    });

    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Logs
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-3">
              {this.renderSvcInput('Services (optional)', this.logsServices, v => {
                this.logsServices = v;
              })}
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.logsFollow}
                    onChange={(e: Event) => {
                      this.logsFollow = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  Follow (-f)
                </label>
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.logsTimestamps}
                    onChange={(e: Event) => {
                      this.logsTimestamps = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  Timestamps (-t)
                </label>
              </div>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Tail lines
                <select
                  class="cli-select w-full"
                  onChange={(e: Event) => {
                    this.logsTail = (e.target as HTMLSelectElement).value;
                  }}
                >
                  <option value="all" selected={this.logsTail === 'all'}>
                    all
                  </option>
                  <option value="50" selected={this.logsTail === '50'}>
                    50
                  </option>
                  <option value="100" selected={this.logsTail === '100'}>
                    100
                  </option>
                  <option value="200" selected={this.logsTail === '200'}>
                    200
                  </option>
                  <option value="500" selected={this.logsTail === '500'}>
                    500
                  </option>
                </select>
              </label>
            </div>
            <div class="flex flex-col gap-3">
              <div class="cli-cmd-preview text-xs">{logsCmd}</div>
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() =>
                  this.runResult(
                    dockerCompose.logs({
                      services: validateServiceNames(this.logsServices),
                      follow: this.logsFollow,
                      tail: this.logsTail !== 'all' ? this.logsTail : undefined,
                      timestamps: this.logsTimestamps,
                    }),
                    logsCmd,
                  )
                }
              >
                Fetch Logs
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.runResult(dockerCompose.events(validateServiceNames(this.logsServices)), `docker compose events ${this.logsServices}`.trim())}
              >
                Events
              </button>
            </div>
          </div>
        </div>
        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Config tab ─────────────────────────────────────────────────────────

  renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* config validate */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Config / Validate
          </h3>
          <p class="text-text2 text-sm mb-3">Parse and render the Compose file in canonical format. Validates the file.</p>
          <div class="cli-cmd-preview text-xs">docker compose config</div>
          <button type="button" class="cli-btn cli-btn-success mt-3" onClick={() => this.runResult(dockerCompose.config(), 'docker compose config')}>
            Validate Config
          </button>
        </div>

        {/* version */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Version / Info
          </h3>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runResult(dockerCompose.version(), 'docker compose version')}>
              Version
            </button>
          </div>
        </div>

        {/* port */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Port
          </h3>
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Service *
                <input
                  type="text"
                  class="cli-input"
                  placeholder="web"
                  value={this.portService}
                  onInput={(e: Event) => {
                    this.portService = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Container Port *
                <input
                  type="text"
                  class="cli-input"
                  placeholder="80"
                  value={this.portPrivate}
                  onInput={(e: Event) => {
                    this.portPrivate = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>
            <div class="cli-cmd-preview text-xs">{`docker compose port ${this.portService || '<service>'} ${this.portPrivate || '<port>'}`}</div>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!this.portService || !this.portPrivate}
              onClick={() => this.runResult(dockerCompose.port(this.portService, this.portPrivate), `docker compose port ${this.portService} ${this.portPrivate}`)}
            >
              Get Port
            </button>
          </div>
        </div>

        {/* cp */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Copy Files (cp)
          </h3>
          <p class="text-xs text-text2 mb-3">
            e.g. <code>api:/app/config.json ./config.json</code>
          </p>
          <div class="flex flex-col gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Source (service:/path or local)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="api:/app/config.json"
                value={this.cpSrc}
                onInput={(e: Event) => {
                  this.cpSrc = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Destination
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="./config.json"
                value={this.cpDst}
                onInput={(e: Event) => {
                  this.cpDst = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="cli-cmd-preview text-xs">{`docker compose cp ${this.cpSrc || '<src>'} ${this.cpDst || '<dst>'}`}</div>
            <button
              type="button"
              class="cli-btn"
              disabled={!this.cpSrc || !this.cpDst}
              onClick={() => this.runResult(dockerCompose.cp(this.cpSrc, this.cpDst), `docker compose cp ${this.cpSrc} ${this.cpDst}`, true)}
            >
              Copy
            </button>
          </div>
        </div>

        {/* pull / push */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Pull / Push Images
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.pullServices, v => {
              this.pullServices = v;
              this.pushServices = v;
            })}
            <div class="flex gap-2">
              <button
                type="button"
                class="cli-btn"
                onClick={() => this.runResult(dockerCompose.pull(validateServiceNames(this.pullServices)), `docker compose pull ${this.pullServices}`.trim())}
              >
                Pull
              </button>
              <button
                type="button"
                class="cli-btn"
                onClick={() => this.runResult(dockerCompose.push(validateServiceNames(this.pushServices)), `docker compose push ${this.pushServices}`.trim(), true)}
              >
                Push
              </button>
            </div>
          </div>
        </div>

        {/* watch */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Watch
          </h3>
          <p class="text-text2 text-sm mb-3">Watch build context for service and rebuild/refresh containers when files are updated.</p>
          <div class="cli-cmd-preview text-xs">docker compose watch</div>
          <button type="button" class="cli-btn mt-3" onClick={() => this.runResult(dockerCompose.watch(), 'docker compose watch')}>
            Watch
          </button>
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Build tab ──────────────────────────────────────────────────────────

  renderBuildTab() {
    const buildCmd = buildBuildCommand({
      services: validateServiceNames(this.buildServices),
      noCache: this.buildNoCache,
      pull: this.buildPull,
      quiet: this.buildQuiet,
    });

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">action</span> Build
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-3">
              {this.renderSvcInput('Services (optional)', this.buildServices, v => {
                this.buildServices = v;
              })}
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.buildNoCache}
                    onChange={(e: Event) => {
                      this.buildNoCache = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  No Cache
                </label>
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.buildPull}
                    onChange={(e: Event) => {
                      this.buildPull = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  Pull latest base
                </label>
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.buildQuiet}
                    onChange={(e: Event) => {
                      this.buildQuiet = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  Quiet
                </label>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <div class="cli-cmd-preview text-xs">{buildCmd}</div>
              <button type="button" class="cli-btn" onClick={() => this.runResult(dockerCompose.build(validateServiceNames(this.buildServices), this.buildNoCache), buildCmd)}>
                Build
              </button>
            </div>
          </div>
        </div>

        {/* Images (query) */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> List Images
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.buildServices, v => {
              this.buildServices = v;
            })}
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.runResult(dockerCompose.images(validateServiceNames(this.buildServices)), `docker compose images ${this.buildServices}`.trim())}
            >
              List Images
            </button>
          </div>
        </div>

        {/* Stats */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">query</span> Stats
          </h3>
          <div class="flex flex-col gap-3">
            {this.renderSvcInput('Services (optional)', this.buildServices, v => {
              this.buildServices = v;
            })}
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.runResult(dockerCompose.stats(validateServiceNames(this.buildServices)), `docker compose stats --no-stream ${this.buildServices}`.trim())}
            >
              Stats
            </button>
          </div>
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Tabs bar ───────────────────────────────────────────────────────────

  renderTabs() {
    return TABS.map(tab => (
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
    ));
  }

  // ── Root render ────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🛳️</span> Docker Compose GUI
          </h2>
          <p class="text-text2 text-sm">Multi-container orchestration — Compose V2</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'lifecycle' && this.renderLifecycleTab()}
          {this.activeTab === 'services' && this.renderServicesTab()}
          {this.activeTab === 'logs' && this.renderLogsTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'build' && this.renderBuildTab()}
        </div>
      </div>
    );
  }
}
