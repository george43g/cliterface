/**
 * cursor-agent service
 *
 * Wraps the Cursor Agent CLI for launching and managing chat sessions and
 * cloud agent tasks. All commands are stubs — replace `executeCommand` with
 * your native bridge (Tauri invoke, Electron IPC, WKWebView handler, etc.).
 *
 * Install: `curl https://cursor.com/install -fsS | bash`
 * Binary:  `agent` (verified against docs.cursor.com 2026-05).
 *   - The Cursor editor binary `cursor` is separate (it's the IDE binary).
 *   - There is no `cursor agent` sub-command on the editor binary.
 *   - In some past docs the binary was referred to as `cursor-agent`; the
 *     current install script provides `agent`.
 * Docs:    https://cursor.com/docs/cli/overview
 */

export { type CommandResult, executeCommand } from '../utils/execute-command';
import { type CommandResult, executeCommand } from '../utils/execute-command';

// ── Option types ────────────────────────────────────────────────────────────

export type AgentMode = 'agent' | 'plan' | 'ask';
export type OutputFormat = 'text' | 'json' | 'stream-json';
export type SandboxMode = 'enabled' | 'disabled';

export interface RunOptions {
  /** Task prompt / initial message. */
  prompt: string;
  /** Agent mode (default: agent). */
  mode?: AgentMode;
  /** AI model to use (e.g. "claude-4-opus", "gpt-4o"). */
  model?: string;
  /** Output format. */
  outputFormat?: OutputFormat;
  /** Run non-interactively, printing response to stdout. */
  print?: boolean;
  /** Sandbox mode. */
  sandbox?: SandboxMode;
  /** Run in a new Git worktree (isolates edits). */
  worktree?: boolean;
  /** Workspace directory to operate in. */
  workspace?: string;
  /** Resume a previous chat session by ID. Omit to resume the latest. */
  resumeId?: string;
  /** Force-allow all commands (skip permission prompts). */
  force?: boolean;
  /** Auto-approve all MCP servers. */
  approveMcps?: boolean;
  /** Skip workspace trust prompts (headless mode). */
  trust?: boolean;
  /** Cloud agent mode — prepend `&` to push task to a cloud agent. */
  cloud?: boolean;
}

// ── Command builders ─────────────────────────────────────────────────────────

/** The CLI command prefix. Adjust if the installed binary differs. */
const CLI = 'agent';

/** Build an `agent` invocation string from structured options. */
export function buildRunCommand(opts: RunOptions): string {
  const parts: string[] = [CLI];

  // Mode
  if (opts.mode && opts.mode !== 'agent') {
    parts.push(`--mode ${opts.mode}`);
  }

  // Model
  if (opts.model) {
    parts.push(`--model ${opts.model}`);
  }

  // Output format
  if (opts.outputFormat && opts.outputFormat !== 'text') {
    parts.push(`--output-format ${opts.outputFormat}`);
  }

  // Non-interactive print mode
  if (opts.print) {
    parts.push('--print');
  }

  // Sandbox
  if (opts.sandbox) {
    parts.push(`--sandbox ${opts.sandbox}`);
  }

  // Worktree isolation
  if (opts.worktree) {
    parts.push('--worktree');
  }

  // Workspace path
  if (opts.workspace?.trim()) {
    parts.push(`--workspace ${opts.workspace.trim()}`);
  }

  // Resume / continue
  if (opts.resumeId?.trim()) {
    parts.push(`--resume ${opts.resumeId.trim()}`);
  }

  // Force / yolo
  if (opts.force) {
    parts.push('--force');
  }

  // Auto-approve MCPs
  if (opts.approveMcps) {
    parts.push('--approve-mcps');
  }

  // Trust (headless)
  if (opts.trust) {
    parts.push('--trust');
  }

  // Prompt — cloud agents use `& <prompt>`, local use quoted prompt
  if (opts.prompt.trim()) {
    const escaped = opts.prompt.replace(/'/g, "'\\''");
    const prefix = opts.cloud ? '& ' : '';
    parts.push(`'${prefix}${escaped}'`);
  }

  return parts.join(' ');
}

/** Build `agent ls` — list previous chat sessions. */
export function buildListCommand(): string {
  return `${CLI} ls`;
}

/** Build `agent resume [id]` — resume most recent or specific session. */
export function buildResumeCommand(chatId?: string): string {
  if (chatId?.trim()) {
    return `${CLI} resume ${chatId.trim()}`;
  }
  return `${CLI} resume`;
}

/** Build `agent models` — list available models. */
export function buildListModelsCommand(): string {
  return 'agent models';
}

/** Build `agent status` — show auth/login status. */
export function buildStatusCommand(): string {
  return 'agent status';
}

/** Build `agent login` — authenticate. */
export function buildLoginCommand(): string {
  return 'agent login';
}

/** Build `cursor logout` — deauthenticate. */
export function buildLogoutCommand(): string {
  return 'cursor logout';
}

// ── High-level service API ───────────────────────────────────────────────────

export const cursorAgentService = {
  /** Launch an agent task (blocking / print mode). */
  async run(opts: RunOptions): Promise<CommandResult> {
    return executeCommand(buildRunCommand({ ...opts, print: true }));
  },

  /** List previous chat sessions. */
  async list(): Promise<CommandResult> {
    return executeCommand(buildListCommand());
  },

  /** Resume a previous session. */
  async resume(chatId?: string): Promise<CommandResult> {
    return executeCommand(buildResumeCommand(chatId));
  },

  /** List available models. */
  async listModels(): Promise<CommandResult> {
    return executeCommand(buildListModelsCommand());
  },

  /** Show current auth status. */
  async status(): Promise<CommandResult> {
    return executeCommand(buildStatusCommand());
  },

  /** Log in to Cursor. */
  async login(): Promise<CommandResult> {
    return executeCommand(buildLoginCommand());
  },

  /** Log out of Cursor. */
  async logout(): Promise<CommandResult> {
    return executeCommand(buildLogoutCommand());
  },
};
