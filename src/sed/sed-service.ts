export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export async function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB - replace with actual native bridge
  console.log('[executeCommand]', cmd);
  return {
    stdout: `Mock output for: ${cmd}\nResult would appear here from actual command execution.`,
    exitCode: 0,
  };
}

export type SedCommand =
  | 'substitute'
  | 'delete'
  | 'print'
  | 'append'
  | 'insert'
  | 'change'
  | 'transform'
  | 'read'
  | 'write'
  | 'quit'
  | 'next'
  | 'hold'
  | 'exchange'
  | 'branch'
  | 'test';

export type AddressType = 'none' | 'line' | 'range' | 'regex' | 'last';

export interface SedScript {
  commands: SedCommandEntry[];
  options: SedOptions;
}

export interface SedCommandEntry {
  type: SedCommand;
  address?: SedAddress;
  pattern?: string;
  replacement?: string;
  flags?: string[];
  text?: string;
  label?: string;
  file?: string;
}

export interface SedAddress {
  type: AddressType;
  start?: number | string;
  end?: number | string;
}

export interface SedOptions {
  quiet: boolean;
  extendedRegex: boolean;
  inPlace: boolean;
  inPlaceSuffix?: string;
  separate: boolean;
  unbuffered: boolean;
  nullData: boolean;
  sandbox: boolean;
  lineLength?: number;
}

export function buildSedCommand(script: SedScript, inputFile?: string): string {
  const parts: string[] = ['sed'];

  // Add options
  if (script.options.quiet) {
    parts.push('-n');
  }
  if (script.options.extendedRegex) {
    parts.push('-E');
  }
  if (script.options.inPlace) {
    parts.push(script.options.inPlaceSuffix ? `-i${script.options.inPlaceSuffix}` : '-i');
  }
  if (script.options.separate) {
    parts.push('-s');
  }
  if (script.options.unbuffered) {
    parts.push('-u');
  }
  if (script.options.nullData) {
    parts.push('-z');
  }
  if (script.options.sandbox) {
    parts.push('--sandbox');
  }
  if (script.options.lineLength) {
    parts.push(`-l ${script.options.lineLength}`);
  }

  // Add script commands
  for (const cmd of script.commands) {
    const scriptPart = buildCommandScript(cmd);
    parts.push('-e', `'${scriptPart}'`);
  }

  // Add input file
  if (inputFile) {
    parts.push(inputFile);
  }

  return parts.join(' ');
}

function buildCommandScript(cmd: SedCommandEntry): string {
  const addr = buildAddress(cmd.address);

  switch (cmd.type) {
    case 'substitute':
      return `${addr}s/${escapeDelim(cmd.pattern || '')}/${escapeDelim(cmd.replacement || '')}/${(cmd.flags || []).join('')}`;
    case 'delete':
      return `${addr}d`;
    case 'print':
      return `${addr}p`;
    case 'append':
      return `${addr}a\\\n${cmd.text || ''}`;
    case 'insert':
      return `${addr}i\\\n${cmd.text || ''}`;
    case 'change':
      return `${addr}c\\\n${cmd.text || ''}`;
    case 'transform':
      return `${addr}y/${cmd.pattern || ''}/${cmd.replacement || ''}/`;
    case 'read':
      return `${addr}r ${cmd.file || ''}`;
    case 'write':
      return `${addr}w ${cmd.file || ''}`;
    case 'quit':
      return `${addr}q`;
    case 'next':
      return `${addr}n`;
    case 'hold':
      return `${addr}h`;
    case 'exchange':
      return `${addr}x`;
    case 'branch':
      return `${cmd.label ? cmd.label + ':' : ''}b${cmd.label || ''}`;
    case 'test':
      return `t${cmd.label || ''}`;
    default:
      return '';
  }
}

function buildAddress(addr?: SedAddress): string {
  if (!addr || addr.type === 'none') return '';

  switch (addr.type) {
    case 'line':
      return String(addr.start);
    case 'range':
      if (addr.start && addr.end) {
        return `${addr.start},${addr.end}`;
      }
      return String(addr.start || '');
    case 'regex':
      return `/${addr.start}/`;
    case 'last':
      return '$';
    default:
      return '';
  }
}

function escapeDelim(str: string): string {
  return str.replace(/\//g, '\\/');
}

// Presets for common sed operations
export const SED_PRESETS = [
  {
    name: 'Basic Substitution',
    description: 'Replace first occurrence of pattern on each line',
    script: "s/old/new/",
  },
  {
    name: 'Global Substitution',
    description: 'Replace all occurrences of pattern',
    script: "s/old/new/g",
  },
  {
    name: 'Case-Insensitive Substitution',
    description: 'Replace regardless of case',
    script: "s/old/new/gi",
  },
  {
    name: 'Delete Blank Lines',
    description: 'Remove empty lines from output',
    script: "/^$/d",
  },
  {
    name: 'Delete Lines Matching Pattern',
    description: 'Remove lines containing a pattern',
    script: "/pattern/d",
  },
  {
    name: 'Print Line Numbers',
    description: 'Show line numbers with = command',
    script: "=",
  },
  {
    name: 'Extract Specific Lines',
    description: 'Print only lines 5-10',
    script: "-n '5,10p'",
  },
  {
    name: 'Uppercase Conversion',
    description: 'Convert lowercase to uppercase',
    script: "y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/",
  },
  {
    name: 'Remove HTML Tags',
    description: 'Strip HTML/XML tags from text',
    script: "s/<[^>]*>//g",
  },
  {
    name: 'Trim Leading Whitespace',
    description: 'Remove whitespace from start of lines',
    script: "s/^[[:space:]]*//",
  },
  {
    name: 'Trim Trailing Whitespace',
    description: 'Remove whitespace from end of lines',
    script: "s/[[:space:]]*$//",
  },
  {
    name: 'Collapse Multiple Spaces',
    description: 'Replace multiple spaces with single space',
    script: "s/  */ /g",
  },
  {
    name: 'Add Line Numbers',
    description: 'Prepend line numbers to each line',
    script: "=; N; s/\\n/ /",
  },
  {
    name: 'Reverse File Lines',
    description: 'Print lines in reverse order (tac)',
    script: "1!G; h; $p",
  },
  {
    name: 'Print Last Line',
    description: 'Only print the final line',
    script: "-n '$p'",
  },
  {
    name: 'Duplicate Each Line',
    description: 'Print each line twice',
    script: "p",
  },
];

export const sed = {
  async execute(script: string, input?: string, options?: Partial<SedOptions>): Promise<CommandResult> {
    const opts: string[] = [];
    if (options?.quiet) opts.push('-n');
    if (options?.extendedRegex) opts.push('-E');
    if (options?.inPlace) opts.push(options.inPlaceSuffix ? `-i${options.inPlaceSuffix}` : '-i');
    if (options?.separate) opts.push('-s');
    if (options?.unbuffered) opts.push('-u');
    if (options?.nullData) opts.push('-z');

    const cmd = ['sed', ...opts, '-e', `'${script}'`, input || ''].filter(Boolean).join(' ');
    return executeCommand(cmd);
  },

  async preview(script: string, sampleInput: string, options?: Partial<SedOptions>): Promise<CommandResult> {
    const opts: string[] = [];
    if (options?.quiet) opts.push('-n');
    if (options?.extendedRegex) opts.push('-E');

    const cmd = `echo '${sampleInput.replace(/'/g, "'\"'\"'")}' | sed ${opts.join(' ')} -e '${script}'`;
    return executeCommand(cmd);
  },
};
