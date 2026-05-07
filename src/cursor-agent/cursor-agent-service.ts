/**
 * cursor-agent service
 *
 * Wraps the Cursor CLI (`cursor agent` / `cursor-agent`) for launching and managing
 * cloud agent tasks. All commands are stubs — replace `executeCommand` with your
 * native bridge (Tauri invoke, Electron IPC, WKWebView handler, etc.).
 *
 * CLI reference: https://cursor.com/docs/cli/reference/parameters
 *
 * NOTE: The binary may be `cursor agent` (sub-command of the `cursor` binary)
 * rather than a standalone `cursor-agent` executable. Comments throughout
 * reflect this uncertainty — adjust the command prefix as needed.
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
const CLI = 'cursor agent';

/**
 * Build a `cursor agent` invocation string from structured options.
 * Marks uncertain flags with comments where the docs are ambiguous.
 */
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

/** Build `cursor agent ls` — list previous chat sessions. */
export function buildListCommand(): string {
  return `${CLI} ls`;
}

/** Build `cursor agent resume [id]` — resume most recent or specific session. */
export function buildResumeCommand(chatId?: string): string {
  if (chatId?.trim()) {
    return `${CLI} resume ${chatId.trim()}`;
  }
  return `${CLI} resume`;
}

/** Build `cursor models` — list available models. */
export function buildListModelsCommand(): string {
  // NOTE: `models` may be a top-level `cursor` sub-command, not `cursor agent` sub-command.
  return 'cursor models';
}

/** Build `cursor status` / `cursor whoami` — show auth/login status. */
export function buildStatusCommand(): string {
  // NOTE: `status` is a top-level `cursor` sub-command.
  return 'cursor status';
}

/** Build `cursor login` — authenticate. */
export function buildLoginCommand(): string {
  return 'cursor login';
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
