import { type CommandResult, executeCommand } from '../utils/execute-command';

export type { CommandResult };

// ── Zod-lite validation (no external dep) ──────────────────────────────────

export function isValidPid(value: string): boolean {
  const n = Number(value.trim());
  return Number.isInteger(n) && n > 0 && n <= 99999;
}

export function isValidPidList(value: string): boolean {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .every(isValidPid);
}

export const VALID_SORT_COLUMNS = ['%cpu', '%mem', 'pid', 'ppid', 'rss', 'vsz', 'time', 'user', 'comm'] as const;

export type SortColumn = (typeof VALID_SORT_COLUMNS)[number];

export function isValidSortColumn(value: string): value is SortColumn {
  return (VALID_SORT_COLUMNS as readonly string[]).includes(value);
}

// ── Output format presets ──────────────────────────────────────────────────

export interface FormatPreset {
  id: string;
  label: string;
  fields: string;
  description: string;
}

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: 'default',
    label: 'Default',
    fields: 'pid,tty,time,comm',
    description: 'Default ps output: pid, tty, time, command',
  },
  {
    id: 'cpu-mem',
    label: 'CPU & Memory',
    fields: 'pid,user,%cpu,%mem,rss,vsz,comm',
    description: 'Focus on CPU and memory usage',
  },
  {
    id: 'full',
    label: 'Full (like -f)',
    fields: 'user,pid,ppid,%cpu,start,tty,time,comm',
    description: 'Full format with parent PID and start time',
  },
  {
    id: 'verbose',
    label: 'Verbose (like -v)',
    fields: 'pid,state,time,vsz,rss,%cpu,%mem,comm',
    description: 'Verbose memory-focused format',
  },
  {
    id: 'security',
    label: 'Security',
    fields: 'pid,user,uid,gid,ppid,state,comm',
    description: 'User/group info for security review',
  },
];

// ── Command builders ───────────────────────────────────────────────────────

export interface PsListOptions {
  /** BSD: aux / GNU: -ef / POSIX: -A */
  mode: 'bsd-aux' | 'posix-ef' | 'posix-A' | 'own';
  user?: string;
  pids?: string;
  fields?: string;
  sortBy?: SortColumn;
  sortDesc?: boolean;
  threads?: boolean;
  wideOutput?: boolean;
}

export interface PsFilterOptions {
  user?: string;
  pids?: string;
  command?: string;
  state?: string;
  fields?: string;
  sortBy?: SortColumn;
  sortDesc?: boolean;
}

export interface PsSortFormatOptions {
  fields: string;
  sortBy: SortColumn;
  sortDesc: boolean;
  wideOutput: boolean;
}

/** Build a "list all" ps command. Returns the command string. */
export function buildPsListCommand(opts: PsListOptions): string {
  const parts: string[] = ['ps'];

  switch (opts.mode) {
    case 'bsd-aux':
      parts.push('aux');
      break;
    case 'posix-ef':
      parts.push('-ef');
      break;
    case 'posix-A':
      parts.push('-A');
      if (opts.fields) {
        parts.push(`-o ${opts.fields}`);
      }
      break;
    case 'own':
      // No extra flags — own processes only
      break;
  }

  if (opts.user) parts.push(`-u ${opts.user}`);
  if (opts.pids?.trim()) {
    const clean = opts.pids
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .join(',');
    parts.push(`-p ${clean}`);
  }

  if (opts.mode === 'bsd-aux' && opts.fields) {
    // Replace default fields with custom -o for BSD aux base
    parts.push(`-o ${opts.fields}`);
  }

  // BSD ps uses -r for CPU / -m for memory; -o with sort isn't always supported
  // We use a sort pipe (see buildPsSortCommand) when a non-native sort is wanted

  if (opts.threads) parts.push('-M');
  if (opts.wideOutput) parts.push('-w');

  // If a sort column is specified and it's not natively supported, pipe through sort
  if (opts.sortBy) {
    return `${parts.join(' ')} | (read -r header; echo "$header"; sort -k1 -n)`;
  }

  return parts.join(' ');
}

/** Build a filter command using grep/pgrep patterns. */
export function buildPsFilterCommand(opts: PsFilterOptions): string {
  const parts: string[] = ['ps'];

  // Always include all processes for filtering
  parts.push('aux');

  if (opts.fields) {
    parts.push(`-o ${opts.fields}`);
  }

  const pipes: string[] = [];

  if (opts.user) {
    pipes.push(`grep -i "^${opts.user}\\s"`);
  }

  if (opts.command) {
    pipes.push(`grep -i "${opts.command.replace(/"/g, '\\"')}"`);
    // Exclude the grep process itself
    pipes.push(`grep -v grep`);
  }

  if (opts.state) {
    pipes.push(`grep "${opts.state}"`);
  }

  const base = parts.join(' ');
  return pipes.length ? `${base} | ${pipes.join(' | ')}` : base;
}

/** Build a tree-like view command. BSD uses pstree if available, else -f. */
export function buildPsTreeCommand(): string {
  // pstree is most readable; fall back to ps -ef with sort
  return 'pstree || ps -ef';
}

/** Build a sort+format command. */
export function buildPsSortCommand(opts: PsSortFormatOptions): string {
  const parts: string[] = ['ps', 'aux'];

  if (opts.fields) {
    parts.push(`-o ${opts.fields}`);
  }

  if (opts.wideOutput) parts.push('-w');

  const base = parts.join(' ');

  if (opts.sortBy) {
    const direction = opts.sortDesc ? '-r' : '';
    // Pipe to sort; skip header line
    return `${base} | (read -r header; echo "$header"; sort ${direction} -k1)`;
  }

  return base;
}

// ── Service ────────────────────────────────────────────────────────────────

export const psService = {
  async listAll(mode: PsListOptions['mode'] = 'bsd-aux'): Promise<CommandResult> {
    return executeCommand(`ps ${mode === 'bsd-aux' ? 'aux' : mode === 'posix-ef' ? '-ef' : '-A'}`);
  },

  async listOwn(): Promise<CommandResult> {
    return executeCommand('ps');
  },

  async filterByUser(user: string): Promise<CommandResult> {
    return executeCommand(`ps aux | grep -i "^${user}" | grep -v grep`);
  },

  async filterByPid(pids: string): Promise<CommandResult> {
    const clean = pids
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .join(',');
    return executeCommand(`ps -p ${clean}`);
  },

  async filterByCommand(cmd: string): Promise<CommandResult> {
    return executeCommand(`ps aux | grep -i "${cmd.replace(/"/g, '\\"')}" | grep -v grep`);
  },

  async tree(): Promise<CommandResult> {
    return executeCommand('pstree || ps -ef');
  },

  async custom(cmd: string): Promise<CommandResult> {
    return executeCommand(cmd);
  },
};
