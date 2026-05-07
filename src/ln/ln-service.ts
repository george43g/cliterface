import { type CommandResult, executeCommand } from '../utils/execute-command';

export type { CommandResult };

export type LinkType = 'symbolic' | 'hard';

export interface LnOptions {
  linkType: LinkType;
  force: boolean;
  interactive: boolean;
  noDeref: boolean;
  verbose: boolean;
  physical: boolean; // -P: hard link to symlink itself rather than its target
}

export interface LnCommandOptions {
  source: string;
  target: string;
  options: Partial<LnOptions>;
}

/**
 * ln execution service
 */
export const lnService = {
  /**
   * Create a symbolic or hard link
   */
  async createLink(opts: LnCommandOptions): Promise<CommandResult> {
    const cmd = buildLnCommand(opts);
    return executeCommand(cmd);
  },

  /**
   * Read the destination of a symlink
   */
  async readlink(path: string): Promise<CommandResult> {
    return executeCommand(`readlink ${shellQuote(path)}`);
  },

  /**
   * Resolve a path to its canonical absolute form
   */
  async realpath(path: string): Promise<CommandResult> {
    return executeCommand(`realpath ${shellQuote(path)}`);
  },

  /**
   * Remove a file or symlink (does NOT remove the target)
   */
  async unlink(path: string): Promise<CommandResult> {
    return executeCommand(`unlink ${shellQuote(path)}`);
  },

  /**
   * Execute a raw ln command string
   */
  async execute(rawCmd: string): Promise<CommandResult> {
    return executeCommand(rawCmd);
  },
};

/**
 * Build the ln command string from structured options
 */
export function buildLnCommand(opts: LnCommandOptions): string {
  const { source, target, options = {} } = opts;
  const flags: string[] = [];

  if (options.linkType === 'symbolic') flags.push('-s');
  if (options.force) flags.push('-f');
  if (options.interactive) flags.push('-i');
  if (options.noDeref) flags.push('-h');
  if (options.verbose) flags.push('-v');
  if (options.physical && options.linkType !== 'symbolic') flags.push('-P');

  const parts: string[] = ['ln'];
  if (flags.length > 0) parts.push(flags.join(''));
  parts.push(shellQuote(source));
  parts.push(shellQuote(target));

  return parts.join(' ');
}

/**
 * Minimal shell quoting — wrap in single quotes, escape interior single quotes
 */
function shellQuote(str: string): string {
  if (!str) return "''";
  if (/^[a-zA-Z0-9_./-]+$/.test(str)) return str;
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}
