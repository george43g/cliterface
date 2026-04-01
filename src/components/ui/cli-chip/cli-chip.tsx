import { Component, h, Prop, Event, type EventEmitter } from '@stencil/core';

@Component({
  tag: 'cli-chip',
  styleUrl: 'cli-chip.css',
  scoped: true,
})
export class CliChip {
  @Prop() label = '';
  @Prop() removable = false;
  @Prop() selected = false;
  @Prop() disabled = false;
  @Prop() color?: 'default' | 'success' | 'warning' | 'danger' | 'info';

  @Event() remove: EventEmitter<void>;
  @Event() chipClick: EventEmitter<void>;

  private getColorClass(): string {
    if (!this.color || this.color === 'default') return '';
    return `cli-chip-${this.color}`;
  }

  private handleClick = () => {
    if (!this.disabled) {
      this.chipClick.emit();
    }
  };

  private handleRemove = (event: Event) => {
    event.stopPropagation();
    this.remove.emit();
  };

  render() {
    const classes = ['cli-chip', this.getColorClass(), this.selected && 'cli-chip-selected', this.disabled && 'cli-chip-disabled', this.removable && 'cli-chip-removable']
      .filter(Boolean)
      .join(' ');

    return (
      <span class={classes} onClick={this.handleClick}>
        {this.label}
        {this.removable && (
          <button type="button" class="cli-chip-remove" onClick={this.handleRemove} aria-label="Remove">
            ×
          </button>
        )}
      </span>
    );
  }
}
