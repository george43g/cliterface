/**
 * nc command builders
 * Produce shell-ready nc command strings from structured options.
 * All builders are pure functions — no side effects.
 */

// ── Client mode ───────────────────────────────────────────────────────────────

export interface ClientOptions {
  host: string;
  port: string;
  udp: boolean;
  verbose: boolean;
  timeout: string;
  srcPort: string;
  ipVersion: '4' | '6' | '';
  noDns: boolean;
  crlf: boolean;
}

export function buildClientCommand(opts: ClientOptions): string {
  const parts = ['nc'];
  if (opts.ipVersion === '4') parts.push('-4');
  if (opts.ipVersion === '6') parts.push('-6');
  if (opts.udp) parts.push('-u');
  if (opts.verbose) parts.push('-v');
  if (opts.noDns) parts.push('-n');
  if (opts.crlf) parts.push('-c');
  if (opts.timeout.trim()) parts.push('-w', opts.timeout.trim());
  if (opts.srcPort.trim()) parts.push('-p', opts.srcPort.trim());
  parts.push(opts.host.trim(), opts.port.trim());
  return parts.join(' ');
}

// ── Listen mode ───────────────────────────────────────────────────────────────

export interface ListenOptions {
  port: string;
  udp: boolean;
  keepListening: boolean;
  verbose: boolean;
  ipVersion: '4' | '6' | '';
  noDns: boolean;
}

export function buildListenCommand(opts: ListenOptions): string {
  const parts = ['nc', '-l'];
  if (opts.ipVersion === '4') parts.push('-4');
  if (opts.ipVersion === '6') parts.push('-6');
  if (opts.keepListening) parts.push('-k');
  if (opts.udp) parts.push('-u');
  if (opts.verbose) parts.push('-v');
  if (opts.noDns) parts.push('-n');
  parts.push(opts.port.trim());
  return parts.join(' ');
}

// ── Port scan mode ────────────────────────────────────────────────────────────

export interface ScanOptions {
  host: string;
  portRange: string; // e.g. "80" or "20-25" or "22 80 443"
  verbose: boolean;
  timeout: string;
  ipVersion: '4' | '6' | '';
}

export function buildScanCommand(opts: ScanOptions): string {
  const parts = ['nc', '-z'];
  if (opts.ipVersion === '4') parts.push('-4');
  if (opts.ipVersion === '6') parts.push('-6');
  if (opts.verbose) parts.push('-v');
  if (opts.timeout.trim()) parts.push('-w', opts.timeout.trim());
  parts.push(opts.host.trim(), opts.portRange.trim());
  return parts.join(' ');
}

// ── File transfer ─────────────────────────────────────────────────────────────

export interface FileTransferOptions {
  role: 'sender' | 'receiver';
  host: string; // sender only
  port: string;
  filePath: string;
  verbose: boolean;
  keepListening: boolean; // receiver only
}

export function buildFileTransferCommand(opts: FileTransferOptions): string {
  if (opts.role === 'receiver') {
    const parts = ['nc', '-l'];
    if (opts.keepListening) parts.push('-k');
    if (opts.verbose) parts.push('-v');
    parts.push(opts.port.trim());
    if (opts.filePath.trim()) parts.push('>', opts.filePath.trim());
    return parts.join(' ');
  }
  // sender
  const parts = ['nc'];
  if (opts.verbose) parts.push('-v');
  parts.push(opts.host.trim(), opts.port.trim());
  if (opts.filePath.trim()) parts.push('<', opts.filePath.trim());
  return parts.join(' ');
}

// ── Banner grab ───────────────────────────────────────────────────────────────

export interface BannerOptions {
  host: string;
  port: string;
  probe: string; // raw bytes/string to send before reading response
  timeout: string;
  httpMode: boolean; // auto-generate HTTP HEAD probe
  httpPath: string;
}

export function buildBannerCommand(opts: BannerOptions): string {
  const host = opts.host.trim();
  const port = opts.port.trim();
  const timeout = opts.timeout.trim() || '3';
  let probe = opts.probe.trim();

  if (opts.httpMode) {
    probe = `HEAD ${opts.httpPath || '/'} HTTP/1.0\\r\\nHost: ${host}\\r\\n\\r\\n`;
    return `printf '${probe}' | nc -w ${timeout} ${host} ${port}`;
  }

  if (probe) {
    const escaped = probe.replace(/'/g, "'\"'\"'");
    return `printf '${escaped}' | nc -w ${timeout} ${host} ${port}`;
  }

  // No probe — just connect and read banner (e.g. SMTP, FTP)
  return `nc -w ${timeout} ${host} ${port}`;
}

// ── Validation ────────────────────────────────────────────────────────────────

/** Returns an error message or null if valid */
export function validateHost(host: string): string | null {
  const h = host.trim();
  if (!h) return 'Host is required';
  // Basic sanity: allow hostnames, IPv4, IPv6 bracket notation
  if (h.length > 253) return 'Hostname too long';
  return null;
}

export function validatePort(port: string): string | null {
  const p = port.trim();
  if (!p) return 'Port is required';
  const n = Number(p);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return 'Port must be 1–65535';
  return null;
}

export function validatePortRange(range: string): string | null {
  const r = range.trim();
  if (!r) return 'Port range is required';
  // Allow: "80", "20-25", "22 80 443"
  if (/^\d+(-\d+)?( \d+(-\d+)?)*$/.test(r)) return null;
  return 'Use a port number (80), range (20-25), or space-separated list';
}
