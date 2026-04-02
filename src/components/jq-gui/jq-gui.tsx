import { Component, Event, type EventEmitter, h, Prop, State } from '@stencil/core';
import { jqService, type CommandResult, executeJqCommand } from '../../jq/jq-service';
import { jqFilterPresets, jqExamples, buildJqCommand, type JqFilter, type JqVariable } from '../../jq/jq-command-builders';
import { getJqManPage } from '../../jq/jq-documentation';
import { parseCommandIntoSegments, type CommandSegment } from '../../utils/command-builder';

const TAB_DEFINITIONS = [
  { id: 'filter', label: 'Filter Builder' },
  { id: 'presets', label: 'Presets' },
  { id: 'json', label: 'JSON Input' },
  { id: 'docs', label: 'Documentation' },
  { id: 'raw', label: 'Raw' },
];

const SAMPLE_JSON = `{
  "users": [
    { "id": 1, "name": "Alice", "active": true, "age": 28 },
    { "id": 2, "name": "Bob", "active": false, "age": 34 },
    { "id": 3, "name": "Carol", "active": true, "age": 22 }
  ],
  "count": 3,
  "meta": {
    "page": 1,
    "total": 10
  }
}`;

@Component({
  tag: 'jq-gui',
  styleUrl: 'jq-gui.css',
  scoped: true,
})
export class JqGui {
  @Prop() version = '1.7';

  @State() activeTab = 'filter';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Build a jq filter and click Execute to process JSON.';
  @State() statusMessage = 'Ready';

  // Filter builder state
  @State() filterInput = '.';
  @State() jsonInput = SAMPLE_JSON;
  @State() compactOutput = false;
  @State() rawOutput = false;
  @State() sortKeys = false;
  @State() indentSize = 2;

  // Variables state
  @State() variables: JqVariable[] = [];
  @State() newVarName = '';
  @State() newVarValue = '';
  @State() newVarIsString = true;

  // Command segments for hover tooltips
  @State() commandSegments: CommandSegment[] = [];
  @State() highlightedSegmentIndex: number | null = null;

  // Presets state
  @State() selectedPreset = '';

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

  private buildCommandPreview(): string {
    const options: JqFilter['options'] = {
      compact: this.compactOutput,
      raw: this.rawOutput,
      sortKeys: this.sortKeys,
      indent: this.indentSize,
    };
    return buildJqCommand(this.filterInput, '', options, this.variables);
  }

  private updateCommandSegments() {
    const cmd = this.buildCommandPreview();
    this.commandSegments = parseCommandIntoSegments(cmd);
  }

  async executeFilter(showConfirm = false): Promise<void> {
    const cmd = this.buildCommandPreview();

    if (showConfirm && typeof window !== 'undefined' && !window.confirm(`Execute: ${cmd}?`)) {
      return;
    }

    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Processing...';
    this.statusMessage = 'Running...';

    try {
      const result = await executeJqCommand(this.filterInput, this.jsonInput, this.rawOutput);
      const sections = [
        result.stdout?.trim(),
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''
      ].filter(Boolean);

      this.output = sections.join('\n\n') || JSON.stringify(result, null, 2);
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
      const result = await jqService.execute(trimmedCmd);
      const sections = [
        result.stdout?.trim(),
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''
      ].filter(Boolean);

      this.output = sections.join('\n\n') || JSON.stringify(result, null, 2);
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
    this.output = 'Build a jq filter and click Execute to process JSON.';
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

  async validateJson(): Promise<void> {
    const result = await jqService.validateJson(this.jsonInput);
    if (result.valid) {
      this.setTemporaryStatus('JSON is valid');
    } else {
      this.output = `Invalid JSON: ${result.error || 'Unknown error'}`;
      this.status = 'error';
      this.statusMessage = 'Invalid JSON';
    }
  }

  addVariable(): void {
    if (!this.newVarName.trim()) return;
    this.variables = [
      ...this.variables,
      { name: this.newVarName, value: this.newVarValue, isString: this.newVarIsString }
    ];
    this.newVarName = '';
    this.newVarValue = '';
    this.updateCommandSegments();
  }

  removeVariable(index: number): void {
    this.variables = this.variables.filter((_, i) => i !== index);
    this.updateCommandSegments();
  }

  loadPreset(presetFilter: string): void {
    this.filterInput = presetFilter;
    this.selectedPreset = presetFilter;
    this.updateCommandSegments();
    this.setTemporaryStatus('Preset loaded');
  }

  loadExample(exampleFilter: string): void {
    this.filterInput = exampleFilter;
    this.activeTab = 'filter';
    this.updateCommandSegments();
    this.setTemporaryStatus('Example loaded into Filter Builder');
  }

  highlightSegment(index: number): void {
    this.highlightedSegmentIndex = index;
  }

  clearHighlight(): void {
    this.highlightedSegmentIndex = null;
  }

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button
        type="button"
        key={tab.id}
        class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
        onClick={() => this.activeTab = tab.id}
      >
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

  renderFilterTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Filter Builder</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            jq Filter
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="."
              value={this.filterInput}
              onInput={(e: Event) => {
                this.filterInput = (e.target as HTMLInputElement).value;
                this.updateCommandSegments();
              }}
            />
            <span class="text-xs text-text2">Try: .users[] | select(.active) | .name</span>
          </label>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.compactOutput}
                onChange={(e: Event) => {
                  this.compactOutput = (e.target as HTMLInputElement).checked;
                  this.updateCommandSegments();
                }}
              />
              Compact (-c)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.rawOutput}
                onChange={(e: Event) => {
                  this.rawOutput = (e.target as HTMLInputElement).checked;
                  this.updateCommandSegments();
                }}
              />
              Raw (-r)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.sortKeys}
                onChange={(e: Event) => {
                  this.sortKeys = (e.target as HTMLInputElement).checked;
                  this.updateCommandSegments();
                }}
              />
              Sort keys (-S)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              Indent:
              <input
                type="number"
                class="cli-input w-16"
                min="0"
                max="8"
                value={this.indentSize}
                onInput={(e: Event) => {
                  this.indentSize = parseInt((e.target as HTMLInputElement).value) || 2;
                  this.updateCommandSegments();
                }}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeFilter()}>
              Execute
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.validateJson()}>
              Validate JSON
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
            <h4 class="text-sm text-text2 mb-2">Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span></h4>
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
          <h3 class="text-text2 text-base mb-3">Variables (--arg / --argjson)</h3>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input
              type="text"
              class="cli-input"
              placeholder="Variable name"
              value={this.newVarName}
              onInput={(e: Event) => this.newVarName = (e.target as HTMLInputElement).value}
            />
            <input
              type="text"
              class="cli-input md:col-span-2"
              placeholder="Value"
              value={this.newVarValue}
              onInput={(e: Event) => this.newVarValue = (e.target as HTMLInputElement).value}
            />
            <div class="flex gap-2">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={this.newVarIsString}
                  onChange={(e: Event) => this.newVarIsString = (e.target as HTMLInputElement).checked}
                />
                String
              </label>
              <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.addVariable()}>
                Add
              </button>
            </div>
          </div>

          {this.variables.length > 0 && (
            <div class="flex flex-wrap gap-2">
              {this.variables.map((v, i) => (
                <span key={i} class="inline-flex items-center gap-2 px-2 py-1 bg-bg3 rounded text-sm">
                  <code>{v.isString ? '--arg' : '--argjson'} {v.name} {v.value}</code>
                  <button class="text-danger hover:text-text" onClick={() => this.removeVariable(i)}>×</button>
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
          <h3 class="text-text2 text-base mb-3">Filter Presets</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jqFilterPresets.map(preset => (
              <button
                key={preset.filter}
                type="button"
                class={`cli-btn cli-btn-sm text-left ${this.selectedPreset === preset.filter ? 'cli-btn-info' : ''}`}
                onClick={() => this.loadPreset(preset.filter)}
                title={preset.description}
              >
                <div class="font-medium">{preset.name}</div>
                <code class="text-xs opacity-70">{preset.filter}</code>
              </button>
            ))}
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Real-World Examples</h3>
          <div class="space-y-3">
            {jqExamples.map((example, i) => (
              <div key={i} class="p-3 bg-bg3 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium">{example.name}</span>
                  <button
                    type="button"
                    class="cli-btn cli-btn-sm"
                    onClick={() => this.loadExample(example.filter)}
                  >
                    Try it
                  </button>
                </div>
                <code class="text-xs block mb-1">{example.filter}</code>
                <p class="text-xs text-text2">{example.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderJsonTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">JSON Input</h3>
          <textarea
            class="cli-input w-full font-mono h-64"
            value={this.jsonInput}
            onInput={(e: Event) => this.jsonInput = (e.target as HTMLTextAreaElement).value}
          />
          <div class="flex flex-wrap gap-2 mt-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => { this.jsonInput = SAMPLE_JSON; this.setTemporaryStatus('Sample JSON loaded'); }}>
              Load Sample
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => { this.jsonInput = '{}'; }}>
              Clear
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.validateJson()}>
              Validate
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderDocsTab() {
    const manPage = getJqManPage();
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
              placeholder="jq '.' data.json"
              onInput={() => {}}
              ref={(el) => { if (el) (el as HTMLInputElement).dataset.rawCommand = (el as HTMLInputElement).value; }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={(e) => {
              const input = (e.target as HTMLElement).closest('.cli-card')?.querySelector('input');
              if (input) this.executeRawCmd((input as HTMLInputElement).value);
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
            <span>📋</span> jq GUI
            <span class="text-sm font-normal text-text2">v{this.version}</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for jq - Command-line JSON processor</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'filter' && this.renderFilterTab()}
          {this.activeTab === 'presets' && this.renderPresetsTab()}
          {this.activeTab === 'json' && this.renderJsonTab()}
          {this.activeTab === 'docs' && this.renderDocsTab()}
          {this.activeTab === 'raw' && this.renderRawTab()}
        </div>
      </div>
    );
  }
}
