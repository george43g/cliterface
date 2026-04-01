/**
 * Shared command building utilities
 * Functions for constructing and segmenting CLI commands
 */

export interface CommandSegment {
  text: string;
  type: 'command' | 'subcommand' | 'flag' | 'argument' | 'value' | 'separator';
  description: string;
  compatible: boolean;
}

/**
 * Build a command string from segments
 */
export function buildCommand(segments: Array<{ text: string; separator?: string }>): string {
  return segments.map(seg => seg.text).join(' ');
}

/**
 * Parse a command string into segments for display/highlighting
 */
export function parseCommandIntoSegments(command: string, explanations: Map<string, string> = new Map()): CommandSegment[] {
  const parts = command.split(/(\s+)/);
  const segments: CommandSegment[] = [];

  for (const part of parts) {
    if (!part) continue;

    const isWhitespace = /^\s+$/.test(part);
    if (isWhitespace) {
      segments.push({
        text: part,
        type: 'separator',
        description: 'Whitespace separator',
        compatible: true,
      });
      continue;
    }

    const type = inferSegmentType(part);
    const explanation = explanations.get(part) || getDefaultExplanation(part, type);

    segments.push({
      text: part,
      type,
      description: explanation,
      compatible: true,
    });
  }

  return segments;
}

function inferSegmentType(part: string): CommandSegment['type'] {
  if (part.startsWith('--')) return 'flag';
  if (part.startsWith('-') && part.length > 1 && !part.startsWith('-/')) return 'flag';
  if (part.match(/^[a-z][a-z0-9-]*$/i)) return 'subcommand';
  if (part.match(/^[A-Z][a-zA-Z0-9]*$/)) return 'command';
  return 'value';
}

function getDefaultExplanation(part: string, type: CommandSegment['type']): string {
  switch (type) {
    case 'command':
      return `CLI command: ${part}`;
    case 'subcommand':
      return `Subcommand: ${part}`;
    case 'flag':
      return `Option flag: ${part}`;
    case 'value':
      return 'Value/argument';
    default:
      return '';
  }
}

/**
 * Format a value for safe use in shell commands
 */
export function formatCliValue(value: string): string {
  if (!value) return '';
  // Escape special shell characters
  if (/[\s'"\\$|&;<>(){}\[\]*?#]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Quote a string for shell safety
 */
export function shellQuote(str: string): string {
  if (!str) return "''";
  if (/^[a-zA-Z0-9_./-]+$/.test(str)) return str;
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Build command segments for the command preview component
 */
export function buildCommandSegments(tool: string, subcommand: string, options: Array<{ flag: string; value?: string; description: string }>): CommandSegment[] {
  const segments: CommandSegment[] = [
    {
      text: tool,
      type: 'command',
      description: `${tool} CLI tool`,
      compatible: true,
    },
    { text: ' ', type: 'separator', description: '', compatible: true },
    {
      text: subcommand,
      type: 'subcommand',
      description: `${subcommand} subcommand`,
      compatible: true,
    },
  ];

  for (const opt of options) {
    segments.push({ text: ' ', type: 'separator', description: '', compatible: true });
    segments.push({
      text: opt.flag,
      type: 'flag',
      description: opt.description,
      compatible: true,
    });

    if (opt.value) {
      segments.push({ text: ' ', type: 'separator', description: '', compatible: true });
      segments.push({
        text: opt.value,
        type: 'value',
        description: 'Value for ' + opt.flag,
        compatible: true,
      });
    }
  }

  return segments;
}

/**
 * Detect patterns in command arguments
 */
export function detectPatterns(args: string[]): {
  hasFlags: boolean;
  hasFiles: boolean;
  hasUrls: boolean;
  hasJson: boolean;
} {
  return {
    hasFlags: args.some(a => a.startsWith('-')),
    hasFiles: args.some(a => a.match(/\.[a-zA-Z0-9]+$/) || a.includes('/')),
    hasUrls: args.some(a => a.match(/^https?:\/\//)),
    hasJson: args.some(a => {
      try {
        JSON.parse(a);
        return true;
      } catch {
        return false;
      }
    }),
  };
}
