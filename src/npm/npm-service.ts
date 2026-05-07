import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

// ── Types ─────────────────────────────────────────────────────

export type NpmInstallFlags = {
  saveDev?: boolean;
  savePeer?: boolean;
  saveExact?: boolean;
  global?: boolean;
  legacyPeerDeps?: boolean;
};

export type NpmVersionBump = 'patch' | 'minor' | 'major' | 'prerelease' | 'prepatch' | 'preminor' | 'premajor';

export type NpmAuditFix = { fix: boolean; forceAuditFix?: boolean };

// ── Command builders ──────────────────────────────────────────

export function buildInstallCmd(packages: string, flags: NpmInstallFlags, workspace?: string): string {
  const parts: string[] = ['npm', 'install'];
  if (packages.trim()) parts.push(packages.trim());
  if (flags.saveDev) parts.push('--save-dev');
  if (flags.savePeer) parts.push('--save-peer');
  if (flags.saveExact) parts.push('--save-exact');
  if (flags.global) parts.push('--global');
  if (flags.legacyPeerDeps) parts.push('--legacy-peer-deps');
  if (workspace) parts.push(`-w ${workspace}`);
  return parts.join(' ');
}

export function buildUninstallCmd(packages: string, global = false, workspace?: string): string {
  const parts: string[] = ['npm', 'uninstall'];
  if (packages.trim()) parts.push(packages.trim());
  if (global) parts.push('--global');
  if (workspace) parts.push(`-w ${workspace}`);
  return parts.join(' ');
}

export function buildUpdateCmd(packages: string, global = false, workspace?: string): string {
  const parts: string[] = ['npm', 'update'];
  if (packages.trim()) parts.push(packages.trim());
  if (global) parts.push('--global');
  if (workspace) parts.push(`-w ${workspace}`);
  return parts.join(' ');
}

export function buildRunCmd(script: string, workspace?: string, allWorkspaces = false): string {
  const parts: string[] = ['npm', 'run', script];
  if (allWorkspaces) parts.push('--workspaces');
  else if (workspace) parts.push(`-w ${workspace}`);
  return parts.join(' ');
}

export function buildExecCmd(pkg: string, args: string): string {
  const parts: string[] = ['npm', 'exec', '--', pkg];
  if (args.trim()) parts.push(args.trim());
  return parts.join(' ');
}

export function buildVersionCmd(bump: NpmVersionBump, noGitTag = false, preid?: string): string {
  const parts: string[] = ['npm', 'version', bump];
  if (noGitTag) parts.push('--no-git-tag-version');
  if (preid && (bump === 'prerelease' || bump.startsWith('pre'))) parts.push(`--preid=${preid}`);
  return parts.join(' ');
}

export function buildPublishCmd(tag?: string, access?: 'public' | 'restricted', dryRun = false): string {
  const parts: string[] = ['npm', 'publish'];
  if (tag) parts.push(`--tag ${tag}`);
  if (access) parts.push(`--access ${access}`);
  if (dryRun) parts.push('--dry-run');
  return parts.join(' ');
}

export function buildConfigCmd(action: 'get' | 'set' | 'list', key?: string, value?: string): string {
  if (action === 'list') return 'npm config list';
  if (action === 'get' && key) return `npm config get ${key}`;
  if (action === 'set' && key && value !== undefined) return `npm config set ${key}=${value}`;
  return 'npm config list';
}

// ── Service ───────────────────────────────────────────────────

export const npmService = {
  // Install / Manage
  async install(packages: string, flags: NpmInstallFlags, workspace?: string): Promise<CommandResult> {
    return executeCommand(buildInstallCmd(packages, flags, workspace));
  },

  async installAll(): Promise<CommandResult> {
    return executeCommand('npm install');
  },

  async ci(): Promise<CommandResult> {
    return executeCommand('npm ci');
  },

  async uninstall(packages: string, global = false, workspace?: string): Promise<CommandResult> {
    return executeCommand(buildUninstallCmd(packages, global, workspace));
  },

  async update(packages: string, global = false, workspace?: string): Promise<CommandResult> {
    return executeCommand(buildUpdateCmd(packages, global, workspace));
  },

  async dedupe(): Promise<CommandResult> {
    return executeCommand('npm dedupe');
  },

  async link(pkg?: string): Promise<CommandResult> {
    return executeCommand(pkg ? `npm link ${pkg}` : 'npm link');
  },

  async unlink(pkg?: string): Promise<CommandResult> {
    return executeCommand(pkg ? `npm unlink ${pkg}` : 'npm unlink');
  },

  // Scripts
  async run(script: string, workspace?: string, allWorkspaces = false): Promise<CommandResult> {
    return executeCommand(buildRunCmd(script, workspace, allWorkspaces));
  },

  async exec(pkg: string, args: string): Promise<CommandResult> {
    return executeCommand(buildExecCmd(pkg, args));
  },

  // Query
  async ls(depth = 1, global = false): Promise<CommandResult> {
    const parts: string[] = ['npm', 'ls', `--depth=${depth}`];
    if (global) parts.push('--global');
    return executeCommand(parts.join(' '));
  },

  async outdated(global = false): Promise<CommandResult> {
    return executeCommand(`npm outdated${global ? ' --global' : ''}`);
  },

  async view(pkg: string, field?: string): Promise<CommandResult> {
    return executeCommand(`npm view ${pkg}${field ? ` ${field}` : ''}`);
  },

  async search(term: string): Promise<CommandResult> {
    return executeCommand(`npm search ${term}`);
  },

  // Audit
  async audit(fix = false, forceAuditFix = false): Promise<CommandResult> {
    if (fix && forceAuditFix) return executeCommand('npm audit fix --force');
    if (fix) return executeCommand('npm audit fix');
    return executeCommand('npm audit');
  },

  async fund(): Promise<CommandResult> {
    return executeCommand('npm fund');
  },

  async doctor(): Promise<CommandResult> {
    return executeCommand('npm doctor');
  },

  // Versioning
  async version(bump: NpmVersionBump, noGitTag = false, preid?: string): Promise<CommandResult> {
    return executeCommand(buildVersionCmd(bump, noGitTag, preid));
  },

  // Publish
  async pack(): Promise<CommandResult> {
    return executeCommand('npm pack');
  },

  async publish(tag?: string, access?: 'public' | 'restricted', dryRun = false): Promise<CommandResult> {
    return executeCommand(buildPublishCmd(tag, access, dryRun));
  },

  // Config
  async configGet(key: string): Promise<CommandResult> {
    return executeCommand(`npm config get ${key}`);
  },

  async configSet(key: string, value: string): Promise<CommandResult> {
    return executeCommand(`npm config set ${key}=${value}`);
  },

  async configList(): Promise<CommandResult> {
    return executeCommand('npm config list');
  },

  // Cache
  async cacheClean(): Promise<CommandResult> {
    return executeCommand('npm cache clean --force');
  },

  async cacheVerify(): Promise<CommandResult> {
    return executeCommand('npm cache verify');
  },

  // Auth
  async login(): Promise<CommandResult> {
    return executeCommand('npm login');
  },

  async logout(): Promise<CommandResult> {
    return executeCommand('npm logout');
  },

  async whoami(): Promise<CommandResult> {
    return executeCommand('npm whoami');
  },

  // Tokens
  async tokenList(): Promise<CommandResult> {
    return executeCommand('npm token list');
  },

  async tokenCreate(cidrWhitelist?: string): Promise<CommandResult> {
    const parts: string[] = ['npm', 'token', 'create'];
    if (cidrWhitelist) parts.push(`--cidr=${cidrWhitelist}`);
    return executeCommand(parts.join(' '));
  },

  async tokenRevoke(tokenId: string): Promise<CommandResult> {
    return executeCommand(`npm token revoke ${tokenId}`);
  },

  // Workspaces
  async workspacesList(): Promise<CommandResult> {
    return executeCommand('npm query .workspace');
  },

  // Pkg
  async pkgGet(key?: string): Promise<CommandResult> {
    return executeCommand(`npm pkg get${key ? ` ${key}` : ''}`);
  },

  async pkgSet(key: string, value: string): Promise<CommandResult> {
    return executeCommand(`npm pkg set ${key}="${value}"`);
  },

  // Misc
  async prefix(): Promise<CommandResult> {
    return executeCommand('npm prefix');
  },

  async init(yes = false, name?: string): Promise<CommandResult> {
    if (name) return executeCommand(`npm create ${name}`);
    return executeCommand(`npm init${yes ? ' -y' : ''}`);
  },
};
