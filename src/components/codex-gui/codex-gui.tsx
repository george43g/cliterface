import { Component, h, State } from '@stencil/core';
import { getCodexManPage } from '../../codex/codex-documentation';
import {
  APPROVAL_POLICIES,
  type ApprovalPolicy,
  buildCodexCommand,
  buildLoginCommand,
  buildMcpAddCommand,
  CODEX_MODELS,
  type CodexModel,
  type CommandResult,
  codexService,
  SANDBOX_MODES,
  type SandboxMode,
} from '../../codex/codex-service';

const TAB_DEFINITIONS = [
  { id: 'run', label: 'Run' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'models', label: 'Models' },
  { id: 'sandbox', label: 'Sandbox' },
  { id: 'config', label: 'Config' },
  { id: 'mcp', label: 'MCP' },
  { id: 'auth', label: 'Auth' },
];

type CommandStatus = 'idle' | 'running' | 'success' | 'error';

@Component({
  tag: 'codex-gui',
  styleUrl: 'codex-gui.css',
  scoped: true,
})
export class CodexGui {
  // ── Global UI state ────────────────────────────────────────────────────────
  @State() activeTab = 'run';
  @State() status: CommandStatus = 'idle';
  @State() output = 'Configure your agent task and click Run.';
  @State() lastCommand = 'Ready...';
  @State() statusMessage = 'Ready';

  // ── Run tab ────────────────────────────────────────────────────────────────
  @State() prompt = '';
  @State() model: CodexModel = 'o4-mini';
  @State() sandbox: SandboxMode = 'workspace-write';
  @State() approvalPolicy: ApprovalPolicy = 'on-request';
  @State() profile = '';
  @State() workdir = '';
  @State() enableSearch = false;
  @State() addDir = '';
  @State() noAltScreen = false;
  @State() nonInteractive = false;
  @State() fullAuto = false;
  @State() bypassSandbox = false;

  // ── Sessions tab ───────────────────────────────────────────────────────────
  @State() sessionId = '';
  @State() resumePrompt = '';
  @State() resumeModel: CodexModel = 'o4-mini';
  @State() resumeSandbox: SandboxMode = 'workspace-write';
  @State() resumeLast = false;

  // ── MCP tab ────────────────────────────────────────────────────────────────
  @State() mcpName = '';
  @State() mcpUrl = '';
  @State() mcpCommand = '';
  @State() mcpEnvVars = '';
  @State() mcpRemoveName = '';
  @State() mcpAddType: 'url' | 'stdio' = 'url';

  // ── Auth tab ───────────────────────────────────────────────────────────────
  @State() authMethod: 'chatgpt' | 'api-key' = 'chatgpt';

  // ── Config tab ─────────────────────────────────────────────────────────────
  @State() configKey = '';
  @State() configValue = '';
  @State() configProfile = '';

  // ── Helpers ────────────────────────────────────────────────────────────────

  private setStatus(msg: string, resetTo = 'Ready', delay = 2500): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, delay);
    }
  }

  private applyResult(result: CommandResult): void {
    const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
    this.output = parts.join('\n\n') || JSON.stringify(result, null, 2);
    this.status = result.exitCode === 0 ? 'success' : 'error';
    this.statusMessage = result.exitCode === 0 ? 'Done' : `Failed (exit ${result.exitCode})`;
  }

  private async run(cmd: string, fn: () => Promise<CommandResult>): Promise<void> {
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running…';
    this.statusMessage = 'Running…';
    try {
      const result = await fn();
      this.applyResult(result);
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private buildRunCommand(): string {
    const opts = {
      prompt: this.prompt,
      model: this.model,
      sandbox: this.bypassSandbox ? undefined : this.sandbox,
      approvalPolicy: this.fullAuto ? undefined : this.approvalPolicy,
      profile: this.profile || undefined,
      workdir: this.workdir || undefined,
      fullAuto: this.fullAuto,
      search: this.enableSearch,
      nonInteractive: this.nonInteractive,
      addDir: this.addDir || undefined,
      noAltScreen: this.noAltScreen,
    };
    let cmd = buildCodexCommand(opts);
    if (this.bypassSandbox) cmd += ' --dangerously-bypass-approvals-and-sandbox';
    return cmd;
  }

  private buildResumeCommand(): string {
    const parts = ['codex', 'resume'];
    if (this.resumeLast) {
      parts.push('--last');
    } else if (this.sessionId) {
      parts.push(this.sessionId);
    }
    if (this.resumeModel) parts.push('-m', this.resumeModel);
    if (this.resumeSandbox) parts.push('-s', this.resumeSandbox);
    if (this.resumePrompt) parts.push(`"${this.resumePrompt.replace(/"/g, '\\"')}"`);
    return parts.join(' ');
  }

  private buildConfigOverrideCommand(): string {
    if (!this.configKey || !this.configValue) return 'codex -c key=value "prompt"';
    return `codex -c ${this.configKey}=${this.configValue}${this.configProfile ? ` -p ${this.configProfile}` : ''} "prompt"`;
  }

  async executeRun(): Promise<void> {
    if (!this.prompt.trim()) {
      this.output = 'Please enter a prompt.';
      this.status = 'error';
      return;
    }
    if (this.bypassSandbox) {
      if (
        typeof window !== 'undefined' &&
        !window.confirm('WARNING: This bypasses ALL sandboxing and approval prompts. Only use in externally sandboxed environments. Continue?')
      ) {
        return;
      }
    }
    const cmd = this.buildRunCommand();
    await this.run(cmd, () =>
      codexService.exec({
        prompt: this.prompt,
        model: this.model,
        sandbox: this.bypassSandbox ? undefined : this.sandbox,
        approvalPolicy: this.fullAuto ? undefined : this.approvalPolicy,
        profile: this.profile || undefined,
        workdir: this.workdir || undefined,
        fullAuto: this.fullAuto,
        search: this.enableSearch,
        nonInteractive: true,
        addDir: this.addDir || undefined,
        noAltScreen: this.noAltScreen,
      }),
    );
  }

  async executeResume(): Promise<void> {
    const cmd = this.buildResumeCommand();
    await this.run(cmd, () =>
      codexService.resume(this.resumeLast ? '--last' : this.sessionId, this.resumePrompt || undefined, {
        model: this.resumeModel,
        sandbox: this.resumeSandbox,
      }),
    );
  }

  async executeLoginStatus(): Promise<void> {
    await this.run('codex login status', () => codexService.loginStatus());
  }

  async executeLogin(): Promise<void> {
    const cmd = buildLoginCommand(this.authMethod);
    await this.run(cmd, () => codexService.loginStatus()); // stub — real login opens browser
  }

  async executeLogout(): Promise<void> {
    if (typeof window === 'undefined' || window.confirm('Remove stored authentication credentials?')) {
      await this.run('codex logout', () => codexService.logout());
    }
  }

  async executeMcpList(): Promise<void> {
    await this.run('codex mcp list --json', () => codexService.mcpList());
  }

  async executeMcpAdd(): Promise<void> {
    if (!this.mcpName.trim()) {
      this.output = 'MCP server name is required.';
      this.status = 'error';
      return;
    }
    const cmd = buildMcpAddCommand(this.mcpName, this.mcpAddType === 'url' ? this.mcpUrl : undefined, this.mcpAddType === 'stdio' ? this.mcpCommand : undefined, this.mcpEnvVars);
    await this.run(cmd, () => codexService.mcpAdd(this.mcpName, this.mcpAddType === 'url' ? this.mcpUrl : undefined, this.mcpAddType === 'stdio' ? this.mcpCommand : undefined));
  }

  async executeMcpRemove(): Promise<void> {
    if (!this.mcpRemoveName.trim()) return;
    if (typeof window === 'undefined' || window.confirm(`Remove MCP server "${this.mcpRemoveName}"?`)) {
      await this.run(`codex mcp remove ${this.mcpRemoveName}`, () => codexService.mcpRemove(this.mcpRemoveName));
    }
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setStatus('Copied to clipboard');
  }

  clearOutput(): void {
    this.output = 'Configure your agent task and click Run.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Tab renderers ──────────────────────────────────────────────────────────

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => (this.activeTab = tab.id)}>
        {tab.label}
      </button>
    ));
  }

  renderStatusBadge() {
    const cls = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-warning' : 'text-text2';
    return <span class={cls}>{this.statusMessage}</span>;
  }

  renderOutputPanel() {
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <div class="text-sm text-text2">Status: {this.renderStatusBadge()}</div>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderRunTab() {
    const previewCmd = this.buildRunCommand();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left: prompt + settings */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Agent Task</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Prompt
            <textarea
              class="cli-input w-full font-mono"
              rows={4}
              placeholder="Describe the coding task…"
              value={this.prompt}
              onInput={(e: Event) => (this.prompt = (e.target as HTMLTextAreaElement).value)}
            />
          </label>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Model
              <select class="cli-select w-full" onChange={(e: Event) => (this.model = (e.target as HTMLSelectElement).value as CodexModel)}>
                {CODEX_MODELS.map(m => (
                  <option key={m} value={m} selected={this.model === m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Sandbox
              <select
                class={`cli-select w-full ${this.sandbox === 'danger-full-access' ? 'border-danger' : ''}`}
                onChange={(e: Event) => (this.sandbox = (e.target as HTMLSelectElement).value as SandboxMode)}
                disabled={this.bypassSandbox}
              >
                {SANDBOX_MODES.map(s => (
                  <option key={s} value={s} selected={this.sandbox === s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Approval Policy
              <select class="cli-select w-full" onChange={(e: Event) => (this.approvalPolicy = (e.target as HTMLSelectElement).value as ApprovalPolicy)} disabled={this.fullAuto}>
                {APPROVAL_POLICIES.map(p => (
                  <option key={p} value={p} selected={this.approvalPolicy === p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Working Dir (-C)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="/path/to/project"
                value={this.workdir}
                onInput={(e: Event) => (this.workdir = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.fullAuto} onChange={(e: Event) => (this.fullAuto = (e.target as HTMLInputElement).checked)} />
              --full-auto
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.enableSearch} onChange={(e: Event) => (this.enableSearch = (e.target as HTMLInputElement).checked)} />
              --search
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.nonInteractive} onChange={(e: Event) => (this.nonInteractive = (e.target as HTMLInputElement).checked)} />
              exec (non-interactive)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.noAltScreen} onChange={(e: Event) => (this.noAltScreen = (e.target as HTMLInputElement).checked)} />
              --no-alt-screen
            </label>
          </div>

          {/* Advanced settings */}
          <details class="mb-4">
            <summary class="text-sm text-text2 cursor-pointer mb-2">Advanced options</summary>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Profile (-p)
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="profile name"
                  value={this.profile}
                  onInput={(e: Event) => (this.profile = (e.target as HTMLInputElement).value)}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Add Dir
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="/extra/writable/dir"
                  value={this.addDir}
                  onInput={(e: Event) => (this.addDir = (e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          </details>

          {/* Danger zone */}
          <div class={`p-3 rounded-lg border mb-4 ${this.bypassSandbox ? 'border-danger bg-danger/10' : 'border-bg3'}`}>
            <label class="flex items-start gap-2 text-sm">
              <input type="checkbox" class="mt-0.5" checked={this.bypassSandbox} onChange={(e: Event) => (this.bypassSandbox = (e.target as HTMLInputElement).checked)} />
              <span>
                <span class="text-danger font-semibold">--dangerously-bypass-approvals-and-sandbox</span>
                <br />
                <span class="text-text2 text-xs">Skip ALL confirmation prompts and sandboxing. EXTREMELY DANGEROUS. Use only in isolated environments.</span>
              </span>
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class={`cli-btn ${this.bypassSandbox ? 'cli-btn-danger' : 'cli-btn-success'}`}
              onClick={() => this.executeRun()}
              disabled={this.status === 'running'}
            >
              {this.bypassSandbox ? 'Run (DANGER)' : 'Run Agent'}
            </button>
          </div>
        </div>

        {/* Right: command preview + output */}
        <div class="flex flex-col gap-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview font-mono text-sm break-all">{previewCmd}</div>
            {this.bypassSandbox && <p class="text-danger text-xs mt-2">Warning: sandboxing bypassed — all filesystem operations are unrestricted.</p>}
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  renderSessionsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Resume Session</h3>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.resumeLast} onChange={(e: Event) => (this.resumeLast = (e.target as HTMLInputElement).checked)} />
            Resume most recent (--last)
          </label>

          {!this.resumeLast && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
              Session ID
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="UUID or thread name"
                value={this.sessionId}
                onInput={(e: Event) => (this.sessionId = (e.target as HTMLInputElement).value)}
              />
              <span class="text-xs text-text2">Find IDs in ~/.codex/sessions/</span>
            </label>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Continuation Prompt (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="Continue with…"
              value={this.resumePrompt}
              onInput={(e: Event) => (this.resumePrompt = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Model
              <select class="cli-select w-full" onChange={(e: Event) => (this.resumeModel = (e.target as HTMLSelectElement).value as CodexModel)}>
                {CODEX_MODELS.map(m => (
                  <option key={m} value={m} selected={this.resumeModel === m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Sandbox
              <select class="cli-select w-full" onChange={(e: Event) => (this.resumeSandbox = (e.target as HTMLSelectElement).value as SandboxMode)}>
                {SANDBOX_MODES.map(s => (
                  <option key={s} value={s} selected={this.resumeSandbox === s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="cli-cmd-preview font-mono text-sm mb-4">{this.buildResumeCommand()}</div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeResume()} disabled={this.status === 'running'}>
            Resume Session
          </button>
        </div>

        <div>
          <div class="cli-card mb-4">
            <h3 class="text-text2 text-base mb-3">Sessions Info</h3>
            <p class="text-sm text-text2 mb-2">
              Sessions are stored in <code class="font-mono text-xs">~/.codex/sessions/</code>
            </p>
            <p class="text-sm text-text2 mb-3">
              Use <code class="font-mono text-xs">codex resume</code> (no args) for an interactive picker, or <code class="font-mono text-xs">--last</code> for the most recent.
            </p>
            <div class="flex gap-2 flex-wrap">
              <span class="text-xs px-2 py-1 bg-bg3 rounded">codex resume</span>
              <span class="text-xs px-2 py-1 bg-bg3 rounded">codex resume --last</span>
              <span class="text-xs px-2 py-1 bg-bg3 rounded">codex fork</span>
            </div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  renderModelsTab() {
    const modelInfo: Record<string, { tier: string; description: string }> = {
      'o4-mini': { tier: 'Fast', description: 'Fastest reasoning model; best for most coding tasks. Low cost, high throughput.' },
      o3: { tier: 'Powerful', description: 'Full reasoning model; best for complex multi-step tasks. Higher latency and cost.' },
      'o3-mini': { tier: 'Balanced', description: 'Smaller reasoning model; good balance of speed and capability.' },
      'gpt-4.1': { tier: 'General', description: 'Latest GPT-4.1; strong general coding, follows instructions precisely.' },
      'gpt-4.1-mini': { tier: 'Fast', description: 'Smaller GPT-4.1; fast and affordable for lighter tasks.' },
      'gpt-4o': { tier: 'General', description: 'Multimodal; accepts images via -i flag.' },
      'gpt-4o-mini': { tier: 'Fast', description: 'Smallest GPT-4o; very fast, lightweight tasks.' },
      o1: { tier: 'Reasoning', description: 'First-gen reasoning model; superseded by o3 for most tasks.' },
      'o1-mini': { tier: 'Reasoning', description: 'First-gen mini reasoning; superseded by o3-mini.' },
    };

    const tierColor: Record<string, string> = {
      Fast: 'text-success',
      Powerful: 'text-accent',
      Balanced: 'text-info',
      General: 'text-text',
      Reasoning: 'text-warning',
    };

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Available Models</h3>
          <div class="space-y-3">
            {CODEX_MODELS.map(m => {
              const info = modelInfo[m] ?? { tier: 'General', description: '' };
              return (
                <button
                  key={m}
                  type="button"
                  class={`w-full text-left p-3 rounded-lg border ${this.model === m ? 'border-accent bg-bg3' : 'border-bg3'} cursor-pointer`}
                  onClick={() => (this.model = m)}
                >
                  <div class="flex justify-between items-center mb-1">
                    <code class="font-mono text-sm font-semibold">{m}</code>
                    <span class={`text-xs font-medium ${tierColor[info.tier] ?? 'text-text2'}`}>{info.tier}</span>
                  </div>
                  <p class="text-xs text-text2">{info.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Model Selection</h3>
          <p class="text-sm text-text2 mb-3">
            Click a model on the left to select it for your run. Pass via <code class="font-mono text-xs">-m</code> flag:
          </p>
          <div class="cli-cmd-preview font-mono text-sm mb-4">codex -m {this.model} "prompt"</div>

          <h4 class="text-sm font-medium mb-2">Config default</h4>
          <div class="cli-output text-xs mb-4">{`# ~/.codex/config.toml\nmodel = "${this.model}"`}</div>

          <h4 class="text-sm font-medium mb-2">OSS / Local Models</h4>
          <p class="text-sm text-text2 mb-2">Use a local LM Studio or Ollama server:</p>
          <div class="cli-output text-xs">{'codex --oss "prompt"\ncodex --local-provider ollama "prompt"\ncodex --local-provider lmstudio "prompt"'}</div>
        </div>
      </div>
    );
  }

  renderSandboxTab() {
    interface SandboxDetail {
      label: string;
      badge: string;
      badgeCls: string;
      description: string;
      useCases: string[];
      warning?: string;
    }

    const sandboxDetails: Record<SandboxMode, SandboxDetail> = {
      'read-only': {
        label: 'Read-Only',
        badge: 'SAFE',
        badgeCls: 'cli-badge-safe',
        description: 'The agent can read files but cannot execute commands that modify the filesystem. Safe for audits and code review.',
        useCases: ['Code review & explanation', 'Security audits', 'Read-only analysis', 'Documentation generation'],
      },
      'workspace-write': {
        label: 'Workspace Write',
        badge: 'DEFAULT',
        badgeCls: 'cli-badge-info',
        description: 'Agent can write to the project workspace directory. Recommended for most coding tasks.',
        useCases: ['Feature development', 'Refactoring', 'Test generation', 'Bug fixing'],
      },
      'danger-full-access': {
        label: 'Danger: Full Access',
        badge: 'DANGER',
        badgeCls: 'cli-badge-sip',
        description: 'Full disk access with no sandboxing. Suitable only for isolated/sandboxed environments.',
        useCases: ['Docker containers', 'CI environments', 'VM/sandbox', 'System-level tasks'],
        warning: 'This mode grants unrestricted filesystem and command execution. Never use on a host machine with sensitive data.',
      },
    };

    const detail = sandboxDetails[this.sandbox];

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Sandbox Mode</h3>
          <div class="space-y-3 mb-6">
            {SANDBOX_MODES.map(mode => {
              const d = sandboxDetails[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  class={`w-full text-left p-3 rounded-lg border transition-all ${this.sandbox === mode ? (mode === 'danger-full-access' ? 'border-danger bg-danger/10' : 'border-accent bg-bg3') : 'border-bg3'} cursor-pointer`}
                  onClick={() => (this.sandbox = mode)}
                >
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-medium text-sm">{d.label}</span>
                    <span class={d.badgeCls}>{d.badge}</span>
                  </div>
                  <p class="text-xs text-text2">{d.description}</p>
                </button>
              );
            })}
          </div>

          <h4 class="text-sm font-medium mb-2">Approval Policy</h4>
          <div class="space-y-2">
            {APPROVAL_POLICIES.map(policy => (
              <button
                key={policy}
                type="button"
                class={`w-full text-left p-3 rounded-lg border text-sm transition-all ${this.approvalPolicy === policy ? 'border-accent bg-bg3' : 'border-bg3'}`}
                onClick={() => (this.approvalPolicy = policy)}
              >
                <code class="font-mono">{policy}</code>
                <span class="text-text2 text-xs ml-2">
                  {policy === 'untrusted' && '— only safe commands auto-run'}
                  {policy === 'on-request' && '— model decides when to ask'}
                  {policy === 'never' && '— no prompts, failures returned to model'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Selected: {detail.label}</h3>
          <p class="text-sm text-text2 mb-3">{detail.description}</p>

          <h4 class="text-sm font-medium mb-2">Recommended for:</h4>
          <ul class="list-disc list-inside space-y-1 mb-4">
            {detail.useCases.map((uc, i) => (
              <li key={i} class="text-sm text-text2">
                {uc}
              </li>
            ))}
          </ul>

          {detail.warning && (
            <div class="p-3 border border-danger rounded-lg mb-4">
              <p class="text-danger text-sm">{detail.warning}</p>
            </div>
          )}

          <div class="cli-cmd-preview font-mono text-sm mb-2">
            codex -s {this.sandbox} -a {this.approvalPolicy} "prompt"
          </div>
          <div class="cli-cmd-preview font-mono text-sm">codex --full-auto "prompt" {'# workspace-write + on-request'}</div>
        </div>
      </div>
    );
  }

  renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Runtime Config Override</h3>
          <p class="text-sm text-text2 mb-4">
            Pass <code class="font-mono text-xs">-c key=value</code> to override config.toml at runtime.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Config Key (dotted path)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="model"
                value={this.configKey}
                onInput={(e: Event) => (this.configKey = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Value (TOML)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder='"o3"'
                value={this.configValue}
                onInput={(e: Event) => (this.configValue = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Profile (-p)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="optional profile name"
                value={this.configProfile}
                onInput={(e: Event) => (this.configProfile = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="cli-cmd-preview font-mono text-sm mb-4">{this.buildConfigOverrideCommand()}</div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">~/.codex/config.toml Reference</h3>
          <pre class="cli-output text-xs">{`# Default model
model = "o4-mini"

# Sandbox permissions
sandbox_permissions = ["disk-full-read-access"]

# Project trust level
[projects."/path/to/project"]
trust_level = "trusted"

# Shell environment
[shell_environment_policy]
inherit = "all"

# Feature flags
[features]
some-feature = true

# MCP plugins
[plugins."github@openai-curated"]
enabled = true`}</pre>

          <h4 class="text-sm font-medium mt-4 mb-2">Common Overrides</h4>
          <div class="space-y-1">
            {[
              { k: 'model', v: '"o3"', desc: 'Change model' },
              { k: 'sandbox_permissions', v: '["disk-full-read-access"]', desc: 'Full disk access' },
              { k: 'shell_environment_policy.inherit', v: 'all', desc: 'Inherit env vars' },
            ].map((ex, i) => (
              <div key={i} class="flex gap-3 items-center p-2 bg-bg3 rounded text-xs">
                <code class="font-mono flex-1">
                  -c {ex.k}={ex.v}
                </code>
                <span class="text-text2">{ex.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderMcpTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Add MCP Server</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Server Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-server"
              value={this.mcpName}
              onInput={(e: Event) => (this.mcpName = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex gap-3 mb-4">
            <button type="button" class={`cli-btn cli-btn-sm ${this.mcpAddType === 'url' ? 'cli-btn-info' : ''}`} onClick={() => (this.mcpAddType = 'url')}>
              HTTP URL
            </button>
            <button type="button" class={`cli-btn cli-btn-sm ${this.mcpAddType === 'stdio' ? 'cli-btn-info' : ''}`} onClick={() => (this.mcpAddType = 'stdio')}>
              stdio (local)
            </button>
          </div>

          {this.mcpAddType === 'url' ? (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              URL
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="https://example.com/mcp"
                value={this.mcpUrl}
                onInput={(e: Event) => (this.mcpUrl = (e.target as HTMLInputElement).value)}
              />
            </label>
          ) : (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Command
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="npx -y @modelcontextprotocol/server-github"
                value={this.mcpCommand}
                onInput={(e: Event) => (this.mcpCommand = (e.target as HTMLInputElement).value)}
              />
            </label>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Env Vars (optional, space-separated KEY=VAL)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="GITHUB_TOKEN=xxx"
              value={this.mcpEnvVars}
              onInput={(e: Event) => (this.mcpEnvVars = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="cli-cmd-preview font-mono text-sm mb-4">
            {buildMcpAddCommand(
              this.mcpName || '<name>',
              this.mcpAddType === 'url' ? this.mcpUrl || '<url>' : undefined,
              this.mcpAddType === 'stdio' ? this.mcpCommand || '<command>' : undefined,
              this.mcpEnvVars,
            )}
          </div>

          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeMcpAdd()}>
              Add Server
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeMcpList()}>
              List Servers
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Remove MCP Server</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Server Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-server"
              value={this.mcpRemoveName}
              onInput={(e: Event) => (this.mcpRemoveName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="cli-cmd-preview font-mono text-sm mb-4">codex mcp remove {this.mcpRemoveName || '<name>'}</div>
          <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.executeMcpRemove()}>
            Remove Server
          </button>

          <hr class="border-bg3 my-4" />

          <h4 class="text-sm font-medium mb-3">Common MCP Servers</h4>
          <div class="space-y-2">
            {[
              { name: 'github', cmd: 'npx -y @modelcontextprotocol/server-github' },
              { name: 'filesystem', cmd: 'npx -y @modelcontextprotocol/server-filesystem /path' },
              { name: 'memory', cmd: 'npx -y @modelcontextprotocol/server-memory' },
            ].map((s, i) => (
              <div key={i} class="p-2 bg-bg3 rounded text-xs">
                <div class="font-medium mb-1">{s.name}</div>
                <code class="font-mono text-text2">
                  codex mcp add {s.name} -- {s.cmd}
                </code>
              </div>
            ))}
          </div>

          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  renderAuthTab() {
    const loginCmd = buildLoginCommand(this.authMethod);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Authentication</h3>

          <div class="flex gap-3 mb-4">
            <button type="button" class={`cli-btn cli-btn-sm ${this.authMethod === 'chatgpt' ? 'cli-btn-success' : ''}`} onClick={() => (this.authMethod = 'chatgpt')}>
              ChatGPT Login
            </button>
            <button type="button" class={`cli-btn cli-btn-sm ${this.authMethod === 'api-key' ? 'cli-btn-success' : ''}`} onClick={() => (this.authMethod = 'api-key')}>
              API Key
            </button>
          </div>

          {this.authMethod === 'chatgpt' ? (
            <div class="mb-4">
              <p class="text-sm text-text2 mb-3">
                Opens a browser to log in via your ChatGPT account. Credentials stored in <code class="font-mono text-xs">~/.codex/auth.json</code>.
              </p>
              <div class="cli-cmd-preview font-mono text-sm mb-2">codex login</div>
              <div class="cli-cmd-preview font-mono text-sm">codex login --device-auth</div>
            </div>
          ) : (
            <div class="mb-4">
              <p class="text-sm text-text2 mb-3">
                Pipe your OpenAI API key to stdin. Credentials stored in <code class="font-mono text-xs">~/.codex/auth.json</code>.
              </p>
              <div class="cli-cmd-preview font-mono text-sm">echo $OPENAI_API_KEY | codex login --with-api-key</div>
            </div>
          )}

          <div class="cli-cmd-preview font-mono text-sm mb-4">{loginCmd}</div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeLogin()}>
              {this.authMethod === 'chatgpt' ? 'Login' : 'Login with API Key'}
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeLoginStatus()}>
              Check Status
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-danger" onClick={() => this.executeLogout()}>
              Logout
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Auth Reference</h3>
          <div class="space-y-3">
            <div class="p-3 bg-bg3 rounded text-sm">
              <div class="font-medium mb-1">ChatGPT login (browser)</div>
              <code class="font-mono text-xs text-text2">codex login</code>
            </div>
            <div class="p-3 bg-bg3 rounded text-sm">
              <div class="font-medium mb-1">Device auth flow</div>
              <code class="font-mono text-xs text-text2">codex login --device-auth</code>
            </div>
            <div class="p-3 bg-bg3 rounded text-sm">
              <div class="font-medium mb-1">API key via env var</div>
              <code class="font-mono text-xs text-text2">echo $OPENAI_API_KEY | codex login --with-api-key</code>
            </div>
            <div class="p-3 bg-bg3 rounded text-sm">
              <div class="font-medium mb-1">Check login status</div>
              <code class="font-mono text-xs text-text2">codex login status</code>
            </div>
            <div class="p-3 bg-bg3 rounded text-sm">
              <div class="font-medium mb-1">Remove credentials</div>
              <code class="font-mono text-xs text-text2">codex logout</code>
            </div>
          </div>
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  renderDocsTab() {
    const man = getCodexManPage();
    return (
      <div class="cli-card">
        <h2 class="text-xl mb-2">{man.name}</h2>
        <p class="text-text2 text-sm mb-2 font-mono whitespace-pre-wrap">{man.synopsis}</p>
        <p class="whitespace-pre-wrap text-sm mb-6">{man.description}</p>
        {man.sections.map((section, i) => (
          <div key={i} class="mb-6">
            <h3 class="text-lg font-medium mb-2">{section.title}</h3>
            <pre class="cli-output text-sm">{section.content}</pre>
          </div>
        ))}
        <div class="mt-6">
          <h3 class="text-lg font-medium mb-2">Examples</h3>
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

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🧠</span> Codex CLI GUI
            <span class="text-sm font-normal text-text2">v0.118.0</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for OpenAI Codex — AI-powered coding agent</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'run' && this.renderRunTab()}
          {this.activeTab === 'sessions' && this.renderSessionsTab()}
          {this.activeTab === 'models' && this.renderModelsTab()}
          {this.activeTab === 'sandbox' && this.renderSandboxTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'mcp' && this.renderMcpTab()}
          {this.activeTab === 'auth' && this.renderAuthTab()}
        </div>
      </div>
    );
  }
}
