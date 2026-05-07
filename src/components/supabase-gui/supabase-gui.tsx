import { Component, h, State } from '@stencil/core';
import { z } from 'zod';
import {
  type CommandResult,
  ProjectRefSchema,
  REGIONS,
  type Region,
  supabaseAuth,
  supabaseBranches,
  supabaseDb,
  supabaseFunctions,
  supabaseGen,
  supabaseLocal,
  supabaseMigration,
  supabaseOrgs,
  supabaseProjects,
  supabaseSecrets,
} from '../../supabase/supabase-service';

type Tab = 'auth' | 'projects' | 'local' | 'db' | 'functions' | 'secrets' | 'branches' | 'types';

const TAB_DEFINITIONS: { id: Tab; label: string }[] = [
  { id: 'auth', label: 'Auth' },
  { id: 'projects', label: 'Projects' },
  { id: 'local', label: 'Local Dev' },
  { id: 'db', label: 'DB & Migrations' },
  { id: 'functions', label: 'Functions' },
  { id: 'secrets', label: 'Secrets' },
  { id: 'branches', label: 'Branches' },
  { id: 'types', label: 'Types' },
];

@Component({
  tag: 'supabase-gui',
  styleUrl: 'supabase-gui.css',
  scoped: true,
})
export class SupabaseGui {
  // ── Global state ──────────────────────────────────────────────────────────
  @State() activeTab: Tab = 'auth';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select a tab and execute a command.';

  // ── Auth tab ──────────────────────────────────────────────────────────────
  @State() authToken = '';

  // ── Projects tab ─────────────────────────────────────────────────────────
  @State() projectRef = '';
  @State() projectRefError = '';
  @State() newProjectName = '';
  @State() newProjectOrgId = '';
  @State() newProjectPassword = '';
  @State() newProjectRegion: Region = 'us-east-1';

  // ── Local Dev tab ─────────────────────────────────────────────────────────
  @State() linkProjectRef = '';
  @State() linkProjectRefError = '';

  // ── DB tab ────────────────────────────────────────────────────────────────
  @State() dbDryRun = false;
  @State() dbSchema = '';
  @State() dbDiffFile = '';
  @State() dbSql = '';
  @State() dbDumpDataOnly = false;
  @State() dbLintLevel: 'warning' | 'error' = 'warning';
  @State() migrationName = '';
  @State() migrationRepairVersion = '';
  @State() migrationRepairStatus: 'applied' | 'reverted' = 'applied';

  // ── Functions tab ─────────────────────────────────────────────────────────
  @State() fnProjectRef = '';
  @State() fnProjectRefError = '';
  @State() fnName = '';
  @State() fnNewName = '';
  @State() fnServeEnvFile = '';
  @State() fnNoVerifyJwt = false;

  // ── Secrets tab ───────────────────────────────────────────────────────────
  @State() secretProjectRef = '';
  @State() secretProjectRefError = '';
  @State() secretPairs = '';
  @State() secretUnsetNames = '';

  // ── Branches tab ─────────────────────────────────────────────────────────
  @State() branchProjectRef = '';
  @State() branchProjectRefError = '';
  @State() branchName = '';
  @State() branchId = '';
  @State() branchRegion: Region | '' = '';

  // ── Types tab ─────────────────────────────────────────────────────────────
  @State() typesProjectRef = '';
  @State() typesProjectRefError = '';
  @State() typesSchema = 'public';
  @State() typesLocal = false;

  // ── Helpers ───────────────────────────────────────────────────────────────

  private validateRef(ref: string): string {
    try {
      ProjectRefSchema.parse(ref);
      return '';
    } catch (err) {
      if (err instanceof z.ZodError) return err.errors[0]?.message ?? 'Invalid';
      return 'Invalid project ref';
    }
  }

  private async run(fn: () => Promise<CommandResult>, cmd: string): Promise<void> {
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running...';
    this.statusMessage = 'Running...';
    try {
      const result = await fn();
      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async confirm(msg: string): Promise<boolean> {
    if (typeof window === 'undefined') return true;
    return window.confirm(msg);
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(this.output);
      const prev = this.statusMessage;
      this.statusMessage = 'Copied!';
      window.setTimeout(() => {
        this.statusMessage = prev;
      }, 1500);
    }
  }

  // ── Tab renders ───────────────────────────────────────────────────────────

  renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Authentication</h3>
          <p class="text-sm text-text2 mb-4">Login via browser or supply a personal access token for CI/non-interactive environments.</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Access Token (optional)
            <input
              type="password"
              class="cli-input w-full font-mono"
              placeholder="sbp_xxxxxxxxxxxx"
              value={this.authToken}
              onInput={(e: Event) => (this.authToken = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.run(() => supabaseAuth.login(this.authToken || undefined), `supabase login${this.authToken ? ' --token ***' : ''}`)}
            >
              Login
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={async () => {
                if (await this.confirm('Log out and delete all local access tokens?')) {
                  this.run(() => supabaseAuth.logout(), 'supabase logout');
                }
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Organizations</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn" onClick={() => this.run(() => supabaseOrgs.list(), 'supabase orgs list --output json')}>
              List Orgs
            </button>
          </div>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            New Org Name
            <input type="text" class="cli-input w-full" placeholder="my-organization" id="org-name-input" onInput={() => {}} />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-info"
            onClick={(e: Event) => {
              const input = (e.target as HTMLElement).closest('.cli-card')?.querySelector('#org-name-input') as HTMLInputElement | null;
              const name = input?.value?.trim() ?? '';
              if (!name) return;
              this.run(() => supabaseOrgs.create(name), `supabase orgs create "${name}"`);
            }}
          >
            Create Org
          </button>
        </div>
      </div>
    );
  }

  renderProjectsTab() {
    const refErr = this.projectRefError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List & Inspect</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn" onClick={() => this.run(() => supabaseProjects.list(), 'supabase projects list --output json')}>
              List Projects
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Project Ref (20-char ID)
            <input
              type="text"
              class={`cli-input w-full font-mono ${refErr ? 'cli-input-invalid' : this.projectRef.length === 20 ? 'cli-input-valid' : ''}`}
              placeholder="abcdefghijklmnopqrst"
              value={this.projectRef}
              maxlength={20}
              onInput={(e: Event) => {
                this.projectRef = (e.target as HTMLInputElement).value;
                this.projectRefError = this.validateRef(this.projectRef);
              }}
            />
            {refErr && <span class="cli-validation-message invalid">{refErr}</span>}
          </label>
          <button
            type="button"
            class="cli-btn"
            disabled={!!refErr || !this.projectRef}
            onClick={() => this.run(() => supabaseProjects.apiKeys(this.projectRef), `supabase projects api-keys --project-ref ${this.projectRef}`)}
          >
            List API Keys
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Project</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-project"
              value={this.newProjectName}
              onInput={(e: Event) => (this.newProjectName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Org ID
            <input
              type="text"
              class="cli-input w-full"
              placeholder="org_xxxxxxxxxxxx"
              value={this.newProjectOrgId}
              onInput={(e: Event) => (this.newProjectOrgId = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            DB Password
            <input
              type="password"
              class="cli-input w-full"
              placeholder="••••••••"
              value={this.newProjectPassword}
              onInput={(e: Event) => (this.newProjectPassword = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Region
            <select class="cli-select w-full" onChange={(e: Event) => (this.newProjectRegion = (e.target as HTMLSelectElement).value as Region)}>
              {REGIONS.map(r => (
                <option key={r} value={r} selected={this.newProjectRegion === r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-info"
            onClick={() => {
              if (!this.newProjectName || !this.newProjectOrgId || !this.newProjectPassword) return;
              this.run(
                () => supabaseProjects.create(this.newProjectName, this.newProjectOrgId, this.newProjectPassword, this.newProjectRegion),
                `supabase projects create "${this.newProjectName}" --org-id ${this.newProjectOrgId} --db-password *** --region ${this.newProjectRegion}`,
              );
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  renderLocalTab() {
    const refErr = this.linkProjectRefError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Project Setup</h3>
          <p class="text-xs text-text2 mb-4">Initialise a new local project or link to an existing remote.</p>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn" onClick={() => this.run(() => supabaseLocal.init(), 'supabase init')}>
              Init
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              onClick={async () => {
                if (await this.confirm('Unlink this project?')) {
                  this.run(() => supabaseLocal.unlink(), 'supabase unlink');
                }
              }}
            >
              Unlink
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Project Ref to Link
            <input
              type="text"
              class={`cli-input w-full font-mono ${refErr ? 'cli-input-invalid' : this.linkProjectRef.length === 20 ? 'cli-input-valid' : ''}`}
              placeholder="abcdefghijklmnopqrst"
              value={this.linkProjectRef}
              maxlength={20}
              onInput={(e: Event) => {
                this.linkProjectRef = (e.target as HTMLInputElement).value;
                this.linkProjectRefError = this.validateRef(this.linkProjectRef);
              }}
            />
            {refErr && <span class="cli-validation-message invalid">{refErr}</span>}
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!!refErr || !this.linkProjectRef}
            onClick={() => this.run(() => supabaseLocal.link(this.linkProjectRef), `supabase link --project-ref ${this.linkProjectRef}`)}
          >
            Link
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Docker Stack</h3>
          <p class="text-xs text-text2 mb-4">Control the local Supabase Docker containers.</p>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => supabaseLocal.start(), 'supabase start')}>
              Start
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              onClick={async () => {
                if (await this.confirm('Stop all local Supabase containers?')) {
                  this.run(() => supabaseLocal.stop(), 'supabase stop');
                }
              }}
            >
              Stop
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={async () => {
                if (await this.confirm('Stop all containers AND backup data? (supabase stop --backup)')) {
                  this.run(() => supabaseLocal.stop(true), 'supabase stop --backup');
                }
              }}
            >
              Stop + Backup
            </button>
          </div>

          <button type="button" class="cli-btn" onClick={() => this.run(() => supabaseLocal.status(), 'supabase status')}>
            Status
          </button>
        </div>
      </div>
    );
  }

  renderDbTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Push / Pull / Diff */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Schema Sync</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Schema (optional, e.g. public)
            <input type="text" class="cli-input w-full" placeholder="public" value={this.dbSchema} onInput={(e: Event) => (this.dbSchema = (e.target as HTMLInputElement).value)} />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.dbDryRun} onChange={(e: Event) => (this.dbDryRun = (e.target as HTMLInputElement).checked)} />
            Dry Run (push only)
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-info"
              onClick={() => this.run(() => supabaseDb.push(this.dbDryRun), `supabase db push${this.dbDryRun ? ' --dry-run' : ''}`)}
            >
              Push
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => this.run(() => supabaseDb.pull(this.dbSchema), `supabase db pull${this.dbSchema ? ` --schema ${this.dbSchema}` : ''}`)}
            >
              Pull
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() =>
                this.run(
                  () => supabaseDb.diff(this.dbSchema, this.dbDiffFile),
                  `supabase db diff${this.dbSchema ? ` --schema ${this.dbSchema}` : ''}${this.dbDiffFile ? ` --file ${this.dbDiffFile}` : ''}`,
                )
              }
            >
              Diff
            </button>
          </div>
        </div>

        {/* Reset / Dump / Lint */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Utilities</h3>

          <div class="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={async () => {
                if (await this.confirm('Reset local database to current migrations? All local data will be lost.')) {
                  this.run(() => supabaseDb.reset(), 'supabase db reset');
                }
              }}
            >
              Reset DB
            </button>

            <button type="button" class="cli-btn" onClick={() => this.run(() => supabaseDb.lint(this.dbLintLevel), `supabase db lint --level ${this.dbLintLevel}`)}>
              Lint
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Lint Level
            <select class="cli-select" onChange={(e: Event) => (this.dbLintLevel = (e.target as HTMLSelectElement).value as 'warning' | 'error')}>
              <option value="warning" selected={this.dbLintLevel === 'warning'}>
                warning
              </option>
              <option value="error" selected={this.dbLintLevel === 'error'}>
                error
              </option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input type="checkbox" checked={this.dbDumpDataOnly} onChange={(e: Event) => (this.dbDumpDataOnly = (e.target as HTMLInputElement).checked)} />
            Dump data only
          </label>

          <button
            type="button"
            class="cli-btn"
            onClick={() =>
              this.run(
                () => supabaseDb.dump(this.dbDumpDataOnly, this.dbSchema),
                `supabase db dump${this.dbDumpDataOnly ? ' --data-only' : ''}${this.dbSchema ? ` --schema ${this.dbSchema}` : ''}`,
              )
            }
          >
            Dump
          </button>
        </div>

        {/* SQL Query */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">SQL Query</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            SQL
            <textarea
              class="cli-input w-full font-mono h-28"
              placeholder="SELECT * FROM public.users LIMIT 10;"
              value={this.dbSql}
              onInput={(e: Event) => (this.dbSql = (e.target as HTMLTextAreaElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.dbSql.trim()) return;
              this.run(() => supabaseDb.query(this.dbSql), `supabase db query "..."`);
            }}
          >
            Execute SQL
          </button>
        </div>

        {/* Migrations */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Migrations</h3>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn" onClick={() => this.run(() => supabaseMigration.list(), 'supabase migration list')}>
              List
            </button>
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.run(() => supabaseMigration.up(), 'supabase migration up')}>
              Apply Pending
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            New Migration Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="add_users_table"
              value={this.migrationName}
              onInput={(e: Event) => (this.migrationName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success mb-4"
            onClick={() => {
              if (!this.migrationName.trim()) return;
              this.run(() => supabaseMigration.newMigration(this.migrationName), `supabase migration new "${this.migrationName}"`);
            }}
          >
            New Migration
          </button>

          <h4 class="text-sm text-text2 mb-2">Repair Migration</h4>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Version timestamp
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="20240101000000"
              value={this.migrationRepairVersion}
              onInput={(e: Event) => (this.migrationRepairVersion = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="flex items-center gap-3 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="radio"
                name="repair-status"
                value="applied"
                checked={this.migrationRepairStatus === 'applied'}
                onChange={() => (this.migrationRepairStatus = 'applied')}
              />
              applied
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="radio"
                name="repair-status"
                value="reverted"
                checked={this.migrationRepairStatus === 'reverted'}
                onChange={() => (this.migrationRepairStatus = 'reverted')}
              />
              reverted
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={async () => {
              if (!this.migrationRepairVersion.trim()) return;
              if (await this.confirm(`Repair migration ${this.migrationRepairVersion} as "${this.migrationRepairStatus}"?`)) {
                this.run(
                  () => supabaseMigration.repair(this.migrationRepairVersion, this.migrationRepairStatus),
                  `supabase migration repair ${this.migrationRepairVersion} --status ${this.migrationRepairStatus}`,
                );
              }
            }}
          >
            Repair
          </button>
        </div>
      </div>
    );
  }

  renderFunctionsTab() {
    const refErr = this.fnProjectRefError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Project Ref</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Project Ref
            <input
              type="text"
              class={`cli-input w-full font-mono ${refErr ? 'cli-input-invalid' : this.fnProjectRef.length === 20 ? 'cli-input-valid' : ''}`}
              placeholder="abcdefghijklmnopqrst"
              value={this.fnProjectRef}
              maxlength={20}
              onInput={(e: Event) => {
                this.fnProjectRef = (e.target as HTMLInputElement).value;
                this.fnProjectRefError = this.validateRef(this.fnProjectRef);
              }}
            />
            {refErr && <span class="cli-validation-message invalid">{refErr}</span>}
          </label>
          <button
            type="button"
            class="cli-btn"
            disabled={!!refErr || !this.fnProjectRef}
            onClick={() => this.run(() => supabaseFunctions.list(this.fnProjectRef), `supabase functions list --project-ref ${this.fnProjectRef}`)}
          >
            List Functions
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">New Function (local)</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Function Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="hello-world"
              value={this.fnNewName}
              onInput={(e: Event) => (this.fnNewName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.fnNewName.trim()) return;
              this.run(() => supabaseFunctions.newFunction(this.fnNewName), `supabase functions new ${this.fnNewName}`);
            }}
          >
            Create
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Serve / Deploy / Download</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Function Name (leave blank to serve all)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-function"
              value={this.fnName}
              onInput={(e: Event) => (this.fnName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Env File (for serve, optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder=".env.local"
              value={this.fnServeEnvFile}
              onInput={(e: Event) => (this.fnServeEnvFile = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.fnNoVerifyJwt} onChange={(e: Event) => (this.fnNoVerifyJwt = (e.target as HTMLInputElement).checked)} />
            No-verify-jwt (deploy)
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-info"
              onClick={() =>
                this.run(
                  () => supabaseFunctions.serve(this.fnName, this.fnServeEnvFile),
                  `supabase functions serve${this.fnName ? ` ${this.fnName}` : ''}${this.fnServeEnvFile ? ` --env-file ${this.fnServeEnvFile}` : ''}`,
                )
              }
            >
              Serve
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!!refErr || !this.fnProjectRef || !this.fnName}
              onClick={() =>
                this.run(
                  () => supabaseFunctions.deploy(this.fnName, this.fnProjectRef, this.fnNoVerifyJwt),
                  `supabase functions deploy ${this.fnName} --project-ref ${this.fnProjectRef}${this.fnNoVerifyJwt ? ' --no-verify-jwt' : ''}`,
                )
              }
            >
              Deploy
            </button>
            <button
              type="button"
              class="cli-btn"
              disabled={!!refErr || !this.fnProjectRef || !this.fnName}
              onClick={() =>
                this.run(() => supabaseFunctions.download(this.fnName, this.fnProjectRef), `supabase functions download ${this.fnName} --project-ref ${this.fnProjectRef}`)
              }
            >
              Download
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              disabled={!!refErr || !this.fnProjectRef || !this.fnName}
              onClick={async () => {
                if (await this.confirm(`Delete function "${this.fnName}" from project ${this.fnProjectRef}?`)) {
                  this.run(() => supabaseFunctions.delete(this.fnName, this.fnProjectRef), `supabase functions delete ${this.fnName} --project-ref ${this.fnProjectRef}`);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderSecretsTab() {
    const refErr = this.secretProjectRefError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Secrets</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Project Ref
            <input
              type="text"
              class={`cli-input w-full font-mono ${refErr ? 'cli-input-invalid' : this.secretProjectRef.length === 20 ? 'cli-input-valid' : ''}`}
              placeholder="abcdefghijklmnopqrst"
              value={this.secretProjectRef}
              maxlength={20}
              onInput={(e: Event) => {
                this.secretProjectRef = (e.target as HTMLInputElement).value;
                this.secretProjectRefError = this.validateRef(this.secretProjectRef);
              }}
            />
            {refErr && <span class="cli-validation-message invalid">{refErr}</span>}
          </label>
          <button
            type="button"
            class="cli-btn mb-4"
            disabled={!!refErr || !this.secretProjectRef}
            onClick={() => this.run(() => supabaseSecrets.list(this.secretProjectRef), `supabase secrets list --project-ref ${this.secretProjectRef}`)}
          >
            List Secrets
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Set / Unset Secrets</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Key=Value pairs (space-separated)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="MY_KEY=value ANOTHER=val2"
              value={this.secretPairs}
              onInput={(e: Event) => (this.secretPairs = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success mb-4"
            disabled={!!refErr || !this.secretProjectRef || !this.secretPairs.trim()}
            onClick={() =>
              this.run(() => supabaseSecrets.set(this.secretProjectRef, this.secretPairs), `supabase secrets set --project-ref ${this.secretProjectRef} ${this.secretPairs}`)
            }
          >
            Set Secret(s)
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Names to Unset (space-separated)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="MY_KEY ANOTHER"
              value={this.secretUnsetNames}
              onInput={(e: Event) => (this.secretUnsetNames = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            disabled={!!refErr || !this.secretProjectRef || !this.secretUnsetNames.trim()}
            onClick={async () => {
              if (await this.confirm(`Unset secrets: ${this.secretUnsetNames}?`)) {
                this.run(
                  () => supabaseSecrets.unset(this.secretProjectRef, this.secretUnsetNames),
                  `supabase secrets unset --project-ref ${this.secretProjectRef} ${this.secretUnsetNames}`,
                );
              }
            }}
          >
            Unset Secret(s)
          </button>
        </div>
      </div>
    );
  }

  renderBranchesTab() {
    const refErr = this.branchProjectRefError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Project Ref</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Project Ref
            <input
              type="text"
              class={`cli-input w-full font-mono ${refErr ? 'cli-input-invalid' : this.branchProjectRef.length === 20 ? 'cli-input-valid' : ''}`}
              placeholder="abcdefghijklmnopqrst"
              value={this.branchProjectRef}
              maxlength={20}
              onInput={(e: Event) => {
                this.branchProjectRef = (e.target as HTMLInputElement).value;
                this.branchProjectRefError = this.validateRef(this.branchProjectRef);
              }}
            />
            {refErr && <span class="cli-validation-message invalid">{refErr}</span>}
          </label>
          <button
            type="button"
            class="cli-btn"
            disabled={!!refErr || !this.branchProjectRef}
            onClick={() => this.run(() => supabaseBranches.list(this.branchProjectRef), `supabase branches list --project-ref ${this.branchProjectRef}`)}
          >
            List Branches
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Branch</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Branch Name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="feature-branch"
              value={this.branchName}
              onInput={(e: Event) => (this.branchName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Region (optional)
            <select class="cli-select w-full" onChange={(e: Event) => (this.branchRegion = (e.target as HTMLSelectElement).value as Region | '')}>
              <option value="" selected={this.branchRegion === ''}>
                — same as project —
              </option>
              {REGIONS.map(r => (
                <option key={r} value={r} selected={this.branchRegion === r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!!refErr || !this.branchProjectRef || !this.branchName}
            onClick={() =>
              this.run(
                () => supabaseBranches.create(this.branchProjectRef, this.branchName, this.branchRegion as Region | undefined),
                `supabase branches create ${this.branchName} --project-ref ${this.branchProjectRef}${this.branchRegion ? ` --region ${this.branchRegion}` : ''}`,
              )
            }
          >
            Create
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Branch Actions (by Branch ID)</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Branch ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="branch-uuid"
              value={this.branchId}
              onInput={(e: Event) => (this.branchId = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn"
              disabled={!!refErr || !this.branchProjectRef || !this.branchId}
              onClick={() =>
                this.run(() => supabaseBranches.get(this.branchId, this.branchProjectRef), `supabase branches get ${this.branchId} --project-ref ${this.branchProjectRef}`)
              }
            >
              Get
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              disabled={!!refErr || !this.branchProjectRef || !this.branchId}
              onClick={() =>
                this.run(() => supabaseBranches.pause(this.branchId, this.branchProjectRef), `supabase branches pause ${this.branchId} --project-ref ${this.branchProjectRef}`)
              }
            >
              Pause
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!!refErr || !this.branchProjectRef || !this.branchId}
              onClick={() =>
                this.run(() => supabaseBranches.unpause(this.branchId, this.branchProjectRef), `supabase branches unpause ${this.branchId} --project-ref ${this.branchProjectRef}`)
              }
            >
              Unpause
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              disabled={!!refErr || !this.branchProjectRef || !this.branchId}
              onClick={async () => {
                if (await this.confirm(`Delete branch ${this.branchId}? This cannot be undone.`)) {
                  this.run(
                    () => supabaseBranches.deleteBranch(this.branchId, this.branchProjectRef),
                    `supabase branches delete ${this.branchId} --project-ref ${this.branchProjectRef}`,
                  );
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderTypesTab() {
    const refErr = this.typesProjectRefError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Generate TypeScript Types</h3>
          <p class="text-sm text-text2 mb-4">
            Generate TypeScript types from your Postgres schema. Use <strong>Local</strong> mode when the local Docker stack is running; use <strong>Remote</strong> mode with a
            project ref for production projects.
          </p>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input type="checkbox" checked={this.typesLocal} onChange={(e: Event) => (this.typesLocal = (e.target as HTMLInputElement).checked)} />
            Use local database (no project ref needed)
          </label>

          {!this.typesLocal && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
              Project Ref
              <input
                type="text"
                class={`cli-input w-full font-mono ${refErr ? 'cli-input-invalid' : this.typesProjectRef.length === 20 ? 'cli-input-valid' : ''}`}
                placeholder="abcdefghijklmnopqrst"
                value={this.typesProjectRef}
                maxlength={20}
                onInput={(e: Event) => {
                  this.typesProjectRef = (e.target as HTMLInputElement).value;
                  this.typesProjectRefError = this.validateRef(this.typesProjectRef);
                }}
              />
              {refErr && <span class="cli-validation-message invalid">{refErr}</span>}
            </label>
          )}

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Schema
            <input
              type="text"
              class="cli-input w-full"
              placeholder="public"
              value={this.typesSchema}
              onInput={(e: Event) => (this.typesSchema = (e.target as HTMLInputElement).value)}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!this.typesLocal && (!!refErr || !this.typesProjectRef)}
            onClick={() => {
              const schema = this.typesSchema || 'public';
              if (this.typesLocal) {
                this.run(() => supabaseGen.typesLocal(schema), `supabase gen types typescript --local --schema ${schema}`);
              } else {
                this.run(() => supabaseGen.types(this.typesProjectRef, schema), `supabase gen types typescript --project-id ${this.typesProjectRef} --schema ${schema}`);
              }
            }}
          >
            Generate Types
          </button>
        </div>
      </div>
    );
  }

  // ── Shell ─────────────────────────────────────────────────────────────────

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => (this.activeTab = tab.id)}>
        {tab.label}
      </button>
    ));
  }

  renderActiveTab() {
    switch (this.activeTab) {
      case 'auth':
        return this.renderAuthTab();
      case 'projects':
        return this.renderProjectsTab();
      case 'local':
        return this.renderLocalTab();
      case 'db':
        return this.renderDbTab();
      case 'functions':
        return this.renderFunctionsTab();
      case 'secrets':
        return this.renderSecretsTab();
      case 'branches':
        return this.renderBranchesTab();
      case 'types':
        return this.renderTypesTab();
      default:
        return null;
    }
  }

  render() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';

    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>⚡</span> Supabase CLI
            <span class="text-sm font-normal text-text2">Supabase project &amp; local dev</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for the Supabase CLI</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">{this.renderTabs()}</div>

        <div class="tab-content mb-6">{this.renderActiveTab()}</div>

        {/* Persistent output panel */}
        <div class="cli-card mt-5">
          <div class="flex justify-between items-center mb-2">
            <span class="text-text2 text-sm">
              Status: <span class={statusColor}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <div class="cli-cmd-preview">{this.lastCommand}</div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }
}
