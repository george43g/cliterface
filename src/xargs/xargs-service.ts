import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * xargs execution service
 * All execution is currently a stub — replace executeCommand body for real native bridge.
 */
export const xargsService = {
  /**
   * Execute a raw xargs command string
   */
  async execute(cmd: string): Promise<CommandResult> {
    return executeCommand(cmd);
  },

  /**
   * Get xargs version info
   */
  async version(): Promise<string> {
    const result = await executeCommand('xargs --version');
    return result.stdout.trim() || 'xargs (version unknown)';
  },
};

/**
 * Build an xargs command string from structured options.
 *
 * BSD xargs (macOS) differences from GNU:
 *  - No --no-run-if-empty effect (always skips empty — -r is a no-op)
 *  - No -d DELIM flag; use -0 for NUL-separated input instead
 *  - Supports -J replstr (positional replacement, BSD-only)
 *  - -P maxprocs for parallel execution
 */
export interface XargsOptions {
  /** Stdin source expression shown in the preview (e.g. "find . -name '*.ts' -print0") */
  stdinSource: string;
  /** Utility to run (default: echo) */
  utility: string;
  /** Extra args passed to utility before stdin args */
  utilityArgs: string;
  /** -0 / --null — NUL-delimited input */
  nullDelimited: boolean;
  /** -n N / --max-args — args per invocation */
  maxArgs: number | '';
  /** -I replstr — replace-string mode (one line per invocation, replaces replstr) */
  replaceStr: string;
  /** -P N / --max-procs — parallel invocations */
  parallel: number | '';
  /** -t / --verbose — trace each command to stderr */
  trace: boolean;
  /** -L N — lines per invocation */
  linesPerCmd: number | '';
  /** -r / --no-run-if-empty — GNU compat flag (no-op on BSD/macOS) */
  noRunIfEmpty: boolean;
  /** -s SIZE / --max-chars — max command-line byte length */
  maxChars: number | '';
  /** -x — exit if args exceed size */
  exitOnOverflow: boolean;
}

export function buildXargsCommand(opts: XargsOptions): string {
  const flags: string[] = [];

  if (opts.nullDelimited) flags.push('-0');
  if (opts.maxArgs !== '' && opts.maxArgs > 0) flags.push(`-n ${opts.maxArgs}`);
  if (opts.replaceStr.trim()) flags.push(`-I ${opts.replaceStr.trim()}`);
  if (opts.parallel !== '' && opts.parallel >= 0) flags.push(`-P ${opts.parallel}`);
  if (opts.trace) flags.push('-t');
  if (opts.linesPerCmd !== '' && opts.linesPerCmd > 0) flags.push(`-L ${opts.linesPerCmd}`);
  if (opts.noRunIfEmpty) flags.push('-r');
  if (opts.maxChars !== '' && opts.maxChars > 0) flags.push(`-s ${opts.maxChars}`);
  if (opts.exitOnOverflow) flags.push('-x');

  const xargsParts = ['xargs', ...flags];

  const utility = opts.utility.trim() || 'echo';
  xargsParts.push(utility);
  if (opts.utilityArgs.trim()) xargsParts.push(opts.utilityArgs.trim());

  const xargsCmd = xargsParts.join(' ');

  if (opts.stdinSource.trim()) {
    return `${opts.stdinSource.trim()} | ${xargsCmd}`;
  }
  return xargsCmd;
}

export const DEFAULT_XARGS_OPTIONS: XargsOptions = {
  stdinSource: "find . -name '*.ts' -print0",
  utility: 'echo',
  utilityArgs: '',
  nullDelimited: true,
  maxArgs: '',
  replaceStr: '',
  parallel: '',
  trace: false,
  linesPerCmd: '',
  noRunIfEmpty: false,
  maxChars: '',
  exitOnOverflow: false,
};
