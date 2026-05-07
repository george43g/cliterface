import { Component, h, State } from '@stencil/core';
import {
  buildAddCommand,
  buildFilterString,
  buildModifyCommand,
  TASK_REPORT_PRESETS,
  type TaskAddOptions,
  type TaskFilterOptions,
  type TaskModOptions,
} from '../../task/task-command-builders';
import { type CommandResult, executeCommand, MOCK_PROJECTS, MOCK_TAGS, type TaskPriority, taskService } from '../../task/task-service';

// ── Constants ────────────────────────────────────────────────────────────────

const TAB_DEFINITIONS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'add', label: 'Add' },
  { id: 'filter', label: 'Filter / Search' },
  { id: 'reports', label: 'Reports' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'sync', label: 'Sync' },
  { id: 'config', label: 'Config' },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'L', label: 'Low (L)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'H', label: 'High (H)' },
];

type CommandStatus = 'idle' | 'running' | 'success' | 'error';

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  tag: 'task-gui',
  styleUrl: 'task-gui.css',
  scoped: true,
})
export class TaskGui {
  // ── Global UI state ────────────────────────────────────────────────────────
  @State() activeTab = 'inbox';
  @State() status: CommandStatus = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select a tab and execute a command to see output here.';
  @State() statusMessage = 'Ready — using mock task bridge';
  @State() commandPreview = 'task next';

  // ── Inbox tab ──────────────────────────────────────────────────────────────
  @State() inboxReport = 'next';
  @State() inboxTaskId = '';

  // ── Add tab ────────────────────────────────────────────────────────────────
  @State() addDescription = '';
  @State() addProject = '';
  @State() addPriority: TaskPriority = '';
  @State() addDue = '';
  @State() addScheduled = '';
  @State() addWait = '';
  @State() addTagsInput = '';
  @State() addDepends = '';
  @State() addRecur = '';

  // ── Filter / Search tab ────────────────────────────────────────────────────
  @State() filterIds = '';
  @State() filterProject = '';
  @State() filterPriority: TaskPriority = '';
  @State() filterTags = '';
  @State() filterExcludeTags = '';
  @State() filterDescription = '';
  @State() filterDueBefore = '';
  @State() filterDueAfter = '';
  @State() filterCommand = 'list';

  // Modify sub-form in filter tab
  @State() modifyMode = false;
  @State() modDescription = '';
  @State() modProject = '';
  @State() modPriority: TaskPriority = '';
  @State() modDue = '';
  @State() modAddTags = '';
  @State() modRemoveTags = '';

  // ── Reports tab ────────────────────────────────────────────────────────────
  @State() selectedReportIdx = 0;

  // ── Calendar tab ──────────────────────────────────────────────────────────
  @State() calYear = '';
  @State() calMonth = '';
  @State() calShowFull = false;

  // ── Sync tab ───────────────────────────────────────────────────────────────
  @State() syncServer = '';
  @State() syncPort = '53589';
  @State() syncCredentials = '';

  // ── Config tab ────────────────────────────────────────────────────────────
  @State() configKey = '';
  @State() configValue = '';
  @State() configSearchKey = 'default';

  // ── Raw command mode ───────────────────────────────────────────────────────
  @State() rawCommand = '';

  // ── Helpers ────────────────────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready — using mock task bridge'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private async run(cmd: string): Promise<void> {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    this.lastCommand = trimmed;
    this.commandPreview = trimmed;
    this.status = 'running';
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      const result: CommandResult = await executeCommand(trimmed);
      this.output = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean).join('\n\n') || JSON.stringify(result, null, 2);
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async runDestructive(cmd: string, label: string): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`${label}\n\nExecute: ${cmd}?`)) return;
    await this.run(cmd);
  }

  private clearOutput(): void {
    this.output = 'Select a tab and execute a command to see output here.';
    this.lastCommand = 'Ready...';
    this.commandPreview = 'task next';
    this.status = 'idle';
    this.statusMessage = 'Ready — using mock task bridge';
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied to clipboard');
  }

  // ── Inbox helpers ─────────────────────────────────────────────────────────

  private buildInboxCommand(): string {
    return `task ${this.inboxReport}`;
  }

  // ── Add helpers ───────────────────────────────────────────────────────────

  private buildAddCommand(): string {
    if (!this.addDescription.trim()) return 'task add <description>';
    const tags = this.addTagsInput.split(/[\s,]+/).filter(Boolean);
    const opts: TaskAddOptions = {
      description: this.addDescription.trim(),
      project: this.addProject || undefined,
      priority: this.addPriority || undefined,
      due: this.addDue || undefined,
      scheduled: this.addScheduled || undefined,
      wait: this.addWait || undefined,
      depends: this.addDepends || undefined,
      recur: this.addRecur || undefined,
      tags,
    };
    return buildAddCommand(opts);
  }

  // ── Filter helpers ─────────────────────────────────────────────────────────

  private buildFilterOpts(): TaskFilterOptions {
    return {
      ids: this.filterIds || undefined,
      project: this.filterProject || undefined,
      priority: (this.filterPriority || undefined) as TaskPriority | undefined,
      tags: this.filterTags ? this.filterTags.split(/[\s,]+/).filter(Boolean) : undefined,
      excludeTags: this.filterExcludeTags ? this.filterExcludeTags.split(/[\s,]+/).filter(Boolean) : undefined,
      description: this.filterDescription || undefined,
      dueBefore: this.filterDueBefore || undefined,
      dueAfter: this.filterDueAfter || undefined,
    };
  }

  private buildFilterCommand(): string {
    const filterStr = buildFilterString(this.buildFilterOpts());
    return `task ${filterStr ? `${filterStr} ` : ''}${this.filterCommand}`;
  }

  private buildModifyCmd(): string {
    const filterOpts = this.buildFilterOpts();
    const mods: TaskModOptions = {
      description: this.modDescription || undefined,
      project: this.modProject || undefined,
      priority: (this.modPriority || undefined) as TaskPriority | undefined,
      due: this.modDue || undefined,
      tags: this.modAddTags ? this.modAddTags.split(/[\s,]+/).filter(Boolean) : undefined,
      removeTags: this.modRemoveTags ? this.modRemoveTags.split(/[\s,]+/).filter(Boolean) : undefined,
    };
    return buildModifyCommand(filterOpts, mods);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  renderTabs() {
    return (
      <div class="flex flex-wrap gap-1 mb-4 border-b border-accent2 pb-2">
        {TAB_DEFINITIONS.map(tab => (
          <button
            type="button"
            key={tab.id}
            class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // ── Inbox tab ──────────────────────────────────────────────────────────────

  renderInboxTab() {
    return (
      <div class="space-y-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Task Reports</h3>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {(['next', 'list', 'overdue', 'active', 'ready', 'blocked', 'waiting', 'completed'] as const).map(report => (
              <button
                key={report}
                type="button"
                class={`cli-btn cli-btn-sm ${this.inboxReport === report ? 'cli-btn-info' : ''}`}
                onClick={() => {
                  this.inboxReport = report;
                  this.commandPreview = `task ${report}`;
                }}
              >
                {report}
              </button>
            ))}
          </div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.buildInboxCommand())}>
            Run Report
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Quick Task Actions</h3>
          <p class="text-xs text-text2 mb-3">Enter task ID(s) then click an action. Separate multiple IDs with spaces.</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Task ID(s)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g., 1 or 1 2 3 or 1-5"
              value={this.inboxTaskId}
              onInput={(e: Event) => {
                this.inboxTaskId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run(`task ${this.inboxTaskId} done`)} disabled={!this.inboxTaskId.trim()}>
              Mark Done
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(`task ${this.inboxTaskId} start`)} disabled={!this.inboxTaskId.trim()}>
              Start
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(`task ${this.inboxTaskId} stop`)} disabled={!this.inboxTaskId.trim()}>
              Stop
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(`task ${this.inboxTaskId} information`)} disabled={!this.inboxTaskId.trim()}>
              Info
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(`task ${this.inboxTaskId} duplicate`)} disabled={!this.inboxTaskId.trim()}>
              Duplicate
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(`task ${this.inboxTaskId} delete`, `Delete task(s) ${this.inboxTaskId}?`)}
              disabled={!this.inboxTaskId.trim()}
            >
              Delete
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(`task ${this.inboxTaskId} purge`, `Permanently purge task(s) ${this.inboxTaskId}? This cannot be undone.`)}
              disabled={!this.inboxTaskId.trim()}
            >
              Purge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Add tab ────────────────────────────────────────────────────────────────

  renderAddTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Add New Task</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Description *
            <input
              type="text"
              class="cli-input w-full"
              placeholder="What needs to be done?"
              value={this.addDescription}
              onInput={(e: Event) => {
                this.addDescription = (e.target as HTMLInputElement).value;
                this.commandPreview = this.buildAddCommand();
              }}
            />
          </label>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Project
              <input
                type="text"
                class="cli-input w-full"
                list="task-projects-list"
                placeholder="e.g., work"
                value={this.addProject}
                onInput={(e: Event) => {
                  this.addProject = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildAddCommand();
                }}
              />
              <datalist id="task-projects-list">
                {MOCK_PROJECTS.map(p => (
                  <option value={p} key={p} />
                ))}
              </datalist>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Priority
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.addPriority = (e.target as HTMLSelectElement).value as TaskPriority;
                  this.commandPreview = this.buildAddCommand();
                }}
              >
                {PRIORITIES.map(p => (
                  <option value={p.value} key={p.value} selected={this.addPriority === p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Due date
              <input
                type="date"
                class="cli-input w-full"
                value={this.addDue}
                onInput={(e: Event) => {
                  this.addDue = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildAddCommand();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Scheduled
              <input
                type="date"
                class="cli-input w-full"
                value={this.addScheduled}
                onInput={(e: Event) => {
                  this.addScheduled = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildAddCommand();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Wait until
              <input
                type="date"
                class="cli-input w-full"
                value={this.addWait}
                onInput={(e: Event) => {
                  this.addWait = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildAddCommand();
                }}
              />
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Tags (comma or space separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g., bug, frontend"
              value={this.addTagsInput}
              onInput={(e: Event) => {
                this.addTagsInput = (e.target as HTMLInputElement).value;
                this.commandPreview = this.buildAddCommand();
              }}
            />
          </label>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Depends on (IDs)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., 1,3,5"
                value={this.addDepends}
                onInput={(e: Event) => {
                  this.addDepends = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildAddCommand();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Recurrence
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., daily, 1w, monthly"
                value={this.addRecur}
                onInput={(e: Event) => {
                  this.addRecur = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildAddCommand();
                }}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.buildAddCommand())} disabled={!this.addDescription.trim()}>
              Add Task
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => {
                this.addDescription = '';
                this.addProject = '';
                this.addPriority = '';
                this.addDue = '';
                this.addScheduled = '';
                this.addWait = '';
                this.addTagsInput = '';
                this.addDepends = '';
                this.addRecur = '';
                this.commandPreview = 'task add <description>';
              }}
            >
              Reset Form
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Log Completed Task</h3>
          <p class="text-xs text-text2 mb-3">Record a task that is already done (no start time tracking).</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Description
            <input
              type="text"
              class="cli-input w-full"
              placeholder="What did you accomplish?"
              onInput={(e: Event) => {
                this.commandPreview = `task log ${(e.target as HTMLInputElement).value}`;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn"
            onClick={(e: Event) => {
              const input = (e.target as HTMLElement).closest('.cli-card')?.querySelector('input');
              if (input) this.run(`task log ${(input as HTMLInputElement).value}`);
            }}
          >
            Log Task
          </button>

          <div class="mt-6 pt-4 border-t border-bg3">
            <h3 class="text-text2 text-base mb-3">Undo Last Change</h3>
            <p class="text-xs text-text2 mb-3">Reverts the most recent task modification.</p>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.runDestructive('task undo', 'Undo the last task operation?')}>
              Undo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Filter / Search tab ────────────────────────────────────────────────────

  renderFilterTab() {
    return (
      <div class="space-y-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Filter / Search Tasks</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Task ID(s)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., 1 2 3 or 1-5"
                value={this.filterIds}
                onInput={(e: Event) => {
                  this.filterIds = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Project
              <input
                type="text"
                class="cli-input w-full"
                list="task-filter-projects"
                placeholder="e.g., work"
                value={this.filterProject}
                onInput={(e: Event) => {
                  this.filterProject = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
              <datalist id="task-filter-projects">
                {MOCK_PROJECTS.map(p => (
                  <option value={p} key={p} />
                ))}
              </datalist>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Priority
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.filterPriority = (e.target as HTMLSelectElement).value as TaskPriority;
                  this.commandPreview = this.buildFilterCommand();
                }}
              >
                <option value="">Any priority</option>
                {PRIORITIES.filter(p => p.value).map(p => (
                  <option value={p.value} key={p.value} selected={this.filterPriority === p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Include Tags (+tag)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., bug, frontend"
                value={this.filterTags}
                onInput={(e: Event) => {
                  this.filterTags = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Exclude Tags (-tag)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., someday"
                value={this.filterExcludeTags}
                onInput={(e: Event) => {
                  this.filterExcludeTags = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Description contains
              <input
                type="text"
                class="cli-input w-full"
                placeholder="keyword"
                value={this.filterDescription}
                onInput={(e: Event) => {
                  this.filterDescription = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Due before
              <input
                type="date"
                class="cli-input w-full"
                value={this.filterDueBefore}
                onInput={(e: Event) => {
                  this.filterDueBefore = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Due after
              <input
                type="date"
                class="cli-input w-full"
                value={this.filterDueAfter}
                onInput={(e: Event) => {
                  this.filterDueAfter = (e.target as HTMLInputElement).value;
                  this.commandPreview = this.buildFilterCommand();
                }}
              />
            </label>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {(['list', 'next', 'information', 'export'] as const).map(cmd => (
              <button
                key={cmd}
                type="button"
                class={`cli-btn cli-btn-sm ${this.filterCommand === cmd ? 'cli-btn-success' : ''}`}
                onClick={() => {
                  this.filterCommand = cmd;
                  this.commandPreview = this.buildFilterCommand();
                }}
              >
                {cmd}
              </button>
            ))}
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.buildFilterCommand())}>
              Run Query
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                this.modifyMode = !this.modifyMode;
              }}
            >
              {this.modifyMode ? 'Hide Modify' : 'Modify Matching'}
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() =>
                this.runDestructive(
                  buildFilterString(this.buildFilterOpts()) ? `task ${buildFilterString(this.buildFilterOpts())} delete` : 'task delete',
                  'Delete all tasks matching this filter?',
                )
              }
            >
              Delete Matching
            </button>
          </div>
        </div>

        {this.modifyMode && (
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Modify Matching Tasks</h3>
            <p class="text-xs text-text2 mb-3">Changes will apply to all tasks matching the filter above.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                New description
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="(leave blank to keep)"
                  value={this.modDescription}
                  onInput={(e: Event) => {
                    this.modDescription = (e.target as HTMLInputElement).value;
                    this.commandPreview = this.buildModifyCmd();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                New project
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="(leave blank to keep)"
                  value={this.modProject}
                  onInput={(e: Event) => {
                    this.modProject = (e.target as HTMLInputElement).value;
                    this.commandPreview = this.buildModifyCmd();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                New priority
                <select
                  class="cli-select w-full"
                  onChange={(e: Event) => {
                    this.modPriority = (e.target as HTMLSelectElement).value as TaskPriority;
                    this.commandPreview = this.buildModifyCmd();
                  }}
                >
                  <option value="">No change</option>
                  {PRIORITIES.map(p => (
                    <option value={p.value} key={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                New due date
                <input
                  type="date"
                  class="cli-input w-full"
                  value={this.modDue}
                  onInput={(e: Event) => {
                    this.modDue = (e.target as HTMLInputElement).value;
                    this.commandPreview = this.buildModifyCmd();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Add tags
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., urgent, work"
                  value={this.modAddTags}
                  onInput={(e: Event) => {
                    this.modAddTags = (e.target as HTMLInputElement).value;
                    this.commandPreview = this.buildModifyCmd();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Remove tags
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., waiting"
                  value={this.modRemoveTags}
                  onInput={(e: Event) => {
                    this.modRemoveTags = (e.target as HTMLInputElement).value;
                    this.commandPreview = this.buildModifyCmd();
                  }}
                />
              </label>
            </div>

            <button type="button" class="cli-btn" onClick={() => this.run(this.buildModifyCmd())}>
              Apply Modifications
            </button>
          </div>
        )}

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Quick Tag Explorer</h3>
          <div class="flex flex-wrap gap-2">
            {MOCK_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  this.filterTags = tag;
                  this.commandPreview = this.buildFilterCommand();
                  this.run(this.buildFilterCommand());
                }}
              >
                +{tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Reports tab ────────────────────────────────────────────────────────────

  renderReportsTab() {
    const selected = TASK_REPORT_PRESETS[this.selectedReportIdx];

    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-1 cli-card">
          <h3 class="text-text2 text-base mb-3">Built-in Reports</h3>
          <div class="space-y-1 max-h-96 overflow-y-auto">
            {TASK_REPORT_PRESETS.map((preset, i) => (
              <button
                key={i}
                type="button"
                class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${this.selectedReportIdx === i ? 'bg-accent text-white' : 'bg-bg3 hover:bg-accent2 text-text'}`}
                onClick={() => {
                  this.selectedReportIdx = i;
                  this.commandPreview = preset.command;
                }}
              >
                <div class="font-medium">{preset.name}</div>
                <div class="text-xs opacity-70">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div class="xl:col-span-2 cli-card">
          {selected && (
            <div>
              <h3 class="text-text2 text-base mb-1">{selected.name}</h3>
              <p class="text-xs text-text2 mb-3">{selected.description}</p>
              <div class="cli-cmd-preview mb-4">{selected.command}</div>
              <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(selected.command)}>
                Run Report
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Calendar tab ──────────────────────────────────────────────────────────

  renderCalendarTab() {
    const buildCalCmd = () => {
      const parts = ['task calendar'];
      if (this.calMonth && this.calYear) parts.push(`${this.calMonth} ${this.calYear}`);
      else if (this.calYear) parts.push(this.calYear);
      if (this.calShowFull) parts.push('y');
      return parts.join(' ');
    };

    return (
      <div class="space-y-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Calendar</h3>
          <p class="text-xs text-text2 mb-4">Shows a monthly calendar with due tasks highlighted.</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Month (1–12)
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="12"
                placeholder="e.g., 5"
                value={this.calMonth}
                onInput={(e: Event) => {
                  this.calMonth = (e.target as HTMLInputElement).value;
                  this.commandPreview = buildCalCmd();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Year
              <input
                type="number"
                class="cli-input w-full"
                placeholder="e.g., 2026"
                value={this.calYear}
                onInput={(e: Event) => {
                  this.calYear = (e.target as HTMLInputElement).value;
                  this.commandPreview = buildCalCmd();
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 mt-5">
              <input
                type="checkbox"
                checked={this.calShowFull}
                onChange={(e: Event) => {
                  this.calShowFull = (e.target as HTMLInputElement).checked;
                  this.commandPreview = buildCalCmd();
                }}
              />
              Show full year (y)
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(buildCalCmd())}>
              Show Calendar
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('task calendar due')}>
              Earliest Due
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sync tab ───────────────────────────────────────────────────────────────

  renderSyncTab() {
    return (
      <div class="space-y-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Sync with Taskserver</h3>
          <p class="text-xs text-text2 mb-4">
            Taskwarrior syncs with a Taskserver (e.g., Inthe.AM, FreeCinc, or self-hosted). Configure <code>taskserver.server</code>, <code>taskserver.credentials</code>, and{' '}
            <code>taskserver.ca.cert</code> in your <code>~/.taskrc</code>.
          </p>

          <div class="flex flex-wrap gap-2 mb-6">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('task sync')}>
              Sync Now
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('task diagnostics')}>
              Diagnostics
            </button>
          </div>

          <div class="pt-4 border-t border-bg3">
            <h4 class="text-sm text-text2 mb-2">Import / Export</h4>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('task export')}>
                Export All (JSON)
              </button>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('task import-v2')}>
                Import v2 Format
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Config tab ────────────────────────────────────────────────────────────

  renderConfigTab() {
    return (
      <div class="space-y-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Show Configuration</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Filter substring (leave blank for all)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g., taskserver or color"
              value={this.configSearchKey === 'default' ? '' : this.configSearchKey}
              onInput={(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this.configSearchKey = v || 'default';
                this.commandPreview = v ? `task show ${v}` : 'task show';
              }}
            />
          </label>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.configSearchKey === 'default' ? 'task show' : `task show ${this.configSearchKey}`)}>
            Show Config
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Set / Remove Configuration</h3>
          <p class="text-xs text-text2 mb-3">
            Set a value: <code>task config name value</code>
            <br />
            Clear a value: <code>task config name ''</code>
            <br />
            Remove a key: <code>task config name</code>
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Config key
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., taskserver.server"
                value={this.configKey}
                onInput={(e: Event) => {
                  this.configKey = (e.target as HTMLInputElement).value;
                  this.commandPreview = `task config ${this.configKey} ${this.configValue}`.trim();
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Value (blank to clear, omit to remove)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="e.g., example.com:53589"
                value={this.configValue}
                onInput={(e: Event) => {
                  this.configValue = (e.target as HTMLInputElement).value;
                  this.commandPreview = `task config ${this.configKey} ${this.configValue}`.trim();
                }}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn" onClick={() => this.run(`task config ${this.configKey} ${this.configValue}`.trim())} disabled={!this.configKey.trim()}>
              Set Config
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              onClick={() => this.runDestructive(`task config ${this.configKey}`, `Remove config key "${this.configKey}"?`)}
              disabled={!this.configKey.trim()}
            >
              Remove Key
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Context</h3>
          <p class="text-xs text-text2 mb-3">
            Contexts filter all task reports. Defined with <code>task context define &lt;name&gt; &lt;filter&gt;</code>.
          </p>

          <div class="flex flex-wrap gap-2 mb-3">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run('task context list')}>
              List Contexts
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run('task context show')}>
              Active Context
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.run('task context none')}>
              Clear Context
            </button>
          </div>

          <div class="flex gap-2">
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="Context name"
              onInput={(e: Event) => {
                this.commandPreview = `task context ${(e.target as HTMLInputElement).value}`;
              }}
            />
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={(e: Event) => {
                const input = (e.target as HTMLElement).closest('.cli-card')?.querySelector('input[type="text"]');
                if (input) this.run(`task context ${(input as HTMLInputElement).value}`);
              }}
            >
              Set Context
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Command preview + output ──────────────────────────────────────────────

  renderCommandPreview() {
    return (
      <div class="cli-card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span class="text-text2 text-sm">Command Preview</span>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run(this.commandPreview)}>
              Execute
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview">{this.commandPreview}</div>
      </div>
    );
  }

  renderOutputPanel() {
    const statusColors: Record<CommandStatus, string> = {
      idle: 'text-text2',
      running: 'text-info',
      success: 'text-success',
      error: 'text-danger',
    };
    const statusIcon: Record<CommandStatus, string> = {
      idle: '○',
      running: '⏳',
      success: '✓',
      error: '✗',
    };

    return (
      <div class="cli-card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <span class={`font-semibold ${statusColors[this.status]}`}>{statusIcon[this.status]}</span>
            <span class="text-sm text-text2">{this.statusMessage}</span>
          </div>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>

        <div class="mb-2">
          <span class="text-xs text-text2">Last:</span>
          <code class="text-xs bg-bg3 px-2 py-1 rounded ml-2 font-mono">{this.lastCommand}</code>
        </div>

        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Raw command strip ─────────────────────────────────────────────────────

  renderRawStrip() {
    return (
      <div class="cli-card mt-4">
        <h3 class="text-text2 text-sm mb-2">Raw Command</h3>
        <div class="flex gap-2">
          <input
            type="text"
            class="cli-input flex-1 font-mono"
            placeholder="task ..."
            value={this.rawCommand}
            onInput={(e: Event) => {
              this.rawCommand = (e.target as HTMLInputElement).value;
            }}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') this.run(this.rawCommand);
            }}
          />
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.rawCommand)}>
            Run
          </button>
        </div>
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="pb-16">
        <header class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <span>✅</span> Taskwarrior GUI
            </h2>
            <p class="text-text2 text-sm">Command-line task tracker</p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() =>
                taskService.diagnostics().then(r => {
                  this.output = r.stdout;
                  this.lastCommand = 'task diagnostics';
                  this.status = 'success';
                })
              }
            >
              Diagnostics
            </button>
          </div>
        </header>

        {this.renderTabs()}

        <div>
          {this.activeTab === 'inbox' && this.renderInboxTab()}
          {this.activeTab === 'add' && this.renderAddTab()}
          {this.activeTab === 'filter' && this.renderFilterTab()}
          {this.activeTab === 'reports' && this.renderReportsTab()}
          {this.activeTab === 'calendar' && this.renderCalendarTab()}
          {this.activeTab === 'sync' && this.renderSyncTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
        </div>

        {this.renderCommandPreview()}
        {this.renderRawStrip()}
        {this.renderOutputPanel()}
      </div>
    );
  }
}
