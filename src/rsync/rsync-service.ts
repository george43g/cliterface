import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * rsync execution service — stub bridge.
 * Replace executeCommand() in yabai-service.ts to connect to a real backend.
 */

export interface RsyncOptions {
  /** Source path (may end with trailing slash) */
  source: string;
  /** Destination path */
  destination: string;
  /** -a archive mode (= -rlptgoD) */
  archive?: boolean;
  /** -r recursive */
  recursive?: boolean;
  /** -l preserve symlinks */
  links?: boolean;
  /** -p preserve permissions */
  perms?: boolean;
  /** -t preserve modification times */
  times?: boolean;
  /** -g preserve group */
  group?: boolean;
  /** -o preserve owner (requires root) */
  owner?: boolean;
  /** -D preserve device and special files */
  devices?: boolean;
  /** -v verbose */
  verbose?: boolean;
  /** -h human-readable sizes */
  humanReadable?: boolean;
  /** --info=progress2 */
  progress2?: boolean;
  /** --stats */
  stats?: boolean;
  /** -z compress */
  compress?: boolean;
  /** -P = --partial --progress */
  partialProgress?: boolean;
  /** --inplace */
  inplace?: boolean;
  /** -W whole-file (no delta) */
  wholeFile?: boolean;
  /** -n dry-run */
  dryRun?: boolean;
  /** --delete */
  delete?: boolean;
  /** --delete-after */
  deleteAfter?: boolean;
  /** --delete-excluded */
  deleteExcluded?: boolean;
  /** --remove-source-files */
  removeSourceFiles?: boolean;
  /** -e ssh remote shell expression */
  rsh?: string;
  /** --bwlimit=KBPS */
  bwlimit?: string;
  /** --exclude patterns (one per entry) */
  excludes?: string[];
  /** --include patterns */
  includes?: string[];
  /** --exclude-from FILE */
  excludeFrom?: string;
  /** --include-from FILE */
  includeFrom?: string;
  /** --files-from FILE */
  filesFrom?: string;
  /** --filter RULE */
  filterRules?: string[];
  /** --backup */
  backup?: boolean;
  /** --backup-dir DIR */
  backupDir?: string;
  /** --suffix SUFFIX */
  suffix?: string;
  /** --link-dest DIR */
  linkDest?: string;
  /** --max-size SIZE */
  maxSize?: string;
  /** --min-size SIZE */
  minSize?: string;
  /** --append */
  append?: boolean;
  /** --append-verify */
  appendVerify?: boolean;
  /** --checksum */
  checksum?: boolean;
}

export function buildRsyncCommand(opts: RsyncOptions): string {
  const parts: string[] = ['rsync'];

  // Mode flags — archive takes precedence
  if (opts.archive) {
    parts.push('-a');
  } else {
    if (opts.recursive) parts.push('-r');
    if (opts.links) parts.push('-l');
    if (opts.perms) parts.push('-p');
    if (opts.times) parts.push('-t');
    if (opts.group) parts.push('-g');
    if (opts.owner) parts.push('-o');
    if (opts.devices) parts.push('-D');
  }

  // Display
  if (opts.verbose) parts.push('-v');
  if (opts.humanReadable) parts.push('-h');
  if (opts.progress2) parts.push('--info=progress2');
  if (opts.stats) parts.push('--stats');

  // Transfer mode
  if (opts.compress) parts.push('-z');
  if (opts.partialProgress) parts.push('-P');
  if (opts.inplace) parts.push('--inplace');
  if (opts.wholeFile) parts.push('-W');
  if (opts.append) parts.push('--append');
  if (opts.appendVerify) parts.push('--append-verify');
  if (opts.checksum) parts.push('-c');

  // Dry run
  if (opts.dryRun) parts.push('-n');

  // Destructive ops
  if (opts.removeSourceFiles) parts.push('--remove-source-files');
  if (opts.deleteExcluded) parts.push('--delete-excluded');
  if (opts.deleteAfter) parts.push('--delete-after');
  else if (opts.delete) parts.push('--delete');

  // Network
  if (opts.rsh) parts.push(`-e "${opts.rsh}"`);
  if (opts.bwlimit) parts.push(`--bwlimit=${opts.bwlimit}`);

  // Filters
  for (const inc of opts.includes ?? []) {
    parts.push(`--include="${inc}"`);
  }
  for (const exc of opts.excludes ?? []) {
    parts.push(`--exclude="${exc}"`);
  }
  if (opts.excludeFrom) parts.push(`--exclude-from="${opts.excludeFrom}"`);
  if (opts.includeFrom) parts.push(`--include-from="${opts.includeFrom}"`);
  if (opts.filesFrom) parts.push(`--files-from="${opts.filesFrom}"`);
  for (const rule of opts.filterRules ?? []) {
    parts.push(`--filter="${rule}"`);
  }

  // Backup
  if (opts.backup) parts.push('--backup');
  if (opts.backupDir) parts.push(`--backup-dir="${opts.backupDir}"`);
  if (opts.suffix) parts.push(`--suffix="${opts.suffix}"`);

  // Hard-link copy
  if (opts.linkDest) parts.push(`--link-dest="${opts.linkDest}"`);

  // Size limits
  if (opts.maxSize) parts.push(`--max-size=${opts.maxSize}`);
  if (opts.minSize) parts.push(`--min-size=${opts.minSize}`);

  // Source and destination
  parts.push(opts.source);
  parts.push(opts.destination);

  return parts.join(' ');
}

export const rsyncService = {
  async run(opts: RsyncOptions): Promise<CommandResult> {
    const cmd = buildRsyncCommand(opts);
    return executeCommand(cmd);
  },

  async execute(cmd: string): Promise<CommandResult> {
    return executeCommand(cmd);
  },

  async version(): Promise<string> {
    const result = await executeCommand('rsync --version');
    return result.stdout.split('\n')[0]?.trim() ?? 'rsync (unknown version)';
  },
};
