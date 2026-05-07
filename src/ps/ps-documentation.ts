/**
 * ps documentation — BSD vs GNU/POSIX cross-reference
 */

export interface PsCheatEntry {
  goal: string;
  bsd: string;
  gnu: string;
  posix: string;
  notes: string;
}

export const PS_CHEAT: PsCheatEntry[] = [
  {
    goal: 'All processes',
    bsd: 'ps aux',
    gnu: 'ps -ef',
    posix: 'ps -A',
    notes: 'BSD "aux" is three single-letter options (a, u, x). GNU "-ef" uses POSIX-style long options with dashes.',
  },
  {
    goal: 'Filter by user',
    bsd: 'ps -u username',
    gnu: 'ps -u username',
    posix: 'ps -u username',
    notes: 'Nearly identical across dialects.',
  },
  {
    goal: 'Filter by PID',
    bsd: 'ps -p 1234',
    gnu: 'ps -p 1234',
    posix: 'ps -p 1234',
    notes: 'Comma-separate multiple PIDs: ps -p 1,2,3',
  },
  {
    goal: 'Full-format listing',
    bsd: 'ps -f',
    gnu: 'ps -f',
    posix: 'ps -f',
    notes: 'Shows uid, pid, ppid, C, stime, tty, time, cmd.',
  },
  {
    goal: 'Thread / task detail',
    bsd: 'ps -M',
    gnu: 'ps -L  or  ps -T',
    posix: '(not standardised)',
    notes: 'BSD -M prints one thread per line. GNU -L/-T do similar.',
  },
  {
    goal: 'Sort by CPU',
    bsd: 'ps aux -r',
    gnu: 'ps aux --sort=-%cpu',
    posix: 'ps -A | sort (manual)',
    notes: 'BSD -r sorts by current CPU usage. GNU supports --sort.',
  },
  {
    goal: 'Sort by memory',
    bsd: 'ps aux -m',
    gnu: 'ps aux --sort=-%mem',
    posix: 'ps -A | sort (manual)',
    notes: 'BSD -m sorts by memory usage.',
  },
  {
    goal: 'Custom output fields',
    bsd: 'ps -o pid,user,%cpu,%mem,comm',
    gnu: 'ps -o pid,user,%cpu,%mem,comm',
    posix: 'ps -o pid,user,pcpu,pmem,comm',
    notes: 'BSD/GNU use %cpu / %mem; POSIX uses pcpu / pmem.',
  },
  {
    goal: 'Process hierarchy (tree)',
    bsd: 'pstree  (or  ps -f)',
    gnu: 'ps --forest  or  pstree',
    posix: '(no native tree mode)',
    notes: 'macOS ships pstree via homebrew. GNU ps has --forest.',
  },
  {
    goal: 'Wide output (no wrap)',
    bsd: 'ps -ww',
    gnu: 'ps -ww  or  --width=COLS',
    posix: 'n/a',
    notes: 'Prevents command column truncation.',
  },
];

export const PS_FIELDS_REFERENCE = [
  { field: 'pid', description: 'Process ID' },
  { field: 'ppid', description: 'Parent process ID' },
  { field: 'user', description: 'Username of the process owner' },
  { field: 'uid', description: 'Numeric user ID' },
  { field: 'gid', description: 'Numeric group ID' },
  { field: '%cpu', description: 'CPU utilisation (decaying average)' },
  { field: '%mem', description: 'Percentage of real memory used' },
  { field: 'rss', description: 'Resident set size in KB' },
  { field: 'vsz', description: 'Virtual memory size in KB' },
  { field: 'state', description: 'Process state (R/S/D/T/Z…)' },
  { field: 'tty', description: 'Controlling terminal' },
  { field: 'time', description: 'Accumulated CPU time' },
  { field: 'start', description: 'Time command started' },
  { field: 'comm', description: 'Command name only (no args)' },
  { field: 'command', description: 'Full command line with arguments' },
  { field: 'nice', description: 'Process scheduling priority (-20..19)' },
  { field: 'pri', description: 'Process priority' },
  { field: 'lim', description: 'Soft memory limit (setrlimit)' },
];

export const PS_STATES: { code: string; meaning: string }[] = [
  { code: 'R', meaning: 'Running or runnable (on run queue)' },
  { code: 'S', meaning: 'Interruptible sleep (waiting for event)' },
  { code: 'D', meaning: 'Uninterruptible sleep (usually I/O)' },
  { code: 'T', meaning: 'Stopped (by job control signal)' },
  { code: 'Z', meaning: 'Zombie (terminated, not yet waited on)' },
  { code: 'I', meaning: 'Idle kernel thread (BSD)' },
  { code: 'U', meaning: 'Uninterruptible wait (BSD)' },
  { code: 'W', meaning: 'Paging (not valid since Linux 2.6)' },
];
