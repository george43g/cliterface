/**
 * Vercel CLI command builders
 * Construct vercel CLI command strings from GUI state
 */

// ─── Deploy ──────────────────────────────────────────────────────────────────

export interface DeployOptions {
  cwd?: string;
  prod?: boolean;
  prebuilt?: boolean;
  force?: boolean;
  skipDomain?: boolean;
  target?: string;
  regions?: string;
  buildEnv?: string; // "KEY=value KEY2=value2"
  meta?: string; // "KEY=value"
  noWait?: boolean;
  withCache?: boolean;
}

export function buildDeployCommand(opts: DeployOptions): string {
  const parts: string[] = ['vercel deploy'];

  if (opts.cwd) parts.push(`--cwd ${opts.cwd}`);
  if (opts.prod) parts.push('--prod');
  if (opts.prebuilt) parts.push('--prebuilt');
  if (opts.force) parts.push('--force');
  if (opts.withCache) parts.push('--with-cache');
  if (opts.skipDomain) parts.push('--skip-domain');
  if (opts.target) parts.push(`--target ${opts.target}`);
  if (opts.regions) parts.push(`--regions ${opts.regions}`);
  if (opts.noWait) parts.push('--no-wait');

  if (opts.buildEnv) {
    for (const pair of opts.buildEnv.split(/\s+/)) {
      if (pair) parts.push(`-b ${pair}`);
    }
  }
  if (opts.meta) {
    for (const pair of opts.meta.split(/\s+/)) {
      if (pair) parts.push(`-m ${pair}`);
    }
  }

  return parts.join(' ');
}

// ─── Env ─────────────────────────────────────────────────────────────────────

export type EnvEnvironment = 'production' | 'preview' | 'development' | '';

export function buildEnvListCommand(env: EnvEnvironment, gitBranch?: string): string {
  const parts = ['vercel env list'];
  if (env) parts.push(env);
  if (gitBranch) parts.push(gitBranch);
  return parts.join(' ');
}

export function buildEnvAddCommand(name: string, env: EnvEnvironment): string {
  return `vercel env add ${name}${env ? ` ${env}` : ''}`;
}

export function buildEnvRemoveCommand(name: string, env: EnvEnvironment): string {
  return `vercel env remove ${name}${env ? ` ${env}` : ''} --yes`;
}

export function buildEnvPullCommand(filename: string): string {
  return `vercel env pull${filename ? ` ${filename}` : ' .env.local'}`;
}

// ─── Domains ─────────────────────────────────────────────────────────────────

export function buildDomainAddCommand(domain: string, project: string): string {
  return `vercel domains add ${domain}${project ? ` ${project}` : ''}`;
}

export function buildDomainRemoveCommand(domain: string): string {
  return `vercel domains remove ${domain} --yes`;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export interface LogOptions {
  follow?: boolean;
  level?: string;
  limit?: number;
  query?: string;
  environment?: 'production' | 'preview' | '';
  source?: string;
  statusCode?: string;
  since?: string;
  until?: string;
}

export function buildLogsCommand(ref: string, opts: LogOptions): string {
  const parts = ['vercel logs'];
  if (ref) parts.push(ref);
  if (opts.follow) parts.push('--follow');
  if (opts.level) parts.push(`--level ${opts.level}`);
  if (opts.limit) parts.push(`--limit ${opts.limit}`);
  if (opts.environment) parts.push(`--environment ${opts.environment}`);
  if (opts.source) parts.push(`--source ${opts.source}`);
  if (opts.statusCode) parts.push(`--status-code ${opts.statusCode}`);
  if (opts.since) parts.push(`--since ${opts.since}`);
  if (opts.until) parts.push(`--until ${opts.until}`);
  if (opts.query) parts.push(`--query "${opts.query}"`);
  return parts.join(' ');
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export function buildTeamsInviteCommand(email: string): string {
  return `vercel teams invite ${email}`;
}

export function buildTeamsSwitchCommand(slug: string): string {
  return `vercel teams switch ${slug}`;
}
