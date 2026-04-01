import { Component, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'cli-log-viewer',
  styleUrl: 'cli-log-viewer.css',
  scoped: true,
})
export class CliLogViewer {
  @Prop() logs: string[] = [];
  @Prop() maxLines = 1000;
  @Prop() autoScroll = true;
  @Prop() searchable = true;

  @State() searchQuery = '';
  @State() filterLevel: 'all' | 'error' | 'warn' | 'info' = 'all';

  private getFilteredLogs(): string[] {
    let filtered = this.logs;

    if (this.filterLevel !== 'all') {
      filtered = filtered.filter(log => {
        const lower = log.toLowerCase();
        if (this.filterLevel === 'error') return lower.includes('error') || lower.includes('failed');
        if (this.filterLevel === 'warn') return lower.includes('warn') || lower.includes('warning');
        if (this.filterLevel === 'info') return !lower.includes('error') && !lower.includes('warn');
        return true;
      });
    }

    if (this.searchQuery) {
      filtered = filtered.filter(log => log.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }

    return filtered.slice(-this.maxLines);
  }

  private handleSearch = (event: Event) => {
    this.searchQuery = (event.target as HTMLInputElement).value;
  };

  private handleFilterChange = (event: Event) => {
    this.filterLevel = (event.target as HTMLSelectElement).value as any;
  };

  private clearLogs = () => {
    this.logs = [];
  };

  render() {
    const filteredLogs = this.getFilteredLogs();

    return (
      <div class="cli-log-viewer">
        <div class="cli-log-toolbar">
          {this.searchable && <input type="text" class="cli-log-search" placeholder="Search logs..." value={this.searchQuery} onInput={this.handleSearch} />}

          <select class="cli-log-filter" onChange={this.handleFilterChange}>
            <option value="all">All levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
          </select>

          <button type="button" class="cli-log-clear" onClick={this.clearLogs}>
            Clear
          </button>

          <span class="cli-log-count">{filteredLogs.length} lines</span>
        </div>

        <div class="cli-log-content">
          {filteredLogs.length === 0 ? (
            <div class="cli-log-empty">No logs to display</div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} class={`cli-log-line ${this.getLogLevelClass(log)}`}>
                <span class="cli-log-timestamp">{this.getTimestamp()}</span>
                <span class="cli-log-text">{log}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  private getLogLevelClass(log: string): string {
    const lower = log.toLowerCase();
    if (lower.includes('error') || lower.includes('failed')) return 'cli-log-error';
    if (lower.includes('warn')) return 'cli-log-warn';
    if (lower.includes('success') || lower.includes('completed')) return 'cli-log-success';
    return '';
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
