import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

export const pnpmService = {
  /** Install all dependencies */
  async install(options: { frozenLockfile?: boolean; ignoreScrips?: boolean } = {}): Promise<CommandResult> {
    const parts = ['pnpm install'];
    if (options.frozenLockfile) parts.push('--frozen-lockfile');
    if (options.ignoreScrips) parts.push('--ignore-scripts');
    return executeCommand(parts.join(' '));
  },

  /** Add a package */
  async add(pkg: string, options: { dev?: boolean; optional?: boolean; peer?: boolean; exact?: boolean; global?: boolean; filter?: string } = {}): Promise<CommandResult> {
    const parts = ['pnpm add'];
    if (options.dev) parts.push('-D');
    else if (options.optional) parts.push('-O');
    else if (options.peer) parts.push('--save-peer');
    if (options.exact) parts.push('-E');
    if (options.global) parts.push('-g');
    if (options.filter) parts.push(`--filter "${options.filter}"`);
    parts.push(pkg);
    return executeCommand(parts.join(' '));
  },

  /** Remove a package */
  async remove(pkg: string, options: { global?: boolean; filter?: string } = {}): Promise<CommandResult> {
    const parts = ['pnpm remove'];
    if (options.global) parts.push('-g');
    if (options.filter) parts.push(`--filter "${options.filter}"`);
    parts.push(pkg);
    return executeCommand(parts.join(' '));
  },

  /** Update packages */
  async update(pkg = '', options: { recursive?: boolean; latest?: boolean; dev?: boolean; prod?: boolean } = {}): Promise<CommandResult> {
    const parts = ['pnpm update'];
    if (options.recursive) parts.push('-r');
    if (options.latest) parts.push('--latest');
    if (options.dev) parts.push('-D');
    if (options.prod) parts.push('-P');
    if (pkg) parts.push(pkg);
    return executeCommand(parts.join(' '));
  },

  /** Check outdated packages */
  async outdated(options: { recursive?: boolean } = {}): Promise<CommandResult> {
    const parts = ['pnpm outdated'];
    if (options.recursive) parts.push('-r');
    return executeCommand(parts.join(' '));
  },

  /** Run a script */
  async run(script: string, filter?: string): Promise<CommandResult> {
    const parts = ['pnpm run'];
    if (filter) parts.push(`--filter "${filter}"`);
    parts.push(script);
    return executeCommand(parts.join(' '));
  },

  /** Execute a shell command in scope */
  async exec(cmd: string, filter?: string): Promise<CommandResult> {
    const parts = ['pnpm exec'];
    if (filter) parts.push(`--filter "${filter}"`);
    parts.push(cmd);
    return executeCommand(parts.join(' '));
  },

  /** Fetch and run a package via dlx */
  async dlx(pkg: string): Promise<CommandResult> {
    return executeCommand(`pnpm dlx ${pkg}`);
  },

  /** List installed packages */
  async list(options: { recursive?: boolean; depth?: number; filter?: string } = {}): Promise<CommandResult> {
    const parts = ['pnpm list'];
    if (options.recursive) parts.push('-r');
    if (options.depth !== undefined) parts.push(`--depth ${options.depth}`);
    if (options.filter) parts.push(`--filter "${options.filter}"`);
    return executeCommand(parts.join(' '));
  },

  /** Show why a package is installed */
  async why(pkg: string, options: { recursive?: boolean } = {}): Promise<CommandResult> {
    const parts = ['pnpm why'];
    if (options.recursive) parts.push('-r');
    parts.push(pkg);
    return executeCommand(parts.join(' '));
  },

  /** Security audit */
  async audit(options: { dev?: boolean; prod?: boolean; json?: boolean; level?: string; fix?: boolean } = {}): Promise<CommandResult> {
    const parts = ['pnpm audit'];
    if (options.dev) parts.push('-D');
    if (options.prod) parts.push('-P');
    if (options.json) parts.push('--json');
    if (options.level) parts.push(`--audit-level ${options.level}`);
    if (options.fix) parts.push('--fix');
    return executeCommand(parts.join(' '));
  },

  /** Store subcommands */
  async storeStatus(): Promise<CommandResult> {
    return executeCommand('pnpm store status');
  },
  async storePath(): Promise<CommandResult> {
    return executeCommand('pnpm store path');
  },
  async storePrune(force = false): Promise<CommandResult> {
    return executeCommand(force ? 'pnpm store prune --force' : 'pnpm store prune');
  },

  /** Config management */
  async configList(json = false): Promise<CommandResult> {
    return executeCommand(json ? 'pnpm config list --json' : 'pnpm config list');
  },
  async configGet(key: string): Promise<CommandResult> {
    return executeCommand(`pnpm config get ${key}`);
  },
  async configSet(key: string, value: string, global_ = false): Promise<CommandResult> {
    return executeCommand(`pnpm config set ${key} ${value}${global_ ? ' -g' : ''}`);
  },
  async configDelete(key: string, global_ = false): Promise<CommandResult> {
    return executeCommand(`pnpm config delete ${key}${global_ ? ' -g' : ''}`);
  },

  /** Publish */
  async publish(options: { dryRun?: boolean; tag?: string; access?: string; recursive?: boolean; noGitChecks?: boolean } = {}): Promise<CommandResult> {
    const parts = ['pnpm publish'];
    if (options.recursive) parts.push('-r');
    if (options.dryRun) parts.push('--dry-run');
    if (options.tag) parts.push(`--tag ${options.tag}`);
    if (options.access) parts.push(`--access ${options.access}`);
    if (options.noGitChecks) parts.push('--no-git-checks');
    return executeCommand(parts.join(' '));
  },

  /** Patch */
  async patch(pkgSpec: string): Promise<CommandResult> {
    return executeCommand(`pnpm patch ${pkgSpec}`);
  },
  async patchCommit(dir: string): Promise<CommandResult> {
    return executeCommand(`pnpm patch-commit ${dir}`);
  },
  async patchRemove(pkgSpec: string): Promise<CommandResult> {
    return executeCommand(`pnpm patch-remove ${pkgSpec}`);
  },

  /** Dedupe */
  async dedupe(): Promise<CommandResult> {
    return executeCommand('pnpm dedupe');
  },

  /** Doctor */
  async doctor(): Promise<CommandResult> {
    return executeCommand('pnpm doctor');
  },

  /** Init */
  async init(): Promise<CommandResult> {
    return executeCommand('pnpm init');
  },

  /** Link */
  async link(dir?: string): Promise<CommandResult> {
    return executeCommand(dir ? `pnpm link ${dir}` : 'pnpm link');
  },
  async unlink(): Promise<CommandResult> {
    return executeCommand('pnpm unlink');
  },
};

/** Build a pnpm command string from parts (for preview) */
export function buildPnpmCommand(parts: string[]): string {
  return ['pnpm', ...parts.filter(Boolean)].join(' ');
}
