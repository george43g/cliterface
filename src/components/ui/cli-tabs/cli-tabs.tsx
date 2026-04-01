import { Component, h, Prop, Event, type EventEmitter } from '@stencil/core';

export interface Tab {
  id: string;
  label: string;
  badge?: string;
  tooltip?: string;
}

@Component({
  tag: 'cli-tabs',
  styleUrl: 'cli-tabs.css',
  scoped: true,
})
export class CliTabs {
  @Prop() tabs: Tab[] = [];
  @Prop() activeTab = '';

  @Event() tabChange: EventEmitter<string>;

  private handleTabClick = (tabId: string) => {
    this.tabChange.emit(tabId);
  };

  render() {
    return (
      <div class="cli-tabs-container">
        {this.tabs.map(tab => (
          <button type="button" key={tab.id} class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`} title={tab.tooltip} onClick={() => this.handleTabClick(tab.id)}>
            {tab.label}
            {tab.badge && <span class="cli-tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
    );
  }
}
