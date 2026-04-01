import { Component, Event, type EventEmitter, h, Prop, State } from '@stencil/core';
import { buildQueryCommand, buildRuleCommand, buildSignalCommand, formatCliValue, type QueryArgumentType, type QueryDomain } from '../../yabai/yabai-command-builders';
import { type CommandResult, type CommandStatus, executeCommand, SIGNAL_EVENTS, yabai } from '../../yabai/yabai-service';

const DEFAULT_OUTPUT = 'Run any yabai command to see mock output from the bridge stub.';
const DEFAULT_STATUS = 'Ready — using mock yabai bridge';
const DISPLAY_SELECTORS = ['prev', 'next', 'first', 'last', 'recent', 'mouse', '1', '2', '3'];
const SPACE_SELECTORS = ['prev', 'next', 'first', 'last', 'recent', 'mouse', '1', '2', '3', '4', '5'];
const TAB_DEFINITIONS = [
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
  @State() output = DEFAULT_OUTPUT;
  @State() statusMessage = DEFAULT_STATUS;

  @State() queryTarget: QueryDomain = 'windows';
  @State() queryArgumentType: QueryArgumentType = '';
  @State() queryArgumentValue = '';
  @State() queryProps = '';

  @State() opacityValue = 1;
  @State() winDisplay = 'prev';
  @State() winSpace = 'prev';
  @State() deminimizeId = '';
  @State() gridVal = '';
  @State() insertDir = 'north';
  @State() scratchpadLabel = '';

  @State() selectedSpace = '';
  @State() spaceFocusTarget = 'next';
  @State() spaceSwitchTarget = 'next';
  @State() spaceMoveTarget = 'next';
  @State() spaceSwapTarget = 'next';
  @State() spaceToDisplay = 'next';
  @State() spaceLabelTarget = '';
  @State() spaceLabel = '';
  @State() createOnDisplay = '';
  @State() paddingVal = '20:20:20:20';
  @State() paddingType = 'abs';
  @State() gapVal = '12';
  @State() gapType = 'abs';
  @State() spaceEqualizeAxis = '';
  @State() spaceBalanceAxis = '';
  @State() spaceMirrorAxis = 'x-axis';
  @State() spaceRotateAngle = '90';
  @State() spaceToggleValue = 'padding';
  @State() spaceLayout = 'bsp';

  @State() displayFocusTarget = 'next';
  @State() selectedDisplay = '';
  @State() displaySpaceTarget = '1';
  @State() displayLabelTarget = '';
  @State() displayLabelValue = '';

  @State() configSpaceTarget = '';
  @State() configDebugOutput = 'off';
  @State() configMouseFollowsFocus = 'off';
  @State() configFocusFollowsMouse = 'off';
  @State() configDisplayOrder = 'default';
  @State() configWindowOriginDisplay = 'default';
  @State() configWindowPlacement = 'second_child';
  @State() configWindowInsertionPoint = 'focused';
  @State() configWindowZoomPersist = 'off';
  @State() configWindowShadow = 'off';
  @State() configWindowOpacity = 'off';
  @State() configActiveWindowOpacity = '1.0';
  @State() configNormalWindowOpacity = '0.9';
  @State() configAnimationDuration = '0.0';
  @State() configMenubarOpacity = '1.0';
  @State() configSplitRatio = '0.5';
  @State() configMouseModifier = 'alt';
  @State() configMouseAction1 = 'move';
  @State() configMouseAction2 = 'resize';
  @State() configMouseDropAction = 'swap';
  @State() configSpaceLayout = 'bsp';
  @State() configSplitType = 'auto';
  @State() configAutoBalance = 'off';
  @State() configTopPadding = '20';
  @State() configBottomPadding = '20';
  @State() configLeftPadding = '20';
  @State() configRightPadding = '20';
  @State() configWindowGap = '12';

  @State() ruleIndex = '';
  @State() ruleLabel = '';
  @State() ruleApp = '';
  @State() ruleAppNeg = false;
  @State() ruleTitle = '';
  @State() ruleTitleNeg = false;
  @State() ruleRole = '';
  @State() ruleRoleNeg = false;
  @State() ruleSubrole = '';
  @State() ruleSubroleNeg = false;
  @State() ruleDisplay = '';
  @State() ruleDisplayFollowFocus = false;
  @State() ruleSpace = '';
  @State() ruleSpaceFollowFocus = false;
  @State() ruleManage = '';
  @State() ruleSticky = '';
  @State() ruleMouseFollowsFocus = '';
  @State() ruleSubLayer = '';
  @State() ruleOpacity = '';
  @State() ruleNativeFullscreen = '';
  @State() ruleGrid = '';
  @State() ruleScratchpad = '';
  @State() ruleOneShot = false;

  @State() signalIndex = '';
  @State() signalEvent = '';
  @State() signalLabel = '';
  @State() signalApp = '';
  @State() signalAppNeg = false;
  @State() signalTitle = '';
  @State() signalTitleNeg = false;
  @State() signalActive = '';
  @State() signalAction = '';

  @State() rawCommand = '';

  @Event() commandExecuted: EventEmitter<CommandResult>;

  private renderOptions(options: string[]) {
    return options.map(option => (
      <option value={option} key={option}>
        {option}
      </option>
    ));
  }

  private buildScopedCommand(domain: 'display' | 'space' | 'window', selector: string, command: string, value?: string): string {
    const parts = ['yabai', '-m', domain];
    const trimmedSelector = selector.trim();
    const trimmedValue = value?.trim();

    if (trimmedSelector) {
      parts.push(formatCliValue(trimmedSelector));
    }

    parts.push(command);

    if (trimmedValue) {
      parts.push(formatCliValue(trimmedValue));
    }

    return parts.join(' ');
  }

  private buildConfigCommand(key: string, value: string, spaceSelector = ''): string {
    const parts = ['yabai', '-m', 'config'];
    const trimmedSelector = spaceSelector.trim();

    if (trimmedSelector) {
      parts.push('--space', formatCliValue(trimmedSelector));
    }

    parts.push(key, formatCliValue(value));

    return parts.join(' ');
  }

  private setTemporaryStatus(message: string, resetTo = DEFAULT_STATUS): void {
    this.statusMessage = message;

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, 2000);
    }
  }

  async executeCmd(cmd: string, showConfirm = false): Promise<void> {
    const trimmedCmd = cmd.trim();

    if (!trimmedCmd) {
      return;
    }

    if (showConfirm && typeof window !== 'undefined' && !window.confirm(`Execute: ${trimmedCmd}?`)) {
      return;
    }

    this.status = 'running';
    this.lastCommand = trimmedCmd;
    this.output = 'Executing...';
    this.statusMessage = 'Running...';

    try {
      const result = await executeCommand(trimmedCmd);
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

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

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  buildCustomQueryPreview(): string {
    return buildQueryCommand({
      domain: this.queryTarget,
      properties: this.queryProps,
      argumentType: this.queryArgumentType,
      argumentValue: this.queryArgumentValue,
    });
  }

  async runQuery(
    target: QueryDomain = this.queryTarget,
    argumentType: QueryArgumentType = this.queryArgumentType,
    argumentValue = this.queryArgumentValue,
    properties = this.queryProps,
  ): Promise<void> {
    await this.executeCmd(
      buildQueryCommand({
        domain: target,
        properties,
        argumentType,
        argumentValue,
      }),
    );
  }

  async refreshAll(): Promise<void> {
    this.status = 'running';
    this.lastCommand = 'yabai -m query --displays && yabai -m query --spaces && yabai -m query --windows';
    this.output = 'Executing...';
    this.statusMessage = 'Refreshing overview...';

    try {
      const [displays, spaces, windows] = await Promise.all([yabai.query('displays'), yabai.query('spaces'), yabai.query('windows')]);

      this.output = `Displays:\n${displays.stdout}\n\nSpaces:\n${spaces.stdout}\n\nWindows:\n${windows.stdout}`;
      this.status = 'success';
      this.statusMessage = 'Overview refreshed';
    } catch (error) {
      this.output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      this.status = 'error';
      this.statusMessage = 'Refresh failed';
    }
  }

  clearOutput(): void {
    this.output = DEFAULT_OUTPUT;
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = DEFAULT_STATUS;
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard is unavailable in this environment.');
      return;
    }

    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied output to clipboard.');
  }

  async windowCmd(args: string): Promise<void> {
    await this.executeCmd(`yabai -m window ${args}`);
  }

  async focusSpace(target = this.spaceFocusTarget): Promise<void> {
    if (!target.trim()) {
      return;
    }

    await this.executeCmd(`yabai -m space --focus ${formatCliValue(target)}`);
  }

  async switchSpace(target = this.spaceSwitchTarget): Promise<void> {
    if (!target.trim()) {
      return;
    }

    await this.executeCmd(`yabai -m space --switch ${formatCliValue(target)}`);
  }

  async createSpace(): Promise<void> {
    const command = this.createOnDisplay.trim() ? `yabai -m space --create ${formatCliValue(this.createOnDisplay)}` : 'yabai -m space --create';

    await this.executeCmd(command);
  }

  async destroySpace(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--destroy'), true);
  }

  async moveSpace(): Promise<void> {
    if (!this.spaceMoveTarget.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--move', this.spaceMoveTarget));
  }

  async swapSpace(): Promise<void> {
    if (!this.spaceSwapTarget.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--swap', this.spaceSwapTarget));
  }

  async sendSpaceToDisplay(): Promise<void> {
    if (!this.spaceToDisplay.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--display', this.spaceToDisplay));
  }

  async labelSpace(clear = false): Promise<void> {
    const value = clear ? undefined : this.spaceLabel;

    if (!clear && !value?.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('space', this.spaceLabelTarget, '--label', value));
  }

  async equalizeSpace(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--equalize', this.spaceEqualizeAxis));
  }

  async balanceSpace(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--balance', this.spaceBalanceAxis));
  }

  async mirrorSpace(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--mirror', this.spaceMirrorAxis));
  }

  async rotateSpace(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--rotate', this.spaceRotateAngle));
  }

  async setSpacePadding(): Promise<void> {
    if (!this.paddingVal.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--padding', `${this.paddingType}:${this.paddingVal.trim()}`));
  }

  async setSpaceGap(): Promise<void> {
    if (!this.gapVal.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--gap', `${this.gapType}:${this.gapVal.trim()}`));
  }

  async toggleSpaceSetting(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--toggle', this.spaceToggleValue));
  }

  async setSpaceLayout(): Promise<void> {
    await this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--layout', this.spaceLayout));
  }

  async focusDisplay(target = this.displayFocusTarget): Promise<void> {
    if (!target.trim()) {
      return;
    }

    await this.executeCmd(`yabai -m display --focus ${formatCliValue(target)}`);
  }

  async showSpaceOnDisplay(): Promise<void> {
    if (!this.displaySpaceTarget.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('display', this.selectedDisplay, '--space', this.displaySpaceTarget));
  }

  async labelDisplay(clear = false): Promise<void> {
    const value = clear ? undefined : this.displayLabelValue;

    if (!clear && !value?.trim()) {
      return;
    }

    await this.executeCmd(this.buildScopedCommand('display', this.displayLabelTarget, '--label', value));
  }

  async applyGlobalConfig(key: string, value: string): Promise<void> {
    if (!value.trim()) {
      return;
    }

    await this.executeCmd(this.buildConfigCommand(key, value));
  }

  async applySpaceConfig(key: string, value: string): Promise<void> {
    if (!value.trim()) {
      return;
    }

    await this.executeCmd(this.buildConfigCommand(key, value, this.configSpaceTarget));
  }

  buildRulePreview(mode: 'add' | 'apply' = 'add'): string {
    return buildRuleCommand(
      {
        label: this.ruleLabel,
        app: this.ruleApp,
        appNegated: this.ruleAppNeg,
        title: this.ruleTitle,
        titleNegated: this.ruleTitleNeg,
        role: this.ruleRole,
        roleNegated: this.ruleRoleNeg,
        subrole: this.ruleSubrole,
        subroleNegated: this.ruleSubroleNeg,
        display: this.ruleDisplay,
        displayFollowFocus: this.ruleDisplayFollowFocus,
        space: this.ruleSpace,
        spaceFollowFocus: this.ruleSpaceFollowFocus,
        manage: this.ruleManage,
        sticky: this.ruleSticky,
        mouseFollowsFocus: this.ruleMouseFollowsFocus,
        subLayer: this.ruleSubLayer,
        opacity: this.ruleOpacity,
        nativeFullscreen: this.ruleNativeFullscreen,
        grid: this.ruleGrid,
        scratchpad: this.ruleScratchpad,
        oneShot: this.ruleOneShot,
      },
      mode,
    );
  }

  async addRule(): Promise<void> {
    const command = this.buildRulePreview();

    if (command === 'yabai -m rule --add' || command === 'yabai -m rule --add --one-shot') {
      this.setTemporaryStatus('Add at least one rule argument before executing.');
      return;
    }

    await this.executeCmd(command);
  }

  async applyRulePreview(): Promise<void> {
    const command = this.buildRulePreview('apply');

    if (command === 'yabai -m rule --apply') {
      this.setTemporaryStatus('Add rule arguments to apply to existing windows.');
      return;
    }

    await this.executeCmd(command);
  }

  async applyRuleSelection(): Promise<void> {
    if (!this.ruleIndex.trim()) {
      this.setTemporaryStatus('Enter a rule index or label first.');
      return;
    }

    await this.executeCmd(`yabai -m rule --apply ${formatCliValue(this.ruleIndex)}`);
  }

  async removeRule(): Promise<void> {
    if (!this.ruleIndex.trim()) {
      this.setTemporaryStatus('Enter a rule index or label first.');
      return;
    }

    await this.executeCmd(`yabai -m rule --remove ${formatCliValue(this.ruleIndex)}`, true);
  }

  buildSignalPreview(): string {
    return buildSignalCommand({
      event: this.signalEvent,
      action: this.signalAction,
      label: this.signalLabel,
      app: this.signalApp,
      appNegated: this.signalAppNeg,
      title: this.signalTitle,
      titleNegated: this.signalTitleNeg,
      active: this.signalActive as '' | 'yes' | 'no',
    });
  }

  async addSignal(): Promise<void> {
    if (!this.signalEvent || !this.signalAction.trim()) {
      this.setTemporaryStatus('Signals require both an event and an action.');
      return;
    }

    await this.executeCmd(this.buildSignalPreview());
  }

  async removeSignal(): Promise<void> {
    if (!this.signalIndex.trim()) {
      this.setTemporaryStatus('Enter a signal index or label first.');
      return;
    }

    await this.executeCmd(`yabai -m signal --remove ${formatCliValue(this.signalIndex)}`, true);
  }

  async runServiceCommand(flag: string): Promise<void> {
    await this.executeCmd(`yabai ${flag}`);
  }

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} onClick={() => this.switchTab(tab.id)}>
        {tab.label}
      </button>
    ));
  }

  renderQueryTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Quick Queries
            <span class="cli-badge-safe">Safe</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runQuery('displays')}>
              All Displays
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runQuery('spaces')}>
              All Spaces
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runQuery('windows')}>
              All Windows
            </button>
          </div>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('displays', 'display')}>
              Current Display
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('spaces', 'space')}>
              Current Space
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('windows', 'window')}>
              Focused Window
            </button>
          </div>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm cli-btn-info" onClick={() => this.refreshAll()}>
              Refresh Overview
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear Output
            </button>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-2">Custom Query Builder</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Domain
              <select class="cli-select" onChange={(event: Event) => (this.queryTarget = (event.target as HTMLSelectElement).value as QueryDomain)}>
                <option value="displays" selected={this.queryTarget === 'displays'}>
                  Displays
                </option>
                <option value="spaces" selected={this.queryTarget === 'spaces'}>
                  Spaces
                </option>
                <option value="windows" selected={this.queryTarget === 'windows'}>
                  Windows
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Constraint Type
              <select class="cli-select" onChange={(event: Event) => (this.queryArgumentType = (event.target as HTMLSelectElement).value as QueryArgumentType)}>
                <option value="">None</option>
                <option value="display">Display</option>
                <option value="space">Space</option>
                <option value="window">Window</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Selector
              <input
                type="text"
                class="cli-input w-full"
                placeholder="prev, 2, main, mouse..."
                value={this.queryArgumentValue}
                onInput={(event: Event) => (this.queryArgumentValue = (event.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Properties
              <input
                type="text"
                class="cli-input w-full"
                placeholder="id,title,app"
                value={this.queryProps}
                onInput={(event: Event) => (this.queryProps = (event.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="mt-4">
            <div class="cli-cmd-preview">{this.buildCustomQueryPreview()}</div>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runQuery()}>
              Execute Query
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => (this.queryProps = '')}>
              Clear Properties
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => (this.queryArgumentValue = '')}>
              Clear Selector
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderWindowsTab() {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Focus & Navigation</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--focus prev')}>
              ← Prev
            </button>
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--focus next')}>
              Next →
            </button>
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--focus recent')}>
              Recent
            </button>
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--focus mouse')}>
              Under Mouse
            </button>
          </div>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus stack.prev')}>
              Stack ↑
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus stack.next')}>
              Stack ↓
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus largest')}>
              Largest
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--focus smallest')}>
              Smallest
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Window Actions</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.windowCmd('--close')}>
              Close
            </button>
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--minimize')}>
              Minimize
            </button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Deminimize ID:</span>
            <input
              type="text"
              class="cli-input"
              placeholder="window id"
              value={this.deminimizeId}
              onInput={(event: Event) => (this.deminimizeId = (event.target as HTMLInputElement).value)}
            />
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeCmd(`yabai -m window --deminimize ${formatCliValue(this.deminimizeId)}`)}>
              Restore
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Move & Swap</h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--swap prev')}>
              Swap ←
            </button>
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--swap next')}>
              Swap →
            </button>
            <button type="button" class="cli-btn" onClick={() => this.windowCmd('--swap largest')}>
              Swap Largest
            </button>
          </div>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--warp prev')}>
              Warp ←
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--warp next')}>
              Warp →
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--stack prev')}>
              Stack on ←
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--stack next')}>
              Stack on →
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Send To
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Display:</span>
            <select class="cli-select" onChange={(event: Event) => (this.winDisplay = (event.target as HTMLSelectElement).value)}>
              {this.renderOptions(DISPLAY_SELECTORS)}
            </select>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--display ${this.winDisplay}`)}>
              Send
            </button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Space:</span>
            <select class="cli-select" onChange={(event: Event) => (this.winSpace = (event.target as HTMLSelectElement).value)}>
              {this.renderOptions(SPACE_SELECTORS)}
            </select>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--space ${this.winSpace}`)}>
              Send
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Toggles
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle float')}>
              Float
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle sticky')}>
              Sticky
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle pip')}>
              PiP
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle shadow')}>
              Shadow
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle split')}>
              Split
            </button>
          </div>
          <div class="flex flex-wrap gap-2 my-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle zoom-parent')}>
              Zoom Parent
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle zoom-fullscreen')}>
              Zoom FS
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd('--toggle native-fullscreen')}>
              Native FS
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Advanced
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Grid:</span>
            <input
              type="text"
              class="cli-input w-[120px]"
              placeholder="r:c:x:y:w:h"
              value={this.gridVal}
              onInput={(event: Event) => (this.gridVal = (event.target as HTMLInputElement).value)}
            />
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--grid ${this.gridVal}`)}>
              Apply
            </button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Insert:</span>
            <select class="cli-select" onChange={(event: Event) => (this.insertDir = (event.target as HTMLSelectElement).value)}>
              <option value="north">North</option>
              <option value="east">East</option>
              <option value="south">South</option>
              <option value="west">West</option>
              <option value="stack">Stack</option>
            </select>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--insert ${this.insertDir}`)}>
              Set
            </button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Opacity:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={this.opacityValue}
              class="cli-input flex-1"
              onInput={(event: Event) => (this.opacityValue = parseFloat((event.target as HTMLInputElement).value))}
            />
            <span class="text-text2 text-sm">{this.opacityValue.toFixed(1)}</span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--opacity ${this.opacityValue}`)}>
              Set
            </button>
          </div>
          <div class="flex gap-2 items-center my-2 flex-wrap">
            <span class="text-text2 text-sm">Scratchpad:</span>
            <input
              type="text"
              class="cli-input w-20"
              placeholder="label"
              value={this.scratchpadLabel}
              onInput={(event: Event) => (this.scratchpadLabel = (event.target as HTMLInputElement).value)}
            />
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.windowCmd(`--scratchpad ${this.scratchpadLabel}`)}>
              Assign
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeCmd('yabai -m window --scratchpad recover')}>
              Recover
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderSpacesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Focus & Lifecycle
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn" onClick={() => this.focusSpace('prev')}>
              ← Prev
            </button>
            <button type="button" class="cli-btn" onClick={() => this.focusSpace('next')}>
              Next →
            </button>
            <button type="button" class="cli-btn" onClick={() => this.focusSpace('recent')}>
              Recent
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Focus Target
            <input
              type="text"
              class="cli-input w-full"
              placeholder="next, 2, main..."
              value={this.spaceFocusTarget}
              onInput={(event: Event) => (this.spaceFocusTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Switch Target
            <input
              type="text"
              class="cli-input w-full"
              placeholder="space selector"
              value={this.spaceSwitchTarget}
              onInput={(event: Event) => (this.spaceSwitchTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.focusSpace()}>
              Focus Target
            </button>
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.switchSpace()}>
              Switch Target
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Create on Display
            <input
              type="text"
              class="cli-input w-full"
              placeholder="blank = current display"
              value={this.createOnDisplay}
              onInput={(event: Event) => (this.createOnDisplay = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.createSpace()}>
              Create Space
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.destroySpace()}>
              Destroy Selected
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Move, Swap & Display
            <span class="cli-badge-sip">SIP</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Selected Space
            <input
              type="text"
              class="cli-input w-full"
              placeholder="blank = current space"
              value={this.selectedSpace}
              onInput={(event: Event) => (this.selectedSpace = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Move To
            <input
              type="text"
              class="cli-input w-full"
              placeholder="prev, next, 4..."
              value={this.spaceMoveTarget}
              onInput={(event: Event) => (this.spaceMoveTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Swap With
            <input
              type="text"
              class="cli-input w-full"
              placeholder="prev, next, 2..."
              value={this.spaceSwapTarget}
              onInput={(event: Event) => (this.spaceSwapTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Send To Display
            <input
              type="text"
              class="cli-input w-full"
              placeholder="display selector"
              value={this.spaceToDisplay}
              onInput={(event: Event) => (this.spaceToDisplay = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn" onClick={() => this.moveSpace()}>
              Move Space
            </button>
            <button type="button" class="cli-btn" onClick={() => this.swapSpace()}>
              Swap Space
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.sendSpaceToDisplay()}>
              Send to Display
            </button>
          </div>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('spaces', 'space')}>
              Query Current Space
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('spaces', 'display')}>
              Query Display Spaces
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Layout & Tree</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Layout
            <select class="cli-select" onChange={(event: Event) => (this.spaceLayout = (event.target as HTMLSelectElement).value)}>
              <option value="bsp">bsp</option>
              <option value="stack">stack</option>
              <option value="float">float</option>
            </select>
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.setSpaceLayout()}>
              Set Layout
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeCmd(this.buildScopedCommand('space', this.selectedSpace, '--balance'))}>
              Balance All
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Equalize Axis
              <select class="cli-select" onChange={(event: Event) => (this.spaceEqualizeAxis = (event.target as HTMLSelectElement).value)}>
                <option value="">both</option>
                <option value="x-axis">x-axis</option>
                <option value="y-axis">y-axis</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Balance Axis
              <select class="cli-select" onChange={(event: Event) => (this.spaceBalanceAxis = (event.target as HTMLSelectElement).value)}>
                <option value="">both</option>
                <option value="x-axis">x-axis</option>
                <option value="y-axis">y-axis</option>
              </select>
            </label>
          </div>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.equalizeSpace()}>
              Equalize
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.balanceSpace()}>
              Balance Axis
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Mirror
              <select class="cli-select" onChange={(event: Event) => (this.spaceMirrorAxis = (event.target as HTMLSelectElement).value)}>
                <option value="x-axis">x-axis</option>
                <option value="y-axis">y-axis</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Rotate
              <select class="cli-select" onChange={(event: Event) => (this.spaceRotateAngle = (event.target as HTMLSelectElement).value)}>
                <option value="90">90</option>
                <option value="180">180</option>
                <option value="270">270</option>
              </select>
            </label>
          </div>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.mirrorSpace()}>
              Mirror Space
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.rotateSpace()}>
              Rotate Space
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Padding, Gap & Toggles</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Padding Type
              <select class="cli-select" onChange={(event: Event) => (this.paddingType = (event.target as HTMLSelectElement).value)}>
                <option value="abs">abs</option>
                <option value="rel">rel</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Gap Type
              <select class="cli-select" onChange={(event: Event) => (this.gapType = (event.target as HTMLSelectElement).value)}>
                <option value="abs">abs</option>
                <option value="rel">rel</option>
              </select>
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Padding Value
            <input
              type="text"
              class="cli-input w-full"
              placeholder="20:20:20:20"
              value={this.paddingVal}
              onInput={(event: Event) => (this.paddingVal = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Gap Value
            <input type="text" class="cli-input w-full" placeholder="12" value={this.gapVal} onInput={(event: Event) => (this.gapVal = (event.target as HTMLInputElement).value)} />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.setSpacePadding()}>
              Apply Padding
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.setSpaceGap()}>
              Apply Gap
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Toggle
            <select class="cli-select" onChange={(event: Event) => (this.spaceToggleValue = (event.target as HTMLSelectElement).value)}>
              <option value="padding">padding</option>
              <option value="gap">gap</option>
              <option value="mission-control">mission-control</option>
              <option value="show-desktop">show-desktop</option>
            </select>
          </label>

          <button type="button" class="cli-btn cli-btn-warning mt-1" onClick={() => this.toggleSpaceSetting()}>
            Toggle Setting
          </button>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-2">Space Labels</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Space Selector
              <input
                type="text"
                class="cli-input w-full"
                placeholder="blank = current space"
                value={this.spaceLabelTarget}
                onInput={(event: Event) => (this.spaceLabelTarget = (event.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Label
              <input
                type="text"
                class="cli-input w-full"
                placeholder="work, web, code..."
                value={this.spaceLabel}
                onInput={(event: Event) => (this.spaceLabel = (event.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.labelSpace()}>
              Set Label
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.labelSpace(true)}>
              Clear Label
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderDisplaysTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Focus & Query</h3>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn" onClick={() => this.focusDisplay('prev')}>
              ← Prev
            </button>
            <button type="button" class="cli-btn" onClick={() => this.focusDisplay('next')}>
              Next →
            </button>
            <button type="button" class="cli-btn" onClick={() => this.focusDisplay('recent')}>
              Recent
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Focus Target
            <input
              type="text"
              class="cli-input w-full"
              placeholder="display selector"
              value={this.displayFocusTarget}
              onInput={(event: Event) => (this.displayFocusTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.focusDisplay()}>
              Focus Target
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('displays')}>
              Query Displays
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('displays', 'display')}>
              Query Current
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Show Space on Display
            <span class="cli-badge-sip">SIP</span>
          </h3>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Selected Display
            <input
              type="text"
              class="cli-input w-full"
              placeholder="blank = current display"
              value={this.selectedDisplay}
              onInput={(event: Event) => (this.selectedDisplay = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Space Selector
            <input
              type="text"
              class="cli-input w-full"
              placeholder="space selector"
              value={this.displaySpaceTarget}
              onInput={(event: Event) => (this.displaySpaceTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <button type="button" class="cli-btn cli-btn-info mt-1" onClick={() => this.showSpaceOnDisplay()}>
            Show Space
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Display Labels</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Display Selector
            <input
              type="text"
              class="cli-input w-full"
              placeholder="blank = current display"
              value={this.displayLabelTarget}
              onInput={(event: Event) => (this.displayLabelTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Label
            <input
              type="text"
              class="cli-input w-full"
              placeholder="laptop, left, main..."
              value={this.displayLabelValue}
              onInput={(event: Event) => (this.displayLabelValue = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.labelDisplay()}>
              Set Label
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.labelDisplay(true)}>
              Clear Label
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderConfigTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Focus, Pointer & Debug</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              debug_output
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configDebugOutput = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('debug_output', this.configDebugOutput);
                }}
              >
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              mouse_follows_focus
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configMouseFollowsFocus = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('mouse_follows_focus', this.configMouseFollowsFocus);
                }}
              >
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              focus_follows_mouse
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configFocusFollowsMouse = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('focus_follows_mouse', this.configFocusFollowsMouse);
                }}
              >
                <option value="off">off</option>
                <option value="autofocus">autofocus</option>
                <option value="autoraise">autoraise</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              mouse_modifier
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configMouseModifier = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('mouse_modifier', this.configMouseModifier);
                }}
              >
                <option value="cmd" selected={this.configMouseModifier === 'cmd'}>
                  cmd
                </option>
                <option value="alt" selected={this.configMouseModifier === 'alt'}>
                  alt
                </option>
                <option value="shift" selected={this.configMouseModifier === 'shift'}>
                  shift
                </option>
                <option value="ctrl" selected={this.configMouseModifier === 'ctrl'}>
                  ctrl
                </option>
                <option value="fn" selected={this.configMouseModifier === 'fn'}>
                  fn
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              mouse_action1
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configMouseAction1 = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('mouse_action1', this.configMouseAction1);
                }}
              >
                <option value="move">move</option>
                <option value="resize">resize</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              mouse_action2
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configMouseAction2 = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('mouse_action2', this.configMouseAction2);
                }}
              >
                <option value="move" selected={this.configMouseAction2 === 'move'}>
                  move
                </option>
                <option value="resize" selected={this.configMouseAction2 === 'resize'}>
                  resize
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              mouse_drop_action
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configMouseDropAction = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('mouse_drop_action', this.configMouseDropAction);
                }}
              >
                <option value="swap">swap</option>
                <option value="stack">stack</option>
              </select>
            </label>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Layout Defaults</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              display_arrangement_order
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configDisplayOrder = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('display_arrangement_order', this.configDisplayOrder);
                }}
              >
                <option value="default">default</option>
                <option value="vertical">vertical</option>
                <option value="horizontal">horizontal</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_origin_display
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configWindowOriginDisplay = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('window_origin_display', this.configWindowOriginDisplay);
                }}
              >
                <option value="default">default</option>
                <option value="focused">focused</option>
                <option value="cursor">cursor</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_placement
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configWindowPlacement = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('window_placement', this.configWindowPlacement);
                }}
              >
                <option value="first_child" selected={this.configWindowPlacement === 'first_child'}>
                  first_child
                </option>
                <option value="second_child" selected={this.configWindowPlacement === 'second_child'}>
                  second_child
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_insertion_point
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configWindowInsertionPoint = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('window_insertion_point', this.configWindowInsertionPoint);
                }}
              >
                <option value="focused">focused</option>
                <option value="first">first</option>
                <option value="last">last</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_zoom_persist
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configWindowZoomPersist = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('window_zoom_persist', this.configWindowZoomPersist);
                }}
              >
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              split_ratio
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configSplitRatio}
                  onInput={(event: Event) => (this.configSplitRatio = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applyGlobalConfig('split_ratio', this.configSplitRatio)}>
                  Set
                </button>
              </div>
            </label>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Visual Modifiers
            <span class="cli-badge-sip">SIP</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              window_shadow
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configWindowShadow = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('window_shadow', this.configWindowShadow);
                }}
              >
                <option value="on" selected={this.configWindowShadow === 'on'}>
                  on
                </option>
                <option value="off" selected={this.configWindowShadow === 'off'}>
                  off
                </option>
                <option value="float" selected={this.configWindowShadow === 'float'}>
                  float
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_opacity
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configWindowOpacity = (event.target as HTMLSelectElement).value;
                  void this.applyGlobalConfig('window_opacity', this.configWindowOpacity);
                }}
              >
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              active_window_opacity
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configActiveWindowOpacity}
                  onInput={(event: Event) => (this.configActiveWindowOpacity = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applyGlobalConfig('active_window_opacity', this.configActiveWindowOpacity)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              normal_window_opacity
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configNormalWindowOpacity}
                  onInput={(event: Event) => (this.configNormalWindowOpacity = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applyGlobalConfig('normal_window_opacity', this.configNormalWindowOpacity)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_animation_duration
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configAnimationDuration}
                  onInput={(event: Event) => (this.configAnimationDuration = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applyGlobalConfig('window_animation_duration', this.configAnimationDuration)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              menubar_opacity
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configMenubarOpacity}
                  onInput={(event: Event) => (this.configMenubarOpacity = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applyGlobalConfig('menubar_opacity', this.configMenubarOpacity)}>
                  Set
                </button>
              </div>
            </label>
          </div>
        </div>

        <div class="cli-card xl:col-span-3">
          <h3 class="text-text2 text-base mb-2">Per-Space Settings</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3 max-w-md">
            Space Selector
            <input
              type="text"
              class="cli-input w-full"
              placeholder="blank = current space"
              value={this.configSpaceTarget}
              onInput={(event: Event) => (this.configSpaceTarget = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              layout
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configSpaceLayout = (event.target as HTMLSelectElement).value;
                  void this.applySpaceConfig('layout', this.configSpaceLayout);
                }}
              >
                <option value="bsp">bsp</option>
                <option value="stack">stack</option>
                <option value="float">float</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              split_type
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configSplitType = (event.target as HTMLSelectElement).value;
                  void this.applySpaceConfig('split_type', this.configSplitType);
                }}
              >
                <option value="auto">auto</option>
                <option value="vertical">vertical</option>
                <option value="horizontal">horizontal</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              auto_balance
              <select
                class="cli-select"
                onChange={(event: Event) => {
                  this.configAutoBalance = (event.target as HTMLSelectElement).value;
                  void this.applySpaceConfig('auto_balance', this.configAutoBalance);
                }}
              >
                <option value="off">off</option>
                <option value="on">on</option>
                <option value="x-axis">x-axis</option>
                <option value="y-axis">y-axis</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              top_padding
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configTopPadding}
                  onInput={(event: Event) => (this.configTopPadding = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applySpaceConfig('top_padding', this.configTopPadding)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              bottom_padding
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configBottomPadding}
                  onInput={(event: Event) => (this.configBottomPadding = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applySpaceConfig('bottom_padding', this.configBottomPadding)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              left_padding
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configLeftPadding}
                  onInput={(event: Event) => (this.configLeftPadding = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applySpaceConfig('left_padding', this.configLeftPadding)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              right_padding
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configRightPadding}
                  onInput={(event: Event) => (this.configRightPadding = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applySpaceConfig('right_padding', this.configRightPadding)}>
                  Set
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              window_gap
              <div class="flex gap-2">
                <input
                  type="text"
                  class="cli-input w-full"
                  value={this.configWindowGap}
                  onInput={(event: Event) => (this.configWindowGap = (event.target as HTMLInputElement).value)}
                />
                <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applySpaceConfig('window_gap', this.configWindowGap)}>
                  Set
                </button>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  renderRulesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Rule Management</h3>
          <p class="text-text2 text-xs mb-3">New rules only affect future windows. Use apply to run the same rule against existing windows.</p>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn" onClick={() => this.executeCmd('yabai -m rule --list')}>
              List Rules
            </button>
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.executeCmd('yabai -m rule --apply')}>
              Apply All
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Rule Index or Label
            <input
              type="text"
              class="cli-input w-full"
              placeholder="0, main-rule..."
              value={this.ruleIndex}
              onInput={(event: Event) => (this.ruleIndex = (event.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.applyRuleSelection()}>
              Apply Selected
            </button>
            <button type="button" class="cli-btn cli-btn-warning cli-btn-sm" onClick={() => this.removeRule()}>
              Remove Selected
            </button>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-2">
            Add Rule
            <span class="cli-badge-sip">SIP-sensitive fields inside</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              label
              <input type="text" class="cli-input w-full" value={this.ruleLabel} onInput={(event: Event) => (this.ruleLabel = (event.target as HTMLInputElement).value)} />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              app regex
              <input type="text" class="cli-input w-full" value={this.ruleApp} onInput={(event: Event) => (this.ruleApp = (event.target as HTMLInputElement).value)} />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.ruleAppNeg} onInput={(event: Event) => (this.ruleAppNeg = (event.target as HTMLInputElement).checked)} />
                invert app match
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              title regex
              <input type="text" class="cli-input w-full" value={this.ruleTitle} onInput={(event: Event) => (this.ruleTitle = (event.target as HTMLInputElement).value)} />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.ruleTitleNeg} onInput={(event: Event) => (this.ruleTitleNeg = (event.target as HTMLInputElement).checked)} />
                invert title match
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              role regex
              <input type="text" class="cli-input w-full" value={this.ruleRole} onInput={(event: Event) => (this.ruleRole = (event.target as HTMLInputElement).value)} />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.ruleRoleNeg} onInput={(event: Event) => (this.ruleRoleNeg = (event.target as HTMLInputElement).checked)} />
                invert role match
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              subrole regex
              <input type="text" class="cli-input w-full" value={this.ruleSubrole} onInput={(event: Event) => (this.ruleSubrole = (event.target as HTMLInputElement).value)} />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.ruleSubroleNeg} onInput={(event: Event) => (this.ruleSubroleNeg = (event.target as HTMLInputElement).checked)} />
                invert subrole match
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              display selector
              <input
                type="text"
                class="cli-input w-full"
                placeholder="display or label"
                value={this.ruleDisplay}
                onInput={(event: Event) => (this.ruleDisplay = (event.target as HTMLInputElement).value)}
              />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input
                  type="checkbox"
                  checked={this.ruleDisplayFollowFocus}
                  onInput={(event: Event) => (this.ruleDisplayFollowFocus = (event.target as HTMLInputElement).checked)}
                />
                follow focus
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              space selector
              <input
                type="text"
                class="cli-input w-full"
                placeholder="space or label"
                value={this.ruleSpace}
                onInput={(event: Event) => (this.ruleSpace = (event.target as HTMLInputElement).value)}
              />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.ruleSpaceFollowFocus} onInput={(event: Event) => (this.ruleSpaceFollowFocus = (event.target as HTMLInputElement).checked)} />
                follow focus
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              manage
              <select class="cli-select" onChange={(event: Event) => (this.ruleManage = (event.target as HTMLSelectElement).value)}>
                <option value="">unset</option>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              sticky
              <select class="cli-select" onChange={(event: Event) => (this.ruleSticky = (event.target as HTMLSelectElement).value)}>
                <option value="">unset</option>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              mouse_follows_focus
              <select class="cli-select" onChange={(event: Event) => (this.ruleMouseFollowsFocus = (event.target as HTMLSelectElement).value)}>
                <option value="">unset</option>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              sub-layer
              <select class="cli-select" onChange={(event: Event) => (this.ruleSubLayer = (event.target as HTMLSelectElement).value)}>
                <option value="">unset</option>
                <option value="below">below</option>
                <option value="normal">normal</option>
                <option value="above">above</option>
                <option value="auto">auto</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              opacity
              <input
                type="text"
                class="cli-input w-full"
                placeholder="0.8"
                value={this.ruleOpacity}
                onInput={(event: Event) => (this.ruleOpacity = (event.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              native-fullscreen
              <select class="cli-select" onChange={(event: Event) => (this.ruleNativeFullscreen = (event.target as HTMLSelectElement).value)}>
                <option value="">unset</option>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              grid
              <input
                type="text"
                class="cli-input w-full"
                placeholder="1:2:0:0:1:1"
                value={this.ruleGrid}
                onInput={(event: Event) => (this.ruleGrid = (event.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              scratchpad
              <input
                type="text"
                class="cli-input w-full"
                value={this.ruleScratchpad}
                onInput={(event: Event) => (this.ruleScratchpad = (event.target as HTMLInputElement).value)}
              />
            </label>

            <label class="flex items-center gap-2 text-sm text-text2 pt-7">
              <input type="checkbox" checked={this.ruleOneShot} onInput={(event: Event) => (this.ruleOneShot = (event.target as HTMLInputElement).checked)} />
              one-shot
            </label>
          </div>

          <div class="mt-4">
            <div class="cli-cmd-preview">{this.buildRulePreview()}</div>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.addRule()}>
              Add Rule
            </button>
            <button type="button" class="cli-btn cli-btn-info" onClick={() => this.applyRulePreview()}>
              Apply These Args Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderSignalsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Signal Management</h3>
          <p class="text-text2 text-xs mb-3">
            Actions run through <code>/usr/bin/env sh -c</code> after yabai processes the event.
          </p>

          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn" onClick={() => this.executeCmd('yabai -m signal --list')}>
              List Signals
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 my-3">
            Signal Index or Label
            <input
              type="text"
              class="cli-input w-full"
              placeholder="0, flash_focus..."
              value={this.signalIndex}
              onInput={(event: Event) => (this.signalIndex = (event.target as HTMLInputElement).value)}
            />
          </label>

          <button type="button" class="cli-btn cli-btn-warning cli-btn-sm" onClick={() => this.removeSignal()}>
            Remove Signal
          </button>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-2">Add Signal</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              event
              <select class="cli-select" onChange={(event: Event) => (this.signalEvent = (event.target as HTMLSelectElement).value)}>
                <option value="">select event</option>
                {SIGNAL_EVENTS.map(signalEvent => (
                  <option value={signalEvent} key={signalEvent}>
                    {signalEvent}
                  </option>
                ))}
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              label
              <input type="text" class="cli-input w-full" value={this.signalLabel} onInput={(event: Event) => (this.signalLabel = (event.target as HTMLInputElement).value)} />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              active filter
              <select class="cli-select" onChange={(event: Event) => (this.signalActive = (event.target as HTMLSelectElement).value)}>
                <option value="">unset</option>
                <option value="yes">yes</option>
                <option value="no">no</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              app regex
              <input type="text" class="cli-input w-full" value={this.signalApp} onInput={(event: Event) => (this.signalApp = (event.target as HTMLInputElement).value)} />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.signalAppNeg} onInput={(event: Event) => (this.signalAppNeg = (event.target as HTMLInputElement).checked)} />
                invert app match
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              title regex
              <input type="text" class="cli-input w-full" value={this.signalTitle} onInput={(event: Event) => (this.signalTitle = (event.target as HTMLInputElement).value)} />
              <label class="flex items-center gap-2 text-xs text-text2">
                <input type="checkbox" checked={this.signalTitleNeg} onInput={(event: Event) => (this.signalTitleNeg = (event.target as HTMLInputElement).checked)} />
                invert title match
              </label>
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2 md:col-span-2 xl:col-span-1">
              action
              <textarea
                class="cli-input w-full min-h-28"
                placeholder="e.g. yabai -m window --opacity 0.1"
                value={this.signalAction}
                onInput={(event: Event) => (this.signalAction = (event.target as HTMLTextAreaElement).value)}
              ></textarea>
            </label>
          </div>

          <div class="mt-4">
            <div class="cli-cmd-preview">{this.buildSignalPreview()}</div>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.addSignal()}>
              Add Signal
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderServiceTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Service Lifecycle</h3>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runServiceCommand('--install-service')}>
              Install
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.runServiceCommand('--start-service')}>
              Start
            </button>
            <button type="button" class="cli-btn" onClick={() => this.runServiceCommand('--restart-service')}>
              Restart
            </button>
            <button type="button" class="cli-btn cli-btn-warning" onClick={() => this.runServiceCommand('--stop-service')}>
              Stop
            </button>
            <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.runServiceCommand('--uninstall-service')}>
              Uninstall
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">
            Scripting Addition
            <span class="cli-badge-sip">SIP</span>
          </h3>
          <p class="text-text2 text-xs mb-3">Required for space focus, display-space assignment, and several window modifications on supported macOS versions.</p>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn" onClick={() => this.runServiceCommand('--load-sa')}>
              Load SA
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Process Info</h3>
          <div class="flex flex-wrap gap-2 my-3">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeCmd('yabai -v')}>
              Version
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.executeCmd('yabai -h')}>
              Help
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.runQuery('displays')}>
              Query Environment
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderRawTab() {
    return (
      <div class="cli-card">
        <h3 class="text-text2 text-base mb-2">Raw Command</h3>
        <input
          type="text"
          class="cli-input w-full mb-2"
          placeholder="Enter full yabai command..."
          value={this.rawCommand}
          onInput={(event: Event) => (this.rawCommand = (event.target as HTMLInputElement).value)}
        />
        <div class="flex gap-2 items-center flex-wrap">
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.executeCmd(this.rawCommand)}>
            Execute
          </button>
          <button type="button" class="cli-btn" onClick={() => (this.rawCommand = '')}>
            Clear
          </button>
          <span class="text-text2 text-xs">Use this as an escape hatch for commands not exposed elsewhere.</span>
        </div>

        <h4 class="mt-4 mb-2 text-text2 text-sm">Quick Templates</h4>
        <div class="flex flex-wrap gap-2">
          {['yabai -m window --focus ', 'yabai -m space --focus ', 'yabai -m config ', 'yabai -m rule --add ', 'yabai -m signal --add event= action='].map(template => (
            <button type="button" key={template} class="cli-btn cli-btn-sm" onClick={() => (this.rawCommand = template)}>
              {template.replace('yabai -m ', '')}
            </button>
          ))}
        </div>
      </div>
    );
  }

  renderOutputPanel() {
    return (
      <div class="cli-card mt-5">
        <div class="flex justify-between items-center mb-2 gap-3 flex-wrap">
          <div>
            <h3 class="text-text2 text-base m-0">Output</h3>
            <p class="text-text2 text-xs mt-1 mb-0">Status: {this.status}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => void this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderActiveContent() {
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

        <div class="fixed bottom-0 left-0 right-0 bg-bg2 px-5 py-2.5 border-t border-bg3 flex justify-between items-center text-xs z-10 gap-3">
          <span>{this.statusMessage}</span>
          <span class="text-text2">
            <span class="cli-badge-sip">SIP</span> = Requires SIP partially disabled
          </span>
        </div>
      </div>
    );
  }
}
