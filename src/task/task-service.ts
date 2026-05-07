/**
 * Taskwarrior service module
 * Provides typed wrappers around the `task` CLI.
 */

import type { CommandResult } from '../yabai/yabai-service';

export type { CommandResult };

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskPriority = 'H' | 'M' | 'L' | '';

export type TaskStatus = 'pending' | 'completed' | 'deleted' | 'waiting' | 'recurring';

export interface Task {
  id?: number;
  uuid: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  tags?: string[];
  due?: string;
  scheduled?: string;
  wait?: string;
  depends?: string[];
  urgency?: number;
  entry?: string;
  modified?: string;
  annotations?: Array<{ entry: string; description: string }>;
  recur?: string;
  mask?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  project?: string;
  tags?: string[];
  priority?: TaskPriority;
  dueBefore?: string;
  dueAfter?: string;
  description?: string;
  ids?: number[];
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000001',
    description: 'Review project proposal',
    status: 'pending',
    priority: 'H',
    project: 'work',
    tags: ['review'],
    due: '2026-05-10T00:00:00',
    urgency: 18.5,
    entry: '2026-05-01T09:00:00',
  },
  {
    id: 2,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000002',
    description: 'Buy groceries',
    status: 'pending',
    priority: 'M',
    project: 'personal',
    tags: ['errands'],
    urgency: 5.2,
    entry: '2026-05-02T10:00:00',
  },
  {
    id: 3,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000003',
    description: 'Fix login bug',
    status: 'pending',
    priority: 'H',
    project: 'work',
    tags: ['bug', 'frontend'],
    due: '2026-05-08T00:00:00',
    urgency: 20.1,
    entry: '2026-05-03T08:00:00',
  },
  {
    id: 4,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000004',
    description: 'Read "Clean Code"',
    status: 'pending',
    priority: 'L',
    tags: ['reading'],
    urgency: 1.0,
    entry: '2026-04-15T14:00:00',
  },
  {
    id: 5,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000005',
    description: 'Write quarterly report',
    status: 'pending',
    priority: 'H',
    project: 'work',
    tags: ['report'],
    due: '2026-05-15T00:00:00',
    scheduled: '2026-05-12T09:00:00',
    urgency: 15.3,
    entry: '2026-05-04T11:00:00',
  },
  {
    id: 6,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000006',
    description: 'Schedule dentist appointment',
    status: 'pending',
    priority: 'M',
    project: 'personal',
    urgency: 4.5,
    entry: '2026-05-05T16:00:00',
  },
  {
    id: 7,
    uuid: 'a1b2c3d4-0000-0000-0000-000000000007',
    description: 'Deploy staging environment',
    status: 'completed',
    priority: 'H',
    project: 'work',
    tags: ['devops'],
    urgency: 0,
    entry: '2026-05-01T10:00:00',
    modified: '2026-05-05T14:00:00',
  },
];

const MOCK_PROJECTS = ['work', 'personal', 'home', 'health'];
const MOCK_TAGS = ['bug', 'frontend', 'devops', 'review', 'errands', 'reading', 'report'];

// ── Mock interpreter ──────────────────────────────────────────────────────────

function tokenize(cmd: string): string[] {
  const re = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\S+/g;
  return (cmd.match(re) ?? []).map(t => {
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1);
    }
    return t;
  });
}

function filterTasks(tasks: Task[], tokens: string[]): Task[] {
  let result = [...tasks];

  for (const token of tokens) {
    if (token.startsWith('project:')) {
      const proj = token.slice(8);
      result = result.filter(t => t.project === proj);
    } else if (token.startsWith('+')) {
      const tag = token.slice(1);
      result = result.filter(t => t.tags?.includes(tag));
    } else if (token.startsWith('-')) {
      const tag = token.slice(1);
      result = result.filter(t => !t.tags?.includes(tag));
    } else if (token.startsWith('priority:')) {
      const pri = token.slice(9) as TaskPriority;
      result = result.filter(t => t.priority === pri);
    } else if (token.startsWith('status:')) {
      const st = token.slice(7) as TaskStatus;
      result = result.filter(t => t.status === st);
    } else if (/^\d+$/.test(token)) {
      const id = parseInt(token, 10);
      result = result.filter(t => t.id === id);
    }
  }

  return result;
}

function formatTaskTable(tasks: Task[]): string {
  if (!tasks.length) return 'No tasks found.';

  const header = `ID  Age    P Project     Tags              Description\n${'─'.repeat(80)}`;
  const rows = tasks
    .filter(t => t.status === 'pending' || t.status === 'waiting')
    .map(t => {
      const age = t.entry ? `${Math.floor((Date.now() - new Date(t.entry).getTime()) / 86400000)}d` : '-';
      const pri = t.priority || ' ';
      const proj = (t.project || '').padEnd(11).slice(0, 11);
      const tags = (t.tags?.join(',') || '').padEnd(17).slice(0, 17);
      const id = String(t.id ?? '').padStart(2);
      return `${id}  ${age.padEnd(6)} ${pri} ${proj} ${tags} ${t.description}`;
    });

  return [header, ...rows, '', `${rows.length} task${rows.length !== 1 ? 's' : ''}`].join('\n');
}

function formatProjectList(tasks: Task[]): string {
  const pending = tasks.filter(t => t.status === 'pending');
  const counts: Record<string, number> = {};
  for (const t of pending) {
    const p = t.project || '(none)';
    counts[p] = (counts[p] ?? 0) + 1;
  }
  const lines = Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([p, n]) => `${p.padEnd(20)} ${n}`);
  return ['Project              Count', '─'.repeat(30), ...lines].join('\n');
}

export async function executeCommand(cmd: string): Promise<CommandResult> {
  console.log('[task-service]', cmd);

  const tokens = tokenize(cmd);
  // strip leading 'task'
  const args = tokens[0] === 'task' ? tokens.slice(1) : tokens;

  if (args.includes('--version')) {
    return { stdout: 'task 3.4.2 (mock bridge)', exitCode: 0 };
  }

  if (args.includes('help') || args.includes('--help')) {
    return {
      stdout:
        'task <filter> <command> [<mods>]\n\nCommands: add, modify, done, delete, start, stop, annotate, duplicate, list, next, projects, tags, summary, export, import, sync, undo, calc, calendar, diagnostics\n\nSee "man task" for full documentation.',
      exitCode: 0,
    };
  }

  // Determine subcommand — it's the last filter-free token before mods
  const WRITE_CMDS = ['add', 'modify', 'done', 'delete', 'start', 'stop', 'annotate', 'append', 'prepend', 'duplicate', 'denotate', 'purge', 'log', 'import'];
  const READ_CMDS = [
    'list',
    'next',
    'ready',
    'all',
    'completed',
    'projects',
    'tags',
    'summary',
    'export',
    'burndown',
    'history',
    'ghistory',
    'calendar',
    'info',
    'information',
    'overdue',
    'active',
    'blocked',
    'blocking',
    'stats',
    'recurring',
    'waiting',
    'ids',
    'uuids',
    'reports',
    'diagnostics',
    'sync',
    'undo',
  ];

  const subCmd = args.find(a => WRITE_CMDS.includes(a) || READ_CMDS.includes(a));

  if (!subCmd) {
    // No subcommand — default to "next"
    return { stdout: formatTaskTable(MOCK_TASKS), exitCode: 0 };
  }

  const filterTokens = args.slice(0, args.indexOf(subCmd)).filter(t => !WRITE_CMDS.includes(t) && !READ_CMDS.includes(t));

  switch (subCmd) {
    case 'list':
    case 'next':
    case 'ready':
    case 'all': {
      const filtered = filterTasks(MOCK_TASKS, filterTokens);
      return { stdout: formatTaskTable(filtered), exitCode: 0 };
    }

    case 'completed': {
      const done = MOCK_TASKS.filter(t => t.status === 'completed');
      return { stdout: formatTaskTable(done) || 'No completed tasks.', exitCode: 0 };
    }

    case 'overdue': {
      const now = Date.now();
      const overdue = MOCK_TASKS.filter(t => t.status === 'pending' && t.due && new Date(t.due).getTime() < now);
      return { stdout: formatTaskTable(overdue) || 'No overdue tasks.', exitCode: 0 };
    }

    case 'active': {
      const active = MOCK_TASKS.filter(t => t.status === 'pending');
      return { stdout: formatTaskTable(active), exitCode: 0 };
    }

    case 'projects': {
      return { stdout: formatProjectList(MOCK_TASKS), exitCode: 0 };
    }

    case 'tags': {
      const tagCounts: Record<string, number> = {};
      for (const t of MOCK_TASKS.filter(x => x.status === 'pending')) {
        for (const tag of t.tags ?? []) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      }
      const lines = Object.entries(tagCounts)
        .sort()
        .map(([tag, n]) => `${tag.padEnd(20)} ${n}`);
      return { stdout: ['Tag                  Count', '─'.repeat(30), ...lines].join('\n'), exitCode: 0 };
    }

    case 'summary': {
      return { stdout: formatProjectList(MOCK_TASKS), exitCode: 0 };
    }

    case 'export': {
      const toExport = filterTokens.length ? filterTasks(MOCK_TASKS, filterTokens) : MOCK_TASKS;
      return { stdout: JSON.stringify(toExport, null, 2), exitCode: 0 };
    }

    case 'info':
    case 'information': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t)).map(Number);
      const tasks = ids.length ? MOCK_TASKS.filter(t => ids.includes(t.id ?? -1)) : MOCK_TASKS.slice(0, 1);
      if (!tasks.length) return { stdout: 'No matching tasks.', exitCode: 0 };
      const info = tasks
        .map(t =>
          [
            `Name           Value`,
            `────────────── ─────────────────────────────────────`,
            `ID             ${t.id}`,
            `Description    ${t.description}`,
            `Status         ${t.status}`,
            `Priority       ${t.priority || 'none'}`,
            `Project        ${t.project || 'none'}`,
            `Tags           ${t.tags?.join(', ') || 'none'}`,
            `Due            ${t.due || 'none'}`,
            `Scheduled      ${t.scheduled || 'none'}`,
            `Urgency        ${t.urgency ?? 0}`,
            `UUID           ${t.uuid}`,
          ].join('\n'),
        )
        .join('\n\n');
      return { stdout: info, exitCode: 0 };
    }

    case 'add': {
      const modsIdx = args.indexOf('add') + 1;
      const modsTokens = args.slice(modsIdx);
      const desc = modsTokens.filter(t => !t.includes(':')).join(' ');
      const proj = modsTokens.find(t => t.startsWith('project:'))?.slice(8);
      const pri = modsTokens.find(t => t.startsWith('priority:'))?.slice(9) as TaskPriority | undefined;
      const due = modsTokens.find(t => t.startsWith('due:'))?.slice(4);
      const newId = Math.max(...MOCK_TASKS.map(t => t.id ?? 0)) + 1;
      return { stdout: `Created task ${newId} (mock): "${desc}"${proj ? ` project:${proj}` : ''}${pri ? ` priority:${pri}` : ''}${due ? ` due:${due}` : ''}`, exitCode: 0 };
    }

    case 'modify': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Modified task(s) ${ids.join(', ')} (mock).`, exitCode: 0 };
    }

    case 'done': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Completed task(s) ${ids.join(', ')} (mock).`, exitCode: 0 };
    }

    case 'delete': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Deleted task(s) ${ids.join(', ')} (mock).`, exitCode: 0 };
    }

    case 'start': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Started task(s) ${ids.join(', ')} (mock). Timer started.`, exitCode: 0 };
    }

    case 'stop': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Stopped task(s) ${ids.join(', ')} (mock). Timer stopped.`, exitCode: 0 };
    }

    case 'annotate': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Annotated task(s) ${ids.join(', ')} (mock).`, exitCode: 0 };
    }

    case 'duplicate': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Duplicated task(s) ${ids.join(', ')} as new tasks (mock).`, exitCode: 0 };
    }

    case 'purge': {
      const ids = filterTokens.filter(t => /^\d+$/.test(t));
      return { stdout: `Purged task(s) ${ids.join(', ')} permanently (mock). This cannot be undone.`, exitCode: 0 };
    }

    case 'log': {
      const modsIdx = args.indexOf('log') + 1;
      const desc = args
        .slice(modsIdx)
        .filter(t => !t.includes(':'))
        .join(' ');
      return { stdout: `Logged completed task (mock): "${desc}"`, exitCode: 0 };
    }

    case 'sync': {
      return { stdout: 'Syncing with Taskserver...\nSync complete. 0 changes uploaded, 0 changes downloaded. (mock)', exitCode: 0 };
    }

    case 'undo': {
      return { stdout: 'Last task operation undone (mock).', exitCode: 0 };
    }

    case 'diagnostics': {
      return {
        stdout: [
          'Taskwarrior 3.4.2 (mock bridge)',
          '',
          'Platform:      darwin',
          'Data location: ~/.task',
          'Locking:       Enabled',
          'Tasks:         pending:6 completed:1',
          'UDAs:          none defined',
        ].join('\n'),
        exitCode: 0,
      };
    }

    case 'calendar': {
      const now = new Date();
      const month = now.toLocaleString('en-US', { month: 'long' });
      const year = now.getFullYear();
      return {
        stdout: [
          `       ${month} ${year}`,
          'Su Mo Tu We Th Fr Sa',
          ' 1  2  3  4  5  6  7',
          ' 8  9 10 11 12 13 14',
          '15 16 17 18 19 20 21',
          '22 23 24 25 26 27 28',
          '29 30 31',
          '',
          'Due tasks are marked with [D] on their date (mock).',
        ].join('\n'),
        exitCode: 0,
      };
    }

    case 'burndown':
    case 'history':
    case 'ghistory': {
      return {
        stdout: [
          'Month    Added Completed Deleted Net',
          '──────── ───── ───────── ─────── ───',
          'Apr 2026    12         5       1   6',
          'May 2026     8         2       0   6',
          '',
          '(mock burndown/history data)',
        ].join('\n'),
        exitCode: 0,
      };
    }

    case 'stats': {
      return {
        stdout: [
          'Category          Data',
          '──────────────── ────',
          'Pending            6',
          'Completed          1',
          'Deleted            0',
          'Projects           2',
          'Tags               7',
          'Avg urgency     10.2',
          '',
          '(mock stats)',
        ].join('\n'),
        exitCode: 0,
      };
    }

    case 'reports': {
      return {
        stdout: [
          'Report        Description',
          '──────────── ─────────────────────────────────────────',
          'active        Active tasks (started but not done)',
          'all           All tasks including completed/deleted',
          'blocked       Tasks blocked by other tasks',
          'blocking      Tasks that block other tasks',
          'burndown      Graphical burndown chart (weekly)',
          'completed     Completed tasks',
          'history       Historical task counts by month',
          'list          Standard task listing',
          'long          Detailed task listing',
          'ls            Short task listing',
          'minimal       Minimal task listing',
          'next          Next most urgent tasks',
          'overdue       Overdue tasks',
          'projects      Project summary',
          'ready         Ready tasks sorted by urgency',
          'recurring     Recurring tasks',
          'summary       Project summary with progress',
          'tags          Tags in use',
          'unblocked     Unblocked tasks',
          'waiting       Waiting tasks',
        ].join('\n'),
        exitCode: 0,
      };
    }

    default:
      return { stdout: `task ${subCmd}: command executed (mock).`, exitCode: 0 };
  }
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export const taskService = {
  async list(filter = ''): Promise<CommandResult> {
    return executeCommand(`task ${filter} list`);
  },
  async next(filter = ''): Promise<CommandResult> {
    return executeCommand(`task ${filter} next`);
  },
  async add(description: string, mods = ''): Promise<CommandResult> {
    return executeCommand(`task add ${mods} ${description}`);
  },
  async done(id: number | string): Promise<CommandResult> {
    return executeCommand(`task ${id} done`);
  },
  async delete(id: number | string): Promise<CommandResult> {
    return executeCommand(`task ${id} delete`);
  },
  async modify(id: number | string, mods: string): Promise<CommandResult> {
    return executeCommand(`task ${id} modify ${mods}`);
  },
  async start(id: number | string): Promise<CommandResult> {
    return executeCommand(`task ${id} start`);
  },
  async stop(id: number | string): Promise<CommandResult> {
    return executeCommand(`task ${id} stop`);
  },
  async annotate(id: number | string, note: string): Promise<CommandResult> {
    return executeCommand(`task ${id} annotate ${note}`);
  },
  async info(id: number | string): Promise<CommandResult> {
    return executeCommand(`task ${id} information`);
  },
  async projects(): Promise<CommandResult> {
    return executeCommand('task projects');
  },
  async tags(): Promise<CommandResult> {
    return executeCommand('task tags');
  },
  async export(filter = ''): Promise<CommandResult> {
    return executeCommand(`task ${filter} export`);
  },
  async sync(): Promise<CommandResult> {
    return executeCommand('task sync');
  },
  async undo(): Promise<CommandResult> {
    return executeCommand('task undo');
  },
  async diagnostics(): Promise<CommandResult> {
    return executeCommand('task diagnostics');
  },
  async calendar(): Promise<CommandResult> {
    return executeCommand('task calendar');
  },
  async reports(): Promise<CommandResult> {
    return executeCommand('task reports');
  },
  async stats(filter = ''): Promise<CommandResult> {
    return executeCommand(`task ${filter} stats`);
  },
};

export { MOCK_PROJECTS, MOCK_TAGS };
