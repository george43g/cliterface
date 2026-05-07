import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * op (1Password CLI) execution service
 *
 * NOTE: This tool handles secrets. Never display real secret values.
 * The executeCommand stub returns mock data only. Real integration
 * requires replacing executeCommand with a native bridge.
 */

export const opService = {
  // ── Auth ────────────────────────────────────────────────────────

  async whoami(account?: string): Promise<CommandResult> {
    const accountFlag = account ? ` --account ${account}` : '';
    return executeCommand(`op whoami${accountFlag} --format json`);
  },

  async signout(account?: string, all = false): Promise<CommandResult> {
    if (all) return executeCommand('op signout --all');
    const accountFlag = account ? ` --account ${account}` : '';
    return executeCommand(`op signout${accountFlag}`);
  },

  // ── Accounts ────────────────────────────────────────────────────

  async accountList(): Promise<CommandResult> {
    return executeCommand('op account list --format json');
  },

  async accountGet(account?: string): Promise<CommandResult> {
    const flag = account ? ` --account ${account}` : '';
    return executeCommand(`op account get${flag} --format json`);
  },

  // ── Vaults ──────────────────────────────────────────────────────

  async vaultList(account?: string): Promise<CommandResult> {
    const flag = account ? ` --account ${account}` : '';
    return executeCommand(`op vault list${flag} --format json`);
  },

  async vaultGet(vault: string): Promise<CommandResult> {
    return executeCommand(`op vault get ${JSON.stringify(vault)} --format json`);
  },

  // ── Items ────────────────────────────────────────────────────────

  async itemList(opts: { vault?: string; categories?: string; tags?: string; account?: string; includeArchive?: boolean } = {}): Promise<CommandResult> {
    const parts = ['op item list --format json'];
    if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
    if (opts.categories) parts.push(`--categories ${opts.categories}`);
    if (opts.tags) parts.push(`--tags ${opts.tags}`);
    if (opts.includeArchive) parts.push('--include-archive');
    if (opts.account) parts.push(`--account ${opts.account}`);
    return executeCommand(parts.join(' '));
  },

  async itemGet(
    item: string,
    opts: {
      vault?: string;
      fields?: string;
      otp?: boolean;
      account?: string;
    } = {},
  ): Promise<CommandResult> {
    const parts = ['op item get', JSON.stringify(item), '--format json'];
    if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
    if (opts.fields) parts.push(`--fields ${opts.fields}`);
    if (opts.otp) parts.push('--otp');
    if (opts.account) parts.push(`--account ${opts.account}`);
    return executeCommand(parts.join(' '));
  },

  async itemDelete(
    item: string,
    opts: {
      vault?: string;
      archive?: boolean;
      account?: string;
    } = {},
  ): Promise<CommandResult> {
    const parts = ['op item delete', JSON.stringify(item)];
    if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
    if (opts.archive) parts.push('--archive');
    if (opts.account) parts.push(`--account ${opts.account}`);
    return executeCommand(parts.join(' '));
  },

  // ── Documents ───────────────────────────────────────────────────

  async documentList(opts: { vault?: string; account?: string } = {}): Promise<CommandResult> {
    const parts = ['op document list --format json'];
    if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
    if (opts.account) parts.push(`--account ${opts.account}`);
    return executeCommand(parts.join(' '));
  },

  async documentGet(
    item: string,
    opts: {
      vault?: string;
      outputFile?: string;
      account?: string;
    } = {},
  ): Promise<CommandResult> {
    const parts = ['op document get', JSON.stringify(item)];
    if (opts.vault) parts.push(`--vault ${JSON.stringify(opts.vault)}`);
    if (opts.outputFile) parts.push(`--out-file ${JSON.stringify(opts.outputFile)}`);
    if (opts.account) parts.push(`--account ${opts.account}`);
    return executeCommand(parts.join(' '));
  },

  // ── Secret References ────────────────────────────────────────────

  async read(reference: string, outputFile?: string): Promise<CommandResult> {
    const parts = ['op read', JSON.stringify(reference)];
    if (outputFile) parts.push(`--out-file ${JSON.stringify(outputFile)}`);
    return executeCommand(parts.join(' '));
  },

  // ── Run / Inject ─────────────────────────────────────────────────

  async run(command: string, opts: { envFile?: string; noMasking?: boolean } = {}): Promise<CommandResult> {
    const parts = ['op run'];
    if (opts.envFile) parts.push(`--env-file ${JSON.stringify(opts.envFile)}`);
    if (opts.noMasking) parts.push('--no-masking');
    parts.push('--', command);
    return executeCommand(parts.join(' '));
  },

  async inject(opts: { inFile?: string; outFile?: string } = {}): Promise<CommandResult> {
    const parts = ['op inject'];
    if (opts.inFile) parts.push(`--in-file ${JSON.stringify(opts.inFile)}`);
    if (opts.outFile) parts.push(`--out-file ${JSON.stringify(opts.outFile)}`);
    return executeCommand(parts.join(' '));
  },

  // ── Service Accounts ─────────────────────────────────────────────

  async serviceAccountCreate(name: string, vaults: string[], expiresIn?: string): Promise<CommandResult> {
    const parts = ['op service-account create', JSON.stringify(name)];
    for (const v of vaults) {
      parts.push(`--vaults ${JSON.stringify(v)}`);
    }
    if (expiresIn) parts.push(`--expires-in ${expiresIn}`);
    return executeCommand(parts.join(' '));
  },

  async serviceAccountRateLimit(): Promise<CommandResult> {
    return executeCommand('op service-account ratelimit --format json');
  },

  // ── Plugins ───────────────────────────────────────────────────────

  async pluginList(): Promise<CommandResult> {
    return executeCommand('op plugin list');
  },

  async pluginInspect(): Promise<CommandResult> {
    return executeCommand('op plugin inspect');
  },

  async pluginInit(plugin: string): Promise<CommandResult> {
    return executeCommand(`op plugin init ${plugin}`);
  },
};

/**
 * Build an `op read` command string from vault/item/field components.
 */
export function buildOpReference(vault: string, item: string, field: string): string {
  const v = vault.trim();
  const i = item.trim();
  const f = field.trim();
  if (!v || !i || !f) return '';
  return `op://${v}/${i}/${f}`;
}

/**
 * Validate that a string looks like a valid op:// secret reference.
 * Pattern: op://Vault/Item/Field
 */
export function validateOpReference(ref: string): { valid: boolean; error?: string } {
  const trimmed = ref.trim();
  if (!trimmed) return { valid: false, error: 'Reference is empty' };
  if (!trimmed.startsWith('op://')) return { valid: false, error: 'Must start with op://' };
  const rest = trimmed.slice(5);
  const parts = rest.split('/');
  if (parts.length < 3) return { valid: false, error: 'Must have format op://Vault/Item/Field' };
  if (!parts[0]) return { valid: false, error: 'Vault cannot be empty' };
  if (!parts[1]) return { valid: false, error: 'Item cannot be empty' };
  if (!parts[2]) return { valid: false, error: 'Field cannot be empty' };
  return { valid: true };
}
