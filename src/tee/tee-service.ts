import { executeCommand as _executeCommand, type CommandResult } from '../utils/execute-command';

export type { CommandResult };

/**
 * tee execution service
 *
 * tee reads from stdin and writes to stdout AND one or more files simultaneously.
 * It's POSIX-standard and ubiquitous — the "T" in a pipe network.
 *
 * Integration point: replace executeCommand body with a native bridge
 * (Tauri invoke, Electron IPC, WKWebView postMessage, etc.)
 */

export function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB — swap for native bridge
  console.log('[tee-service] executeCommand:', cmd);
  return _executeCommand(cmd);
}

export interface TeeOptions {
  /** Output files to write to (in addition to stdout) */
  files: string[];
  /** -a: append to files instead of overwriting */
  append: boolean;
  /** -i: ignore SIGINT signal (useful in interactive pipelines) */
  ignoreInterrupt: boolean;
}

/**
 * Build a tee command string from structured options.
 * Does NOT shell-escape paths — the caller is responsible for safe inputs.
 */
export function buildTeeCommand(inputCmd: string, opts: TeeOptions): string {
  const teeParts: string[] = ['tee'];

  if (opts.append) teeParts.push('-a');
  if (opts.ignoreInterrupt) teeParts.push('-i');

  for (const f of opts.files) {
    const trimmed = f.trim();
    if (trimmed) {
      // Wrap in quotes if path contains spaces
      teeParts.push(trimmed.includes(' ') ? `"${trimmed}"` : trimmed);
    }
  }

  const teeCmd = teeParts.join(' ');

  if (inputCmd.trim()) {
    return `${inputCmd.trim()} | ${teeCmd}`;
  }
  return teeCmd;
}

export const teeService = {
  /**
   * Run a full tee pipeline: inputCmd | tee [opts] files...
   */
  async run(inputCmd: string, opts: TeeOptions): Promise<CommandResult> {
    const cmd = buildTeeCommand(inputCmd, opts);
    return executeCommand(cmd);
  },

  /**
   * The classic sudo-tee idiom for writing to privileged files.
   * echo "content" | sudo tee /path/to/privileged-file
   */
  async sudoTee(content: string, targetPath: string, append = false): Promise<CommandResult> {
    const escaped = content.replace(/'/g, "'\"'\"'");
    const flag = append ? '-a ' : '';
    const cmd = `echo '${escaped}' | sudo tee ${flag}${targetPath}`;
    return executeCommand(cmd);
  },

  /**
   * Log + console pattern: cmd | tee /var/log/app.log
   */
  async logAndPrint(inputCmd: string, logFile: string, append = true): Promise<CommandResult> {
    const flag = append ? '-a ' : '';
    const cmd = `${inputCmd} | tee ${flag}${logFile}`;
    return executeCommand(cmd);
  },
};
