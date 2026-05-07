/**
 * npx-skills-gui — Visual GUI for the `skills` CLI (npx skills v1.5.5)
 * Package: https://www.npmjs.com/package/skills  |  https://skills.sh/
 *
 * Targeted package choice: the `skills` npm package (v1.5.5) by Vercel Labs is
 * the most widely adopted `npx skills` CLI as of 2025. It is the same package
 * referenced in Supabase MCP instructions ("npx skills add supabase/agent-skills").
 */

import { Component, h, State } from '@stencil/core';
import { getNpxSkillsManPage, KNOWN_AGENTS } from '../../npx-skills/npx-skills-documentation';
import {
  buildAddCommand,
  buildFindCommand,
  buildInitCommand,
  buildInstallCommand,
  buildListCommand,
  buildRemoveCommand,
  buildSyncCommand,
  buildUpdateCommand,
  type CommandResult,
  executeCommand,
  type SkillsScope,
} from '../../npx-skills/npx-skills-service';

const TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'installed', label: 'Installed' },
  { id: 'run', label: 'Run / Manage' },
  { id: 'create', label: 'Create' },
  { id: 'docs', label: 'Docs' },
];

@Component({
  tag: 'npx-skills-gui',
  styleUrl: 'npx-skills-gui.css',
  scoped: true,
})
export class NpxSkillsGui {
  @State() activeTab = 'browse';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'Select an action to see the command preview.';
  @State() output = 'Click any button to execute a command.';

  // ── Browse tab ─────────────────────────────────────────────────────────────
  @State() findQuery = '';

  // ── Installed tab ──────────────────────────────────────────────────────────
  @State() listScope: SkillsScope = 'project';
  @State() listAgent = '';
  @State() listJson = false;

  // ── Run tab ────────────────────────────────────────────────────────────────
  @State() addPackage = '';
  @State() addScope: SkillsScope = 'project';
  @State() addAgents: string[] = [];
  @State() addSkills = '';
  @State() addYes = true;
  @State() addCopy = false;
  @State() addAll = false;

  @State() removeSkills = '';
  @State() removeScope: SkillsScope = 'project';
  @State() removeAgents: string[] = [];
  @State() removeYes = false;
  @State() removeAll = false;

  @State() updateSkills = '';
  @State() updateScope: SkillsScope = 'project';
  @State() updateYes = true;

  @State() syncAgents: string[] = [];
  @State() syncYes = true;

  // ── Create tab ─────────────────────────────────────────────────────────────
  @State() initName = '';

  // ── Confirm modal ──────────────────────────────────────────────────────────
  @State() showConfirm = false;
  @State() confirmMessage = '';
  @State() pendingCmd = '';

  // ─────────────────────────────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private async runCmd(cmd: string): Promise<void> {
    this.lastCommand = cmd;
    this.status = 'running';
    this.statusMessage = 'Running…';
    this.output = 'Executing…';
    try {
      const res: CommandResult = await executeCommand(cmd);
      const parts = [res.stdout?.trim(), res.stderr?.trim() ? `stderr:\n${res.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = res.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = res.exitCode === 0 ? 'Completed' : `Failed (exit ${res.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private requestConfirm(message: string, cmd: string): void {
    this.confirmMessage = message;
    this.pendingCmd = cmd;
    this.showConfirm = true;
  }

  private async confirmAndRun(): Promise<void> {
    this.showConfirm = false;
    await this.runCmd(this.pendingCmd);
  }

  private cancelConfirm(): void {
    this.showConfirm = false;
    this.pendingCmd = '';
  }

  private toggleAgent(agent: string, list: string[]): string[] {
    return list.includes(agent) ? list.filter(a => a !== agent) : [...list, agent];
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied!');
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  private renderTabs() {
    return (
      <div class="border-b border-accent2 mb-4">
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
    );
  }

  private renderStatusBar() {
    const statusClass = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : this.status === 'running' ? 'text-warning' : 'text-text2';
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm">
            Status: <span class={statusClass}>{this.statusMessage}</span>
          </span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
            Copy
          </button>
        </div>
        <div class="cli-cmd-preview mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  private renderAgentChips(selected: string[], onChange: (agents: string[]) => void) {
    return (
      <div class="flex flex-wrap gap-2 mt-1">
        {KNOWN_AGENTS.map(agent => (
          <button key={agent} type="button" class={`skill-chip ${selected.includes(agent) ? 'skill-chip-active' : ''}`} onClick={() => onChange(this.toggleAgent(agent, selected))}>
            {agent}
          </button>
        ))}
      </div>
    );
  }

  private renderScopeToggle(scope: SkillsScope, onChange: (s: SkillsScope) => void) {
    return (
      <div class="flex gap-2 mt-1">
        {(['project', 'global'] as SkillsScope[]).map(s => (
          <button key={s} type="button" class={`cli-btn cli-btn-sm ${scope === s ? 'cli-btn-info' : ''}`} onClick={() => onChange(s)}>
            {s === 'global' ? 'Global (-g)' : 'Project'}
          </button>
        ))}
      </div>
    );
  }

  // ── Browse tab ────────────────────────────────────────────────────────────

  private renderBrowseTab() {
    const findCmd = buildFindCommand(this.findQuery);
    const popularExamples = [
      { pkg: 'vercel-labs/agent-skills', desc: 'Vercel Labs official skill bundle' },
      { pkg: 'supabase/agent-skills', desc: 'Supabase database + API skills' },
      { pkg: 'anthropics/skills', desc: 'Anthropic Claude Code skills' },
    ];
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Search Registry</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Keyword (leave empty for interactive mode)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. typescript, supabase, vercel…"
              value={this.findQuery}
              onInput={(e: Event) => {
                this.findQuery = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="cli-cmd-preview mb-3">{findCmd}</div>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCmd(findCmd)}>
            Search
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Popular Packages</h3>
          <p class="text-text2 text-sm mb-3">Click to pre-fill the Add form in the Run tab.</p>
          <div class="space-y-2">
            {popularExamples.map(ex => (
              <div key={ex.pkg} class="flex items-center justify-between p-3 bg-bg3 rounded-lg">
                <div>
                  <code class="text-sm text-accent">{ex.pkg}</code>
                  <p class="text-xs text-text2 mt-0.5">{ex.desc}</p>
                </div>
                <button
                  type="button"
                  class="cli-btn cli-btn-sm"
                  onClick={() => {
                    this.addPackage = ex.pkg;
                    this.activeTab = 'run';
                  }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Installed tab ─────────────────────────────────────────────────────────

  private renderInstalledTab() {
    const listCmd = buildListCommand(this.listScope, this.listAgent, this.listJson);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Installed Skills</h3>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Scope</span>
            {this.renderScopeToggle(this.listScope, s => {
              this.listScope = s;
            })}
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Filter by agent (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="e.g. claude-code"
              value={this.listAgent}
              onInput={(e: Event) => {
                this.listAgent = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input
              type="checkbox"
              checked={this.listJson}
              onChange={(e: Event) => {
                this.listJson = (e.target as HTMLInputElement).checked;
              }}
            />
            Output as JSON (--json)
          </label>

          <div class="cli-cmd-preview mb-3">{listCmd}</div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCmd(listCmd)}>
            List Skills
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Quick Actions</h3>
          <div class="space-y-2">
            <button type="button" class="cli-btn w-full text-left" onClick={() => this.runCmd(buildListCommand('project'))}>
              List project skills
            </button>
            <button type="button" class="cli-btn w-full text-left" onClick={() => this.runCmd(buildListCommand('global'))}>
              List global skills
            </button>
            <button type="button" class="cli-btn w-full text-left" onClick={() => this.runCmd(buildListCommand('project', '', true))}>
              List project skills (JSON)
            </button>
            <button type="button" class="cli-btn w-full text-left" onClick={() => this.runCmd(buildInstallCommand())}>
              Restore from skills-lock.json
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run tab ───────────────────────────────────────────────────────────────

  private renderRunTab() {
    const addSkillsList = this.addSkills.trim() ? this.addSkills.trim().split(/\s+/) : [];
    const addCmd = buildAddCommand(this.addPackage, this.addScope, this.addAgents, addSkillsList, this.addYes, this.addCopy, this.addAll);

    const removeSkillsList = this.removeSkills.trim() ? this.removeSkills.trim().split(/\s+/) : [];
    const removeCmd = buildRemoveCommand(removeSkillsList, this.removeScope, this.removeAgents, this.removeYes, this.removeAll);

    const updateSkillsList = this.updateSkills.trim() ? this.updateSkills.trim().split(/\s+/) : [];
    const updateCmd = buildUpdateCommand(updateSkillsList, this.updateScope, this.updateYes);

    const syncCmd = buildSyncCommand(this.syncAgents, this.syncYes);

    return (
      <div class="space-y-5">
        {/* ── Add ─────────────────────────────────────────────── */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-safe">action</span>
            Add Skill Package
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Package (GitHub path, URL, or npm)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="vercel-labs/agent-skills"
              value={this.addPackage}
              onInput={(e: Event) => {
                this.addPackage = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Scope</span>
            {this.renderScopeToggle(this.addScope, s => {
              this.addScope = s;
            })}
          </div>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Agents (-a) — leave unchecked for default</span>
            {this.renderAgentChips(this.addAgents, agents => {
              this.addAgents = agents;
            })}
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Specific skill names (-s, space-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="pr-review commit security-review"
              value={this.addSkills}
              onInput={(e: Event) => {
                this.addSkills = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-4 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.addYes}
                onChange={(e: Event) => {
                  this.addYes = (e.target as HTMLInputElement).checked;
                }}
              />
              Skip prompts (-y)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.addCopy}
                onChange={(e: Event) => {
                  this.addCopy = (e.target as HTMLInputElement).checked;
                }}
              />
              Copy files (--copy)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.addAll}
                onChange={(e: Event) => {
                  this.addAll = (e.target as HTMLInputElement).checked;
                }}
              />
              All skills + agents (--all)
            </label>
          </div>

          <div class="cli-cmd-preview mb-3">{addCmd || 'Enter a package name above'}</div>

          <button type="button" class="cli-btn cli-btn-success" disabled={!this.addPackage.trim()} onClick={() => this.runCmd(addCmd)}>
            Add Skill
          </button>
        </div>

        {/* ── Update ──────────────────────────────────────────── */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-info">action</span>
            Update Skills
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Skill names to update (leave empty to update all)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-skill another-skill"
              value={this.updateSkills}
              onInput={(e: Event) => {
                this.updateSkills = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Scope</span>
            {this.renderScopeToggle(this.updateScope, s => {
              this.updateScope = s;
            })}
          </div>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.updateYes}
              onChange={(e: Event) => {
                this.updateYes = (e.target as HTMLInputElement).checked;
              }}
            />
            Skip prompts (-y)
          </label>

          <div class="cli-cmd-preview mb-3">{updateCmd}</div>

          <button type="button" class="cli-btn" onClick={() => this.runCmd(updateCmd)}>
            Update Skills
          </button>
        </div>

        {/* ── Sync ────────────────────────────────────────────── */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-info">experimental</span>
            Sync from node_modules
          </h3>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Agents (leave unchecked for all)</span>
            {this.renderAgentChips(this.syncAgents, agents => {
              this.syncAgents = agents;
            })}
          </div>

          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.syncYes}
              onChange={(e: Event) => {
                this.syncYes = (e.target as HTMLInputElement).checked;
              }}
            />
            Skip prompts (-y)
          </label>

          <div class="cli-cmd-preview mb-3">{syncCmd}</div>

          <button type="button" class="cli-btn" onClick={() => this.runCmd(syncCmd)}>
            Sync Skills
          </button>
        </div>

        {/* ── Remove ──────────────────────────────────────────── */}
        <div class="cli-card border border-danger/30">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            <span class="cli-badge-sip">destructive</span>
            Remove Skills
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Skill names to remove (space-separated; leave empty for interactive)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="web-design frontend-design"
              value={this.removeSkills}
              onInput={(e: Event) => {
                this.removeSkills = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Scope</span>
            {this.renderScopeToggle(this.removeScope, s => {
              this.removeScope = s;
            })}
          </div>

          <div class="flex flex-col gap-1 text-sm text-text2 mb-3">
            <span>Agents (-a)</span>
            {this.renderAgentChips(this.removeAgents, agents => {
              this.removeAgents = agents;
            })}
          </div>

          <div class="flex flex-wrap gap-4 mb-3">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.removeYes}
                onChange={(e: Event) => {
                  this.removeYes = (e.target as HTMLInputElement).checked;
                }}
              />
              Skip prompts (-y)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.removeAll}
                onChange={(e: Event) => {
                  this.removeAll = (e.target as HTMLInputElement).checked;
                }}
              />
              Remove all (--all)
            </label>
          </div>

          <div class="cli-cmd-preview mb-3">{removeCmd}</div>

          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => this.requestConfirm(`Remove skills? This will delete skill files from agent directories.`, removeCmd)}
          >
            Remove Skills
          </button>
        </div>
      </div>
    );
  }

  // ── Create tab ────────────────────────────────────────────────────────────

  private renderCreateTab() {
    const initCmd = buildInitCommand(this.initName);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Initialize a New Skill</h3>
          <p class="text-text2 text-sm mb-3">
            Creates a <code class="text-accent">SKILL.md</code> file that defines a reusable AI agent skill.
          </p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Skill name (optional — creates in current directory if omitted)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-awesome-skill"
              value={this.initName}
              onInput={(e: Event) => {
                this.initName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="cli-cmd-preview mb-3">{initCmd}</div>

          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runCmd(initCmd)}>
            Initialize Skill
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">SKILL.md Structure</h3>
          <pre class="cli-output text-xs">{SKILL_TEMPLATE}</pre>
        </div>
      </div>
    );
  }

  // ── Docs tab ──────────────────────────────────────────────────────────────

  private renderDocsTab() {
    const doc = getNpxSkillsManPage();
    return (
      <div class="space-y-5">
        <div class="cli-card">
          <h2 class="text-xl mb-2">{doc.name}</h2>
          <p class="text-text2 text-sm mb-4">
            <code class="text-accent">{doc.synopsis}</code>
          </p>
          <p class="text-sm mb-4">{doc.description}</p>

          {doc.sections.map((section, i) => (
            <div key={i} class="mb-5">
              <h3 class="text-base font-medium mb-2">{section.title}</h3>
              <pre class="cli-output text-xs">{section.content}</pre>
            </div>
          ))}
        </div>

        <div class="cli-card">
          <h3 class="text-base font-medium mb-3">Examples</h3>
          <div class="space-y-2">
            {doc.examples.map((ex, i) => (
              <div key={i} class="flex gap-3 items-start p-3 bg-bg3 rounded-lg">
                <code class="font-mono text-xs text-success flex-1">{ex.command}</code>
                <span class="text-text2 text-xs shrink-0 max-w-[200px] text-right">{ex.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm modal ─────────────────────────────────────────────────────────

  private renderConfirmModal() {
    if (!this.showConfirm) return null;
    return (
      <div class="cli-modal-overlay">
        <div class="cli-modal" style={{ maxWidth: '480px' }}>
          <div class="cli-modal-header">
            <h2 class="cli-modal-title text-danger">Confirm Destructive Action</h2>
            <button type="button" class="cli-modal-close" onClick={() => this.cancelConfirm()}>
              ×
            </button>
          </div>
          <div class="cli-modal-content">
            <p class="mb-4">{this.confirmMessage}</p>
            <div class="cli-cmd-preview mb-4">{this.pendingCmd}</div>
            <div class="flex gap-3">
              <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.confirmAndRun()}>
                Yes, proceed
              </button>
              <button type="button" class="cli-btn" onClick={() => this.cancelConfirm()}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        {this.renderConfirmModal()}

        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>💎</span> npx skills
            <span class="text-sm font-normal text-text2">v1.5.5</span>
          </h2>
          <p class="text-text2 text-sm">Reusable AI agent skills manager</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'browse' && this.renderBrowseTab()}
          {this.activeTab === 'installed' && this.renderInstalledTab()}
          {this.activeTab === 'run' && this.renderRunTab()}
          {this.activeTab === 'create' && this.renderCreateTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
        </div>

        {this.renderStatusBar()}
      </div>
    );
  }
}

// ── Embedded SKILL.md template ───────────────────────────────────────────────

const SKILL_TEMPLATE = `---
name: my-skill
description: A short description of what this skill does.
  Use it when: ...
---

# My Skill

Brief overview of the skill.

## Parameters

- \`param1\` (string, required): What this param does.

## Procedure

Step-by-step instructions for the AI agent.

1. Do this first
2. Then do this
3. Verify with: \`some-command --check\`

## Constraints

- Only run on X condition
- Do NOT do Y
`;
