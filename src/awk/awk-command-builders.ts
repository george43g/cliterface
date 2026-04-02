/**
 * awk command builders
 * Construct awk program strings and command lines
 */

export interface AwkProgram {
  pattern?: string;
  action: string;
  isBegin?: boolean;
  isEnd?: boolean;
}

export interface AwkOptions {
  fieldSeparator?: string; // -F option
  outputSeparator?: string; // OFS
  recordSeparator?: string; // RS
  outputRecordSeparator?: string; // ORS
  variables?: Record<string, string>;
  file?: string;
}

export function buildAwkCommand(
  programs: AwkProgram[],
  options: AwkOptions = {},
): string {
  const parts: string[] = ['awk'];

  // Add field separator
  if (options.fieldSeparator) {
    parts.push(`-F '${options.fieldSeparator}'`);
  }

  // Add variables
  if (options.variables) {
    for (const [name, value] of Object.entries(options.variables)) {
      parts.push(`-v ${name}='${value}'`);
    }
  }

  // Build program text
  const programParts: string[] = [];

  for (const prog of programs) {
    let stmt = '';
    
    if (prog.isBegin) {
      stmt = `BEGIN { ${prog.action} }`;
    } else if (prog.isEnd) {
      stmt = `END { ${prog.action} }`;
    } else if (prog.pattern) {
      stmt = `${prog.pattern} { ${prog.action} }`;
    } else {
      stmt = `{ ${prog.action} }`;
    }
    
    programParts.push(stmt);
  }

  parts.push(`'${programParts.join(' ')}'`);

  // Add input file
  if (options.file) {
    parts.push(options.file);
  }

  return parts.join(' ');
}

// Common awk presets/patterns
export const awkPatternPresets = [
  { name: 'All lines', pattern: '', description: 'Match all input lines' },
  { name: 'Pattern match', pattern: '/pattern/', description: 'Lines matching regex pattern' },
  { name: 'Exact field match', pattern: '$1 == "value"', description: 'First field equals value' },
  { name: 'Field contains', pattern: '$1 ~ /pattern/', description: 'First field contains pattern' },
  { name: 'Line number', pattern: 'NR == 5', description: 'Specific line number' },
  { name: 'Line range', pattern: 'NR==5,NR==10', description: 'Range of line numbers' },
  { name: 'Pattern range', pattern: '/start/,/end/', description: 'From pattern to pattern' },
  { name: 'Non-empty lines', pattern: 'NF > 0', description: 'Lines with at least one field' },
  { name: 'Minimum fields', pattern: 'NF >= 3', description: 'Lines with 3+ fields' },
  { name: 'Line length', pattern: 'length($0) > 72', description: 'Lines longer than 72 chars' },
  { name: 'BEGIN', pattern: 'BEGIN', description: 'Execute before processing input', isBegin: true },
  { name: 'END', pattern: 'END', description: 'Execute after all input processed', isEnd: true },
];

// Common awk action presets
export const awkActionPresets = [
  { name: 'Print line', action: 'print', description: 'Print entire line' },
  { name: 'Print fields', action: 'print $1, $2', description: 'Print first two fields' },
  { name: 'Print with separator', action: 'print $1 ":" $2', description: 'Print fields with custom separator' },
  { name: 'Sum field', action: '{ sum += $1 } END { print sum }', description: 'Sum first field' },
  { name: 'Count lines', action: '{ count++ } END { print count }', description: 'Count total lines' },
  { name: 'Average', action: '{ sum += $1; n++ } END { if (n>0) print sum/n }', description: 'Calculate average of first field' },
  { name: 'Max value', action: '{ if ($1 > max) max = $1 } END { print max }', description: 'Find maximum of first field' },
  { name: 'Min value', action: '{ if (min == "" || $1 < min) min = $1 } END { print min }', description: 'Find minimum of first field' },
  { name: 'Field count', action: 'print NF', description: 'Print number of fields' },
  { name: 'Line number', action: 'print NR": "$0', description: 'Print with line numbers' },
  { name: 'Uppercase', action: 'print toupper($0)', description: 'Convert to uppercase' },
  { name: 'Lowercase', action: 'print tolower($0)', description: 'Convert to lowercase' },
  { name: 'Substring', action: 'print substr($1, 1, 10)', description: 'Print first 10 chars of field 1' },
  { name: 'Replace first', action: 'sub(/old/, "new"); print', description: 'Replace first occurrence' },
  { name: 'Replace all', action: 'gsub(/old/, "new"); print', description: 'Replace all occurrences' },
  { name: 'Split fields', action: 'split($0, a, ","); print a[1], a[2]', description: 'Split line by delimiter' },
];

// Common awk field separators
export const awkFieldSeparators = [
  { value: '', label: 'Whitespace (default)', description: 'Any whitespace' },
  { value: ' ', label: 'Single space', description: 'Literal space character' },
  { value: ',', label: 'Comma (CSV)', description: 'Comma-separated values' },
  { value: '\t', label: 'Tab', description: 'Tab character' },
  { value: ':', label: 'Colon', description: 'Colon-separated (e.g., /etc/passwd)' },
  { value: ';', label: 'Semicolon', description: 'Semicolon-separated' },
  { value: '|', label: 'Pipe', description: 'Pipe-separated' },
  { value: '/', label: 'Slash', description: 'Path-like separators' },
];

// Real-world awk examples
export const awkExamples = [
  {
    name: 'Print specific columns',
    pattern: '',
    action: 'print $1, $3',
    description: 'Extract first and third columns from data',
  },
  {
    name: 'Sum a column',
    pattern: '',
    action: '{ sum += $1 } END { print "Total:", sum }',
    description: 'Calculate sum of first column',
  },
  {
    name: 'Count occurrences',
    pattern: '',
    action: '{ count[$1]++ } END { for (item in count) print item, count[item] }',
    description: 'Count occurrences of each unique value in first column',
  },
  {
    name: 'Filter by pattern',
    pattern: '/error/',
    action: 'print NR": "$0',
    description: 'Print lines containing "error" with line numbers',
  },
  {
    name: 'Extract CSV fields',
    pattern: '',
    action: 'print "Name:", $1, "Age:", $2',
    fieldSeparator: ',',
    description: 'Extract fields from CSV data',
  },
  {
    name: 'Parse /etc/passwd',
    pattern: '',
    action: 'print "User:", $1, "Shell:", $7',
    fieldSeparator: ':',
    description: 'Extract username and shell from passwd file',
  },
  {
    name: 'Format with printf',
    pattern: '',
    action: 'printf "Line %3d: %s\\n", NR, $0',
    description: 'Print formatted output with line numbers',
  },
  {
    name: 'Find and replace',
    pattern: '',
    action: 'gsub(/oldtext/, "newtext"); print',
    description: 'Replace text in all lines',
  },
];

export function formatAwkProgram(program: AwkProgram): string {
  if (program.isBegin) {
    return `BEGIN { ${program.action} }`;
  }
  if (program.isEnd) {
    return `END { ${program.action} }`;
  }
  if (program.pattern) {
    return `${program.pattern} { ${program.action} }`;
  }
  return `{ ${program.action} }`;
}
