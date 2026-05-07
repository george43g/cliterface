/**
 * rsync command builders — preset profiles and helpers
 */

import type { RsyncOptions } from './rsync-service';

export interface RsyncPreset {
  id: string;
  name: string;
  description: string;
  category: 'backup' | 'sync' | 'transfer' | 'resume';
  /** danger = red confirm, sync = blue, query = green */
  intent: 'danger' | 'sync' | 'query';
  options: Partial<RsyncOptions>;
}

export const RSYNC_PRESETS: RsyncPreset[] = [
  {
    id: 'mirror-local-remote',
    name: 'Mirror local → remote (delete)',
    description: 'Archive sync to a remote host; deletes files on destination that no longer exist at source.',
    category: 'sync',
    intent: 'danger',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      compress: true,
      delete: true,
      progress2: true,
      stats: true,
      rsh: 'ssh',
    },
  },
  {
    id: 'incremental-backup',
    name: 'Incremental backup (--link-dest)',
    description: 'Time-based backup using hard links so each snapshot appears full but only changed files take space.',
    category: 'backup',
    intent: 'sync',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      stats: true,
      linkDest: '../latest',
    },
  },
  {
    id: 'resume-large-transfer',
    name: 'Resume large transfer (-P)',
    description: 'Resume an interrupted file transfer — keeps partial files and shows live progress.',
    category: 'resume',
    intent: 'sync',
    options: {
      archive: true,
      humanReadable: true,
      partialProgress: true,
      compress: true,
      append: true,
    },
  },
  {
    id: 'local-clone',
    name: 'Local directory clone',
    description: 'Quick local copy preserving all attributes.',
    category: 'sync',
    intent: 'sync',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      wholeFile: true,
      stats: true,
    },
  },
  {
    id: 'dry-run-check',
    name: 'Dry-run diff check',
    description: 'Preview what would change without touching the destination.',
    category: 'transfer',
    intent: 'query',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      dryRun: true,
      stats: true,
    },
  },
  {
    id: 'bandwidth-limited',
    name: 'Bandwidth-limited remote sync',
    description: 'Sync to remote host capped at a given bandwidth limit (in KB/s).',
    category: 'sync',
    intent: 'sync',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      compress: true,
      partialProgress: true,
      bwlimit: '1024',
      rsh: 'ssh',
    },
  },
  {
    id: 'selective-include-exclude',
    name: 'Selective sync (include/exclude)',
    description: 'Only transfer specific file types; exclude everything else.',
    category: 'sync',
    intent: 'sync',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      includes: ['*.txt', '*.md'],
      excludes: ['*'],
    },
  },
  {
    id: 'backup-with-rotation',
    name: 'Backup with rotation (--backup-dir)',
    description: 'Sync to destination; moved-aside old versions go into a backup directory with a date suffix.',
    category: 'backup',
    intent: 'sync',
    options: {
      archive: true,
      verbose: true,
      humanReadable: true,
      backup: true,
      suffix: '.bak',
    },
  },
];

export type SizeUnit = 'B' | 'K' | 'M' | 'G' | 'T';

/** Validate rsync size syntax, e.g. 100M, 1.5G */
export function validateSizeString(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: true };
  const match = /^[\d]+(\.\d+)?[BKMGT]?$/i.test(value.trim());
  if (!match) {
    return { valid: false, message: 'Use format like 100M, 1.5G, 500K' };
  }
  return { valid: true };
}

/** Validate a path — basic non-empty check */
export function validatePath(value: string): { valid: boolean; message?: string } {
  if (!value.trim()) return { valid: false, message: 'Path is required' };
  return { valid: true };
}

/** Derive danger level for the current options */
export function getCommandIntent(opts: Partial<RsyncOptions>): 'danger' | 'sync' | 'query' {
  if (opts.removeSourceFiles || opts.delete || opts.deleteAfter || opts.deleteExcluded) {
    return 'danger';
  }
  if (opts.dryRun) return 'query';
  return 'sync';
}

/** Human-readable description of what a preset does */
export function describeOptions(opts: Partial<RsyncOptions>): string[] {
  const notes: string[] = [];
  if (opts.archive) notes.push('Archive mode (-a): preserves symlinks, perms, times, group, owner, devices');
  if (opts.dryRun) notes.push('Dry-run: no files will be written');
  if (opts.delete) notes.push('DELETE: removes destination files not in source');
  if (opts.deleteAfter) notes.push('DELETE AFTER: deletion happens after transfer');
  if (opts.deleteExcluded) notes.push('DELETE EXCLUDED: excluded files are also deleted');
  if (opts.removeSourceFiles) notes.push('REMOVE SOURCE: source files deleted after successful transfer');
  if (opts.linkDest) notes.push(`Hard-link base: ${opts.linkDest}`);
  if (opts.partialProgress) notes.push('Partial resume (-P): keeps interrupted files and shows progress');
  if (opts.compress) notes.push('Compress (-z): reduces network traffic');
  if (opts.bwlimit) notes.push(`Bandwidth cap: ${opts.bwlimit} KB/s`);
  return notes;
}
