/**
 * Typed SSH command-string builders with Zod validation.
 * Each builder validates its inputs and returns a ready-to-execute command string.
 */
import { z } from 'zod';

// ── Validation schemas ─────────────────────────────────────────────────────────

export const HostSchema = z
  .string()
  .min(1, 'Host is required')
  .regex(/^[a-zA-Z0-9._\-[\]:]+$/, 'Invalid hostname — allowed: letters, digits, dots, hyphens, brackets (IPv6)');

export const PortSchema = z.number().int('Port must be an integer').min(1, 'Port must be at least 1').max(65535, 'Port must be at most 65535');

export const FilePathSchema = z
  .string()
  .min(1, 'File path is required')
  .regex(/^[^\0]+$/, 'File path must not contain null bytes');

export const UserSchema = z
  .string()
  .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid username — only letters, digits, dots, hyphens, underscores')
  .optional();

// ── Connect command builder ────────────────────────────────────────────────────

export const ConnectParamsSchema = z.object({
  host: HostSchema,
  user: UserSchema,
  port: PortSchema.optional(),
  identityFile: FilePathSchema.optional(),
  agentForwarding: z.boolean().optional(),
  compression: z.boolean().optional(),
  jumpHost: z.string().optional(),
  verbose: z.boolean().optional(),
  command: z.string().optional(),
});

export type ConnectParams = z.infer<typeof ConnectParamsSchema>;

export function buildConnectCommand(params: ConnectParams): string {
  const validated = ConnectParamsSchema.parse(params);
  const parts: string[] = ['ssh'];

  if (validated.verbose) parts.push('-v');
  if (validated.compression) parts.push('-C');
  if (validated.agentForwarding) parts.push('-A');
  if (validated.port && validated.port !== 22) parts.push('-p', String(validated.port));
  if (validated.identityFile) parts.push('-i', validated.identityFile);
  if (validated.jumpHost) parts.push('-J', validated.jumpHost);

  const dest = validated.user ? `${validated.user}@${validated.host}` : validated.host;
  parts.push(dest);

  if (validated.command) parts.push(validated.command);

  return parts.join(' ');
}

// ── Local port forward (-L) ───────────────────────────────────────────────────

export const LocalForwardSchema = z.object({
  host: HostSchema,
  user: UserSchema,
  sshPort: PortSchema.optional(),
  localPort: PortSchema,
  remoteHost: HostSchema,
  remotePort: PortSchema,
  bindAddress: z.string().optional(),
  identityFile: FilePathSchema.optional(),
  background: z.boolean().optional(),
});

export type LocalForwardParams = z.infer<typeof LocalForwardSchema>;

export function buildLocalForwardCommand(params: LocalForwardParams): string {
  const v = LocalForwardSchema.parse(params);
  const parts: string[] = ['ssh', '-N'];

  if (v.background) parts.push('-f');
  if (v.sshPort && v.sshPort !== 22) parts.push('-p', String(v.sshPort));
  if (v.identityFile) parts.push('-i', v.identityFile);

  const bind = v.bindAddress ? `${v.bindAddress}:` : '';
  parts.push('-L', `${bind}${v.localPort}:${v.remoteHost}:${v.remotePort}`);

  parts.push(v.user ? `${v.user}@${v.host}` : v.host);
  return parts.join(' ');
}

// ── Remote port forward (-R) ──────────────────────────────────────────────────

export const RemoteForwardSchema = z.object({
  host: HostSchema,
  user: UserSchema,
  sshPort: PortSchema.optional(),
  remotePort: PortSchema,
  localHost: HostSchema,
  localPort: PortSchema,
  bindAddress: z.string().optional(),
  identityFile: FilePathSchema.optional(),
  background: z.boolean().optional(),
});

export type RemoteForwardParams = z.infer<typeof RemoteForwardSchema>;

export function buildRemoteForwardCommand(params: RemoteForwardParams): string {
  const v = RemoteForwardSchema.parse(params);
  const parts: string[] = ['ssh', '-N'];

  if (v.background) parts.push('-f');
  if (v.sshPort && v.sshPort !== 22) parts.push('-p', String(v.sshPort));
  if (v.identityFile) parts.push('-i', v.identityFile);

  const bind = v.bindAddress ? `${v.bindAddress}:` : '';
  parts.push('-R', `${bind}${v.remotePort}:${v.localHost}:${v.localPort}`);

  parts.push(v.user ? `${v.user}@${v.host}` : v.host);
  return parts.join(' ');
}

// ── Dynamic SOCKS proxy (-D) ──────────────────────────────────────────────────

export const DynamicForwardSchema = z.object({
  host: HostSchema,
  user: UserSchema,
  sshPort: PortSchema.optional(),
  localPort: PortSchema,
  bindAddress: z.string().optional(),
  identityFile: FilePathSchema.optional(),
  background: z.boolean().optional(),
});

export type DynamicForwardParams = z.infer<typeof DynamicForwardSchema>;

export function buildDynamicForwardCommand(params: DynamicForwardParams): string {
  const v = DynamicForwardSchema.parse(params);
  const parts: string[] = ['ssh', '-N'];

  if (v.background) parts.push('-f');
  if (v.sshPort && v.sshPort !== 22) parts.push('-p', String(v.sshPort));
  if (v.identityFile) parts.push('-i', v.identityFile);

  const bind = v.bindAddress ? `${v.bindAddress}:` : '';
  parts.push('-D', `${bind}${v.localPort}`);

  parts.push(v.user ? `${v.user}@${v.host}` : v.host);
  return parts.join(' ');
}

// ── ssh-keygen ─────────────────────────────────────────────────────────────────

export const KeygenSchema = z.object({
  type: z.enum(['ed25519', 'ecdsa', 'rsa']),
  bits: z.number().int().optional(),
  comment: z.string().optional(),
  outputFile: z.string().optional(),
  rounds: z.number().int().min(1).max(256).optional(),
});

export type KeygenParams = z.infer<typeof KeygenSchema>;

export function buildKeygenCommand(params: KeygenParams): string {
  const v = KeygenSchema.parse(params);
  const parts: string[] = ['ssh-keygen', '-t', v.type];

  if (v.bits && (v.type === 'rsa' || v.type === 'ecdsa')) {
    parts.push('-b', String(v.bits));
  }
  if (v.rounds) parts.push('-a', String(v.rounds));
  if (v.comment) parts.push('-C', `"${v.comment}"`);
  if (v.outputFile) parts.push('-f', v.outputFile);

  return parts.join(' ');
}

// ── Validation helpers ─────────────────────────────────────────────────────────

export function validateHost(host: string): { valid: boolean; error?: string } {
  const result = HostSchema.safeParse(host);
  return result.success ? { valid: true } : { valid: false, error: result.error.errors[0]?.message };
}

export function validatePort(port: number): { valid: boolean; error?: string } {
  const result = PortSchema.safeParse(port);
  return result.success ? { valid: true } : { valid: false, error: result.error.errors[0]?.message };
}
