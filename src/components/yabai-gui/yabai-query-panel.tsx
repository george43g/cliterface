import { Component, h, Prop, State, Event, type EventEmitter } from '@stencil/core';

/**
 * Yabai Query Panel - Uses UI component library
 */

@Component({
  tag: 'yabai-query-panel',
  styleUrl: 'yabai-query-panel.css',
  scoped: true,
})
export class YabaiQueryPanel {
  @Prop() executeCommand!: (cmd: string) => Promise<void>;

  @State() queryDomain: 'displays' | 'spaces' | 'windows' = 'windows';
  @State() constraintType = '';
  @State() constraintValue = '';
  @State() properties = '';

  @Event() commandPreview: EventEmitter<string>;

  private get queryPreview(): string {
    let cmd = `yabai -m query --${this.queryDomain}`;
    if (this.constraintType && this.constraintValue) {
      cmd += ` --${this.constraintType} ${this.constraintValue}`;
    }
    if (this.properties) {
      const normalizedProps = this.properties
        .split(/[,\s]+/)
        .map(p => p.trim())
        .filter(Boolean)
        .join(',');
      if (normalizedProps) {
        cmd += ` | jq '[.[] | {${normalizedProps
          .split(',')
          .map(p => `${p}:.${p}`)
          .join(', ')}}]'`;
      }
    }
    return cmd;
  }

  private runQuickQuery(domain: 'displays' | 'spaces' | 'windows', constraint?: string) {
    let cmd = `yabai -m query --${domain}`;
    if (constraint) {
      cmd += ` --${constraint === 'current' ? domain.slice(0, -1) : constraint}`;
    }
    this.executeCommand(cmd);
  }

  private runCustomQuery() {
    this.executeCommand(this.queryPreview.replace(' | jq', ''));
  }

  render() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Quick Queries Card */}
        <cli-card cardTitle="Quick Queries" badge="Safe" badgeType="safe">
          <div class="cli-flex cli-flex-wrap gap-2 my-3">
            <cli-button variant="success" onCliClick={() => this.runQuickQuery('displays')}>
              All Displays
            </cli-button>
            <cli-button variant="success" onCliClick={() => this.runQuickQuery('spaces')}>
              All Spaces
            </cli-button>
            <cli-button variant="success" onCliClick={() => this.runQuickQuery('windows')}>
              All Windows
            </cli-button>
          </div>
          <div class="cli-flex cli-flex-wrap gap-2 my-3">
            <cli-button onCliClick={() => this.runQuickQuery('displays', 'current')}>Current Display</cli-button>
            <cli-button onCliClick={() => this.runQuickQuery('spaces', 'current')}>Current Space</cli-button>
            <cli-button onCliClick={() => this.runQuickQuery('windows', 'current')}>Focused Window</cli-button>
          </div>
        </cli-card>

        {/* Custom Query Builder */}
        <cli-card cardTitle="Custom Query Builder" fullWidth={true} class="xl:col-span-2">
          <div class="cli-grid cli-grid-cols-2 xl:cli-grid-cols-4 gap-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Domain
              <cli-select
                value={this.queryDomain}
                options={[
                  { value: 'displays', label: 'Displays' },
                  { value: 'spaces', label: 'Spaces' },
                  { value: 'windows', label: 'Windows' },
                ]}
                onValueChange={e => (this.queryDomain = e.detail as typeof this.queryDomain)}
              />
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Constraint
              <cli-select
                value={this.constraintType}
                options={[
                  { value: '', label: 'None' },
                  { value: 'display', label: 'Display' },
                  { value: 'space', label: 'Space' },
                  { value: 'window', label: 'Window' },
                ]}
                onValueChange={e => (this.constraintType = e.detail)}
              />
            </label>

            <cli-input
              placeholder="prev, 2, main, mouse..."
              value={this.constraintValue}
              onValueChange={e => (this.constraintValue = e.detail)}
              tooltip="Selector value for the constraint"
            />

            <cli-input
              placeholder="id,title,app"
              value={this.properties}
              onValueChange={e => (this.properties = e.detail)}
              tooltip="Comma-separated list of properties to display"
            />
          </div>

          <cli-command-preview command={this.queryPreview} showExplanation={true} />

          <div class="cli-flex cli-flex-wrap gap-2 mt-3">
            <cli-button variant="success" onCliClick={() => this.runCustomQuery()}>
              Execute Query
            </cli-button>
            <cli-button size="sm" onCliClick={() => (this.properties = '')}>
              Clear Properties
            </cli-button>
            <cli-button size="sm" onCliClick={() => (this.constraintValue = '')}>
              Clear Selector
            </cli-button>
          </div>
        </cli-card>
      </div>
    );
  }
}
