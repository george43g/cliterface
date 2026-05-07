import { Component, Event, type EventEmitter, h, Prop } from '@stencil/core';

export interface ToolShellTab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  tag: 'cli-tool-shell',
  styleUrl: 'cli-tool-shell.css',
  scoped: true,
})
export class CliToolShell {
  /** Emoji icon shown before the title */
  @Prop() icon?: string;

  /** Tool name / heading */
  @Prop() toolTitle!: string;

  /** Subtitle / description line */
  @Prop() subtitle?: string;

  /** Version string (e.g. "v1.7") */
  @Prop() version?: string;

  /** Tab definitions — pass as array from TSX, or as JSON string from plain HTML. */
  @Prop() tabs: ToolShellTab[] = [];

  /** Currently active tab id */
  @Prop() activeTab = '';

  /** Text shown in the command preview block */
  @Prop() lastCommand?: string;

  /** Terminal output content */
  @Prop() output?: string;

  /** Status line text */
  @Prop() status?: string;

  /** Status indicator: 'idle' | 'running' | 'success' | 'error' */
  @Prop() statusState?: 'idle' | 'running' | 'success' | 'error' = 'idle';

  /** Fired when a tab button is clicked */
  @Event() tabChange: EventEmitter<string>;

  /** Fired when Copy button is clicked */
  @Event() copyOutput: EventEmitter<void>;

  /** Fired when Clear button is clicked */
  @Event() clearOutput: EventEmitter<void>;

  private get parsedTabs(): ToolShellTab[] {
    return this.tabs;
  }

  private handleTabClick = (id: string) => {
    this.tabChange.emit(id);
  };

  private handleCopy = () => {
    this.copyOutput.emit();
  };

  private handleClear = () => {
    this.clearOutput.emit();
  };

  private renderHeader() {
    return (
      <header class="shell-header mb-4">
        <h1 class="text-2xl font-semibold flex items-center gap-2">
          {this.icon && <span>{this.icon}</span>}
          {this.toolTitle}
          {this.version && <span class="text-sm font-normal text-text2">{this.version}</span>}
        </h1>
        {this.subtitle && <p class="text-text2 text-sm mt-1">{this.subtitle}</p>}
      </header>
    );
  }

  private renderTabBar() {
    const tabs = this.parsedTabs;
    if (!tabs.length) return null;

    return (
      <div class="shell-tab-bar border-b border-accent2 mb-4">
        <div class="flex flex-wrap gap-1 pb-2">
          {tabs.map(tab => (
            <button key={tab.id} type="button" class={`cli-tab${this.activeTab === tab.id ? ' cli-tab-active' : ''}`} onClick={() => this.handleTabClick(tab.id)}>
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  private renderOutputPanel() {
    const statusClass =
      this.statusState === 'error' ? 'text-danger' : this.statusState === 'success' ? 'text-success' : this.statusState === 'running' ? 'text-info' : 'text-text2';

    return (
      <div class="shell-output-panel cli-card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <span class={`font-semibold ${statusClass}`}>
              {this.statusState === 'running' ? '⏳' : this.statusState === 'success' ? '✓' : this.statusState === 'error' ? '✗' : '○'}
            </span>
            {this.status && <span class="text-sm text-text2">{this.status}</span>}
          </div>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={this.handleCopy}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={this.handleClear}>
              Clear
            </button>
          </div>
        </div>

        {this.lastCommand && (
          <div class="mb-2">
            <span class="text-xs text-text2">Last command:</span>
            <code class="text-xs bg-bg3 px-2 py-1 rounded ml-2 font-mono">{this.lastCommand}</code>
          </div>
        )}

        <pre class="cli-output">{this.output ?? ''}</pre>
      </div>
    );
  }

  render() {
    return (
      <div class="cli-tool-shell pb-4">
        {this.renderHeader()}
        {this.renderTabBar()}
        <div class="shell-content">
          <slot />
        </div>
        {this.renderOutputPanel()}
      </div>
    );
  }
}
