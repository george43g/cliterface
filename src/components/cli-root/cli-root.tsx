import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'cli-root',
  scoped: true,
})
export class CliRoot {
  @State() command = 'yabai --help';

  render() {
    return (
      <div class="cli-root">
        <h1>CLI GUI</h1>
        <input value={this.command} onInput={(e: Event) => (this.command = (e.target as HTMLInputElement).value)} placeholder="Enter command..." />
        <button type="button" onClick={() => this.run()}>
          Run
        </button>
        <pre class="output">{this.command}</pre>
      </div>
    );
  }

  async run() {
    console.log('execute:', this.command);
  }
}
