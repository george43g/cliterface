import { Component, Event, type EventEmitter, h, Prop, State } from '@stencil/core';
import { awkService, type CommandResult } from '../../awk/awk-service';
import { awkPatternPresets, awkActionPresets, awkFieldSeparators, awkExamples, buildAwkCommand } from '../../awk/awk-command-builders';
import { getAwkManPage } from '../../awk/awk-documentation';
import { parseCommandIntoSegments, type CommandSegment } from '../../utils/command-builder';

const TAB_DEFINITIONS = [
  { id: 'builder', label: 'Script Builder' },
  { id: 'presets', label: 'Presets' },
  { id: 'input', label: 'Text Input' },
  { id: 'docs', label: 'Documentation' },
  { id: 'raw', label: 'Raw' },
];

const SAMPLE_INPUT = `alice 25 engineer
bob 30 designer
carol 28 developer
dave 35 manager
eve 22 intern`;

@Component({
  tag: 'awk-gui',
  styleUrl: 'awk-gui.css',
  scoped: true,
})
export class AwkGui {
  @Prop() version = '4.2';

  @State() activeTab = 'builder';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Build an awk program and click Execute to process text.';
  @State() statusMessage = 'Ready';

  // Script builder state
  @State() patternInput = '';
  @State() actionInput = 'print $1, $2';
  @State() hasBegin = false;
  @State() beginAction = '';
  @State() hasEnd = false;
  @State() endAction = '';
  @State() fieldSeparator = '';

  // Variables state
  @State() variables: Record<string, string> = {};
  @State() newVarName = '';
  @State() newVarValue = '';

  // Command segments for hover tooltips
  @State() commandSegments: CommandSegment[] = [];
  @State() highlightedSegmentIndex: number | null = null;

  // Presets state
  @State() selectedPatternPreset = '';
  @State() selectedActionPreset = '';

  // Input state
  @State() textInput = SAMPLE_INPUT;

  @Event() commandExecuted: EventEmitter<CommandResult>;

  componentWillLoad() {
    this.updateCommandSegments();
  }

  private setTemporaryStatus(message: string, resetTo = 'Ready'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private buildProgram(): string {
    const parts: string[] = [];

    if (this.hasBegin && this.beginAction) {
      parts.push(`BEGIN { ${this.beginAction} }`);
    }

    if (this.patternInput || this.actionInput) {
      const pattern = this.patternInput || '';
      const action = this.actionInput || 'print';
      if (pattern) {
        parts.push(`${pattern} { ${action} }`);
      } else {
        parts.push(`{ ${action} }`);
      }
    }

    if (this.hasEnd && this.endAction) {
      parts.push(`END { ${this.endAction} }`);
    }

    return parts.join(' ');
  }

  private buildCommandPreview(): string {
    const program = this.buildProgram();
    if (!program) return 'awk';

    const options = {
      fieldSeparator: this.fieldSeparator,
      variables: Object.keys(this.variables).length > 0 ? this.variables : undefined,
    };

    return buildAwkCommand([{ pattern: this.patternInput, action: this.actionInput }], options);
  }

  private updateCommandSegments() {
    const cmd = this.buildCommandPreview();
    this.commandSegments = parseCommandIntoSegments(cmd);
  }

  async executeProgram(showConfirm = false): Promise<void> {
    const program = this.buildProgram();
    if (!program) {
      this.output = 'Error: No awk program specified';
      this.status = 'error';
      this.statusMessage = 'No program';
      return;
    }

    const cmd = this.buildCommandPreview();

    if (showConfirm && typeof window !== 'undefined' && !window.confirm(`Execute: ${cmd}?`)) {
      return;
    }

    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Processing...';
    this.statusMessage = 'Running...';

    try {
      const result = await awkService.run(program, this.textInput, {
        fieldSeparator: this.fieldSeparator,
        variables: Object.keys(this.variables).length > 0 ? this.variables : undefined,
      });

      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || 'No output';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
      this.commandExecuted.emit(result);
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  async executeRawCmd(cmd: string): Promise<void> {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    this.status = 'running';
    this.lastCommand = trimmedCmd;
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      const result = await awkService.execute(trimmedCmd);

      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || 'No output';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
      this.commandExecuted.emit(result);
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  clearOutput(): void {
    this.output = 'Build an awk program and click Execute to process text.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied to clipboard');
  }

  addVariable(): void {
    if (!this.newVarName.trim()) return;
    this.variables = {
      ...this.variables,
      [this.newVarName]: this.newVarValue,
    };
    this.newVarName = '';
    this.newVarValue = '';
    this.updateCommandSegments();
  }

  removeVariable(name: string): void {
    const newVars = { ...this.variables };
    delete newVars[name];
    this.variables = newVars;
    this.updateCommandSegments();
  }

  loadPatternPreset(pattern: string): void {
    this.patternInput = pattern;
    this.selectedPatternPreset = pattern;
    this.updateCommandSegments();
    this.setTemporaryStatus('Pattern preset loaded');
  }

  loadActionPreset(action: string): void {
    this.actionInput = action;
    this.selectedActionPreset = action;
    this.updateCommandSegments();
    this.setTemporaryStatus('Action preset loaded');
  }

  loadExample(example: { pattern?: string; action: string; fieldSeparator?: string }): void {
    this.patternInput = example.pattern || '';
    this.actionInput = example.action;
    this.fieldSeparator = example.fieldSeparator || '';
    this.activeTab = 'builder';
    this.updateCommandSegments();
    this.setTemporaryStatus('Example loaded into Script Builder');
  }

  highlightSegment(index: number): void {
    this.highlightedSegmentIndex = index;
  }

  clearHighlight(): void {
    this.highlightedSegmentIndex = null;
  }

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => (this.activeTab = tab.id)}>
        {tab.label}
      </button>
    ));
  }

  renderCommandPreview() {
    return (
      <div class="cli-cmd-preview">
        {this.commandSegments.map((segment, i) => (
          <span
            key={i}
            class={`cmd-segment cmd-segment-${segment.type} ${this.highlightedSegmentIndex === i ? 'cmd-segment-highlight' : ''}`}
            title={segment.description}
            onMouseEnter={() => this.highlightSegment(i)}
            onMouseLeave={() => this.clearHighlight()}
          >
            {segment.text}
          </span>
        ))}
      </div>
    );
  }

  renderBuilderTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Script Builder</h3>

          <div class="mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Field Separator (-F)
              <select
                class="cli-input w-full"
                onChange={(e: Event) => {
                  this.fieldSeparator = (e.target as HTMLSelectElement).value;
                  this.updateCommandSegments();
                }}
              >
                {awkFieldSeparators.map(fs => (
                  <option value={fs.value} selected={fs.value === this.fieldSeparator}>
                    {fs.label} - {fs.description}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="mb-4">
            <label class="flex items-center gap-2 text-sm text-text2 mb-2">
              <input
                type="checkbox"
                checked={this.hasBegin}
                onChange={(e: Event) => {
                  this.hasBegin = (e.target as HTMLInputElement).checked;
                  this.updateCommandSegments();
                }}
              />
              BEGIN Block
            </label>
            {this.hasBegin && (
              <input
                type="text"
                class="cli-input w-full font-mono text-sm"
                placeholder='print "Header"'
                value={this.beginAction}
                onInput={(e: Event) => {
                  this.beginAction = (e.target as HTMLInputElement).value;
                  this.updateCommandSegments();
                }}
              />
            )}
          </div>

          <div class="mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Pattern
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder='NR > 1 or /regex/ or $1 == "value"'
                value={this.patternInput}
                onInput={(e: Event) => {
                  this.patternInput = (e.target as HTMLInputElement).value;
                  this.updateCommandSegments();
                }}
              />
              <span class="text-xs text-text2">Leave empty to match all lines</span>
            </label>
          </div>

          <div class="mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Action
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder='print $1, $2'
                value={this.actionInput}
                onInput={(e: Event) => {
                  this.actionInput = (e.target as HTMLInputElement).value;
                  this.updateCommandSegments();
                }}
              />
            </label>
          </div>

          <div class="mb-4">
            <label class="flex items-center gap-2 text-sm text-text2 mb-2">
              <input
                type="checkbox"
                checked={this.hasEnd}
                onChange={(e: Event) => {
                  this.hasEnd = (e.target as HTMLInputElement).checked;
                  this.updateCommandSegments();
                }}
              />
              END Block
            </label>
            {this.hasEnd && (
              <input
                type="text"
                class="cli-input w-full font-mono text-sm"
                placeholder='print "Footer"'
                value={this.endAction}
                onInput={(e: Event) => {
                  this.endAction = (e.target as HTMLInputElement).value;
                  this.updateCommandSegments();
                }}
              />
            )}
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeProgram()}>
              Execute
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Command Preview</h3>
          {this.renderCommandPreview()}

          <div class="mt-4">
            <h4 class="text-sm text-text2 mb-2">
              Status:{' '}
              <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </h4>
          </div>

          <div class="mt-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-text2 text-sm">Output</span>
              <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
                Copy
              </button>
            </div>
            <pre class="cli-output">{this.output}</pre>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Variables (-v)</h3>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input
              type="text"
              class="cli-input"
              placeholder="Variable name"
              value={this.newVarName}
              onInput={(e: Event) => (this.newVarName = (e.target as HTMLInputElement).value)}
            />
            <input
              type="text"
              class="cli-input md:col-span-2"
              placeholder="Value"
              value={this.newVarValue}
              onInput={(e: Event) => (this.newVarValue = (e.target as HTMLInputElement).value)}
            />
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.addVariable()}>
              Add
            </button>
          </div>

          {Object.keys(this.variables).length > 0 && (
            <div class="flex flex-wrap gap-2">
              {Object.entries(this.variables).map(([name, value]) => (
                <span key={name} class="inline-flex items-center gap-2 px-2 py-1 bg-bg3 rounded text-sm">
                  <code>-v {name}={value}</code>
                  <button class="text-danger hover:text-text" onClick={() => this.removeVariable(name)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  renderPresetsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Pattern Presets</h3>
          <div class="grid grid-cols-1 gap-2">
            {awkPatternPresets.map(preset => (
              <button
                key={preset.name}
                type="button"
                class={`cli-btn cli-btn-sm text-left ${this.selectedPatternPreset === preset.pattern ? 'cli-btn-info' : ''}`}
                onClick={() => this.loadPatternPreset(preset.pattern)}
                title={preset.description}
              >
                <div class="font-medium">{preset.name}</div>
                <code class="text-xs opacity-70">{preset.pattern || '(empty - matches all)'}</code>
              </button>
            ))}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Action Presets</h3>
          <div class="grid grid-cols-1 gap-2">
            {awkActionPresets.map(preset => (
              <button
                key={preset.name}
                type="button"
                class={`cli-btn cli-btn-sm text-left ${this.selectedActionPreset === preset.action ? 'cli-btn-info' : ''}`}
                onClick={() => this.loadActionPreset(preset.action)}
                title={preset.description}
              >
                <div class="font-medium">{preset.name}</div>
                <code class="text-xs opacity-70">{preset.action}</code>
              </button>
            ))}
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Real-World Examples</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {awkExamples.map((example, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium">{example.name}</span>
                  <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.loadExample(example)}>
                    Try it
                  </button>
                </div>
                <code class="text-xs block mb-1">
                  {example.pattern || '(no pattern)'} {example.action}
                </code>
                <p class="text-xs text-text2">{example.description}</p>
                {example.fieldSeparator && <p class="text-xs text-info mt-1">FS: {example.fieldSeparator}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderInputTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Text Input</h3>
          <textarea
            class="cli-input w-full font-mono h-64"
            value={this.textInput}
            onInput={(e: Event) => (this.textInput = (e.target as HTMLTextAreaElement).value)}
          />
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                this.textInput = SAMPLE_INPUT;
                this.setTemporaryStatus('Sample data loaded');
              }}
            >
              Load Sample
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                this.textInput = '';
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderDocsTab() {
    const manPage = getAwkManPage();
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h2 class="text-xl mb-2">{manPage.name}</h2>
          <p class="text-text2 text-sm mb-4">{manPage.synopsis}</p>
          <p class="whitespace-pre-wrap mb-6">{manPage.description}</p>

          {manPage.sections.map((section, i) => (
            <div key={i} class="mb-6">
              <h3 class="text-lg font-medium mb-2">{section.title}</h3>
              <pre class="cli-output text-sm">{section.content}</pre>
            </div>
          ))}

          <div class="mt-6">
            <h3 class="text-lg font-medium mb-2">Examples</h3>
            <div class="space-y-2">
              {manPage.examples.map((ex, i) => (
                <div key={i} class="flex gap-4 items-start p-2 bg-bg3 rounded">
                  <code class="font-mono text-sm flex-1">{ex.command}</code>
                  <span class="text-text2 text-sm">{ex.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderRawTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Raw Command</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder={"awk '{ print $1 }' file.txt"}
              ref={el => {
                if (el) (el as HTMLInputElement).dataset.rawCommand = '';
              }}
              onInput={(e: Event) => {
                const target = e.target as HTMLInputElement;
                target.dataset.rawCommand = target.value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={(e: Event) => {
              const input = (e.target as HTMLElement).closest('.cli-card')?.querySelector('input');
              if (input) this.executeRawCmd((input as HTMLInputElement).dataset.rawCommand || '');
            }}
          >
            Execute
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Output</h3>
          <div class="flex justify-between items-center mb-2">
            <span class="text-text2 text-sm">Result</span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>📝</span> awk GUI
            <span class="text-sm font-normal text-text2">v{this.version}</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for awk - Pattern scanning and processing language</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'presets' && this.renderPresetsTab()}
          {this.activeTab === 'input' && this.renderInputTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
          {this.activeTab === 'raw' && this.renderRawTab()}
        </div>
      </div>
    );
  }
}
