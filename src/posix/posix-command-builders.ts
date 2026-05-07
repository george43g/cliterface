/**
 * POSIX command builder helpers
 * Assemble shell command strings from GUI state without executing them.
 */

export interface LsOptions {
  path: string;
  longFormat: boolean;
  showHidden: boolean;
  humanReadable: boolean;
  sortByTime: boolean;
  sortBySize: boolean;
  onePerLine: boolean;
  typeIndicator: boolean;
  recursive: boolean;
  color: boolean;
}

export function buildLsCommand(opts: LsOptions): string {
  const flags: string[] = [];
  if (opts.longFormat) flags.push('l');
  if (opts.showHidden) flags.push('a');
  if (opts.humanReadable) flags.push('h');
  if (opts.sortByTime) flags.push('t');
  if (opts.sortBySize) flags.push('S');
  if (opts.onePerLine) flags.push('1');
  if (opts.typeIndicator) flags.push('F');
  if (opts.recursive) flags.push('R');
  const flagStr = flags.length ? ` -${flags.join('')}` : '';
  const colorStr = opts.color ? ' --color=auto' : '';
  return `ls${flagStr}${colorStr} ${opts.path || '.'}`;
}

export interface GrepOptions {
  pattern: string;
  path: string;
  extendedRegex: boolean;
  recursive: boolean;
  lineNumbers: boolean;
  ignoreCase: boolean;
  invertMatch: boolean;
  filesWithMatches: boolean;
  count: boolean;
  include: string;
}

export function buildGrepCommand(opts: GrepOptions): string {
  const flags: string[] = [];
  if (opts.extendedRegex) flags.push('-E');
  if (opts.recursive) flags.push('-r');
  if (opts.lineNumbers) flags.push('-n');
  if (opts.ignoreCase) flags.push('-i');
  if (opts.invertMatch) flags.push('-v');
  if (opts.filesWithMatches) flags.push('-l');
  if (opts.count) flags.push('-c');
  if (opts.include) flags.push(`--include="${opts.include}"`);
  const flagStr = flags.length ? ` ${flags.join(' ')}` : '';
  return `grep${flagStr} '${opts.pattern || 'PATTERN'}' ${opts.path || '.'}`;
}

export interface FindOptions {
  path: string;
  name: string;
  type: '' | 'f' | 'd' | 'l';
  mtime: string;
  size: string;
  exec: string;
  print0: boolean;
  maxdepth: string;
}

export function buildFindCommand(opts: FindOptions): string {
  const parts: string[] = ['find', opts.path || '.'];
  if (opts.maxdepth) parts.push(`-maxdepth ${opts.maxdepth}`);
  if (opts.type) parts.push(`-type ${opts.type}`);
  if (opts.name) parts.push(`-name '${opts.name}'`);
  if (opts.mtime) parts.push(`-mtime ${opts.mtime}`);
  if (opts.size) parts.push(`-size ${opts.size}`);
  if (opts.exec) parts.push(`-exec ${opts.exec} {} \\;`);
  if (opts.print0) parts.push('-print0');
  return parts.join(' ');
}

export interface TarOptions {
  operation: 'c' | 'x' | 't';
  verbose: boolean;
  compression: '' | 'z' | 'j' | 'J';
  file: string;
  directory: string;
  paths: string;
}

export function buildTarCommand(opts: TarOptions): string {
  const flags = [opts.operation, opts.verbose ? 'v' : '', opts.compression, 'f'].filter(Boolean).join('');
  const dirFlag = opts.directory ? ` -C ${opts.directory}` : '';
  const pathArgs = opts.operation === 'c' && opts.paths ? ` ${opts.paths}` : '';
  return `tar -${flags} ${opts.file || 'archive.tar.gz'}${dirFlag}${pathArgs}`;
}

export interface DateOptions {
  format: string;
  utc: boolean;
}

export function buildDateCommand(opts: DateOptions): string {
  const utc = opts.utc ? ' -u' : '';
  const fmt = opts.format ? ` '+${opts.format}'` : '';
  return `date${utc}${fmt}`;
}

export interface ChmodOptions {
  mode: string;
  path: string;
  recursive: boolean;
}

export function buildChmodCommand(opts: ChmodOptions): string {
  return `chmod${opts.recursive ? ' -R' : ''} ${opts.mode || '755'} ${opts.path || 'FILE'}`;
}

export interface KillOptions {
  signal: string;
  pid: string;
}

export function buildKillCommand(opts: KillOptions): string {
  return `kill -${opts.signal || '15'} ${opts.pid || 'PID'}`;
}

export const COMMON_DATE_FORMATS: { label: string; format: string }[] = [
  { label: 'ISO 8601 Date', format: '%Y-%m-%d' },
  { label: 'ISO 8601 DateTime', format: '%Y-%m-%dT%H:%M:%S' },
  { label: 'Unix epoch', format: '%s' },
  { label: 'Human readable', format: '%A, %B %-d %Y' },
  { label: 'Time only', format: '%H:%M:%S' },
  { label: 'Filename-safe', format: '%Y%m%d_%H%M%S' },
  { label: 'RFC 2822 (email)', format: '%a, %d %b %Y %H:%M:%S %z' },
];

export const CHMOD_PRESETS: { label: string; mode: string; desc: string }[] = [
  { label: '755', mode: '755', desc: 'rwxr-xr-x — executable/dir: owner can write, others can read+exec' },
  { label: '644', mode: '644', desc: 'rw-r--r-- — normal file: owner writes, others read only' },
  { label: '600', mode: '600', desc: 'rw------- — private file: owner read/write only' },
  { label: '700', mode: '700', desc: 'rwx------ — private executable: owner only' },
  { label: '777', mode: '777', desc: 'rwxrwxrwx — anyone can do anything (use with caution)' },
  { label: '+x', mode: '+x', desc: 'Add execute bit for all (make a script runnable)' },
  { label: 'a+r', mode: 'a+r', desc: 'Add read for all users' },
  { label: 'g-w', mode: 'g-w', desc: 'Remove group write permission' },
];

export const KILL_SIGNALS: { signal: string; name: string; desc: string }[] = [
  { signal: '1', name: 'SIGHUP', desc: 'Hangup — reload config for most daemons' },
  { signal: '2', name: 'SIGINT', desc: 'Interrupt — same as Ctrl+C' },
  { signal: '3', name: 'SIGQUIT', desc: 'Quit — like SIGINT but produces core dump' },
  { signal: '9', name: 'SIGKILL', desc: 'Force kill — cannot be caught or ignored' },
  { signal: '15', name: 'SIGTERM', desc: 'Graceful terminate — default signal (safe)' },
  { signal: '18', name: 'SIGCONT', desc: 'Continue a stopped process' },
  { signal: '19', name: 'SIGSTOP', desc: 'Stop process (like Ctrl+Z, cannot be caught)' },
  { signal: '20', name: 'SIGTSTP', desc: 'Terminal stop — same as Ctrl+Z (can be caught)' },
];
