import { Component, h, State } from '@stencil/core';
import { buildDiffCommand, buildLogCommand, buildPullCommand, buildPushCommand, GIT_DOCS, type LogFormatId, RESET_OPTIONS, validateRefName } from '../../git/git-command-builders';
import { type CommandResult, executeCommand, gitService } from '../../git/git-service';

const TABS = [
  { id: 'status', label: 'Status' },
  { id: 'history', label: 'History' },
  { id: 'branch', label: 'Branch' },
  { id: 'commit', label: 'Commit' },
  { id: 'sync', label: 'Sync' },
  { id: 'stash', label: 'Stash' },
  { id: 'advanced', label: 'Advanced' },
] as const;

type TabId = (typeof TABS)[number]['id'];

@Component({
  tag: 'git-gui',
  styleUrl: 'git-gui.css',
  scoped: true,
})
export class GitGui {
  @State() activeTab: TabId = 'status';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() output = 'Select an action to run a git command.';
  @State() lastCommand = 'Ready...';
  @State() statusMessage = 'Ready';

  // ── Status tab ───────────────────────────────────────────────────────────
  @State() statusShort = false;
  @State() diffMode: 'unstaged' | 'staged' | 'range' = 'unstaged';
  @State() diffFrom = 'HEAD~1';
  @State() diffTo = 'HEAD';
  @State() diffFile = '';
  @State() diffNameOnly = false;
  @State() showRef = 'HEAD';

  // ── History tab ──────────────────────────────────────────────────────────
  @State() logFormat: LogFormatId = 'oneline';
  @State() logLimit = 20;
  @State() logAuthor = '';
  @State() logSince = '';
  @State() logGrep = '';
  @State() logBranch = '';
  @State() blameFile = '';

  // ── Branch tab ───────────────────────────────────────────────────────────
  @State() branchAll = false;
  @State() newBranchName = '';
  @State() newBranchStart = '';
  @State() newBranchAndSwitch = false;
  @State() deleteBranchName = '';
  @State() switchBranchName = '';
  @State() mergeBranch = '';
  @State() mergeNoFF = false;
  @State() rebaseBranch = '';
  @State() branchRefError = '';
  @State() deleteRefError = '';

  // ── Commit tab ───────────────────────────────────────────────────────────
  @State() addPathspec = '.';
  @State() commitMessage = '';
  @State() commitAmend = false;

  // ── Sync tab ─────────────────────────────────────────────────────────────
  @State() fetchRemote = 'origin';
  @State() fetchPrune = false;
  @State() pullRemote = 'origin';
  @State() pullBranch = '';
  @State() pullRebase = false;
  @State() pushRemote = 'origin';
  @State() pushBranch = '';
  @State() pushForceWithLease = false;
  @State() pushSetUpstream = false;
  @State() pushTags = false;

  // ── Stash tab ────────────────────────────────────────────────────────────
  @State() stashMessage = '';
  @State() stashUntracked = false;
  @State() stashIndex = 0;

  // ── Advanced tab ─────────────────────────────────────────────────────────
  @State() resetMode: 'soft' | 'mixed' | 'hard' = 'mixed';
  @State() resetRef = 'HEAD~1';
  @State() cherryPickRef = '';
  @State() revertRef = 'HEAD';
  @State() revertNoCommit = false;
  @State() tagName = '';
  @State() tagMessage = '';
  @State() tagRef = '';
  @State() tagRefError = '';
  @State() remoteAddName = '';
  @State() remoteAddUrl = '';
  @State() remoteDeleteName = '';
  @State() configKey = '';
  @State() configValue = '';
  @State() configGlobal = false;
  @State() submoduleUpdateInit = true;
  @State() bisectPhase: 'idle' | 'started' = 'idle';
  @State() bisectRef = '';
  @State() rawCommand = '';
  @State() docsKey = 'status';

  // ── Helpers ───────────────────────────────────────────────────────────────

  private setTemporary(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2500);
    }
  }

  private async run(cmd: string, opts: { confirm?: boolean; confirmMsg?: string } = {}): Promise<void> {
    if (opts.confirm) {
      const msg = opts.confirmMsg ?? `Execute: ${cmd}?`;
      if (typeof window !== 'undefined' && !window.confirm(msg)) return;
    }
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running…';
    this.statusMessage = 'Running…';

    try {
      const res = await executeCommand(cmd);
      const sections = [res.stdout?.trim(), res.stderr?.trim() ? `stderr:\n${res.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output)';
      this.status = res.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = res.exitCode === 0 ? 'Completed' : `Failed (exit ${res.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async runFn(fn: () => Promise<CommandResult>, cmd: string, opts: { confirm?: boolean; confirmMsg?: string } = {}): Promise<void> {
    if (opts.confirm) {
      const msg = opts.confirmMsg ?? `Execute: ${cmd}?`;
      if (typeof window !== 'undefined' && !window.confirm(msg)) return;
    }
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running…';
    this.statusMessage = 'Running…';

    try {
      const res = await fn();
      const sections = [res.stdout?.trim(), res.stderr?.trim() ? `stderr:\n${res.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output)';
      this.status = res.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = res.exitCode === 0 ? 'Completed' : `Failed (exit ${res.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporary('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporary('Copied!');
  }

  // ── Computed preview ──────────────────────────────────────────────────────

  private diffPreview(): string {
    if (this.diffMode === 'staged') return buildDiffCommand('', '', true, this.diffNameOnly, this.diffFile);
    if (this.diffMode === 'range') return buildDiffCommand(this.diffFrom, this.diffTo, false, this.diffNameOnly, this.diffFile);
    return buildDiffCommand('', '', false, this.diffNameOnly, this.diffFile);
  }

  private logPreview(): string {
    return buildLogCommand(this.logFormat, this.logLimit, this.logAuthor, this.logSince, this.logGrep, this.logBranch);
  }

  private pushPreview(): string {
    return buildPushCommand(this.pushRemote, this.pushBranch, this.pushForceWithLease, this.pushSetUpstream, this.pushTags);
  }

  private pullPreview(): string {
    return buildPullCommand(this.pullRemote, this.pullBranch, this.pullRebase);
  }

  // ── Shared sub-renders ────────────────────────────────────────────────────

  private renderStatusBar() {
    const color = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';
    return (
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-text2">
          Status: <span class={color}>{this.statusMessage}</span>
        </span>
        <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
          Copy
        </button>
      </div>
    );
  }

  private renderCmdPreview(cmd: string) {
    return <div class="cli-cmd-preview font-mono text-sm mb-3">{cmd}</div>;
  }

  private renderOutput() {
    return <pre class="cli-output">{this.output}</pre>;
  }

  // ── Tab renders ───────────────────────────────────────────────────────────

  renderStatusTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Status */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Working Tree Status</h3>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.statusShort}
              onChange={(e: Event) => {
                this.statusShort = (e.target as HTMLInputElement).checked;
              }}
            />
            Short format (-s)
          </label>
          {this.renderCmdPreview(`git status${this.statusShort ? ' --short' : ''}`)}
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runFn(() => gitService.status(this.statusShort), `git status${this.statusShort ? ' -s' : ''}`)}>
            Run git status
          </button>
        </div>

        {/* Diff */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Diff</h3>
          <div class="flex gap-2 mb-3 flex-wrap">
            {(['unstaged', 'staged', 'range'] as const).map(m => (
              <button
                key={m}
                type="button"
                class={`cli-btn cli-btn-sm ${this.diffMode === m ? 'cli-btn-info' : ''}`}
                onClick={() => {
                  this.diffMode = m;
                }}
              >
                {m === 'unstaged' ? 'Unstaged' : m === 'staged' ? 'Staged' : 'Range'}
              </button>
            ))}
          </div>

          {this.diffMode === 'range' && (
            <div class="grid grid-cols-2 gap-2 mb-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                From
                <input
                  class="cli-input font-mono"
                  value={this.diffFrom}
                  onInput={(e: Event) => {
                    this.diffFrom = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                To
                <input
                  class="cli-input font-mono"
                  value={this.diffTo}
                  onInput={(e: Event) => {
                    this.diffTo = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            File (optional)
            <input
              class="cli-input font-mono"
              placeholder="path/to/file"
              value={this.diffFile}
              onInput={(e: Event) => {
                this.diffFile = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.diffNameOnly}
              onChange={(e: Event) => {
                this.diffNameOnly = (e.target as HTMLInputElement).checked;
              }}
            />
            Name only (--name-only)
          </label>
          {this.renderCmdPreview(this.diffPreview())}
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.diffPreview())}>
            Run diff
          </button>
        </div>

        {/* Show */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">git show</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Ref
            <input
              class="cli-input font-mono"
              value={this.showRef}
              onInput={(e: Event) => {
                this.showRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          {this.renderCmdPreview(`git show ${this.showRef}`)}
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runFn(() => gitService.show(this.showRef), `git show ${this.showRef}`)}>
            Show
          </button>
        </div>

        {/* Output */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Output</h3>
          {this.renderStatusBar()}
          {this.renderOutput()}
        </div>
      </div>
    );
  }

  renderHistoryTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Log Options</h3>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Format
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.logFormat = (e.target as HTMLSelectElement).value as LogFormatId;
                }}
              >
                {(
                  [
                    { id: 'oneline', label: 'One-line' },
                    { id: 'short', label: 'Short' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'full', label: 'Full' },
                    { id: 'graph', label: 'Graph (all)' },
                    { id: 'stat', label: 'Stat' },
                    { id: 'patch', label: 'Patch' },
                  ] as const
                ).map(f => (
                  <option key={f.id} value={f.id} selected={this.logFormat === f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Limit
              <input
                type="number"
                class="cli-input"
                min="1"
                max="500"
                value={this.logLimit}
                onInput={(e: Event) => {
                  this.logLimit = parseInt((e.target as HTMLInputElement).value, 10) || 20;
                }}
              />
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Author filter
            <input
              class="cli-input"
              placeholder="e.g. Alice"
              value={this.logAuthor}
              onInput={(e: Event) => {
                this.logAuthor = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Since
            <input
              class="cli-input"
              placeholder="e.g. 2024-01-01 or '2 weeks ago'"
              value={this.logSince}
              onInput={(e: Event) => {
                this.logSince = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Grep (commit message)
            <input
              class="cli-input"
              placeholder="e.g. fix:"
              value={this.logGrep}
              onInput={(e: Event) => {
                this.logGrep = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Branch / ref
            <input
              class="cli-input font-mono"
              placeholder="e.g. main"
              value={this.logBranch}
              onInput={(e: Event) => {
                this.logBranch = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          {this.renderCmdPreview(this.logPreview())}
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(this.logPreview())}>
            Run log
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">git blame</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            File
            <input
              class="cli-input font-mono"
              placeholder="path/to/file"
              value={this.blameFile}
              onInput={(e: Event) => {
                this.blameFile = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          {this.renderCmdPreview(`git blame ${this.blameFile || '<file>'}`)}
          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!this.blameFile.trim()}
            onClick={() => this.runFn(() => gitService.blame(this.blameFile), `git blame ${this.blameFile}`)}
          >
            Blame
          </button>

          <div class="mt-5">
            {this.renderStatusBar()}
            {this.renderOutput()}
          </div>
        </div>
      </div>
    );
  }

  renderBranchTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Branches</h3>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.branchAll}
              onChange={(e: Event) => {
                this.branchAll = (e.target as HTMLInputElement).checked;
              }}
            />
            Show all (local + remote)
          </label>
          {this.renderCmdPreview(`git branch${this.branchAll ? ' -a' : ''}`)}
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runFn(() => gitService.branchList(this.branchAll), `git branch${this.branchAll ? ' -a' : ''}`)}>
            List branches
          </button>
        </div>

        {/* Create / switch */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Branch</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Branch name
            <input
              class={`cli-input font-mono ${this.branchRefError ? 'cli-input-invalid' : ''}`}
              placeholder="feature/my-feature"
              value={this.newBranchName}
              onInput={(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this.newBranchName = v;
                const validation = validateRefName(v);
                this.branchRefError = validation.valid ? '' : (validation.error ?? '');
              }}
            />
            {this.branchRefError && <span class="cli-validation-message invalid">{this.branchRefError}</span>}
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Start point (optional)
            <input
              class="cli-input font-mono"
              placeholder="main"
              value={this.newBranchStart}
              onInput={(e: Event) => {
                this.newBranchStart = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.newBranchAndSwitch}
              onChange={(e: Event) => {
                this.newBranchAndSwitch = (e.target as HTMLInputElement).checked;
              }}
            />
            Switch to branch after creating (git switch -c)
          </label>
          {this.renderCmdPreview(
            this.newBranchAndSwitch
              ? `git switch -c ${this.newBranchName || '<name>'}${this.newBranchStart ? ` ${this.newBranchStart}` : ''}`
              : `git branch ${this.newBranchName || '<name>'}${this.newBranchStart ? ` ${this.newBranchStart}` : ''}`,
          )}
          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!this.newBranchName.trim() || !!this.branchRefError}
            onClick={() => {
              if (this.newBranchAndSwitch) {
                this.runFn(() => gitService.switchBranch(this.newBranchName, true), `git switch -c ${this.newBranchName}`);
              } else {
                this.runFn(
                  () => gitService.branchCreate(this.newBranchName, this.newBranchStart),
                  `git branch ${this.newBranchName}${this.newBranchStart ? ` ${this.newBranchStart}` : ''}`,
                );
              }
            }}
          >
            Create
          </button>
        </div>

        {/* Switch */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Switch Branch</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Branch name
            <input
              class="cli-input font-mono"
              placeholder="main"
              value={this.switchBranchName}
              onInput={(e: Event) => {
                this.switchBranchName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          {this.renderCmdPreview(`git switch ${this.switchBranchName || '<branch>'}`)}
          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!this.switchBranchName.trim()}
            onClick={() => this.runFn(() => gitService.switchBranch(this.switchBranchName), `git switch ${this.switchBranchName}`)}
          >
            Switch
          </button>
        </div>

        {/* Delete */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Delete Branch</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Branch name
            <input
              class={`cli-input font-mono ${this.deleteRefError ? 'cli-input-invalid' : ''}`}
              placeholder="old-feature"
              value={this.deleteBranchName}
              onInput={(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this.deleteBranchName = v;
                const validation = validateRefName(v);
                this.deleteRefError = validation.valid ? '' : (validation.error ?? '');
              }}
            />
            {this.deleteRefError && <span class="cli-validation-message invalid">{this.deleteRefError}</span>}
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              disabled={!this.deleteBranchName.trim() || !!this.deleteRefError}
              onClick={() => this.runFn(() => gitService.branchDelete(this.deleteBranchName, false), `git branch -d ${this.deleteBranchName}`)}
            >
              Delete (-d)
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              disabled={!this.deleteBranchName.trim() || !!this.deleteRefError}
              onClick={() =>
                this.runFn(() => gitService.branchDelete(this.deleteBranchName, true), `git branch -D ${this.deleteBranchName}`, {
                  confirm: true,
                  confirmMsg: `Force-delete branch "${this.deleteBranchName}"? This cannot be undone if the branch is unmerged.`,
                })
              }
            >
              Force Delete (-D) ⚠
            </button>
          </div>
        </div>

        {/* Merge / Rebase */}
        <div class="cli-card xl:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h3 class="text-text2 text-base mb-3">Merge</h3>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
                Branch to merge
                <input
                  class="cli-input font-mono"
                  placeholder="feature-branch"
                  value={this.mergeBranch}
                  onInput={(e: Event) => {
                    this.mergeBranch = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex items-center gap-2 text-sm text-text2 mb-3">
                <input
                  type="checkbox"
                  checked={this.mergeNoFF}
                  onChange={(e: Event) => {
                    this.mergeNoFF = (e.target as HTMLInputElement).checked;
                  }}
                />
                No fast-forward (--no-ff)
              </label>
              {this.renderCmdPreview(`git merge${this.mergeNoFF ? ' --no-ff' : ''} ${this.mergeBranch || '<branch>'}`)}
              <button
                type="button"
                class="cli-btn cli-btn-info"
                disabled={!this.mergeBranch.trim()}
                onClick={() => this.runFn(() => gitService.merge(this.mergeBranch, this.mergeNoFF), `git merge${this.mergeNoFF ? ' --no-ff' : ''} ${this.mergeBranch}`)}
              >
                Merge
              </button>
            </div>

            <div>
              <h3 class="text-text2 text-base mb-1">Rebase</h3>
              <p class="text-xs text-warning mb-3">⚠ Rebase rewrites history. Do not rebase branches shared with others. Interactive rebase (-i) must be run in a terminal.</p>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
                Target branch/ref
                <input
                  class="cli-input font-mono"
                  placeholder="main"
                  value={this.rebaseBranch}
                  onInput={(e: Event) => {
                    this.rebaseBranch = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              {this.renderCmdPreview(`git rebase ${this.rebaseBranch || '<target>'}`)}
              <div class="flex gap-2 flex-wrap">
                <button
                  type="button"
                  class="cli-btn cli-btn-warning"
                  disabled={!this.rebaseBranch.trim()}
                  onClick={() =>
                    this.runFn(() => gitService.rebase(this.rebaseBranch), `git rebase ${this.rebaseBranch}`, {
                      confirm: true,
                      confirmMsg: `Rebase current branch onto "${this.rebaseBranch}"? This rewrites history.`,
                    })
                  }
                >
                  Rebase
                </button>
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runFn(() => gitService.abortRebase(), 'git rebase --abort')}>
                  Abort
                </button>
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runFn(() => gitService.continueRebase(), 'git rebase --continue')}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          {this.renderStatusBar()}
          {this.renderOutput()}
        </div>
      </div>
    );
  }

  renderCommitTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Stage */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Stage Files</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Pathspec
            <input
              class="cli-input font-mono"
              placeholder=". or src/file.ts"
              value={this.addPathspec}
              onInput={(e: Event) => {
                this.addPathspec = (e.target as HTMLInputElement).value;
              }}
            />
            <span class="text-xs text-text2">
              Use <code>.</code> for all files
            </span>
          </label>
          {this.renderCmdPreview(`git add ${this.addPathspec}`)}
          <div class="flex gap-2 flex-wrap">
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.runFn(() => gitService.add(this.addPathspec), `git add ${this.addPathspec}`)}>
              git add
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => this.runFn(() => gitService.restore(this.addPathspec, true), `git restore --staged ${this.addPathspec}`)}
            >
              Unstage (restore --staged)
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() =>
                this.runFn(() => gitService.restore(this.addPathspec, false), `git restore ${this.addPathspec}`, {
                  confirm: true,
                  confirmMsg: `Discard working tree changes to "${this.addPathspec}"? This cannot be undone.`,
                })
              }
            >
              Discard changes ⚠
            </button>
          </div>
        </div>

        {/* Commit */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Commit</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Commit message
            <textarea
              class="cli-input w-full h-24"
              placeholder="feat: add awesome feature"
              onInput={(e: Event) => {
                this.commitMessage = (e.target as HTMLTextAreaElement).value;
              }}
            >
              {this.commitMessage}
            </textarea>
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.commitAmend}
              onChange={(e: Event) => {
                this.commitAmend = (e.target as HTMLInputElement).checked;
              }}
            />
            Amend last commit (--amend)
            {this.commitAmend && <span class="text-xs text-warning ml-1">⚠ Rewrites history</span>}
          </label>

          {this.renderCmdPreview(`git commit${this.commitAmend ? ' --amend' : ''} -m ${JSON.stringify(this.commitMessage || '...')}`)}

          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!this.commitMessage.trim()}
            onClick={() => {
              const msg = `git commit${this.commitAmend ? ' --amend' : ''} -m ${JSON.stringify(this.commitMessage)}`;
              const opts = this.commitAmend ? { confirm: true, confirmMsg: 'Amend last commit? This rewrites history and should not be used on pushed commits.' } : {};
              this.runFn(() => gitService.commit(this.commitMessage, this.commitAmend), msg, opts);
            }}
          >
            Commit
          </button>
        </div>

        <div class="cli-card xl:col-span-2">
          {this.renderStatusBar()}
          {this.renderOutput()}
        </div>
      </div>
    );
  }

  renderSyncTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Fetch */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Fetch</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Remote
            <input
              class="cli-input"
              placeholder="origin"
              value={this.fetchRemote}
              onInput={(e: Event) => {
                this.fetchRemote = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.fetchPrune}
              onChange={(e: Event) => {
                this.fetchPrune = (e.target as HTMLInputElement).checked;
              }}
            />
            Prune deleted remote branches (--prune)
          </label>
          {this.renderCmdPreview(`git fetch ${this.fetchRemote}${this.fetchPrune ? ' --prune' : ''}`)}
          <button
            type="button"
            class="cli-btn cli-btn-info"
            onClick={() => this.runFn(() => gitService.fetch(this.fetchRemote, this.fetchPrune), `git fetch ${this.fetchRemote}${this.fetchPrune ? ' --prune' : ''}`)}
          >
            Fetch
          </button>
        </div>

        {/* Pull */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Pull</h3>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Remote
              <input
                class="cli-input"
                placeholder="origin"
                value={this.pullRemote}
                onInput={(e: Event) => {
                  this.pullRemote = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Branch (optional)
              <input
                class="cli-input font-mono"
                placeholder="main"
                value={this.pullBranch}
                onInput={(e: Event) => {
                  this.pullBranch = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.pullRebase}
              onChange={(e: Event) => {
                this.pullRebase = (e.target as HTMLInputElement).checked;
              }}
            />
            Rebase instead of merge (--rebase)
          </label>
          {this.renderCmdPreview(this.pullPreview())}
          <button
            type="button"
            class="cli-btn cli-btn-info"
            onClick={() => this.runFn(() => gitService.pull(this.pullRemote, this.pullBranch, this.pullRebase), this.pullPreview())}
          >
            Pull
          </button>
        </div>

        {/* Push */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Push</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Remote
              <input
                class="cli-input"
                placeholder="origin"
                value={this.pushRemote}
                onInput={(e: Event) => {
                  this.pushRemote = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Branch (optional)
              <input
                class="cli-input font-mono"
                placeholder="feature-branch"
                value={this.pushBranch}
                onInput={(e: Event) => {
                  this.pushBranch = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="flex flex-col gap-2 text-sm text-text2">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={this.pushSetUpstream}
                  onChange={(e: Event) => {
                    this.pushSetUpstream = (e.target as HTMLInputElement).checked;
                  }}
                />
                Set upstream (-u)
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={this.pushTags}
                  onChange={(e: Event) => {
                    this.pushTags = (e.target as HTMLInputElement).checked;
                  }}
                />
                Push tags (--tags)
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={this.pushForceWithLease}
                  onChange={(e: Event) => {
                    this.pushForceWithLease = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span>Force with lease ⚠ (--force-with-lease)</span>
              </label>
            </div>
          </div>
          {this.renderCmdPreview(this.pushPreview())}
          <div class="flex gap-2">
            <button
              type="button"
              class={`cli-btn ${this.pushForceWithLease ? 'cli-btn-danger' : 'cli-btn-info'}`}
              onClick={() => {
                const cmd = this.pushPreview();
                const opts = this.pushForceWithLease ? { confirm: true, confirmMsg: `Push with --force-with-lease to ${this.pushRemote}? This may overwrite remote history.` } : {};
                this.run(cmd, opts);
              }}
            >
              {this.pushForceWithLease ? 'Push (force-with-lease) ⚠' : 'Push'}
            </button>
          </div>
          <p class="text-xs text-text2 mt-2">
            Note: plain <code>--force</code> is not offered — use <code>--force-with-lease</code> for safer force pushes.
          </p>
        </div>

        {/* Remote management */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Remotes</h3>
          <button type="button" class="cli-btn cli-btn-sm cli-btn-success mb-3" onClick={() => this.runFn(() => gitService.remoteList(), 'git remote -v')}>
            List remotes
          </button>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Name
              <input
                class="cli-input"
                placeholder="upstream"
                value={this.remoteAddName}
                onInput={(e: Event) => {
                  this.remoteAddName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              URL
              <input
                class="cli-input"
                placeholder="https://github.com/org/repo"
                value={this.remoteAddUrl}
                onInput={(e: Event) => {
                  this.remoteAddUrl = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-sm cli-btn-info mb-3"
            disabled={!this.remoteAddName.trim() || !this.remoteAddUrl.trim()}
            onClick={() => this.runFn(() => gitService.remoteAdd(this.remoteAddName, this.remoteAddUrl), `git remote add ${this.remoteAddName} ${this.remoteAddUrl}`)}
          >
            Add remote
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Remove remote
            <input
              class="cli-input"
              placeholder="upstream"
              value={this.remoteDeleteName}
              onInput={(e: Event) => {
                this.remoteDeleteName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm cli-btn-danger"
            disabled={!this.remoteDeleteName.trim()}
            onClick={() =>
              this.runFn(() => gitService.remoteRemove(this.remoteDeleteName), `git remote remove ${this.remoteDeleteName}`, {
                confirm: true,
                confirmMsg: `Remove remote "${this.remoteDeleteName}"?`,
              })
            }
          >
            Remove remote ⚠
          </button>
        </div>

        <div class="cli-card">
          {this.renderStatusBar()}
          {this.renderOutput()}
        </div>
      </div>
    );
  }

  renderStashTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Stash Push</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Message (optional)
            <input
              class="cli-input"
              placeholder="WIP: my work"
              value={this.stashMessage}
              onInput={(e: Event) => {
                this.stashMessage = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.stashUntracked}
              onChange={(e: Event) => {
                this.stashUntracked = (e.target as HTMLInputElement).checked;
              }}
            />
            Include untracked (-u)
          </label>
          {this.renderCmdPreview(`git stash push${this.stashUntracked ? ' -u' : ''}${this.stashMessage ? ` -m ${JSON.stringify(this.stashMessage)}` : ''}`)}
          <button
            type="button"
            class="cli-btn cli-btn-info"
            onClick={() =>
              this.runFn(
                () => gitService.stashPush(this.stashMessage, this.stashUntracked),
                `git stash push${this.stashUntracked ? ' -u' : ''}${this.stashMessage ? ` -m "${this.stashMessage}"` : ''}`,
              )
            }
          >
            Stash
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Stash Operations</h3>
          <button type="button" class="cli-btn cli-btn-sm cli-btn-success mb-3 block" onClick={() => this.runFn(() => gitService.stashList(), 'git stash list')}>
            List stashes
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Stash index (for pop/apply/drop/show)
            <input
              type="number"
              class="cli-input w-24"
              min="0"
              value={this.stashIndex}
              onInput={(e: Event) => {
                this.stashIndex = parseInt((e.target as HTMLInputElement).value, 10) || 0;
              }}
            />
          </label>
          <div class="flex gap-2 flex-wrap mt-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.runFn(() => gitService.stashShow(this.stashIndex), `git stash show -p stash@{${this.stashIndex}}`)}
            >
              Show
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-info"
              onClick={() => this.runFn(() => gitService.stashApply(this.stashIndex), `git stash apply stash@{${this.stashIndex}}`)}
            >
              Apply (keep)
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-info"
              onClick={() => this.runFn(() => gitService.stashPop(this.stashIndex), `git stash pop stash@{${this.stashIndex}}`)}
            >
              Pop (remove)
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() =>
                this.runFn(() => gitService.stashDrop(this.stashIndex), `git stash drop stash@{${this.stashIndex}}`, {
                  confirm: true,
                  confirmMsg: `Drop stash@{${this.stashIndex}}? This cannot be undone.`,
                })
              }
            >
              Drop ⚠
            </button>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          {this.renderStatusBar()}
          {this.renderOutput()}
        </div>
      </div>
    );
  }

  renderAdvancedTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Reset */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Reset</h3>
          <div class="space-y-2 mb-3">
            {RESET_OPTIONS.map(opt => (
              <label key={opt.mode} class="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="reset-mode"
                  value={opt.mode}
                  checked={this.resetMode === opt.mode}
                  onChange={() => {
                    this.resetMode = opt.mode;
                  }}
                  class="mt-0.5"
                />
                <div>
                  <span class={`font-mono ${opt.destructive ? 'text-danger' : 'text-info'}`}>{opt.label}</span>
                  <p class="text-xs text-text2 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Target ref
            <input
              class="cli-input font-mono"
              value={this.resetRef}
              onInput={(e: Event) => {
                this.resetRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          {this.renderCmdPreview(`git reset --${this.resetMode} ${this.resetRef}`)}
          <button
            type="button"
            class={`cli-btn ${this.resetMode === 'hard' ? 'cli-btn-danger' : 'cli-btn-warning'}`}
            onClick={() =>
              this.runFn(
                () => gitService.reset(this.resetMode, this.resetRef),
                `git reset --${this.resetMode} ${this.resetRef}`,
                this.resetMode === 'hard' ? { confirm: true, confirmMsg: `git reset --hard ${this.resetRef} will PERMANENTLY DISCARD all uncommitted changes. Continue?` } : {},
              )
            }
          >
            Reset {this.resetMode === 'hard' ? '⚠' : ''}
          </button>
        </div>

        {/* Cherry-pick / Revert */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Cherry-pick</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Commit ref
            <input
              class="cli-input font-mono"
              placeholder="abc1234"
              value={this.cherryPickRef}
              onInput={(e: Event) => {
                this.cherryPickRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          {this.renderCmdPreview(`git cherry-pick ${this.cherryPickRef || '<ref>'}`)}
          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!this.cherryPickRef.trim()}
            onClick={() => this.runFn(() => gitService.cherryPick(this.cherryPickRef), `git cherry-pick ${this.cherryPickRef}`)}
          >
            Cherry-pick
          </button>

          <h3 class="text-text2 text-base mb-3 mt-5">Revert</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Commit ref
            <input
              class="cli-input font-mono"
              value={this.revertRef}
              onInput={(e: Event) => {
                this.revertRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.revertNoCommit}
              onChange={(e: Event) => {
                this.revertNoCommit = (e.target as HTMLInputElement).checked;
              }}
            />
            --no-commit (stage changes, don't auto-commit)
          </label>
          {this.renderCmdPreview(`git revert${this.revertNoCommit ? ' --no-commit' : ''} ${this.revertRef}`)}
          <button
            type="button"
            class="cli-btn cli-btn-warning"
            onClick={() => this.runFn(() => gitService.revert(this.revertRef, this.revertNoCommit), `git revert${this.revertNoCommit ? ' --no-commit' : ''} ${this.revertRef}`)}
          >
            Revert
          </button>
        </div>

        {/* Tags */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Tags</h3>
          <button type="button" class="cli-btn cli-btn-sm cli-btn-success mb-3" onClick={() => this.runFn(() => gitService.tagList(), 'git tag -l --sort=-version:refname')}>
            List tags
          </button>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Tag name
            <input
              class={`cli-input font-mono ${this.tagRefError ? 'cli-input-invalid' : ''}`}
              placeholder="v1.0.0"
              value={this.tagName}
              onInput={(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this.tagName = v;
                const val = validateRefName(v);
                this.tagRefError = val.valid ? '' : (val.error ?? '');
              }}
            />
            {this.tagRefError && <span class="cli-validation-message invalid">{this.tagRefError}</span>}
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Annotation message (optional — creates annotated tag)
            <input
              class="cli-input"
              placeholder="Release v1.0.0"
              value={this.tagMessage}
              onInput={(e: Event) => {
                this.tagMessage = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Target ref (optional)
            <input
              class="cli-input font-mono"
              placeholder="HEAD or abc1234"
              value={this.tagRef}
              onInput={(e: Event) => {
                this.tagRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-info"
              disabled={!this.tagName.trim() || !!this.tagRefError}
              onClick={() =>
                this.runFn(
                  () => gitService.tagCreate(this.tagName, this.tagMessage, this.tagRef),
                  `git tag${this.tagMessage ? ` -a -m "${this.tagMessage}"` : ''} ${this.tagName}${this.tagRef ? ` ${this.tagRef}` : ''}`,
                )
              }
            >
              Create tag
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              disabled={!this.tagName.trim() || !!this.tagRefError}
              onClick={() => this.runFn(() => gitService.tagDelete(this.tagName), `git tag -d ${this.tagName}`, { confirm: true, confirmMsg: `Delete tag "${this.tagName}"?` })}
            >
              Delete tag ⚠
            </button>
          </div>
        </div>

        {/* Clean */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Clean Working Tree</h3>
          <p class="text-sm text-text2 mb-3">
            <code>git clean</code> removes untracked files/directories. Always do a dry-run first.
          </p>
          {this.renderCmdPreview('git clean -nfd  →  git clean -fd')}
          <div class="flex gap-2 flex-wrap">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.runFn(() => gitService.cleanDryRun(), 'git clean -nfd')}>
              Dry-run (preview)
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() =>
                this.runFn(() => gitService.clean(), 'git clean -fd', {
                  confirm: true,
                  confirmMsg: 'git clean -fd will permanently delete all untracked files and directories. Are you sure?',
                })
              }
            >
              Clean (delete untracked) ⚠
            </button>
          </div>
        </div>

        {/* Config */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Config</h3>
          <label class="flex items-center gap-2 text-sm text-text2 mb-2">
            <input
              type="checkbox"
              checked={this.configGlobal}
              onChange={(e: Event) => {
                this.configGlobal = (e.target as HTMLInputElement).checked;
              }}
            />
            Global (--global)
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm cli-btn-success mb-3"
            onClick={() => this.runFn(() => gitService.configList(this.configGlobal), `git config${this.configGlobal ? ' --global' : ''} --list`)}
          >
            List config
          </button>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Key
              <input
                class="cli-input font-mono"
                placeholder="user.email"
                value={this.configKey}
                onInput={(e: Event) => {
                  this.configKey = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Value
              <input
                class="cli-input"
                placeholder="you@example.com"
                value={this.configValue}
                onInput={(e: Event) => {
                  this.configValue = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-sm cli-btn-info"
            disabled={!this.configKey.trim()}
            onClick={() =>
              this.runFn(
                () => gitService.configSet(this.configKey, this.configValue, this.configGlobal),
                `git config${this.configGlobal ? ' --global' : ''} ${this.configKey} "${this.configValue}"`,
              )
            }
          >
            Set config
          </button>
        </div>

        {/* Bisect */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Bisect</h3>
          <p class="text-sm text-text2 mb-3">Binary search for the commit introducing a bug.</p>
          <div class="flex gap-2 flex-wrap mb-3">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-info"
              disabled={this.bisectPhase === 'started'}
              onClick={() => {
                this.bisectPhase = 'started';
                this.runFn(() => gitService.bisectStart(), 'git bisect start');
              }}
            >
              Start
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              disabled={this.bisectPhase !== 'started'}
              onClick={() => this.runFn(() => gitService.bisectGood(this.bisectRef), `git bisect good${this.bisectRef ? ` ${this.bisectRef}` : ''}`)}
            >
              Good
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              disabled={this.bisectPhase !== 'started'}
              onClick={() => this.runFn(() => gitService.bisectBad(this.bisectRef), `git bisect bad${this.bisectRef ? ` ${this.bisectRef}` : ''}`)}
            >
              Bad
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => {
                this.bisectPhase = 'idle';
                this.runFn(() => gitService.bisectReset(), 'git bisect reset');
              }}
            >
              Reset
            </button>
          </div>
          <label class="flex flex-col gap-1 text-sm text-text2">
            Ref (optional for good/bad)
            <input
              class="cli-input font-mono"
              placeholder="abc1234"
              value={this.bisectRef}
              onInput={(e: Event) => {
                this.bisectRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
        </div>

        {/* Worktree / Submodule */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Worktree &amp; Submodule</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.runFn(() => gitService.worktreeList(), 'git worktree list')}>
              Worktree list
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.runFn(() => gitService.submoduleStatus(), 'git submodule status')}>
              Submodule status
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-info"
              onClick={() => this.runFn(() => gitService.submoduleUpdate(true), 'git submodule update --init --recursive')}
            >
              Submodule update --init
            </button>
          </div>
        </div>

        {/* Raw escape hatch */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Raw Command</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command
            <input
              class="cli-input w-full font-mono"
              placeholder="git log --oneline -5"
              value={this.rawCommand}
              onInput={(e: Event) => {
                this.rawCommand = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          {this.renderCmdPreview(this.rawCommand || 'git …')}
          <button type="button" class="cli-btn cli-btn-success" disabled={!this.rawCommand.trim()} onClick={() => this.run(this.rawCommand)}>
            Execute
          </button>
        </div>

        {/* Documentation */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Quick Reference</h3>
          <div class="flex flex-wrap gap-2 mb-3">
            {Object.keys(GIT_DOCS).map(key => (
              <button
                key={key}
                type="button"
                class={`cli-btn cli-btn-sm ${this.docsKey === key ? 'cli-btn-info' : ''}`}
                onClick={() => {
                  this.docsKey = key;
                }}
              >
                {key}
              </button>
            ))}
          </div>
          {(() => {
            const doc = GIT_DOCS[this.docsKey];
            if (!doc) return null;
            return (
              <div>
                <p class="font-mono text-sm mb-1">{doc.synopsis}</p>
                <p class="text-sm text-text2 mb-3">{doc.description}</p>
                <div class="space-y-1 mb-3">
                  {doc.flags.map((f, i) => (
                    <div key={i} class="flex gap-3 text-sm">
                      <code class="text-info w-40 shrink-0">{f.flag}</code>
                      <span class="text-text2">{f.description}</span>
                    </div>
                  ))}
                </div>
                <div class="space-y-1">
                  {doc.examples.map((ex, i) => (
                    <div key={i} class="flex gap-3 items-center p-2 bg-bg3 rounded text-sm">
                      <code class="font-mono flex-1">{ex.command}</code>
                      <span class="text-text2 text-xs">{ex.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div class="cli-card xl:col-span-2">
          {this.renderStatusBar()}
          {this.renderOutput()}
        </div>
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🌿</span> Git GUI
          </h2>
          <p class="text-text2 text-sm">Visual interface for git — version control system</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
              onClick={() => {
                this.activeTab = tab.id;
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {this.activeTab === 'status' && this.renderStatusTab()}
          {this.activeTab === 'history' && this.renderHistoryTab()}
          {this.activeTab === 'branch' && this.renderBranchTab()}
          {this.activeTab === 'commit' && this.renderCommitTab()}
          {this.activeTab === 'sync' && this.renderSyncTab()}
          {this.activeTab === 'stash' && this.renderStashTab()}
          {this.activeTab === 'advanced' && this.renderAdvancedTab()}
        </div>
      </div>
    );
  }
}
