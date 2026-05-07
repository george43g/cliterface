import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

// E.164 phone number validation (Zod-style inline validator)
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}

export function validateE164(phone: string): string | null {
  if (!phone.trim()) return 'Phone number is required';
  if (!isValidE164(phone)) return 'Must be E.164 format (e.g. +12125551234)';
  return null;
}

export interface SignalAccount {
  number: string;
  uuid?: string;
  device?: number;
}

export interface SignalDevice {
  id: number;
  name?: string;
  created?: number;
  lastSeen?: number;
}

export interface SignalContact {
  number: string;
  name?: string;
  profileName?: string;
  blocked?: boolean;
  messageExpirationTime?: number;
}

export interface SignalGroup {
  id: string;
  name?: string;
  members?: string[];
  blocked?: boolean;
  inviteLink?: string;
}

/**
 * Low-level command runner — all GUI methods go through here.
 * Swap the body for Tauri / Electron / WKWebView / HTTP.
 */
export async function runSignalCli(cmd: string): Promise<CommandResult> {
  console.log('[signal-cli]', cmd);
  return executeCommand(cmd);
}

// ---------------------------------------------------------------------------
// Command builders — return the shell string for preview + execution
// ---------------------------------------------------------------------------

export function buildRegisterCmd(phone: string, opts: { captcha?: string; voice?: boolean; reregister?: boolean } = {}): string {
  const parts: string[] = [`signal-cli --account ${phone} register`];
  if (opts.voice) parts.push('--voice');
  if (opts.captcha) parts.push(`--captcha "${opts.captcha}"`);
  if (opts.reregister) parts.push('--reregister');
  return parts.join(' ');
}

export function buildVerifyCmd(phone: string, code: string, pin?: string): string {
  const parts = [`signal-cli --account ${phone} verify ${code}`];
  if (pin) parts.push(`--pin ${pin}`);
  return parts.join(' ');
}

export function buildLinkCmd(deviceName: string): string {
  return `signal-cli link --name "${deviceName}"`;
}

export function buildListAccountsCmd(): string {
  return 'signal-cli listAccounts';
}

export function buildListDevicesCmd(account: string): string {
  return `signal-cli --account ${account} listDevices`;
}

export function buildRemoveDeviceCmd(account: string, deviceId: number): string {
  return `signal-cli --account ${account} removeDevice --device-id ${deviceId}`;
}

export function buildSendCmd(account: string, _message: string, recipients: string[], opts: { groupId?: string; attachments?: string[]; noteToSelf?: boolean } = {}): string {
  const parts = [`signal-cli --account ${account} send`];
  if (opts.noteToSelf) {
    parts.push('--note-to-self');
  } else if (opts.groupId) {
    parts.push(`--group-id ${opts.groupId}`);
  } else {
    for (const r of recipients) parts.push(r);
  }
  // Privacy: message body is passed but never logged to UI output — only shown in preview
  parts.push(`-m "[message]"`);
  return parts.join(' ') + (opts.attachments?.length ? ` --attachment ${opts.attachments.join(' ')}` : '');
}

export function buildReceiveCmd(account: string, opts: { timeout?: number; maxMessages?: number; ignoreAttachments?: boolean } = {}): string {
  const parts = [`signal-cli --account ${account} receive`];
  if (opts.timeout !== undefined) parts.push(`--timeout ${opts.timeout}`);
  if (opts.maxMessages !== undefined) parts.push(`--max-messages ${opts.maxMessages}`);
  if (opts.ignoreAttachments) parts.push('--ignore-attachments');
  return parts.join(' ');
}

export function buildListContactsCmd(account: string, opts: { all?: boolean; blocked?: boolean | null; name?: string } = {}): string {
  const parts = [`signal-cli --account ${account} --output json listContacts`];
  if (opts.all) parts.push('--all-recipients');
  if (opts.blocked === true) parts.push('--blocked true');
  if (opts.blocked === false) parts.push('--blocked false');
  if (opts.name) parts.push(`--name "${opts.name}"`);
  return parts.join(' ');
}

export function buildUpdateContactCmd(account: string, recipient: string, opts: { name?: string; expiration?: number; note?: string } = {}): string {
  const parts = [`signal-cli --account ${account} updateContact ${recipient}`];
  if (opts.name) parts.push(`--name "${opts.name}"`);
  if (opts.expiration !== undefined) parts.push(`--expiration ${opts.expiration}`);
  if (opts.note) parts.push(`--note "${opts.note}"`);
  return parts.join(' ');
}

export function buildBlockCmd(account: string, recipient: string, groupId?: string): string {
  if (groupId) return `signal-cli --account ${account} block --group-id ${groupId}`;
  return `signal-cli --account ${account} block ${recipient}`;
}

export function buildUnblockCmd(account: string, recipient: string, groupId?: string): string {
  if (groupId) return `signal-cli --account ${account} unblock --group-id ${groupId}`;
  return `signal-cli --account ${account} unblock ${recipient}`;
}

export function buildTrustCmd(account: string, recipient: string, opts: { trustAll?: boolean; safetyNumber?: string } = {}): string {
  const parts = [`signal-cli --account ${account} trust ${recipient}`];
  if (opts.trustAll) parts.push('--trust-all-known-keys');
  if (opts.safetyNumber) parts.push(`--verified-safety-number "${opts.safetyNumber}"`);
  return parts.join(' ');
}

export function buildListGroupsCmd(account: string, detailed = false): string {
  const parts = [`signal-cli --account ${account} --output json listGroups`];
  if (detailed) parts.push('--detailed');
  return parts.join(' ');
}

export function buildJoinGroupCmd(account: string, uri: string): string {
  return `signal-cli --account ${account} joinGroup --uri "${uri}"`;
}

export function buildQuitGroupCmd(account: string, groupId: string, opts: { delete?: boolean } = {}): string {
  const parts = [`signal-cli --account ${account} quitGroup --group-id ${groupId}`];
  if (opts.delete) parts.push('--delete');
  return parts.join(' ');
}

export function buildUpdateGroupCmd(
  account: string,
  groupId: string,
  opts: { name?: string; description?: string; addMembers?: string[]; removeMembers?: string[]; expiration?: number; link?: 'enabled' | 'enabled-with-approval' | 'disabled' } = {},
): string {
  const parts = [`signal-cli --account ${account} updateGroup --group-id ${groupId}`];
  if (opts.name) parts.push(`--name "${opts.name}"`);
  if (opts.description) parts.push(`--description "${opts.description}"`);
  if (opts.addMembers?.length) parts.push(`--member ${opts.addMembers.join(' ')}`);
  if (opts.removeMembers?.length) parts.push(`--remove-member ${opts.removeMembers.join(' ')}`);
  if (opts.expiration !== undefined) parts.push(`--expiration ${opts.expiration}`);
  if (opts.link) parts.push(`--link ${opts.link}`);
  return parts.join(' ');
}

export function buildUpdateProfileCmd(
  account: string,
  opts: { givenName?: string; familyName?: string; about?: string; aboutEmoji?: string; avatar?: string; removeAvatar?: boolean } = {},
): string {
  const parts = [`signal-cli --account ${account} updateProfile`];
  if (opts.givenName) parts.push(`--given-name "${opts.givenName}"`);
  if (opts.familyName) parts.push(`--family-name "${opts.familyName}"`);
  if (opts.about) parts.push(`--about "${opts.about}"`);
  if (opts.aboutEmoji) parts.push(`--about-emoji "${opts.aboutEmoji}"`);
  if (opts.avatar) parts.push(`--avatar "${opts.avatar}"`);
  if (opts.removeAvatar) parts.push('--remove-avatar');
  return parts.join(' ');
}

export function buildDaemonCmd(
  opts: {
    socket?: boolean;
    tcp?: boolean;
    http?: boolean;
    dbus?: boolean;
    dbusSystem?: boolean;
    receiveMode?: 'on-start' | 'on-connection' | 'manual';
    noReceiveStdout?: boolean;
  } = {},
): string {
  const parts = ['signal-cli daemon'];
  if (opts.dbus) parts.push('--dbus');
  if (opts.dbusSystem) parts.push('--dbus-system');
  if (opts.socket) parts.push('--socket');
  if (opts.tcp) parts.push('--tcp');
  if (opts.http) parts.push('--http');
  if (opts.receiveMode) parts.push(`--receive-mode ${opts.receiveMode}`);
  if (opts.noReceiveStdout) parts.push('--no-receive-stdout');
  return parts.join(' ');
}

export function buildSendReactionCmd(account: string, recipient: string, emoji: string, targetAuthor: string, targetTimestamp: string, remove = false): string {
  const parts = [`signal-cli --account ${account} sendReaction`, `--emoji "${emoji}"`, `--target-author ${targetAuthor}`, `--target-timestamp ${targetTimestamp}`, recipient];
  if (remove) parts.push('--remove');
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Service facade
// ---------------------------------------------------------------------------

export const signalCliService = {
  async listAccounts(): Promise<CommandResult> {
    return runSignalCli(buildListAccountsCmd());
  },

  async register(phone: string, opts: { captcha?: string; voice?: boolean; reregister?: boolean } = {}): Promise<CommandResult> {
    return runSignalCli(buildRegisterCmd(phone, opts));
  },

  async verify(phone: string, code: string, pin?: string): Promise<CommandResult> {
    return runSignalCli(buildVerifyCmd(phone, code, pin));
  },

  async link(deviceName: string): Promise<CommandResult> {
    return runSignalCli(buildLinkCmd(deviceName));
  },

  async receive(account: string, opts: { timeout?: number; maxMessages?: number; ignoreAttachments?: boolean } = {}): Promise<CommandResult> {
    return runSignalCli(buildReceiveCmd(account, opts));
  },

  async listContacts(account: string, opts: { all?: boolean; blocked?: boolean | null; name?: string } = {}): Promise<CommandResult> {
    return runSignalCli(buildListContactsCmd(account, opts));
  },

  async listGroups(account: string, detailed = false): Promise<CommandResult> {
    return runSignalCli(buildListGroupsCmd(account, detailed));
  },

  async listDevices(account: string): Promise<CommandResult> {
    return runSignalCli(buildListDevicesCmd(account));
  },
};
