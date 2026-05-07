import { Component, h, State } from '@stencil/core';
import { getVimDocPage } from '../../vim/vim-documentation';
import {
  CLI_FLAGS,
  COMBO_EXAMPLES,
  COMMON_LEADER_BINDINGS,
  EX_COMMAND_GROUPS,
  type KeyBinding,
  type KeyGroup,
  MACRO_GROUPS,
  MOTION_GROUPS,
  OPERATOR_GROUPS,
  TEXT_OBJECTS,
  VIM_MODES,
  type VimMode,
  WINDOW_GROUPS,
} from '../../vim/vim-keybindings';
import { buildVimCommand, type VimCliOptions } from '../../vim/vim-service';

const TABS = [
  { id: 'modes', label: 'Modes' },
  { id: 'motions', label: 'Motions' },
  { id: 'operators', label: 'Operators' },
  { id: 'textobjects', label: 'Text Objects' },
  { id: 'windows', label: 'Windows' },
  { id: 'macros', label: 'Macros' },
  { id: 'excmds', label: 'Ex-Commands' },
  { id: 'flags', label: 'CLI Flags' },
];

@Component({
  tag: 'vim-gui',
  styleUrl: 'vim-gui.css',
  scoped: true,
})
export class VimGui {
  @State() activeTab = 'modes';
  @State() activeMode: VimMode = VIM_MODES[0];
  @State() searchQuery = '';
  @State() useNvim = false;

  // CLI flag builder state
  @State() flagExCmd = '';
  @State() flagPreCmd = '';
  @State() flagVimrc = '';
  @State() flagReadOnly = false;
  @State() flagClean = false;
  @State() flagLineNumber = '';
  @State() flagOpenTabs = false;
  @State() flagOpenSplit = false;
  @State() flagFiles = '';
  @State() builtCommand = '';
  @State() copyFeedback = false;

  componentWillLoad() {
    this.rebuildCommand();
  }

  private rebuildCommand(): void {
    const opts: VimCliOptions = {
      useNvim: this.useNvim,
      exCmd: this.flagExCmd || undefined,
      preCmd: this.flagPreCmd || undefined,
      vimrc: this.flagVimrc || undefined,
      readOnly: this.flagReadOnly,
      clean: this.flagClean,
      lineNumber: this.flagLineNumber || undefined,
      openTabs: this.flagOpenTabs,
      openSplit: this.flagOpenSplit,
      files: this.flagFiles || undefined,
    };
    this.builtCommand = buildVimCommand(opts);
  }

  private copyCommand(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.builtCommand);
      this.copyFeedback = true;
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          this.copyFeedback = false;
        }, 1500);
      }
    }
  }

  private filteredGroups(groups: KeyGroup[]): KeyGroup[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return groups;
    return groups
      .map(g => ({
        ...g,
        bindings: g.bindings.filter(
          b =>
            b.keys.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            (b.mnemonic?.toLowerCase().includes(q) ?? false) ||
            (b.example?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter(g => g.bindings.length > 0);
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  renderKey(k: string) {
    // Split on + but keep Ctrl/Alt/Shift combos as a single chip; handle <...> tokens
    const tokens = k.split(/\s+/);
    return (
      <span class="key-sequence">
        {tokens.map((token, i) => (
          <span key={i} class="key-chip">
            {token}
          </span>
        ))}
      </span>
    );
  }

  renderBindingRow(b: KeyBinding, i: number) {
    return (
      <tr key={i} class="binding-row">
        <td class="binding-keys">{this.renderKey(b.keys)}</td>
        <td class="binding-desc">
          {b.description}
          {b.example && <code class="binding-example">{b.example}</code>}
        </td>
      </tr>
    );
  }

  renderKeyGroup(group: KeyGroup, i: number) {
    return (
      <div key={i} class="cli-card mb-4">
        <h4 class="group-title">{group.title}</h4>
        <table class="binding-table">
          <tbody>{group.bindings.map((b, j) => this.renderBindingRow(b, j))}</tbody>
        </table>
      </div>
    );
  }

  renderSearch() {
    return (
      <div class="search-bar mb-4">
        <input
          type="text"
          class="cli-input w-full"
          placeholder="Filter keybindings…"
          value={this.searchQuery}
          onInput={(e: Event) => {
            this.searchQuery = (e.target as HTMLInputElement).value;
          }}
        />
        {this.searchQuery && (
          <button
            type="button"
            class="cli-btn cli-btn-sm search-clear"
            onClick={() => {
              this.searchQuery = '';
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // ── Tab renderers ───────────────────────────────────────────────────────

  renderModesTab() {
    const doc = getVimDocPage();
    return (
      <div>
        <div class="cli-card mb-4 mode-philosophy">
          <p class="text-text2 text-sm">{doc.description}</p>
        </div>

        <div class="mode-grid mb-6">
          {VIM_MODES.map((mode, i) => (
            <button
              key={i}
              type="button"
              class={`mode-card ${this.activeMode.name === mode.name ? 'mode-card-active' : ''}`}
              style={{ '--mode-color': mode.color } as Record<string, string>}
              onClick={() => {
                this.activeMode = mode;
              }}
            >
              <span class="mode-indicator" style={{ backgroundColor: mode.color }}>
                {mode.indicator}
              </span>
              <span class="mode-name">{mode.name}</span>
            </button>
          ))}
        </div>

        {/* Active mode detail panel */}
        <div class="cli-card mode-detail" style={{ '--mode-color': this.activeMode.color } as Record<string, string>}>
          <div class="mode-detail-header">
            <span class="mode-indicator-lg" style={{ backgroundColor: this.activeMode.color }}>
              {this.activeMode.indicator}
            </span>
            <h3 class="text-xl font-semibold ml-3">{this.activeMode.name} Mode</h3>
          </div>
          <p class="mt-2 text-text2">{this.activeMode.description}</p>
          <div class="mode-detail-grid mt-4">
            <div class="mode-detail-item">
              <span class="mode-detail-label">Enter from Normal</span>
              <code class="mode-detail-value">{this.activeMode.enterFrom}</code>
            </div>
            <div class="mode-detail-item">
              <span class="mode-detail-label">Return to Normal</span>
              <code class="mode-detail-value">{this.activeMode.exitWith}</code>
            </div>
          </div>
        </div>

        {/* Mode transition diagram */}
        <div class="cli-card mt-4">
          <h4 class="group-title mb-3">Quick Mode Switching Cheatsheet</h4>
          <table class="binding-table">
            <thead>
              <tr>
                <th class="text-left text-text2 pb-2 text-sm">From Normal</th>
                <th class="text-left text-text2 pb-2 text-sm">Key(s)</th>
                <th class="text-left text-text2 pb-2 text-sm">Enters</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['i', 'Insert (before cursor)'],
                ['a', 'Insert (after cursor)'],
                ['I', 'Insert (line start)'],
                ['A', 'Insert (line end)'],
                ['o', 'Insert (new line below)'],
                ['O', 'Insert (new line above)'],
                ['v', 'Visual (char)'],
                ['V', 'Visual Line'],
                ['<C-v>', 'Visual Block'],
                [':', 'Command-line'],
                ['/', 'Command-line (search forward)'],
                ['?', 'Command-line (search backward)'],
                ['R', 'Replace'],
                [':terminal', 'Terminal (nvim only)'],
              ].map(([key, desc], i) => (
                <tr key={i} class="binding-row">
                  <td class="binding-keys">{this.renderKey(key)}</td>
                  <td class="binding-desc" colSpan={2}>
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderMotionsTab() {
    const groups = this.filteredGroups(MOTION_GROUPS);
    return (
      <div>
        {this.renderSearch()}
        {groups.length === 0 && <p class="text-text2 text-sm">No matches for "{this.searchQuery}".</p>}
        {groups.map((g, i) => this.renderKeyGroup(g, i))}
      </div>
    );
  }

  renderOperatorsTab() {
    const groups = this.filteredGroups(OPERATOR_GROUPS);
    return (
      <div>
        {this.renderSearch()}
        {groups.length === 0 && <p class="text-text2 text-sm">No matches.</p>}
        {groups.map((g, i) => this.renderKeyGroup(g, i))}

        {!this.searchQuery && (
          <div class="cli-card mt-2">
            <h4 class="group-title mb-3">Operator + Motion Combos</h4>
            <div class="combo-grid">
              {COMBO_EXAMPLES.map((c, i) => (
                <div key={i} class="combo-card">
                  <code class="combo-keys">{c.combo}</code>
                  <span class="combo-breakdown text-text2 text-xs">{c.breakdown}</span>
                  <span class="combo-effect text-sm mt-1">{c.effect}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  renderTextObjectsTab() {
    const q = this.searchQuery.toLowerCase().trim();
    const filtered = q ? TEXT_OBJECTS.filter(t => t.keys.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : TEXT_OBJECTS;

    return (
      <div>
        {this.renderSearch()}
        <div class="cli-card mb-4">
          <p class="text-text2 text-sm mb-3">
            Text objects are selections used with operators. They always come in two flavours:
            <code class="mx-1 px-1 bg-bg3 rounded">i</code> (inner — excludes surrounding delimiters) and
            <code class="mx-1 px-1 bg-bg3 rounded">a</code> (around — includes them).
          </p>
          <p class="text-text2 text-sm">
            Usage: <code class="px-1 bg-bg3 rounded">[operator][i/a][object]</code> — e.g.
            <code class="mx-1 px-1 bg-bg3 rounded text-success">ci"</code> (change inside quotes),
            <code class="mx-1 px-1 bg-bg3 rounded text-info">da(</code> (delete around parens).
          </p>
        </div>
        {filtered.length === 0 && <p class="text-text2 text-sm">No matches.</p>}
        <div class="text-obj-grid">
          {filtered.map((t, i) => (
            <div key={i} class="cli-card text-obj-card">
              <div class="text-obj-keys">{this.renderKey(t.keys)}</div>
              <div class="text-obj-name font-semibold mt-1">{t.name}</div>
              <div class="text-obj-desc text-text2 text-sm mt-1">{t.description}</div>
              <code class="text-obj-example text-xs text-success mt-2 block">{t.example}</code>
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderWindowsTab() {
    const groups = this.filteredGroups(WINDOW_GROUPS);
    return (
      <div>
        {this.renderSearch()}
        {groups.length === 0 && <p class="text-text2 text-sm">No matches.</p>}
        {groups.map((g, i) => this.renderKeyGroup(g, i))}
      </div>
    );
  }

  renderMacrosTab() {
    const groups = this.filteredGroups(MACRO_GROUPS);
    return (
      <div>
        {this.renderSearch()}
        {groups.length === 0 && <p class="text-text2 text-sm">No matches.</p>}
        {groups.map((g, i) => this.renderKeyGroup(g, i))}

        {!this.searchQuery && (
          <div class="cli-card mt-2">
            <h4 class="group-title mb-3">Leader Key Conventions</h4>
            <p class="text-text2 text-sm mb-3">
              The leader key (<code class="px-1 bg-bg3 rounded">\</code> by default, commonly remapped to
              <code class="mx-1 px-1 bg-bg3 rounded">Space</code> or <code class="px-1 bg-bg3 rounded">,</code>) is a user-configurable prefix for custom mappings. These are
              community conventions — your dotfiles may differ.
            </p>
            <table class="binding-table">
              <thead>
                <tr>
                  <th class="text-left text-text2 pb-2 text-sm">Chord</th>
                  <th class="text-left text-text2 pb-2 text-sm">Common mapping</th>
                  <th class="text-left text-text2 pb-2 text-sm">Plugins</th>
                </tr>
              </thead>
              <tbody>
                {COMMON_LEADER_BINDINGS.map((b, i) => (
                  <tr key={i} class="binding-row">
                    <td class="binding-keys">{this.renderKey(b.chord)}</td>
                    <td class="binding-desc">{b.common}</td>
                    <td class="text-text2 text-xs">{b.plugins ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  renderExCmdsTab() {
    const groups = this.filteredGroups(EX_COMMAND_GROUPS);
    return (
      <div>
        {this.renderSearch()}
        {groups.length === 0 && <p class="text-text2 text-sm">No matches.</p>}
        {groups.map((g, i) => this.renderKeyGroup(g, i))}

        {!this.searchQuery && (
          <div class="cli-card mt-4">
            <h4 class="group-title mb-3">Documentation tips</h4>
            <div class="space-y-2">
              {[
                [':help {topic}', 'Open vim help — the best reference. Try :help motion, :help registers'],
                [':help index', 'Full list of all Normal mode commands'],
                [':helpgrep {word}', 'Search across all help files'],
                [':options', 'Browse all options with descriptions'],
                [':scriptnames', 'List all sourced scripts/plugins'],
              ].map(([cmd, desc], i) => (
                <div key={i} class="flex gap-3 items-start p-2 bg-bg3 rounded">
                  <code class="text-accent font-mono text-sm flex-shrink-0">{cmd}</code>
                  <span class="text-text2 text-sm">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  renderFlagsTab() {
    return (
      <div>
        <div class="cli-card mb-4">
          <h4 class="group-title mb-3">CLI Flag Reference</h4>
          <table class="binding-table">
            <thead>
              <tr>
                <th class="text-left text-text2 pb-2 text-sm">Flag</th>
                <th class="text-left text-text2 pb-2 text-sm">Description</th>
                <th class="text-left text-text2 pb-2 text-sm">Example</th>
              </tr>
            </thead>
            <tbody>
              {CLI_FLAGS.map((f, i) => (
                <tr key={i} class="binding-row">
                  <td class="binding-keys">
                    <span class="key-chip">{f.flag}</span>
                    {f.arg && <span class="text-text2 text-xs ml-1">{f.arg}</span>}
                  </td>
                  <td class="binding-desc">{f.description}</td>
                  <td>
                    <code class="text-success text-xs">{f.example}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Interactive command builder */}
        <div class="cli-card">
          <h4 class="group-title mb-4">Command Builder</h4>
          <p class="text-text2 text-sm mb-4">Build a launch command — then copy-paste into your terminal.</p>

          <div class="flag-builder-grid">
            {/* Binary toggle */}
            <label class="flag-row">
              <span class="flag-label">Binary</span>
              <div class="flex gap-3">
                <label class="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="vim-binary"
                    checked={!this.useNvim}
                    onChange={() => {
                      this.useNvim = false;
                      this.rebuildCommand();
                    }}
                  />
                  vim
                </label>
                <label class="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="vim-binary"
                    checked={this.useNvim}
                    onChange={() => {
                      this.useNvim = true;
                      this.rebuildCommand();
                    }}
                  />
                  nvim
                </label>
              </div>
            </label>

            <label class="flag-row">
              <span class="flag-label">File(s)</span>
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="path/to/file.txt"
                value={this.flagFiles}
                onInput={(e: Event) => {
                  this.flagFiles = (e.target as HTMLInputElement).value;
                  this.rebuildCommand();
                }}
              />
            </label>

            <label class="flag-row">
              <span class="flag-label">+N (line)</span>
              <input
                type="text"
                class="cli-input w-24"
                placeholder="42 or $"
                value={this.flagLineNumber}
                onInput={(e: Event) => {
                  this.flagLineNumber = (e.target as HTMLInputElement).value;
                  this.rebuildCommand();
                }}
              />
            </label>

            <label class="flag-row">
              <span class="flag-label">-c (ex-cmd after load)</span>
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="set nu | norm G"
                value={this.flagExCmd}
                onInput={(e: Event) => {
                  this.flagExCmd = (e.target as HTMLInputElement).value;
                  this.rebuildCommand();
                }}
              />
            </label>

            <label class="flag-row">
              <span class="flag-label">--cmd (ex-cmd before)</span>
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="set nocompatible"
                value={this.flagPreCmd}
                onInput={(e: Event) => {
                  this.flagPreCmd = (e.target as HTMLInputElement).value;
                  this.rebuildCommand();
                }}
              />
            </label>

            <label class="flag-row">
              <span class="flag-label">-u (vimrc)</span>
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="~/.vimrc.minimal or NONE"
                value={this.flagVimrc}
                onInput={(e: Event) => {
                  this.flagVimrc = (e.target as HTMLInputElement).value;
                  this.rebuildCommand();
                }}
              />
            </label>

            <div class="flag-row">
              <span class="flag-label">Flags</span>
              <div class="flex flex-wrap gap-4">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={this.flagReadOnly}
                    onChange={(e: Event) => {
                      this.flagReadOnly = (e.target as HTMLInputElement).checked;
                      this.rebuildCommand();
                    }}
                  />
                  -R (read-only)
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={this.flagClean}
                    onChange={(e: Event) => {
                      this.flagClean = (e.target as HTMLInputElement).checked;
                      this.rebuildCommand();
                    }}
                  />
                  --clean (nvim)
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={this.flagOpenTabs}
                    onChange={(e: Event) => {
                      this.flagOpenTabs = (e.target as HTMLInputElement).checked;
                      if ((e.target as HTMLInputElement) && (e.target as HTMLInputElement).checked) this.flagOpenSplit = false;
                      this.rebuildCommand();
                    }}
                  />
                  -p (tabs)
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={this.flagOpenSplit}
                    onChange={(e: Event) => {
                      this.flagOpenSplit = (e.target as HTMLInputElement).checked;
                      if ((e.target as HTMLInputElement) && (e.target as HTMLInputElement).checked) this.flagOpenTabs = false;
                      this.rebuildCommand();
                    }}
                  />
                  -O (vsplit)
                </label>
              </div>
            </div>
          </div>

          {/* Command preview */}
          <div class="cli-cmd-preview mt-4 flex items-center justify-between gap-3">
            <code class="flex-1 text-success break-all">{this.builtCommand}</code>
            <button type="button" class={`cli-btn cli-btn-sm flex-shrink-0 ${this.copyFeedback ? 'cli-btn-success' : ''}`} onClick={() => this.copyCommand()}>
              {this.copyFeedback ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <span>🦄</span>
              <span>vim / neovim</span>
              <span class="mode-badge" style={{ backgroundColor: this.activeMode.color }}>
                {this.activeMode.indicator}
              </span>
            </h2>
            <p class="text-text2 text-sm">Modal editor — modes, keybindings, leader shortcuts, and ex-commands</p>
          </div>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={this.useNvim}
              onChange={(e: Event) => {
                this.useNvim = (e.target as HTMLInputElement).checked;
                this.rebuildCommand();
              }}
            />
            <span class={this.useNvim ? 'text-success font-semibold' : 'text-text2'}>nvim mode</span>
          </label>
        </header>

        {/* Tabs */}
        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
              onClick={() => {
                this.activeTab = tab.id;
                this.searchQuery = '';
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div class="tab-content">
          {this.activeTab === 'modes' && this.renderModesTab()}
          {this.activeTab === 'motions' && this.renderMotionsTab()}
          {this.activeTab === 'operators' && this.renderOperatorsTab()}
          {this.activeTab === 'textobjects' && this.renderTextObjectsTab()}
          {this.activeTab === 'windows' && this.renderWindowsTab()}
          {this.activeTab === 'macros' && this.renderMacrosTab()}
          {this.activeTab === 'excmds' && this.renderExCmdsTab()}
          {this.activeTab === 'flags' && this.renderFlagsTab()}
        </div>
      </div>
    );
  }
}
