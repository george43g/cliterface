import { type CommandResult, executeCommand } from '../utils/execute-command';

export type { CommandResult };

// ─── Validation helpers (Zod-free, lightweight) ──────────────────────────────

/** Validates a Vercel project name / slug */
export function isValidProjectName(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,99}$/.test(name);
}

/** Validates a domain name */
export function isValidDomain(domain: string): boolean {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain);
}

/** Validates a deployment URL or ID */
export function isValidDeploymentRef(ref: string): boolean {
  return ref.trim().length > 0;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const vercelAuth = {
  async whoami(): Promise<CommandResult> {
    return executeCommand('vercel whoami');
  },
  async login(email: string): Promise<CommandResult> {
    return executeCommand(`vercel login ${email} --non-interactive`);
  },
  async logout(): Promise<CommandResult> {
    return executeCommand('vercel logout');
  },
};

// ─── Link ─────────────────────────────────────────────────────────────────────

export const vercelLink = {
  async link(cwd: string): Promise<CommandResult> {
    return executeCommand(`vercel link --yes${cwd ? ` --cwd ${cwd}` : ''}`);
  },
  async unlink(cwd: string): Promise<CommandResult> {
    return executeCommand(`vercel unlink${cwd ? ` --cwd ${cwd}` : ''}`);
  },
  async pull(cwd: string, env: string): Promise<CommandResult> {
    return executeCommand(`vercel pull${env ? ` --environment ${env}` : ''}${cwd ? ` --cwd ${cwd}` : ''} --yes`);
  },
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const vercelProjects = {
  async list(): Promise<CommandResult> {
    return executeCommand('vercel project list');
  },
  async inspect(name: string): Promise<CommandResult> {
    return executeCommand(`vercel project inspect ${name}`);
  },
  async add(name: string): Promise<CommandResult> {
    return executeCommand(`vercel project add ${name}`);
  },
  async remove(name: string): Promise<CommandResult> {
    return executeCommand(`vercel project remove ${name} --yes`);
  },
};

// ─── Deployments ─────────────────────────────────────────────────────────────

export const vercelDeploy = {
  async deployPreview(cwd: string, flags: string): Promise<CommandResult> {
    return executeCommand(`vercel deploy${cwd ? ` --cwd ${cwd}` : ''}${flags ? ` ${flags}` : ''}`);
  },
  async deployProd(cwd: string, flags: string): Promise<CommandResult> {
    return executeCommand(`vercel deploy --prod${cwd ? ` --cwd ${cwd}` : ''}${flags ? ` ${flags}` : ''}`);
  },
  async deployPrebuilt(cwd: string): Promise<CommandResult> {
    return executeCommand(`vercel deploy --prebuilt${cwd ? ` --cwd ${cwd}` : ''}`);
  },
  async build(cwd: string): Promise<CommandResult> {
    return executeCommand(`vercel build${cwd ? ` --cwd ${cwd}` : ''}`);
  },
  async list(project: string): Promise<CommandResult> {
    return executeCommand(`vercel ls${project ? ` ${project}` : ''}`);
  },
  async inspect(idOrUrl: string): Promise<CommandResult> {
    return executeCommand(`vercel inspect ${idOrUrl}`);
  },
  async remove(idOrUrl: string): Promise<CommandResult> {
    return executeCommand(`vercel rm ${idOrUrl} --yes`);
  },
  async redeploy(idOrUrl: string): Promise<CommandResult> {
    return executeCommand(`vercel redeploy ${idOrUrl}`);
  },
  async promote(idOrUrl: string): Promise<CommandResult> {
    return executeCommand(`vercel promote ${idOrUrl}`);
  },
  async rollback(idOrUrl: string): Promise<CommandResult> {
    return executeCommand(`vercel rollback ${idOrUrl}`);
  },
};

// ─── Environment Variables ────────────────────────────────────────────────────

export const vercelEnv = {
  async list(env: string): Promise<CommandResult> {
    return executeCommand(`vercel env list${env ? ` ${env}` : ''}`);
  },
  async add(name: string, environment: string): Promise<CommandResult> {
    // Note: in real use, value would be piped via stdin. Stub shows intent.
    return executeCommand(`vercel env add ${name} ${environment}`);
  },
  async pull(filename: string): Promise<CommandResult> {
    return executeCommand(`vercel env pull${filename ? ` ${filename}` : ''}`);
  },
  async remove(name: string, environment: string): Promise<CommandResult> {
    return executeCommand(`vercel env remove ${name}${environment ? ` ${environment}` : ''} --yes`);
  },
};

// ─── Domains ─────────────────────────────────────────────────────────────────

export const vercelDomains = {
  async list(): Promise<CommandResult> {
    return executeCommand('vercel domains list');
  },
  async inspect(domain: string): Promise<CommandResult> {
    return executeCommand(`vercel domains inspect ${domain}`);
  },
  async add(domain: string, project: string): Promise<CommandResult> {
    return executeCommand(`vercel domains add ${domain}${project ? ` ${project}` : ''}`);
  },
  async remove(domain: string): Promise<CommandResult> {
    return executeCommand(`vercel domains remove ${domain} --yes`);
  },
  async buy(domain: string): Promise<CommandResult> {
    return executeCommand(`vercel domains buy ${domain}`);
  },
};

// ─── Logs ────────────────────────────────────────────────────────────────────

export interface LogOpts {
  follow?: boolean;
  level?: string;
  limit?: number;
  query?: string;
  environment?: string;
  source?: string;
  statusCode?: string;
  since?: string;
  until?: string;
}

export const vercelLogs = {
  async get(idOrUrl: string, opts: LogOpts): Promise<CommandResult> {
    const parts = ['vercel logs', idOrUrl];
    if (opts.follow) parts.push('--follow');
    if (opts.level) parts.push(`--level ${opts.level}`);
    if (opts.limit) parts.push(`--limit ${opts.limit}`);
    if (opts.environment) parts.push(`--environment ${opts.environment}`);
    if (opts.source) parts.push(`--source ${opts.source}`);
    if (opts.statusCode) parts.push(`--status-code ${opts.statusCode}`);
    if (opts.since) parts.push(`--since ${opts.since}`);
    if (opts.until) parts.push(`--until ${opts.until}`);
    if (opts.query) parts.push(`--query "${opts.query}"`);
    return executeCommand(parts.join(' '));
  },
};

// ─── Teams ────────────────────────────────────────────────────────────────────

export const vercelTeams = {
  async list(): Promise<CommandResult> {
    return executeCommand('vercel teams list');
  },
  async add(name: string): Promise<CommandResult> {
    return executeCommand(`vercel teams add${name ? ` ${name}` : ''}`);
  },
  async invite(email: string): Promise<CommandResult> {
    return executeCommand(`vercel teams invite ${email}`);
  },
  async switchTeam(slug: string): Promise<CommandResult> {
    return executeCommand(`vercel teams switch ${slug}`);
  },
  async members(): Promise<CommandResult> {
    return executeCommand('vercel teams members');
  },
};

// ─── Generic executor ────────────────────────────────────────────────────────

export const vercelService = {
  async execute(cmd: string): Promise<CommandResult> {
    const full = cmd.startsWith('vercel') ? cmd : `vercel ${cmd}`;
    return executeCommand(full);
  },
  async version(): Promise<string> {
    const result = await executeCommand('vercel --version');
    return result.stdout.trim() || 'vercel (version unknown)';
  },
};
