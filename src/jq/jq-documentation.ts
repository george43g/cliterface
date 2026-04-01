import { registerToolTips, type ManPageData } from '../utils/tooltip-registry';

/**
 * jq documentation and tooltip registry
 */

export function registerJqDocumentation(): void {
  registerToolTips('jq', {
    filter: {
      title: 'jq Filter',
      description: 'The jq filter expression to apply to JSON input',
      examples: ['.', '.name', '.items[]', 'select(.active)'],
    },
    'filter.identity': {
      title: 'Identity Filter (.)',
      description: 'The identity filter returns the input unchanged',
      examples: ['echo \'{"a": 1}\' | jq .'],
    },
    'filter.property': {
      title: 'Property Access (.key)',
      description: 'Access a property of an object or an element of an array',
      examples: ['.name', '.items[0]', '.["key-with-dashes"]'],
    },
    'filter.array': {
      title: 'Array Iteration (.[])',
      description: 'Iterate over elements of an array',
      examples: ['.items[]', '.[] | .name'],
    },
    'filter.pipe': {
      title: 'Pipe (|)',
      description: 'Pass the output of one filter to the input of another',
      examples: ['.items[] | .name', '. | keys'],
    },
    'filter.select': {
      title: 'Select (select(condition))',
      description: 'Filter elements based on a condition',
      examples: ['select(.active)', 'select(.age > 18)'],
    },
    'filter.map': {
      title: 'Map (map(filter))',
      description: 'Apply a filter to each element of an array',
      examples: ['map(.name)', 'map(. + 1)'],
    },
    compact: {
      title: '--compact-output (-c)',
      description: 'Output each JSON object on a single line',
      examples: ['jq -c . data.json'],
    },
    raw: {
      title: '--raw-output (-r)',
      description: 'Output strings without quotes',
      examples: ['jq -r .name data.json'],
    },
    slurp: {
      title: '--slurp (-s)',
      description: 'Read entire input into an array',
      examples: ['jq -s . *.json'],
    },
    'null-input': {
      title: '--null-input (-n)',
      description: 'Use null as input, useful with inputs/0 function',
      examples: ["jq -n '[inputs]'"],
    },
  });
}

export const jqManPage: ManPageData = {
  name: 'jq',
  synopsis: 'jq [options] <jq filter> [file...]',
  description: `jq is a lightweight and flexible command-line JSON processor. 

It provides a powerful query language for filtering, transforming, and extracting data from JSON documents. Features include:

- Pipe-based filter composition
- Array/object iteration and transformation
- String manipulation and regular expressions
- Date/time handling
- Math operations and aggregations
- Format conversion (base64, urlencoding, etc.)
- Custom functions and variable binding`,
  sections: [
    {
      title: 'Basic Filters',
      content: `.           Identity - returns input unchanged
.foo        Access property foo
.[0]        Access array element at index 0
.[]         Iterate over array elements
.foo[]      Access foo and iterate
.[] | .name Iterate and extract name`,
    },
    {
      title: 'Operators',
      content: `|           Pipe - pass output to next filter
,           Concatenate results
+           Add/concatenate
-           Subtract
*           Multiply
/           Divide
%           Modulo
==          Equals
!=          Not equals
> >= < <=   Comparison
and or not  Boolean operators`,
    },
    {
      title: 'Functions',
      content: `keys            Get keys of object
values          Get values of object
length          Get length of string/array/object
map(f)          Apply filter f to each element
select(f)       Keep elements where f is true
group_by(f)     Group by result of filter f
sort            Sort array
unique          Remove duplicates
max/min         Find max/min value
add             Sum elements
join(str)       Join array with separator
split(str)      Split string into array
contains(x)     Check if input contains x
startswith(s)   Check string prefix
endswith(s)     Check string suffix`,
    },
  ],
  examples: [
    { command: 'jq . data.json', description: 'Pretty print JSON file' },
    { command: 'jq ".items[] | .name" data.json', description: 'Extract all item names' },
    { command: 'jq "select(.active) | .id" data.json', description: 'Get IDs of active items' },
    { command: 'jq -r ".items | map(.name) | join(\\", \")" data.json', description: 'Get comma-separated names' },
    { command: 'jq "[.[] | {id, name}]" data.json', description: 'Transform to array of objects' },
  ],
};

export function getJqManPage(): ManPageData {
  return jqManPage;
}
