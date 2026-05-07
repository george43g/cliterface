/**
 * Static documentation for bash test expressions.
 * All content is derived from `man bash` (CONDITIONAL EXPRESSIONS section)
 * and `man test` (POSIX).
 */

export interface DocSection {
  title: string;
  content: string;
  examples?: { expr: string; note: string }[];
}

export interface DocTab {
  id: string;
  heading: string;
  intro: string;
  sections: DocSection[];
}

// ── String Tests ──────────────────────────────────────────────────────────

export const STRING_DOC: DocTab = {
  id: 'string',
  heading: 'String Tests',
  intro:
    'String tests evaluate string properties: emptiness, equality, lexical ordering, and regex matching. ' +
    'The double-bracket [[ ]] form is more forgiving (no word-splitting, native < / >), while [ ] and test require careful quoting.',
  sections: [
    {
      title: 'Emptiness',
      content:
        '-z STRING   True if STRING is zero length (empty).\n' +
        '-n STRING   True if STRING is non-zero length (non-empty).\n\n' +
        'Tip: In [ ] always quote the variable: [ -z "$var" ]\n' +
        '     In [[ ]] quoting is optional but still good practice.',
      examples: [
        { expr: '[ -z "$name" ]', note: 'true when $name is empty' },
        { expr: '[[ -n $name ]]', note: 'true when $name is non-empty' },
      ],
    },
    {
      title: 'Equality',
      content:
        'STRING = STRING    POSIX equality; works in [ ] and [[ ]].\n' +
        'STRING == STRING   Same as =.  In [[ ]] the right side is a GLOB pattern.\n' +
        'STRING != STRING   True if strings differ.\n\n' +
        'Pitfall: In [ ] do NOT use == for POSIX portability; use = instead.\n' +
        'Pitfall: In [[ ]] unquoted *, ?, [...] on the right expand as globs.',
      examples: [
        { expr: '[ "$a" = "$b" ]', note: 'POSIX equality' },
        { expr: '[[ $file == *.txt ]]', note: 'glob match — file ends in .txt' },
        { expr: '[[ "$x" != "skip" ]]', note: 'true when x is not "skip"' },
      ],
    },
    {
      title: 'Lexical Ordering (Bash [[ ]] only)',
      content:
        'STRING < STRING   True if left sorts before right (dictionary order).\n' +
        'STRING > STRING   True if left sorts after right.\n\n' +
        'In [ ] these must be escaped as \\< and \\>, which is confusing and\n' +
        'rarely portable — prefer [[ ]] for lexical comparisons.',
      examples: [
        { expr: '[[ "apple" < "banana" ]]', note: 'true (a before b)' },
        { expr: '[[ "z" > "a" ]]', note: 'true' },
        { expr: '[ "a" \\< "b" ]', note: 'works but error-prone in [ ]' },
      ],
    },
    {
      title: 'Regex Match (Bash [[ ]] only)',
      content:
        'STRING =~ PATTERN   True if STRING matches the extended regular expression PATTERN.\n\n' +
        'Rules:\n' +
        '• Do NOT quote the pattern — quoting forces literal string match.\n' +
        // Using '\x24' for '$' to prevent the linter from treating ${...} as a template placeholder
        '• Captured groups are stored in \x24{BASH_REMATCH[@]}.\n' +
        '• \x24{BASH_REMATCH[0]} = full match, [1]…[n] = capture groups.',
      examples: [
        { expr: '[[ "$email" =~ ^[^@]+@[^@]+\\.[^@]+$ ]]', note: 'basic email check' },
        { expr: '[[ "$ver" =~ ^([0-9]+)\\.([0-9]+) ]]', note: 'capture major.minor; groups in \x24{BASH_REMATCH[1]} and [2]' },
      ],
    },
  ],
};

// ── Numeric Tests ─────────────────────────────────────────────────────────

export const NUMERIC_DOC: DocTab = {
  id: 'numeric',
  heading: 'Numeric Tests',
  intro:
    'Bash provides two styles of integer comparison: the -eq / -ne / -lt / -le / -gt / -ge flags usable in ' +
    '[ ] and [[ ]], and the arithmetic operators ==, !=, <, >, <=, >= available inside (( )).',
  sections: [
    {
      title: 'Flags (-eq, -ne, -lt, -le, -gt, -ge)',
      content:
        'INT1 -eq INT2   True if INT1 equals INT2.\n' +
        'INT1 -ne INT2   True if INT1 is not equal to INT2.\n' +
        'INT1 -lt INT2   True if INT1 is less than INT2.\n' +
        'INT1 -le INT2   True if INT1 is less than or equal to INT2.\n' +
        'INT1 -gt INT2   True if INT1 is greater than INT2.\n' +
        'INT1 -ge INT2   True if INT1 is greater than or equal to INT2.\n\n' +
        'These only work with integers. For floats use awk or bc.',
      examples: [
        { expr: '[ "$count" -gt 0 ]', note: 'true when count > 0' },
        { expr: '[[ $rc -ne 0 ]]', note: 'true when return code is non-zero' },
      ],
    },
    {
      title: 'Arithmetic Context (( ))',
      content:
        '(( INT1 == INT2 ))   Equal\n' +
        '(( INT1 != INT2 ))   Not equal\n' +
        '(( INT1 < INT2  ))   Less than\n' +
        '(( INT1 > INT2  ))   Greater than\n' +
        '(( INT1 <= INT2 ))   Less than or equal\n' +
        '(( INT1 >= INT2 ))   Greater than or equal\n\n' +
        'Inside (( )) you can use natural C-style arithmetic: no $ needed on\n' +
        'simple variable names, no quoting required, and the familiar operators apply.',
      examples: [
        { expr: '(( x == 42 ))', note: 'true when x equals 42' },
        { expr: '(( attempts >= max ))', note: 'true when attempts >= max' },
        { expr: '(( (a + b) > c ))', note: 'arithmetic expression inside test' },
      ],
    },
    {
      title: 'Pitfalls',
      content:
        '• Never use < or > inside [ ] for numbers — they are I/O redirections!\n' +
        '  Use -lt and -gt instead.\n' +
        '• "Numeric" flags do integer-only comparison.  Non-integer strings produce\n' +
        '  a "integer expression expected" error.\n' +
        '• (( )) returns exit code 0 when the arithmetic result is non-zero (true),\n' +
        '  and exit code 1 when the result is 0 (false).  A side-effect of using\n' +
        '  set -e: `(( n++ ))` can exit the script when n was 0.',
      examples: [],
    },
  ],
};

// ── File Tests ────────────────────────────────────────────────────────────

export const FILE_DOC: DocTab = {
  id: 'file',
  heading: 'File Tests',
  intro:
    'File test operators check file existence, type, permissions, and relative age. ' +
    'All work in [ ], [[ ]], and test. The path is NOT expanded for globs — pass a specific path.',
  sections: [
    {
      title: 'Existence & Type',
      content:
        '-e FILE   True if FILE exists (any type).\n' +
        '-f FILE   True if FILE is a regular file.\n' +
        '-d FILE   True if FILE is a directory.\n' +
        '-L FILE   True if FILE is a symbolic link.\n' +
        '-p FILE   True if FILE is a named pipe (FIFO).\n' +
        '-S FILE   True if FILE is a socket.\n' +
        '-b FILE   True if FILE is a block special file.\n' +
        '-c FILE   True if FILE is a character special file.',
      examples: [
        { expr: '[ -f /etc/hosts ]', note: 'true if /etc/hosts is a regular file' },
        { expr: '[[ -d "$HOME/.config" ]]', note: 'true if directory exists' },
        { expr: '[ -L /usr/bin/python3 ]', note: 'true if it is a symlink' },
      ],
    },
    {
      title: 'Permissions',
      content:
        '-r FILE   True if FILE is readable by the current process.\n' +
        '-w FILE   True if FILE is writable by the current process.\n' +
        '-x FILE   True if FILE is executable (or directory is searchable).\n' +
        '-u FILE   True if the setuid bit is set on FILE.\n' +
        '-g FILE   True if the setgid bit is set on FILE.\n' +
        '-k FILE   True if the sticky bit is set on FILE.',
      examples: [
        { expr: '[ -r "$config" ]', note: 'true if config is readable' },
        { expr: '[[ -x /usr/local/bin/myapp ]]', note: 'true if binary is executable' },
      ],
    },
    {
      title: 'Size',
      content: '-s FILE   True if FILE exists and has a size greater than zero.\n\n' + 'There is no built-in flag for "size equals N bytes"; use stat or wc -c.',
      examples: [{ expr: '[ -s logfile.txt ]', note: 'true if logfile is non-empty' }],
    },
    {
      title: 'Relative Age & Identity',
      content:
        'FILE1 -nt FILE2   True if FILE1 is newer (more recent mtime) than FILE2.\n' +
        'FILE1 -ot FILE2   True if FILE1 is older (less recent mtime) than FILE2.\n' +
        'FILE1 -ef FILE2   True if FILE1 and FILE2 refer to the same inode\n' +
        '                   (same device number and inode number).',
      examples: [
        { expr: '[ build.o -nt source.c ]', note: 'true if object is newer than source' },
        { expr: '[[ /etc/alternatives/python -ef /usr/bin/python3 ]]', note: 'true if they are the same file' },
      ],
    },
  ],
};

// ── Logical Operators ────────────────────────────────────────────────────

export const LOGICAL_DOC: DocTab = {
  id: 'logical',
  heading: 'Logical Operators',
  intro: 'Combine multiple tests with logical operators. The recommended approach differs by shell form.',
  sections: [
    {
      title: '! (NOT)',
      content: '! EXPR   Negates the truth value of EXPR.\n' + 'Works inside [ ], [[ ]], and test.',
      examples: [
        { expr: '[ ! -f /tmp/lockfile ]', note: 'true if lockfile does NOT exist' },
        { expr: '[[ ! -z "$name" ]]', note: 'true if name is non-empty (same as -n)' },
      ],
    },
    {
      title: '&& and || in [[ ]] and the shell',
      content:
        '[[ EXPR1 && EXPR2 ]]   Both must be true (short-circuit).\n' +
        '[[ EXPR1 || EXPR2 ]]   At least one must be true (short-circuit).\n\n' +
        'Equivalent shell-level syntax (works with any command, not just [ ]):\n' +
        '  [ cond1 ] && [ cond2 ]\n' +
        '  [ cond1 ] || [ cond2 ]\n\n' +
        'The shell-level && / || form is preferred for readability and portability.',
      examples: [
        { expr: '[[ -f "$f" && -r "$f" ]]', note: 'file exists AND is readable' },
        { expr: '[ -z "$a" ] || [ -z "$b" ]', note: 'either a or b is empty' },
      ],
    },
    {
      title: '-a and -o in [ ] (POSIX-deprecated)',
      content:
        'EXPR1 -a EXPR2   AND inside a single [ ].  POSIX marks as deprecated.\n' +
        'EXPR1 -o EXPR2   OR inside a single [ ].   POSIX marks as deprecated.\n\n' +
        'These operators can produce ambiguous parsing when combined with !\n' +
        'and parentheses. Use && / || at the shell level instead.',
      examples: [{ expr: '[ -f "$f" -a -r "$f" ]', note: 'works but discouraged' }],
    },
  ],
};

// ── [[ vs [ vs (( )) comparison ──────────────────────────────────────────

export const COMPARISON_DOC: DocTab = {
  id: 'comparison',
  heading: '[[ vs [ vs (( ))',
  intro: 'Choosing the right test construct is one of the most impactful shell-scripting decisions. ' + 'Here is a side-by-side comparison of the three forms.',
  sections: [
    {
      title: 'Quick Comparison Table',
      content:
        'Feature                    [[ ]]          [ ]           (( ))\n' +
        '─────────────────────────────────────────────────────────────\n' +
        'POSIX portable             No             Yes           No\n' +
        'Word splitting on vars     No             Yes*          No\n' +
        'Glob expansion on vars     No             Yes*          No\n' +
        'Requires quoting vars      Optional       Required      No\n' +
        'Short-circuit && / ||      Yes (inside)   Shell-level   N/A\n' +
        'Regex match (=~)           Yes            No            No\n' +
        'Glob match (==)            Yes            No            No\n' +
        'Lexical < / >              Yes            Escape \\< \\>  No\n' +
        'Arithmetic < > == !=       Via -lt etc    Via -lt etc   Yes (native)\n' +
        'Pipefail safe              Yes            Yes           Careful*\n\n' +
        '* In [ ], always quote "$var".  In (( )), (( n++ )) returns 1 (false)\n' +
        '  when n was 0, which exits under set -e.',
      examples: [],
    },
    {
      title: 'When to use [[ ]]',
      content:
        '• Your script targets bash, ksh, or zsh only (not /bin/sh).\n' +
        '• You need =~ regex matching.\n' +
        '• You need glob matching on the right of ==.\n' +
        '• You want natural && / || inside the test without shell-level chaining.\n' +
        '• You want to avoid quoting variables (safer by default).',
      examples: [
        { expr: '[[ $str =~ ^[0-9]+$ ]]', note: 'is $str all digits?' },
        { expr: '[[ $file == *.log && -s $file ]]', note: 'is a non-empty .log file' },
      ],
    },
    {
      title: 'When to use [ ] / test',
      content:
        '• Your shebang is #!/bin/sh and you need strict POSIX portability.\n' +
        '• The script may run on systems where bash is not available.\n' +
        '• Rule: always double-quote every variable: [ "$var" = "value" ].',
      examples: [
        { expr: '[ -f "$file" ]', note: 'portable file existence check' },
        { expr: 'test -n "$var"', note: 'same as [ -n "$var" ]' },
      ],
    },
    {
      title: 'When to use (( ))',
      content: '• Pure integer arithmetic comparisons.\n' + '• Increment/decrement counters: (( count++ )).\n' + '• You prefer C-style operators without flag syntax.',
      examples: [
        { expr: '(( retries < max_retries ))', note: 'loop condition' },
        { expr: '(( $(wc -l < file) > 100 ))', note: 'file has > 100 lines' },
      ],
    },
  ],
};

export const ALL_DOC_TABS: DocTab[] = [STRING_DOC, NUMERIC_DOC, FILE_DOC, LOGICAL_DOC, COMPARISON_DOC];
