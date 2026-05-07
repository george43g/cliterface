import { Component, h, State } from '@stencil/core';
import { aliasSnippets, globSections, paramSections, promptThemes } from '../../zsh/zsh-documentation';
import { bindkeyExamples, emacsBindings, type KeyBindingGroup, viBindings } from '../../zsh/zsh-keybindings';
import { ZSH_ALIASES, ZSH_KEYBINDINGS, ZSH_PLUGINS, ZSH_SETTINGS } from '../../zsh/zsh-personal';
import { type ZpreztoPlugin, zpreztoPlugins, zpreztoRcTemplate } from '../../zsh/zsh-plugins';
import { ZSH_VAULT_NOTES } from '../../zsh/zsh-vault-notes';

const TAB_DEFINITIONS = [
  { id: 'personal', label: '⚙️ Your Setup' },
  { id: 'keybindings', label: 'Keybindings' },
  { id: 'plugins', label: 'Plugins / Modules' },
  { id: 'globbing', label: 'Globbing' },
  { id: 'param-expansion', label: 'Parameter Expansion' },
  { id: 'themes', label: 'Themes & Snippets' },
  { id: 'notes', label: '📓 Notes' },
];

@Component({
  tag: 'zsh-gui',
  styleUrl: 'zsh-gui.css',
  scoped: true,
})
export class ZshGui {
  @State() activeTab = 'keybindings';
  @State() keyMode: 'emacs' | 'vi' = 'emacs';
  @State() selectedPlugin: string | null = null;
  @State() aliasCategory = 'all';
  @State() globFilter = '';
  @State() paramFilter = '';
  @State() copiedText = '';

  private async copyToClipboard(text: string, label: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
    this.copiedText = label;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.copiedText = '';
      }, 1800);
    }
  }

  // ── Tabs ────────────────────────────────────────────────────────────────

  renderTabs() {
    return (
      <div class="border-b border-accent2 mb-5 flex flex-wrap gap-1">
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

  // ── Keybindings Tab ─────────────────────────────────────────────────────

  renderKeyBindingGroup(group: KeyBindingGroup) {
    return (
      <div key={group.title} class="mb-4">
        <h4 class="text-sm font-semibold text-accent mb-2 uppercase tracking-wide">{group.title}</h4>
        <div class="rounded-lg overflow-hidden border border-bg3">
          <table class="zsh-table w-full text-sm">
            <tbody>
              {group.bindings.map((b, i) => (
                <tr key={i} class={i % 2 === 0 ? 'bg-bg2' : 'bg-bg'}>
                  <td class="px-3 py-2 font-mono text-warning whitespace-nowrap w-48">{b.keys}</td>
                  <td class="px-3 py-2 text-text">{b.description}</td>
                  {b.widget && <td class="px-3 py-2 font-mono text-xs text-text2 hidden lg:table-cell">{b.widget}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderKeybindingsTab() {
    const groups = this.keyMode === 'emacs' ? emacsBindings : viBindings;
    return (
      <div>
        {/* Mode switcher */}
        <div class="cli-card mb-5">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-text2 text-sm font-medium">Key mode:</span>
            <div class="flex gap-2">
              <button
                type="button"
                class={`cli-btn cli-btn-sm ${this.keyMode === 'emacs' ? 'cli-btn-success' : ''}`}
                onClick={() => {
                  this.keyMode = 'emacs';
                }}
              >
                Emacs
              </button>
              <button
                type="button"
                class={`cli-btn cli-btn-sm ${this.keyMode === 'vi' ? 'cli-btn-success' : ''}`}
                onClick={() => {
                  this.keyMode = 'vi';
                }}
              >
                Vi / Vim
              </button>
            </div>
            <span class="text-xs text-text2 ml-auto">
              Set in ~/.zpreztorc: <code class="font-mono text-info">zstyle ':prezto:module:editor' key-bindings '{this.keyMode}'</code>
            </span>
          </div>
        </div>

        {/* Binding groups */}
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">{groups.map(group => this.renderKeyBindingGroup(group))}</div>

        {/* bindkey examples */}
        <div class="cli-card mt-5">
          <h3 class="text-base font-semibold mb-3">bindkey — Custom Bindings</h3>
          <p class="text-text2 text-sm mb-3">
            Use <code class="font-mono text-info">bindkey</code> in your <code class="font-mono text-info">~/.zshrc</code> to set or override key bindings.
          </p>
          <div class="space-y-2">
            {bindkeyExamples.map((ex, i) => (
              <div key={i} class="flex items-center gap-3 p-2 bg-bg3 rounded-lg group">
                <code class="font-mono text-sm text-success flex-1">{ex.code}</code>
                <span class="text-text2 text-xs hidden md:block">{ex.description}</span>
                <button type="button" class="cli-btn cli-btn-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => this.copyToClipboard(ex.code, ex.code)}>
                  {this.copiedText === ex.code ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Plugins Tab ─────────────────────────────────────────────────────────

  renderPluginDetail(plugin: ZpreztoPlugin) {
    return (
      <div class="cli-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold font-mono text-accent">{plugin.name}</h3>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() => {
              this.selectedPlugin = null;
            }}
          >
            ← Back
          </button>
        </div>
        <p class="text-text2 text-sm mb-4">{plugin.description}</p>

        {plugin.note && (
          <div class="mb-4 p-3 bg-bg3 border-l-4 border-warning rounded">
            <span class="text-warning text-xs font-semibold">NOTE: </span>
            <span class="text-sm">{plugin.note}</span>
          </div>
        )}

        {/* What it enables */}
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-text2 uppercase tracking-wide mb-2">What it enables</h4>
          <ul class="space-y-1">
            {plugin.enables.map((e, i) => (
              <li key={i} class="flex items-start gap-2 text-sm">
                <span class="text-success mt-0.5">✓</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Keybindings */}
        {plugin.keybindings && plugin.keybindings.length > 0 && (
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text2 uppercase tracking-wide mb-2">Key Bindings</h4>
            <div class="rounded-lg overflow-hidden border border-bg3">
              <table class="zsh-table w-full text-sm">
                <tbody>
                  {plugin.keybindings.map((kb, i) => (
                    <tr key={i} class={i % 2 === 0 ? 'bg-bg2' : 'bg-bg'}>
                      <td class="px-3 py-2 font-mono text-warning whitespace-nowrap w-48">{kb.keys}</td>
                      <td class="px-3 py-2 text-text">{kb.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aliases */}
        {plugin.aliases && plugin.aliases.length > 0 && (
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text2 uppercase tracking-wide mb-2">Aliases</h4>
            <div class="rounded-lg overflow-hidden border border-bg3">
              <table class="zsh-table w-full text-sm">
                <thead>
                  <tr class="bg-bg3 text-text2">
                    <th class="px-3 py-2 text-left font-medium w-28">Alias</th>
                    <th class="px-3 py-2 text-left font-medium">Expands to</th>
                    <th class="px-3 py-2 text-left font-medium hidden md:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {plugin.aliases.map((a, i) => (
                    <tr key={i} class={i % 2 === 0 ? 'bg-bg2' : 'bg-bg'}>
                      <td class="px-3 py-2 font-mono text-success">{a.alias}</td>
                      <td class="px-3 py-2 font-mono text-sm text-info break-all">{a.expansion}</td>
                      <td class="px-3 py-2 text-text2 text-xs hidden md:table-cell">{a.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Config */}
        {plugin.config && plugin.config.length > 0 && (
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text2 uppercase tracking-wide mb-2">Configuration</h4>
            <div class="space-y-2">
              {plugin.config.map((c, i) => (
                <div key={i} class="flex items-start gap-3 p-2 bg-bg3 rounded-lg group">
                  <code class="font-mono text-xs text-success flex-1 break-all">{c.option}</code>
                  <span class="text-text2 text-xs hidden md:block whitespace-nowrap">{c.description}</span>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => this.copyToClipboard(c.option, `cfg-${i}`)}
                  >
                    {this.copiedText === `cfg-${i}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  renderPluginsTab() {
    if (this.selectedPlugin) {
      const plugin = zpreztoPlugins.find(p => p.id === this.selectedPlugin);
      if (plugin) return this.renderPluginDetail(plugin);
    }

    return (
      <div>
        {/* zpreztorc template */}
        <div class="cli-card mb-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-semibold">~/.zpreztorc module order</h3>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.copyToClipboard(zpreztoRcTemplate, 'zpreztorc')}>
              {this.copiedText === 'zpreztorc' ? 'Copied!' : 'Copy template'}
            </button>
          </div>
          <pre class="cli-output text-xs">{zpreztoRcTemplate}</pre>
        </div>

        {/* Plugin grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {zpreztoPlugins.map(plugin => (
            <button
              key={plugin.id}
              type="button"
              class="cli-card text-left hover:-translate-y-0.5 transition-transform cursor-pointer w-full"
              onClick={() => {
                this.selectedPlugin = plugin.id;
              }}
            >
              <div class="flex items-start justify-between mb-2">
                <code class="font-mono text-accent text-base font-semibold">{plugin.name}</code>
                <span class="cli-badge-info text-xs ml-2 flex-shrink-0">module</span>
              </div>
              <p class="text-text2 text-xs leading-relaxed mb-3">{plugin.description}</p>
              <div class="flex flex-wrap gap-1">
                {plugin.aliases && plugin.aliases.length > 0 && <span class="text-xs px-2 py-0.5 bg-bg3 rounded text-success">{plugin.aliases.length} aliases</span>}
                {plugin.keybindings && plugin.keybindings.length > 0 && <span class="text-xs px-2 py-0.5 bg-bg3 rounded text-info">{plugin.keybindings.length} keybindings</span>}
                {plugin.config && plugin.config.length > 0 && <span class="text-xs px-2 py-0.5 bg-bg3 rounded text-warning">{plugin.config.length} config options</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Globbing Tab ─────────────────────────────────────────────────────────

  renderGlobbingTab() {
    const filter = this.globFilter.toLowerCase();
    return (
      <div>
        <div class="cli-card mb-4">
          <div class="flex gap-3 items-center flex-wrap">
            <label class="text-sm text-text2 whitespace-nowrap flex items-center gap-2">
              Filter patterns:
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="e.g. recursive, qualifier, case..."
                value={this.globFilter}
                onInput={(e: Event) => {
                  this.globFilter = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            {this.globFilter && (
              <button
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  this.globFilter = '';
                }}
              >
                Clear
              </button>
            )}
          </div>
          <p class="text-text2 text-xs mt-2">
            Enable extended glob in your config: <code class="font-mono text-info">setopt EXTENDED_GLOB</code>
          </p>
        </div>

        {globSections.map(section => {
          const visible = section.patterns.filter(
            p => !filter || p.pattern.toLowerCase().includes(filter) || p.description.toLowerCase().includes(filter) || p.example?.toLowerCase().includes(filter),
          );
          if (visible.length === 0) return null;

          return (
            <div key={section.title} class="cli-card mb-4">
              <h3 class="text-base font-semibold mb-1">{section.title}</h3>
              <p class="text-text2 text-xs mb-3">{section.description}</p>
              <div class="rounded-lg overflow-hidden border border-bg3">
                <table class="zsh-table w-full text-sm">
                  <thead>
                    <tr class="bg-bg3 text-text2">
                      <th class="px-3 py-2 text-left font-medium w-52">Pattern</th>
                      <th class="px-3 py-2 text-left font-medium">Description</th>
                      <th class="px-3 py-2 text-left font-medium hidden md:table-cell">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p, i) => (
                      <tr key={i} class={i % 2 === 0 ? 'bg-bg2' : 'bg-bg'}>
                        <td class="px-3 py-2">
                          <code class="font-mono text-warning text-xs">{p.pattern}</code>
                        </td>
                        <td class="px-3 py-2 text-sm text-text">{p.description}</td>
                        <td class="px-3 py-2 font-mono text-xs text-info hidden md:table-cell">{p.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Parameter Expansion Tab ──────────────────────────────────────────────

  renderParamExpansionTab() {
    const filter = this.paramFilter.toLowerCase();
    return (
      <div>
        <div class="cli-card mb-4">
          <div class="flex gap-3 items-center flex-wrap">
            <label class="text-sm text-text2 whitespace-nowrap flex items-center gap-2">
              Filter expansions:
              <input
                type="text"
                class="cli-input flex-1"
                placeholder="e.g. default, replace, array, case..."
                value={this.paramFilter}
                onInput={(e: Event) => {
                  this.paramFilter = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            {this.paramFilter && (
              <button
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={() => {
                  this.paramFilter = '';
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {paramSections.map(section => {
          const visible = section.expansions.filter(
            ex => !filter || ex.syntax.toLowerCase().includes(filter) || ex.description.toLowerCase().includes(filter) || ex.example?.toLowerCase().includes(filter),
          );
          if (visible.length === 0) return null;

          return (
            <div key={section.title} class="cli-card mb-4">
              <h3 class="text-base font-semibold mb-3">{section.title}</h3>
              <div class="space-y-2">
                {visible.map((ex, i) => (
                  <div key={i} class="p-3 bg-bg3 rounded-lg group flex gap-3 items-start">
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-wrap gap-x-4 gap-y-1 mb-1">
                        <code class="font-mono text-warning text-sm">{ex.syntax}</code>
                        {ex.example && <code class="font-mono text-info text-xs">{ex.example}</code>}
                        {ex.result && <span class="text-success text-xs">→ {ex.result}</span>}
                      </div>
                      <p class="text-text2 text-xs">{ex.description}</p>
                    </div>
                    <button
                      type="button"
                      class="cli-btn cli-btn-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => this.copyToClipboard(ex.syntax, ex.syntax)}
                    >
                      {this.copiedText === ex.syntax ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Themes & Snippets Tab ─────────────────────────────────────────────

  renderThemesTab() {
    const categories = ['all', ...Array.from(new Set(aliasSnippets.map(a => a.category)))];
    const filtered = this.aliasCategory === 'all' ? aliasSnippets : aliasSnippets.filter(a => a.category === this.aliasCategory);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Prompt themes */}
        <div class="xl:col-span-2">
          <h3 class="text-base font-semibold mb-3">Prompt Themes</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {promptThemes.map(theme => (
              <div key={theme.name} class="cli-card">
                <div class="flex items-center justify-between mb-2">
                  <code class="font-mono text-accent font-semibold">{theme.name}</code>
                  <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyToClipboard(`zstyle ':prezto:module:prompt' theme '${theme.name}'`, theme.name)}>
                    {this.copiedText === theme.name ? 'Copied!' : 'Use'}
                  </button>
                </div>
                <p class="text-text2 text-xs mb-3">{theme.description}</p>
                <pre class="zsh-theme-preview font-mono text-xs mb-3">{theme.preview}</pre>
                <ul class="space-y-1">
                  {theme.features.map((f, i) => (
                    <li key={i} class="text-xs text-text2 flex items-start gap-1">
                      <span class="text-success">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Aliases & functions */}
        <div class="xl:col-span-2">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 class="text-base font-semibold">Aliases &amp; Functions</h3>
            <div class="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  class={`cli-btn cli-btn-sm ${this.aliasCategory === cat ? 'cli-btn-success' : ''}`}
                  onClick={() => {
                    this.aliasCategory = cat;
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div class="space-y-2">
            {filtered.map((snippet, i) => (
              <div key={i} class="p-3 bg-bg2 rounded-lg border border-bg3 group">
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <pre class="font-mono text-xs text-success whitespace-pre-wrap break-all">{snippet.code}</pre>
                    <p class="text-text2 text-xs mt-1">{snippet.description}</p>
                  </div>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => this.copyToClipboard(snippet.code, `snip-${i}`)}
                  >
                    {this.copiedText === `snip-${i}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Personal tab ─────────────────────────────────────────────────────────

  renderPersonalTab() {
    const aliasCategories = [...new Set(ZSH_ALIASES.map(a => a.category))];
    return (
      <div class="grid grid-cols-1 gap-5">
        {/* Settings chips */}
        <div class="cli-card">
          <h3 class="text-base mb-3">Settings</h3>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="px-2 py-1 bg-bg3 rounded">vi-mode={String(ZSH_SETTINGS.viMode)}</span>
            <span class="px-2 py-1 bg-bg3 rounded">KEYTIMEOUT={ZSH_SETTINGS.keyTimeout}0ms</span>
            <span class="px-2 py-1 bg-bg3 rounded">theme={ZSH_SETTINGS.promptTheme}</span>
            <span class="px-2 py-1 bg-bg3 rounded">jumper={ZSH_SETTINGS.directoryJumper}</span>
            <span class="px-2 py-1 bg-bg3 rounded">history={ZSH_SETTINGS.historyMode}</span>
            {ZSH_SETTINGS.historyOptions.map((o, i) => (
              <span key={i} class="px-2 py-1 bg-bg3 rounded">
                {o}
              </span>
            ))}
          </div>
        </div>

        {/* Aliases grouped by category */}
        {aliasCategories.map(cat => (
          <div key={cat} class="cli-card">
            <h3 class="text-base mb-3">{cat} Aliases</h3>
            <table class="w-full text-sm">
              <tbody>
                {ZSH_ALIASES.filter(a => a.category === cat).map((a, i) => (
                  <tr key={i} class="border-b border-bg3">
                    <td class="py-1 pr-3 whitespace-nowrap">
                      <code class="text-accent font-mono">{a.alias}</code>
                    </td>
                    <td class="py-1 pr-3 font-mono text-xs text-info break-all">{a.command}</td>
                    <td class="py-1 text-xs text-text2">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Plugins */}
        <div class="cli-card">
          <h3 class="text-base mb-3">Plugins &amp; Tools ({ZSH_PLUGINS.length})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ZSH_PLUGINS.map((p, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="font-medium text-sm mb-1">{p.name}</div>
                <div class="text-xs text-text2 mb-1">{p.purpose}</div>
                <div class="text-xs text-text2 opacity-70 mb-2">manager: {p.manager}</div>
                {p.enables && p.enables.length > 0 && (
                  <div class="flex flex-wrap gap-1">
                    {p.enables.map((e, j) => (
                      <code key={j} class="text-xs px-1 py-0.5 bg-bg2 rounded text-accent">
                        {e}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Keybindings */}
        <div class="cli-card">
          <h3 class="text-base mb-3">Custom Keybindings</h3>
          <table class="w-full text-sm">
            <tbody>
              {ZSH_KEYBINDINGS.map((b, i) => (
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
      </div>
    );
  }

  // ── Notes tab ─────────────────────────────────────────────────────────────

  renderNotesTab() {
    return (
      <div class="grid grid-cols-1 gap-4">
        {ZSH_VAULT_NOTES.map((n, i) => (
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

  // ── Root render ──────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🐚</span> zsh &amp; zprezto
          </h2>
          <p class="text-text2 text-sm">Z shell + framework keybindings &amp; plugins — learning reference</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'personal' && this.renderPersonalTab()}
          {this.activeTab === 'keybindings' && this.renderKeybindingsTab()}
          {this.activeTab === 'plugins' && this.renderPluginsTab()}
          {this.activeTab === 'globbing' && this.renderGlobbingTab()}
          {this.activeTab === 'param-expansion' && this.renderParamExpansionTab()}
          {this.activeTab === 'themes' && this.renderThemesTab()}
          {this.activeTab === 'notes' && this.renderNotesTab()}
        </div>
      </div>
    );
  }
}
