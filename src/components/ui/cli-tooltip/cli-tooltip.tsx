import { Component, h, Prop } from '@stencil/core';

export interface TooltipContent {
  title: string;
  description: string;
  examples?: string[];
  seeAlso?: string[];
}

@Component({
  tag: 'cli-tooltip',
  styleUrl: 'cli-tooltip.css',
  scoped: true,
})
export class CliTooltip {
  @Prop() content?: TooltipContent;
  @Prop() visible = false;
  @Prop() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

  render() {
    if (!this.visible || !this.content) return null;

    return (
      <div class={`cli-tooltip cli-tooltip-${this.position}`}>
        <div class="cli-tooltip-arrow"></div>
        <div class="cli-tooltip-content">
          <h4 class="cli-tooltip-title">{this.content.title}</h4>
          <p class="cli-tooltip-description">{this.content.description}</p>

          {this.content.examples && this.content.examples.length > 0 && (
            <div class="cli-tooltip-examples">
              <span class="cli-tooltip-label">Examples:</span>
              <ul>
                {this.content.examples.map(example => (
                  <li>
                    <code>{example}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {this.content.seeAlso && this.content.seeAlso.length > 0 && (
            <div class="cli-tooltip-see-also">
              <span class="cli-tooltip-label">See also:</span>
              <span>{this.content.seeAlso.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
