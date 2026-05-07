/**
 * Docker Compose command builders
 * Pure functions that construct docker compose command strings from typed options.
 */

export function buildUpCommand(opts: {
  services?: string[];
  detach?: boolean;
  build?: boolean;
  forceRecreate?: boolean;
  noRecreate?: boolean;
  removeOrphans?: boolean;
  pull?: 'always' | 'missing' | 'never';
  scale?: string;
}): string {
  const parts = ['docker compose up'];
  if (opts.detach) parts.push('-d');
  if (opts.build) parts.push('--build');
  if (opts.forceRecreate) parts.push('--force-recreate');
  if (opts.noRecreate) parts.push('--no-recreate');
  if (opts.removeOrphans) parts.push('--remove-orphans');
  if (opts.pull && opts.pull !== 'missing') parts.push(`--pull ${opts.pull}`);
  if (opts.scale) parts.push(`--scale ${opts.scale}`);
  if (opts.services?.length) parts.push(opts.services.join(' '));
  return parts.join(' ');
}

export function buildDownCommand(opts: { services?: string[]; volumes?: boolean; removeOrphans?: boolean; rmi?: '' | 'all' | 'local'; timeout?: number }): string {
  const parts = ['docker compose down'];
  if (opts.volumes) parts.push('-v');
  if (opts.removeOrphans) parts.push('--remove-orphans');
  if (opts.rmi) parts.push(`--rmi ${opts.rmi}`);
  if (opts.timeout !== undefined && opts.timeout > 0) parts.push(`-t ${opts.timeout}`);
  if (opts.services?.length) parts.push(opts.services.join(' '));
  return parts.join(' ');
}

export function buildLogsCommand(opts: { services?: string[]; follow?: boolean; tail?: string; timestamps?: boolean }): string {
  const parts = ['docker compose logs'];
  if (opts.follow) parts.push('-f');
  if (opts.tail && opts.tail !== 'all') parts.push(`--tail=${opts.tail}`);
  if (opts.timestamps) parts.push('-t');
  if (opts.services?.length) parts.push(opts.services.join(' '));
  return parts.join(' ');
}

export function buildExecCommand(opts: { service: string; command: string; user?: string; workdir?: string; detach?: boolean }): string {
  const parts = ['docker compose exec'];
  if (opts.user) parts.push(`-u ${opts.user}`);
  if (opts.workdir) parts.push(`-w ${opts.workdir}`);
  if (opts.detach) parts.push('-d');
  if (opts.service) parts.push(opts.service);
  if (opts.command) parts.push(opts.command);
  return parts.join(' ');
}

export function buildRunCommand(opts: { service: string; command: string; rm?: boolean; detach?: boolean; user?: string; env?: string; noTty?: boolean }): string {
  const parts = ['docker compose run'];
  if (opts.rm) parts.push('--rm');
  if (opts.detach) parts.push('-d');
  if (opts.noTty) parts.push('-T');
  if (opts.user) parts.push(`-u ${opts.user}`);
  if (opts.env) parts.push(`-e ${opts.env}`);
  if (opts.service) parts.push(opts.service);
  if (opts.command) parts.push(opts.command);
  return parts.join(' ');
}

export function buildBuildCommand(opts: { services?: string[]; noCache?: boolean; pull?: boolean; quiet?: boolean }): string {
  const parts = ['docker compose build'];
  if (opts.noCache) parts.push('--no-cache');
  if (opts.pull) parts.push('--pull');
  if (opts.quiet) parts.push('--quiet');
  if (opts.services?.length) parts.push(opts.services.join(' '));
  return parts.join(' ');
}

export function buildPsCommand(opts: { services?: string[]; all?: boolean }): string {
  const parts = ['docker compose ps'];
  if (opts.all) parts.push('--all');
  if (opts.services?.length) parts.push(opts.services.join(' '));
  return parts.join(' ');
}

export function buildScaleCommand(serviceScales: Record<string, number>): string {
  const scaleParts = Object.entries(serviceScales).map(([s, n]) => `${s}=${n}`);
  return `docker compose scale ${scaleParts.join(' ')}`;
}
