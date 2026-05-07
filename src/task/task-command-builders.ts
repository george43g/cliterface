/**
 * Taskwarrior command builders
 * Construct `task` CLI command strings from structured inputs.
 */

import type { TaskPriority } from './task-service';

export interface TaskAddOptions {
  description: string;
  project?: string;
  priority?: TaskPriority;
  tags?: string[];
  due?: string;
  scheduled?: string;
  wait?: string;
  depends?: string;
  recur?: string;
}

export interface TaskFilterOptions {
  ids?: string; // e.g. "1 2 3" or "1-5"
  project?: string;
  tags?: string[]; // +tag to include, use excludeTags for -tag
  excludeTags?: string[];
  priority?: TaskPriority;
  status?: string;
  description?: string;
  dueBefore?: string;
  dueAfter?: string;
}

/**
 * Build a `task add` command from structured options.
 */
export function buildAddCommand(opts: TaskAddOptions): string {
  const parts: string[] = ['task', 'add'];

  if (opts.project) parts.push(`project:${opts.project}`);
  if (opts.priority) parts.push(`priority:${opts.priority}`);
  if (opts.due) parts.push(`due:${opts.due}`);
  if (opts.scheduled) parts.push(`scheduled:${opts.scheduled}`);
  if (opts.wait) parts.push(`wait:${opts.wait}`);
  if (opts.depends) parts.push(`depends:${opts.depends}`);
  if (opts.recur) parts.push(`recur:${opts.recur}`);
  for (const tag of opts.tags ?? []) {
    parts.push(`+${tag}`);
  }

  // Description always last
  parts.push(opts.description.includes(' ') ? `'${opts.description}'` : opts.description);

  return parts.join(' ');
}

/**
 * Build a filter string from structured options.
 */
export function buildFilterString(filter: TaskFilterOptions): string {
  const parts: string[] = [];

  if (filter.ids) parts.push(filter.ids);
  if (filter.project) parts.push(`project:${filter.project}`);
  if (filter.priority) parts.push(`priority:${filter.priority}`);
  if (filter.status) parts.push(`status:${filter.status}`);
  if (filter.description) parts.push(`description.contains:${filter.description}`);
  if (filter.dueBefore) parts.push(`due.before:${filter.dueBefore}`);
  if (filter.dueAfter) parts.push(`due.after:${filter.dueAfter}`);
  for (const tag of filter.tags ?? []) parts.push(`+${tag}`);
  for (const tag of filter.excludeTags ?? []) parts.push(`-${tag}`);

  return parts.join(' ');
}

/**
 * Build a `task <filter> <command>` string.
 */
export function buildFilteredCommand(filter: TaskFilterOptions, command: string, mods = ''): string {
  const filterStr = buildFilterString(filter);
  const parts = ['task'];
  if (filterStr) parts.push(filterStr);
  parts.push(command);
  if (mods) parts.push(mods);
  return parts.join(' ');
}

/**
 * Build a modify command with structured modifications.
 */
export interface TaskModOptions {
  description?: string;
  project?: string;
  priority?: TaskPriority;
  due?: string;
  scheduled?: string;
  wait?: string;
  tags?: string[]; // tags to add (+tag)
  removeTags?: string[]; // tags to remove (-tag)
  depends?: string;
}

export function buildModifyCommand(filter: TaskFilterOptions, mods: TaskModOptions): string {
  const modParts: string[] = [];

  if (mods.project !== undefined) modParts.push(`project:${mods.project || ''}`);
  if (mods.priority !== undefined) modParts.push(`priority:${mods.priority}`);
  if (mods.due !== undefined) modParts.push(`due:${mods.due}`);
  if (mods.scheduled !== undefined) modParts.push(`scheduled:${mods.scheduled}`);
  if (mods.wait !== undefined) modParts.push(`wait:${mods.wait}`);
  if (mods.depends !== undefined) modParts.push(`depends:${mods.depends}`);
  for (const tag of mods.tags ?? []) modParts.push(`+${tag}`);
  for (const tag of mods.removeTags ?? []) modParts.push(`-${tag}`);
  if (mods.description) modParts.push(`'${mods.description}'`);

  return buildFilteredCommand(filter, 'modify', modParts.join(' '));
}

// ── Presets ───────────────────────────────────────────────────────────────────

export interface TaskPreset {
  name: string;
  description: string;
  command: string;
  type: 'query' | 'action';
}

export const TASK_REPORT_PRESETS: TaskPreset[] = [
  { name: 'Next (urgent)', description: 'Show most urgent pending tasks', command: 'task next', type: 'query' },
  { name: 'All pending', description: 'List all pending tasks', command: 'task list', type: 'query' },
  { name: 'Overdue', description: 'Tasks past their due date', command: 'task overdue', type: 'query' },
  { name: 'Due today', description: 'Tasks due today', command: 'task due.is:today list', type: 'query' },
  { name: 'Due this week', description: 'Tasks due within 7 days', command: 'task due.before:eow list', type: 'query' },
  { name: 'High priority', description: 'All high-priority tasks', command: 'task priority:H list', type: 'query' },
  { name: 'Active (started)', description: 'Tasks that have been started', command: 'task active', type: 'query' },
  { name: 'Blocked', description: 'Tasks blocked by other tasks', command: 'task blocked', type: 'query' },
  { name: 'Unblocked', description: 'Tasks with no blockers', command: 'task unblocked', type: 'query' },
  { name: 'Waiting', description: 'Tasks in waiting state', command: 'task waiting', type: 'query' },
  { name: 'Recurring', description: 'All recurring tasks', command: 'task recurring', type: 'query' },
  { name: 'Completed', description: 'Recently completed tasks', command: 'task completed', type: 'query' },
  { name: 'Projects', description: 'Summary by project', command: 'task projects', type: 'query' },
  { name: 'Tags', description: 'All tags in use', command: 'task tags', type: 'query' },
  { name: 'Summary', description: 'Project completion summary', command: 'task summary', type: 'query' },
  { name: 'Statistics', description: 'Overall task statistics', command: 'task stats', type: 'query' },
  { name: 'Burndown (weekly)', description: 'Graphical burndown chart', command: 'task burndown.weekly', type: 'query' },
  { name: 'History (monthly)', description: 'Task history by month', command: 'task history.monthly', type: 'query' },
];
