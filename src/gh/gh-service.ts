import { executeCommand } from '../utils/execute-command';

export type { CommandResult } from '../utils/execute-command';
export { executeCommand };

/**
 * gh (GitHub CLI) execution service
 *
 * All commands are stubs — replace executeCommand() body with your
 * native bridge (Tauri invoke, Electron IPC, WKWebView handler, etc.)
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export const ghAuth = {
  status(): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand('gh auth status');
  },
  login(web = true): Promise<import('../yabai/yabai-service').CommandResult> {
    const flag = web ? '--web' : '';
    return executeCommand(`gh auth login ${flag}`.trim());
  },
  logout(hostname = ''): Promise<import('../yabai/yabai-service').CommandResult> {
    const h = hostname ? `--hostname ${hostname}` : '';
    return executeCommand(`gh auth logout ${h}`.trim());
  },
  refresh(scopes = ''): Promise<import('../yabai/yabai-service').CommandResult> {
    const s = scopes ? `--scopes ${scopes}` : '';
    return executeCommand(`gh auth refresh ${s}`.trim());
  },
  token(): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand('gh auth token');
  },
};

// ── Repo ──────────────────────────────────────────────────────────────────────

export const ghRepo = {
  list(opts: { org?: string; limit?: number } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = ['gh repo list'];
    if (opts.org) parts.push(opts.org);
    parts.push('--json name,nameWithOwner,description,isPrivate,updatedAt');
    if (opts.limit) parts.push(`--limit ${opts.limit}`);
    return executeCommand(parts.join(' '));
  },
  view(repo: string, web = false): Promise<import('../yabai/yabai-service').CommandResult> {
    const flag = web ? '--web' : '--json name,description,url,stargazerCount,forkCount,defaultBranchRef,isPrivate';
    return executeCommand(`gh repo view ${repo} ${flag}`);
  },
  create(name: string, opts: { private?: boolean; description?: string; clone?: boolean } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = ['gh repo create', name];
    if (opts.private) parts.push('--private');
    else parts.push('--public');
    if (opts.description) parts.push(`--description "${opts.description}"`);
    if (opts.clone) parts.push('--clone');
    return executeCommand(parts.join(' '));
  },
  clone(repo: string, dir = ''): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh repo clone ${repo}${dir ? ` ${dir}` : ''}`);
  },
  fork(repo: string, clone = false): Promise<import('../yabai/yabai-service').CommandResult> {
    const flag = clone ? '--clone' : '--no-clone';
    return executeCommand(`gh repo fork ${repo} ${flag}`);
  },
  delete(repo: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh repo delete ${repo} --yes`);
  },
};

// ── Issue ─────────────────────────────────────────────────────────────────────

export const ghIssue = {
  list(repo: string, opts: { state?: string; limit?: number; label?: string; assignee?: string } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = ['gh issue list'];
    if (repo) parts.push(`--repo ${repo}`);
    if (opts.state) parts.push(`--state ${opts.state}`);
    if (opts.limit) parts.push(`--limit ${opts.limit}`);
    if (opts.label) parts.push(`--label "${opts.label}"`);
    if (opts.assignee) parts.push(`--assignee ${opts.assignee}`);
    parts.push('--json number,title,state,author,labels,createdAt');
    return executeCommand(parts.join(' '));
  },
  view(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh issue view ${number} --repo ${repo} --json number,title,body,state,author,labels,comments,createdAt`);
  },
  create(repo: string, opts: { title: string; body?: string; label?: string; assignee?: string }): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = [`gh issue create --repo ${repo}`, `--title "${opts.title}"`];
    if (opts.body) parts.push(`--body "${opts.body}"`);
    if (opts.label) parts.push(`--label "${opts.label}"`);
    if (opts.assignee) parts.push(`--assignee ${opts.assignee}`);
    return executeCommand(parts.join(' '));
  },
  comment(repo: string, number: number, body: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh issue comment ${number} --repo ${repo} --body "${body}"`);
  },
  close(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh issue close ${number} --repo ${repo}`);
  },
  reopen(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh issue reopen ${number} --repo ${repo}`);
  },
};

// ── PR ────────────────────────────────────────────────────────────────────────

export const ghPr = {
  list(repo: string, opts: { state?: string; limit?: number } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = ['gh pr list'];
    if (repo) parts.push(`--repo ${repo}`);
    if (opts.state) parts.push(`--state ${opts.state}`);
    if (opts.limit) parts.push(`--limit ${opts.limit}`);
    parts.push('--json number,title,state,author,headRefName,createdAt,isDraft');
    return executeCommand(parts.join(' '));
  },
  view(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh pr view ${number} --repo ${repo} --json number,title,body,state,author,headRefName,baseRefName,isDraft,mergeable,reviews,createdAt`);
  },
  create(repo: string, opts: { title: string; body?: string; base?: string; draft?: boolean; fill?: boolean }): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = [`gh pr create --repo ${repo}`, `--title "${opts.title}"`];
    if (opts.body) parts.push(`--body "${opts.body}"`);
    if (opts.base) parts.push(`--base ${opts.base}`);
    if (opts.draft) parts.push('--draft');
    if (opts.fill) parts.push('--fill');
    return executeCommand(parts.join(' '));
  },
  checkout(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh pr checkout ${number} --repo ${repo}`);
  },
  merge(repo: string, number: number, method: 'merge' | 'squash' | 'rebase' = 'merge'): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh pr merge ${number} --repo ${repo} --${method}`);
  },
  close(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh pr close ${number} --repo ${repo}`);
  },
  diff(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh pr diff ${number} --repo ${repo}`);
  },
  checks(repo: string, number: number): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh pr checks ${number} --repo ${repo}`);
  },
};

// ── Actions / Runs ────────────────────────────────────────────────────────────

export const ghRun = {
  list(repo: string, opts: { limit?: number; workflow?: string; status?: string } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = ['gh run list'];
    if (repo) parts.push(`--repo ${repo}`);
    if (opts.limit) parts.push(`--limit ${opts.limit}`);
    if (opts.workflow) parts.push(`--workflow "${opts.workflow}"`);
    if (opts.status) parts.push(`--status ${opts.status}`);
    parts.push('--json databaseId,name,status,conclusion,headBranch,createdAt,workflowName');
    return executeCommand(parts.join(' '));
  },
  view(repo: string, runId: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh run view ${runId} --repo ${repo} --json databaseId,name,status,conclusion,jobs,createdAt,workflowName`);
  },
  rerun(repo: string, runId: string, failedOnly = false): Promise<import('../yabai/yabai-service').CommandResult> {
    const flag = failedOnly ? '--failed-only' : '';
    return executeCommand(`gh run rerun ${runId} --repo ${repo} ${flag}`.trim());
  },
  watch(repo: string, runId: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh run watch ${runId} --repo ${repo}`);
  },
  cancel(repo: string, runId: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh run cancel ${runId} --repo ${repo}`);
  },
};

export const ghWorkflow = {
  list(repo: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh workflow list --repo ${repo} --json id,name,state`);
  },
  view(repo: string, workflow: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh workflow view "${workflow}" --repo ${repo}`);
  },
  run(repo: string, workflow: string, ref = ''): Promise<import('../yabai/yabai-service').CommandResult> {
    const r = ref ? `--ref ${ref}` : '';
    return executeCommand(`gh workflow run "${workflow}" --repo ${repo} ${r}`.trim());
  },
  enable(repo: string, workflow: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh workflow enable "${workflow}" --repo ${repo}`);
  },
  disable(repo: string, workflow: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh workflow disable "${workflow}" --repo ${repo}`);
  },
};

// ── Release ───────────────────────────────────────────────────────────────────

export const ghRelease = {
  list(repo: string, limit = 10): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh release list --repo ${repo} --limit ${limit} --json tagName,name,isDraft,isPrerelease,publishedAt`);
  },
  view(repo: string, tag: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh release view ${tag} --repo ${repo} --json tagName,name,body,isDraft,isPrerelease,publishedAt,assets`);
  },
  create(repo: string, tag: string, opts: { title?: string; notes?: string; draft?: boolean; prerelease?: boolean } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = [`gh release create ${tag} --repo ${repo}`];
    if (opts.title) parts.push(`--title "${opts.title}"`);
    if (opts.notes) parts.push(`--notes "${opts.notes}"`);
    if (opts.draft) parts.push('--draft');
    if (opts.prerelease) parts.push('--prerelease');
    return executeCommand(parts.join(' '));
  },
  delete(repo: string, tag: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh release delete ${tag} --repo ${repo} --yes`);
  },
};

// ── Gist ──────────────────────────────────────────────────────────────────────

export const ghGist = {
  list(limit = 20): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh gist list --limit ${limit} --json id,description,files,isPublic,createdAt`);
  },
  view(id: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh gist view ${id} --raw`);
  },
  create(opts: { filename?: string; description?: string; public?: boolean; content?: string } = {}): Promise<import('../yabai/yabai-service').CommandResult> {
    const parts = ['gh gist create'];
    if (opts.filename) parts.push(`--filename "${opts.filename}"`);
    if (opts.description) parts.push(`--desc "${opts.description}"`);
    if (opts.public) parts.push('--public');
    else parts.push('--secret');
    return executeCommand(parts.join(' '));
  },
  delete(id: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh gist delete ${id}`);
  },
};

// ── API ───────────────────────────────────────────────────────────────────────

export const ghApi = {
  get(endpoint: string, paginate = false): Promise<import('../yabai/yabai-service').CommandResult> {
    const flag = paginate ? '--paginate' : '';
    return executeCommand(`gh api ${endpoint} ${flag}`.trim());
  },
  post(endpoint: string, fields: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh api ${endpoint} --method POST ${fields}`);
  },
  graphql(query: string): Promise<import('../yabai/yabai-service').CommandResult> {
    return executeCommand(`gh api graphql -f query='${query}'`);
  },
};
