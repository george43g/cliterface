import { executeCommand as execCmd } from '../yabai/yabai-service';

export type { CommandResult } from '../yabai/yabai-service';

import type { CommandResult } from '../yabai/yabai-service';

// ── Model names ──────────────────────────────────────────────────────────────
export const CODEX_MODELS = ['o4-mini', 'o3', 'o3-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini'] as const;

export type CodexModel = (typeof CODEX_MODELS)[number];

// ── Sandbox modes ─────────────────────────────────────────────────────────────
export const SANDBOX_MODES = ['read-only', 'workspace-write', 'danger-full-access'] as const;
export type SandboxMode = (typeof SANDBOX_MODES)[number];

// ── Approval policies ─────────────────────────────────────────────────────────
export const APPROVAL_POLICIES = ['untrusted', 'on-request', 'never'] as const;
export type ApprovalPolicy = (typeof APPROVAL_POLICIES)[number];

// ── Run options ───────────────────────────────────────────────────────────────
export interface CodexRunOptions {
  prompt: string;
  model?: CodexModel;
  sandbox?: SandboxMode;
  approvalPolicy?: ApprovalPolicy;
  profile?: string;
  workdir?: string;
  fullAuto?: boolean;
  search?: boolean;
  nonInteractive?: boolean;
  sessionId?: string;
  addDir?: string;
  noAltScreen?: boolean;
}

// ── MCP server types ──────────────────────────────────────────────────────────
export interface McpServer {
  name: string;
  url?: string;
  command?: string;
  env?: Record<string, string>;
}

// ── Build codex command string ────────────────────────────────────────────────
export function buildCodexCommand(opts: CodexRunOptions): string {
  const parts: string[] = ['codex'];

  if (opts.nonInteractive) {
    parts.push('exec');
    if (opts.sessionId) {
      parts.push('resume', opts.sessionId);
    }
  } else if (opts.sessionId) {
    parts.push('resume', opts.sessionId);
  }

  if (opts.model) parts.push('-m', opts.model);
  if (opts.sandbox) parts.push('-s', opts.sandbox);
  if (opts.approvalPolicy) parts.push('-a', opts.approvalPolicy);
  if (opts.profile) parts.push('-p', opts.profile);
  if (opts.workdir) parts.push('-C', opts.workdir);
  if (opts.fullAuto) parts.push('--full-auto');
  if (opts.search) parts.push('--search');
  if (opts.noAltScreen) parts.push('--no-alt-screen');
  if (opts.addDir) parts.push('--add-dir', opts.addDir);

  if (opts.prompt) parts.push(`"${opts.prompt.replace(/"/g, '\\"')}"`);

  return parts.join(' ');
}

export function buildMcpAddCommand(name: string, url?: string, command?: string, envVars = ''): string {
  if (url) {
    return `codex mcp add ${name} --url ${url}${envVars ? ` ${envVars}` : ''}`;
  }
  if (command) {
    return `codex mcp add ${name} -- ${command}${envVars ? ` ${envVars}` : ''}`;
  }
  return `codex mcp add ${name}`;
}

export function buildLoginCommand(method: 'chatgpt' | 'api-key'): string {
  if (method === 'api-key') return 'echo $OPENAI_API_KEY | codex login --with-api-key';
  return 'codex login';
}

// ── Service object ────────────────────────────────────────────────────────────
export const codexService = {
  async exec(opts: CodexRunOptions): Promise<CommandResult> {
    const cmd = buildCodexCommand({ ...opts, nonInteractive: true });
    return execCmd(cmd);
  },

  async resume(sessionId: string, prompt?: string, opts: Partial<CodexRunOptions> = {}): Promise<CommandResult> {
    const parts = ['codex', 'resume'];
    if (opts.model) parts.push('-m', opts.model);
    if (opts.sandbox) parts.push('-s', opts.sandbox);
    if (sessionId) parts.push(sessionId);
    if (prompt) parts.push(`"${prompt.replace(/"/g, '\\"')}"`);
    return execCmd(parts.join(' '));
  },

  async loginStatus(): Promise<CommandResult> {
    return execCmd('codex login status');
  },

  async logout(): Promise<CommandResult> {
    return execCmd('codex logout');
  },

  async mcpList(): Promise<CommandResult> {
    return execCmd('codex mcp list --json');
  },

  async mcpAdd(name: string, url?: string, command?: string): Promise<CommandResult> {
    return execCmd(buildMcpAddCommand(name, url, command));
  },

  async mcpRemove(name: string): Promise<CommandResult> {
    return execCmd(`codex mcp remove ${name}`);
  },

  async version(): Promise<CommandResult> {
    return execCmd('codex --version');
  },
};
