import { Component, h, State, Event, type EventEmitter } from '@stencil/core';
import {
  executeCommand,
  SED_PRESETS,
  type SedCommand,
  type AddressType,
  type CommandResult,
} from '../../sed/sed-service';

const SAMPLE_TEXT = `Hello World
This is a test line with numbers 123
Another line with data 456 and 789
  Line with leading spaces
Line with trailing spaces   
UPPERCASE LINE
lowercase line
<p>Some HTML</p>
The END
`;

const TAB_DEFINITIONS = [
  { id: 'builder', label: 'Script Builder' },
  { id: 'presets', label: 'Presets' },
  { id: 'text', label: 'Text Input' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'raw', label: 'Raw' },
];

const SED_COMMANDS: { value: SedCommand; label: string; description: string }[] = [
  { value: 'substitute', label: 'Substitute (s)', description: 'Replace pattern with replacement' },
  { value: 'delete', label: 'Delete (d)', description: 'Delete matching lines' },
  { value: 'print', label: 'Print (p)', description: 'Print matching lines' },
  { value: 'append', label: 'Append (a)', description: 'Append text after matching lines' },
  { value: 'insert', label: 'Insert (i)', description: 'Insert text before matching lines' },
  { value: 'change', label: 'Change (c)', description: 'Replace entire matching lines' },
  { value: 'transform', label: 'Transform (y)', description: 'Transform characters' },
  { value: 'read', label: 'Read (r)', description: 'Read file after matching lines' },
  { value: 'write', label: 'Write (w)', description: 'Write matching lines to file' },
  { value: 'quit', label: 'Quit (q)', description: 'Quit after matching line' },
  { value: 'next', label: 'Next (n)', description: 'Read next line into pattern space' },
  { value: 'hold', label: 'Hold (h)', description: 'Copy pattern space to hold space' },
  { value: 'exchange', label: 'Exchange (x)', description: 'Exchange pattern and hold space' },
];

const ADDRESS_TYPES: { value: AddressType; label: string; description: string }[] = [
  { value: 'none', label: 'All Lines', description: 'Apply to all lines' },
  { value: 'line', label: 'Line Number', description: 'Apply to specific line number' },
  { value: 'range', label: 'Line Range', description: 'Apply to range of lines (e.g., 1,10)' },
  { value: 'regex', label: 'Regex Pattern', description: 'Apply to lines matching pattern' },
  { value: 'last', label: 'Last Line ($)', description: 'Apply to last line only' },
];

const SED_FLAGS = [
  { value: 'g', label: 'Global (g)', description: 'Replace all occurrences on line' },
  { value: 'i', label: 'Case-Insensitive (i)', description: 'Ignore case in pattern' },
  { value: 'p', label: 'Print (p)', description: 'Print pattern space after substitution' },
  { value: 'n', label: 'Next (n)', description: 'Read next line immediately' },
];

type CommandStatus = 'idle' | 'running' | 'success' | 'error';

interface CommandSegment {
  type: 'binary' | 'option' | 'script' | 'file';
  value: string;
  description: string;
  tooltip?: string;
}

@Component({
  tag: 'sed-gui',
  styleUrl: 'sed-gui.css',
  scoped: true,
})
export class SedGui {
  @State() activeTab = 'builder';
  @State() status: CommandStatus = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Click any button to execute a sed command.';
  @State() statusMessage = 'Ready — using mock sed bridge';

  // Script builder state
  @State() selectedCommand: SedCommand = 'substitute';
  @State() addressType: AddressType = 'none';
  @State() addressValue = '';
  @State() addressEndValue = '';
  @State() pattern = '';
  @State() replacement = '';
  @State() flags: string[] = [];
  @State() text = '';
  @State() file = '';
  @State() label = '';

  // Options state
  @State() quiet = false;
  @State() extendedRegex = false;
  @State() inPlace = false;
  @State() inPlaceSuffix = '';
  @State() separate = false;
  @State() unbuffered = false;
  @State() nullData = false;

  // Text input
  @State() textInput = SAMPLE_TEXT;

  // Raw command
  @State() rawCommand = '';

  // Command preview segments
  @State() commandSegments: CommandSegment[] = [];
  @State() highlightedSegmentIndex = -1;

  // Presets
  @State() selectedPreset = 0;

  @Event() commandExecuted: EventEmitter<CommandResult>;

  private setTemporaryStatus(message: string, resetTo = 'Ready — using mock sed bridge'): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  private updateCommandSegments(): void {
    this.commandSegments = this.buildCommandSegments();
  }

  private buildCommandSegments(): CommandSegment[] {
    const segments: CommandSegment[] = [];

    // Binary
    segments.push({
      type: 'binary',
      value: 'sed',
      description: 'sed binary',
      tooltip: 'GNU sed stream editor',
    });

    // Options
    if (this.quiet) {
      segments.push({
        type: 'option',
        value: '-n',
        description: 'quiet mode',
        tooltip: 'Suppress automatic printing of pattern space',
      });
    }
    if (this.extendedRegex) {
      segments.push({
        type: 'option',
        value: '-E',
        description: 'extended regex',
        tooltip: 'Use extended regular expressions in the script',
      });
    }
    if (this.inPlace) {
      const value = this.inPlaceSuffix ? `-i${this.inPlaceSuffix}` : '-i';
      segments.push({
        type: 'option',
        value,
        description: 'in-place edit',
        tooltip: 'Edit files in place (makes backup if suffix supplied)',
      });
    }
    if (this.separate) {
      segments.push({
        type: 'option',
        value: '-s',
        description: 'separate files',
        tooltip: 'Consider files as separate rather than continuous',
      });
    }
    if (this.unbuffered) {
      segments.push({
        type: 'option',
        value: '-u',
        description: 'unbuffered',
        tooltip: 'Load minimal amounts of data and flush output buffers',
      });
    }
    if (this.nullData) {
      segments.push({
        type: 'option',
        value: '-z',
        description: 'null data',
        tooltip: 'Separate lines by NUL characters',
      });
    }

    // Script
    const script = this.buildScriptFromBuilder();
    if (script) {
      segments.push({
        type: 'script',
        value: `-e '${script}'`,
        description: 'sed script',
        tooltip: this.getScriptDescription(),
      });
    }

    return segments;
  }

  private getScriptDescription(): string {
    const cmd = SED_COMMANDS.find(c => c.value === this.selectedCommand);
    return cmd?.description || 'sed command script';
  }

  private buildScriptFromBuilder(): string {
    let addr = '';
    switch (this.addressType) {
      case 'line':
        addr = this.addressValue;
        break;
      case 'range':
        addr = this.addressValue && this.addressEndValue
          ? `${this.addressValue},${this.addressEndValue}`
          : this.addressValue;
        break;
      case 'regex':
        addr = this.addressValue ? `/${this.addressValue}/` : '';
        break;
      case 'last':
        addr = '$';
        break;
    }

    switch (this.selectedCommand) {
      case 'substitute':
        return `${addr}s/${this.escapeDelim(this.pattern)}/${this.escapeDelim(this.replacement)}/${this.flags.join('')}`;
      case 'delete':
        return `${addr}d`;
      case 'print':
        return `${addr}p`;
      case 'append':
        return `${addr}a\\\n${this.text}`;
      case 'insert':
        return `${addr}i\\\n${this.text}`;
      case 'change':
        return `${addr}c\\\n${this.text}`;
      case 'transform':
        return `${addr}y/${this.pattern}/${this.replacement}/`;
      case 'read':
        return `${addr}r ${this.file}`;
      case 'write':
        return `${addr}w ${this.file}`;
      case 'quit':
        return `${addr}q`;
      case 'next':
        return `${addr}n`;
      case 'hold':
        return `${addr}h`;
      case 'exchange':
        return `${addr}x`;
      default:
        return '';
    }
  }

  private escapeDelim(str: string): string {
    return str.replace(/\//g, '\\/');
  }

  // Build command preview string (used internally)
  // private getCommandPreview(): string { ... }

  private async executeScript(script: string, isPreview = false): Promise<void> {
    const opts: string[] = [];
    if (this.quiet) opts.push('-n');
    if (this.extendedRegex) opts.push('-E');

    let cmd: string;
    if (isPreview) {
      // Escape single quotes in input for echo command
      const escapedInput = this.textInput.replace(/'/g, "'\"'\"'");
      cmd = `printf '%s' '${escapedInput}' | sed ${opts.join(' ')} -e '${script}'`;
    } else {
      cmd = `sed ${opts.join(' ')} -e '${script}'`;
    }

    this.lastCommand = cmd;
    this.status = 'running';
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      const result = await executeCommand(cmd);
      this.output = result.stdout || result.stderr || 'No output';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
      this.commandExecuted.emit(result);
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async executeRaw(): Promise<void> {
    if (!this.rawCommand.trim()) {
      this.setTemporaryStatus('Enter a command first');
      return;
    }

    this.status = 'running';
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      const result = await executeCommand(this.rawCommand);
      this.output = result.stdout || result.stderr || 'No output';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
      this.commandExecuted.emit(result);
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private clearOutput(): void {
    this.output = 'Click any button to execute a sed command.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready — using mock sed bridge';
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied output to clipboard');
  }

  private applyPreset(index: number): void {
    const preset = SED_PRESETS[index];
    if (!preset) return;

    this.selectedPreset = index;
    // Parse the preset script to set appropriate state
    const script = preset.script;

    if (script.includes("s/")) {
      this.selectedCommand = 'substitute';
      const match = script.match(/s\/(.+?)\/(.+?)\/([gimnp]*)?/);
      if (match) {
        this.pattern = match[1] || '';
        this.replacement = match[2] || '';
        this.flags = match[3] ? match[3].split('') : [];
      }
    } else if (script.includes("y/")) {
      this.selectedCommand = 'transform';
      const match = script.match(/y\/(.+?)\/(.+?)\//);
      if (match) {
        this.pattern = match[1] || '';
        this.replacement = match[2] || '';
      }
    } else if (script.includes("/d")) {
      this.selectedCommand = 'delete';
      const match = script.match(/^\/?(.+?)\/d$/);
      if (match) {
        this.addressType = 'regex';
        this.addressValue = match[1];
      }
    } else if (script.includes("p")) {
      this.selectedCommand = 'print';
    }

    this.updateCommandSegments();
  }

  private renderTabs() {
    return (
      <div class="cli-tabs-container">
        {TAB_DEFINITIONS.map(tab => (
          <button
            type="button"
            key={tab.id}
            class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
              this.updateCommandSegments();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  private renderCommandPreview() {
    const segments = this.commandSegments.length > 0 ? this.commandSegments : this.buildCommandSegments();

    return (
      <div class="cli-card mt-4">
        <h4 class="text-text2 text-sm mb-2">Command Preview (hover segments for details)</h4>
        <div class="cli-cmd-preview flex flex-wrap gap-1">
          {segments.map((segment, index) => (
            <span
              key={index}
              class={`command-segment segment-${segment.type} ${this.highlightedSegmentIndex === index ? 'segment-highlighted' : ''}`}
              title={segment.tooltip}
              onMouseEnter={() => this.highlightedSegmentIndex = index}
              onMouseLeave={() => this.highlightedSegmentIndex = -1}
            >
              {segment.value}
            </span>
          ))}
        </div>
      </div>
    );
  }

  private renderOptionsPanel() {
    return (
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={this.quiet}
            onChange={(e) => {
              this.quiet = (e.target as HTMLInputElement).checked;
              this.updateCommandSegments();
            }}
          />
          Quiet (-n)
        </label>
        <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={this.extendedRegex}
            onChange={(e) => {
              this.extendedRegex = (e.target as HTMLInputElement).checked;
              this.updateCommandSegments();
            }}
          />
          Extended Regex (-E)
        </label>
        <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={this.inPlace}
            onChange={(e) => {
              this.inPlace = (e.target as HTMLInputElement).checked;
              this.updateCommandSegments();
            }}
          />
          In-Place Edit (-i)
        </label>
        {this.inPlace && (
          <input
            type="text"
            class="cli-input w-full"
            placeholder="backup suffix (optional)"
            value={this.inPlaceSuffix}
            onInput={(e) => {
              this.inPlaceSuffix = (e.target as HTMLInputElement).value;
              this.updateCommandSegments();
            }}
          />
        )}
        <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={this.separate}
            onChange={(e) => {
              this.separate = (e.target as HTMLInputElement).checked;
              this.updateCommandSegments();
            }}
          />
          Separate Files (-s)
        </label>
        <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={this.unbuffered}
            onChange={(e) => {
              this.unbuffered = (e.target as HTMLInputElement).checked;
              this.updateCommandSegments();
            }}
          />
          Unbuffered (-u)
        </label>
        <label class="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={this.nullData}
            onChange={(e) => {
              this.nullData = (e.target as HTMLInputElement).checked;
              this.updateCommandSegments();
            }}
          />
          Null Data (-z)
        </label>
      </div>
    );
  }

  private renderBuilderTab() {
    const currentCommand = SED_COMMANDS.find(c => c.value === this.selectedCommand);

    return (
      <div class="space-y-4">
        {this.renderOptionsPanel()}

        <div class="cli-card">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Command Type
                <select
                  class="cli-select"
                  onChange={(e) => {
                    this.selectedCommand = (e.target as HTMLSelectElement).value as SedCommand;
                    this.updateCommandSegments();
                  }}
                >
                  {SED_COMMANDS.map(cmd => (
                    <option value={cmd.value} key={cmd.value}>
                      {cmd.label}
                    </option>
                  ))}
                </select>
              </label>
              {currentCommand && (
                <p class="text-xs text-text2 mt-1">{currentCommand.description}</p>
              )}
            </div>

            <div>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Address Type
                <select
                  class="cli-select"
                  onChange={(e) => {
                    this.addressType = (e.target as HTMLSelectElement).value as AddressType;
                    this.updateCommandSegments();
                  }}
                >
                  {ADDRESS_TYPES.map(type => (
                    <option value={type.value} key={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {this.addressType === 'line' && (
            <div class="mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Line Number
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., 5"
                  value={this.addressValue}
                  onInput={(e) => {
                    this.addressValue = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {this.addressType === 'range' && (
            <div class="grid grid-cols-2 gap-4 mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Start Line
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., 1 or $"
                  value={this.addressValue}
                  onInput={(e) => {
                    this.addressValue = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                End Line
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., 10 or $"
                  value={this.addressEndValue}
                  onInput={(e) => {
                    this.addressEndValue = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {this.addressType === 'regex' && (
            <div class="mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Regex Pattern (without slashes)
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., pattern or ^start"
                  value={this.addressValue}
                  onInput={(e) => {
                    this.addressValue = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {(this.selectedCommand === 'substitute') && (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Pattern to Find
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., old or regex"
                  value={this.pattern}
                  onInput={(e) => {
                    this.pattern = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Replacement
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., new"
                  value={this.replacement}
                  onInput={(e) => {
                    this.replacement = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {(this.selectedCommand === 'transform') && (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Characters to Replace
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., abc"
                  value={this.pattern}
                  onInput={(e) => {
                    this.pattern = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-text2">
                Replacement Characters
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., XYZ"
                  value={this.replacement}
                  onInput={(e) => {
                    this.replacement = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {(this.selectedCommand === 'append' || this.selectedCommand === 'insert' || this.selectedCommand === 'change') && (
            <div class="mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                Text to Add
                <textarea
                  class="cli-input w-full font-mono"
                  rows={3}
                  placeholder="Enter text here..."
                  value={this.text}
                  onInput={(e) => {
                    this.text = (e.target as HTMLTextAreaElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {(this.selectedCommand === 'read' || this.selectedCommand === 'write') && (
            <div class="mt-4">
              <label class="flex flex-col gap-1 text-sm text-text2">
                File Path
                <input
                  type="text"
                  class="cli-input w-full"
                  placeholder="e.g., /path/to/file"
                  value={this.file}
                  onInput={(e) => {
                    this.file = (e.target as HTMLInputElement).value;
                    this.updateCommandSegments();
                  }}
                />
              </label>
            </div>
          )}

          {this.selectedCommand === 'substitute' && (
            <div class="mt-4">
              <span class="text-sm text-text2">Flags:</span>
              <div class="flex flex-wrap gap-3 mt-2">
                {SED_FLAGS.map(flag => (
                  <label class="flex items-center gap-1 text-sm text-text2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={this.flags.includes(flag.value)}
                      onChange={(e) => {
                        if ((e.target as HTMLInputElement).checked) {
                          this.flags = [...this.flags, flag.value];
                        } else {
                          this.flags = this.flags.filter(f => f !== flag.value);
                        }
                        this.updateCommandSegments();
                      }}
                    />
                    {flag.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div class="flex flex-wrap gap-2 mt-6">
            <cli-button
              variant="success"
              tooltip="Execute sed on sample text"
              onCliClick={() => this.executeScript(this.buildScriptFromBuilder(), true)}
            >
              Execute on Sample
            </cli-button>
            <cli-button
              tooltip="Clear output"
              onCliClick={() => this.clearOutput()}
            >
              Clear
            </cli-button>
          </div>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  private renderPresetsTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SED_PRESETS.map((preset, index) => (
          <cli-card
            key={index}
            cardTitle={preset.name}
            variant={this.selectedPreset === index ? 'accent' : 'default'}
            clickable
            onClick={() => this.applyPreset(index)}
          >
            <p class="text-sm text-text2 mb-2">{preset.description}</p>
            <code class="text-xs bg-bg3 p-1 rounded">{preset.script}</code>
            <div class="mt-3">
              <cli-button
                size="sm"
                variant="success"
                onCliClick={() => {
                  this.applyPreset(index);
                  this.executeScript(preset.script.replace(/^-n /, ''), preset.script.startsWith('-n'));
                }}
              >
                Run Preset
              </cli-button>
            </div>
          </cli-card>
        ))}
      </div>
    );
  }

  private renderTextTab() {
    return (
      <div class="cli-card">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-text2 text-base">Sample Text Input</h3>
          <div class="flex gap-2">
            <cli-button
              size="sm"
              onCliClick={() => this.textInput = SAMPLE_TEXT}
            >
              Reset Sample
            </cli-button>
            <cli-button
              size="sm"
              onCliClick={() => this.textInput = ''}
            >
              Clear
            </cli-button>
          </div>
        </div>
        <textarea
          class="cli-input w-full font-mono"
          rows={15}
          value={this.textInput}
          onInput={(e) => this.textInput = (e.target as HTMLTextAreaElement).value}
          placeholder="Enter your text here..."
        />
      </div>
    );
  }

  private renderDocumentationTab() {
    return (
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <cli-card cardTitle="Sed Commands">
          <div class="space-y-3">
            <div>
              <code class="text-accent font-bold">s/pattern/replacement/flags</code>
              <p class="text-sm text-text2 mt-1">Substitute pattern with replacement. Flags: g (global), i (ignore case), p (print), n (next).</p>
            </div>
            <div>
              <code class="text-accent font-bold">d</code>
              <p class="text-sm text-text2 mt-1">Delete the pattern space (current line).</p>
            </div>
            <div>
              <code class="text-accent font-bold">p</code>
              <p class="text-sm text-text2 mt-1">Print the pattern space.</p>
            </div>
            <div>
              <code class="text-accent font-bold">y/set1/set2/</code>
              <p class="text-sm text-text2 mt-1">Transform characters in set1 to corresponding characters in set2.</p>
            </div>
            <div>
              <code class="text-accent font-bold">a\ text</code>
              <p class="text-sm text-text2 mt-1">Append text after current line.</p>
            </div>
            <div>
              <code class="text-accent font-bold">i\ text</code>
              <p class="text-sm text-text2 mt-1">Insert text before current line.</p>
            </div>
            <div>
              <code class="text-accent font-bold">c\ text</code>
              <p class="text-sm text-text2 mt-1">Change/replace current line with text.</p>
            </div>
          </div>
        </cli-card>

        <cli-card cardTitle="Address Types">
          <div class="space-y-3">
            <div>
              <code class="text-accent font-bold">n</code>
              <p class="text-sm text-text2 mt-1">Line number n (e.g., 5 applies to line 5)</p>
            </div>
            <div>
              <code class="text-accent font-bold">$</code>
              <p class="text-sm text-text2 mt-1">Last line</p>
            </div>
            <div>
              <code class="text-accent font-bold">/regex/</code>
              <p class="text-sm text-text2 mt-1">Lines matching regular expression</p>
            </div>
            <div>
              <code class="text-accent font-bold">n,m</code>
              <p class="text-sm text-text2 mt-1">Line range from n to m (e.g., 1,10)</p>
            </div>
            <div>
              <code class="text-accent font-bold">/start/,/end/</code>
              <p class="text-sm text-text2 mt-1">Range from line matching /start/ to line matching /end/</p>
            </div>
          </div>
        </cli-card>

        <cli-card cardTitle="Options" class="lg:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <code class="text-accent font-bold">-n, --quiet, --silent</code>
              <p class="text-sm text-text2 mt-1">Suppress automatic printing of pattern space</p>
            </div>
            <div>
              <code class="text-accent font-bold">-E, -r, --regexp-extended</code>
              <p class="text-sm text-text2 mt-1">Use extended regular expressions</p>
            </div>
            <div>
              <code class="text-accent font-bold">-i[SUFFIX]</code>
              <p class="text-sm text-text2 mt-1">Edit files in place (make backup if SUFFIX supplied)</p>
            </div>
            <div>
              <code class="text-accent font-bold">-e script</code>
              <p class="text-sm text-text2 mt-1">Add the script to the commands to be executed</p>
            </div>
            <div>
              <code class="text-accent font-bold">-f script-file</code>
              <p class="text-sm text-text2 mt-1">Add the contents of script-file to commands</p>
            </div>
            <div>
              <code class="text-accent font-bold">-s, --separate</code>
              <p class="text-sm text-text2 mt-1">Consider files as separate rather than continuous</p>
            </div>
          </div>
        </cli-card>

        <cli-card cardTitle="Advanced: Hold Space" class="lg:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <code class="text-accent font-bold">h</code>
              <p class="text-sm text-text2 mt-1">Copy pattern space to hold space</p>
            </div>
            <div>
              <code class="text-accent font-bold">H</code>
              <p class="text-sm text-text2 mt-1">Append pattern space to hold space</p>
            </div>
            <div>
              <code class="text-accent font-bold">g</code>
              <p class="text-sm text-text2 mt-1">Copy hold space to pattern space</p>
            </div>
            <div>
              <code class="text-accent font-bold">G</code>
              <p class="text-sm text-text2 mt-1">Append hold space to pattern space</p>
            </div>
            <div>
              <code class="text-accent font-bold">x</code>
              <p class="text-sm text-text2 mt-1">Exchange contents of pattern and hold spaces</p>
            </div>
          </div>
        </cli-card>
      </div>
    );
  }

  private renderRawTab() {
    return (
      <div class="cli-card">
        <div class="mb-4">
          <label class="flex flex-col gap-1 text-sm text-text2">
            Raw Sed Command
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="e.g., sed -n '5,10p' file.txt"
              value={this.rawCommand}
              onInput={(e) => this.rawCommand = (e.target as HTMLInputElement).value}
            />
          </label>
          <p class="text-xs text-text2 mt-1">Enter the complete sed command as you would in a terminal.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <cli-button
            variant="success"
            onCliClick={() => this.executeRaw()}
          >
            Execute Command
          </cli-button>
          <cli-button
            onCliClick={() => this.rawCommand = ''}
          >
            Clear
          </cli-button>
        </div>
      </div>
    );
  }

  private renderOutputPanel() {
    const statusColors = {
      idle: 'text-text2',
      running: 'text-info',
      success: 'text-success',
      error: 'text-danger',
    };

    return (
      <div class="cli-card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <span class={`font-semibold ${statusColors[this.status]}`}>
              {this.status === 'running' ? '⏳' : this.status === 'success' ? '✓' : this.status === 'error' ? '✗' : '○'}
            </span>
            <span class="text-sm text-text2">{this.statusMessage}</span>
          </div>
          <div class="flex gap-2">
            <cli-button size="sm" onCliClick={() => this.copyOutput()}>
              Copy Output
            </cli-button>
            <cli-button size="sm" variant="warning" onCliClick={() => this.clearOutput()}>
              Clear
            </cli-button>
          </div>
        </div>

        <div class="mb-2">
          <span class="text-xs text-text2">Last command:</span>
          <code class="text-xs bg-bg3 px-2 py-1 rounded ml-2 font-mono">{this.lastCommand}</code>
        </div>

        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  render() {
    return (
      <div class="pb-16">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-3xl">sed GUI</h1>
          <span class="text-sm text-text2">v4.9</span>
        </div>

        {this.renderTabs()}

        <div class="mt-4">
          {this.activeTab === 'builder' && this.renderBuilderTab()}
          {this.activeTab === 'presets' && this.renderPresetsTab()}
          {this.activeTab === 'text' && this.renderTextTab()}
          {this.activeTab === 'documentation' && this.renderDocumentationTab()}
          {this.activeTab === 'raw' && this.renderRawTab()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }
}
