/**
 * nc (netcat) service
 *
 * Native-bridge stub — swap executeCommand body for your runtime:
 *   Tauri:     await invoke('execute', { command: cmd })
 *   Electron:  await ipcRenderer.invoke('exec', cmd)
 *   WKWebView: await window.webkit.messageHandlers.exec.postMessage(cmd)
 *
 * BSD nc (macOS), GNU netcat, and ncat differ in flag support.
 * Key divergences are noted in the VARIANT_NOTES export.
 */

export { type CommandResult, executeCommand } from '../utils/execute-command';
import { type CommandResult, executeCommand } from '../utils/execute-command';

export type NcVariant = 'bsd' | 'gnu' | 'ncat';

export const VARIANT_NOTES: Record<NcVariant, string[]> = {
  bsd: [
    'macOS built-in (OpenBSD nc). Default on macOS.',
    '-k (keep-listening) works with -l.',
    '-z (port scan / zero-I/O) works.',
    'No -e flag — does NOT support exec/reverse shell natively.',
    'Supports -u UDP, -w timeout, -p source port.',
    'Proxy support: -X, -x for SOCKS/HTTP proxies.',
  ],
  gnu: [
    'netcat-traditional / netcat-openbsd on Linux.',
    '-e flag present in netcat-traditional: DANGEROUS, enables exec.',
    'Some distros ship netcat-openbsd (no -e).',
    'GNU netcat: nc.traditional, netcat package.',
    'Check which is installed: nc --version or which nc.',
  ],
  ncat: [
    'Nmap project. Ships with nmap. Recommended for scripting.',
    'SSL support: --ssl, --ssl-cert, --ssl-key.',
    '--keep-open replaces -k.',
    'Lua scripting: --lua-exec.',
    'Broker mode: --broker for multi-client.',
    'No -z port-scan mode — use nmap instead.',
    'Safer alternative for automation over raw nc.',
  ],
};

export const SECURITY_WARNING =
  'WARNING: -e (exec) and reverse shells are powerful and dangerous. ' +
  'Only use on systems you own or have explicit permission to test. ' +
  'Prefer ncat (nmap) or socat for controlled environments. ' +
  'Never expose -e/-c shells on untrusted networks.';


// ── Typed helpers ─────────────────────────────────────────────────────────────

export const nc = {
  /**
   * Client mode: connect to host:port over TCP.
   * nc [-v] [-w timeout] [-p srcPort] host port
   */
  async connect(host: string, port: number, opts: { verbose?: boolean; timeout?: number; srcPort?: number; udp?: boolean } = {}): Promise<CommandResult> {
    const parts = ['nc'];
    if (opts.verbose) parts.push('-v');
    if (opts.udp) parts.push('-u');
    if (opts.timeout !== undefined) parts.push('-w', String(opts.timeout));
    if (opts.srcPort !== undefined) parts.push('-p', String(opts.srcPort));
    parts.push(host, String(port));
    return executeCommand(parts.join(' '));
  },

  /**
   * Listen mode: nc -l [-k] [-u] port
   */
  async listen(port: number, opts: { keepListening?: boolean; udp?: boolean; verbose?: boolean } = {}): Promise<CommandResult> {
    const parts = ['nc', '-l'];
    if (opts.keepListening) parts.push('-k');
    if (opts.udp) parts.push('-u');
    if (opts.verbose) parts.push('-v');
    parts.push(String(port));
    return executeCommand(parts.join(' '));
  },

  /**
   * Port scan (zero-I/O): nc -z [-v] [-w timeout] host port|port-range
   * BSD nc only. GNU/ncat: use nmap instead.
   */
  async portScan(host: string, portRange: string, opts: { verbose?: boolean; timeout?: number } = {}): Promise<CommandResult> {
    const parts = ['nc', '-z'];
    if (opts.verbose) parts.push('-v');
    if (opts.timeout !== undefined) parts.push('-w', String(opts.timeout));
    parts.push(host, portRange);
    return executeCommand(parts.join(' '));
  },

  /**
   * Banner grab: echo | nc -w 2 host port
   */
  async bannerGrab(host: string, port: number, probe = ''): Promise<CommandResult> {
    const escapedProbe = probe.replace(/'/g, "'\"'\"'");
    const echoCmd = probe ? `printf '${escapedProbe}'` : 'printf ""';
    return executeCommand(`${echoCmd} | nc -w 2 ${host} ${port}`);
  },

  /**
   * File send: nc host port < file
   * Pair with a listener: nc -l port > outfile
   */
  async fileSend(host: string, port: number, filePath: string): Promise<CommandResult> {
    return executeCommand(`nc ${host} ${port} < ${filePath}`);
  },

  /**
   * File receive (listen): nc -l port > outfile
   */
  async fileReceive(port: number, outFile: string): Promise<CommandResult> {
    return executeCommand(`nc -l ${port} > ${outFile}`);
  },

  /**
   * HTTP GET banner grab (Layer 7).
   * printf 'HEAD / HTTP/1.0\r\n\r\n' | nc -w 3 host 80
   */
  async httpBanner(host: string, port = 80, path = '/'): Promise<CommandResult> {
    return executeCommand(`printf 'HEAD ${path} HTTP/1.0\\r\\nHost: ${host}\\r\\n\\r\\n' | nc -w 3 ${host} ${port}`);
  },
};
