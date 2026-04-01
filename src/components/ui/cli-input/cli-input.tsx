import { Component, h, Prop, Event, type EventEmitter, State } from '@stencil/core';

@Component({
  tag: 'cli-input',
  styleUrl: 'cli-input.css',
  scoped: true,
})
export class CliInput {
  @Prop() value = '';
  @Prop() placeholder = '';
  @Prop() type: 'text' | 'password' | 'number' | 'url' | 'email' = 'text';
  @Prop() validator?: (value: string) => { valid: boolean; message?: string };
  @Prop() tooltip?: string;
  @Prop() commandSegment?: string;
  @Prop() monospace = false;

  @Event() valueChange: EventEmitter<string>;
  @Event() validationChange: EventEmitter<{ valid: boolean; message?: string }>;
  @Event() cliHover: EventEmitter<{ segment: string }>;

  @State() isValid = true;
  @State() errorMessage = '';
  @State() isFocused = false;

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;

    this.valueChange.emit(newValue);

    if (this.validator) {
      const result = this.validator(newValue);
      this.isValid = result.valid;
      this.errorMessage = result.message || '';
      this.validationChange.emit(result);
    }
  };

  private handleFocus = () => {
    this.isFocused = true;
    if (this.commandSegment) {
      this.cliHover.emit({ segment: this.commandSegment });
    }
  };

  private handleBlur = () => {
    this.isFocused = false;
    this.cliHover.emit({ segment: '' });
  };

  render() {
    const classes = ['cli-input', !this.isValid && 'cli-input-invalid', this.isFocused && 'cli-input-focused', this.monospace && 'cli-input-mono'].filter(Boolean).join(' ');

    return (
      <div class="cli-input-wrapper">
        <input
          type={this.type}
          class={classes}
          value={this.value}
          placeholder={this.placeholder}
          title={this.tooltip}
          onInput={this.handleInput}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          data-segment={this.commandSegment}
        />
        {!this.isValid && this.errorMessage && <div class="cli-input-error">{this.errorMessage}</div>}
      </div>
    );
  }
}
