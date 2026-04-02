import { registerToolTips, type ManPageData } from '../utils/tooltip-registry';

/**
 * awk documentation and tooltip registry
 */

export function registerAwkDocumentation(): void {
  registerToolTips('awk', {
    pattern: {
      title: 'Pattern',
      description: 'A pattern that determines when the action is executed. Can be a regex, expression, or special pattern like BEGIN/END.',
      examples: ['/regex/', '$1 == "value"', 'NR > 5', 'BEGIN', 'END'],
    },
    action: {
      title: 'Action',
      description: 'The statements to execute when the pattern matches. Enclosed in curly braces.',
      examples: ['{ print }', '{ print $1, $2 }', '{ sum += $1 }'],
    },
    field: {
      title: 'Field ($n)',
      description: 'Reference to the nth field/column of the current record. $0 is the entire line.',
      examples: ['$0', '$1', '$NF'],
    },
    begin: {
      title: 'BEGIN Pattern',
      description: 'Special pattern executed before any input is read. Used for initialization.',
      examples: ['BEGIN { print "Header" }'],
    },
    end: {
      title: 'END Pattern',
      description: 'Special pattern executed after all input has been processed. Used for cleanup/final output.',
      examples: ['END { print "Footer" }'],
    },
    fs: {
      title: 'Field Separator (FS)',
      description: 'The regular expression used to split input into fields. Set with -F flag.',
      examples: ['-F ","', '-F ":"', '-F "[ ]+"'],
    },
    print: {
      title: 'print Statement',
      description: 'Output text to standard output. Fields are separated by OFS, records by ORS.',
      examples: ['print', 'print $1', 'print $1, $2', 'print "text"'],
    },
    printf: {
      title: 'printf Statement',
      description: 'Formatted output similar to C printf.',
      examples: ['printf "%s\\n", $1', 'printf "%10s %5d\\n", $1, $2'],
    },
    sub: {
      title: 'sub() Function',
      description: 'Substitute first occurrence of regex with replacement in string.',
      examples: ['sub(/old/, "new")', 'sub(/re/, "x", $1)'],
    },
    gsub: {
      title: 'gsub() Function',
      description: 'Global substitute - replace all occurrences of regex with replacement.',
      examples: ['gsub(/old/, "new")', 'gsub(/ /, "_", $0)'],
    },
    match: {
      title: 'match() Function',
      description: 'Test if regex matches in string. Sets RSTART and RLENGTH.',
      examples: ['match($0, /regex/)'],
    },
    split: {
      title: 'split() Function',
      description: 'Split string into array by separator. Returns number of elements.',
      examples: ['split($0, arr, ",")'],
    },
    length: {
      title: 'length() Function',
      description: 'Return the length of a string or $0 if no argument.',
      examples: ['length', 'length($1)'],
    },
    substr: {
      title: 'substr() Function',
      description: 'Extract substring. Arguments: string, start position, optional length.',
      examples: ['substr($1, 1, 5)', 'substr($0, 3)'],
    },
    index: {
      title: 'index() Function',
      description: 'Find position of substring in string. Returns 0 if not found.',
      examples: ['index($0, "search")'],
    },
    nr: {
      title: 'NR Variable',
      description: 'Number of current record (line number across all files).',
      examples: ['NR == 1', 'NR > 10'],
    },
    fnr: {
      title: 'FNR Variable',
      description: 'Number of current record in current file (resets per file).',
      examples: ['FNR == 1'],
    },
    nf: {
      title: 'NF Variable',
      description: 'Number of fields in current record.',
      examples: ['NF > 0', '$NF (last field)'],
    },
    'if': {
      title: 'if Statement',
      description: 'Conditional execution. Can include else clause.',
      examples: ['if (NF > 5) print', 'if ($1 > 10) { print "big" } else { print "small" }'],
    },
    for: {
      title: 'for Statement',
      description: 'C-style for loop or array iteration with "in".',
      examples: ['for (i=1; i<=NF; i++) print $i', 'for (item in arr) print item, arr[item]'],
    },
    while: {
      title: 'while Statement',
      description: 'Loop while condition is true.',
      examples: ['while (getline > 0) { count++ }'],
    },
    array: {
      title: 'Arrays',
      description: 'Associative arrays indexed by string. Use in operator to iterate.',
      examples: ['arr["key"] = value', 'for (k in arr) print k, arr[k]'],
    },
  });
}

export const awkManPage: ManPageData = {
  name: 'awk',
  synopsis: 'awk [ -F fs ] [ -v var=value ] [ -f progfile ] [ -- ] program [ file ... ]',
  description: `awk is a pattern scanning and text processing language. It is useful for manipulating data files, text retrieval and processing, and for prototyping.

An AWK program consists of pattern-action statements and optional function definitions. For each line of input, awk tests all patterns and executes the actions for those that match.

Key features:
- Pattern matching with regular expressions
- Field-based processing ($1, $2, etc.)
- Associative arrays
- Built-in string and numeric functions
- C-like control structures
- Variables that persist across records`,
  sections: [
    {
      title: 'Patterns',
      content: `/regex/      Match lines containing regex
exp          Match if expression is true (non-zero/non-null)
BEGIN        Execute before any input
END          Execute after all input
pat1,pat2    Range pattern (from pat1 to pat2)`,
    },
    {
      title: 'Built-in Variables',
      content: `FS    Field separator (default: whitespace)
OFS   Output field separator (default: space)
RS    Input record separator (default: newline)
ORS   Output record separator (default: newline)
NF    Number of fields in current record
NR    Total number of records read
FNR   Number of records in current file
FILENAME  Name of current input file
ARGC  Number of command-line arguments
ARGV  Array of command-line arguments
ENVIRON   Array of environment variables
CONVFMT   Format for number-to-string (default: %.6g)
OFMT  Format for output numbers (default: %.6g)
SUBSEP    Subscript separator (default: \\034)`,
    },
    {
      title: 'String Functions',
      content: `gsub(r,s,t)    Global substitute regex r with s in t (or $0)
sub(r,s,t)     Substitute first occurrence
index(s,t)     Find position of t in s
length(s)      Return length of s
match(s,r)     Test if regex r matches in s
split(s,a,fs)  Split s into array a by fs
sprintf(fmt,...)  Format string
substr(s,i,n)  Return substring of s from i, length n
tolower(s)     Convert to lowercase
toupper(s)     Convert to uppercase`,
    },
    {
      title: 'Numeric Functions',
      content: `atan2(y,x)     Arctangent of y/x
exp(x)         Exponential of x
int(x)         Integer part of x
log(x)         Natural logarithm
rand()         Random number [0,1)
sin(x)         Sine of x (radians)
cos(x)         Cosine of x (radians)
sqrt(x)        Square root
srand([x])     Set random seed`,
    },
    {
      title: 'Control Statements',
      content: `if (cond) stmt [else stmt]
while (cond) stmt
do stmt while (cond)
for (init; cond; incr) stmt
for (var in array) stmt
break
continue
next        Skip to next record
exit [expr] Exit with optional status`,
    },
  ],
  examples: [
    { command: 'awk \'{ print $1 }\' file.txt', description: 'Print first column' },
    { command: 'awk -F: \'{ print $1 }\' /etc/passwd', description: 'Print usernames from passwd' },
    { command: 'awk \'/error/ { print NR": "$0 }\' log.txt', description: 'Print lines with "error" and line numbers' },
    { command: 'awk \'{ sum += $1 } END { print sum }\' numbers.txt', description: 'Sum first column' },
    { command: 'awk \'BEGIN { print "Header" } { print } END { print "Footer" }\'', description: 'Add header and footer' },
    { command: 'awk \'{ count[$1]++ } END { for (w in count) print w, count[w] }\'', description: 'Count occurrences' },
    { command: 'awk \'NF > 0 { print }\'', description: 'Remove blank lines' },
    { command: 'awk \'gsub(/old/, "new"); print\'', description: 'Replace text globally' },
  ],
};

export function getAwkManPage(): ManPageData {
  return awkManPage;
}
