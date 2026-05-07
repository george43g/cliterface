import { Component, h, State } from '@stencil/core';
import { z } from 'zod';
import { type CommandResult, ghApi, ghAuth, ghGist, ghIssue, ghPr, ghRelease, ghRepo, ghRun, ghWorkflow } from '../../gh/gh-service';

// ── Zod schemas ────────────────────────────────────────────────────────────────

const OwnerRepoSchema = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'Must be owner/repo format');

const IssueNumberSchema = z.coerce.number().int().positive('Must be a positive integer');

// ── Tab definitions ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'auth', label: 'Auth' },
  { id: 'repos', label: 'Repos' },
  { id: 'issues', label: 'Issues' },
  { id: 'prs', label: 'PRs' },
  { id: 'actions', label: 'Actions' },
  { id: 'releases', label: 'Releases' },
  { id: 'gist', label: 'Gist' },
  { id: 'api', label: 'API' },
];

@Component({
  tag: 'gh-gui',
  styleUrl: 'gh-gui.css',
  scoped: true,
})
export class GhGui {
  // ── Shared state ────────────────────────────────────────────────────────────
  @State() activeTab = 'auth';
  @State() lastCommand = 'Ready…';
  @State() output = 'Select a tab and run a command.';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';

  // ── Shared repo field (used across tabs) ───────────────────────────────────
  @State() globalRepo = '';

  // ── Auth ────────────────────────────────────────────────────────────────────
  @State() authLogoutHostname = '';
  @State() authRefreshScopes = '';

  // ── Repos ───────────────────────────────────────────────────────────────────
  @State() repoListOrg = '';
  @State() repoListLimit = 30;
  @State() repoViewTarget = '';
  @State() repoCreateName = '';
  @State() repoCreateDesc = '';
  @State() repoCreatePrivate = false;
  @State() repoCreateClone = false;
  @State() repoCloneTarget = '';
  @State() repoCloneDir = '';
  @State() repoForkTarget = '';
  @State() repoForkClone = false;
  @State() repoDeleteTarget = '';

  // ── Issues ───────────────────────────────────────────────────────────────────
  @State() issueState: 'open' | 'closed' | 'all' = 'open';
  @State() issueLimit = 20;
  @State() issueLabel = '';
  @State() issueAssignee = '';
  @State() issueViewNumber = '';
  @State() issueCreateTitle = '';
  @State() issueCreateBody = '';
  @State() issueCreateLabel = '';
  @State() issueCreateAssignee = '';
  @State() issueActionNumber = '';
  @State() issueCommentBody = '';

  // ── PRs ──────────────────────────────────────────────────────────────────────
  @State() prState: 'open' | 'closed' | 'merged' | 'all' = 'open';
  @State() prLimit = 20;
  @State() prViewNumber = '';
  @State() prCreateTitle = '';
  @State() prCreateBody = '';
  @State() prCreateBase = 'main';
  @State() prCreateDraft = false;
  @State() prActionNumber = '';
  @State() prMergeMethod: 'merge' | 'squash' | 'rebase' = 'merge';

  // ── Actions ──────────────────────────────────────────────────────────────────
  @State() runLimit = 20;
  @State() runStatus = '';
  @State() runWorkflowFilter = '';
  @State() runViewId = '';
  @State() runActionId = '';
  @State() runRerunFailedOnly = false;
  @State() workflowName = '';
  @State() workflowRef = '';

  // ── Releases ─────────────────────────────────────────────────────────────────
  @State() releaseLimit = 10;
  @State() releaseTag = '';
  @State() releaseCreateTag = '';
  @State() releaseCreateTitle = '';
  @State() releaseCreateNotes = '';
  @State() releaseCreateDraft = false;
  @State() releaseCreatePrerelease = false;
  @State() releaseDeleteTag = '';

  // ── Gist ─────────────────────────────────────────────────────────────────────
  @State() gistLimit = 20;
  @State() gistViewId = '';
  @State() gistDeleteId = '';
  @State() gistCreateFilename = '';
  @State() gistCreateDesc = '';
  @State() gistCreatePublic = false;

  // ── API ──────────────────────────────────────────────────────────────────────
  @State() apiEndpoint = '/user';
  @State() apiMethod: 'GET' | 'POST' | 'graphql' = 'GET';
  @State() apiPaginate = false;
  @State() apiFields = '';
  @State() apiGraphqlQuery = 'query { viewer { login } }';

  // ── Validation errors ────────────────────────────────────────────────────────
  @State() validationError = '';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private validateOwnerRepo(repo: string): string | null {
    const result = OwnerRepoSchema.safeParse(repo);
    if (!result.success) return result.error.issues[0]?.message ?? 'Invalid repo';
    return null;
  }

  private validateIssueNumber(n: string): number | null {
    const result = IssueNumberSchema.safeParse(n);
    return result.success ? result.data : null;
  }

  private async run(promise: Promise<CommandResult>, preview: string): Promise<void> {
    this.validationError = '';
    this.status = 'running';
    this.lastCommand = preview;
    this.output = 'Running…';
    this.statusMessage = 'Running…';

    try {
      const result = await promise;
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Exit ${result.exitCode}`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private confirm(action: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.confirm(`Confirm destructive action:\n${action}`);
  }

  private statusClass(): string {
    if (this.status === 'error') return 'text-danger';
    if (this.status === 'success') return 'text-success';
    if (this.status === 'running') return 'text-warning';
    return 'text-text2';
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  private renderTabs() {
    return (
      <div class="flex flex-wrap gap-1 border-b border-accent2 mb-4 pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
              this.validationError = '';
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  private renderOutputPanel() {
    return (
      <div class="cli-card mt-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-text2 text-sm">
            Status: <span class={this.statusClass()}>{this.statusMessage}</span>
          </span>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={async () => {
              if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(this.output);
              }
            }}
          >
            Copy
          </button>
        </div>
        <div class="cli-cmd-preview text-sm mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  private renderRepoField(label = 'Repository (owner/repo)', stateKey: 'globalRepo' = 'globalRepo') {
    const val = this[stateKey];
    const err = val ? this.validateOwnerRepo(val) : null;
    return (
      <label class="flex flex-col gap-1 text-sm text-text2">
        {label}
        <input
          type="text"
          class={`cli-input w-full font-mono ${val && err ? 'cli-input-invalid' : val && !err ? 'cli-input-valid' : ''}`}
          placeholder="owner/repo"
          value={val}
          onInput={(e: Event) => {
            this[stateKey] = (e.target as HTMLInputElement).value;
          }}
        />
        {val && err && <span class="cli-validation-message invalid">{err}</span>}
      </label>
    );
  }

  // ── Tab renderers ─────────────────────────────────────────────────────────────

  private renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Status */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Authentication Status</h3>
          <p class="text-sm text-text2 mb-3">Check logged-in accounts and hosts.</p>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(ghAuth.status(), 'gh auth status')}>
            gh auth status
          </button>
        </div>

        {/* Token */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Print Token</h3>
          <p class="text-sm text-text2 mb-3">Print the current auth token (handle with care).</p>
          <button type="button" class="cli-btn" onClick={() => this.run(ghAuth.token(), 'gh auth token')}>
            gh auth token
          </button>
        </div>

        {/* Login */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Login</h3>
          <p class="text-sm text-text2 mb-3">Authenticate via browser OAuth flow.</p>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(ghAuth.login(true), 'gh auth login --web')}>
            gh auth login --web
          </button>
        </div>

        {/* Refresh */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Refresh / Add Scopes</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Scopes (comma-separated, optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="repo,workflow,read:org"
              value={this.authRefreshScopes}
              onInput={(e: Event) => {
                this.authRefreshScopes = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn"
            onClick={() => this.run(ghAuth.refresh(this.authRefreshScopes), `gh auth refresh${this.authRefreshScopes ? ` --scopes ${this.authRefreshScopes}` : ''}`)}
          >
            gh auth refresh
          </button>
        </div>

        {/* Logout */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Logout</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Hostname (optional, e.g. github.com)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="github.com"
              value={this.authLogoutHostname}
              onInput={(e: Event) => {
                this.authLogoutHostname = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-warning"
            onClick={() => {
              if (this.confirm('gh auth logout')) {
                this.run(ghAuth.logout(this.authLogoutHostname), `gh auth logout${this.authLogoutHostname ? ` --hostname ${this.authLogoutHostname}` : ''}`);
              }
            }}
          >
            gh auth logout
          </button>
        </div>
      </div>
    );
  }

  private renderReposTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List repos */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Repositories</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Org / User (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="my-org"
                value={this.repoListOrg}
                onInput={(e: Event) => {
                  this.repoListOrg = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Limit
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="100"
                value={this.repoListLimit}
                onInput={(e: Event) => {
                  this.repoListLimit = Number((e.target as HTMLInputElement).value) || 30;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(
                ghRepo.list({ org: this.repoListOrg || undefined, limit: this.repoListLimit }),
                `gh repo list${this.repoListOrg ? ` ${this.repoListOrg}` : ''} --limit ${this.repoListLimit}`,
              )
            }
          >
            List Repos
          </button>
        </div>

        {/* View repo */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">View Repository</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Repository (owner/repo)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="owner/repo"
              value={this.repoViewTarget}
              onInput={(e: Event) => {
                this.repoViewTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const err = this.validateOwnerRepo(this.repoViewTarget);
              if (err) {
                this.validationError = err;
                return;
              }
              this.run(ghRepo.view(this.repoViewTarget), `gh repo view ${this.repoViewTarget}`);
            }}
          >
            View
          </button>
        </div>

        {/* Create repo */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Repository</h3>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="my-new-repo"
                value={this.repoCreateName}
                onInput={(e: Event) => {
                  this.repoCreateName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Description (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="A short description"
                value={this.repoCreateDesc}
                onInput={(e: Event) => {
                  this.repoCreateDesc = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.repoCreatePrivate}
                  onChange={(e: Event) => {
                    this.repoCreatePrivate = (e.target as HTMLInputElement).checked;
                  }}
                />
                Private
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.repoCreateClone}
                  onChange={(e: Event) => {
                    this.repoCreateClone = (e.target as HTMLInputElement).checked;
                  }}
                />
                Clone after create
              </label>
            </div>
          </div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.repoCreateName.trim()) {
                this.validationError = 'Name is required';
                return;
              }
              this.run(
                ghRepo.create(this.repoCreateName, {
                  private: this.repoCreatePrivate,
                  description: this.repoCreateDesc || undefined,
                  clone: this.repoCreateClone,
                }),
                `gh repo create ${this.repoCreateName}`,
              );
            }}
          >
            Create Repo
          </button>
        </div>

        {/* Clone / Fork */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Clone Repository</h3>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Repository (owner/repo or URL)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="owner/repo"
                value={this.repoCloneTarget}
                onInput={(e: Event) => {
                  this.repoCloneTarget = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Directory (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="./my-dir"
                value={this.repoCloneDir}
                onInput={(e: Event) => {
                  this.repoCloneDir = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.repoCloneTarget.trim()) {
                this.validationError = 'Repository is required';
                return;
              }
              this.run(
                ghRepo.clone(this.repoCloneTarget, this.repoCloneDir || undefined),
                `gh repo clone ${this.repoCloneTarget}${this.repoCloneDir ? ` ${this.repoCloneDir}` : ''}`,
              );
            }}
          >
            Clone
          </button>
        </div>

        {/* Fork */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Fork Repository</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Repository (owner/repo)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="owner/repo"
              value={this.repoForkTarget}
              onInput={(e: Event) => {
                this.repoForkTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.repoForkClone}
              onChange={(e: Event) => {
                this.repoForkClone = (e.target as HTMLInputElement).checked;
              }}
            />
            Clone after fork
          </label>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              const err = this.validateOwnerRepo(this.repoForkTarget);
              if (err) {
                this.validationError = err;
                return;
              }
              this.run(ghRepo.fork(this.repoForkTarget, this.repoForkClone), `gh repo fork ${this.repoForkTarget}`);
            }}
          >
            Fork
          </button>
        </div>

        {/* Delete repo — destructive */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 text-danger">Delete Repository</h3>
          <p class="text-sm text-text2 mb-3">Permanently deletes the repository. Cannot be undone.</p>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Repository (owner/repo)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="owner/repo"
              value={this.repoDeleteTarget}
              onInput={(e: Event) => {
                this.repoDeleteTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              const err = this.validateOwnerRepo(this.repoDeleteTarget);
              if (err) {
                this.validationError = err;
                return;
              }
              if (this.confirm(`gh repo delete ${this.repoDeleteTarget} --yes`)) {
                this.run(ghRepo.delete(this.repoDeleteTarget), `gh repo delete ${this.repoDeleteTarget} --yes`);
              }
            }}
          >
            Delete Repository
          </button>
        </div>
      </div>
    );
  }

  private renderIssuesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Shared repo */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Target Repository</h3>
          {this.renderRepoField()}
          {this.validationError && <p class="text-danger text-sm mt-2">{this.validationError}</p>}
        </div>

        {/* List issues */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Issues</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              State
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.issueState = (e.target as HTMLSelectElement).value as typeof this.issueState;
                }}
              >
                <option value="open" selected={this.issueState === 'open'}>
                  Open
                </option>
                <option value="closed" selected={this.issueState === 'closed'}>
                  Closed
                </option>
                <option value="all" selected={this.issueState === 'all'}>
                  All
                </option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Limit
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="100"
                value={this.issueLimit}
                onInput={(e: Event) => {
                  this.issueLimit = Number((e.target as HTMLInputElement).value) || 20;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Label (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="bug"
                value={this.issueLabel}
                onInput={(e: Event) => {
                  this.issueLabel = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Assignee (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="@me"
                value={this.issueAssignee}
                onInput={(e: Event) => {
                  this.issueAssignee = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const err = this.validateOwnerRepo(this.globalRepo);
              if (err) {
                this.validationError = err;
                return;
              }
              this.run(
                ghIssue.list(this.globalRepo, {
                  state: this.issueState,
                  limit: this.issueLimit,
                  label: this.issueLabel || undefined,
                  assignee: this.issueAssignee || undefined,
                }),
                `gh issue list --repo ${this.globalRepo} --state ${this.issueState}`,
              );
            }}
          >
            List Issues
          </button>
        </div>

        {/* View issue */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">View Issue</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Issue Number
            <input
              type="number"
              class="cli-input w-full"
              placeholder="123"
              value={this.issueViewNumber}
              onInput={(e: Event) => {
                this.issueViewNumber = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const repoErr = this.validateOwnerRepo(this.globalRepo);
              if (repoErr) {
                this.validationError = repoErr;
                return;
              }
              const num = this.validateIssueNumber(this.issueViewNumber);
              if (!num) {
                this.validationError = 'Invalid issue number';
                return;
              }
              this.run(ghIssue.view(this.globalRepo, num), `gh issue view ${num} --repo ${this.globalRepo}`);
            }}
          >
            View
          </button>
        </div>

        {/* Create issue */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Issue</h3>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Title
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Bug: something is broken"
                value={this.issueCreateTitle}
                onInput={(e: Event) => {
                  this.issueCreateTitle = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Body (optional)
              <textarea
                class="cli-input w-full h-20 resize-y"
                placeholder="Describe the issue…"
                value={this.issueCreateBody}
                onInput={(e: Event) => {
                  this.issueCreateBody = (e.target as HTMLTextAreaElement).value;
                }}
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Label (optional)
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="bug"
                  value={this.issueCreateLabel}
                  onInput={(e: Event) => {
                    this.issueCreateLabel = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Assignee (optional)
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="@me"
                  value={this.issueCreateAssignee}
                  onInput={(e: Event) => {
                    this.issueCreateAssignee = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>
          </div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              const repoErr = this.validateOwnerRepo(this.globalRepo);
              if (repoErr) {
                this.validationError = repoErr;
                return;
              }
              if (!this.issueCreateTitle.trim()) {
                this.validationError = 'Title is required';
                return;
              }
              this.run(
                ghIssue.create(this.globalRepo, {
                  title: this.issueCreateTitle,
                  body: this.issueCreateBody || undefined,
                  label: this.issueCreateLabel || undefined,
                  assignee: this.issueCreateAssignee || undefined,
                }),
                `gh issue create --repo ${this.globalRepo} --title "${this.issueCreateTitle}"`,
              );
            }}
          >
            Create Issue
          </button>
        </div>

        {/* Issue actions */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Issue Actions</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Issue Number
            <input
              type="number"
              class="cli-input w-full"
              placeholder="123"
              value={this.issueActionNumber}
              onInput={(e: Event) => {
                this.issueActionNumber = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Comment Body
            <textarea
              class="cli-input w-full h-16 resize-y"
              placeholder="Your comment…"
              value={this.issueCommentBody}
              onInput={(e: Event) => {
                this.issueCommentBody = (e.target as HTMLTextAreaElement).value;
              }}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.issueActionNumber);
                if (!num) {
                  this.validationError = 'Invalid issue number';
                  return;
                }
                if (!this.issueCommentBody.trim()) {
                  this.validationError = 'Comment body is required';
                  return;
                }
                this.run(ghIssue.comment(this.globalRepo, num, this.issueCommentBody), `gh issue comment ${num} --repo ${this.globalRepo}`);
              }}
            >
              Comment
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.issueActionNumber);
                if (!num) {
                  this.validationError = 'Invalid issue number';
                  return;
                }
                this.run(ghIssue.close(this.globalRepo, num), `gh issue close ${num} --repo ${this.globalRepo}`);
              }}
            >
              Close
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.issueActionNumber);
                if (!num) {
                  this.validationError = 'Invalid issue number';
                  return;
                }
                this.run(ghIssue.reopen(this.globalRepo, num), `gh issue reopen ${num} --repo ${this.globalRepo}`);
              }}
            >
              Reopen
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderPrsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Shared repo */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Target Repository</h3>
          {this.renderRepoField()}
          {this.validationError && <p class="text-danger text-sm mt-2">{this.validationError}</p>}
        </div>

        {/* List PRs */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Pull Requests</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              State
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.prState = (e.target as HTMLSelectElement).value as typeof this.prState;
                }}
              >
                <option value="open" selected={this.prState === 'open'}>
                  Open
                </option>
                <option value="closed" selected={this.prState === 'closed'}>
                  Closed
                </option>
                <option value="merged" selected={this.prState === 'merged'}>
                  Merged
                </option>
                <option value="all" selected={this.prState === 'all'}>
                  All
                </option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Limit
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="100"
                value={this.prLimit}
                onInput={(e: Event) => {
                  this.prLimit = Number((e.target as HTMLInputElement).value) || 20;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const err = this.validateOwnerRepo(this.globalRepo);
              if (err) {
                this.validationError = err;
                return;
              }
              this.run(ghPr.list(this.globalRepo, { state: this.prState, limit: this.prLimit }), `gh pr list --repo ${this.globalRepo} --state ${this.prState}`);
            }}
          >
            List PRs
          </button>
        </div>

        {/* View PR */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">View Pull Request</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            PR Number
            <input
              type="number"
              class="cli-input w-full"
              placeholder="42"
              value={this.prViewNumber}
              onInput={(e: Event) => {
                this.prViewNumber = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.prViewNumber);
                if (!num) {
                  this.validationError = 'Invalid PR number';
                  return;
                }
                this.run(ghPr.view(this.globalRepo, num), `gh pr view ${num} --repo ${this.globalRepo}`);
              }}
            >
              View
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.prViewNumber);
                if (!num) {
                  this.validationError = 'Invalid PR number';
                  return;
                }
                this.run(ghPr.checks(this.globalRepo, num), `gh pr checks ${num} --repo ${this.globalRepo}`);
              }}
            >
              Checks
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.prViewNumber);
                if (!num) {
                  this.validationError = 'Invalid PR number';
                  return;
                }
                this.run(ghPr.diff(this.globalRepo, num), `gh pr diff ${num} --repo ${this.globalRepo}`);
              }}
            >
              Diff
            </button>
          </div>
        </div>

        {/* Create PR */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Pull Request</h3>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Title
              <input
                type="text"
                class="cli-input w-full"
                placeholder="feat: add new feature"
                value={this.prCreateTitle}
                onInput={(e: Event) => {
                  this.prCreateTitle = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Body (optional)
              <textarea
                class="cli-input w-full h-20 resize-y"
                placeholder="Describe the changes…"
                value={this.prCreateBody}
                onInput={(e: Event) => {
                  this.prCreateBody = (e.target as HTMLTextAreaElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Base branch
              <input
                type="text"
                class="cli-input w-full"
                placeholder="main"
                value={this.prCreateBase}
                onInput={(e: Event) => {
                  this.prCreateBase = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.prCreateDraft}
                onChange={(e: Event) => {
                  this.prCreateDraft = (e.target as HTMLInputElement).checked;
                }}
              />
              Draft PR
            </label>
          </div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              const repoErr = this.validateOwnerRepo(this.globalRepo);
              if (repoErr) {
                this.validationError = repoErr;
                return;
              }
              if (!this.prCreateTitle.trim()) {
                this.validationError = 'Title is required';
                return;
              }
              this.run(
                ghPr.create(this.globalRepo, {
                  title: this.prCreateTitle,
                  body: this.prCreateBody || undefined,
                  base: this.prCreateBase || 'main',
                  draft: this.prCreateDraft,
                }),
                `gh pr create --repo ${this.globalRepo} --title "${this.prCreateTitle}"`,
              );
            }}
          >
            Create PR
          </button>
        </div>

        {/* PR actions */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">PR Actions</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            PR Number
            <input
              type="number"
              class="cli-input w-full"
              placeholder="42"
              value={this.prActionNumber}
              onInput={(e: Event) => {
                this.prActionNumber = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Merge Method
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.prMergeMethod = (e.target as HTMLSelectElement).value as typeof this.prMergeMethod;
              }}
            >
              <option value="merge" selected={this.prMergeMethod === 'merge'}>
                Merge commit
              </option>
              <option value="squash" selected={this.prMergeMethod === 'squash'}>
                Squash and merge
              </option>
              <option value="rebase" selected={this.prMergeMethod === 'rebase'}>
                Rebase and merge
              </option>
            </select>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.prActionNumber);
                if (!num) {
                  this.validationError = 'Invalid PR number';
                  return;
                }
                this.run(ghPr.checkout(this.globalRepo, num), `gh pr checkout ${num} --repo ${this.globalRepo}`);
              }}
            >
              Checkout
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.prActionNumber);
                if (!num) {
                  this.validationError = 'Invalid PR number';
                  return;
                }
                if (this.confirm(`gh pr merge ${num} --${this.prMergeMethod}`)) {
                  this.run(ghPr.merge(this.globalRepo, num, this.prMergeMethod), `gh pr merge ${num} --repo ${this.globalRepo} --${this.prMergeMethod}`);
                }
              }}
            >
              Merge
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => {
                const repoErr = this.validateOwnerRepo(this.globalRepo);
                if (repoErr) {
                  this.validationError = repoErr;
                  return;
                }
                const num = this.validateIssueNumber(this.prActionNumber);
                if (!num) {
                  this.validationError = 'Invalid PR number';
                  return;
                }
                this.run(ghPr.close(this.globalRepo, num), `gh pr close ${num} --repo ${this.globalRepo}`);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderActionsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Shared repo */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Target Repository</h3>
          {this.renderRepoField()}
          {this.validationError && <p class="text-danger text-sm mt-2">{this.validationError}</p>}
        </div>

        {/* List runs */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Workflow Runs</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Status filter
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.runStatus = (e.target as HTMLSelectElement).value;
                }}
              >
                <option value="" selected={this.runStatus === ''}>
                  All
                </option>
                <option value="queued" selected={this.runStatus === 'queued'}>
                  Queued
                </option>
                <option value="in_progress" selected={this.runStatus === 'in_progress'}>
                  In progress
                </option>
                <option value="completed" selected={this.runStatus === 'completed'}>
                  Completed
                </option>
                <option value="failure" selected={this.runStatus === 'failure'}>
                  Failure
                </option>
                <option value="success" selected={this.runStatus === 'success'}>
                  Success
                </option>
                <option value="cancelled" selected={this.runStatus === 'cancelled'}>
                  Cancelled
                </option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Limit
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="50"
                value={this.runLimit}
                onInput={(e: Event) => {
                  this.runLimit = Number((e.target as HTMLInputElement).value) || 20;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2 col-span-2">
              Workflow filter (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="ci.yml"
                value={this.runWorkflowFilter}
                onInput={(e: Event) => {
                  this.runWorkflowFilter = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const err = this.validateOwnerRepo(this.globalRepo);
              if (err) {
                this.validationError = err;
                return;
              }
              this.run(
                ghRun.list(this.globalRepo, {
                  limit: this.runLimit,
                  status: this.runStatus || undefined,
                  workflow: this.runWorkflowFilter || undefined,
                }),
                `gh run list --repo ${this.globalRepo}`,
              );
            }}
          >
            List Runs
          </button>
        </div>

        {/* View / Rerun / Watch run */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Run Actions</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Run ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="12345678"
              value={this.runActionId}
              onInput={(e: Event) => {
                this.runActionId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.runRerunFailedOnly}
              onChange={(e: Event) => {
                this.runRerunFailedOnly = (e.target as HTMLInputElement).checked;
              }}
            />
            Rerun failed jobs only
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.runActionId.trim()) {
                  this.validationError = 'Run ID is required';
                  return;
                }
                this.run(ghRun.view(this.globalRepo, this.runActionId), `gh run view ${this.runActionId} --repo ${this.globalRepo}`);
              }}
            >
              View
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.runActionId.trim()) {
                  this.validationError = 'Run ID is required';
                  return;
                }
                this.run(ghRun.rerun(this.globalRepo, this.runActionId, this.runRerunFailedOnly), `gh run rerun ${this.runActionId} --repo ${this.globalRepo}`);
              }}
            >
              Rerun
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.runActionId.trim()) {
                  this.validationError = 'Run ID is required';
                  return;
                }
                this.run(ghRun.watch(this.globalRepo, this.runActionId), `gh run watch ${this.runActionId} --repo ${this.globalRepo}`);
              }}
            >
              Watch
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.runActionId.trim()) {
                  this.validationError = 'Run ID is required';
                  return;
                }
                if (this.confirm(`gh run cancel ${this.runActionId}`)) {
                  this.run(ghRun.cancel(this.globalRepo, this.runActionId), `gh run cancel ${this.runActionId} --repo ${this.globalRepo}`);
                }
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Workflows */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Workflows</h3>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Workflow name or file
              <input
                type="text"
                class="cli-input w-full"
                placeholder="ci.yml"
                value={this.workflowName}
                onInput={(e: Event) => {
                  this.workflowName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Branch/ref for dispatch (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="main"
                value={this.workflowRef}
                onInput={(e: Event) => {
                  this.workflowRef = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                this.run(ghWorkflow.list(this.globalRepo), `gh workflow list --repo ${this.globalRepo}`);
              }}
            >
              List
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.workflowName.trim()) {
                  this.validationError = 'Workflow name is required';
                  return;
                }
                this.run(ghWorkflow.view(this.globalRepo, this.workflowName), `gh workflow view "${this.workflowName}" --repo ${this.globalRepo}`);
              }}
            >
              View
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.workflowName.trim()) {
                  this.validationError = 'Workflow name is required';
                  return;
                }
                this.run(ghWorkflow.run(this.globalRepo, this.workflowName, this.workflowRef), `gh workflow run "${this.workflowName}" --repo ${this.globalRepo}`);
              }}
            >
              Dispatch
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.workflowName.trim()) {
                  this.validationError = 'Workflow name is required';
                  return;
                }
                this.run(ghWorkflow.disable(this.globalRepo, this.workflowName), `gh workflow disable "${this.workflowName}" --repo ${this.globalRepo}`);
              }}
            >
              Disable
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                const err = this.validateOwnerRepo(this.globalRepo);
                if (err) {
                  this.validationError = err;
                  return;
                }
                if (!this.workflowName.trim()) {
                  this.validationError = 'Workflow name is required';
                  return;
                }
                this.run(ghWorkflow.enable(this.globalRepo, this.workflowName), `gh workflow enable "${this.workflowName}" --repo ${this.globalRepo}`);
              }}
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderReleasesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Shared repo */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Target Repository</h3>
          {this.renderRepoField()}
          {this.validationError && <p class="text-danger text-sm mt-2">{this.validationError}</p>}
        </div>

        {/* List / View */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Releases</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Limit
            <input
              type="number"
              class="cli-input w-full"
              min="1"
              max="50"
              value={this.releaseLimit}
              onInput={(e: Event) => {
                this.releaseLimit = Number((e.target as HTMLInputElement).value) || 10;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const err = this.validateOwnerRepo(this.globalRepo);
              if (err) {
                this.validationError = err;
                return;
              }
              this.run(ghRelease.list(this.globalRepo, this.releaseLimit), `gh release list --repo ${this.globalRepo}`);
            }}
          >
            List Releases
          </button>
        </div>

        {/* View release */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">View Release</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Tag
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="v1.0.0"
              value={this.releaseTag}
              onInput={(e: Event) => {
                this.releaseTag = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              const err = this.validateOwnerRepo(this.globalRepo);
              if (err) {
                this.validationError = err;
                return;
              }
              if (!this.releaseTag.trim()) {
                this.validationError = 'Tag is required';
                return;
              }
              this.run(ghRelease.view(this.globalRepo, this.releaseTag), `gh release view ${this.releaseTag} --repo ${this.globalRepo}`);
            }}
          >
            View
          </button>
        </div>

        {/* Create release */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Release</h3>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Tag
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="v1.0.0"
                value={this.releaseCreateTag}
                onInput={(e: Event) => {
                  this.releaseCreateTag = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Title (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Release v1.0.0"
                value={this.releaseCreateTitle}
                onInput={(e: Event) => {
                  this.releaseCreateTitle = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Release notes (optional)
              <textarea
                class="cli-input w-full h-20 resize-y"
                placeholder="What changed in this release…"
                value={this.releaseCreateNotes}
                onInput={(e: Event) => {
                  this.releaseCreateNotes = (e.target as HTMLTextAreaElement).value;
                }}
              />
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.releaseCreateDraft}
                  onChange={(e: Event) => {
                    this.releaseCreateDraft = (e.target as HTMLInputElement).checked;
                  }}
                />
                Draft
              </label>
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.releaseCreatePrerelease}
                  onChange={(e: Event) => {
                    this.releaseCreatePrerelease = (e.target as HTMLInputElement).checked;
                  }}
                />
                Pre-release
              </label>
            </div>
          </div>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              const repoErr = this.validateOwnerRepo(this.globalRepo);
              if (repoErr) {
                this.validationError = repoErr;
                return;
              }
              if (!this.releaseCreateTag.trim()) {
                this.validationError = 'Tag is required';
                return;
              }
              this.run(
                ghRelease.create(this.globalRepo, this.releaseCreateTag, {
                  title: this.releaseCreateTitle || undefined,
                  notes: this.releaseCreateNotes || undefined,
                  draft: this.releaseCreateDraft,
                  prerelease: this.releaseCreatePrerelease,
                }),
                `gh release create ${this.releaseCreateTag} --repo ${this.globalRepo}`,
              );
            }}
          >
            Create Release
          </button>
        </div>

        {/* Delete release — destructive */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 text-danger">Delete Release</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Tag
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="v1.0.0"
              value={this.releaseDeleteTag}
              onInput={(e: Event) => {
                this.releaseDeleteTag = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              const repoErr = this.validateOwnerRepo(this.globalRepo);
              if (repoErr) {
                this.validationError = repoErr;
                return;
              }
              if (!this.releaseDeleteTag.trim()) {
                this.validationError = 'Tag is required';
                return;
              }
              if (this.confirm(`gh release delete ${this.releaseDeleteTag} --repo ${this.globalRepo}`)) {
                this.run(ghRelease.delete(this.globalRepo, this.releaseDeleteTag), `gh release delete ${this.releaseDeleteTag} --repo ${this.globalRepo} --yes`);
              }
            }}
          >
            Delete Release
          </button>
        </div>
      </div>
    );
  }

  private renderGistTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {this.validationError && (
          <div class="cli-card xl:col-span-2">
            <p class="text-danger text-sm">{this.validationError}</p>
          </div>
        )}

        {/* List gists */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Gists</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Limit
            <input
              type="number"
              class="cli-input w-full"
              min="1"
              max="100"
              value={this.gistLimit}
              onInput={(e: Event) => {
                this.gistLimit = Number((e.target as HTMLInputElement).value) || 20;
              }}
            />
          </label>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(ghGist.list(this.gistLimit), `gh gist list --limit ${this.gistLimit}`)}>
            List Gists
          </button>
        </div>

        {/* View gist */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">View Gist</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Gist ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="5b0e0062eb8e9654adad7bb1d81cc75f"
              value={this.gistViewId}
              onInput={(e: Event) => {
                this.gistViewId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.gistViewId.trim()) {
                this.validationError = 'Gist ID is required';
                return;
              }
              this.run(ghGist.view(this.gistViewId), `gh gist view ${this.gistViewId}`);
            }}
          >
            View
          </button>
        </div>

        {/* Create gist */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Gist</h3>
          <p class="text-sm text-text2 mb-3">Note: provide content via stdin in your native bridge. This builds the command preview.</p>
          <div class="flex flex-col gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Filename (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="snippet.ts"
                value={this.gistCreateFilename}
                onInput={(e: Event) => {
                  this.gistCreateFilename = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Description (optional)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="A useful snippet"
                value={this.gistCreateDesc}
                onInput={(e: Event) => {
                  this.gistCreateDesc = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.gistCreatePublic}
                onChange={(e: Event) => {
                  this.gistCreatePublic = (e.target as HTMLInputElement).checked;
                }}
              />
              Public gist
            </label>
          </div>
          <button
            type="button"
            class="cli-btn"
            onClick={() =>
              this.run(
                ghGist.create({
                  filename: this.gistCreateFilename || undefined,
                  description: this.gistCreateDesc || undefined,
                  public: this.gistCreatePublic,
                }),
                `gh gist create${this.gistCreateFilename ? ` --filename "${this.gistCreateFilename}"` : ''}${this.gistCreatePublic ? ' --public' : ' --secret'}`,
              )
            }
          >
            Create Gist
          </button>
        </div>

        {/* Delete gist — destructive */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 text-danger">Delete Gist</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Gist ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="5b0e0062eb8e9654adad7bb1d81cc75f"
              value={this.gistDeleteId}
              onInput={(e: Event) => {
                this.gistDeleteId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (!this.gistDeleteId.trim()) {
                this.validationError = 'Gist ID is required';
                return;
              }
              if (this.confirm(`gh gist delete ${this.gistDeleteId}`)) {
                this.run(ghGist.delete(this.gistDeleteId), `gh gist delete ${this.gistDeleteId}`);
              }
            }}
          >
            Delete Gist
          </button>
        </div>
      </div>
    );
  }

  private renderApiTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        {this.validationError && (
          <div class="cli-card">
            <p class="text-danger text-sm">{this.validationError}</p>
          </div>
        )}

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Raw GitHub API</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Method
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.apiMethod = (e.target as HTMLSelectElement).value as typeof this.apiMethod;
                }}
              >
                <option value="GET" selected={this.apiMethod === 'GET'}>
                  GET
                </option>
                <option value="POST" selected={this.apiMethod === 'POST'}>
                  POST
                </option>
                <option value="graphql" selected={this.apiMethod === 'graphql'}>
                  GraphQL
                </option>
              </select>
            </label>

            {this.apiMethod !== 'graphql' && (
              <label class="flex flex-col gap-1 text-sm text-text2">
                Endpoint
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="/user"
                  value={this.apiEndpoint}
                  onInput={(e: Event) => {
                    this.apiEndpoint = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            )}
          </div>

          {this.apiMethod === 'GET' && (
            <label class="flex items-center gap-2 text-sm text-text2 mb-3">
              <input
                type="checkbox"
                checked={this.apiPaginate}
                onChange={(e: Event) => {
                  this.apiPaginate = (e.target as HTMLInputElement).checked;
                }}
              />
              Paginate (fetch all pages)
            </label>
          )}

          {this.apiMethod === 'POST' && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Fields (e.g. -f key=value)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="-f title='My title' -f body='Body text'"
                value={this.apiFields}
                onInput={(e: Event) => {
                  this.apiFields = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          )}

          {this.apiMethod === 'graphql' && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              GraphQL Query
              <textarea
                class="cli-input w-full font-mono h-32 resize-y"
                value={this.apiGraphqlQuery}
                onInput={(e: Event) => {
                  this.apiGraphqlQuery = (e.target as HTMLTextAreaElement).value;
                }}
              />
            </label>
          )}

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              this.validationError = '';
              if (this.apiMethod === 'GET') {
                if (!this.apiEndpoint.trim()) {
                  this.validationError = 'Endpoint is required';
                  return;
                }
                this.run(ghApi.get(this.apiEndpoint, this.apiPaginate), `gh api ${this.apiEndpoint}`);
              } else if (this.apiMethod === 'POST') {
                if (!this.apiEndpoint.trim()) {
                  this.validationError = 'Endpoint is required';
                  return;
                }
                this.run(ghApi.post(this.apiEndpoint, this.apiFields), `gh api ${this.apiEndpoint} --method POST`);
              } else {
                if (!this.apiGraphqlQuery.trim()) {
                  this.validationError = 'Query is required';
                  return;
                }
                this.run(ghApi.graphql(this.apiGraphqlQuery), 'gh api graphql');
              }
            }}
          >
            Execute
          </button>

          <div class="mt-4 p-3 bg-bg3 rounded-lg">
            <p class="text-xs text-text2 mb-1 font-semibold">Quick endpoints</p>
            <div class="flex flex-wrap gap-2">
              {[
                { label: '/user', endpoint: '/user', method: 'GET' as const },
                { label: '/user/repos', endpoint: '/user/repos', method: 'GET' as const },
                { label: '/user/orgs', endpoint: '/user/orgs', method: 'GET' as const },
                { label: '/rate_limit', endpoint: '/rate_limit', method: 'GET' as const },
                { label: '/notifications', endpoint: '/notifications', method: 'GET' as const },
              ].map(q => (
                <button
                  key={q.endpoint}
                  type="button"
                  class="cli-btn cli-btn-sm"
                  onClick={() => {
                    this.apiEndpoint = q.endpoint;
                    this.apiMethod = q.method;
                    this.run(ghApi.get(q.endpoint), `gh api ${q.endpoint}`);
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🐙</span> GitHub CLI
            <span class="cli-badge-info">gh</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for gh — GitHub from the terminal</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'auth' && this.renderAuthTab()}
          {this.activeTab === 'repos' && this.renderReposTab()}
          {this.activeTab === 'issues' && this.renderIssuesTab()}
          {this.activeTab === 'prs' && this.renderPrsTab()}
          {this.activeTab === 'actions' && this.renderActionsTab()}
          {this.activeTab === 'releases' && this.renderReleasesTab()}
          {this.activeTab === 'gist' && this.renderGistTab()}
          {this.activeTab === 'api' && this.renderApiTab()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }
}
