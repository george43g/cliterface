/**
 * jq command builders
 * Construct jq filter strings and command lines
 */

export interface JqFilter {
  filter: string;
  input?: string;
  options: {
    compact?: boolean;
    raw?: boolean;
    rawInput?: boolean;
    nullInput?: boolean;
    sortKeys?: boolean;
    colorize?: boolean;
    indent?: number;
  };
}

export interface JqVariable {
  name: string;
  value: string;
  isString?: boolean;
}

export function buildJqCommand(filter: string, input: string = '', options: JqFilter['options'] = {}, variables: JqVariable[] = []): string {
  const parts: string[] = ['jq'];

  // Add options
  if (options.compact) parts.push('--compact-output');
  if (options.raw) parts.push('--raw-output');
  if (options.rawInput) parts.push('--raw-input');
  if (options.nullInput) parts.push('--null-input');
  if (options.sortKeys) parts.push('--sort-keys');
  if (options.colorize) parts.push('--color-output');
  if (options.indent !== undefined && options.indent !== 2) {
    parts.push(`--indent ${options.indent}`);
  }

  // Add variables
  for (const v of variables) {
    if (v.isString) {
      parts.push(`--arg ${v.name} "${v.value}"`);
    } else {
      parts.push(`--argjson ${v.name} '${v.value}'`);
    }
  }

  // Add filter (quote if contains spaces)
  if (filter.includes(' ')) {
    parts.push(`'${filter}'`);
  } else {
    parts.push(filter);
  }

  // Add input file or use stdin
  if (input) {
    parts.push(input);
  }

  return parts.join(' ');
}

export const jqFilterPresets = [
  { name: 'Identity', filter: '.', description: 'Output input unchanged' },
  { name: 'Pretty Print', filter: '.', options: { indent: 2 }, description: 'Format JSON nicely' },
  { name: 'Compact', filter: '.', options: { compact: true }, description: 'Remove all whitespace' },
  { name: 'Keys', filter: 'keys', description: 'Get top-level keys' },
  { name: 'Values', filter: '.[]', description: 'Iterate over array elements' },
  { name: 'Length', filter: 'length', description: 'Get length of array/string/object' },
  { name: 'Type', filter: 'type', description: 'Get type of value' },
  { name: 'Select', filter: 'select(.property)', description: 'Filter elements by condition' },
  { name: 'Map', filter: 'map(.property)', description: 'Extract property from each element' },
  { name: 'Group By', filter: 'group_by(.property)', description: 'Group array elements' },
  { name: 'Sort', filter: 'sort', description: 'Sort array' },
  { name: 'Unique', filter: 'unique', description: 'Remove duplicates' },
  { name: 'Reverse', filter: 'reverse', description: 'Reverse array' },
  { name: 'Flatten', filter: 'flatten', description: 'Flatten nested arrays' },
  { name: 'Max/Min', filter: 'max', description: 'Find maximum value' },
  { name: 'Add', filter: 'add', description: 'Sum or concatenate' },
  { name: 'Join', filter: 'join(",")', description: 'Join array with delimiter' },
  { name: 'Split', filter: 'split(",")', description: 'Split string into array' },
  { name: 'Substr', filter: '.[0:10]', description: 'Get substring' },
  { name: 'Contains', filter: 'contains({key: "value"})', description: 'Check if object contains' },
  { name: 'Starts With', filter: 'startswith("prefix")', description: 'String starts with' },
  { name: 'Ends With', filter: 'endswith("suffix")', description: 'String ends with' },
  { name: 'Match', filter: 'test("regex")', description: 'Regex match' },
  { name: 'Capture', filter: 'capture("(?<key>pattern)")', description: 'Capture groups' },
  { name: 'Sub', filter: 'sub("old"; "new")', description: 'Replace substring' },
  { name: 'Gsub', filter: 'gsub("old"; "new")', description: 'Global replace' },
  { name: 'Format', filter: '@base64', description: 'Base64 encode' },
  { name: 'From Date', filter: 'fromdate', description: 'Parse ISO date' },
  { name: 'Now', filter: 'now', description: 'Current timestamp' },
  { name: 'Env', filter: '$ENV.VAR', description: 'Access environment variable' },
  { name: 'Paths', filter: 'paths', description: 'Get all paths in object' },
  { name: 'Get Path', filter: 'getpath(["key", 0])', description: 'Get value at path' },
  { name: 'Set Path', filter: 'setpath(["key"]; "value")', description: 'Set value at path' },
  { name: 'Del', filter: 'del(.key)', description: 'Delete key from object' },
  { name: 'With Entries', filter: 'with_entries(.key |= "prefix_" + .)', description: 'Transform key-value pairs' },
];

export const jqExamples = [
  {
    name: 'Extract GitHub API Data',
    filter: '.[] | {login: .login, id: .id, url: .html_url}',
    description: 'Extract user info from GitHub API response',
  },
  {
    name: 'Parse Log Lines',
    filter: 'select(.level == "ERROR") | {time: .timestamp, message: .msg}',
    description: 'Filter error logs and extract time and message',
  },
  {
    name: 'CSV to JSON',
    filter: 'split("\n") | .[1:] | map(split(",")) | map({name: .[0], age: .[1]})',
    description: 'Convert CSV lines to JSON objects',
  },
  {
    name: 'Transform Config',
    filter: '.services | to_entries | map({name: .key, image: .value.image})',
    description: 'Transform Docker Compose services',
  },
  {
    name: 'Nested Query',
    filter: '.data.items[] | select(.status == "active") | .name',
    description: 'Query nested API response',
  },
  {
    name: 'Aggregate Stats',
    filter: '[.requests[].duration] | {count: length, avg: (add/length), max: max}',
    description: 'Calculate request statistics',
  },
];

export function formatJqFilter(filter: string): string {
  // Add spacing around operators for readability
  return filter
    .replace(/\|/g, ' | ')
    .replace(/\./g, ' .')
    .replace(/\?\./g, ' ?.')
    .replace(/\+\+/g, ' + ')
    .replace(/>\=/g, ' >= ')
    .replace(/\=\=/g, ' == ')
    .replace(/\!\=/g, ' != ')
    .replace(/\|\|/g, ' || ')
    .replace(/\&\&/g, ' && ')
    .replace(/\s+/g, ' ')
    .trim();
}
