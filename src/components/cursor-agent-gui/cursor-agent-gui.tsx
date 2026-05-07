/**
 * cursor-agent-gui — Stencil GUI for the Cursor CLI agent runner.
 *
 * Tabs:
 *   Run        — Launch a new agent task (local or cloud, all modes)
 *   Agents     — List / resume past sessions
 *   Status/Logs — Auth status, model listing, raw output
 *   Config     — Workspace, sandbox, model, output-format toggles
 *   Auth       — Login / logout
 *
 * CLI reference: https://cursor.com/docs/cli/reference/parameters
 */

import { Component, h, State } from '@stencil/core';
import {
  type CommandResult,
  type AgentMode,
  type OutputFormat,
  type SandboxMode,
  cursorAgentService,
  buildRunCommand,
  buildListCommand,
  buildResumeCommand,
  buildListModelsCommand,
  buildStatusCommand,
  buildLoginCommand,
  buildLogoutCommand,
} from '../../cursor-agent/cursor-agent-service';

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'run', label: 'Run' },
  { id: 'agents', label: 'Agents' },
  { id: 'status', label: 'Status / Logs' },
  { id: 'config', label: 'Config' },
  { id: 'auth', label: 'Auth' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  tag: 'cursor-agent-gui',
  styleUrl: 'cursor-agent-gui.css',
  scoped: true,
})
export class CursorAgentGui {
  // ── Active tab ────────────────────────────────────────────────────────────
  @State() activeTab: TabId = 'run';

  // ── Execution state ───────────────────────────────────────────────────────
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'Ready…';
  @State() output = 'Configure an agent task and click Run to execute.';

  // ── Run tab ───────────────────────────────────────────────────────────────
  @State() prompt = '';
  @State() mode: AgentMode = 'agent';
  @State() cloud = false;
  @State() worktree = false;
  @State() force = false;
  @State() approveMcps = false;
  @State() trust = false;

  // ── Config tab (global defaults, injected into Run) ───────────────────────
  @State() model = '';
  @State() outputFormat: OutputFormat = 'text';
  @State() sandbox: SandboxMode | '' = '';
  @State() workspace = '';

  // ── Agents tab ────────────────────────────────────────────────────────────
  @State() resumeId = '';

  // ── Helpers ───────────────────────────────────────────────────────────────

  private setStatus(
    running: boolean,
    message: string,
    cmd: string,
  ): void {
    this.status = running ? 'running' : 'idle';
    this.statusMessage = message;
    this.lastCommand = cmd;
  }

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2500);
    }
  }

  private applyResult(result: CommandResult, cmd: string): void {
    const parts = [
      result.stdout?.trim(),
      result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : '',
    ].filter(Boolean);

    this.output = parts.join('\n\n') || JSON.stringify(result, null, 2);
    this.status = result.exitCode === 0 ? 'success' : 'error';
    this.statusMessage =
      result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    this.lastCommand = cmd;
  }

  // ── Command preview builder ───────────────────────────────────────────────

  private buildPreview(): string {
    return buildRunCommand({
      prompt: this.prompt || '<your task>',
      mode: this.mode,
      model: this.model || undefined,
      outputFormat: this.outputFormat !== 'text' ? this.outputFormat : undefined,
      print: true,
      sandbox: (this.sandbox as SandboxMode) || undefined,
      worktree: this.worktree || undefined,
      workspace: this.workspace || undefined,
      force: this.force || undefined,
      approveMcps: this.approveMcps || undefined,
      trust: this.trust || undefined,
      cloud: this.cloud || undefined,
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async runAgent(): Promise<void> {
    if (!this.prompt.trim()) {
      this.setTemporaryStatus('Enter a task prompt first');
      return;
    }
    const cmd = buildRunCommand({
      prompt: this.prompt,
      mode: this.mode,
      model: this.model || undefined,
      outputFormat: this.outputFormat !== 'text' ? this.outputFormat : undefined,
      print: true,
      sandbox: (this.sandbox as SandboxMode) || undefined,
      worktree: this.worktree || undefined,
      workspace: this.workspace || undefined,
      force: this.force || undefined,
      approveMcps: this.approveMcps || undefined,
      trust: this.trust || undefined,
      cloud: this.cloud || undefined,
    });
    this.setStatus(true, 'Running…', cmd);
    this.output = 'Executing…';
    try {
      const result = await cursorAgentService.run({
        prompt: this.prompt,
        mode: this.mode,
        model: this.model || undefined,
        outputFormat: this.outputFormat !== 'text' ? this.outputFormat : undefined,
        print: true,
        sandbox: (this.sandbox as SandboxMode) || undefined,
        worktree: this.worktree || undefined,
        workspace: this.workspace || undefined,
        force: this.force || undefined,
        approveMcps: this.approveMcps || undefined,
        trust: this.trust || undefined,
        cloud: this.cloud || undefined,
      });
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async listAgents(): Promise<void> {
    const cmd = buildListCommand();
    this.setStatus(true, 'Listing sessions…', cmd);
    this.output = 'Fetching session list…';
    try {
      const result = await cursorAgentService.list();
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async resumeSession(): Promise<void> {
    const cmd = buildResumeCommand(this.resumeId || undefined);
    if (
      !window.confirm(
        `Resume session${this.resumeId ? ` ${this.resumeId}` : ' (latest)'}?\n\n${cmd}`,
      )
    ) {
      return;
    }
    this.setStatus(true, 'Resuming…', cmd);
    this.output = 'Resuming session…';
    try {
      const result = await cursorAgentService.resume(this.resumeId || undefined);
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async fetchStatus(): Promise<void> {
    const cmd = buildStatusCommand();
    this.setStatus(true, 'Fetching status…', cmd);
    this.output = 'Checking auth status…';
    try {
      const result = await cursorAgentService.status();
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async fetchModels(): Promise<void> {
    const cmd = buildListModelsCommand();
    this.setStatus(true, 'Fetching models…', cmd);
    this.output = 'Listing available models…';
    try {
      const result = await cursorAgentService.listModels();
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async doLogin(): Promise<void> {
    const cmd = buildLoginCommand();
    this.setStatus(true, 'Logging in…', cmd);
    this.output = 'Opening browser for authentication…';
    try {
      const result = await cursorAgentService.login();
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async doLogout(): Promise<void> {
    const cmd = buildLogoutCommand();
    if (!window.confirm(`Log out of Cursor?\n\n${cmd}`)) return;
    this.setStatus(true, 'Logging out…', cmd);
    this.output = 'Logging out…';
    try {
      const result = await cursorAgentService.logout();
      this.applyResult(result, cmd);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
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
    this.output = 'Configure an agent task and click Run to execute.';
    this.lastCommand = 'Ready…';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Renderers ─────────────────────────────────────────────────────────────

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

  renderStatusBadge() {
    const colorClass =
      this.status === 'error'
        ? 'text-danger'
        : this.status === 'success'
          ? 'text-success'
          : this.status === 'running'
            ? 'text-warning'
            : 'text-text2';
    return (
      <span class={colorClass}>
        {this.status === 'running' ? '⏳ ' : ''}
        {this.statusMessage}
      </span>
    );
  }

  renderOutputPanel() {
    return (
      <div class="cli-card">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-text2 text-base">
            Output — {this.renderStatusBadge()}
          </h3>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => this.clearOutput()}
            >
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview text-xs mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Run tab ───────────────────────────────────────────────────────────────

  renderRunTab() {
    const preview = this.buildPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left: Task configuration */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Task Prompt</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Prompt / Task
            <textarea
              class="cli-input w-full font-mono h-24 resize-y"
              placeholder="Refactor the auth module and add comprehensive tests"
              onInput={(e: Event) => {
                this.prompt = (e.target as HTMLTextAreaElement).value;
              }}
            >
              {this.prompt}
            </textarea>
            <span class="text-xs text-text2">
              Prefix with <code>&amp;</code> via the Cloud toggle to push to a cloud agent.
            </span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Mode
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.mode = (e.target as HTMLSelectElement).value as AgentMode;
              }}
            >
              <option value="agent" selected={this.mode === 'agent'}>
                agent — full tool access (default)
              </option>
              <option value="plan" selected={this.mode === 'plan'}>
                plan — design approach, no code writes
              </option>
              <option value="ask" selected={this.mode === 'ask'}>
                ask — read-only exploration
              </option>
            </select>
          </label>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.cloud}
                onChange={(e: Event) => {
                  this.cloud = (e.target as HTMLInputElement).checked;
                }}
              />
              ☁️ Cloud agent (<code>&amp;</code>)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.worktree}
                onChange={(e: Event) => {
                  this.worktree = (e.target as HTMLInputElement).checked;
                }}
              />
              Git worktree (<code>--worktree</code>)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.force}
                onChange={(e: Event) => {
                  this.force = (e.target as HTMLInputElement).checked;
                }}
              />
              Force allow (<code>--force</code>)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.approveMcps}
                onChange={(e: Event) => {
                  this.approveMcps = (e.target as HTMLInputElement).checked;
                }}
              />
              Auto-approve MCPs
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.trust}
                onChange={(e: Event) => {
                  this.trust = (e.target as HTMLInputElement).checked;
                }}
              />
              Trust workspace (<code>--trust</code>)
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.runAgent()}
              disabled={this.status === 'running'}
            >
              {this.status === 'running' ? 'Running…' : '▶ Run Agent'}
            </button>
          </div>
        </div>

        {/* Right: Preview + Output */}
        <div class="flex flex-col gap-5">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview">{preview}</div>
            <p class="text-xs text-text2 mt-2">
              Uses <code>--print</code> (non-interactive) for GUI execution.
            </p>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Agents tab ────────────────────────────────────────────────────────────

  renderAgentsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List sessions */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Past Sessions</h3>
          <p class="text-sm text-text2 mb-4">
            Fetch the list of previous agent conversations (equivalent to{' '}
            <code>cursor agent ls</code>).
          </p>
          <div class="cli-cmd-preview mb-4">{buildListCommand()}</div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              this.activeTab = 'agents';
              this.listAgents();
            }}
            disabled={this.status === 'running'}
          >
            List Sessions
          </button>
        </div>

        {/* Resume session */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Resume Session</h3>
          <p class="text-sm text-text2 mb-3">
            Resume the latest session or specify a chat ID (from{' '}
            <code>cursor agent ls</code>).
          </p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Session / Chat ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="Leave blank to resume latest"
              value={this.resumeId}
              onInput={(e: Event) => {
                this.resumeId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview mb-4">
            {buildResumeCommand(this.resumeId || undefined)}
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-warning"
            onClick={() => this.resumeSession()}
            disabled={this.status === 'running'}
          >
            Resume Session
          </button>
        </div>

        {/* Output */}
        <div class="xl:col-span-2">{this.renderOutputPanel()}</div>
      </div>
    );
  }

  // ── Status/Logs tab ───────────────────────────────────────────────────────

  renderStatusTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Auth status */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Auth Status</h3>
          <p class="text-sm text-text2 mb-3">
            Show the currently authenticated user and session info (
            <code>cursor status</code>).
          </p>
          <div class="cli-cmd-preview mb-4">{buildStatusCommand()}</div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => this.fetchStatus()}
            disabled={this.status === 'running'}
          >
            Check Status
          </button>
        </div>

        {/* Available models */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Available Models</h3>
          <p class="text-sm text-text2 mb-3">
            List models you can use via <code>--model</code> (
            <code>cursor models</code>).
          </p>
          <div class="cli-cmd-preview mb-4">{buildListModelsCommand()}</div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => this.fetchModels()}
            disabled={this.status === 'running'}
          >
            List Models
          </button>
        </div>

        {/* Output */}
        <div class="xl:col-span-2">{this.renderOutputPanel()}</div>
      </div>
    );
  }

  // ── Config tab ────────────────────────────────────────────────────────────

  renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Global Defaults</h3>
          <p class="text-sm text-text2 mb-4">
            These defaults are applied to every Run invocation. Adjust per-run
            on the <strong>Run</strong> tab.
          </p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Model (<code>--model</code>)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g. claude-4-opus, gpt-4o (leave blank for default)"
              value={this.model}
              onInput={(e: Event) => {
                this.model = (e.target as HTMLInputElement).value;
              }}
            />
            <span class="text-xs text-text2">
              Use <strong>Status / Logs → List Models</strong> to see available options.
            </span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Output Format (<code>--output-format</code>)
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.outputFormat = (e.target as HTMLSelectElement).value as OutputFormat;
              }}
            >
              <option value="text" selected={this.outputFormat === 'text'}>
                text (default)
              </option>
              <option value="json" selected={this.outputFormat === 'json'}>
                json — structured response
              </option>
              <option value="stream-json" selected={this.outputFormat === 'stream-json'}>
                stream-json — delta streaming
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Sandbox (<code>--sandbox</code>)
            {/* NOTE: exact sandbox flag behaviour confirmed from docs */}
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.sandbox = (e.target as HTMLSelectElement).value as SandboxMode | '';
              }}
            >
              <option value="" selected={this.sandbox === ''}>
                — (not set)
              </option>
              <option value="enabled" selected={this.sandbox === 'enabled'}>
                enabled
              </option>
              <option value="disabled" selected={this.sandbox === 'disabled'}>
                disabled
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Workspace Path (<code>--workspace</code>)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g. ~/src/my-project (leave blank for cwd)"
              value={this.workspace}
              onInput={(e: Event) => {
                this.workspace = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Preview with Defaults</h3>
          <p class="text-sm text-text2 mb-3">
            Shows how the Run command will look with the current config applied.
          </p>
          <div class="cli-cmd-preview">{this.buildPreview()}</div>

          <div class="mt-4 p-3 bg-bg3 rounded-lg text-sm text-text2">
            <p class="font-medium mb-2">Notes</p>
            <ul class="space-y-1 list-disc list-inside">
              <li>
                <code>--print</code> is always added for GUI non-interactive use.
              </li>
              <li>
                Cloud agent (<code>&amp;</code>) pushes tasks to cursor.com/agents.
              </li>
              <li>
                <code>--worktree</code> creates an isolated Git worktree in{' '}
                <code>~/.cursor/worktrees</code>.
              </li>
              <li>
                Set <code>CURSOR_API_KEY</code> env var for headless/CI auth.
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth tab ──────────────────────────────────────────────────────────────

  renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Login */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Login</h3>
          <p class="text-sm text-text2 mb-3">
            Authenticate with your Cursor account. Opens a browser window for
            OAuth. Also supports <code>CURSOR_API_KEY</code> env var for
            headless/CI auth.
          </p>
          <div class="cli-cmd-preview mb-4">{buildLoginCommand()}</div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => this.doLogin()}
            disabled={this.status === 'running'}
          >
            Login
          </button>
        </div>

        {/* Logout */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Logout</h3>
          <p class="text-sm text-text2 mb-3">
            Sign out of your current Cursor session. You will need to log in
            again before running agents.
          </p>
          <div class="cli-cmd-preview mb-4">{buildLogoutCommand()}</div>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => this.doLogout()}
            disabled={this.status === 'running'}
          >
            Logout
          </button>
        </div>

        {/* Status quick-check */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">API Key Auth (Headless / CI)</h3>
          <p class="text-sm text-text2 mb-2">
            For non-interactive environments set the environment variable before
            running:
          </p>
          <div class="cli-cmd-preview">
            {`export CURSOR_API_KEY="your-api-key"\ncursor agent --print --trust 'your task here'`}
          </div>
          {/* NOTE: API key parameter name confirmed from docs: --api-key / CURSOR_API_KEY */}
          <p class="text-xs text-text2 mt-2">
            Alternatively pass <code>--api-key &lt;key&gt;</code> directly on the command line.
          </p>
        </div>

        {/* Output */}
        <div class="xl:col-span-2">{this.renderOutputPanel()}</div>
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>☁️</span> Cursor Agent CLI
          </h2>
          <p class="text-text2 text-sm">
            Cursor cloud agent task runner — launch, list, and manage AI agent sessions
          </p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">
          {this.renderTabs()}
        </div>

        <div class="tab-content">
          {this.activeTab === 'run' && this.renderRunTab()}
          {this.activeTab === 'agents' && this.renderAgentsTab()}
          {this.activeTab === 'status' && this.renderStatusTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'auth' && this.renderAuthTab()}
        </div>
      </div>
    );
  }
}
