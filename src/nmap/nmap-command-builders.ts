/**
 * nmap command builders
 * All options are derived from the nmap man page / --help output.
 * Do not add flags that nmap does not support.
 */

// ── Target types ──────────────────────────────────────────────────────────────

export type TargetMode = 'single' | 'cidr' | 'range' | 'file' | 'random';

export interface NmapTargetOptions {
  mode: TargetMode;
  /** Hostname / IP / CIDR / range — used when mode !== 'file' | 'random' */
  target: string;
  /** -iL: path to file with hosts */
  inputFile: string;
  /** -iR: number of random hosts */
  randomCount: string;
  /** --exclude: comma-separated list */
  exclude: string;
  /** -Pn: skip host discovery */
  skipDiscovery: boolean;
  /** -n: never do DNS resolution */
  noDns: boolean;
  /** --traceroute */
  traceroute: boolean;
}

// ── Scan technique ─────────────────────────────────────────────────────────────

export type ScanTechnique =
  | '' // default
  | '-sS' // TCP SYN (root)
  | '-sT' // TCP connect
  | '-sU' // UDP
  | '-sA' // TCP ACK
  | '-sn' // Ping scan (no port scan)
  | '-sL' // List scan
  | '-sV' // Version detection
  | '-sC' // Default scripts
  | '-A' // Aggressive (OS + version + scripts + traceroute)
  | '-O'; // OS detection

export interface NmapScanOptions {
  technique: ScanTechnique;
  /** -sV intensity 0-9 */
  versionIntensity: string;
  /** -O: OS detection */
  osDetection: boolean;
  /** --osscan-guess */
  osGuess: boolean;
}

// ── Port specification ────────────────────────────────────────────────────────

export type PortMode = 'default' | 'specific' | 'top' | 'fast' | 'all';

export interface NmapPortOptions {
  mode: PortMode;
  /** -p: port list when mode === 'specific' */
  portList: string;
  /** --top-ports when mode === 'top' */
  topPorts: string;
  /** -r: scan sequentially */
  sequential: boolean;
  /** --exclude-ports */
  excludePorts: string;
}

// ── Timing & performance ──────────────────────────────────────────────────────

export interface NmapTimingOptions {
  /** -T0..-T5 */
  template: string; // '0'..'5' or ''
  minRate: string;
  maxRetries: string;
  hostTimeout: string;
  scanDelay: string;
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface NmapOutputOptions {
  /** -v verbosity count */
  verbose: number;
  /** -d debugging count */
  debug: number;
  /** --reason */
  reason: boolean;
  /** --open */
  openOnly: boolean;
  /** --packet-trace */
  packetTrace: boolean;
  /** -oN/-oX/-oG/-oA basename */
  outputFormat: '' | 'N' | 'X' | 'G' | 'A';
  outputFile: string;
}

// ── NSE Scripts ───────────────────────────────────────────────────────────────

export type NseCategory = '' | 'default' | 'safe' | 'intrusive' | 'discovery' | 'vuln' | 'exploit' | 'brute' | 'dos' | 'malware' | 'version' | 'external' | 'auth' | 'fuzzer';

export interface NmapNseOptions {
  /** --script category or script name */
  script: string;
  /** --script-args */
  scriptArgs: string;
  /** --script-trace */
  scriptTrace: boolean;
}

// ── Evasion / spoofing ────────────────────────────────────────────────────────

export interface NmapEvasionOptions {
  /** -f: fragment packets */
  fragment: boolean;
  /** --mtu */
  mtu: string;
  /** -D: decoys (comma-separated) */
  decoys: string;
  /** -S: spoof source IP */
  spoofSource: string;
  /** -e: interface */
  iface: string;
  /** -g / --source-port */
  sourcePort: string;
  /** --ttl */
  ttl: string;
  /** --spoof-mac */
  spoofMac: string;
  /** --data-length */
  dataLength: string;
}

// ── Aggregate options ─────────────────────────────────────────────────────────

export interface NmapOptions {
  target: NmapTargetOptions;
  scan: NmapScanOptions;
  ports: NmapPortOptions;
  timing: NmapTimingOptions;
  output: NmapOutputOptions;
  nse: NmapNseOptions;
  evasion: NmapEvasionOptions;
}

// ── Command builder ──────────────────────────────────────────────────────────

export function buildNmapCommand(opts: NmapOptions): string {
  const parts: string[] = ['nmap'];

  // Scan technique
  if (opts.scan.technique) {
    if (opts.scan.technique === '-A') {
      parts.push('-A');
    } else {
      parts.push(opts.scan.technique);
      if (opts.scan.technique === '-sV' && opts.scan.versionIntensity) {
        parts.push(`--version-intensity ${opts.scan.versionIntensity}`);
      }
    }
  }

  // OS detection (when not already implied by -A)
  if (opts.scan.osDetection && opts.scan.technique !== '-A') {
    parts.push('-O');
  }
  if (opts.scan.osGuess) {
    parts.push('--osscan-guess');
  }

  // Port specification
  switch (opts.ports.mode) {
    case 'specific':
      if (opts.ports.portList) parts.push(`-p ${opts.ports.portList}`);
      break;
    case 'top':
      if (opts.ports.topPorts) parts.push(`--top-ports ${opts.ports.topPorts}`);
      break;
    case 'fast':
      parts.push('-F');
      break;
    case 'all':
      parts.push('-p-');
      break;
    // 'default' → no port flag
  }
  if (opts.ports.sequential) parts.push('-r');
  if (opts.ports.excludePorts) parts.push(`--exclude-ports ${opts.ports.excludePorts}`);

  // NSE scripts
  if (opts.nse.script) {
    parts.push(`--script ${opts.nse.script}`);
    if (opts.nse.scriptArgs) parts.push(`--script-args ${opts.nse.scriptArgs}`);
  }
  if (opts.nse.scriptTrace) parts.push('--script-trace');

  // Timing
  if (opts.timing.template) parts.push(`-T${opts.timing.template}`);
  if (opts.timing.minRate) parts.push(`--min-rate ${opts.timing.minRate}`);
  if (opts.timing.maxRetries) parts.push(`--max-retries ${opts.timing.maxRetries}`);
  if (opts.timing.hostTimeout) parts.push(`--host-timeout ${opts.timing.hostTimeout}`);
  if (opts.timing.scanDelay) parts.push(`--scan-delay ${opts.timing.scanDelay}`);

  // Evasion
  if (opts.evasion.fragment) parts.push('-f');
  if (opts.evasion.mtu) parts.push(`--mtu ${opts.evasion.mtu}`);
  if (opts.evasion.decoys) parts.push(`-D ${opts.evasion.decoys}`);
  if (opts.evasion.spoofSource) parts.push(`-S ${opts.evasion.spoofSource}`);
  if (opts.evasion.iface) parts.push(`-e ${opts.evasion.iface}`);
  if (opts.evasion.sourcePort) parts.push(`-g ${opts.evasion.sourcePort}`);
  if (opts.evasion.ttl) parts.push(`--ttl ${opts.evasion.ttl}`);
  if (opts.evasion.spoofMac) parts.push(`--spoof-mac ${opts.evasion.spoofMac}`);
  if (opts.evasion.dataLength) parts.push(`--data-length ${opts.evasion.dataLength}`);

  // Output flags
  if (opts.output.verbose > 0) parts.push(`-${'v'.repeat(opts.output.verbose)}`);
  if (opts.output.debug > 0) parts.push(`-${'d'.repeat(opts.output.debug)}`);
  if (opts.output.reason) parts.push('--reason');
  if (opts.output.openOnly) parts.push('--open');
  if (opts.output.packetTrace) parts.push('--packet-trace');
  if (opts.output.outputFormat && opts.output.outputFile) {
    parts.push(`-o${opts.output.outputFormat} ${opts.output.outputFile}`);
  }

  // Host discovery overrides
  if (opts.target.skipDiscovery) parts.push('-Pn');
  if (opts.target.noDns) parts.push('-n');
  if (opts.target.traceroute && opts.scan.technique !== '-A') parts.push('--traceroute');

  // Target
  switch (opts.target.mode) {
    case 'file':
      if (opts.target.inputFile) parts.push(`-iL ${opts.target.inputFile}`);
      break;
    case 'random':
      if (opts.target.randomCount) parts.push(`-iR ${opts.target.randomCount}`);
      break;
    default:
      if (opts.target.target) parts.push(opts.target.target);
      if (opts.target.exclude) parts.push(`--exclude ${opts.target.exclude}`);
  }

  return parts.join(' ');
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function defaultNmapOptions(): NmapOptions {
  return {
    target: {
      mode: 'single',
      target: '',
      inputFile: '',
      randomCount: '',
      exclude: '',
      skipDiscovery: false,
      noDns: false,
      traceroute: false,
    },
    scan: {
      technique: '',
      versionIntensity: '',
      osDetection: false,
      osGuess: false,
    },
    ports: {
      mode: 'default',
      portList: '',
      topPorts: '',
      sequential: false,
      excludePorts: '',
    },
    timing: {
      template: '',
      minRate: '',
      maxRetries: '',
      hostTimeout: '',
      scanDelay: '',
    },
    output: {
      verbose: 0,
      debug: 0,
      reason: false,
      openOnly: false,
      packetTrace: false,
      outputFormat: '',
      outputFile: '',
    },
    nse: {
      script: '',
      scriptArgs: '',
      scriptTrace: false,
    },
    evasion: {
      fragment: false,
      mtu: '',
      decoys: '',
      spoofSource: '',
      iface: '',
      sourcePort: '',
      ttl: '',
      spoofMac: '',
      dataLength: '',
    },
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate a single IP address (v4)
 */
export function isValidIp(value: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split('.').every(oct => parseInt(oct, 10) <= 255);
}

/**
 * Validate a CIDR notation like 192.168.1.0/24
 */
export function isValidCidr(value: string): boolean {
  const parts = value.split('/');
  if (parts.length !== 2) return false;
  const prefix = parseInt(parts[1], 10);
  return isValidIp(parts[0]) && !Number.isNaN(prefix) && prefix >= 0 && prefix <= 32;
}

/**
 * Validate a port or port-range string like "22", "1-1024", "80,443", "U:53,T:80"
 */
export function isValidPortSpec(value: string): boolean {
  if (!value) return false;
  // Allow protocol prefixes: T: U: S:
  const stripped = value.replace(/^[TUS]:/i, '');
  return /^[\d,-]+$/.test(stripped);
}

/**
 * Validate a hostname or IP (very loose — nmap handles resolution)
 */
export function isValidTarget(value: string): boolean {
  if (!value) return false;
  // IP, CIDR, hostname, range like 10.0.0-5.1
  return /^[a-zA-Z0-9._\-/,: ]+$/.test(value);
}

export const NSE_CATEGORIES: Array<{ id: NseCategory; label: string; description: string }> = [
  { id: 'default', label: 'default', description: 'Safe, high-quality scripts that are fast and reliable' },
  { id: 'safe', label: 'safe', description: 'Non-intrusive scripts that will not harm targets' },
  { id: 'discovery', label: 'discovery', description: 'Retrieve additional info about network services, registries, etc.' },
  { id: 'vuln', label: 'vuln', description: 'Check for known vulnerabilities' },
  { id: 'auth', label: 'auth', description: 'Deal with authentication credentials' },
  { id: 'brute', label: 'brute', description: 'Brute-force credential attacks' },
  { id: 'exploit', label: 'exploit', description: 'Actively exploit a vulnerability' },
  { id: 'version', label: 'version', description: 'Extensions to version detection' },
  { id: 'intrusive', label: 'intrusive', description: 'Risky scripts that may crash targets or consume bandwidth' },
  { id: 'dos', label: 'dos', description: 'Denial of service scripts (use with great caution)' },
  { id: 'malware', label: 'malware', description: 'Detect backdoors and malware' },
  { id: 'external', label: 'external', description: 'Scripts that send data to third-party services' },
  { id: 'fuzzer', label: 'fuzzer', description: 'Send unexpected inputs to probe for bugs' },
];

export const SCAN_TECHNIQUES: Array<{ id: ScanTechnique; label: string; description: string; rootRequired: boolean }> = [
  { id: '', label: 'Default', description: 'Default scan (TCP SYN if root, TCP connect otherwise)', rootRequired: false },
  { id: '-sS', label: '-sS TCP SYN', description: 'SYN scan — fast, stealthy, most popular. Requires root/admin.', rootRequired: true },
  { id: '-sT', label: '-sT TCP Connect', description: 'Full TCP connect scan. No root needed.', rootRequired: false },
  { id: '-sU', label: '-sU UDP', description: 'UDP scan. Slower. Requires root.', rootRequired: true },
  { id: '-sA', label: '-sA TCP ACK', description: 'ACK scan — maps firewall rulesets. Requires root.', rootRequired: true },
  { id: '-sn', label: '-sn Ping (no port)', description: 'Host discovery only; no port scan.', rootRequired: false },
  { id: '-sL', label: '-sL List', description: 'List targets only — no scan performed.', rootRequired: false },
  { id: '-sV', label: '-sV Version', description: 'Probe open ports to determine service/version.', rootRequired: false },
  { id: '-sC', label: '-sC Scripts', description: 'Equivalent to --script=default.', rootRequired: false },
  { id: '-O', label: '-O OS detect', description: 'Enable OS detection. Requires root.', rootRequired: true },
  { id: '-A', label: '-A Aggressive', description: 'OS detect + version + scripts + traceroute.', rootRequired: false },
];

export const TIMING_TEMPLATES: Array<{ id: string; label: string; description: string }> = [
  { id: '', label: 'Default', description: 'Let nmap choose timing' },
  { id: '0', label: 'T0 Paranoid', description: 'Very slow — for IDS evasion' },
  { id: '1', label: 'T1 Sneaky', description: 'Slow — for IDS evasion' },
  { id: '2', label: 'T2 Polite', description: 'Slows down to use less bandwidth' },
  { id: '3', label: 'T3 Normal', description: 'Default timing' },
  { id: '4', label: 'T4 Aggressive', description: 'Faster — assumes fast, reliable network' },
  { id: '5', label: 'T5 Insane', description: 'Very fast — may miss open ports' },
];
