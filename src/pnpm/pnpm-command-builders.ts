/**
 * pnpm command builders
 * Constructs pnpm CLI command strings for display in the command preview.
 */

export interface PnpmInstallOptions {
  frozenLockfile: boolean;
  ignoreScripts: boolean;
  filter: string;
}

export interface PnpmAddOptions {
  packages: string;
  dev: boolean;
  optional: boolean;
  peer: boolean;
  exact: boolean;
  global: boolean;
  filter: string;
}

export interface PnpmUpdateOptions {
  packages: string;
  recursive: boolean;
  latest: boolean;
  dev: boolean;
  prod: boolean;
  filter: string;
}

export interface PnpmRunOptions {
  script: string;
  filter: string;
  recursive: boolean;
  parallel: boolean;
}

export interface PnpmAuditOptions {
  dev: boolean;
  prod: boolean;
  json: boolean;
  level: '' | 'low' | 'moderate' | 'high' | 'critical';
  fix: boolean;
}

export interface PnpmPublishOptions {
  dryRun: boolean;
  tag: string;
  access: '' | 'public' | 'restricted';
  recursive: boolean;
  noGitChecks: boolean;
}

export interface PnpmConfigOptions {
  action: 'list' | 'get' | 'set' | 'delete';
  key: string;
  value: string;
  global: boolean;
  json: boolean;
}

export interface PnpmPatchOptions {
  action: 'patch' | 'patch-commit' | 'patch-remove';
  pkgOrDir: string;
}

export function buildInstallCommand(opts: PnpmInstallOptions): string {
  const parts = ['install'];
  if (opts.frozenLockfile) parts.push('--frozen-lockfile');
  if (opts.ignoreScripts) parts.push('--ignore-scripts');
  if (opts.filter) parts.push(`--filter "${opts.filter}"`);
  return `pnpm ${parts.join(' ')}`;
}

export function buildAddCommand(opts: PnpmAddOptions): string {
  const parts = ['add'];
  if (opts.dev) parts.push('-D');
  else if (opts.optional) parts.push('-O');
  else if (opts.peer) parts.push('--save-peer');
  if (opts.exact) parts.push('-E');
  if (opts.global) parts.push('-g');
  if (opts.filter) parts.push(`--filter "${opts.filter}"`);
  const pkgs = opts.packages.trim();
  if (pkgs) parts.push(pkgs);
  return `pnpm ${parts.join(' ')}`;
}

export function buildRemoveCommand(pkg: string, global_: boolean, filter: string): string {
  const parts = ['remove'];
  if (global_) parts.push('-g');
  if (filter) parts.push(`--filter "${filter}"`);
  if (pkg) parts.push(pkg);
  return `pnpm ${parts.join(' ')}`;
}

export function buildUpdateCommand(opts: PnpmUpdateOptions): string {
  const parts = ['update'];
  if (opts.recursive) parts.push('-r');
  if (opts.latest) parts.push('--latest');
  if (opts.dev) parts.push('-D');
  if (opts.prod) parts.push('-P');
  if (opts.filter) parts.push(`--filter "${opts.filter}"`);
  const pkgs = opts.packages.trim();
  if (pkgs) parts.push(pkgs);
  return `pnpm ${parts.join(' ')}`;
}

export function buildRunCommand(opts: PnpmRunOptions): string {
  const parts = ['run'];
  if (opts.recursive) parts.push('-r');
  if (opts.parallel) parts.push('--parallel');
  if (opts.filter) parts.push(`--filter "${opts.filter}"`);
  if (opts.script) parts.push(opts.script);
  return `pnpm ${parts.join(' ')}`;
}

export function buildAuditCommand(opts: PnpmAuditOptions): string {
  const parts = ['audit'];
  if (opts.dev) parts.push('-D');
  else if (opts.prod) parts.push('-P');
  if (opts.json) parts.push('--json');
  if (opts.level) parts.push(`--audit-level ${opts.level}`);
  if (opts.fix) parts.push('--fix');
  return `pnpm ${parts.join(' ')}`;
}

export function buildPublishCommand(opts: PnpmPublishOptions): string {
  const parts = ['publish'];
  if (opts.recursive) parts.push('-r');
  if (opts.dryRun) parts.push('--dry-run');
  if (opts.tag) parts.push(`--tag ${opts.tag}`);
  if (opts.access) parts.push(`--access ${opts.access}`);
  if (opts.noGitChecks) parts.push('--no-git-checks');
  return `pnpm ${parts.join(' ')}`;
}

export function buildConfigCommand(opts: PnpmConfigOptions): string {
  const parts = ['config', opts.action];
  if (opts.action === 'list') {
    if (opts.json) parts.push('--json');
  } else if (opts.action === 'get') {
    if (opts.key) parts.push(opts.key);
  } else if (opts.action === 'set') {
    if (opts.key) parts.push(opts.key);
    if (opts.value) parts.push(opts.value);
  } else if (opts.action === 'delete') {
    if (opts.key) parts.push(opts.key);
  }
  if (opts.global) parts.push('-g');
  return `pnpm ${parts.join(' ')}`;
}

export function buildPatchCommand(opts: PnpmPatchOptions): string {
  return `pnpm ${opts.action}${opts.pkgOrDir ? ` ${opts.pkgOrDir}` : ''}`;
}
