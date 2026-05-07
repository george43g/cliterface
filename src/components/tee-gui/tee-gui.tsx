import { Component, h, State } from '@stencil/core';
import { buildTeeCommandString, PATTERN_CATEGORIES, TEE_PATTERNS, type TeePattern, validateOutputPath } from '../../tee/tee-command-builders';
import { getTeeManPage } from '../../tee/tee-documentation';
import { type CommandResult, teeService } from '../../tee/tee-service';

const TAB_DEFINITIONS = [
  { id: 'builder', label: 'Builder' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'reference', label: 'Reference' },
];

interface OutputFileEntry {
  id: number;
  path: string;
  error?: string;
}

let _nextId = 1;
function nextId() {
  return _nextId++;
}

@Component({
  tag: 'tee-gui',
  styleUrl: 'tee-gui.css',
  scoped: true,
})
export class TeeGui {
  @State() activeTab = 'builder';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'tee';
  @State() output = 'Configure a tee command and click Execute to run it.';

  // Builder state
  @State() inputCmd = 'echo "Hello, tee!"';
  @State() outputFiles: OutputFileEntry[] = [{ id: nextId(), path: '/tmp/tee-out.txt', error: undefined }];
  @State() appendAll = false;
  @State() ignoreInterrupt = false;

  // Patterns state
  @State() selectedPatternId = '';
  @State() patternPreviewCmd = '';

  // ── Command preview ────────────────────────────────────────────────────────

  private buildPreview(): string {
    return buildTeeCommandString({
      inputCmd: this.inputCmd,
      outputFiles: this.outputFiles.map(f => ({ path: f.path, append: this.appendAll })),
      appendAll: this.appendAll,
      ignoreInterrupt: this.ignoreInterrupt,
    });
  }

  // ── Execution ──────────────────────────────────────────────────────────────

  private async runCommand(cmd: string): Promise<void> {
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running…';
    this.statusMessage = 'Running…';

    try {
      const result: CommandResult = await teeService.run(this.inputCmd, {
        files: this.outputFiles.map(f => f.path),
        append: this.appendAll,
        ignoreInterrupt: this.ignoreInterrupt,
      });

      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private setTemporaryStatus(msg: string): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = 'Ready';
      }, 2000);
    }
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied to clipboard');
  }

  async copyCommand(cmd: string): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(cmd);
    this.setTemporaryStatus('Command copied!');
  }

  // ── File list management ───────────────────────────────────────────────────

  addOutputFile(): void {
    this.outputFiles = [...this.outputFiles, { id: nextId(), path: '', error: undefined }];
  }

  removeOutputFile(id: number): void {
    if (this.outputFiles.length <= 1) return;
    this.outputFiles = this.outputFiles.filter(f => f.id !== id);
  }

  updateFilePath(id: number, path: string): void {
    const validation = path.trim() ? validateOutputPath(path.trim()) : { valid: true };
    this.outputFiles = this.outputFiles.map(f => (f.id === id ? { ...f, path, error: validation.valid ? undefined : validation.error } : f));
  }

  // ── Rendering helpers ─────────────────────────────────────────────────────

  renderTabs() {
    return (
      <div class="border-b border-accent2 mb-4 flex gap-1">
        {TAB_DEFINITIONS.map(tab => (
          <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => (this.activeTab = tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  /** SVG pipe-flow diagram: stdin → tee → [stdout, file1, file2…] */
  renderPipeDiagram() {
    const files = this.outputFiles.filter(f => f.path.trim().length > 0);
    // Outputs = stdout + each file
    const outputs: string[] = ['stdout (terminal)', ...files.map(f => f.path.trim())];
    const totalOutputs = outputs.length;

    // Layout constants
    const svgWidth = 560;
    const nodeW = 120;
    const nodeH = 36;
    const teeX = 220;
    const teeY = 60;
    const outputStartX = teeX + nodeW + 60;
    const rowSpacing = 52;
    const svgHeight = Math.max(160, totalOutputs * rowSpacing + 80);

    // Horizontal center of tee box
    const teeCX = teeX + nodeW / 2;
    // Vertical center of tee box
    const teeCY = teeY + nodeH / 2;

    return (
      <div class="pipe-diagram-wrapper">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} class="pipe-diagram" aria-label="tee pipe flow diagram" role="img">
          {/* ── stdin node ────────────────────────────────────────────── */}
          <rect x={20} y={teeY} width={nodeW} height={nodeH} rx={6} class="diag-node diag-stdin" />
          <text x={20 + nodeW / 2} y={teeY + nodeH / 2 + 5} text-anchor="middle" class="diag-label">
            stdin
          </text>

          {/* ── Arrow stdin → tee ─────────────────────────────────────── */}
          <line x1={20 + nodeW} y1={teeCY} x2={teeX - 2} y2={teeCY} class="diag-arrow" marker-end="url(#arrowhead)" />

          {/* ── tee node ─────────────────────────────────────────────── */}
          <rect x={teeX} y={teeY} width={nodeW} height={nodeH} rx={6} class="diag-node diag-tee" />
          <text x={teeCX} y={teeY + nodeH / 2 + 5} text-anchor="middle" class="diag-label diag-label-tee">
            🪣 tee
          </text>

          {/* ── Output nodes + arrows ─────────────────────────────────── */}
          {outputs.map((label, i) => {
            const oy = (svgHeight / (totalOutputs + 1)) * (i + 1) - nodeH / 2;
            const oCX = outputStartX + nodeW / 2;
            const oCY = oy + nodeH / 2;
            const isStdout = i === 0;

            // Line from right edge of tee to output node left edge
            // Use a bend point at teeCX + 40
            const bendX = teeX + nodeW + 30;

            return (
              <g key={label}>
                {/* Bend line: tee right → bend → output */}
                <polyline
                  points={`${teeX + nodeW},${teeCY} ${bendX},${teeCY} ${bendX},${oCY} ${outputStartX - 2},${oCY}`}
                  class="diag-arrow"
                  marker-end="url(#arrowhead)"
                  fill="none"
                />

                <rect x={outputStartX} y={oy} width={nodeW + 20} height={nodeH} rx={6} class={`diag-node ${isStdout ? 'diag-stdout' : 'diag-file'}`} />
                <text x={oCX + 10} y={oy + nodeH / 2 + 5} text-anchor="middle" class="diag-label diag-output-label" clip-path={`inset(0 0 0 0)`}>
                  {label.length > 14 ? `…${label.slice(-13)}` : label}
                </text>
              </g>
            );
          })}

          {/* ── Arrow defs ─────────────────────────────────────────────── */}
          <defs>
            <marker id="arrowhead" markerWidth={8} markerHeight={6} refX={6} refY={3} orient="auto">
              <polygon points="0 0, 8 3, 0 6" class="diag-arrowhead" />
            </marker>
          </defs>
        </svg>
        <p class="text-text2 text-xs text-center mt-1">stdin flows through tee to all outputs simultaneously</p>
      </div>
    );
  }

  renderBuilderTab() {
    const preview = this.buildPreview();
    const hasErrors = this.outputFiles.some(f => f.error);
    const validFiles = this.outputFiles.filter(f => f.path.trim().length > 0 && !f.error);

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Left: configuration ─────────────────────────────────── */}
        <div class="space-y-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Input Source</h3>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Command piped into tee
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="echo 'hello' or leave empty for stdin"
                value={this.inputCmd}
                onInput={(e: Event) => (this.inputCmd = (e.target as HTMLInputElement).value)}
              />
              <span class="text-xs text-text2">This becomes the left side of the pipe: cmd | tee …</span>
            </label>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Output Files</h3>
            <p class="text-xs text-text2 mb-3">tee always writes to stdout. Add files to also write there.</p>

            <div class="space-y-2 mb-3">
              {this.outputFiles.map((f, i) => (
                <div key={f.id} class="flex flex-col gap-1">
                  <div class="flex gap-2 items-center">
                    <span class="text-xs text-text2 w-16 shrink-0">File {i + 1}</span>
                    <input
                      type="text"
                      class={`cli-input flex-1 font-mono text-sm ${f.error ? 'cli-input-invalid' : f.path.trim() ? 'cli-input-valid' : ''}`}
                      placeholder="/tmp/output.txt"
                      value={f.path}
                      onInput={(e: Event) => this.updateFilePath(f.id, (e.target as HTMLInputElement).value)}
                    />
                    <button
                      type="button"
                      class="cli-btn cli-btn-sm cli-btn-danger"
                      disabled={this.outputFiles.length <= 1}
                      onClick={() => this.removeOutputFile(f.id)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                  {f.error && <p class="cli-validation-message invalid pl-20">{f.error}</p>}
                </div>
              ))}
            </div>

            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.addOutputFile()}>
              + Add file
            </button>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Flags</h3>
            <div class="space-y-3">
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" class="mt-1" checked={this.appendAll} onChange={(e: Event) => (this.appendAll = (e.target as HTMLInputElement).checked)} />
                <div>
                  <span class="text-sm font-medium font-mono">-a</span>
                  <span class="text-sm text-text2 ml-2">Append to files instead of overwriting</span>
                  <p class="text-xs text-text2 mt-0.5">Safe for log files — preserves existing content</p>
                </div>
              </label>

              <label class="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" class="mt-1" checked={this.ignoreInterrupt} onChange={(e: Event) => (this.ignoreInterrupt = (e.target as HTMLInputElement).checked)} />
                <div>
                  <span class="text-sm font-medium font-mono">-i</span>
                  <span class="text-sm text-text2 ml-2">Ignore SIGINT (Ctrl-C)</span>
                  <p class="text-xs text-text2 mt-0.5">Lets tee finish draining the pipe before exiting</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Right: preview, diagram, output ──────────────────────── */}
        <div class="space-y-4">
          <div class="cli-card">
            <h3 class="text-text2 text-base mb-2">Command Preview</h3>
            <div class="cli-cmd-preview">{preview}</div>

            <div class="flex gap-2 mt-3">
              <button type="button" class="cli-btn cli-btn-success" disabled={hasErrors || validFiles.length === 0} onClick={() => this.runCommand(preview)}>
                Execute
              </button>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyCommand(preview)}>
                Copy
              </button>
              <span class={`ml-auto text-sm self-center ${this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2'}`}>
                {this.statusMessage}
              </span>
            </div>
          </div>

          <div class="cli-card">
            <h3 class="text-text2 text-base mb-3">Pipe Flow</h3>
            {this.renderPipeDiagram()}
          </div>

          <div class="cli-card">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-text2 text-base">Output</h3>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
                Copy
              </button>
            </div>
            <pre class="cli-output">{this.output}</pre>
          </div>
        </div>
      </div>
    );
  }

  renderPatternCard(pattern: TeePattern) {
    const isSelected = this.selectedPatternId === pattern.id;

    return (
      <button
        type="button"
        key={pattern.id}
        class={`cli-card cli-card-hover cursor-pointer transition-all text-left w-full ${isSelected ? 'border-accent' : ''}`}
        onClick={() => {
          this.selectedPatternId = pattern.id;
          this.patternPreviewCmd = pattern.command;
        }}
      >
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-medium text-sm">{pattern.name}</h4>
          <span class={`cli-badge-${pattern.category === 'sudo' ? 'sip' : 'info'} text-xs ml-2 shrink-0`}>
            {PATTERN_CATEGORIES.find(c => c.id === pattern.category)?.label ?? pattern.category}
          </span>
        </div>
        <p class="text-text2 text-xs mb-2">{pattern.description}</p>
        <code class="block text-xs font-mono bg-bg3 p-2 rounded overflow-x-auto whitespace-pre">{pattern.command}</code>

        {isSelected && (
          <div class="mt-3 p-3 bg-bg3 rounded text-xs text-text2 border-l-2 border-accent">
            <p class="font-medium text-text mb-1">Why this works</p>
            <p>{pattern.explanation}</p>
            <div class="flex gap-2 mt-3">
              <button
                type="button"
                class="cli-btn cli-btn-sm"
                onClick={(e: Event) => {
                  e.stopPropagation();
                  this.copyCommand(pattern.command);
                }}
              >
                Copy command
              </button>
              <button
                type="button"
                class="cli-btn cli-btn-sm cli-btn-success"
                onClick={(e: Event) => {
                  e.stopPropagation();
                  this.inputCmd = pattern.command.includes('|') ? pattern.command.split('|')[0].trim() : pattern.command;
                  this.activeTab = 'builder';
                  this.setTemporaryStatus('Loaded into builder');
                }}
              >
                Load in Builder
              </button>
            </div>
          </div>
        )}
      </button>
    );
  }

  renderPatternsTab() {
    return (
      <div class="space-y-6">
        {PATTERN_CATEGORIES.map(cat => {
          const patterns = TEE_PATTERNS.filter(p => p.category === cat.id);
          return (
            <div key={cat.id}>
              <h3 class="text-base font-medium mb-3 flex items-center gap-2">
                <span>{cat.icon}</span>
                {cat.label}
              </h3>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">{patterns.map(p => this.renderPatternCard(p))}</div>
            </div>
          );
        })}
      </div>
    );
  }

  renderReferenceTab() {
    const manPage = getTeeManPage();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-1">{manPage.name}</h2>
          <code class="text-sm text-text2 font-mono block mb-3">{manPage.synopsis}</code>
          <p class="text-sm whitespace-pre-line leading-relaxed mb-4">{manPage.description}</p>

          {manPage.sections.map((section, i) => (
            <div key={i} class="mb-4">
              <h3 class="text-base font-medium text-accent mb-2">{section.title}</h3>
              <pre class="cli-output text-xs min-h-0" style={{ minHeight: '0' }}>
                {section.content}
              </pre>
            </div>
          ))}
        </div>

        <div class="cli-card">
          <h3 class="text-base font-medium mb-3">Examples</h3>
          <div class="space-y-2">
            {manPage.examples.map((ex, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-start gap-2 mb-1">
                  <code class="font-mono text-xs flex-1 break-all">{ex.command}</code>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm shrink-0"
                    onClick={() => {
                      this.copyCommand(ex.command);
                    }}
                  >
                    Copy
                  </button>
                </div>
                <p class="text-xs text-text2">{ex.description}</p>
              </div>
            ))}
          </div>

          <div class="mt-6 p-4 bg-bg3 rounded-lg border-l-4 border-warning">
            <h4 class="text-sm font-medium text-warning mb-2">The sudo tee trick — explained</h4>
            <div class="text-xs text-text2 space-y-2">
              <p>
                <span class="text-danger font-mono">sudo echo "x" &gt; /etc/file</span> — fails: the shell opens the file as <em>you</em>, before sudo runs.
              </p>
              <p>
                <span class="text-success font-mono">echo "x" | sudo tee /etc/file</span> — works: sudo runs <code>tee</code>, tee gets root, tee writes.
              </p>
              <p>The redirect ({'>'}) is entirely bypassed. tee's job IS writing to the file.</p>
            </div>
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
            <span>🪣</span> tee
            <span class="text-sm font-normal text-text2">— Pipe to multiple outputs</span>
          </h2>
          <p class="text-text2 text-sm">POSIX tool: read from stdin, write to stdout and files simultaneously</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'patterns' && this.renderPatternsTab()}
          {this.activeTab === 'reference' && this.renderReferenceTab()}
        </div>
      </div>
    );
  }
}
