import { executeCommand } from '../yabai/yabai-service';

export type { CommandResult } from '../yabai/yabai-service';

/**
 * scp execution service (stub — replace executeCommand body for native bridge)
 */

export type ScpDirection = 'upload' | 'download' | 'remote-to-remote';

export interface ScpOptions {
  /** -r: Recursively copy entire directories */
  recursive?: boolean;
  /** -P PORT: Port to connect on the remote host (capital P) */
  port?: number;
  /** -i KEY: Identity (private key) file for authentication */
  identityFile?: string;
  /** -p: Preserve modification times, access times, and mode bits */
  preserve?: boolean;
  /** -q: Quiet mode — disables progress meter and diagnostics */
  quiet?: boolean;
  /** -v: Verbose mode — print debugging messages */
  verbose?: boolean;
  /** -l KBITS: Bandwidth limit in Kbit/s */
  bandwidthLimit?: number;
  /** -3: Route remote-to-remote through the local host */
  threeParty?: boolean;
  /** -O: Force legacy SCP protocol instead of SFTP (useful for OpenSSH >= 9.0 or older servers) */
  legacyScp?: boolean;
  /** -J JUMPHOST: Connect via a jump host (ProxyJump) */
  jumpHost?: string;
  /** -F CONFIG: Alternative per-user ssh_config file */
  sshConfig?: string;
  /** -C: Enable compression */
  compress?: boolean;
  /** -B: Batch mode (no password prompts) */
  batch?: boolean;
}

export interface ScpEndpoint {
  /** Local path or remote path like user@host:path */
  path: string;
  /** Convenience: resolved host portion (e.g. "user@host") */
  host?: string;
  /** Convenience: remote path portion after the colon */
  remotePath?: string;
}

/**
 * Build an scp command string from parts.
 * Does NOT shell-quote paths — callers control quoting for preview clarity.
 */
export function buildScpCommand(source: string, destination: string, options: ScpOptions = {}): string {
  const parts: string[] = ['scp'];

  if (options.recursive) parts.push('-r');
  if (options.compress) parts.push('-C');
  if (options.batch) parts.push('-B');
  if (options.preserve) parts.push('-p');
  if (options.quiet) parts.push('-q');
  if (options.verbose) parts.push('-v');
  if (options.legacyScp) parts.push('-O');
  if (options.threeParty) parts.push('-3');
  if (options.port !== undefined && options.port > 0) parts.push(`-P ${options.port}`);
  if (options.identityFile) parts.push(`-i ${options.identityFile}`);
  if (options.bandwidthLimit !== undefined && options.bandwidthLimit > 0) {
    parts.push(`-l ${options.bandwidthLimit}`);
  }
  if (options.jumpHost) parts.push(`-J ${options.jumpHost}`);
  if (options.sshConfig) parts.push(`-F ${options.sshConfig}`);

  parts.push(source);
  parts.push(destination);

  return parts.join(' ');
}

export const scpService = {
  /**
   * Execute an scp command verbatim.
   */
  async execute(cmd: string) {
    return executeCommand(cmd);
  },

  /**
   * Copy files using structured options.
   */
  async copy(source: string, destination: string, options: ScpOptions = {}) {
    const cmd = buildScpCommand(source, destination, options);
    return executeCommand(cmd);
  },

  /**
   * Get scp version/help output.
   */
  async version() {
    // scp prints to stderr on many systems; combine both
    const result = await executeCommand('scp 2>&1 || true');
    return result.stdout || result.stderr || '';
  },
};

/** Regex: user@host or bare hostname (IPv4/name) */
export const HOST_REGEX = /^([A-Za-z0-9_.%-]+@)?[A-Za-z0-9._%-]+$/;
/** Regex: remote path spec user@host:path or host:path */
export const REMOTE_PATH_REGEX = /^([A-Za-z0-9_.%-]+@)?[A-Za-z0-9._%-]+:.*/;

/** Zod-like port range validator (1–65535) */
export function validatePort(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: true };
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return { valid: false, message: 'Port must be an integer 1–65535' };
  }
  return { valid: true };
}

/** Validate a hostname/user@host string */
export function validateHost(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: true };
  if (!HOST_REGEX.test(value)) {
    return { valid: false, message: 'Use hostname or user@hostname format' };
  }
  return { valid: true };
}

/** Validate a bandwidth limit (positive integer Kbit/s) */
export function validateBandwidth(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: true };
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return { valid: false, message: 'Bandwidth must be a positive integer (Kbit/s)' };
  }
  return { valid: true };
}

/** Detect whether a path string looks like a remote spec (contains host:) */
export function isRemotePath(path: string): boolean {
  return REMOTE_PATH_REGEX.test(path);
}
