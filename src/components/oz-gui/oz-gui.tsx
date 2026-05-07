import { Component, h, State } from '@stencil/core';
import { getOzManPage } from '../../oz/oz-documentation';
import {
  buildAgentListCommand,
  buildAgentRunCommand,
  buildCloudRunCommand,
  buildEnvironmentImageListCommand,
  buildEnvironmentListCommand,
  buildLoginCommand,
  buildModelListCommand,
  buildRunGetCommand,
  buildRunListCommand,
  buildScheduleCreateCommand,
  type CommandResult,
  executeCommand,
} from '../../oz/oz-service';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TAB_DEFINITIONS = [
  { id: 'run', label: 'Run' },
  { id: 'agents', label: 'Agents' },
  { id: 'logs', label: 'Runs & Logs' },
  { id: 'swarm', label: 'Swarm' },
  { id: 'config', label: 'Config' },
  { id: 'auth', label: 'Auth' },
  { id: 'docs', label: 'Docs' },
];

// ─── Available model options (populated by "oz model list" — list static stubs) ──
// NOTE: Actual model IDs depend on account configuration.
// These are reasonable defaults; "oz model list" returns the authoritative set.
const MODEL_STUBS = [
  { value: '', label: 'Default (account setting)' },
  { value: 'claude-4-opus', label: 'Claude 4 Opus' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'gpt-4o', label: 'GPT-4o' },
];

type RunStatus = 'idle' | 'running' | 'success' | 'error';

@Component({
  tag: 'oz-gui',
  styleUrl: 'oz-gui.css',
  scoped: true,
})
export class OzGui {
  // ─── Shared state ─────────────────────────────────────────────────────────
  @State() activeTab = 'run';
  @State() status: RunStatus = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select a tab and configure a command.';
  @State() statusMessage = 'Ready';

  // ─── Run tab state ────────────────────────────────────────────────────────
  @State() runMode: 'local' | 'cloud' = 'local';
  @State() runPrompt = '';
  @State() runName = '';
  @State() runCwd = '';
  @State() runEnvironment = '';
  @State() runModel = '';
  @State() runSkill = '';
  @State() runShare = false;
  @State() runShareTarget = '';
  @State() runOpen = false;
  @State() runHost = '';
  @State() runComputerUse = false;
  @State() runNoEnvironment = false;

  // ─── Agents tab state ─────────────────────────────────────────────────────
  @State() agentListRepo = '';

  // ─── Runs & Logs tab state ────────────────────────────────────────────────
  @State() runListLimit = 10;
  @State() runGetId = '';

  // ─── Swarm tab state ──────────────────────────────────────────────────────
  // NOTE: Multi-agent swarm orchestration is done via oz agent run-cloud with
  // multiple invocations or via the Oz SDK. The CLI does not expose a dedicated
  // "swarm" subcommand as of the current documentation.
  // This tab surfaces scheduling as the closest documented "orchestration" primitive.
  @State() schedName = '';
  @State() schedCron = '';
  @State() schedPrompt = '';
  @State() schedSkill = '';
  @State() schedEnvironment = '';
  @State() schedHost = '';

  // ─── Config tab state ─────────────────────────────────────────────────────
  // oz model list / oz environment list / oz environment image list

  // ─── Auth tab state ───────────────────────────────────────────────────────
  @State() apiKeyVisible = false;
  @State() apiKeyValue = '';

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildRunCommandPreview(): string {
    if (this.runMode === 'local') {
      return buildAgentRunCommand({
        prompt: this.runPrompt || '<prompt>',
        cwd: this.runCwd || undefined,
        name: this.runName || undefined,
        share: this.runShare ? this.runShareTarget || true : undefined,
        model: this.runModel || undefined,
        skill: this.runSkill || undefined,
        environment: this.runEnvironment || undefined,
      });
    }
    return buildCloudRunCommand({
      prompt: this.runPrompt || '<prompt>',
      environment: this.runNoEnvironment ? undefined : this.runEnvironment || undefined,
      noEnvironment: this.runNoEnvironment,
      name: this.runName || undefined,
      open: this.runOpen,
      model: this.runModel || undefined,
      skill: this.runSkill || undefined,
      host: this.runHost || undefined,
      computerUse: this.runComputerUse,
      share: this.runShare ? this.runShareTarget || true : undefined,
    });
  }

  private buildSchedulePreview(): string {
    if (!this.schedName || !this.schedCron) return 'oz schedule create --name <name> --cron "<expr>" ...';
    return buildScheduleCreateCommand({
      name: this.schedName,
      cron: this.schedCron,
      prompt: this.schedPrompt || undefined,
      skill: this.schedSkill || undefined,
      environment: this.schedEnvironment || undefined,
      host: this.schedHost || undefined,
    });
  }

  private async runCmd(cmd: string, confirm = false): Promise<void> {
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
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(this.output);
    const prev = this.statusMessage;
    this.statusMessage = 'Copied!';
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = prev;
      }, 1500);
    }
  }

  private clearOutput(): void {
    this.output = 'Select a tab and configure a command.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ─── Shared output panel ──────────────────────────────────────────────────

  private renderOutputPanel() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';
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
        <div class="cli-cmd-preview text-sm mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ─── Tab: Run ─────────────────────────────────────────────────────────────

  private renderRunTab() {
    const preview = this.buildRunCommandPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left: configuration */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Launch Agent</h3>

          {/* Mode selector */}
          <div class="flex gap-2 mb-4">
            <button
              type="button"
              class={`cli-btn cli-btn-sm ${this.runMode === 'local' ? 'cli-btn-success' : ''}`}
              onClick={() => {
                this.runMode = 'local';
              }}
            >
              Local
            </button>
            <button
              type="button"
              class={`cli-btn cli-btn-sm ${this.runMode === 'cloud' ? '' : ''}`}
              style={{ background: this.runMode === 'cloud' ? 'var(--color-info)' : undefined }}
              onClick={() => {
                this.runMode = 'cloud';
              }}
            >
              Cloud
            </button>
          </div>

          {/* Prompt — required */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Prompt <span class="text-danger text-xs">(required)</span>
            <textarea
              class="cli-input w-full font-mono"
              style={{ height: '80px', resize: 'vertical' }}
              placeholder="Describe the task for the agent…"
              value={this.runPrompt}
              onInput={(e: Event) => {
                this.runPrompt = (e.target as HTMLTextAreaElement).value;
              }}
            />
          </label>

          {/* Name */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Run name <span class="text-text2 text-xs opacity-60">(--name, optional)</span>
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. lint-fix"
              value={this.runName}
              onInput={(e: Event) => {
                this.runName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          {/* Skill */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Skill slug <span class="text-text2 text-xs opacity-60">(--skill, optional)</span>
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. refactor"
              value={this.runSkill}
              onInput={(e: Event) => {
                this.runSkill = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          {/* Model */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Model override <span class="text-text2 text-xs opacity-60">(--model)</span>
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.runModel = (e.target as HTMLSelectElement).value;
              }}
            >
              {MODEL_STUBS.map(m => (
                <option key={m.value} value={m.value} selected={this.runModel === m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          {/* Local-only: cwd */}
          {this.runMode === 'local' && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Working dir <span class="text-text2 text-xs opacity-60">(-C / --cwd)</span>
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="/path/to/repo"
                value={this.runCwd}
                onInput={(e: Event) => {
                  this.runCwd = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          )}

          {/* Cloud-only: environment / host / flags */}
          {this.runMode === 'cloud' && (
            <div>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
                Environment ID <span class="text-text2 text-xs opacity-60">(-e / --environment)</span>
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="e.g. env_abc123"
                  value={this.runEnvironment}
                  onInput={(e: Event) => {
                    this.runEnvironment = (e.target as HTMLInputElement).value;
                  }}
                  disabled={this.runNoEnvironment}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
                Self-hosted worker ID <span class="text-text2 text-xs opacity-60">(--host)</span>
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="e.g. my-worker"
                  value={this.runHost}
                  onInput={(e: Event) => {
                    this.runHost = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <div class="flex flex-wrap gap-4 mb-3">
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.runNoEnvironment}
                    onChange={(e: Event) => {
                      this.runNoEnvironment = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  No environment (--no-environment)
                </label>
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.runOpen}
                    onChange={(e: Event) => {
                      this.runOpen = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  Open in Warp (--open)
                </label>
                <label class="flex items-center gap-2 text-sm text-text2">
                  <input
                    type="checkbox"
                    checked={this.runComputerUse}
                    onChange={(e: Event) => {
                      this.runComputerUse = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  Computer Use (--computer-use)
                </label>
              </div>
            </div>
          )}

          {/* Sharing */}
          <div class="mb-4">
            <label class="flex items-center gap-2 text-sm text-text2 mb-2">
              <input
                type="checkbox"
                checked={this.runShare}
                onChange={(e: Event) => {
                  this.runShare = (e.target as HTMLInputElement).checked;
                }}
              />
              Enable sharing (--share)
            </label>
            {this.runShare && (
              <input
                type="text"
                class="cli-input w-full"
                placeholder="user@example.com:view  or  team:edit  or blank for self"
                value={this.runShareTarget}
                onInput={(e: Event) => {
                  this.runShareTarget = (e.target as HTMLInputElement).value;
                }}
              />
            )}
          </div>

          {/* Action button */}
          <button type="button" class="cli-btn cli-btn-success" disabled={!this.runPrompt.trim()} onClick={() => this.runCmd(preview)}>
            {this.runMode === 'local' ? 'Run Local Agent' : 'Launch Cloud Agent'}
          </button>
        </div>

        {/* Right: preview + output */}
        <div>
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview text-sm">{preview}</div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ─── Tab: Agents ──────────────────────────────────────────────────────────

  private renderAgentsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">List Skills / Agents</h3>
          <p class="text-text2 text-sm mb-4">
            <code>oz agent list</code> shows available skills from your environments. Filter by repository with --repo.
          </p>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Repository filter <span class="text-text2 text-xs opacity-60">(--repo, optional)</span>
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="owner/repo"
              value={this.agentListRepo}
              onInput={(e: Event) => {
                this.agentListRepo = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCmd(buildAgentListCommand(this.agentListRepo || undefined))}>
              List Agents / Skills
            </button>
          </div>

          <div class="mt-5 p-3 bg-bg3 rounded text-sm text-text2">
            <p class="mb-1 font-medium text-text">Note on running agents</p>
            <p>
              The oz CLI does not expose a dedicated command to list <em>currently running</em> agents or stream live logs. Use <strong>Runs &amp; Logs</strong> to inspect run
              history and status via <code>oz run list</code> / <code>oz run get</code>.
            </p>
          </div>
        </div>

        <div>
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview text-sm">{buildAgentListCommand(this.agentListRepo || undefined)}</div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ─── Tab: Runs & Logs ─────────────────────────────────────────────────────

  private renderLogsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Run History</h3>

          {/* List runs */}
          <div class="mb-5">
            <h4 class="text-sm font-medium mb-2">List Recent Runs</h4>
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Limit <span class="text-text2 text-xs opacity-60">(--limit)</span>
              <input
                type="number"
                class="cli-input w-24"
                min="1"
                max="100"
                value={this.runListLimit}
                onInput={(e: Event) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!Number.isNaN(v) && v > 0) this.runListLimit = v;
                }}
              />
            </label>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCmd(buildRunListCommand(this.runListLimit))}>
              List Runs
            </button>
          </div>

          {/* Get specific run */}
          <div class="border-t border-bg3 pt-4">
            <h4 class="text-sm font-medium mb-2">Get Run Details</h4>
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Run ID
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="run_abc123"
                value={this.runGetId}
                onInput={(e: Event) => {
                  this.runGetId = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <button
              type="button"
              class="cli-btn"
              style={{ background: 'var(--color-info)' }}
              disabled={!this.runGetId.trim()}
              onClick={() => this.runCmd(buildRunGetCommand(this.runGetId.trim()))}
            >
              Get Run
            </button>
          </div>

          <div class="mt-5 p-3 bg-bg3 rounded text-sm text-text2">
            <p>
              To stream live logs from a running cloud agent, open the session in the Warp UI (use <strong>--open</strong> when launching) or use
              <code> oz run get &lt;id&gt;</code> to poll status.
            </p>
          </div>
        </div>

        <div>
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview text-sm">{this.runGetId.trim() ? buildRunGetCommand(this.runGetId.trim()) : buildRunListCommand(this.runListLimit)}</div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ─── Tab: Swarm (Scheduling) ──────────────────────────────────────────────

  private renderSwarmTab() {
    const preview = this.buildSchedulePreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Schedule Agent Runs</h3>
          <p class="text-text2 text-sm mb-4">
            <code>oz schedule create</code> sets up recurring agent executions using standard cron syntax. Multi-agent swarm orchestration beyond scheduling is done via the Oz SDK
            / API — not exposed as a dedicated CLI subcommand.
          </p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Schedule name <span class="text-danger text-xs">(required)</span>
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. nightly-cleanup"
              value={this.schedName}
              onInput={(e: Event) => {
                this.schedName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Cron expression <span class="text-danger text-xs">(required)</span>
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="0 2 * * *  (daily at 2am)"
              value={this.schedCron}
              onInput={(e: Event) => {
                this.schedCron = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Prompt <span class="text-text2 text-xs opacity-60">(or use --skill)</span>
            <textarea
              class="cli-input w-full font-mono"
              style={{ height: '64px', resize: 'vertical' }}
              placeholder="Remove dead code and unused imports"
              value={this.schedPrompt}
              onInput={(e: Event) => {
                this.schedPrompt = (e.target as HTMLTextAreaElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Skill slug <span class="text-text2 text-xs opacity-60">(--skill, alternative to prompt)</span>
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g. flag-cleanup"
              value={this.schedSkill}
              onInput={(e: Event) => {
                this.schedSkill = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Environment ID <span class="text-text2 text-xs opacity-60">(--environment)</span>
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g. env_abc123"
              value={this.schedEnvironment}
              onInput={(e: Event) => {
                this.schedEnvironment = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Self-hosted worker ID <span class="text-text2 text-xs opacity-60">(--host)</span>
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g. my-worker"
              value={this.schedHost}
              onInput={(e: Event) => {
                this.schedHost = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          {/* Quick cron presets */}
          <div class="mb-4">
            <p class="text-text2 text-xs mb-2">Cron presets:</p>
            <div class="flex flex-wrap gap-2">
              {[
                { label: 'Hourly', cron: '0 * * * *' },
                { label: 'Daily 2am', cron: '0 2 * * *' },
                { label: 'Daily 9am', cron: '0 9 * * *' },
                { label: 'Weekly Mon', cron: '0 9 * * 1' },
              ].map(p => (
                <button
                  key={p.cron}
                  type="button"
                  class="cli-btn cli-btn-sm"
                  onClick={() => {
                    this.schedCron = p.cron;
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" class="cli-btn cli-btn-success" disabled={!this.schedName.trim() || !this.schedCron.trim()} onClick={() => this.runCmd(preview, true)}>
            Create Schedule
          </button>
        </div>

        <div>
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview text-sm">{preview}</div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ─── Tab: Config ──────────────────────────────────────────────────────────

  private renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Environments &amp; Models</h3>

          <div class="space-y-3">
            {/* List environments */}
            <div class="p-3 bg-bg3 rounded">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium">List Environments</p>
                  <code class="text-xs text-text2">oz environment list</code>
                </div>
                <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.runCmd(buildEnvironmentListCommand())}>
                  Run
                </button>
              </div>
            </div>

            {/* List environment images */}
            <div class="p-3 bg-bg3 rounded">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium">List Environment Images</p>
                  <code class="text-xs text-text2">oz environment image list</code>
                </div>
                <button type="button" class="cli-btn cli-btn-sm" style={{ background: 'var(--color-info)' }} onClick={() => this.runCmd(buildEnvironmentImageListCommand())}>
                  Run
                </button>
              </div>
            </div>

            {/* List models */}
            <div class="p-3 bg-bg3 rounded">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium">List Models</p>
                  <code class="text-xs text-text2">oz model list</code>
                </div>
                <button type="button" class="cli-btn cli-btn-sm" style={{ background: 'var(--color-info)' }} onClick={() => this.runCmd(buildModelListCommand())}>
                  Run
                </button>
              </div>
            </div>

            {/* oz help */}
            <div class="p-3 bg-bg3 rounded">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium">CLI Help</p>
                  <code class="text-xs text-text2">oz help</code>
                </div>
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runCmd('oz help')}>
                  Run
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview text-sm">{buildEnvironmentListCommand()}</div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ─── Tab: Auth ────────────────────────────────────────────────────────────

  private renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Authentication</h3>

          {/* Interactive login */}
          <div class="mb-5">
            <h4 class="text-sm font-medium mb-2">Interactive Login</h4>
            <p class="text-text2 text-sm mb-3">Opens a browser for Warp sign-in. Credentials are stored securely for local use.</p>
            <div class="cli-cmd-preview text-sm mb-3">{buildLoginCommand()}</div>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCmd(buildLoginCommand())}>
              oz login
            </button>
          </div>

          {/* API key for CI */}
          <div class="border-t border-bg3 pt-4">
            <h4 class="text-sm font-medium mb-2">API Key (CI / Headless)</h4>
            <p class="text-text2 text-sm mb-3">
              Set <code>WARP_API_KEY</code> for non-interactive environments (GitHub Actions, Jenkins, etc.). The key format is <code>wk-...</code>.
            </p>
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              WARP_API_KEY value
              <div class="flex gap-2">
                <input
                  type={this.apiKeyVisible ? 'text' : 'password'}
                  class="cli-input flex-1 font-mono"
                  placeholder="wk-..."
                  value={this.apiKeyValue}
                  onInput={(e: Event) => {
                    this.apiKeyValue = (e.target as HTMLInputElement).value;
                  }}
                />
                <button
                  type="button"
                  class="cli-btn cli-btn-sm"
                  onClick={() => {
                    this.apiKeyVisible = !this.apiKeyVisible;
                  }}
                >
                  {this.apiKeyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <div class="cli-cmd-preview text-sm mb-2">{this.apiKeyValue ? `export WARP_API_KEY="${this.apiKeyValue.slice(0, 6)}..."` : 'export WARP_API_KEY="wk-..."'}</div>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const cmd = `export WARP_API_KEY="${this.apiKeyValue}"`;
                this.runCmd(cmd);
              }}
              disabled={!this.apiKeyValue.trim()}
            >
              Copy export command
            </button>
          </div>
        </div>

        <div>
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview text-sm">{buildLoginCommand()}</div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ─── Tab: Docs ────────────────────────────────────────────────────────────

  private renderDocsTab() {
    const man = getOzManPage();
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{man.name}</h2>
          <p class="text-text2 text-sm mb-1 font-mono">{man.synopsis}</p>
          <p class="text-sm mb-5">{man.description}</p>

          {man.sections.map((sec, i) => (
            <div key={i} class="mb-6">
              <h3 class="text-base font-semibold mb-2">{sec.title}</h3>
              <pre class="cli-output text-sm">{sec.content}</pre>
            </div>
          ))}

          <div class="mt-6">
            <h3 class="text-base font-semibold mb-3">Examples</h3>
            <div class="space-y-2">
              {man.examples.map((ex, i) => (
                <div key={i} class="flex gap-4 items-start p-3 bg-bg3 rounded">
                  <code class="font-mono text-sm flex-1 text-success">{ex.command}</code>
                  <span class="text-text2 text-sm shrink-0">{ex.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div class="mt-6 p-3 bg-bg3 rounded text-sm text-text2">
            <p>
              Source:{' '}
              <a href="https://docs.warp.dev/reference/cli/cli" class="text-info underline" target="_blank" rel="noreferrer">
                docs.warp.dev/reference/cli/cli
              </a>{' '}
              ·{' '}
              <a href="https://docs.warp.dev/reference/cli/quickstart" class="text-info underline" target="_blank" rel="noreferrer">
                Quickstart
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  private renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
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

  // ─── Root render ──────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🪄</span> Oz CLI
          </h2>
          <p class="text-text2 text-sm">Warp cloud agent orchestration toolkit</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'run' && this.renderRunTab()}
          {this.activeTab === 'agents' && this.renderAgentsTab()}
          {this.activeTab === 'logs' && this.renderLogsTab()}
          {this.activeTab === 'swarm' && this.renderSwarmTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'auth' && this.renderAuthTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
        </div>
      </div>
    );
  }
}
