import { Component, h, Prop, Event, type EventEmitter } from '@stencil/core';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  tag: 'cli-select',
  styleUrl: 'cli-select.css',
  scoped: true,
})
export class CliSelect {
  @Prop() value = '';
  @Prop() options: SelectOption[] = [];
  @Prop() placeholder = 'Select...';
  @Prop() tooltip?: string;
  @Prop() commandSegment?: string;

  @Event() valueChange: EventEmitter<string>;
  @Event() cliHover: EventEmitter<{ segment: string }>;

  private handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.valueChange.emit(target.value);
  };

  private handleMouseEnter = () => {
    if (this.commandSegment) {
      this.cliHover.emit({ segment: this.commandSegment });
    }
  };

  private handleMouseLeave = () => {
    this.cliHover.emit({ segment: '' });
  };

  render() {
    return (
      <select
        class="cli-select"
        title={this.tooltip}
        onChange={this.handleChange}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        data-segment={this.commandSegment}
      >
        {this.placeholder && (
          <option value="" disabled selected={!this.value}>
            {this.placeholder}
          </option>
        )}
        {this.options.map(option => (
          <option value={option.value} selected={this.value === option.value} disabled={option.disabled} title={option.tooltip}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
}
