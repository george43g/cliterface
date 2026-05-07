import { Component, h, State } from '@stencil/core';
import { XARGS_FLAGS, XARGS_PATTERNS, XARGS_PITFALLS } from '../../xargs/xargs-documentation';
import { buildXargsCommand, type CommandResult, DEFAULT_XARGS_OPTIONS, type XargsOptions, xargsService } from '../../xargs/xargs-service';

const TAB_DEFINITIONS = [
  { id: 'builder', label: 'Builder' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'pitfalls', label: 'Pitfalls' },
  { id: 'reference', label: 'Reference' },
];

@Component({
  tag: 'xargs-gui',
  styleUrl: 'xargs-gui.css',
  scoped: true,
})
export class XargsGui {
  @State() activeTab = 'builder';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() output = 'Configure flags above and click Execute (stub) to see mock output.';
  @State() lastCommand = '';

  // Builder state — mirrors XargsOptions
  @State() stdinSource = DEFAULT_XARGS_OPTIONS.stdinSource;
  @State() utility = DEFAULT_XARGS_OPTIONS.utility;
  @State() utilityArgs = DEFAULT_XARGS_OPTIONS.utilityArgs;
  @State() nullDelimited = DEFAULT_XARGS_OPTIONS.nullDelimited;
  @State() maxArgs: number | '' = DEFAULT_XARGS_OPTIONS.maxArgs;
  @State() replaceStr = DEFAULT_XARGS_OPTIONS.replaceStr;
  @State() parallel: number | '' = DEFAULT_XARGS_OPTIONS.parallel;
  @State() trace = DEFAULT_XARGS_OPTIONS.trace;
  @State() linesPerCmd: number | '' = DEFAULT_XARGS_OPTIONS.linesPerCmd;
  @State() noRunIfEmpty = DEFAULT_XARGS_OPTIONS.noRunIfEmpty;
  @State() maxChars: number | '' = DEFAULT_XARGS_OPTIONS.maxChars;
  @State() exitOnOverflow = DEFAULT_XARGS_OPTIONS.exitOnOverflow;

  // Validation errors
  @State() maxArgsError = '';
  @State() parallelError = '';

  private getOptions(): XargsOptions {
    return {
      stdinSource: this.stdinSource,
      utility: this.utility,
      utilityArgs: this.utilityArgs,
      nullDelimited: this.nullDelimited,
      maxArgs: this.maxArgs,
      replaceStr: this.replaceStr,
      parallel: this.parallel,
      trace: this.trace,
      linesPerCmd: this.linesPerCmd,
      noRunIfEmpty: this.noRunIfEmpty,
      maxChars: this.maxChars,
      exitOnOverflow: this.exitOnOverflow,
    };
  }

  private buildPreview(): string {
    return buildXargsCommand(this.getOptions());
  }

  private validateMaxArgs(raw: string): void {
    if (raw === '') {
      this.maxArgs = '';
      this.maxArgsError = '';
      return;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) {
      this.maxArgsError = 'Must be a positive integer';
    } else {
      this.maxArgsError = '';
      this.maxArgs = n;
    }
  }

  private validateParallel(raw: string): void {
    if (raw === '') {
      this.parallel = '';
      this.parallelError = '';
      return;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      this.parallelError = 'Must be a non-negative integer (0 = unlimited)';
    } else {
      this.parallelError = '';
      this.parallel = n;
    }
  }

  private setTemporaryStatus(msg: string, resetTo = 'Ready'): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  async executeCmd(): Promise<void> {
    if (this.maxArgsError || this.parallelError) {
      this.setTemporaryStatus('Fix validation errors first');
      return;
    }
    const cmd = this.buildPreview();
    this.lastCommand = cmd;
    this.status = 'running';
    this.statusMessage = 'Running (stub)...';
    this.output = 'Executing...';

    try {
      const result: CommandResult = await xargsService.execute(cmd);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async copyCommand(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.buildPreview());
    this.setTemporaryStatus('Command copied!');
  }

  clearOutput(): void {
    this.output = 'Configure flags above and click Execute (stub) to see mock output.';
    this.lastCommand = '';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  loadPattern(command: string): void {
    // Parse a pattern command into the builder fields on a best-effort basis.
    // Split on the first " | xargs " to get stdin source and xargs args.
    const pipeIdx = command.indexOf(' | xargs');
    if (pipeIdx !== -1) {
      this.stdinSource = command.slice(0, pipeIdx).trim();
      const rest = command.slice(pipeIdx + ' | xargs'.length).trim();
      // Parse flags from rest string
      this.parseXargsArgs(rest);
    } else if (command.startsWith('xargs')) {
      this.stdinSource = '';
      this.parseXargsArgs(command.slice('xargs'.length).trim());
    } else {
      this.stdinSource = command;
    }
    this.activeTab = 'builder';
    this.setTemporaryStatus('Pattern loaded into Builder');
  }

  private parseXargsArgs(args: string): void {
    // Reset to safe defaults
    this.nullDelimited = false;
    this.maxArgs = '';
    this.replaceStr = '';
    this.parallel = '';
    this.trace = false;
    this.linesPerCmd = '';
    this.noRunIfEmpty = false;
    this.maxChars = '';
    this.exitOnOverflow = false;
    this.utility = 'echo';
    this.utilityArgs = '';

    const tokens = args.split(/\s+/);
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok === '-0' || tok === '--null') {
        this.nullDelimited = true;
      } else if (tok === '-t' || tok === '--verbose') {
        this.trace = true;
      } else if (tok === '-r' || tok === '--no-run-if-empty') {
        this.noRunIfEmpty = true;
      } else if (tok === '-x' || tok === '--exit') {
        this.exitOnOverflow = true;
      } else if (tok === '-n' && tokens[i + 1]) {
        this.maxArgs = Number(tokens[++i]) || '';
      } else if (tok === '-P' && tokens[i + 1]) {
        this.parallel = Number(tokens[++i]);
      } else if (tok === '-I' && tokens[i + 1]) {
        this.replaceStr = tokens[++i];
      } else if (tok === '-L' && tokens[i + 1]) {
        this.linesPerCmd = Number(tokens[++i]) || '';
      } else if (tok === '-s' && tokens[i + 1]) {
        this.maxChars = Number(tokens[++i]) || '';
      } else if (tok && !tok.startsWith('-')) {
        // First non-flag token is the utility
        this.utility = tok;
        this.utilityArgs = tokens.slice(i + 1).join(' ');
        break;
      }
      i++;
    }
  }

  renderTabs() {
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

  renderCommandPreview() {
    const preview = this.buildPreview();
    // Segment the preview for colourisation
    const parts = preview.split(/(\s+)/);

    return (
      <div class="cli-cmd-preview">
        {parts.map((part, i) => {
          if (!part) return null;
          if (/^\s+$/.test(part)) return <span key={i}> </span>;
          if (part === '|')
            return (
              <span key={i} class="pipeline-pipe">
                |
              </span>
            );

          let type = 'argument';
          if (
            part === 'xargs' ||
            part === 'find' ||
            part === 'echo' ||
            part === 'curl' ||
            part === 'grep' ||
            part === 'rm' ||
            part === 'wc' ||
            part === 'ls' ||
            part === 'cp' ||
            part === 'mv'
          ) {
            type = 'command';
          } else if (part.startsWith('-')) {
            type = 'flag';
          } else if (/^[0-9]+$/.test(part)) {
            type = 'value';
          }

          return (
            <span key={i} class={`cmd-segment cmd-segment-${type}`}>
              {part}
            </span>
          );
        })}
      </div>
    );
  }

  renderBuilderTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left column: stdin + flags */}
        <div class="flex flex-col gap-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Stdin Source</h3>
            <label class="flex flex-col gap-1 text-sm text-text2 mb-1">
              Pipeline source expression
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="find . -name '*.ts' -print0"
                value={this.stdinSource}
                onInput={(e: Event) => {
                  this.stdinSource = (e.target as HTMLInputElement).value;
                }}
              />
              <span class="text-xs">Leave blank to show xargs command alone (paste into terminal with your own stdin).</span>
            </label>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Utility Command</h3>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Utility (default: echo)
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="echo"
                  value={this.utility}
                  onInput={(e: Event) => {
                    this.utility = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Extra args before stdin args
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="-la"
                  value={this.utilityArgs}
                  onInput={(e: Event) => {
                    this.utilityArgs = (e.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-4">Flags</h3>

            {/* Input delimiter */}
            <div class="mb-4">
              <p class="text-xs text-text2 uppercase tracking-wide mb-2">Input delimiter</p>
              <label class="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  class="mt-0.5"
                  checked={this.nullDelimited}
                  onChange={(e: Event) => {
                    this.nullDelimited = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span>
                  <strong>-0</strong> / <strong>--null</strong>
                  <span class="block text-text2 text-xs">
                    NUL-delimited input — pair with <code>find -print0</code>. Handles filenames with spaces.
                  </span>
                </span>
              </label>
            </div>

            {/* Batching */}
            <div class="mb-4">
              <p class="text-xs text-text2 uppercase tracking-wide mb-2">Batching</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label class="flex flex-col gap-1 text-sm text-text2">
                  <span>
                    <strong>-n N</strong> max args per invocation
                  </span>
                  <input
                    type="number"
                    class={`cli-input w-full ${this.maxArgsError ? 'cli-input-invalid' : ''}`}
                    min="1"
                    placeholder="(default: 5000)"
                    value={this.maxArgs === '' ? '' : String(this.maxArgs)}
                    onInput={(e: Event) => {
                      this.validateMaxArgs((e.target as HTMLInputElement).value);
                    }}
                  />
                  {this.maxArgsError && <span class="cli-validation-message invalid">{this.maxArgsError}</span>}
                </label>

                <label class="flex flex-col gap-1 text-sm text-text2">
                  <span>
                    <strong>-L N</strong> lines per invocation
                  </span>
                  <input
                    type="number"
                    class="cli-input w-full"
                    min="1"
                    placeholder="(default: off)"
                    value={this.linesPerCmd === '' ? '' : String(this.linesPerCmd)}
                    onInput={(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      this.linesPerCmd = v === '' ? '' : Number(v) || '';
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Replace string */}
            <div class="mb-4">
              <p class="text-xs text-text2 uppercase tracking-wide mb-2">Replace string (-I)</p>
              <label class="flex flex-col gap-1 text-sm text-text2">
                <span>
                  <strong>-I replstr</strong> — replace occurrences of replstr with each stdin line (one invocation per line)
                </span>
                <input
                  type="text"
                  class="cli-input w-full font-mono"
                  placeholder="{}"
                  value={this.replaceStr}
                  onInput={(e: Event) => {
                    this.replaceStr = (e.target as HTMLInputElement).value;
                  }}
                />
                <span class="text-xs">
                  Example: <code>-I {'{}'}</code> then use <code>{'{}'}</code> inside the utility args.
                </span>
              </label>
            </div>

            {/* Parallelism */}
            <div class="mb-4">
              <p class="text-xs text-text2 uppercase tracking-wide mb-2">Parallelism</p>
              <label class="flex flex-col gap-1 text-sm text-text2">
                <span>
                  <strong>-P N</strong> max parallel invocations (0 = unlimited)
                </span>
                <input
                  type="number"
                  class={`cli-input w-full ${this.parallelError ? 'cli-input-invalid' : ''}`}
                  min="0"
                  placeholder="(default: 1)"
                  value={this.parallel === '' ? '' : String(this.parallel)}
                  onInput={(e: Event) => {
                    this.validateParallel((e.target as HTMLInputElement).value);
                  }}
                />
                {this.parallelError && <span class="cli-validation-message invalid">{this.parallelError}</span>}
              </label>
            </div>

            {/* Misc toggles */}
            <div class="mb-4">
              <p class="text-xs text-text2 uppercase tracking-wide mb-2">Behaviour</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label class="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    class="mt-0.5"
                    checked={this.trace}
                    onChange={(e: Event) => {
                      this.trace = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  <span>
                    <strong>-t</strong> trace commands to stderr
                  </span>
                </label>
                <label class="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    class="mt-0.5"
                    checked={this.noRunIfEmpty}
                    onChange={(e: Event) => {
                      this.noRunIfEmpty = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  <span>
                    <strong>-r</strong> no-run-if-empty
                    <span class="block text-text2 text-xs">GNU compat (no-op on macOS/BSD)</span>
                  </span>
                </label>
                <label class="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    class="mt-0.5"
                    checked={this.exitOnOverflow}
                    onChange={(e: Event) => {
                      this.exitOnOverflow = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  <span>
                    <strong>-x</strong> exit if args exceed -s limit
                  </span>
                </label>
              </div>
            </div>

            {/* Size limit */}
            <div>
              <p class="text-xs text-text2 uppercase tracking-wide mb-2">Size limit</p>
              <label class="flex flex-col gap-1 text-sm text-text2">
                <span>
                  <strong>-s SIZE</strong> max command-line bytes (default: ARG_MAX - 4096)
                </span>
                <input
                  type="number"
                  class="cli-input w-full"
                  min="1"
                  placeholder="(default)"
                  value={this.maxChars === '' ? '' : String(this.maxChars)}
                  onInput={(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    this.maxChars = v === '' ? '' : Number(v) || '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right column: preview + output */}
        <div class="flex flex-col gap-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <p class="text-xs text-text2 mb-2">Live-updating pipeline as you change flags above</p>
            {this.renderCommandPreview()}

            <div class="flex flex-wrap gap-2 mt-4">
              <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeCmd()}>
                Execute (stub)
              </button>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyCommand()}>
                Copy Command
              </button>
              <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
                Clear
              </button>
            </div>

            <div class="mt-3 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2'}>{this.statusMessage}</span>
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Output</h3>
            <p class="text-xs text-text2 mb-1">
              The Execute button calls the stub <code>executeCommand()</code>. Replace that function body with your native bridge to get real output.
            </p>
            <pre class="cli-output">{this.output}</pre>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Quick Presets</h3>
            <div class="flex flex-col gap-2">
              {[
                { label: 'find + NUL-safe delete', src: "find . -name '*.tmp' -print0", util: 'rm', uargs: '-f', flags: { nullDelimited: true } },
                { label: 'Parallel downloads (8 workers)', src: 'cat urls.txt', util: 'curl', uargs: '-O', flags: { parallel: 8, maxArgs: 1, nullDelimited: false } },
                { label: 'Batch grep (NUL-safe)', src: "find . -name '*.ts' -print0", util: 'grep', uargs: "-l 'TODO'", flags: { nullDelimited: true } },
                { label: 'Per-file wc -l', src: "find . -name '*.ts' -print0", util: 'wc', uargs: '-l', flags: { nullDelimited: true, maxArgs: 1 } },
              ].map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  class="cli-btn cli-btn-sm text-left"
                  onClick={() => {
                    this.stdinSource = preset.src;
                    this.utility = preset.util;
                    this.utilityArgs = preset.uargs;
                    const f = preset.flags as Partial<XargsOptions>;
                    this.nullDelimited = f.nullDelimited ?? false;
                    this.maxArgs = f.maxArgs ?? '';
                    this.parallel = f.parallel ?? '';
                    this.replaceStr = '';
                    this.trace = false;
                    this.linesPerCmd = '';
                    this.noRunIfEmpty = false;
                    this.maxChars = '';
                    this.exitOnOverflow = false;
                    this.maxArgsError = '';
                    this.parallelError = '';
                    this.setTemporaryStatus('Preset loaded');
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderPatternsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {XARGS_PATTERNS.map((pattern, i) => (
          <div key={i} class="cli-card pattern-card">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold">{pattern.name}</h3>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.loadPattern(pattern.command)}>
                Load in Builder
              </button>
            </div>
            <pre class="cli-output text-xs" style={{ minHeight: 'auto', maxHeight: '80px' }}>
              {pattern.command}
            </pre>
            <p class="text-text2 text-sm mt-2">{pattern.description}</p>
            <div class="flex flex-wrap gap-1 mt-2">
              {pattern.tags.map((tag, j) => (
                <span key={j} class="cli-badge-info">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderPitfallsTab() {
    return (
      <div class="flex flex-col gap-5">
        {XARGS_PITFALLS.map((pitfall, i) => (
          <div key={i} class="cli-card pitfall-card">
            <h3 class="font-semibold mb-2 flex items-center gap-2">
              <span class="text-warning">⚠</span>
              {pitfall.title}
            </h3>
            <div class="mb-2">
              <p class="text-xs text-text2 uppercase tracking-wide mb-1 pitfall-problem">Problem</p>
              <p class="text-sm">{pitfall.problem}</p>
            </div>
            <div class="mb-2">
              <p class="text-xs text-text2 uppercase tracking-wide mb-1 text-success">Solution</p>
              <p class="text-sm">{pitfall.solution}</p>
            </div>
            {pitfall.example && (
              <div>
                <p class="text-xs text-text2 uppercase tracking-wide mb-1">Example</p>
                <pre class="cli-output text-xs" style={{ minHeight: 'auto' }}>
                  {pitfall.example}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  renderReferenceTab() {
    return (
      <div class="flex flex-col gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-1">Synopsis</h3>
          <pre class="cli-output text-xs" style={{ minHeight: 'auto' }}>
            {
              'xargs [-0oprt] [-E eofstr] [-I replstr [-R replacements] [-S replsize]]\n      [-J replstr] [-L number] [-n number [-x]] [-P maxprocs] [-s size]\n      [utility [argument ...]]'
            }
          </pre>
          <p class="text-xs text-text2 mt-2">
            BSD/macOS xargs synopsis. GNU xargs adds <code>-d DELIM</code> and long-form aliases; the <code>-J</code> flag is BSD-only.
          </p>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {XARGS_FLAGS.map((flag, i) => (
            <div key={i} class="cli-card flag-card">
              <div class="flex items-baseline gap-2 mb-1">
                <code class="text-info font-semibold">{flag.flag}</code>
                {flag.longFlag && <code class="text-text2 text-xs">{flag.longFlag}</code>}
              </div>
              <p class="text-sm mb-1">{flag.description}</p>
              {flag.note && <p class="text-xs text-warning mb-1">Note: {flag.note}</p>}
              {flag.example && (
                <pre class="cli-output text-xs" style={{ minHeight: 'auto', maxHeight: '60px' }}>
                  {flag.example}
                </pre>
              )}
            </div>
          ))}
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Exit Status</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {[
              { code: '0', desc: 'No error' },
              { code: '1', desc: 'Other error' },
              { code: '126', desc: 'Utility found but not executable' },
              { code: '127', desc: 'Utility not found' },
            ].map((row, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <code class="text-accent font-bold text-lg">{row.code}</code>
                <p class="text-text2 text-xs mt-1">{row.desc}</p>
              </div>
            ))}
          </div>
          <p class="text-xs text-text2 mt-3">
            xargs also propagates a utility exit status of <code>255</code> as a signal to stop processing immediately.
          </p>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">BSD vs GNU Differences</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left border-b border-bg3">
                  <th class="pb-2 pr-4 text-text2">Feature</th>
                  <th class="pb-2 pr-4 text-text2">BSD/macOS</th>
                  <th class="pb-2 text-text2">GNU/Linux</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['-d DELIM', 'Not supported', 'Supported'],
                  ['-J replstr', 'Supported (positional insert)', 'Not supported'],
                  ['-r / --no-run-if-empty', 'Accepted, no-op (BSD skips empty by default)', 'Supported — needed to skip empty'],
                  ['Default empty-input', 'Skips utility call', 'Runs utility with no args'],
                  ['-o (reopen stdin as /dev/tty)', 'Supported', 'Not standard'],
                  ['Long option aliases', 'Limited (--null, --max-args, --max-procs, ...)', 'Full POSIX + GNU extensions'],
                ].map((row, i) => (
                  <tr key={i} class="border-b border-bg3 last:border-0">
                    <td class="py-2 pr-4">
                      <code class="text-info">{row[0]}</code>
                    </td>
                    <td class="py-2 pr-4 text-text2">{row[1]}</td>
                    <td class="py-2 text-text2">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🪡</span> xargs
            <span class="cli-badge-safe">teaching tool</span>
          </h2>
          <p class="text-text2 text-sm">Build arg lists from stdin — visual command builder with live preview</p>
        </header>

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">{this.renderTabs()}</div>

        <div>
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'patterns' && this.renderPatternsTab()}
          {this.activeTab === 'pitfalls' && this.renderPitfallsTab()}
          {this.activeTab === 'reference' && this.renderReferenceTab()}
        </div>
      </div>
    );
  }
}
