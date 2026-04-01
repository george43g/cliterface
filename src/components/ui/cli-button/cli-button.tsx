import { Component, h, Prop, Event, type EventEmitter } from '@stencil/core';

export type ButtonVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  tag: 'cli-button',
  styleUrl: 'cli-button.css',
  scoped: true,
})
export class CliButton {
  @Prop() variant: ButtonVariant = 'default';
  @Prop() size: ButtonSize = 'md';
  @Prop() disabled = false;
  @Prop() tooltip?: string;
  @Prop() commandSegment?: string;
  @Prop() compatibleWith?: string[];

  @Event() cliClick: EventEmitter<void>;
  @Event() cliHover: EventEmitter<{ segment: string; compatible: boolean }>;

  private getVariantClass(): string {
    const variants: Record<ButtonVariant, string> = {
      default: '',
      success: 'cli-btn-success',
      warning: 'cli-btn-warning',
      danger: 'cli-btn-danger',
      info: 'cli-btn-info',
    };
    return variants[this.variant];
  }

  private getSizeClass(): string {
    const sizes: Record<ButtonSize, string> = {
      sm: 'cli-btn-sm',
      md: '',
      lg: 'cli-btn-lg',
    };
    return sizes[this.size];
  }

  private handleClick = () => {
    if (!this.disabled) {
      this.cliClick.emit();
    }
  };

  private handleMouseEnter = () => {
    if (this.commandSegment) {
      this.cliHover.emit({
        segment: this.commandSegment,
        compatible: !this.disabled,
      });
    }
  };

  private handleMouseLeave = () => {
    this.cliHover.emit({ segment: '', compatible: true });
  };

  render() {
    const classes = ['cli-btn', this.getVariantClass(), this.getSizeClass()].filter(Boolean).join(' ');

    return (
      <button
        type="button"
        class={classes}
        disabled={this.disabled}
        title={this.tooltip}
        onClick={this.handleClick}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        data-segment={this.commandSegment}
        data-compatible={this.compatibleWith?.join(',')}
      >
        <slot></slot>
      </button>
    );
  }
}
