/**
 * npx-skills service
 *
 * Targeted package: `skills` (npm: "skills", v1.5.5)
 * Homepage: https://skills.sh/
 * This is the official Anthropic-style reusable AI agent skills manager CLI.
 * It is the most popular `npx skills` implementation on npm as of 2025.
 *
 * All commands are built as strings and passed to the native bridge stub.
 * Replace executeCommand() body to wire up Tauri, Electron, WKWebView, etc.
 */

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export async function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB – replace with native bridge (Tauri invoke, Electron IPC, WKWebView, etc.)
  console.log('[npx-skills executeCommand]', cmd);
  return { stdout: `Mock output for: ${cmd}`, stderr: '', exitCode: 0 };
}

// ── Scope helpers ────────────────────────────────────────────────────────────

export type SkillsScope = 'project' | 'global';

function scopeFlag(scope: SkillsScope): string {
  return scope === 'global' ? ' -g' : '';
}

// ── Command builders ─────────────────────────────────────────────────────────

/**
 * skills list / ls
 * List installed skills for a scope, optionally filtered by agent.
 */
export function buildListCommand(scope: SkillsScope, agent = '', json = false): string {
  let cmd = `npx skills ls${scopeFlag(scope)}`;
  if (agent.trim()) cmd += ` -a ${agent.trim()}`;
  if (json) cmd += ' --json';
  return cmd;
}

/**
 * skills find [query]
 * Search the registry. Without a query it opens interactive mode.
 */
export function buildFindCommand(query = ''): string {
  const q = query.trim();
  return q ? `npx skills find ${q}` : 'npx skills find';
}

/**
 * skills add <package>
 */
export function buildAddCommand(pkg: string, scope: SkillsScope, agents: string[], skills: string[], yes = false, copy = false, all = false): string {
  const p = pkg.trim();
  if (!p) return '';
  let cmd = `npx skills add ${p}${scopeFlag(scope)}`;
  if (all) {
    cmd += ' --all';
  } else {
    if (agents.length > 0) cmd += ` -a ${agents.join(' ')}`;
    if (skills.length > 0) cmd += ` -s ${skills.join(' ')}`;
  }
  if (yes) cmd += ' -y';
  if (copy) cmd += ' --copy';
  return cmd;
}

/**
 * skills remove [skills...]
 */
export function buildRemoveCommand(skillNames: string[], scope: SkillsScope, agents: string[], yes = false, all = false): string {
  let cmd = `npx skills remove${scopeFlag(scope)}`;
  if (all) {
    cmd += ' --all';
  } else {
    if (skillNames.length > 0) cmd += ` ${skillNames.join(' ')}`;
    if (agents.length > 0) cmd += ` -a ${agents.join(' ')}`;
  }
  if (yes) cmd += ' -y';
  return cmd;
}

/**
 * skills update [skills...]
 */
export function buildUpdateCommand(skillNames: string[], scope: SkillsScope, yes = false): string {
  let cmd = `npx skills update${scopeFlag(scope)}`;
  if (skillNames.length > 0) cmd += ` ${skillNames.join(' ')}`;
  if (yes) cmd += ' -y';
  return cmd;
}

/**
 * skills init [name]
 */
export function buildInitCommand(name = ''): string {
  const n = name.trim();
  return n ? `npx skills init ${n}` : 'npx skills init';
}

/**
 * skills experimental_install — restore from skills-lock.json
 */
export function buildInstallCommand(): string {
  return 'npx skills experimental_install';
}

/**
 * skills experimental_sync
 */
export function buildSyncCommand(agents: string[], yes = false): string {
  let cmd = 'npx skills experimental_sync';
  if (agents.length > 0) cmd += ` -a ${agents.join(' ')}`;
  if (yes) cmd += ' -y';
  return cmd;
}

// ── Service object ────────────────────────────────────────────────────────────

export const skillsService = {
  async list(scope: SkillsScope, agent = '', json = false): Promise<CommandResult> {
    return executeCommand(buildListCommand(scope, agent, json));
  },
  async find(query = ''): Promise<CommandResult> {
    return executeCommand(buildFindCommand(query));
  },
  async add(pkg: string, scope: SkillsScope, agents: string[], skills: string[], yes = false, copy = false, all = false): Promise<CommandResult> {
    return executeCommand(buildAddCommand(pkg, scope, agents, skills, yes, copy, all));
  },
  async remove(skillNames: string[], scope: SkillsScope, agents: string[], yes = false, all = false): Promise<CommandResult> {
    return executeCommand(buildRemoveCommand(skillNames, scope, agents, yes, all));
  },
  async update(skillNames: string[], scope: SkillsScope, yes = false): Promise<CommandResult> {
    return executeCommand(buildUpdateCommand(skillNames, scope, yes));
  },
  async init(name = ''): Promise<CommandResult> {
    return executeCommand(buildInitCommand(name));
  },
  async install(): Promise<CommandResult> {
    return executeCommand(buildInstallCommand());
  },
  async sync(agents: string[], yes = false): Promise<CommandResult> {
    return executeCommand(buildSyncCommand(agents, yes));
  },
};
