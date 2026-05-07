/**
 * oz-service.ts
 * Execution service for the Oz CLI (Warp cloud agent orchestration toolkit).
 *
 * All commands are stubs — replace executeCommand() with the appropriate native
 * bridge (Tauri invoke, Electron IPC, WKWebView message handler, etc.).
 *
 * Sources:
 *   https://docs.warp.dev/reference/cli/cli
 *   https://docs.warp.dev/reference/cli/quickstart
 *   https://docs.warp.dev/agent-platform/cloud-agents/self-hosting
 */

import { type CommandResult, executeCommand } from '../utils/execute-command';
export { type CommandResult, executeCommand };

// ─── Authentication ──────────────────────────────────────────────────────────

/**
 * oz login
 * Interactive browser-based sign-in. Stores credentials locally.
 * Documented: yes (quickstart + reference).
 */
export function buildLoginCommand(): string {
  return 'oz login';
}

// ─── Agent execution ─────────────────────────────────────────────────────────

export interface AgentRunOptions {
  prompt: string;
  /** -C / --cwd: working directory */
  cwd?: string;
  /** -n / --name: label the run */
  name?: string;
  /** --share[=target]: enable session sharing (optional access spec) */
  share?: boolean | string;
  /** --profile: agent profile ID */
  profile?: string;
  /** --model: override model */
  model?: string;
  /** --skill: use skill as base prompt */
  skill?: string;
  /** --mcp: MCP server spec (repeatable — pass multiple as array) */
  mcp?: string[];
  /** -e / --environment: cloud environment ID */
  environment?: string;
  /** -f / --file: config YAML/JSON file */
  file?: string;
}

/**
 * oz agent run
 * Run an agent locally in the current working directory.
 * Documented: yes.
 */
export function buildAgentRunCommand(opts: AgentRunOptions): string {
  const parts = ['oz', 'agent', 'run'];

  if (opts.prompt) parts.push('--prompt', JSON.stringify(opts.prompt));
  if (opts.cwd) parts.push('-C', opts.cwd);
  if (opts.name) parts.push('--name', JSON.stringify(opts.name));
  if (opts.share === true) parts.push('--share');
  else if (typeof opts.share === 'string' && opts.share) parts.push('--share', opts.share);
  if (opts.profile) parts.push('--profile', opts.profile);
  if (opts.model) parts.push('--model', opts.model);
  if (opts.skill) parts.push('--skill', opts.skill);
  for (const mcp of opts.mcp ?? []) parts.push('--mcp', JSON.stringify(mcp));
  if (opts.environment) parts.push('--environment', opts.environment);
  if (opts.file) parts.push('--file', opts.file);

  return parts.join(' ');
}

export interface CloudRunOptions extends AgentRunOptions {
  /** --no-environment: run without an environment */
  noEnvironment?: boolean;
  /** --open: open session in Warp UI */
  open?: boolean;
  /** --host: self-hosted worker ID */
  host?: string;
  /** --computer-use: enable computer-use capability */
  computerUse?: boolean;
  /** --attach: image file paths (max 5) */
  attach?: string[];
}

/**
 * oz agent run-cloud
 * Dispatch task to remote cloud infrastructure.
 * Documented: yes.
 */
export function buildCloudRunCommand(opts: CloudRunOptions): string {
  const parts = ['oz', 'agent', 'run-cloud'];

  if (opts.prompt) parts.push('--prompt', JSON.stringify(opts.prompt));
  if (opts.environment) parts.push('--environment', opts.environment);
  if (opts.noEnvironment) parts.push('--no-environment');
  if (opts.name) parts.push('--name', JSON.stringify(opts.name));
  if (opts.open) parts.push('--open');
  if (opts.model) parts.push('--model', opts.model);
  if (opts.skill) parts.push('--skill', opts.skill);
  if (opts.host) parts.push('--host', opts.host);
  if (opts.computerUse) parts.push('--computer-use');
  for (const mcp of opts.mcp ?? []) parts.push('--mcp', JSON.stringify(mcp));
  for (const a of opts.attach ?? []) parts.push('--attach', a);
  if (opts.file) parts.push('--file', opts.file);

  return parts.join(' ');
}

// ─── Run management ───────────────────────────────────────────────────────────

/**
 * oz run list [--limit N]
 * List recent cloud agent runs.
 * Documented: yes (reference page).
 */
export function buildRunListCommand(limit?: number): string {
  const parts = ['oz', 'run', 'list'];
  if (limit !== undefined) parts.push('--limit', String(limit));
  return parts.join(' ');
}

/**
 * oz run get <RUN_ID>
 * Retrieve details for a specific run.
 * Documented: yes (reference page).
 */
export function buildRunGetCommand(runId: string): string {
  return `oz run get ${runId}`;
}

// ─── Environments ─────────────────────────────────────────────────────────────

/**
 * oz environment list
 * Show available environment IDs.
 * Documented: yes (quickstart).
 */
export function buildEnvironmentListCommand(): string {
  return 'oz environment list';
}

/**
 * oz environment image list
 * Show suggested base images for cloud environments.
 * Documented: yes (reference page).
 */
export function buildEnvironmentImageListCommand(): string {
  return 'oz environment image list';
}

// ─── Models ───────────────────────────────────────────────────────────────────

/**
 * oz model list
 * Display all available models.
 * Documented: yes (reference page).
 */
export function buildModelListCommand(): string {
  return 'oz model list';
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

export interface ScheduleCreateOptions {
  name: string;
  /** Cron expression (e.g. "0 9 * * *") */
  cron: string;
  prompt?: string;
  skill?: string;
  environment?: string;
  /** Self-hosted worker ID */
  host?: string;
}

/**
 * oz schedule create
 * Create a recurring scheduled agent run.
 * Verified 2026-05 against docs.warp.dev/agent-platform/cloud-agents/self-hosting.
 * `oz schedule update <ID> --host` is also documented; create / list / delete
 * exist by convention but only create + update are quoted in the docs.
 */
export function buildScheduleCreateCommand(opts: ScheduleCreateOptions): string {
  const parts = ['oz', 'schedule', 'create', '--name', JSON.stringify(opts.name), '--cron', JSON.stringify(opts.cron)];
  if (opts.prompt) parts.push('--prompt', JSON.stringify(opts.prompt));
  if (opts.skill) parts.push('--skill', opts.skill);
  if (opts.environment) parts.push('--environment', opts.environment);
  if (opts.host) parts.push('--host', opts.host);
  return parts.join(' ');
}

// ─── Agent list ───────────────────────────────────────────────────────────────

/**
 * oz agent list [--repo owner/repo]
 * List available skills / agents from environments.
 * Documented: yes (reference page).
 *
 * NOTE: This lists skills/agents, not active running agents.
 * There is no documented "oz agent status" or "oz agent logs" command —
 * use "oz run list" / "oz run get" to inspect run history/status.
 */
export function buildAgentListCommand(repo?: string): string {
  const parts = ['oz', 'agent', 'list'];
  if (repo) parts.push('--repo', repo);
  return parts.join(' ');
}

// ─── Convenience service object ───────────────────────────────────────────────

export const ozService = {
  login: () => executeCommand(buildLoginCommand()),

  agentRun: (opts: AgentRunOptions) => executeCommand(buildAgentRunCommand(opts)),
  agentRunCloud: (opts: CloudRunOptions) => executeCommand(buildCloudRunCommand(opts)),
  agentList: (repo?: string) => executeCommand(buildAgentListCommand(repo)),

  runList: (limit?: number) => executeCommand(buildRunListCommand(limit)),
  runGet: (runId: string) => executeCommand(buildRunGetCommand(runId)),

  environmentList: () => executeCommand(buildEnvironmentListCommand()),
  environmentImageList: () => executeCommand(buildEnvironmentImageListCommand()),

  modelList: () => executeCommand(buildModelListCommand()),

  scheduleCreate: (opts: ScheduleCreateOptions) => executeCommand(buildScheduleCreateCommand(opts)),
};
