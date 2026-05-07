import { Component, h, State } from '@stencil/core';
import {
  buildChmodCommand,
  buildDateCommand,
  buildFindCommand,
  buildGrepCommand,
  buildKillCommand,
  buildLsCommand,
  buildTarCommand,
  CHMOD_PRESETS,
  type ChmodOptions,
  COMMON_DATE_FORMATS,
  type DateOptions,
  type FindOptions,
  type GrepOptions,
  KILL_SIGNALS,
  type KillOptions,
  type LsOptions,
  type TarOptions,
} from '../../posix/posix-command-builders';
import { type FlagChip, POSIX_TABS, type TabId, type ToolEntry } from '../../posix/posix-documentation';

// ──────────────────────────────────────────────────────────
// Builder default state
// ──────────────────────────────────────────────────────────

const DEFAULT_LS: LsOptions = {
  path: '.',
  longFormat: true,
  showHidden: false,
  humanReadable: true,
  sortByTime: false,
  sortBySize: false,
  onePerLine: false,
  typeIndicator: false,
  recursive: false,
  color: true,
};

const DEFAULT_GREP: GrepOptions = {
  pattern: '',
  path: '.',
  extendedRegex: false,
  recursive: true,
  lineNumbers: true,
  ignoreCase: false,
  invertMatch: false,
  filesWithMatches: false,
  count: false,
  include: '',
};

const DEFAULT_FIND: FindOptions = {
  path: '.',
  name: '',
  type: 'f',
  mtime: '',
  size: '',
  exec: '',
  print0: false,
  maxdepth: '',
};

const DEFAULT_TAR: TarOptions = {
  operation: 'c',
  verbose: true,
  compression: 'z',
  file: 'archive.tar.gz',
  directory: '',
  paths: '.',
};

const DEFAULT_DATE: DateOptions = {
  format: '%Y-%m-%d %H:%M:%S',
  utc: false,
};

const DEFAULT_CHMOD: ChmodOptions = {
  mode: '755',
  path: 'FILE',
  recursive: false,
};

const DEFAULT_KILL: KillOptions = {
  signal: '15',
  pid: '',
};

@Component({
  tag: 'posix-gui',
  styleUrl: 'posix-gui.css',
  scoped: true,
})
export class PosixGui {
  @State() activeTab: TabId = 'listing';
  @State() copiedCmd: string | null = null;

  // Builder states
  @State() ls: LsOptions = { ...DEFAULT_LS };
  @State() grep: GrepOptions = { ...DEFAULT_GREP };
  @State() find: FindOptions = { ...DEFAULT_FIND };
  @State() tar: TarOptions = { ...DEFAULT_TAR };
  @State() date: DateOptions = { ...DEFAULT_DATE };
  @State() chmod: ChmodOptions = { ...DEFAULT_CHMOD };
  @State() kill: KillOptions = { ...DEFAULT_KILL };

  // ────────────────────────────────────────────────────────
  // Clipboard helper
  // ────────────────────────────────────────────────────────

  private async copyToClipboard(cmd: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(cmd);
    }
    this.copiedCmd = cmd;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.copiedCmd = null;
      }, 1800);
    }
  }

  // ────────────────────────────────────────────────────────
  // Shared rendering helpers
  // ────────────────────────────────────────────────────────

  private renderFlagChips(flags: FlagChip[]) {
    if (!flags || flags.length === 0) return null;
    return (
      <div class="flex flex-wrap gap-1 mt-2">
        {flags.map(f => (
          <span key={f.flag} class="flag-chip" title={f.desc}>
            <code>{f.flag}</code>
            <span class="flag-chip-desc">{f.desc}</span>
          </span>
        ))}
      </div>
    );
  }

  private renderToolCard(tool: ToolEntry) {
    const isCopied = this.copiedCmd === tool.example;
    return (
      <div key={tool.cmd} class={`tool-card${tool.destructive ? ' tool-card-destructive' : ''}`}>
        <div class="tool-card-header">
          <div class="tool-card-title-row">
            <code class={`tool-name${tool.destructive ? ' tool-name-destructive' : ''}`}>{tool.cmd}</code>
            <button
              type="button"
              class={`cli-btn cli-btn-sm copy-btn${isCopied ? ' copy-btn-copied' : ''}`}
              onClick={() => this.copyToClipboard(tool.example)}
              title="Copy example to clipboard"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p class="tool-desc">{tool.desc}</p>
        </div>

        {tool.warning && (
          <div class={`tool-warning${tool.destructive ? ' tool-warning-danger' : ''}`}>
            {tool.destructive ? '⚠ DESTRUCTIVE: ' : 'Note: '}
            {tool.warning}
          </div>
        )}

        <div class="tool-example">
          <code>{tool.example}</code>
        </div>

        {this.renderFlagChips(tool.flags ?? [])}
      </div>
    );
  }

  private renderCheatsheetTab(tabId: TabId) {
    const tab = POSIX_TABS.find(t => t.id === tabId);
    if (!tab) return null;
    return <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{tab.tools.map(tool => this.renderToolCard(tool))}</div>;
  }

  // ────────────────────────────────────────────────────────
  // Builder panels
  // ────────────────────────────────────────────────────────

  private renderLsBuilder() {
    const cmd = buildLsCommand(this.ls);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">ls — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            Path
            <input
              type="text"
              class="cli-input w-full"
              value={this.ls.path}
              onInput={(e: Event) => {
                this.ls = { ...this.ls, path: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <div class="flag-checkboxes">
            {(
              [
                ['longFormat', '-l long format'],
                ['showHidden', '-a hidden files'],
                ['humanReadable', '-h human sizes'],
                ['sortByTime', '-t sort by time'],
                ['sortBySize', '-S sort by size'],
                ['onePerLine', '-1 one per line'],
                ['typeIndicator', '-F type indicator'],
                ['recursive', '-R recursive'],
                ['color', '--color colorize'],
              ] as [keyof LsOptions, string][]
            ).map(([key, label]) => (
              <label key={key} class="checkbox-label">
                <input
                  type="checkbox"
                  checked={this.ls[key] as boolean}
                  onChange={(e: Event) => {
                    this.ls = { ...this.ls, [key]: (e.target as HTMLInputElement).checked };
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  private renderGrepBuilder() {
    const cmd = buildGrepCommand(this.grep);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">grep — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            Pattern
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="PATTERN"
              value={this.grep.pattern}
              onInput={(e: Event) => {
                this.grep = { ...this.grep, pattern: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            Path / File
            <input
              type="text"
              class="cli-input w-full"
              placeholder="."
              value={this.grep.path}
              onInput={(e: Event) => {
                this.grep = { ...this.grep, path: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            --include (glob)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="*.ts"
              value={this.grep.include}
              onInput={(e: Event) => {
                this.grep = { ...this.grep, include: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <div class="flag-checkboxes">
            {(
              [
                ['extendedRegex', '-E extended regex'],
                ['recursive', '-r recursive'],
                ['lineNumbers', '-n line numbers'],
                ['ignoreCase', '-i ignore case'],
                ['invertMatch', '-v invert match'],
                ['filesWithMatches', '-l files only'],
                ['count', '-c count only'],
              ] as [keyof GrepOptions, string][]
            ).map(([key, label]) => (
              <label key={key} class="checkbox-label">
                <input
                  type="checkbox"
                  checked={this.grep[key] as boolean}
                  onChange={(e: Event) => {
                    this.grep = { ...this.grep, [key]: (e.target as HTMLInputElement).checked };
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  private renderFindBuilder() {
    const cmd = buildFindCommand(this.find);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">find — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            Start path
            <input
              type="text"
              class="cli-input w-full"
              placeholder="."
              value={this.find.path}
              onInput={(e: Event) => {
                this.find = { ...this.find, path: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            -name (filename glob)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="*.log"
              value={this.find.name}
              onInput={(e: Event) => {
                this.find = { ...this.find, name: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            -type
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.find = { ...this.find, type: (e.target as HTMLSelectElement).value as FindOptions['type'] };
              }}
            >
              <option value="" selected={this.find.type === ''}>
                any
              </option>
              <option value="f" selected={this.find.type === 'f'}>
                f — regular file
              </option>
              <option value="d" selected={this.find.type === 'd'}>
                d — directory
              </option>
              <option value="l" selected={this.find.type === 'l'}>
                l — symlink
              </option>
            </select>
          </label>
          <label class="builder-label">
            -mtime (e.g. -7, +30)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="-7"
              value={this.find.mtime}
              onInput={(e: Event) => {
                this.find = { ...this.find, mtime: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            -size (e.g. +1M, -100k)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="+1M"
              value={this.find.size}
              onInput={(e: Event) => {
                this.find = { ...this.find, size: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            -maxdepth
            <input
              type="number"
              class="cli-input w-full"
              min="0"
              max="20"
              placeholder="—"
              value={this.find.maxdepth}
              onInput={(e: Event) => {
                this.find = { ...this.find, maxdepth: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="builder-label">
            -exec (command, {} is replaced with path)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="rm"
              value={this.find.exec}
              onInput={(e: Event) => {
                this.find = { ...this.find, exec: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="checkbox-label mt-2">
            <input
              type="checkbox"
              checked={this.find.print0}
              onChange={(e: Event) => {
                this.find = { ...this.find, print0: (e.target as HTMLInputElement).checked };
              }}
            />
            -print0 (null-separated output for xargs -0)
          </label>
        </div>
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  private renderTarBuilder() {
    const cmd = buildTarCommand(this.tar);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">tar — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            Operation
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.tar = { ...this.tar, operation: (e.target as HTMLSelectElement).value as TarOptions['operation'] };
              }}
            >
              <option value="c" selected={this.tar.operation === 'c'}>
                c — create archive
              </option>
              <option value="x" selected={this.tar.operation === 'x'}>
                x — extract archive
              </option>
              <option value="t" selected={this.tar.operation === 't'}>
                t — list contents
              </option>
            </select>
          </label>
          <label class="builder-label">
            Compression
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.tar = { ...this.tar, compression: (e.target as HTMLSelectElement).value as TarOptions['compression'] };
              }}
            >
              <option value="z" selected={this.tar.compression === 'z'}>
                z — gzip (.tar.gz)
              </option>
              <option value="j" selected={this.tar.compression === 'j'}>
                j — bzip2 (.tar.bz2)
              </option>
              <option value="J" selected={this.tar.compression === 'J'}>
                J — xz (.tar.xz)
              </option>
              <option value="" selected={this.tar.compression === ''}>
                none (.tar)
              </option>
            </select>
          </label>
          <label class="builder-label">
            Archive file
            <input
              type="text"
              class="cli-input w-full font-mono"
              value={this.tar.file}
              onInput={(e: Event) => {
                this.tar = { ...this.tar, file: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          {this.tar.operation === 'x' && (
            <label class="builder-label">
              Extract to directory (-C)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="./output"
                value={this.tar.directory}
                onInput={(e: Event) => {
                  this.tar = { ...this.tar, directory: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
          )}
          {this.tar.operation === 'c' && (
            <label class="builder-label">
              Paths to include
              <input
                type="text"
                class="cli-input w-full"
                placeholder="./dir file.txt"
                value={this.tar.paths}
                onInput={(e: Event) => {
                  this.tar = { ...this.tar, paths: (e.target as HTMLInputElement).value };
                }}
              />
            </label>
          )}
          <label class="checkbox-label mt-2">
            <input
              type="checkbox"
              checked={this.tar.verbose}
              onChange={(e: Event) => {
                this.tar = { ...this.tar, verbose: (e.target as HTMLInputElement).checked };
              }}
            />
            -v verbose (print each file)
          </label>
        </div>
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  private renderDateBuilder() {
    const cmd = buildDateCommand(this.date);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">date — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            Format string (leave blank for default)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="%Y-%m-%d"
              value={this.date.format}
              onInput={(e: Event) => {
                this.date = { ...this.date, format: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <div>
            <p class="text-sm text-text2 mb-2">Presets:</p>
            <div class="flex flex-wrap gap-2">
              {COMMON_DATE_FORMATS.map(f => (
                <button
                  key={f.format}
                  type="button"
                  class={`cli-btn cli-btn-sm${this.date.format === f.format ? ' cli-btn-info' : ''}`}
                  onClick={() => {
                    this.date = { ...this.date, format: f.format };
                  }}
                  title={f.format}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <label class="checkbox-label mt-2">
            <input
              type="checkbox"
              checked={this.date.utc}
              onChange={(e: Event) => {
                this.date = { ...this.date, utc: (e.target as HTMLInputElement).checked };
              }}
            />
            -u output in UTC
          </label>
        </div>
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  private renderChmodBuilder() {
    const cmd = buildChmodCommand(this.chmod);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">chmod — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            Mode (octal or symbolic)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="755"
              value={this.chmod.mode}
              onInput={(e: Event) => {
                this.chmod = { ...this.chmod, mode: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <div>
            <p class="text-sm text-text2 mb-2">Presets:</p>
            <div class="flex flex-wrap gap-2">
              {CHMOD_PRESETS.map(p => (
                <button
                  key={p.mode}
                  type="button"
                  class={`cli-btn cli-btn-sm${this.chmod.mode === p.mode ? ' cli-btn-info' : ''}`}
                  onClick={() => {
                    this.chmod = { ...this.chmod, mode: p.mode };
                  }}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <label class="builder-label">
            Path
            <input
              type="text"
              class="cli-input w-full"
              placeholder="FILE"
              value={this.chmod.path}
              onInput={(e: Event) => {
                this.chmod = { ...this.chmod, path: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <label class="checkbox-label mt-2">
            <input
              type="checkbox"
              checked={this.chmod.recursive}
              onChange={(e: Event) => {
                this.chmod = { ...this.chmod, recursive: (e.target as HTMLInputElement).checked };
              }}
            />
            -R recursive (apply to all contents)
          </label>
        </div>
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  private renderKillBuilder() {
    const cmd = buildKillCommand(this.kill);
    return (
      <div class="cli-card mt-4">
        <h3 class="builder-title">kill — Command Builder</h3>
        <div class="builder-grid">
          <label class="builder-label">
            PID (process ID)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="1234"
              value={this.kill.pid}
              onInput={(e: Event) => {
                this.kill = { ...this.kill, pid: (e.target as HTMLInputElement).value };
              }}
            />
          </label>
          <div>
            <p class="text-sm text-text2 mb-2">Signal:</p>
            <div class="flex flex-wrap gap-2">
              {KILL_SIGNALS.map(s => (
                <button
                  key={s.signal}
                  type="button"
                  class={`cli-btn cli-btn-sm${this.kill.signal === s.signal ? (s.signal === '9' ? ' cli-btn-danger' : ' cli-btn-info') : ''}`}
                  onClick={() => {
                    this.kill = { ...this.kill, signal: s.signal };
                  }}
                  title={s.desc}
                >
                  -{s.signal} {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {this.kill.signal === '9' && <div class="tool-warning tool-warning-danger mt-3">⚠ SIGKILL cannot be caught — process terminates immediately without cleanup</div>}
        <div class="cli-cmd-preview mt-3">{cmd}</div>
        <button type="button" class="cli-btn cli-btn-sm mt-2" onClick={() => this.copyToClipboard(cmd)}>
          {this.copiedCmd === cmd ? 'Copied!' : 'Copy command'}
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Tab content routing
  // ────────────────────────────────────────────────────────

  private renderTabContent() {
    switch (this.activeTab) {
      case 'listing':
        return (
          <div>
            {this.renderCheatsheetTab('listing')}
            {this.renderLsBuilder()}
          </div>
        );
      case 'fileops':
        return (
          <div>
            {this.renderCheatsheetTab('fileops')}
            {this.renderChmodBuilder()}
          </div>
        );
      case 'text':
        return <div>{this.renderCheatsheetTab('text')}</div>;
      case 'search':
        return (
          <div>
            {this.renderCheatsheetTab('search')}
            {this.renderGrepBuilder()}
            {this.renderFindBuilder()}
          </div>
        );
      case 'pipelines':
        return <div>{this.renderCheatsheetTab('pipelines')}</div>;
      case 'process':
        return (
          <div>
            {this.renderCheatsheetTab('process')}
            {this.renderKillBuilder()}
          </div>
        );
      case 'datetime':
        return (
          <div>
            {this.renderCheatsheetTab('datetime')}
            {this.renderDateBuilder()}
          </div>
        );
      case 'compression':
        return (
          <div>
            {this.renderCheatsheetTab('compression')}
            {this.renderTarBuilder()}
          </div>
        );
      default:
        return null;
    }
  }

  render() {
    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🧰</span> POSIX Tools
          </h2>
          <p class="text-text2 text-sm">Standard POSIX utilities reference — cheatsheet + command builder. Hover flag chips for details.</p>
        </header>

        <div class="tabs-row border-b border-accent2 mb-4">
          {POSIX_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`cli-tab${this.activeTab === tab.id ? ' cli-tab-active' : ''}`}
              onClick={() => {
                this.activeTab = tab.id as TabId;
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div class="tab-content">{this.renderTabContent()}</div>
      </div>
    );
  }
}
