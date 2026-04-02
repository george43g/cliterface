import { executeCommand, type CommandResult } from '../yabai/yabai-service';

export { type CommandResult };

/**
 * jq execution service
 */
export const jqService = {
  /**
   * Execute a jq filter on JSON input
   */
  async execute(args: string): Promise<CommandResult> {
    return executeCommand(`jq ${args}`);
  },

  /**
   * Execute a jq filter on JSON input
   */
  async filter(
    filter: string,
    input: string,
    options: {
      compact?: boolean;
      raw?: boolean;
      rawInput?: boolean;
      nullInput?: boolean;
    } = {},
  ): Promise<CommandResult> {
    const cmd = buildJqCliCommand(filter, input, options);
    return executeCommand(cmd);
  },

  /**
   * Validate JSON syntax
   */
  async validateJson(input: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const result = await executeCommand(`echo '${input.replace(/'/g, "'\"'\"'")}' | jq empty`);
      return { valid: result.exitCode === 0 };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  },

  /**
   * Get jq version
   */
  async version(): Promise<string> {
    const result = await executeCommand('jq --version');
    return result.stdout.trim() || 'jq (version unknown)';
  },

  /**
   * Get jq help
   */
  async help(): Promise<string> {
    const result = await executeCommand('jq --help');
    return result.stdout;
  },
};

function buildJqCliCommand(
  filter: string,
  input: string,
  options: {
    compact?: boolean;
    raw?: boolean;
    rawInput?: boolean;
    nullInput?: boolean;
  },
): string {
  const parts: string[] = ['echo', `'${input.replace(/'/g, "'\"'\"'")}'`, '|', 'jq'];

  if (options.compact) parts.push('--compact-output');
  if (options.raw) parts.push('--raw-output');
  if (options.rawInput) parts.push('--raw-input');
  if (options.nullInput) parts.push('--null-input');

  parts.push(`'${filter}'`);

  return parts.join(' ');
}

export async function executeJqCommand(filter: string, jsonInput: string = '{}', rawOutput = false): Promise<CommandResult> {
  const cmd = `echo '${jsonInput.replace(/'/g, "'\"'\"'")}' | jq ${rawOutput ? '--raw-output ' : ''}'${filter}'`;
  return executeCommand(cmd);
}
