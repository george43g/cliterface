/**
 * SSH service module
 * Typed helpers for common ssh operations: connect, exec, port forwarding,
 * key management (ssh-keygen), and agent operations (ssh-add).
 */

export { type CommandResult, executeCommand } from '../utils/execute-command';
import { type CommandResult, executeCommand } from '../utils/execute-command';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SshConnectOptions {
  user?: string;
  host: string;
  port?: number;
  identityFile?: string;
  agentForwarding?: boolean;
  compression?: boolean;
  jumpHost?: string;
  verbose?: boolean;
  command?: string;
}

export interface SshLocalForwardOptions {
  localPort: number;
  remoteHost: string;
  remotePort: number;
  bindAddress?: string;
  user?: string;
  host: string;
  sshPort?: number;
  identityFile?: string;
  background?: boolean;
}

export interface SshRemoteForwardOptions {
  remotePort: number;
  localHost: string;
  localPort: number;
  bindAddress?: string;
  user?: string;
  host: string;
  sshPort?: number;
  identityFile?: string;
  background?: boolean;
}

export interface SshDynamicForwardOptions {
  localPort: number;
  bindAddress?: string;
  user?: string;
  host: string;
  sshPort?: number;
  identityFile?: string;
  background?: boolean;
}

export interface SshKeygenOptions {
  type: 'ed25519' | 'ecdsa' | 'rsa';
  bits?: number;
  comment?: string;
  outputFile?: string;
  rounds?: number;
}

export interface SshAddOptions {
  keyFile?: string;
  lifetime?: number;
  confirm?: boolean;
}

// ── Command builders ──────────────────────────────────────────────────────────

export function buildSshConnectCommand(opts: SshConnectOptions): string {
  const parts: string[] = ['ssh'];

  if (opts.verbose) parts.push('-v');
  if (opts.compression) parts.push('-C');
  if (opts.agentForwarding) parts.push('-A');
  if (opts.port && opts.port !== 22) parts.push('-p', String(opts.port));
  if (opts.identityFile) parts.push('-i', opts.identityFile);
  if (opts.jumpHost) parts.push('-J', opts.jumpHost);

  const destination = opts.user ? `${opts.user}@${opts.host}` : opts.host;
  parts.push(destination);

  if (opts.command) parts.push(opts.command);

  return parts.join(' ');
}

export function buildSshLocalForwardCommand(opts: SshLocalForwardOptions): string {
  const parts: string[] = ['ssh', '-N'];

  if (opts.sshPort && opts.sshPort !== 22) parts.push('-p', String(opts.sshPort));
  if (opts.identityFile) parts.push('-i', opts.identityFile);
  if (opts.background) parts.push('-f');

  const bind = opts.bindAddress ? `${opts.bindAddress}:` : '';
  parts.push('-L', `${bind}${opts.localPort}:${opts.remoteHost}:${opts.remotePort}`);

  const destination = opts.user ? `${opts.user}@${opts.host}` : opts.host;
  parts.push(destination);

  return parts.join(' ');
}

export function buildSshRemoteForwardCommand(opts: SshRemoteForwardOptions): string {
  const parts: string[] = ['ssh', '-N'];

  if (opts.sshPort && opts.sshPort !== 22) parts.push('-p', String(opts.sshPort));
  if (opts.identityFile) parts.push('-i', opts.identityFile);
  if (opts.background) parts.push('-f');

  const bind = opts.bindAddress ? `${opts.bindAddress}:` : '';
  parts.push('-R', `${bind}${opts.remotePort}:${opts.localHost}:${opts.localPort}`);

  const destination = opts.user ? `${opts.user}@${opts.host}` : opts.host;
  parts.push(destination);

  return parts.join(' ');
}

export function buildSshDynamicForwardCommand(opts: SshDynamicForwardOptions): string {
  const parts: string[] = ['ssh', '-N'];

  if (opts.sshPort && opts.sshPort !== 22) parts.push('-p', String(opts.sshPort));
  if (opts.identityFile) parts.push('-i', opts.identityFile);
  if (opts.background) parts.push('-f');

  const bind = opts.bindAddress ? `${opts.bindAddress}:` : '';
  parts.push('-D', `${bind}${opts.localPort}`);

  const destination = opts.user ? `${opts.user}@${opts.host}` : opts.host;
  parts.push(destination);

  return parts.join(' ');
}

export function buildSshKeygenCommand(opts: SshKeygenOptions): string {
  const parts: string[] = ['ssh-keygen', '-t', opts.type];

  if (opts.type === 'rsa' && opts.bits) parts.push('-b', String(opts.bits));
  if (opts.type === 'ecdsa' && opts.bits) parts.push('-b', String(opts.bits));
  if (opts.rounds) parts.push('-a', String(opts.rounds));
  if (opts.comment) parts.push('-C', `"${opts.comment}"`);
  if (opts.outputFile) parts.push('-f', opts.outputFile);

  return parts.join(' ');
}

export function buildSshAddCommand(opts: SshAddOptions): string {
  const parts: string[] = ['ssh-add'];

  if (opts.lifetime) parts.push('-t', String(opts.lifetime));
  if (opts.confirm) parts.push('-c');
  if (opts.keyFile) parts.push(opts.keyFile);

  return parts.join(' ');
}

// ── Service object ────────────────────────────────────────────────────────────

export const sshService = {
  /** Connect to a remote host (interactive login) */
  async connect(opts: SshConnectOptions): Promise<CommandResult> {
    return executeCommand(buildSshConnectCommand(opts));
  },

  /** Execute a command on a remote host */
  async exec(opts: SshConnectOptions & { command: string }): Promise<CommandResult> {
    return executeCommand(buildSshConnectCommand(opts));
  },

  /** Local port forward (-L) */
  async localForward(opts: SshLocalForwardOptions): Promise<CommandResult> {
    return executeCommand(buildSshLocalForwardCommand(opts));
  },

  /** Remote port forward (-R) */
  async remoteForward(opts: SshRemoteForwardOptions): Promise<CommandResult> {
    return executeCommand(buildSshRemoteForwardCommand(opts));
  },

  /** Dynamic SOCKS proxy (-D) */
  async dynamicForward(opts: SshDynamicForwardOptions): Promise<CommandResult> {
    return executeCommand(buildSshDynamicForwardCommand(opts));
  },

  /** Generate an SSH key pair */
  async generateKey(opts: SshKeygenOptions): Promise<CommandResult> {
    return executeCommand(buildSshKeygenCommand(opts));
  },

  /** List loaded keys in the agent */
  async listAgentKeys(): Promise<CommandResult> {
    return executeCommand('ssh-add -l');
  },

  /** Add a key to the agent */
  async addKey(opts: SshAddOptions): Promise<CommandResult> {
    return executeCommand(buildSshAddCommand(opts));
  },

  /** Remove a key from the agent */
  async removeKey(keyFile: string): Promise<CommandResult> {
    return executeCommand(`ssh-add -d ${keyFile}`);
  },

  /** Remove all keys from the agent */
  async removeAllKeys(): Promise<CommandResult> {
    return executeCommand('ssh-add -D');
  },

  /** Show fingerprint for a key file */
  async showFingerprint(keyFile: string): Promise<CommandResult> {
    return executeCommand(`ssh-keygen -l -f ${keyFile}`);
  },

  /** List keys in known_hosts for a given host */
  async findKnownHost(hostname: string): Promise<CommandResult> {
    return executeCommand(`ssh-keygen -F ${hostname}`);
  },

  /** Remove a host from known_hosts */
  async removeKnownHost(hostname: string): Promise<CommandResult> {
    return executeCommand(`ssh-keygen -R ${hostname}`);
  },

  /** Print effective ssh config for a destination */
  async printConfig(destination: string): Promise<CommandResult> {
    return executeCommand(`ssh -G ${destination}`);
  },

  /** Query ssh supported algorithms */
  async querySupportedAlgs(queryOption: 'cipher' | 'mac' | 'kex' | 'key' | 'sig'): Promise<CommandResult> {
    return executeCommand(`ssh -Q ${queryOption}`);
  },

  /** Get ssh version */
  async version(): Promise<CommandResult> {
    return executeCommand('ssh -V');
  },
};
