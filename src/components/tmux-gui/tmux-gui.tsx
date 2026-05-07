import { Component, h, State } from '@stencil/core';
import {
  buildAttachSession,
  buildCapturePane,
  buildDisplayMessage,
  buildKillPane,
  buildKillSession,
  buildKillWindow,
  buildListPanes,
  buildListSessions,
  buildListWindows,
  buildNewSession,
  buildNewWindow,
  buildSendKeys,
  buildSetOption,
  buildSetWindowOption,
  buildSourceFile,
  buildSplitWindow,
  buildSwapPane,
  buildSwapWindow,
  type ConfigSnippet,
  configSnippets,
  FORMAT_PANE,
  FORMAT_SESSION,
  FORMAT_WINDOW,
} from '../../tmux/tmux-command-builders';
import { DEFAULT_PREFIX, type TmuxKeyCategory, tmuxKeybindingCategories } from '../../tmux/tmux-keybindings';
import { TMUX_BINDINGS, TMUX_PREFIX_PRIMARY, TMUX_PREFIX_SECONDARY, TMUX_SETTINGS, TMUX_STATUS_SYMBOLS, TMUX_THEME_COLORS } from '../../tmux/tmux-personal';
import { type CommandResult, executeCommand } from '../../tmux/tmux-service';
import { TMUX_VAULT_NOTES } from '../../tmux/tmux-vault-notes';

const TAB_DEFINITIONS = [
  { id: 'personal', label: '⚙️ Your Setup' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'windows-panes', label: 'Windows / Panes' },
  { id: 'cheatsheet', label: 'Cheatsheet' },
  { id: 'config', label: 'Config (.tmux.conf)' },
  { id: 'notes', label: '📓 Notes' },
];

@Component({
  tag: 'tmux-gui',
  styleUrl: 'tmux-gui.css',
  scoped: true,
})
export class TmuxGui {
  @State() activeTab = 'sessions';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = '';
  @State() output = 'Select a command to see its output here.';
  @State() confirmCmd: string | null = null; // destructive confirm modal

  // ── Sessions tab ─────────────────────────────────────────────────────────
  @State() sessName = '';
  @State() sessDetached = true;
  @State() sessDir = '';
  @State() sessTarget = ''; // for attach / kill / list-windows

  // ── Windows/Panes tab ────────────────────────────────────────────────────
  @State() winTarget = '';
  @State() winName = '';
  @State() winSrcSwap = '';
  @State() winDstSwap = '';
  @State() paneTarget = '';
  @State() paneSplitVertical = false;
  @State() paneSplitPercent = '';
  @State() paneSrcSwap = '';
  @State() paneDstSwap = '';
  @State() sendTarget = '';
  @State() sendKeys = '';
  @State() sendEnter = true;
  @State() captureTarget = '';
  @State() captureJoin = false;

  // ── Cheatsheet tab ───────────────────────────────────────────────────────
  @State() kbSearch = '';
  @State() kbActiveCategory = 'all';

  // ── Config tab ───────────────────────────────────────────────────────────
  @State() optionKey = '';
  @State() optionValue = '';
  @State() optionScope: 'global' | 'session' | 'window' | 'pane' = 'global';
  @State() setWindowOpt = false;
  @State() sourceFilePath = '~/.tmux.conf';
  @State() displayMsg = '';
  @State() selectedSnippet: ConfigSnippet | null = null;
  @State() copiedSnippetId: string | null = null;

  // ── Execution helpers ─────────────────────────────────────────────────────

  private async run(cmd: string): Promise<void> {
    this.lastCommand = cmd;
    this.status = 'running';
    this.statusMessage = 'Running…';
    this.output = 'Executing…';
    try {
      const result: CommandResult = await executeCommand(cmd);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private requestDestructive(cmd: string): void {
    this.confirmCmd = cmd;
  }

  private async confirmDestructive(): Promise<void> {
    const cmd = this.confirmCmd;
    this.confirmCmd = null;
    if (cmd) await this.run(cmd);
  }

  private cancelDestructive(): void {
    this.confirmCmd = null;
  }

  private setTempStatus(msg: string): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = 'Ready';
      }, 2000);
    }
  }

  private async copyToClipboard(text: string, successMsg = 'Copied!'): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTempStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(text);
    this.setTempStatus(successMsg);
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  private renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
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
    ));
  }

  private renderStatusBar() {
    const colour = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';
    return (
      <div class="flex items-center gap-3 mb-1 text-sm">
        <span class="text-text2">Status:</span>
        <span class={colour}>{this.statusMessage}</span>
      </div>
    );
  }

  private renderOutputPane() {
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm">Output</span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyToClipboard(this.output)}>
            Copy
          </button>
        </div>
        {this.lastCommand && (
          <div class="cli-cmd-preview mb-2 text-sm">
            <span class="cmd-segment cmd-segment-command">tmux</span> <span class="cmd-segment cmd-segment-subcommand">{this.lastCommand.replace(/^tmux\s*/, '')}</span>
          </div>
        )}
        {this.renderStatusBar()}
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  private renderConfirmModal() {
    if (!this.confirmCmd) return null;
    return (
      <div class="cli-modal-overlay">
        <div class="cli-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
          <div class="cli-modal-header">
            <h3 id="confirm-modal-title" class="cli-modal-title">
              Confirm Destructive Action
            </h3>
            <button type="button" class="cli-modal-close" onClick={() => this.cancelDestructive()}>
              ×
            </button>
          </div>
          <div class="cli-modal-content">
            <p class="text-text2 mb-4">Are you sure you want to run this command?</p>
            <div class="cli-cmd-preview mb-4 text-sm">{this.confirmCmd}</div>
            <div class="flex gap-3">
              <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.confirmDestructive()}>
                Yes, run it
              </button>
              <button type="button" class="cli-btn" onClick={() => this.cancelDestructive()}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Sessions tab ──────────────────────────────────────────────────────────

  private renderSessionsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* new-session */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">
            new-session
            <span class="cli-badge-safe ml-2">query</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Session name (-s)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="mysession"
              value={this.sessName}
              onInput={(e: Event) => {
                this.sessName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Start directory (-c)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="~/projects/myapp"
              value={this.sessDir}
              onInput={(e: Event) => {
                this.sessDir = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input
              type="checkbox"
              checked={this.sessDetached}
              onChange={(e: Event) => {
                this.sessDetached = (e.target as HTMLInputElement).checked;
              }}
            />
            Detached (-d)
          </label>

          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.run(buildNewSession({ sessionName: this.sessName || undefined, detached: this.sessDetached, startDirectory: this.sessDir || undefined }))}
            >
              Create Session
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() =>
                this.copyToClipboard(buildNewSession({ sessionName: this.sessName || undefined, detached: this.sessDetached, startDirectory: this.sessDir || undefined }))
              }
            >
              Copy cmd
            </button>
          </div>
        </div>

        {/* list / attach / kill */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">list / attach / kill</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Target session (-t)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="mysession (leave blank for current)"
              value={this.sessTarget}
              onInput={(e: Event) => {
                this.sessTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(buildListSessions(FORMAT_SESSION))}>
              list-sessions
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run(buildAttachSession(this.sessTarget || undefined))}>
              attach-session
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.requestDestructive(buildKillSession(this.sessTarget || undefined))}>
              kill-session
            </button>
          </div>

          <p class="text-xs text-text2 mt-3">kill-session will prompt for confirmation before running.</p>
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Windows / Panes tab ───────────────────────────────────────────────────

  private renderWindowsPanesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Windows */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Windows</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Target (-t)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="session:window e.g. mysess:1"
              value={this.winTarget}
              onInput={(e: Event) => {
                this.winTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Window name (-n)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="mywindow"
              value={this.winName}
              onInput={(e: Event) => {
                this.winName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(buildListWindows(this.winTarget || undefined, FORMAT_WINDOW))}>
              list-windows
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run(buildNewWindow({ target: this.winTarget || undefined, windowName: this.winName || undefined }))}>
              new-window
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.requestDestructive(buildKillWindow(this.winTarget || undefined))}>
              kill-window
            </button>
          </div>

          <h4 class="text-sm text-text2 mb-2">swap-window</h4>
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="src (e.g. :1)"
              value={this.winSrcSwap}
              onInput={(e: Event) => {
                this.winSrcSwap = (e.target as HTMLInputElement).value;
              }}
            />
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="dst (e.g. :3)"
              value={this.winDstSwap}
              onInput={(e: Event) => {
                this.winDstSwap = (e.target as HTMLInputElement).value;
              }}
            />
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() => {
              if (this.winSrcSwap && this.winDstSwap) {
                this.run(buildSwapWindow(this.winSrcSwap, this.winDstSwap));
              }
            }}
          >
            swap-window
          </button>
        </div>

        {/* Panes */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Panes</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Pane target (-t)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="sess:win.pane e.g. mysess:1.0"
              value={this.paneTarget}
              onInput={(e: Event) => {
                this.paneTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex gap-3 mb-2">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.paneSplitVertical}
                onChange={(e: Event) => {
                  this.paneSplitVertical = (e.target as HTMLInputElement).checked;
                }}
              />
              Vertical split (-v top/bottom)
            </label>
            <label class="flex items-center gap-1 text-sm text-text2">
              %
              <input
                type="number"
                class="cli-input w-16"
                min="10"
                max="90"
                placeholder="50"
                value={this.paneSplitPercent}
                onInput={(e: Event) => {
                  this.paneSplitPercent = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(buildListPanes(this.paneTarget || undefined, FORMAT_PANE))}>
              list-panes
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() =>
                this.run(
                  buildSplitWindow({
                    target: this.paneTarget || undefined,
                    vertical: this.paneSplitVertical,
                    percent: this.paneSplitPercent ? parseInt(this.paneSplitPercent, 10) : undefined,
                  }),
                )
              }
            >
              split-window
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.requestDestructive(buildKillPane(this.paneTarget || undefined))}>
              kill-pane
            </button>
          </div>

          <h4 class="text-sm text-text2 mb-2">swap-pane</h4>
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="src pane"
              value={this.paneSrcSwap}
              onInput={(e: Event) => {
                this.paneSrcSwap = (e.target as HTMLInputElement).value;
              }}
            />
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="dst pane"
              value={this.paneDstSwap}
              onInput={(e: Event) => {
                this.paneDstSwap = (e.target as HTMLInputElement).value;
              }}
            />
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() => {
              if (this.paneSrcSwap && this.paneDstSwap) {
                this.run(buildSwapPane(this.paneSrcSwap, this.paneDstSwap));
              }
            }}
          >
            swap-pane
          </button>
        </div>

        {/* send-keys / capture-pane */}
        <div class="cli-card xl:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h3 class="text-text2 text-base mb-3">send-keys</h3>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
                Target pane (-t)
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="mysess:1.0"
                  value={this.sendTarget}
                  onInput={(e: Event) => {
                    this.sendTarget = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
                Keys to send
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="clear"
                  value={this.sendKeys}
                  onInput={(e: Event) => {
                    this.sendKeys = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex items-center gap-2 text-sm text-text2 mb-3">
                <input
                  type="checkbox"
                  checked={this.sendEnter}
                  onChange={(e: Event) => {
                    this.sendEnter = (e.target as HTMLInputElement).checked;
                  }}
                />
                Append Enter
              </label>
              <button
                type="button"
                class="cli-btn"
                onClick={() => {
                  if (this.sendTarget && this.sendKeys) {
                    this.run(buildSendKeys(this.sendTarget, this.sendKeys, this.sendEnter));
                  }
                }}
              >
                send-keys
              </button>
            </div>

            <div>
              <h3 class="text-text2 text-base mb-3">capture-pane</h3>
              <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
                Target pane (-t)
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="mysess:1.0"
                  value={this.captureTarget}
                  onInput={(e: Event) => {
                    this.captureTarget = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex items-center gap-2 text-sm text-text2 mb-3">
                <input
                  type="checkbox"
                  checked={this.captureJoin}
                  onChange={(e: Event) => {
                    this.captureJoin = (e.target as HTMLInputElement).checked;
                  }}
                />
                Join lines (-J)
              </label>
              <button
                type="button"
                class="cli-btn cli-btn-success"
                onClick={() => this.run(buildCapturePane({ target: this.captureTarget || undefined, joinLines: this.captureJoin }))}
              >
                capture-pane
              </button>
            </div>
          </div>
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Cheatsheet tab ─────────────────────────────────────────────────────────

  private renderCheatsheetTab() {
    const q = this.kbSearch.toLowerCase().trim();

    const categoryIds = ['all', ...tmuxKeybindingCategories.map(c => c.id)];

    const filteredCats: TmuxKeyCategory[] = tmuxKeybindingCategories
      .filter(cat => this.kbActiveCategory === 'all' || cat.id === this.kbActiveCategory)
      .map(cat => ({
        ...cat,
        bindings: cat.bindings.filter(b => !q || b.key.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.bindings.length > 0);

    return (
      <div class="grid grid-cols-1 gap-5">
        {/* Controls */}
        <div class="cli-card">
          <div class="flex flex-wrap gap-3 items-center">
            <div class="flex items-center gap-2 text-sm text-text2">
              <span>Prefix:</span>
              <span class="key-chip">{DEFAULT_PREFIX}</span>
            </div>
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="Search keybindings…"
              value={this.kbSearch}
              onInput={(e: Event) => {
                this.kbSearch = (e.target as HTMLInputElement).value;
              }}
            />
            <div class="flex flex-wrap gap-1">
              {categoryIds.map(catId => {
                const label = catId === 'all' ? 'All' : (tmuxKeybindingCategories.find(c => c.id === catId)?.label ?? catId);
                return (
                  <button
                    type="button"
                    key={catId}
                    class={`cli-tab cli-btn-sm ${this.kbActiveCategory === catId ? 'cli-tab-active' : ''}`}
                    onClick={() => {
                      this.kbActiveCategory = catId;
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div class="flex gap-4 mt-3 text-xs text-text2">
            <span>
              <span class="prefix-chip">{DEFAULT_PREFIX}</span> = prefix required before key
            </span>
          </div>
        </div>

        {/* Keybindings grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCats.map(cat => (
            <div key={cat.id} class="cli-card">
              <div class="cat-header">{cat.label}</div>
              {cat.bindings.map((b, i) => (
                <div key={i} class="kb-row">
                  <div style={{ minWidth: '7rem', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' as const }}>
                    {b.isPrefix && <span class="prefix-chip">{DEFAULT_PREFIX}</span>}
                    <span class="key-chip">{b.key}</span>
                  </div>
                  <span class="kb-desc">{b.description}</span>
                </div>
              ))}
            </div>
          ))}

          {filteredCats.length === 0 && <div class="cli-card md:col-span-2 xl:col-span-3 text-center text-text2">No keybindings match "{this.kbSearch}"</div>}
        </div>

        {/* Custom bindings hook note */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Custom / Dotfile Bindings</h3>
          <p class="text-sm text-text2">
            This cheatsheet shows tmux 3.x defaults. To load your own keybindings from a dotfiles repository, call <code class="text-info">loadCustomKeybindings(source)</code> from{' '}
            <code class="text-info">tmux-keybindings.ts</code> at runtime — the data structure is already defined and ready for injection.
          </p>
        </div>
      </div>
    );
  }

  // ── Config tab ─────────────────────────────────────────────────────────────

  private renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* set-option */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">set-option / set-window-option</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Option name
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="status-bg"
              value={this.optionKey}
              onInput={(e: Event) => {
                this.optionKey = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Value
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="colour234"
              value={this.optionValue}
              onInput={(e: Event) => {
                this.optionValue = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Scope
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.optionScope = (e.target as HTMLSelectElement).value as typeof this.optionScope;
              }}
            >
              <option value="global">Global (-g)</option>
              <option value="session">Session</option>
              <option value="window">Window (-w)</option>
              <option value="pane">Pane (-p)</option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input
              type="checkbox"
              checked={this.setWindowOpt}
              onChange={(e: Event) => {
                this.setWindowOpt = (e.target as HTMLInputElement).checked;
              }}
            />
            Use set-window-option (setw)
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (this.optionKey && this.optionValue) {
                  const cmd = this.setWindowOpt
                    ? buildSetWindowOption(this.optionKey, this.optionValue, this.optionScope === 'global')
                    : buildSetOption(this.optionKey, this.optionValue, this.optionScope);
                  this.run(cmd);
                }
              }}
            >
              Set option
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                if (this.optionKey && this.optionValue) {
                  const cmd = this.setWindowOpt
                    ? buildSetWindowOption(this.optionKey, this.optionValue, this.optionScope === 'global')
                    : buildSetOption(this.optionKey, this.optionValue, this.optionScope);
                  this.copyToClipboard(cmd);
                }
              }}
            >
              Copy cmd
            </button>
          </div>
        </div>

        {/* source-file / display-message */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">source-file</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Config file path
            <input
              type="text"
              class="cli-input w-full font-mono"
              value={this.sourceFilePath}
              onInput={(e: Event) => {
                this.sourceFilePath = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button type="button" class="cli-btn mb-5" onClick={() => this.run(buildSourceFile(this.sourceFilePath))}>
            source-file
          </button>

          <h3 class="text-text2 text-base mb-3">display-message</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Message
            <input
              type="text"
              class="cli-input w-full"
              placeholder="Hello from tmux-gui!"
              value={this.displayMsg}
              onInput={(e: Event) => {
                this.displayMsg = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (this.displayMsg) this.run(buildDisplayMessage(this.displayMsg));
            }}
          >
            display-message
          </button>
        </div>

        {/* Snippets */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Common .tmux.conf Snippets</h3>
          <p class="text-xs text-text2 mb-4">Click a snippet to preview it, then copy to paste into your ~/.tmux.conf.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {configSnippets.map(snip => (
              <button
                type="button"
                key={snip.id}
                class={`cli-btn cli-btn-sm text-left ${this.selectedSnippet?.id === snip.id ? 'cli-btn-info' : ''}`}
                onClick={() => {
                  this.selectedSnippet = snip;
                }}
              >
                <div class="font-medium">{snip.label}</div>
                <div class="text-xs opacity-70 mt-0.5">{snip.description}</div>
              </button>
            ))}
          </div>

          {this.selectedSnippet && (
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-text2 font-medium">{this.selectedSnippet.label}</span>
                <button
                  type="button"
                  class="cli-btn cli-btn-sm"
                  onClick={async () => {
                    await this.copyToClipboard(this.selectedSnippet!.snippet, 'Snippet copied!');
                    this.copiedSnippetId = this.selectedSnippet!.id;
                    if (typeof window !== 'undefined') {
                      window.setTimeout(() => {
                        this.copiedSnippetId = null;
                      }, 2000);
                    }
                  }}
                >
                  {this.copiedSnippetId === this.selectedSnippet.id ? 'Copied!' : 'Copy snippet'}
                </button>
              </div>
              <pre class="snippet-block">{this.selectedSnippet.snippet}</pre>
            </div>
          )}
        </div>

        {this.renderOutputPane()}
      </div>
    );
  }

  // ── Personal tab ──────────────────────────────────────────────────────────

  private renderPersonalTab() {
    const groups = [...new Set(TMUX_BINDINGS.map(b => b.group))];
    return (
      <div class="grid grid-cols-1 gap-5">
        {/* Dual-prefix banner */}
        <div class="cli-card border border-accent2">
          <h3 class="text-base mb-3">Prefixes &amp; Framework</h3>
          <div class="flex flex-wrap gap-3 mb-3">
            <div class="p-2 bg-bg3 rounded">
              <div class="text-text2 text-xs mb-1">Primary prefix</div>
              <code class="text-accent font-bold text-lg">{TMUX_PREFIX_PRIMARY}</code>
            </div>
            <div class="p-2 bg-bg3 rounded">
              <div class="text-text2 text-xs mb-1">Secondary prefix (screen-compat)</div>
              <code class="text-accent font-bold text-lg">{TMUX_PREFIX_SECONDARY}</code>
            </div>
            <div class="p-2 bg-bg3 rounded">
              <div class="text-text2 text-xs mb-1">Framework</div>
              <span class="text-sm">{TMUX_SETTINGS.framework}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="px-2 py-1 bg-bg3 rounded">base-index={TMUX_SETTINGS.baseIndex}</span>
            <span class="px-2 py-1 bg-bg3 rounded">history={TMUX_SETTINGS.historyLimit}</span>
            <span class="px-2 py-1 bg-bg3 rounded">repeat-time={TMUX_SETTINGS.repeatTime}ms</span>
            <span class="px-2 py-1 bg-bg3 rounded">status-interval={TMUX_SETTINGS.statusInterval}s</span>
          </div>
        </div>

        {/* Color palette */}
        <div class="cli-card">
          <h3 class="text-base mb-3">Theme Colors ({TMUX_THEME_COLORS.length} swatches)</h3>
          <div class="flex flex-wrap gap-2">
            {TMUX_THEME_COLORS.map((c, i) => (
              <div key={i} class="flex items-center gap-2 px-2 py-1 bg-bg3 rounded text-xs">
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    backgroundColor: c.hex,
                    border: '1px solid #555',
                    flexShrink: '0' as const,
                  }}
                ></span>
                <code class="text-text2">#{c.id}</code>
                <span class="text-text2">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bindings grouped */}
        {groups.map(group => (
          <div key={group} class="cli-card">
            <h3 class="text-base mb-3">{group}</h3>
            <table class="w-full text-sm">
              <tbody>
                {TMUX_BINDINGS.filter(b => b.group === group).map((b, i) => (
                  <tr key={i} class="border-b border-bg3">
                    <td class="py-1 pr-3 whitespace-nowrap">
                      <code class="text-accent font-mono">{b.keys}</code>
                    </td>
                    <td class="py-1 text-xs">{b.action}</td>
                    {b.note && <td class="py-1 text-xs text-text2 opacity-70">{b.note}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Status symbols */}
        <div class="cli-card">
          <h3 class="text-base mb-3">Status Bar Symbols</h3>
          <div class="flex flex-wrap gap-3">
            {TMUX_STATUS_SYMBOLS.map((s, i) => (
              <div key={i} class="flex items-center gap-2 px-2 py-1 bg-bg3 rounded text-sm">
                <span class="text-accent font-mono text-base">{s.symbol}</span>
                <span class="text-text2 text-xs">{s.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Notes tab ─────────────────────────────────────────────────────────────

  private renderNotesTab() {
    return (
      <div class="grid grid-cols-1 gap-4">
        {TMUX_VAULT_NOTES.map((n, i) => (
          <div key={i} class="cli-card">
            <h3 class="text-base mb-2">{n.heading}</h3>
            {n.tags && n.tags.length > 0 && (
              <div class="mb-2 flex flex-wrap gap-1">
                {n.tags.map(t => (
                  <span key={t} class="text-xs px-2 py-0.5 bg-bg3 rounded text-text2">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <pre class="text-sm text-text whitespace-pre-wrap font-mono leading-relaxed">{n.body}</pre>
            {n.codeSnippet && <pre class="text-xs mt-2 p-2 bg-bg3 rounded font-mono whitespace-pre-wrap text-accent">{n.codeSnippet}</pre>}
          </div>
        ))}
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        {this.renderConfirmModal()}

        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🧱</span> tmux GUI
            <span class="text-sm font-normal text-text2">v3.6a — Terminal Multiplexer + Keybinding Cheatsheet</span>
          </h2>
          <p class="text-text2 text-sm">Command builder and reference for tmux sessions, windows, panes, and configuration.</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'personal' && this.renderPersonalTab()}
          {this.activeTab === 'sessions' && this.renderSessionsTab()}
          {this.activeTab === 'windows-panes' && this.renderWindowsPanesTab()}
          {this.activeTab === 'cheatsheet' && this.renderCheatsheetTab()}
          {this.activeTab === 'config' && this.renderConfigTab()}
          {this.activeTab === 'notes' && this.renderNotesTab()}
        </div>
      </div>
    );
  }
}
