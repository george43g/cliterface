/**
 * tsr (ts-remove-unused) service
 * TypeScript dead-code remover — https://github.com/line/ts-remove-unused
 *
 * This is a stub. Replace executeCommand() body with a native bridge call
 * (Tauri invoke, Electron IPC, WKWebView message handler, etc.) to connect
 * to a real runtime.
 */

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export async function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB — replace with actual native bridge
  console.log('[tsr:executeCommand]', cmd);
  return {
    stdout: `[mock] Running: ${cmd}\n\nNo output in stub mode.`,
    exitCode: 0,
  };
}

export interface TsrOptions {
  /** Path to tsconfig.json (defaults to project root tsconfig.json) */
  project?: string;
  /** Write changes to disk (destructive!) */
  write?: boolean;
  /** Run multiple passes until no unused code remains */
  recursive?: boolean;
  /** Also check .d.ts declaration files */
  includeDTs?: boolean;
}

/**
 * Build a tsr CLI command string.
 *
 * @param entryPoints - Regex patterns matching entry-point files to preserve
 * @param opts        - Optional flags
 */
export function buildTsrCommand(entryPoints: string[], opts: TsrOptions = {}): string {
  const parts: string[] = ['tsr'];

  if (opts.project) {
    parts.push('--project', opts.project);
  }
  if (opts.write) {
    parts.push('--write');
  }
  if (opts.recursive) {
    parts.push('--recursive');
  }
  if (opts.includeDTs) {
    parts.push('--include-d-ts');
  }

  for (const ep of entryPoints) {
    // Quote patterns that contain special characters
    parts.push(`'${ep}'`);
  }

  return parts.join(' ');
}

export const tsrService = {
  /**
   * Scan for unused code without making any changes (dry-run).
   */
  async scan(entryPoints: string[], opts: Omit<TsrOptions, 'write'> = {}): Promise<CommandResult> {
    const cmd = buildTsrCommand(entryPoints, { ...opts, write: false });
    return executeCommand(cmd);
  },

  /**
   * Remove unused code — DESTRUCTIVE: modifies files on disk.
   */
  async apply(entryPoints: string[], opts: TsrOptions = {}): Promise<CommandResult> {
    const cmd = buildTsrCommand(entryPoints, { ...opts, write: true });
    return executeCommand(cmd);
  },

  /**
   * Get tsr version.
   */
  async version(): Promise<string> {
    const result = await executeCommand('tsr --version');
    return result.stdout.trim() || 'tsr (version unknown)';
  },
};
