import { executeCommand, type CommandResult } from '../yabai/yabai-service';

export { type CommandResult };

/**
 * awk execution service
 */
export const awkService = {
  /**
   * Execute an awk command
   */
  async execute(args: string): Promise<CommandResult> {
    return executeCommand(`awk ${args}`);
  },

  /**
   * Execute an awk program with input
   */
  async run(
    program: string,
    input: string,
    options: {
      fieldSeparator?: string;
      variables?: Record<string, string>;
    } = {},
  ): Promise<CommandResult> {
    const cmd = buildAwkCliCommand(program, input, options);
    return executeCommand(cmd);
  },

  /**
   * Get awk version
   */
  async version(): Promise<string> {
    const result = await executeCommand('awk --version 2>&1 || gawk --version');
    return result.stdout.trim().split('\n')[0] || 'awk (version unknown)';
  },

  /**
   * Get awk help
   */
  async help(): Promise<string> {
    const result = await executeCommand('awk --help 2>&1 || gawk --help');
    return result.stdout;
  },
};

function buildAwkCliCommand(
  program: string,
  input: string,
  options: {
    fieldSeparator?: string;
    variables?: Record<string, string>;
  },
): string {
  const parts: string[] = ['echo', `'${input.replace(/'/g, "'\"'\"'")}'`, '|', 'awk'];

  // Add field separator
  if (options.fieldSeparator) {
    parts.push(`-F '${options.fieldSeparator}'`);
  }

  // Add variables
  if (options.variables) {
    for (const [name, value] of Object.entries(options.variables)) {
      parts.push(`-v ${name}='${value.replace(/'/g, "'\"'\"'")}'`);
    }
  }

  // Add program
  parts.push(`'${program}'`);

  return parts.join(' ');
}

export async function executeAwkCommand(
  program: string,
  input: string = '',
  fieldSeparator: string = '',
): Promise<CommandResult> {
  const fsArg = fieldSeparator ? `-F '${fieldSeparator}'` : '';
  const cmd = `echo '${input.replace(/'/g, "'\"'\"'")}' | awk ${fsArg} '${program}'`.trim();
  return executeCommand(cmd);
}
