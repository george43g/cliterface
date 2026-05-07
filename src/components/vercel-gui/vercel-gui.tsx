import { Component, h, State } from '@stencil/core';
import {
  buildDeployCommand,
  buildDomainAddCommand,
  buildDomainRemoveCommand,
  buildEnvAddCommand,
  buildEnvListCommand,
  buildEnvPullCommand,
  buildEnvRemoveCommand,
  buildLogsCommand,
  buildTeamsInviteCommand,
  buildTeamsSwitchCommand,
  type DeployOptions,
  type EnvEnvironment,
  type LogOptions,
} from '../../vercel/vercel-command-builders';
import { getVercelManPage } from '../../vercel/vercel-documentation';
import {
  type CommandResult,
  isValidDeploymentRef,
  isValidDomain,
  isValidProjectName,
  vercelAuth,
  vercelDeploy,
  vercelDomains,
  vercelEnv,
  vercelLogs,
  vercelProjects,
  vercelService,
  vercelTeams,
} from '../../vercel/vercel-service';

const TABS = [
  { id: 'auth', label: 'Auth' },
  { id: 'projects', label: 'Projects' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'env', label: 'Env' },
  { id: 'domains', label: 'Domains' },
  { id: 'logs', label: 'Logs' },
  { id: 'teams', label: 'Teams' },
  { id: 'docs', label: 'Docs' },
  { id: 'raw', label: 'Raw' },
] as const;

type TabId = (typeof TABS)[number]['id'];

@Component({
  tag: 'vercel-gui',
  styleUrl: 'vercel-gui.css',
  scoped: true,
})
export class VercelGui {
  @State() activeTab: TabId = 'auth';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() lastCommand = 'Ready…';
  @State() output = 'Select a tab and run a command.';
  @State() statusMessage = 'Ready';

  // Auth
  @State() loginEmail = '';

  // Projects
  @State() projectName = '';
  @State() projectNameError = '';

  // Deploy
  @State() deployCwd = '';
  @State() deployProd = false;
  @State() deployForce = false;
  @State() deploySkipDomain = false;
  @State() deployPrebuilt = false;
  @State() deployWithCache = false;
  @State() deployTarget = '';
  @State() deployRegions = '';
  @State() deployBuildEnv = '';
  @State() deployIdOrUrl = '';

  // Env
  @State() envName = '';
  @State() envEnvironment: EnvEnvironment = 'production';
  @State() envListEnv: EnvEnvironment = '';
  @State() envPullFile = '.env.local';

  // Domains
  @State() domainName = '';
  @State() domainProject = '';
  @State() domainNameError = '';

  // Logs
  @State() logsRef = '';
  @State() logsFollow = false;
  @State() logsLevel = '';
  @State() logsLimit = 100;
  @State() logsQuery = '';
  @State() logsEnvironment: 'production' | 'preview' | '' = '';
  @State() logsStatusCode = '';
  @State() logsSince = '';

  // Teams
  @State() teamInviteEmail = '';
  @State() teamSwitchSlug = '';

  // Raw
  @State() rawCmd = '';

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private async run(cmd: string, result: Promise<CommandResult>, confirm = false): Promise<void> {
    if (confirm && typeof window !== 'undefined' && !window.confirm(`Execute: ${cmd}?`)) return;
    this.lastCommand = cmd;
    this.status = 'running';
    this.output = 'Executing…';
    this.statusMessage = 'Running…';
    try {
      const r = await result;
      const sections = [r.stdout?.trim(), r.stderr?.trim() ? `stderr:\n${r.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = r.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = r.exitCode === 0 ? 'Done' : `Failed (exit ${r.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private clearOutput(): void {
    this.output = 'Select a tab and run a command.';
    this.lastCommand = 'Ready…';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied!');
  }

  // ─── Command preview builders ─────────────────────────────────────────────

  private buildCurrentDeployCommand(): string {
    const opts: DeployOptions = {
      cwd: this.deployCwd,
      prod: this.deployProd,
      force: this.deployForce,
      skipDomain: this.deploySkipDomain,
      prebuilt: this.deployPrebuilt,
      withCache: this.deployWithCache,
      target: this.deployTarget,
      regions: this.deployRegions,
      buildEnv: this.deployBuildEnv,
    };
    return buildDeployCommand(opts);
  }

  private buildCurrentLogsCommand(): string {
    const opts: LogOptions = {
      follow: this.logsFollow,
      level: this.logsLevel,
      limit: this.logsLimit,
      query: this.logsQuery,
      environment: this.logsEnvironment,
      statusCode: this.logsStatusCode,
      since: this.logsSince,
    };
    return buildLogsCommand(this.logsRef, opts);
  }

  // ─── Tabs renderer ────────────────────────────────────────────────────────

  renderTabs() {
    return TABS.map(tab => (
      <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => (this.activeTab = tab.id)}>
        {tab.label}
      </button>
    ));
  }

  // ─── Output pane ─────────────────────────────────────────────────────────

  renderOutputPane() {
    return (
      <div class="cli-card mt-5">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-text2 text-base">
            Command Preview &amp; Output
            <span class={`ml-3 text-sm font-normal ${this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2'}`}>
              {this.statusMessage}
            </span>
          </h3>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview mb-3">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ─── Auth tab ────────────────────────────────────────────────────────────

  renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Authentication</h3>

          <div class="flex flex-wrap gap-2 mb-5">
            <button type="button" class="cli-btn" onClick={() => this.run('vercel whoami', vercelAuth.whoami())}>
              whoami
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.run('vercel logout', vercelAuth.logout(), true)}>
              Logout
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2">
            Email / Username
            <input
              type="text"
              class="cli-input w-full"
              placeholder="you@example.com"
              value={this.loginEmail}
              onInput={(e: Event) => (this.loginEmail = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex gap-2 mt-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(`vercel login ${this.loginEmail}`, vercelAuth.login(this.loginEmail))}>
              Login
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Link / Pull</h3>
          <p class="text-text2 text-sm mb-3">
            Set the <code>--cwd</code> path on the Deploy tab, then link or pull from here.
          </p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn" onClick={() => this.run('vercel link --yes', vercelService.execute('link --yes'))}>
              Link project
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.run('vercel unlink', vercelService.execute('unlink'), true)}>
              Unlink
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run('vercel pull', vercelService.execute('pull --yes'))}>
              Pull settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Projects tab ─────────────────────────────────────────────────────────

  renderProjectsTab() {
    const nameInvalid = this.projectName && !isValidProjectName(this.projectName);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Project List</h3>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('vercel project list', vercelProjects.list())}>
            List projects
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Inspect / Add / Remove</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project name / slug
            <input
              type="text"
              class={`cli-input w-full ${nameInvalid ? 'cli-input-invalid' : ''}`}
              placeholder="my-app"
              value={this.projectName}
              onInput={(e: Event) => {
                this.projectName = (e.target as HTMLInputElement).value;
                this.projectNameError = isValidProjectName(this.projectName) ? '' : 'Lowercase letters, numbers, hyphens only';
              }}
            />
            {this.projectNameError && <span class="cli-validation-message invalid">{this.projectNameError}</span>}
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn"
              disabled={!this.projectName}
              onClick={() => this.run(`vercel project inspect ${this.projectName}`, vercelProjects.inspect(this.projectName))}
            >
              Inspect
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!this.projectName || !!this.projectNameError}
              onClick={() => this.run(`vercel project add ${this.projectName}`, vercelProjects.add(this.projectName))}
            >
              Add project
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              disabled={!this.projectName}
              onClick={() => this.run(`vercel project remove ${this.projectName} --yes`, vercelProjects.remove(this.projectName), true)}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Deploy tab ───────────────────────────────────────────────────────────

  renderDeployTab() {
    const previewCmd = this.buildCurrentDeployCommand();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Deploy Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Working directory (--cwd)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="/path/to/project"
              value={this.deployCwd}
              onInput={(e: Event) => (this.deployCwd = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.deployProd} onChange={(e: Event) => (this.deployProd = (e.target as HTMLInputElement).checked)} />
              Production (--prod)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.deployForce} onChange={(e: Event) => (this.deployForce = (e.target as HTMLInputElement).checked)} />
              Force (-f)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.deployPrebuilt} onChange={(e: Event) => (this.deployPrebuilt = (e.target as HTMLInputElement).checked)} />
              Prebuilt (--prebuilt)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.deploySkipDomain} onChange={(e: Event) => (this.deploySkipDomain = (e.target as HTMLInputElement).checked)} />
              Skip domain
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.deployWithCache} onChange={(e: Event) => (this.deployWithCache = (e.target as HTMLInputElement).checked)} />
              With cache
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Target environment (--target)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="production / preview / staging"
              value={this.deployTarget}
              onInput={(e: Event) => (this.deployTarget = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Regions (--regions)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="iad1,sfo1"
              value={this.deployRegions}
              onInput={(e: Event) => (this.deployRegions = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Build env vars (-b KEY=val …)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="NODE_ENV=production API_URL=https://…"
              value={this.deployBuildEnv}
              onInput={(e: Event) => (this.deployBuildEnv = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class={`cli-btn ${this.deployProd ? 'cli-btn-success' : ''}`}
              onClick={() => this.run(previewCmd, vercelDeploy.deployPreview(this.deployCwd, ''), this.deployProd)}
              title={this.deployProd ? 'Deploys to production' : 'Deploys a preview'}
            >
              {this.deployProd ? 'Deploy to Production' : 'Deploy Preview'}
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run(`vercel build${this.deployCwd ? ` --cwd ${this.deployCwd}` : ''}`, vercelDeploy.build(this.deployCwd))}>
              Build only
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-1">Command Preview</h3>
          <div class="cli-cmd-preview mb-4">{previewCmd}</div>

          <h3 class="text-text2 text-base mb-3">Manage Deployments</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Deployment URL or ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="dpl_xxx or https://…vercel.app"
              value={this.deployIdOrUrl}
              onInput={(e: Event) => (this.deployIdOrUrl = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              class="cli-btn"
              disabled={!this.deployIdOrUrl}
              onClick={() => this.run(`vercel inspect ${this.deployIdOrUrl}`, vercelDeploy.inspect(this.deployIdOrUrl))}
            >
              Inspect
            </button>
            <button
              type="button"
              class="cli-btn"
              disabled={!isValidDeploymentRef(this.deployIdOrUrl)}
              onClick={() => this.run(`vercel redeploy ${this.deployIdOrUrl}`, vercelDeploy.redeploy(this.deployIdOrUrl))}
            >
              Redeploy
            </button>
          </div>

          <div class="border-t border-bg3 pt-3 mt-1">
            <p class="text-xs text-text2 mb-2">Destructive operations — require confirmation</p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="cli-btn cli-btn-warning"
                disabled={!this.deployIdOrUrl}
                onClick={() => this.run(`vercel promote ${this.deployIdOrUrl}`, vercelDeploy.promote(this.deployIdOrUrl), true)}
              >
                Promote to prod
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-danger"
                onClick={() => this.run(`vercel rollback${this.deployIdOrUrl ? ` ${this.deployIdOrUrl}` : ''}`, vercelDeploy.rollback(this.deployIdOrUrl), true)}
              >
                Rollback
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-danger"
                disabled={!this.deployIdOrUrl}
                onClick={() => this.run(`vercel rm ${this.deployIdOrUrl} --yes`, vercelDeploy.remove(this.deployIdOrUrl), true)}
              >
                Remove deployment
              </button>
            </div>
          </div>

          <div class="mt-4">
            <h4 class="text-text2 text-sm mb-2">List deployments</h4>
            <div class="flex gap-2 items-center">
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="project name (optional)"
                value={this.projectName}
                onInput={(e: Event) => (this.projectName = (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.run(`vercel ls${this.projectName ? ` ${this.projectName}` : ''}`, vercelDeploy.list(this.projectName))}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Env tab ──────────────────────────────────────────────────────────────

  renderEnvTab() {
    const envOptions: EnvEnvironment[] = ['production', 'preview', 'development', ''];
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List &amp; Pull</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Environment filter
            <select class="cli-select w-full" onChange={(e: Event) => (this.envListEnv = (e.target as HTMLSelectElement).value as EnvEnvironment)}>
              <option value="">All</option>
              <option value="production">production</option>
              <option value="preview">preview</option>
              <option value="development">development</option>
            </select>
          </label>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(buildEnvListCommand(this.envListEnv), vercelEnv.list(this.envListEnv))}>
              List vars
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Pull to file
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder=".env.local"
              value={this.envPullFile}
              onInput={(e: Event) => (this.envPullFile = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button type="button" class="cli-btn" onClick={() => this.run(buildEnvPullCommand(this.envPullFile), vercelEnv.pull(this.envPullFile))}>
            Pull env vars
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Add / Remove</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Variable name
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="MY_SECRET"
              value={this.envName}
              onInput={(e: Event) => (this.envName = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Environment
            <select class="cli-select w-full" onChange={(e: Event) => (this.envEnvironment = (e.target as HTMLSelectElement).value as EnvEnvironment)}>
              {envOptions.filter(Boolean).map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!this.envName}
              onClick={() => this.run(buildEnvAddCommand(this.envName, this.envEnvironment), vercelEnv.add(this.envName, this.envEnvironment))}
            >
              Add var
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              disabled={!this.envName}
              onClick={() => this.run(buildEnvRemoveCommand(this.envName, this.envEnvironment), vercelEnv.remove(this.envName, this.envEnvironment), true)}
            >
              Remove var
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Domains tab ──────────────────────────────────────────────────────────

  renderDomainsTab() {
    const domainInvalid = this.domainName && !isValidDomain(this.domainName);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List &amp; Inspect</h3>
          <div class="flex gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('vercel domains list', vercelDomains.list())}>
              List domains
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Domain name
            <input
              type="text"
              class={`cli-input w-full ${domainInvalid ? 'cli-input-invalid' : ''}`}
              placeholder="example.com"
              value={this.domainName}
              onInput={(e: Event) => {
                this.domainName = (e.target as HTMLInputElement).value;
                this.domainNameError = this.domainName && !isValidDomain(this.domainName) ? 'Enter a valid domain name' : '';
              }}
            />
            {this.domainNameError && <span class="cli-validation-message invalid">{this.domainNameError}</span>}
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn"
              disabled={!this.domainName || !!this.domainNameError}
              onClick={() => this.run(`vercel domains inspect ${this.domainName}`, vercelDomains.inspect(this.domainName))}
            >
              Inspect
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              disabled={!this.domainName || !!this.domainNameError}
              onClick={() => this.run(`vercel domains buy ${this.domainName}`, vercelDomains.buy(this.domainName), true)}
            >
              Buy domain
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Add / Remove</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Project name (for add)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-project"
              value={this.domainProject}
              onInput={(e: Event) => (this.domainProject = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!this.domainName || !!this.domainNameError}
              onClick={() => this.run(buildDomainAddCommand(this.domainName, this.domainProject), vercelDomains.add(this.domainName, this.domainProject))}
            >
              Add domain
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              disabled={!this.domainName || !!this.domainNameError}
              onClick={() => this.run(buildDomainRemoveCommand(this.domainName), vercelDomains.remove(this.domainName), true)}
            >
              Remove domain
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Logs tab ─────────────────────────────────────────────────────────────

  renderLogsTab() {
    const previewCmd = this.buildCurrentLogsCommand();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Logs Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Deployment URL or ID
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="https://my-app.vercel.app or dpl_xxx"
              value={this.logsRef}
              onInput={(e: Event) => (this.logsRef = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.logsFollow} onChange={(e: Event) => (this.logsFollow = (e.target as HTMLInputElement).checked)} />
              Follow (-f)
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Level
              <select class="cli-select" onChange={(e: Event) => (this.logsLevel = (e.target as HTMLSelectElement).value)}>
                <option value="">All</option>
                <option value="error">error</option>
                <option value="warning">warning</option>
                <option value="info">info</option>
                <option value="fatal">fatal</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Environment
              <select class="cli-select" onChange={(e: Event) => (this.logsEnvironment = (e.target as HTMLSelectElement).value as 'production' | 'preview' | '')}>
                <option value="">Any</option>
                <option value="production">production</option>
                <option value="preview">preview</option>
              </select>
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Limit
            <input
              type="number"
              class="cli-input w-24"
              min="1"
              max="1000"
              value={this.logsLimit}
              onInput={(e: Event) => (this.logsLimit = parseInt((e.target as HTMLInputElement).value, 10) || 100)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Query (--query)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="status:500 error"
              value={this.logsQuery}
              onInput={(e: Event) => (this.logsQuery = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            HTTP status code filter
            <input
              type="text"
              class="cli-input w-full"
              placeholder="500 or 4xx"
              value={this.logsStatusCode}
              onInput={(e: Event) => (this.logsStatusCode = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Since (--since)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="1h or 30m or ISO date"
              value={this.logsSince}
              onInput={(e: Event) => (this.logsSince = (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-1">Command Preview</h3>
          <div class="cli-cmd-preview mb-4">{previewCmd}</div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(
                previewCmd,
                vercelLogs.get(this.logsRef, {
                  follow: this.logsFollow,
                  level: this.logsLevel,
                  limit: this.logsLimit,
                  query: this.logsQuery,
                  environment: this.logsEnvironment,
                  statusCode: this.logsStatusCode,
                  since: this.logsSince,
                }),
              )
            }
          >
            Fetch Logs
          </button>
        </div>
      </div>
    );
  }

  // ─── Teams tab ────────────────────────────────────────────────────────────

  renderTeamsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Team Info</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run('vercel teams list', vercelTeams.list())}>
              List teams
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run('vercel teams members', vercelTeams.members())}>
              List members
            </button>
          </div>

          <h4 class="text-text2 text-sm mb-2">Switch team</h4>
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="team-slug"
              value={this.teamSwitchSlug}
              onInput={(e: Event) => (this.teamSwitchSlug = (e.target as HTMLInputElement).value)}
            />
            <button
              type="button"
              class="cli-btn"
              disabled={!this.teamSwitchSlug}
              onClick={() => this.run(buildTeamsSwitchCommand(this.teamSwitchSlug), vercelTeams.switchTeam(this.teamSwitchSlug))}
            >
              Switch
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Invite &amp; Create</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Invite by email
            <input
              type="text"
              class="cli-input w-full"
              placeholder="colleague@example.com"
              value={this.teamInviteEmail}
              onInput={(e: Event) => (this.teamInviteEmail = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!this.teamInviteEmail}
              onClick={() => this.run(buildTeamsInviteCommand(this.teamInviteEmail), vercelTeams.invite(this.teamInviteEmail))}
            >
              Invite
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run('vercel teams add', vercelTeams.add(''))}>
              Create team
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Docs tab ─────────────────────────────────────────────────────────────

  renderDocsTab() {
    const page = getVercelManPage();
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{page.name}</h2>
          <p class="text-text2 text-sm mb-3 font-mono">{page.synopsis}</p>
          <p class="text-text2 text-sm mb-5">{page.description}</p>

          {page.sections.map((section, i) => (
            <div key={i} class="mb-5">
              <h3 class="text-base font-medium mb-2">{section.title}</h3>
              <pre class="cli-output text-sm">{section.content}</pre>
            </div>
          ))}

          <div class="mt-4">
            <h3 class="text-base font-medium mb-3">Examples</h3>
            <div class="space-y-2">
              {page.examples.map((ex, i) => (
                <div key={i} class="flex gap-4 items-start p-3 bg-bg3 rounded-lg">
                  <code class="font-mono text-sm flex-1 text-success">{ex.command}</code>
                  <span class="text-text2 text-sm shrink-0">{ex.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Raw tab ──────────────────────────────────────────────────────────────

  renderRawTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Raw Command</h3>
          <p class="text-text2 text-sm mb-3">
            Enter any <code>vercel</code> command. The prefix <code>vercel</code> is added automatically if missing.
          </p>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="vercel ls"
              value={this.rawCmd}
              onInput={(e: Event) => (this.rawCmd = (e.target as HTMLInputElement).value)}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.run(this.rawCmd, vercelService.execute(this.rawCmd));
              }}
            />
          </label>
          <button type="button" class="cli-btn cli-btn-success" disabled={!this.rawCmd.trim()} onClick={() => this.run(this.rawCmd, vercelService.execute(this.rawCmd))}>
            Execute
          </button>
        </div>
      </div>
    );
  }

  // ─── Root render ──────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span aria-hidden="true">▲</span> Vercel CLI
            <span class="cli-badge-info">GUI</span>
          </h2>
          <p class="text-text2 text-sm">Deploy and manage projects with the Vercel CLI</p>
        </header>

        <div class="flex flex-wrap gap-2 border-b border-accent2 pb-2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'auth' && this.renderAuthTab()}
          {this.activeTab === 'projects' && this.renderProjectsTab()}
          {this.activeTab === 'deploy' && this.renderDeployTab()}
          {this.activeTab === 'env' && this.renderEnvTab()}
          {this.activeTab === 'domains' && this.renderDomainsTab()}
          {this.activeTab === 'logs' && this.renderLogsTab()}
          {this.activeTab === 'teams' && this.renderTeamsTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
          {this.activeTab === 'raw' && this.renderRawTab()}
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }
}
