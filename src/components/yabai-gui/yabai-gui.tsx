import { Component, h, Event, EventEmitter, Prop, State } from '@stencil/core';
import { type CommandStatus, yabai, type CommandResult, executeCommand, SIGNAL_EVENTS } from '../../yabai/yabai-service';

@Component({
  tag: 'yabai-gui',
  styleUrl: 'yabai-gui.css',
  scoped: true,
})
export class YabaiGui {
  @Prop() version = 'v7.1.17';

  @State() activeTab = 'query';
  @State() status: CommandStatus = 'idle';
  @State() lastCommand = 'Ready...';
  @State() output = 'Click any button to execute a command. Output will appear here.';
  @State() statusMessage = 'yabai GUI v1.0';

  // Query form states
  @State() queryFilterType = '';
  @State() queryFilterValue = '';
  @State() queryProps = '';

  // Window form states
  @State() opacityValue = 1;
  @State() winDisplay = 'prev';
  @State() winSpace = 'prev';
  @State() deminimizeId = '';
  @State() gridVal = '';
  @State() insertDir = 'north';
  @State() scratchpadLabel = '';

  // Space form states
  @State() spaceToDisplay = 'prev';
  @State() spaceLabel = '';
  @State() createOnDisplay = '';
  @State() paddingVal = '';
  @State() paddingType = 'abs';
  @State() gapVal = '';
  @State() gapType = 'abs';

  // Display form states
  @State() sendSpaceSel = 'focused';
  @State() sendToDisplay = 'prev';
  @State() labelDisplay = 'focused';
  @State() displayLabelVal = '';

  // Rule form states
  @State() ruleIndex = '';
  @State() ruleLabel = '';
  @State() ruleApp = '';
  @State() ruleAppNeg = false;
  @State() ruleTitle = '';
  @State() ruleTitleNeg = false;
  @State() ruleManage = '';
  @State() ruleSticky = '';
  @State() ruleLayer = '';
  @State() ruleOpacity = '';
  @State() ruleGrid = '';
  @State() ruleScratchpad = '';
  @State() ruleOneShot = false;
  @State() rulePreview = 'yabai -m rule --add';

  // Signal form states
  @State() signalIndex = '';
  @State() signalEvent = '';
  @State() signalLabel = '';
  @State() signalApp = '';
  @State() signalAppNeg = false;
  @State() signalTitle = '';
  @State() signalTitleNeg = false;
  @State() signalAction = '';
  @State() signalPreview = 'yabai -m signal --add event=';

  // Raw command
  @State() rawCommand = '';

  @Event() commandExecuted: EventEmitter<CommandResult>;

  private tabs = [
    { id: 'query', label: 'Query' },
    { id: 'windows', label: 'Windows' },
    { id: 'spaces', label: 'Spaces' },
    { id: 'displays', label: 'Displays' },
    { id: 'config', label: 'Config' },
    { id: 'rules', label: 'Rules' },
    { id: 'signals', label: 'Signals' },
    { id: 'service', label: 'Service' },
    { id: 'raw', label: 'Raw' },
  ];

  async executeCmd(cmd: string, showConfirm = false): Promise<void> {
    if (showConfirm && !confirm(`Execute: ${cmd}?`)) return;

    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      // Execute through the yabai service
      const result = await executeCommand(cmd);

      this.output = result.stdout || JSON.stringify(result, null, 2);
      this.status = 'success';
      this.statusMessage = 'Completed';
      this.commandExecuted.emit({ stdout: this.output, exitCode: result.exitCode });
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // Query methods
  async runQuery(type: string): Promise<void> {
    let cmd = `yabai -m query --${type}`;
    if (this.queryFilterType && this.queryFilterValue) {
      cmd += ` --${this.queryFilterType} ${this.queryFilterValue}`;
    }
    if (this.queryProps) {
      cmd += ` ${this.queryProps}`;
    }
    await this.executeCmd(cmd);
  }

  async refreshAll(): Promise<void> {
    try {
      const displays = await yabai.query('displays');
      const spaces = await yabai.query('spaces');
      const windows = await yabai.query('windows');

      this.output = `Displays:\n${displays.stdout}\n\nSpaces:\n${spaces.stdout}\n\nWindows:\n${windows.stdout}`;
      this.statusMessage = 'Refreshed';
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
    }
  }

  clearOutput(): void {
    this.output = '';
    this.lastCommand = 'Ready...';
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output);
    this.statusMessage = 'Copied to clipboard';
    setTimeout(() => (this.statusMessage = 'yabai GUI v1.0'), 2000);
  }

  // Window commands
  async windowCmd(args: string): Promise<void> {
    await this.executeCmd(`yabai -m window ${args}`);
  }

  // Space commands
  async spaceCmd(args: string): Promise<void> {
    await this.executeCmd(`yabai -m space ${args}`);
  }

  // Display commands
  async displayCmd(args: string): Promise<void> {
    await this.executeCmd(`yabai -m display ${args}`);
  }

// Config commands
  async setConfig(key: string, value: string): Promise<void> {
    if (!value) return;
    await this.executeCmd(`yabai -m config ${key} ${value}`);
  }

  // Rule methods
  updateRulePreview(): void {
    const parts = ['yabai -m rule --add'];

    if (this.ruleLabel) parts.push(`label=${this.ruleLabel}`);
    if (this.ruleApp) parts.push(`app${this.ruleAppNeg ? '!' : ''}=${this.ruleApp}`);
    if (this.ruleTitle) parts.push(`title${this.ruleTitleNeg ? '!' : ''}=${this.ruleTitle}`);
    if (this.ruleManage) parts.push(`manage=${this.ruleManage}`);
    if (this.ruleSticky) parts.push(`sticky=${this.ruleSticky}`);
    if (this.ruleLayer) parts.push(`sub-layer=${this.ruleLayer}`);
    if (this.ruleOpacity) parts.push(`opacity=${this.ruleOpacity}`);
    if (this.ruleGrid) parts.push(`grid=${this.ruleGrid}`);
    if (this.ruleScratchpad) parts.push(`scratchpad=${this.ruleScratchpad}`);
    if (this.ruleOneShot) parts.push('--one-shot');

    this.rulePreview = parts.join(' ');
  }

  async addRule(): Promise<void> {
    this.updateRulePreview();
    await this.executeCmd(this.rulePreview);
  }

  // Signal methods
  updateSignalPreview(): void {
    const parts = ['yabai -m signal --add'];

    if (this.signalEvent) parts.push(`event=${this.signalEvent}`);
    if (this.signalLabel) parts.push(`label=${this.signalLabel}`);
    if (this.signalApp) parts.push(`app${this.signalAppNeg ? '!' : ''}=${this.signalApp}`);
    if (this.signalTitle) parts.push(`title${this.signalTitleNeg ? '!' : ''}=${this.signalTitle}`);
    if (this.signalAction) parts.push(`action="${this.signalAction}"`);

    this.signalPreview = parts.join(' ');
  }

  async addSignal(): Promise<void> {
    this.updateSignalPreview();
    await this.executeCmd(this.signalPreview);
  }

  renderTabs(): Element[] {
    return this.tabs.map(tab => (
      <button key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => this.switchTab(tab.id)}>
        {tab.label}
      </button>
    ));
  }

  renderQueryTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Quick Queries
            <span class="cli-badge-safe">Safe</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-success" onClick={() => this.runQuery('displays')}>
              Query Displays
            </button>
            <button class="cli-btn cli-btn-success" onClick={() => this.runQuery('spaces')}>
              Query Spaces
            </button>
            <button class="cli-btn cli-btn-success" onClick={() => this.runQuery('windows')}>
              Query Windows
            </button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm min-w-[100px]">Filter by:</label>
            <select class="cli-select" onChange={(e: Event) => (this.queryFilterType = (e.target as HTMLSelectElement).value)}>
              <option value="" selected={this.queryFilterType === ''}>
                None
              </option>
              <option value="display" selected={this.queryFilterType === 'display'}>
                Display
              </option>
              <option value="space" selected={this.queryFilterType === 'space'}>
                Space
              </option>
              <option value="window" selected={this.queryFilterType === 'window'}>
                Window
              </option>
            </select>
            <input
              type="text"
              class="cli-input"
              placeholder="selector (e.g., 1, prev, focused)"
              value={this.queryFilterValue}
              onInput={(e: Event) => (this.queryFilterValue = (e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm min-w-[100px]">Properties:</label>
            <input
              type="text"
              class="cli-input"
              placeholder="comma-separated fields (optional)"
              value={this.queryProps}
              onInput={(e: Event) => (this.queryProps = (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Live Status</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-sm" onClick={() => this.refreshAll()}>
              Refresh All
            </button>
            <button class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

renderWindowsTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Focus & Navigation</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.windowCmd('--focus prev')}>← Prev</button>
            <button class="cli-btn" onClick={() => this.windowCmd('--focus next')}>Next →</button>
            <button class="cli-btn" onClick={() => this.windowCmd('--focus recent')}>Recent</button>
            <button class="cli-btn" onClick={() => this.windowCmd('--focus mouse')}>Under Mouse</button>
          </div>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus stack.prev')}>Stack ↑</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus stack.next')}>Stack ↓</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus largest')}>Largest</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus smallest')}>Smallest</button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Window Actions</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-warning" onClick={() => this.windowCmd('--close')}>Close</button>
            <button class="cli-btn" onClick={() => this.windowCmd('--minimize')}>Minimize</button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Deminimize ID:</label>
            <input type="text" class="cli-input" placeholder="window id" value={this.deminimizeId}
              onInput={(e: Event) => (this.deminimizeId = (e.target as HTMLInputElement).value)} />
            <button class="cli-btn cli-btn-sm" onClick={() => this.executeCmd(`yabai -m window --deminimize ${this.deminimizeId}`)}>Restore</button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Move & Swap</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.windowCmd('--swap prev')}>Swap ←</button>
            <button class="cli-btn" onClick={() => this.windowCmd('--swap next')}>Swap →</button>
            <button class="cli-btn" onClick={() => this.windowCmd('--swap largest')}>Swap Largest</button>
          </div>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--warp prev')}>Warp ←</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--warp next')}>Warp →</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--stack prev')}>Stack on ←</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--stack next')}>Stack on →</button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Send To
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Display:</label>
            <select class="cli-select" onChange={(e: Event) => (this.winDisplay = (e.target as HTMLSelectElement).value)}>
              <option value="prev">Prev</option>
              <option value="next">Next</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--display ${this.winDisplay}`)}>Send</button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Space:</label>
            <select class="cli-select" onChange={(e: Event) => (this.winSpace = (e.target as HTMLSelectElement).value)}>
              <option value="prev">Prev</option>
              <option value="next">Next</option>
              <option value="recent">Recent</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--space ${this.winSpace}`)}>Send</button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Toggles
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle float')}>Float</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle sticky')}>Sticky</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle pip')}>PiP</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle shadow')}>Shadow</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle split')}>Split</button>
          </div>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle zoom-parent')}>Zoom Parent</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle zoom-fullscreen')}>Zoom FS</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle native-fullscreen')}>Native FS</button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Advanced
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Grid:</label>
            <input type="text" class="cli-input" style="width: 120px" placeholder="r:c:x:y:w:h" value={this.gridVal}
              onInput={(e: Event) => (this.gridVal = (e.target as HTMLInputElement).value)} />
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--grid ${this.gridVal}`)}>Apply</button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Insert:</label>
            <select class="cli-select" onChange={(e: Event) => (this.insertDir = (e.target as HTMLSelectElement).value)}>
              <option value="north">North</option>
              <option value="east">East</option>
              <option value="south">South</option>
              <option value="west">West</option>
              <option value="stack">Stack</option>
            </select>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--insert ${this.insertDir}`)}>Set</button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Opacity:</label>
            <input type="range" min="0" max="1" step="0.1" value={this.opacityValue}
              onInput={(e: Event) => (this.opacityValue = parseFloat((e.target as HTMLInputElement).value))} class="cli-input flex-1" />
            <span class="text-text2 text-sm">{this.opacityValue.toFixed(1)}</span>
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--opacity ${this.opacityValue}`)}>Set</button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <label class="text-text2 text-sm">Scratchpad:</label>
            <input type="text" class="cli-input" style="width: 80px" placeholder="label" value={this.scratchpadLabel}
              onInput={(e: Event) => (this.scratchpadLabel = (e.target as HTMLInputElement).value)} />
            <button class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--scratchpad ${this.scratchpadLabel}`)}>Assign</button>
            <button class="cli-btn cli-btn-sm" onClick={() => this.executeCmd('yabai -m window --scratchpad recover')}>Recover</button>
          </div>
        </div>
      </div>
    );
  }

  renderSpacesTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Focus & Navigation
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.spaceCmd('--focus prev')}>
              ← Prev
            </button>
            <button class="cli-btn" onClick={() => this.spaceCmd('--focus next')}>
              Next →
            </button>
            <button class="cli-btn" onClick={() => this.spaceCmd('--focus recent')}>
              Recent
            </button>
            <button class="cli-btn" onClick={() => this.spaceCmd('--focus 1')}>
              Space 1
            </button>
            <button class="cli-btn" onClick={() => this.spaceCmd('--focus 2')}>
              Space 2
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Layout</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.spaceCmd('--layout bsp')}>
              BSP
            </button>
            <button class="cli-btn" onClick={() => this.spaceCmd('--layout stack')}>
              Stack
            </button>
            <button class="cli-btn" onClick={() => this.spaceCmd('--layout float')}>
              Float
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Management</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-success" onClick={() => this.spaceCmd('--create')}>
              Create
            </button>
            <button class="cli-btn cli-btn-danger" onClick={() => this.executeCmd('yabai -m space --destroy', true)}>
              Destroy
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderDisplaysTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Focus Display
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.displayCmd('--focus prev')}>
              ← Prev
            </button>
            <button class="cli-btn" onClick={() => this.displayCmd('--focus next')}>
              Next →
            </button>
            <button class="cli-btn" onClick={() => this.displayCmd('--focus 1')}>
              Display 1
            </button>
            <button class="cli-btn" onClick={() => this.displayCmd('--focus 2')}>
              Display 2
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderConfigTab(): Element {
    const configs = [
      { key: 'mouse_follows_focus', label: 'Mouse follows focus', options: ['', 'on', 'off'] },
      { key: 'focus_follows_mouse', label: 'Focus follows mouse', options: ['', 'autofocus', 'autoraise', 'off'] },
      { key: 'layout', label: 'Default Layout', options: ['', 'bsp', 'stack', 'float'] },
    ];

    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Global Settings
            <span class="cli-badge-sip">SIP</span>
          </h3>
          {configs.map(cfg => (
            <div class="flex items-center gap-2 my-2" key={cfg.key}>
              <span class="text-text2 text-sm flex-1">{cfg.label}:</span>
              <select class="cli-select" onChange={(e: Event) => this.setConfig(cfg.key, (e.target as HTMLSelectElement).value)}>
                {cfg.options.map(opt => (
                  <option value={opt}>{opt || '-'}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderRulesTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Rule Management</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.executeCmd('yabai -m rule --list')}>
              List Rules
            </button>
            <button class="cli-btn cli-btn-warning" onClick={() => this.executeCmd('yabai -m rule --apply')}>
              Apply All
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderSignalsTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Signal Management</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.executeCmd('yabai -m signal --list')}>
              List Signals
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderServiceTab(): Element {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Service Control</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn cli-btn-success" onClick={() => this.executeCmd('yabai --start-service')}>
              Start
            </button>
            <button class="cli-btn cli-btn-warning" onClick={() => this.executeCmd('yabai --stop-service')}>
              Stop
            </button>
            <button class="cli-btn" onClick={() => this.executeCmd('yabai --restart-service')}>
              Restart
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Scripting Addition
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <p class="text-text2 text-xs mb-2">System Integrity Protection must be partially disabled.</p>
          <div class="flex flex-wrap gap-2 my-2">
            <button class="cli-btn" onClick={() => this.executeCmd('yabai --load-sa')}>
              Load SA
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderRawTab(): Element {
    return (
      <div class="cli-card">
        <h3 class="text-text2 text-base mb-2">Raw Command</h3>
        <input
          type="text"
          class="cli-input w-full mb-2"
          placeholder="Enter full yabai command..."
          value={this.rawCommand}
          onInput={(e: Event) => (this.rawCommand = (e.target as HTMLInputElement).value)}
        />
        <div class="flex gap-2 items-center">
          <button class="cli-btn cli-btn-success" onClick={() => this.executeCmd(this.rawCommand)}>
            Execute
          </button>
          <button class="cli-btn" onClick={() => (this.rawCommand = '')}>
            Clear
          </button>
          <span class="text-text2 text-xs">Be careful with destructive commands</span>
        </div>

        <h4 class="mt-4 mb-2 text-text2 text-sm">Quick Templates</h4>
        <div class="flex flex-wrap gap-2">
          {['yabai -m window --focus ', 'yabai -m space --focus ', 'yabai -m config '].map(template => (
            <button key={template} class="cli-btn cli-btn-sm" onClick={() => (this.rawCommand = template)}>
              {template.replace('yabai -m ', '')}
            </button>
          ))}
        </div>
      </div>
    );
  }

  renderOutputPanel(): Element {
    return (
      <div class="cli-card mt-5">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-text2 text-base m-0">Output</h3>
          <div class="flex gap-2">
            <button class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderActiveContent(): Element {
    switch (this.activeTab) {
      case 'query':
        return this.renderQueryTab();
      case 'windows':
        return this.renderWindowsTab();
      case 'spaces':
        return this.renderSpacesTab();
      case 'displays':
        return this.renderDisplaysTab();
      case 'config':
        return this.renderConfigTab();
      case 'rules':
        return this.renderRulesTab();
      case 'signals':
        return this.renderSignalsTab();
      case 'service':
        return this.renderServiceTab();
      case 'raw':
        return this.renderRawTab();
      default:
        return this.renderQueryTab();
    }
  }

  render() {
    return (
      <div class="pb-16">
        <h1 class="text-3xl mb-5">
          yabai GUI <span class="text-text2 text-lg">{this.version}</span>
        </h1>

        <div class="flex flex-wrap gap-1 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">{this.renderActiveContent()}</div>

        {this.renderOutputPanel()}

        <div class="fixed bottom-0 left-0 right-0 bg-bg2 px-5 py-2.5 border-t border-bg3 flex justify-between items-center text-xs z-10">
          <span>{this.statusMessage}</span>
          <span class="text-text2">
            <span class="cli-badge-sip">SIP</span> = Requires SIP partially disabled
          </span>
        </div>
      </div>
    );
  }
}
