export type TabId = 'listing' | 'fileops' | 'text' | 'search' | 'pipelines' | 'process' | 'datetime' | 'compression';

export interface FlagChip {
  flag: string;
  desc: string;
}

export interface ToolEntry {
  cmd: string;
  desc: string;
  example: string;
  flags?: FlagChip[];
  destructive?: boolean;
  warning?: string;
}

export interface TabDefinition {
  id: TabId;
  label: string;
  tools: ToolEntry[];
}

export const POSIX_TABS: TabDefinition[] = [
  {
    id: 'listing',
    label: 'File Listing',
    tools: [
      {
        cmd: 'ls',
        desc: 'List directory contents',
        example: 'ls -lah /tmp',
        flags: [
          { flag: '-l', desc: 'Long format (permissions, size, date)' },
          { flag: '-a', desc: 'Show hidden files (dotfiles)' },
          { flag: '-h', desc: 'Human-readable sizes (K, M, G)' },
          { flag: '-t', desc: 'Sort by modification time (newest first)' },
          { flag: '-S', desc: 'Sort by file size (largest first)' },
          { flag: '-1', desc: 'One file per line' },
          { flag: '-F', desc: 'Append type indicator (/, *, @, |)' },
          { flag: '-R', desc: 'Recursive — list subdirectories' },
          { flag: '--color', desc: 'Colorize output by file type' },
        ],
      },
      {
        cmd: 'stat',
        desc: 'Display file or filesystem status',
        example: 'stat myfile.txt',
        flags: [],
      },
      {
        cmd: 'file',
        desc: 'Determine file type by magic bytes',
        example: 'file unknown.bin',
        flags: [],
      },
      {
        cmd: 'du',
        desc: 'Estimate file/directory disk usage',
        example: 'du -sh *',
        flags: [
          { flag: '-h', desc: 'Human-readable sizes' },
          { flag: '-s', desc: 'Summarize: display only total for each argument' },
          { flag: '-a', desc: 'Show sizes for all files, not just directories' },
          { flag: '--max-depth=N', desc: 'Limit directory depth' },
        ],
      },
      {
        cmd: 'df',
        desc: 'Report filesystem disk space usage',
        example: 'df -h',
        flags: [
          { flag: '-h', desc: 'Human-readable sizes' },
          { flag: '-T', desc: 'Show filesystem type' },
        ],
      },
      {
        cmd: 'wc',
        desc: 'Count lines, words, and bytes in a file',
        example: 'wc -l file.txt',
        flags: [
          { flag: '-l', desc: 'Count lines only' },
          { flag: '-w', desc: 'Count words only' },
          { flag: '-c', desc: 'Count bytes only' },
          { flag: '-m', desc: 'Count characters (multibyte-aware)' },
        ],
      },
    ],
  },
  {
    id: 'fileops',
    label: 'File Ops',
    tools: [
      {
        cmd: 'cp',
        desc: 'Copy files and directories',
        example: 'cp -rp src/ dest/',
        flags: [
          { flag: '-r', desc: 'Recursive — copy directories' },
          { flag: '-i', desc: 'Interactive — prompt before overwrite' },
          { flag: '-p', desc: 'Preserve timestamps, permissions, ownership' },
          { flag: '-a', desc: 'Archive mode (equals -dpR): preserves everything' },
        ],
      },
      {
        cmd: 'mv',
        desc: 'Move or rename files',
        example: 'mv -i old.txt new.txt',
        flags: [{ flag: '-i', desc: 'Interactive — prompt before overwrite' }],
        warning: 'Overwrites destination without -i',
      },
      {
        cmd: 'rm',
        desc: 'Remove files or directories',
        example: 'rm -i file.txt',
        flags: [
          { flag: '-r', desc: 'Recursive — remove directories and their contents' },
          { flag: '-f', desc: 'Force — ignore nonexistent files, never prompt' },
          { flag: '-i', desc: 'Interactive — prompt before every removal (safe!)' },
        ],
        destructive: true,
        warning: 'Permanent — no recycle bin. Use -i for safety.',
      },
      {
        cmd: 'mkdir',
        desc: 'Create directories',
        example: 'mkdir -p a/b/c',
        flags: [{ flag: '-p', desc: 'Create parent directories as needed (no error if exists)' }],
      },
      {
        cmd: 'rmdir',
        desc: 'Remove empty directories',
        example: 'rmdir emptydir/',
        flags: [],
        warning: 'Only works on empty directories',
      },
      {
        cmd: 'touch',
        desc: 'Create empty file or update timestamps',
        example: 'touch newfile.txt',
        flags: [],
      },
      {
        cmd: 'chmod',
        desc: 'Change file mode (permissions)',
        example: 'chmod 755 script.sh',
        flags: [{ flag: '-R', desc: 'Recursive — apply to directories and contents' }],
      },
      {
        cmd: 'chown',
        desc: 'Change file owner and group',
        example: 'chown user:group file',
        flags: [{ flag: '-R', desc: 'Recursive — apply to directories and contents' }],
      },
      {
        cmd: 'umask',
        desc: 'Display or set the file creation mask',
        example: 'umask 022',
        flags: [],
      },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    tools: [
      {
        cmd: 'cat',
        desc: 'Concatenate and print files',
        example: 'cat -n file.txt',
        flags: [
          { flag: '-n', desc: 'Number all output lines' },
          { flag: '-A', desc: 'Show non-printing characters (tabs, EOL)' },
          { flag: '-s', desc: 'Squeeze blank: suppress repeated blank lines' },
        ],
      },
      {
        cmd: 'head',
        desc: 'Output the first N lines of a file',
        example: 'head -n 20 file.txt',
        flags: [
          { flag: '-n N', desc: 'Print first N lines (default: 10)' },
          { flag: '-c N', desc: 'Print first N bytes' },
        ],
      },
      {
        cmd: 'tail',
        desc: 'Output the last N lines of a file',
        example: 'tail -f /var/log/syslog',
        flags: [
          { flag: '-n N', desc: 'Print last N lines (default: 10)' },
          { flag: '-f', desc: 'Follow: keep reading as file grows (log watching)' },
          { flag: '-F', desc: 'Follow with retry if file disappears' },
        ],
      },
      {
        cmd: 'cut',
        desc: 'Remove sections from each line of a file',
        example: "cut -d',' -f1,3 data.csv",
        flags: [
          { flag: '-d DELIM', desc: 'Use DELIM as field delimiter (default: tab)' },
          { flag: '-f LIST', desc: 'Select fields (e.g. 1,3 or 2-5)' },
          { flag: '-c LIST', desc: 'Select character positions' },
        ],
      },
      {
        cmd: 'tr',
        desc: 'Translate or delete characters',
        example: "echo 'hello' | tr 'a-z' 'A-Z'",
        flags: [
          { flag: '-d SET', desc: 'Delete characters in SET' },
          { flag: '-s SET', desc: 'Squeeze repeated characters in SET' },
          { flag: '-c SET', desc: 'Complement: operate on chars NOT in SET' },
        ],
      },
      {
        cmd: 'sort',
        desc: 'Sort lines of text',
        example: 'sort -rn numbers.txt',
        flags: [
          { flag: '-n', desc: 'Numeric sort (not lexicographic)' },
          { flag: '-r', desc: 'Reverse sort order' },
          { flag: '-u', desc: 'Unique: discard duplicate lines' },
          { flag: '-k N', desc: 'Sort by Nth field (column)' },
          { flag: '-t CHAR', desc: 'Use CHAR as field separator' },
        ],
      },
      {
        cmd: 'uniq',
        desc: 'Report or filter repeated adjacent lines',
        example: 'sort file.txt | uniq -c',
        flags: [
          { flag: '-c', desc: 'Count occurrences of each line' },
          { flag: '-d', desc: 'Only print duplicate lines' },
          { flag: '-u', desc: 'Only print unique (non-repeated) lines' },
          { flag: '-i', desc: 'Case-insensitive comparison' },
        ],
      },
      {
        cmd: 'paste',
        desc: 'Merge lines of files side by side',
        example: 'paste -d"," names.txt ages.txt',
        flags: [
          { flag: '-d DELIM', desc: 'Use DELIM as field delimiter (default: tab)' },
          { flag: '-s', desc: 'Serial: join lines within each file instead' },
        ],
      },
      {
        cmd: 'nl',
        desc: 'Number lines of a file',
        example: 'nl -ba file.txt',
        flags: [
          { flag: '-ba', desc: 'Number all lines (including blank)' },
          { flag: '-v N', desc: 'Set starting line number to N' },
        ],
      },
      {
        cmd: 'fold',
        desc: 'Wrap long lines at a width',
        example: 'fold -w 80 -s longfile.txt',
        flags: [
          { flag: '-w N', desc: 'Wrap at N columns (default: 80)' },
          { flag: '-s', desc: 'Break at spaces, not mid-word' },
        ],
      },
      {
        cmd: 'tac',
        desc: 'Concatenate and print files in reverse',
        example: 'tac file.txt',
        flags: [],
      },
      {
        cmd: 'expand',
        desc: 'Convert tabs to spaces',
        example: 'expand -t 4 file.py',
        flags: [{ flag: '-t N', desc: 'Set tab width to N (default: 8)' }],
      },
      {
        cmd: 'unexpand',
        desc: 'Convert spaces to tabs',
        example: 'unexpand -a file.txt',
        flags: [
          { flag: '-a', desc: 'Convert all sequences (not just leading)' },
          { flag: '-t N', desc: 'Set tab width to N' },
        ],
      },
    ],
  },
  {
    id: 'search',
    label: 'Search',
    tools: [
      {
        cmd: 'grep',
        desc: 'Search for patterns in files',
        example: 'grep -rn "TODO" src/',
        flags: [
          { flag: '-E', desc: 'Extended regex (enables +, ?, |, {})' },
          { flag: '-r', desc: 'Recursive — search subdirectories' },
          { flag: '-n', desc: 'Show line numbers in output' },
          { flag: '-i', desc: 'Case-insensitive matching' },
          { flag: '-v', desc: 'Invert match: show non-matching lines' },
          { flag: '-l', desc: 'List only filenames with matches' },
          { flag: '-c', desc: 'Count matching lines (not print them)' },
          { flag: '--include=GLOB', desc: 'Only search files matching GLOB' },
        ],
      },
      {
        cmd: 'find',
        desc: 'Search for files in a directory hierarchy',
        example: 'find . -name "*.ts" -type f',
        flags: [
          { flag: '-name PATTERN', desc: 'Match filename (case-sensitive)' },
          { flag: '-iname PATTERN', desc: 'Match filename (case-insensitive)' },
          { flag: '-type f', desc: 'Match regular files only' },
          { flag: '-type d', desc: 'Match directories only' },
          { flag: '-type l', desc: 'Match symbolic links only' },
          { flag: '-mtime N', desc: 'Modified N*24h ago (+N = older, -N = newer)' },
          { flag: '-size N', desc: 'Match files by size (c=bytes, k=KB, M=MB)' },
          { flag: '-exec CMD {} \\;', desc: 'Execute CMD on each match' },
          { flag: '-print0', desc: 'Null-terminate output (safe for xargs -0)' },
          { flag: '-maxdepth N', desc: 'Limit directory recursion depth to N' },
        ],
      },
    ],
  },
  {
    id: 'pipelines',
    label: 'Pipelines',
    tools: [
      {
        cmd: '|',
        desc: 'Pipe: send stdout of left to stdin of right',
        example: 'ls -la | grep ".ts" | wc -l',
        flags: [],
      },
      {
        cmd: '>',
        desc: 'Redirect stdout to file (overwrite)',
        example: 'echo "hello" > out.txt',
        flags: [],
        warning: 'Overwrites destination file without warning',
      },
      {
        cmd: '>>',
        desc: 'Redirect stdout to file (append)',
        example: 'echo "more" >> out.txt',
        flags: [],
      },
      {
        cmd: '<',
        desc: 'Redirect file to stdin',
        example: 'sort < unsorted.txt',
        flags: [],
      },
      {
        cmd: '2>',
        desc: 'Redirect stderr to file',
        example: 'cmd 2> errors.log',
        flags: [],
      },
      {
        cmd: '&>',
        desc: 'Redirect both stdout and stderr to file',
        example: 'cmd &> all-output.log',
        flags: [],
      },
      {
        cmd: '&&',
        desc: 'Run next command only if previous succeeded (exit 0)',
        example: 'mkdir dir && cd dir',
        flags: [],
      },
      {
        cmd: '||',
        desc: 'Run next command only if previous failed (exit non-0)',
        example: 'ping -c1 host || echo "offline"',
        flags: [],
      },
      {
        cmd: ';',
        desc: 'Run next command regardless of previous exit code',
        example: 'make; make install',
        flags: [],
      },
      {
        cmd: '$()',
        desc: 'Command substitution: embed output of command',
        example: 'echo "Today is $(date +%F)"',
        flags: [],
      },
    ],
  },
  {
    id: 'process',
    label: 'Process',
    tools: [
      {
        cmd: 'kill',
        desc: 'Send a signal to a process by PID',
        example: 'kill -15 1234',
        flags: [
          { flag: '-9  (SIGKILL)', desc: 'Force kill — process cannot ignore or catch' },
          { flag: '-15 (SIGTERM)', desc: 'Graceful terminate — process can clean up (default)' },
          { flag: '-HUP (SIGHUP)', desc: 'Hangup — reloads config for many daemons' },
          { flag: '-l', desc: 'List all signal names and numbers' },
        ],
        warning: 'SIGKILL (-9) may leave temp files or corrupt state',
      },
      {
        cmd: 'nohup',
        desc: 'Run a command immune to hangups, output to nohup.out',
        example: 'nohup ./server &',
        flags: [],
      },
      {
        cmd: 'time',
        desc: 'Measure elapsed time of a command',
        example: 'time find / -name "*.log"',
        flags: [],
      },
      {
        cmd: 'which',
        desc: 'Locate a command in PATH',
        example: 'which python3',
        flags: [],
      },
      {
        cmd: 'type',
        desc: 'Show how a name would be interpreted (builtin/alias/file)',
        example: 'type ls',
        flags: [],
      },
      {
        cmd: 'command',
        desc: 'Run a command bypassing shell aliases/functions',
        example: 'command ls',
        flags: [],
      },
      {
        cmd: 'env',
        desc: 'Print environment variables or run with custom env',
        example: 'env DEBUG=1 node app.js',
        flags: [],
      },
    ],
  },
  {
    id: 'datetime',
    label: 'Date/Time',
    tools: [
      {
        cmd: 'date',
        desc: 'Print or set the system date and time',
        example: "date '+%Y-%m-%d %H:%M:%S'",
        flags: [
          { flag: '+%Y', desc: 'Four-digit year (e.g. 2026)' },
          { flag: '+%m', desc: 'Month as two digits (01–12)' },
          { flag: '+%d', desc: 'Day of month as two digits' },
          { flag: '+%H:%M:%S', desc: 'Time in 24h format' },
          { flag: '+%F', desc: 'ISO date: equivalent to %Y-%m-%d' },
          { flag: '+%s', desc: 'Unix epoch seconds' },
          { flag: '+%A', desc: 'Full weekday name (e.g. Wednesday)' },
          { flag: '+%Z', desc: 'Timezone abbreviation (e.g. UTC, EST)' },
          { flag: '-d "STRING"', desc: 'Parse and display a date string (GNU date)' },
        ],
      },
      {
        cmd: 'sleep',
        desc: 'Pause execution for a specified duration',
        example: 'sleep 5 && echo "done"',
        flags: [
          { flag: 'N (seconds)', desc: 'Sleep for N seconds' },
          { flag: 'Nm', desc: 'Sleep for N minutes (GNU sleep)' },
          { flag: 'Nh', desc: 'Sleep for N hours (GNU sleep)' },
        ],
      },
    ],
  },
  {
    id: 'compression',
    label: 'Compression',
    tools: [
      {
        cmd: 'tar',
        desc: 'Archive files (create, extract, or list)',
        example: 'tar -cvzf archive.tar.gz ./dir/',
        flags: [
          { flag: '-c', desc: 'Create a new archive' },
          { flag: '-x', desc: 'Extract files from archive' },
          { flag: '-t', desc: 'List archive contents without extracting' },
          { flag: '-v', desc: 'Verbose: print each file processed' },
          { flag: '-f FILE', desc: 'Specify archive filename' },
          { flag: '-z', desc: 'Filter through gzip (.tar.gz)' },
          { flag: '-j', desc: 'Filter through bzip2 (.tar.bz2)' },
          { flag: '-J', desc: 'Filter through xz (.tar.xz)' },
          { flag: '-C DIR', desc: 'Change to DIR before extracting' },
        ],
      },
      {
        cmd: 'gzip',
        desc: 'Compress or decompress files (replaces original)',
        example: 'gzip -k bigfile.log',
        flags: [
          { flag: '-d', desc: 'Decompress (equivalent to gunzip)' },
          { flag: '-k', desc: 'Keep original file (GNU extension)' },
          { flag: '-1 to -9', desc: 'Compression level (1=fast, 9=best)' },
          { flag: '-l', desc: 'List compressed file info' },
        ],
      },
      {
        cmd: 'gunzip',
        desc: 'Decompress .gz files (alias for gzip -d)',
        example: 'gunzip archive.gz',
        flags: [],
      },
      {
        cmd: 'zip',
        desc: 'Package and compress files into a ZIP archive',
        example: 'zip -r backup.zip ./project/',
        flags: [
          { flag: '-r', desc: 'Recursive — include directories' },
          { flag: '-e', desc: 'Encrypt with password' },
          { flag: '-9', desc: 'Maximum compression' },
          { flag: '-u', desc: 'Update existing archive (add/replace)' },
        ],
      },
      {
        cmd: 'unzip',
        desc: 'Extract files from a ZIP archive',
        example: 'unzip archive.zip -d ./output/',
        flags: [
          { flag: '-d DIR', desc: 'Extract into DIR' },
          { flag: '-l', desc: 'List archive contents without extracting' },
          { flag: '-o', desc: 'Overwrite files without prompting' },
          { flag: '-j', desc: 'Junk paths: extract files without directory structure' },
        ],
      },
    ],
  },
];
