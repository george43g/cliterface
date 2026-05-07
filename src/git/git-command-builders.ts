/**
 * Git command builders and documentation helpers
 */

// ── Ref name validation (Zod-style, no external dep) ─────────────────────────

const INVALID_REF_PATTERNS = [
  /\.\./, // double dot
  /\/\./, // slash-dot
  /\.lock$/, // ends with .lock
  /[~^:?*[\\\s]/, // disallowed chars
  /^-/, // starts with dash
  /\/@\{/, // @{
  /\.$/, // ends with dot
  /^@$/, // bare @
];

export function isValidRefName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (name.startsWith('/') || name.endsWith('/')) return false;
  for (const pattern of INVALID_REF_PATTERNS) {
    if (pattern.test(name)) return false;
  }
  return true;
}

export function validateRefName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) return { valid: false, error: 'Name is required' };
  if (!isValidRefName(name.trim())) {
    return { valid: false, error: 'Invalid ref name: contains illegal characters or patterns' };
  }
  return { valid: true };
}

// ── Log format builders ───────────────────────────────────────────────────────

export const LOG_FORMATS = [
  { id: 'oneline', label: 'One-line', format: '--oneline' },
  { id: 'short', label: 'Short', format: '--format=short' },
  { id: 'medium', label: 'Medium', format: '--format=medium' },
  { id: 'full', label: 'Full', format: '--format=full' },
  { id: 'graph', label: 'Graph', format: '--oneline --graph --decorate --all' },
  { id: 'stat', label: 'Stat', format: '--stat -10' },
  { id: 'patch', label: 'Patch (diff)', format: '-p -5' },
] as const;

export type LogFormatId = (typeof LOG_FORMATS)[number]['id'];

export function buildLogCommand(format: LogFormatId = 'oneline', limit = 20, author = '', since = '', grep = '', branch = ''): string {
  const fmt = LOG_FORMATS.find(f => f.id === format)?.format ?? '--oneline';
  const parts = ['git log', fmt, `-${limit}`];
  if (author) parts.push(`--author=${JSON.stringify(author)}`);
  if (since) parts.push(`--since=${JSON.stringify(since)}`);
  if (grep) parts.push(`--grep=${JSON.stringify(grep)}`);
  if (branch) parts.push(branch);
  return parts.join(' ');
}

// ── Diff builders ─────────────────────────────────────────────────────────────

export function buildDiffCommand(from = '', to = '', staged = false, nameOnly = false, file = ''): string {
  const parts = ['git diff'];
  if (staged) parts.push('--staged');
  if (nameOnly) parts.push('--name-only');
  if (from) parts.push(from);
  if (to) parts.push(to);
  if (file) parts.push('--', file);
  return parts.join(' ');
}

// ── Push/pull builders ────────────────────────────────────────────────────────

export function buildPushCommand(remote: string, branch: string, forceWithLease = false, setUpstream = false, tags = false): string {
  const parts = ['git push'];
  if (forceWithLease) parts.push('--force-with-lease');
  if (setUpstream) parts.push('--set-upstream');
  if (tags) parts.push('--tags');
  if (remote) parts.push(remote);
  if (branch) parts.push(branch);
  return parts.join(' ');
}

export function buildPullCommand(remote: string, branch: string, rebase = false): string {
  const parts = ['git pull'];
  if (rebase) parts.push('--rebase');
  if (remote) parts.push(remote);
  if (branch) parts.push(branch);
  return parts.join(' ');
}

// ── Reset builder ─────────────────────────────────────────────────────────────

export interface ResetOption {
  mode: 'soft' | 'mixed' | 'hard';
  label: string;
  description: string;
  destructive: boolean;
}

export const RESET_OPTIONS: ResetOption[] = [
  {
    mode: 'soft',
    label: '--soft',
    description: 'Moves HEAD only. Index and working tree unchanged. Staged changes kept.',
    destructive: false,
  },
  {
    mode: 'mixed',
    label: '--mixed (default)',
    description: 'Moves HEAD and resets the index. Working tree unchanged. Changes are unstaged.',
    destructive: false,
  },
  {
    mode: 'hard',
    label: '--hard ⚠',
    description: 'Moves HEAD, resets index AND working tree. All uncommitted changes are LOST.',
    destructive: true,
  },
];

// ── Documentation ─────────────────────────────────────────────────────────────

export interface GitCommandDoc {
  name: string;
  synopsis: string;
  description: string;
  flags: Array<{ flag: string; description: string }>;
  examples: Array<{ command: string; description: string }>;
}

export const GIT_DOCS: Record<string, GitCommandDoc> = {
  status: {
    name: 'git status',
    synopsis: 'git status [-s | --short] [--branch] [--ahead-behind]',
    description: "Displays the state of the working directory and staging area. Shows which changes have been staged, which haven't, and which files aren't being tracked.",
    flags: [
      { flag: '--short (-s)', description: 'Give output in short-format' },
      { flag: '--branch (-b)', description: 'Show branch and tracking info' },
      { flag: '--porcelain', description: 'Machine-readable output' },
    ],
    examples: [
      { command: 'git status', description: 'Full status output' },
      { command: 'git status -s', description: 'Short format' },
    ],
  },
  log: {
    name: 'git log',
    synopsis: 'git log [<options>] [<revision range>] [[--] <path>...]',
    description: 'Shows the commit logs. Can filter by author, date, message, path, and more.',
    flags: [
      { flag: '--oneline', description: 'Compact one-line format' },
      { flag: '--graph', description: 'Draw ASCII graph of branch/merge history' },
      { flag: '--all', description: 'Show all refs (branches, tags, remotes)' },
      { flag: '--decorate', description: 'Print ref names next to commits' },
      { flag: '-p / --patch', description: 'Show patch diff with each commit' },
      { flag: '--stat', description: 'Show stats for files changed' },
      { flag: '--author=<pattern>', description: 'Limit to commits by author' },
      { flag: '--since=<date>', description: 'Commits more recent than date' },
      { flag: '--grep=<pattern>', description: 'Filter commits matching message' },
    ],
    examples: [
      { command: 'git log --oneline -20', description: 'Last 20 commits, compact' },
      { command: 'git log --oneline --graph --all --decorate', description: 'Branch graph' },
      { command: 'git log -p -5', description: 'Last 5 commits with diffs' },
    ],
  },
  diff: {
    name: 'git diff',
    synopsis: 'git diff [options] [<commit>] [--] [<path>...]',
    description: 'Show changes between commits, commit and working tree, etc.',
    flags: [
      { flag: '--staged / --cached', description: 'Show staged changes (vs HEAD)' },
      { flag: '--name-only', description: 'Show only file names' },
      { flag: '--stat', description: 'Show diffstat summary' },
      { flag: '--word-diff', description: 'Show word-level diffs' },
    ],
    examples: [
      { command: 'git diff', description: 'Unstaged changes' },
      { command: 'git diff --staged', description: 'Staged changes vs HEAD' },
      { command: 'git diff HEAD~1', description: 'Changes since last commit' },
    ],
  },
  reset: {
    name: 'git reset',
    synopsis: 'git reset [--soft | --mixed | --hard] [<commit>]',
    description: 'Resets the current HEAD to the specified state. --hard is destructive and discards working tree changes.',
    flags: [
      { flag: '--soft', description: 'Keep index and working tree, only move HEAD' },
      { flag: '--mixed', description: 'Reset index but not working tree (default)' },
      { flag: '--hard ⚠', description: 'DESTRUCTIVE: Reset both index and working tree' },
    ],
    examples: [
      { command: 'git reset HEAD~1', description: 'Undo last commit, keep changes staged' },
      { command: 'git reset --soft HEAD~1', description: 'Undo commit, keep staged' },
      { command: 'git reset --hard HEAD', description: 'DISCARD all uncommitted changes' },
    ],
  },
  stash: {
    name: 'git stash',
    synopsis: 'git stash [push | pop | apply | drop | list | show]',
    description: 'Temporarily shelves (stashes) changes to a dirty working directory.',
    flags: [
      { flag: 'push -u', description: 'Also stash untracked files' },
      { flag: 'push -m <msg>', description: 'Stash with a description' },
      { flag: 'pop [stash@{n}]', description: 'Apply stash and remove it' },
      { flag: 'apply [stash@{n}]', description: 'Apply stash, keep it in list' },
      { flag: 'drop stash@{n}', description: 'Delete a specific stash' },
    ],
    examples: [
      { command: 'git stash push -u -m "WIP: feature"', description: 'Stash everything with message' },
      { command: 'git stash pop', description: 'Apply and remove latest stash' },
      { command: 'git stash show -p stash@{0}', description: 'Show diff of stash' },
    ],
  },
};
