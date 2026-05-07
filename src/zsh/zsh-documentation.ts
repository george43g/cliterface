// biome-ignore-all lint/suspicious/noTemplateCurlyInString: shell parameter expansion syntax is reference data, not template literals
export interface GlobExample {
  pattern: string;
  description: string;
  example?: string;
}

export interface GlobSection {
  title: string;
  description: string;
  patterns: GlobExample[];
}

export interface ParamExpansion {
  syntax: string;
  description: string;
  example?: string;
  result?: string;
}

export interface ParamSection {
  title: string;
  expansions: ParamExpansion[];
}

export interface PromptTheme {
  name: string;
  description: string;
  features: string[];
  preview: string;
}

export interface AliasSnippet {
  code: string;
  description: string;
  category: string;
}

// ── Globbing ───────────────────────────────────────────────────────────────

export const globSections: GlobSection[] = [
  {
    title: 'Basic Glob Patterns',
    description: 'Standard glob patterns supported in all shells.',
    patterns: [
      { pattern: '*', description: 'Match any string of characters (not leading dot)', example: '*.ts' },
      { pattern: '?', description: 'Match exactly one character', example: 'file?.txt' },
      { pattern: '[abc]', description: 'Match one character from set', example: '[abc]*.sh' },
      { pattern: '[a-z]', description: 'Match one character in range', example: '[0-9]*' },
      { pattern: '[^abc]', description: 'Match one character NOT in set', example: '[^.]*.conf' },
      { pattern: '**', description: 'Recursive glob — match any path (GLOB_STAR / extended_glob needed)', example: '**/*.ts' },
    ],
  },
  {
    title: 'Extended Glob (setopt EXTENDED_GLOB)',
    description: 'Enable with: setopt EXTENDED_GLOB  — or  setopt extendedglob',
    patterns: [
      { pattern: '*(pattern)', description: 'Zero or more occurrences of pattern', example: '*(ab)*.txt  — matches abaab.txt' },
      { pattern: '+(pattern)', description: 'One or more occurrences of pattern', example: '+(foo|bar).sh' },
      { pattern: '?(pattern)', description: 'Zero or one occurrence of pattern', example: '?(pre-)fix.conf' },
      { pattern: '@(pattern)', description: 'Exactly one occurrence of pattern', example: '@(jpg|png|gif)' },
      { pattern: '!(pattern)', description: 'Negate: anything NOT matching pattern', example: '!(*.min).js  — all non-minified JS' },
      { pattern: 'pat1|pat2', description: 'Alternation within (...)', example: '*(foo|bar)' },
      { pattern: '^pattern', description: 'Negate pattern (EXTENDED_GLOB)', example: 'ls ^*.log' },
      { pattern: '~pattern', description: 'Exclude: match left but not right', example: '*.*(~*.min.*)' },
    ],
  },
  {
    title: 'Glob Qualifiers',
    description: 'Append in parentheses after a glob to filter by file attributes: glob(qualifier)',
    patterns: [
      { pattern: 'glob(.)', description: 'Regular files only', example: '*(.)  — all regular files' },
      { pattern: 'glob(/)', description: 'Directories only', example: '*(/)  — all directories' },
      { pattern: 'glob(*)', description: 'Executable files', example: '*(*) — all executables' },
      { pattern: 'glob(@)', description: 'Symbolic links', example: '*(@) — all symlinks' },
      { pattern: 'glob(L+n)', description: 'Files larger than n bytes', example: '*(L+1M)' },
      { pattern: 'glob(Lm+5)', description: 'Files larger than 5 megabytes', example: '*(Lm+5)' },
      { pattern: 'glob(mh-1)', description: 'Modified within last hour', example: '*(mh-1) — recently changed' },
      { pattern: 'glob(md-7)', description: 'Modified within last 7 days', example: '*(md-7)' },
      { pattern: 'glob(om)', description: 'Order by modification time (newest first)', example: '*(om[1])  — newest file' },
      { pattern: 'glob(Om)', description: 'Order by modification time (oldest first)', example: '*(Om[1])  — oldest file' },
      { pattern: 'glob([1,5])', description: 'Take only elements 1 through 5', example: '*(om[1,5])  — 5 newest files' },
      { pattern: 'glob(u:name:)', description: 'Files owned by user', example: '*(u:george:)' },
      { pattern: 'glob(f:755:)', description: 'Files with mode 755', example: '*(f:644:)' },
      { pattern: 'glob(e:{test}:)', description: 'Evaluate shell code per file', example: "*(e:'[[ $REPLY -nt ref ]]':)" },
    ],
  },
  {
    title: 'Glob Flags',
    description: 'Flags placed inside the pattern to modify how matching works: (#flag)pattern',
    patterns: [
      { pattern: '(#i)pattern', description: 'Case-insensitive match', example: '(#i)*.jpg  — matches .JPG .Jpg etc.' },
      { pattern: '(#l)pattern', description: 'Lower-case in pattern matches any case', example: '(#l)readme.*' },
      { pattern: '(#I)pattern', description: 'Ignore locale — byte-level comparison', example: '(#I)data*' },
      { pattern: '(#s)pattern', description: 'Anchor at start of filename', example: '(#s)test*' },
      { pattern: '(#e)pattern', description: 'Anchor at end of filename', example: '*(#e).ts' },
      { pattern: '(#b)pattern', description: 'Activate backreferences in the pattern', example: '(#b)(foo)(*)  — $match[1] = "foo"' },
      { pattern: '(#m)pattern', description: 'Set $MATCH and $match on success', example: '(#m)[0-9]#' },
    ],
  },
];

// ── Parameter Expansion ────────────────────────────────────────────────────

export const paramSections: ParamSection[] = [
  {
    title: 'Defaults & Fallbacks',
    expansions: [
      { syntax: '${var:-default}', description: 'Use default if var is unset or empty', example: '${EDITOR:-vim}', result: 'vim if $EDITOR is empty' },
      { syntax: '${var:=default}', description: 'Assign and use default if var is unset or empty', example: '${TMPDIR:=/tmp}', result: 'sets $TMPDIR to /tmp if unset' },
      { syntax: '${var:+replacement}', description: 'Use replacement if var IS set (and non-empty)', example: '${DEBUG:+--verbose}', result: '"--verbose" only when $DEBUG set' },
      { syntax: '${var:?error msg}', description: 'Error and exit if var is unset or empty', example: '${1:?Usage: script name}', result: 'prints error and exits' },
      { syntax: '${var-default}', description: 'Use default only if var is unset (not just empty)', example: '${var-fallback}' },
      { syntax: '${var+replacement}', description: 'Use replacement if var IS set (even if empty)', example: '${var+set}' },
    ],
  },
  {
    title: 'String Length & Slicing',
    expansions: [
      { syntax: '${#var}', description: 'Length of string or number of elements in array', example: '${#HOME}', result: 'length of home path' },
      { syntax: '${var:offset}', description: 'Substring starting at offset (0-indexed)', example: '${PATH:0:10}', result: 'first 10 chars of PATH' },
      { syntax: '${var:offset:length}', description: 'Substring of given length starting at offset', example: '${str:5:3}' },
      { syntax: '${var: -n}', description: 'Last n characters (space before minus required)', example: '${str: -4}', result: 'last 4 chars' },
    ],
  },
  {
    title: 'Pattern Removal',
    expansions: [
      { syntax: '${var#pattern}', description: 'Remove shortest prefix matching pattern', example: '${file#*/}', result: 'removes first directory component' },
      { syntax: '${var##pattern}', description: 'Remove longest prefix matching pattern', example: '${file##*/}', result: 'removes all directories (basename)' },
      { syntax: '${var%pattern}', description: 'Remove shortest suffix matching pattern', example: '${file%.ts}', result: 'removes .ts extension' },
      { syntax: '${var%%pattern}', description: 'Remove longest suffix matching pattern', example: '${file%%.*}', result: 'removes all extensions' },
    ],
  },
  {
    title: 'Search & Replace',
    expansions: [
      { syntax: '${var/pattern/replacement}', description: 'Replace first occurrence of pattern', example: '${str/foo/bar}' },
      { syntax: '${var//pattern/replacement}', description: 'Replace all occurrences of pattern', example: '${PATH// /\\ }', result: 'escape spaces in PATH' },
      { syntax: '${var/#pattern/replacement}', description: 'Replace if pattern matches at start', example: '${str/#Hello/Hi}' },
      { syntax: '${var/%pattern/replacement}', description: 'Replace if pattern matches at end', example: '${file/%.js/.ts}' },
    ],
  },
  {
    title: 'Case Modification (zsh 5+)',
    expansions: [
      { syntax: '${var:u}', description: 'Convert to uppercase', example: '${name:u}', result: 'ALICE' },
      { syntax: '${var:l}', description: 'Convert to lowercase', example: '${NAME:l}', result: 'alice' },
      { syntax: '${(U)var}', description: 'Uppercase via parameter flag', example: '${(U)name}' },
      { syntax: '${(L)var}', description: 'Lowercase via parameter flag', example: '${(L)NAME}' },
      { syntax: '${(C)var}', description: 'Capitalize each word', example: '${(C)title}', result: 'Hello World' },
    ],
  },
  {
    title: 'Array Expansions',
    expansions: [
      { syntax: '${array[@]}', description: 'All array elements as separate words', example: 'for x in "${arr[@]}"; do ...' },
      { syntax: '${array[*]}', description: 'All elements as single word (IFS-joined)', example: '${arr[*]}' },
      { syntax: '${#array[@]}', description: 'Number of elements in array', example: '${#files[@]}' },
      { syntax: '${array[2,5]}', description: 'Elements 2 through 5 (1-indexed in zsh)', example: '${arr[2,4]}' },
      { syntax: '${(j:,:)array}', description: 'Join array with comma separator', example: '${(j:,:)list}', result: 'a,b,c' },
      { syntax: '${(s:,:)string}', description: 'Split string on comma into array', example: 'arr=(${(s:,:)csv})' },
      { syntax: '${(o)array}', description: 'Sort array elements', example: '${(o)files}' },
      { syntax: '${(u)array}', description: 'Unique elements (remove duplicates)', example: '${(u)items}' },
      { syntax: '${(f)string}', description: 'Split on newlines', example: 'lines=(${(f)$(cat file)})' },
    ],
  },
  {
    title: 'Useful Parameter Flags',
    expansions: [
      { syntax: '${(q)var}', description: 'Shell-quote the value', example: '${(q)file}', result: 'escapes spaces and special chars' },
      { syntax: '${(Q)var}', description: 'Remove one level of quoting', example: '${(Q)quoted}' },
      { syntax: '${(e)var}', description: 'Perform expansion on value', example: '${(e)template}' },
      { syntax: '${(P)var}', description: 'Indirect: expand var, then use result as variable name', example: '${(P)varname}' },
      { syntax: '${(k)assoc}', description: 'Keys of associative array', example: '${(k)mymap}' },
      { syntax: '${(v)assoc}', description: 'Values of associative array', example: '${(v)mymap}' },
      { syntax: '${(kv)assoc}', description: 'Keys and values interleaved', example: '${(kv)mymap}' },
    ],
  },
];

// ── Prompt Themes ─────────────────────────────────────────────────────────

export const promptThemes: PromptTheme[] = [
  {
    name: 'sorin',
    description: 'The default zprezto theme. Compact, informative, with git status and exit code.',
    features: ['Current directory (last 2 components)', 'Git branch + dirty indicator', 'Exit code (non-zero shown in red)', 'User@host in remote sessions'],
    preview: `george@mbp ~/dev/project  git:(main) ✗
❯ _`,
  },
  {
    name: 'pure',
    description: 'Minimal async theme (separate install: sindresorhus/pure). Fast, beautiful.',
    features: ['Async git status (no prompt lag)', 'Clean one-line prompt', 'Execution time for slow commands', 'Indicator turns red on error'],
    preview: `~/dev/project main ↑1
❯ _`,
  },
  {
    name: 'powerlevel10k',
    description: 'Feature-rich, highly configurable theme with powerline symbols (separate install).',
    features: ['Instant prompt startup', 'Configurable segments (run p10k configure)', 'Icon-rich display', 'Left + right prompt segments', 'Transient prompt'],
    preview: `  ~/dev  main ✔  node 20  python 3.11   15:30:00
❯ _`,
  },
  {
    name: 'minimal',
    description: 'Extremely simple — just a prompt character. For those who want zero distraction.',
    features: ['Single character prompt', 'Exit code indicator', 'Minimal footprint'],
    preview: `%
_`,
  },
  {
    name: 'nicoulaj',
    description: 'Two-line prompt with full path and time on the right.',
    features: ['Full current path', 'Right-prompt with time', 'Git info', 'Two-line layout'],
    preview: `/Users/george/dev/project                         [15:30]
→ _`,
  },
  {
    name: 'steeef',
    description: 'Colorful multi-line prompt with Python virtualenv support.',
    features: ['Color-coded user/host/path', 'Git branch and status', 'Python virtualenv', 'Multi-line layout'],
    preview: `george on mbp in ~/dev/project on main*
$ _`,
  },
];

// ── Aliases & Functions ───────────────────────────────────────────────────

export const aliasSnippets: AliasSnippet[] = [
  // Navigation
  { category: 'Navigation', code: "alias ..='cd ..'", description: 'Up one directory' },
  { category: 'Navigation', code: "alias ...='cd ../..'", description: 'Up two directories' },
  { category: 'Navigation', code: "alias ~='cd ~'", description: 'Go home' },
  { category: 'Navigation', code: "alias -- -='cd -'", description: 'Go back to previous directory' },
  // Files
  { category: 'Files', code: "alias ll='ls -lhF'", description: 'Detailed listing' },
  { category: 'Files', code: "alias la='ls -lAhF'", description: 'All files including hidden' },
  { category: 'Files', code: "alias lsd='ls -d */'", description: 'List directories only' },
  { category: 'Files', code: "alias cp='cp -iv'", description: 'Verbose, interactive copy' },
  { category: 'Files', code: "alias mv='mv -iv'", description: 'Verbose, interactive move' },
  { category: 'Files', code: "alias rm='rm -Iv'", description: 'Verbose, interactive remove' },
  { category: 'Files', code: "alias mkdir='mkdir -pv'", description: 'Make directories recursively, verbose' },
  // Development
  { category: 'Development', code: "alias g='git'", description: 'Git shorthand' },
  { category: 'Development', code: "alias gs='git status -sb'", description: 'Compact git status' },
  { category: 'Development', code: "alias glog='git log --oneline --graph --decorate'", description: 'Pretty git log' },
  { category: 'Development', code: "alias ni='npm install'", description: 'npm install' },
  { category: 'Development', code: "alias nr='npm run'", description: 'npm run' },
  { category: 'Development', code: "alias bi='bun install'", description: 'bun install' },
  // System
  { category: 'System', code: "alias ports='lsof -iTCP -sTCP:LISTEN -n -P'", description: 'Show open TCP ports' },
  { category: 'System', code: "alias myip='curl -s ifconfig.me'", description: 'Show public IP' },
  { category: 'System', code: "alias reload='source ~/.zshrc'", description: 'Reload zsh config' },
  { category: 'System', code: "alias hosts='sudo $EDITOR /etc/hosts'", description: 'Edit hosts file' },
  // Useful functions
  {
    category: 'Functions',
    code: `# Create directory and cd into it
mkd() { mkdir -p "$1" && cd "$1"; }`,
    description: 'mkd dirname — create and enter directory',
  },
  {
    category: 'Functions',
    code: `# Extract any archive format
extract() {
  case "$1" in
    *.tar.bz2) tar xjf "$1" ;;
    *.tar.gz)  tar xzf "$1" ;;
    *.tar.xz)  tar xJf "$1" ;;
    *.zip)     unzip "$1" ;;
    *.7z)      7z x "$1" ;;
    *.gz)      gunzip "$1" ;;
    *)         echo "Unknown format: $1" ;;
  esac
}`,
    description: 'extract file — smart extraction for any archive',
  },
  {
    category: 'Functions',
    code: `# Quick find
f() { find . -name "*$1*" 2>/dev/null; }`,
    description: 'f pattern — find files by name pattern',
  },
  {
    category: 'Functions',
    code: `# Show PATH entries one per line
path() { echo "$PATH" | tr ':' '\\n'; }`,
    description: 'path — print PATH entries on separate lines',
  },
  {
    category: 'Functions',
    code: `# Git clone and cd
gclone() { git clone "$1" && cd "$(basename "$1" .git)"; }`,
    description: 'gclone url — clone repo and enter directory',
  },
  {
    category: 'Functions',
    code: `# Find and kill process by name
killnamed() { kill $(pgrep -f "$1"); }`,
    description: 'killnamed pattern — kill process by name pattern',
  },
];
