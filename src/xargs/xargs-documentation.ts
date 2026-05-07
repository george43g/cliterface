/**
 * xargs documentation — man-page excerpts and pitfall descriptions.
 * BSD/macOS-accurate (Darwin xargs). GNU differences noted inline.
 */

export interface XargsFlag {
  flag: string;
  longFlag?: string;
  description: string;
  note?: string;
  example?: string;
}

export interface XargsPattern {
  name: string;
  command: string;
  description: string;
  tags: string[];
}

export interface XargsPitfall {
  title: string;
  problem: string;
  solution: string;
  example?: string;
}

export const XARGS_FLAGS: XargsFlag[] = [
  {
    flag: '-0',
    longFlag: '--null',
    description: 'Use NUL (\\0) as the input delimiter instead of whitespace/newlines. Pair with find -print0 or printf "%s\\0" to safely handle filenames with spaces.',
    example: "find . -name '*.log' -print0 | xargs -0 rm",
  },
  {
    flag: '-n N',
    longFlag: '--max-args=N',
    description: 'Pass at most N arguments per invocation of the utility. xargs batches stdin tokens into groups of N and calls the utility once per group.',
    example: 'echo a b c d e | xargs -n 2 echo',
    note: 'Default N is 5000 (BSD). Actual batch size may be smaller if -s limit is hit first.',
  },
  {
    flag: '-I replstr',
    description:
      "Replace occurrences of replstr in the utility's arguments with the entire stdin line. One invocation per line. Implies -x (exit on overflow) and one-line-at-a-time mode.",
    example: 'ls *.txt | xargs -I {} cp {} /backup/{}',
    note: 'BSD limit: 255 bytes per replacement by default (override with -S). GNU uses {} by default with find -exec style usage.',
  },
  {
    flag: '-P N',
    longFlag: '--max-procs=N',
    description: 'Run at most N invocations of the utility in parallel. If N is 0, run as many as possible.',
    example: 'cat urls.txt | xargs -P 4 -n 1 curl -O',
    note: 'BSD extension — not in POSIX. GNU xargs supports --max-procs.',
  },
  {
    flag: '-t',
    longFlag: '--verbose',
    description: 'Trace mode: echo each command to stderr before executing it. Useful for debugging pipelines.',
    example: 'echo foo bar | xargs -t echo',
  },
  {
    flag: '-p',
    longFlag: '--interactive',
    description:
      "Prompt mode: print each command and ask 'y/n' before running. Useful for destructive operations. Only works when stdin is a terminal — not useful in scripted pipelines.",
    example: 'ls *.bak | xargs -p rm',
    note: 'The utility will not run in non-interactive shells. Combine with -t for debugging without interactivity.',
  },
  {
    flag: '-L N',
    description: 'Call the utility for every N lines read from stdin. Useful when each logical record spans exactly N lines.',
    example: 'seq 1 9 | xargs -L 3 echo',
  },
  {
    flag: '-r',
    longFlag: '--no-run-if-empty',
    description: 'GNU compatibility: do not run the utility if stdin is empty. On macOS/BSD this flag is accepted but is a no-op — BSD xargs already skips empty input.',
    note: 'Matters primarily for scripts that need to run on both GNU/Linux and macOS.',
  },
  {
    flag: '-s SIZE',
    longFlag: '--max-chars=SIZE',
    description: 'Limit the command-line length (utility + args + environment) to SIZE bytes. Default is ARG_MAX - 4096.',
    example: 'find /etc -name "*.conf" | xargs -s 512 ls -la',
  },
  {
    flag: '-x',
    longFlag: '--exit',
    description: 'Exit immediately if a generated command line would exceed the -s size limit. Implied by -I.',
    note: 'Without -x, xargs splits the overflow args across multiple invocations.',
  },
  {
    flag: '-E eofstr',
    description: 'Treat eofstr as a logical EOF marker in stdin. Input reading stops when this string is encountered as a token.',
    example: 'echo "a b STOP c d" | xargs -E STOP echo',
  },
  {
    flag: '-J replstr',
    description:
      '(BSD-only) Like -I but inserts all accumulated stdin args at the position of replstr rather than one-per-line. Lets you control where stdin args appear in the command.',
    example: 'ls | xargs -J % cp -rp % /backup',
    note: 'Not available on GNU/Linux xargs.',
  },
];

export const XARGS_PATTERNS: XargsPattern[] = [
  {
    name: 'Delete files safely (NUL-separated)',
    command: "find . -name '*.tmp' -print0 | xargs -0 rm -f",
    description: 'find -print0 outputs NUL-terminated filenames; -0 tells xargs to split on NUL. This correctly handles filenames with spaces, tabs, or newlines.',
    tags: ['find', '-0', 'delete', 'safe'],
  },
  {
    name: 'Parallel downloads',
    command: 'cat urls.txt | xargs -P 8 -n 1 curl -O',
    description: 'Download up to 8 URLs concurrently. -n 1 ensures each curl call gets exactly one URL; -P 8 allows 8 parallel workers.',
    tags: ['parallel', '-P', '-n', 'curl'],
  },
  {
    name: 'Batch grep across files',
    command: "find . -name '*.ts' -print0 | xargs -0 grep -l 'TODO'",
    description: 'Search all TypeScript files for TODO comments. Using -print0 / -0 avoids problems with spaces in file paths.',
    tags: ['find', 'grep', '-0', 'search'],
  },
  {
    name: 'Copy files to a backup dir (-I {})',
    command: "find . -name '*.conf' | xargs -I {} cp {} /backup/{}",
    description: 'For each matching file, run one cp invocation. {} in the utility arguments is replaced by the full filename.',
    tags: ['-I', 'cp', 'backup'],
  },
  {
    name: 'Batch rename with suffix',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: shell parameter expansion syntax, not a JS template literal
    command: 'ls *.jpeg | xargs -I {} sh -c \'mv "$1" "${1%.jpeg}.jpg"\' _ {}',
    description: 'Rename .jpeg files to .jpg by invoking a subshell per file. The sh -c trick is necessary when you need shell expansions inside the utility command.',
    tags: ['-I', 'rename', 'shell'],
  },
  {
    name: 'Run commands in parallel on dirs',
    command: "ls -d /usr/local /opt /home | xargs -J % -P 2 -n 1 find % -name '*.log'",
    description: '(BSD) Searches two directories in parallel. -J % places the dir at the position of % in the command, -P 2 runs two find processes concurrently.',
    tags: ['-J', '-P', 'find', 'parallel', 'BSD'],
  },
  {
    name: 'Process every 3 lines as a group',
    command: 'seq 1 9 | xargs -L 3 echo',
    description: '-L 3 reads three lines at a time and passes them as a single invocation. Produces: "1 2 3", "4 5 6", "7 8 9".',
    tags: ['-L', 'batch'],
  },
  {
    name: 'Count lines per file (n=1)',
    command: "find . -name '*.ts' -print0 | xargs -0 -n 1 wc -l",
    description: 'Run wc -l once per file rather than passing all files at once, so each line count is labelled with its filename.',
    tags: ['-n', 'wc', 'count'],
  },
];

export const XARGS_PITFALLS: XargsPitfall[] = [
  {
    title: 'Whitespace in filenames breaks plain xargs',
    problem: 'By default xargs splits on spaces, tabs, and newlines. A filename like "my file.txt" becomes two separate arguments: "my" and "file.txt".',
    solution: 'Use find -print0 (outputs NUL-terminated names) together with xargs -0 (splits on NUL). NUL is the only character that cannot appear in a POSIX filename.',
    example: "# Broken:\nfind . -name '*.txt' | xargs rm\n\n# Safe:\nfind . -name '*.txt' -print0 | xargs -0 rm",
  },
  {
    title: 'Quoting does not protect you without -0',
    problem:
      'xargs performs its own tokenisation before passing args to the utility. Single and double quotes inside stdin input are interpreted by xargs, not the shell, and may produce surprising splits.',
    solution: 'Use -0 (NUL delimiter) to bypass xargs tokenisation entirely when processing file paths. For structured text data, validate your delimiter assumptions.',
    example: '# This will fail if any filename contains quotes:\nls | xargs echo\n\n# Use NUL delimiters:\nfind . -print0 | xargs -0 echo',
  },
  {
    title: '-p (prompt) does not work in scripts',
    problem:
      '-p echoes each command and asks y/n before running. When the process has no controlling terminal (e.g. in a CI pipeline or subshell), xargs cannot read the answer and skips all commands.',
    solution:
      'Use -p only interactively at the terminal. For dry-run / preview in scripts, use -t (trace to stderr) and redirect stderr to review the commands without running them.',
    example: '# Trace without actually executing:\necho a b c | xargs -t echo 2>&1 1>/dev/null',
  },
  {
    title: 'Command injection from untrusted input',
    problem:
      'If stdin comes from an untrusted source, the tokens it contains are passed directly as arguments to the utility. A token like "$(rm -rf /)" can be dangerous if the utility passes its arguments to eval or a shell.',
    solution:
      'Do not pipe untrusted user input into xargs + utilities that invoke a shell (sh -c, bash -c, eval). Prefer safer utilities that treat args as data, not code. When you must use a shell, use -- to terminate option parsing and validate/escape input beforehand.',
    example:
      "# Dangerous: attacker controls file.txt content\ncat file.txt | xargs sh -c 'process $1'\n\n# Safer: pass args as positional, not interpolated\ncat file.txt | xargs -I {} sh -c 'process \"$1\"' _ {}",
  },
  {
    title: 'ARG_MAX and large file lists',
    problem:
      'Every OS has a maximum command-line length (ARG_MAX). If the list of files is huge, a single xargs invocation may still fail with E2BIG, or xargs splits across many invocations (which is correct behaviour but can surprise you).',
    solution:
      'Use -s SIZE to control the maximum command-line length. Use -n N to control the maximum number of arguments per invocation. xargs splits automatically, but if you need each invocation to use all args, consider a different approach (e.g. find -exec ... +).',
    example: '# Limit to 50 args per echo call:\nseq 1 200 | xargs -n 50 echo',
  },
  {
    title: 'GNU vs BSD flag differences',
    problem:
      'Scripts written on macOS (BSD xargs) may fail on Linux (GNU xargs) and vice versa. Notable differences: -d DELIM exists only in GNU; -J replstr exists only in BSD; -r is a no-op on BSD; --no-run-if-empty exists only in GNU.',
    solution:
      'Use POSIX flags (-0, -n, -I, -L, -s, -t, -p) for maximum portability. If you need GNU-specific flags, install GNU findutils on macOS via Homebrew (brew install findutils, then use gxargs).',
    example: '# GNU only — will fail on macOS:\necho "a:b:c" | xargs -d : echo\n\n# Portable alternative:\necho "a:b:c" | tr ":" "\\n" | xargs echo',
  },
];
