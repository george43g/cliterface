/**
 * op (1Password CLI) command builders
 * Pure functions for constructing op CLI command strings.
 */

export type OpCategory = 'Login' | 'Password' | 'Secure Note' | 'API Credential' | 'SSH Key' | 'Database' | 'Server' | 'Credit Card' | 'Identity' | 'Document';

export const OP_CATEGORIES: OpCategory[] = ['Login', 'Password', 'Secure Note', 'API Credential', 'SSH Key', 'Database', 'Server', 'Credit Card', 'Identity', 'Document'];

export interface OpItemListOptions {
  vault?: string;
  categories?: OpCategory[];
  tags?: string;
  includeArchive?: boolean;
  account?: string;
}

export function buildItemListCommand(opts: OpItemListOptions = {}): string {
  const parts = ['op item list --format json'];
  if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
  if (opts.categories?.length) parts.push(`--categories ${opts.categories.join(',')}`);
  if (opts.tags) parts.push(`--tags ${JSON.stringify(opts.tags)}`);
  if (opts.includeArchive) parts.push('--include-archive');
  if (opts.account) parts.push(`--account ${opts.account}`);
  return parts.join(' ');
}

export interface OpItemGetOptions {
  vault?: string;
  fields?: string;
  otp?: boolean;
  shareLink?: boolean;
  account?: string;
}

export function buildItemGetCommand(item: string, opts: OpItemGetOptions = {}): string {
  const parts = ['op item get', JSON.stringify(item), '--format json'];
  if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
  if (opts.fields) parts.push(`--fields ${opts.fields}`);
  if (opts.otp) parts.push('--otp');
  if (opts.shareLink) parts.push('--share-link');
  if (opts.account) parts.push(`--account ${opts.account}`);
  return parts.join(' ');
}

export interface OpItemDeleteOptions {
  vault?: string;
  archive?: boolean;
  account?: string;
}

export function buildItemDeleteCommand(item: string, opts: OpItemDeleteOptions = {}): string {
  const parts = ['op item delete', JSON.stringify(item)];
  if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
  if (opts.archive) parts.push('--archive');
  if (opts.account) parts.push(`--account ${opts.account}`);
  return parts.join(' ');
}

export interface OpReadOptions {
  outputFile?: string;
  noNewline?: boolean;
}

export function buildReadCommand(reference: string, opts: OpReadOptions = {}): string {
  const parts = ['op read', JSON.stringify(reference)];
  if (opts.outputFile) parts.push(`--out-file ${JSON.stringify(opts.outputFile)}`);
  if (opts.noNewline) parts.push('--no-newline');
  return parts.join(' ');
}

export interface OpRunOptions {
  envFile?: string;
  noMasking?: boolean;
  environment?: string;
}

export function buildRunCommand(command: string, opts: OpRunOptions = {}): string {
  const parts = ['op run'];
  if (opts.environment) parts.push(`--environment ${opts.environment}`);
  if (opts.envFile) parts.push(`--env-file ${JSON.stringify(opts.envFile)}`);
  if (opts.noMasking) parts.push('--no-masking');
  parts.push('--', command);
  return parts.join(' ');
}

export interface OpInjectOptions {
  inFile?: string;
  outFile?: string;
  force?: boolean;
}

export function buildInjectCommand(opts: OpInjectOptions = {}): string {
  const parts = ['op inject'];
  if (opts.inFile) parts.push(`--in-file ${JSON.stringify(opts.inFile)}`);
  if (opts.outFile) parts.push(`--out-file ${JSON.stringify(opts.outFile)}`);
  if (opts.force) parts.push('--force');
  return parts.join(' ');
}

export function buildOpReference(vault: string, item: string, field: string): string {
  const v = vault.trim();
  const i = item.trim();
  const f = field.trim();
  if (!v || !i || !f) return '';
  return `op://${v}/${i}/${f}`;
}

export interface OpReferenceValidation {
  valid: boolean;
  error?: string;
  reference?: string;
}

export function validateAndBuildReference(vault: string, item: string, field: string): OpReferenceValidation {
  if (!vault.trim()) return { valid: false, error: 'Vault name is required' };
  if (!item.trim()) return { valid: false, error: 'Item name is required' };
  if (!field.trim()) return { valid: false, error: 'Field name is required' };
  const reference = buildOpReference(vault, item, field);
  return { valid: true, reference };
}

/** Common quick-access item categories for the presets panel */
export const ITEM_CATEGORY_PRESETS = [
  { label: 'All Items', categories: [] as OpCategory[] },
  { label: 'Logins', categories: ['Login'] as OpCategory[] },
  { label: 'Passwords', categories: ['Password'] as OpCategory[] },
  { label: 'SSH Keys', categories: ['SSH Key'] as OpCategory[] },
  { label: 'API Credentials', categories: ['API Credential'] as OpCategory[] },
  { label: 'Databases', categories: ['Database'] as OpCategory[] },
  { label: 'Secure Notes', categories: ['Secure Note'] as OpCategory[] },
  { label: 'Documents', categories: ['Document'] as OpCategory[] },
];
