import { Component, h, Prop, Event, type EventEmitter, State } from '@stencil/core';

export interface CommandSegment {
  text: string;
  description: string;
  type: 'command' | 'flag' | 'argument' | 'value' | 'separator';
  compatible: boolean;
}

@Component({
  tag: 'cli-command-preview',
  styleUrl: 'cli-command-preview.css',
  scoped: true,
})
export class CliCommandPreview {
  @Prop() command = '';
  @Prop() segments: CommandSegment[] = [];
  @Prop() showExplanation = true;
  @Prop() highlightedSegment?: string;

  @Event() segmentHover: EventEmitter<{ segment: CommandSegment; index: number }>;
  @Event() segmentLeave: EventEmitter<void>;

  @State() hoveredIndex = -1;

  private handleSegmentHover = (segment: CommandSegment, index: number) => {
    this.hoveredIndex = index;
    this.segmentHover.emit({ segment, index });
  };

  private handleSegmentLeave = () => {
    this.hoveredIndex = -1;
    this.segmentLeave.emit();
  };

  private getSegmentClass(segment: CommandSegment, index: number): string {
    const classes = ['cli-segment', `cli-segment-${segment.type}`];

    if (index === this.hoveredIndex) {
      classes.push('cli-segment-highlighted');
    }

    if (!segment.compatible) {
      classes.push('cli-segment-incompatible');
    }

    return classes.join(' ');
  }

  render() {
    const displaySegments = this.segments.length > 0 ? this.segments : [{ text: this.command, description: 'Full command', type: 'command' as const, compatible: true }];

    return (
      <div class="cli-command-preview">
        <div class="cli-command-line">
          {displaySegments.map((segment, index) => (
            <span
              key={index}
              class={this.getSegmentClass(segment, index)}
              title={segment.description}
              onMouseEnter={() => this.handleSegmentHover(segment, index)}
              onMouseLeave={this.handleSegmentLeave}
              data-segment-index={index}
            >
              {segment.text}
            </span>
          ))}
        </div>

        {this.showExplanation && this.hoveredIndex >= 0 && (
          <div class="cli-command-explanation">
            <div class="cli-explanation-content">
              <span class={`cli-explanation-type cli-explanation-type-${displaySegments[this.hoveredIndex].type}`}>{displaySegments[this.hoveredIndex].type}</span>
              <p class="cli-explanation-text">{displaySegments[this.hoveredIndex].description}</p>
              {!displaySegments[this.hoveredIndex].compatible && <span class="cli-explanation-warning">⚠️ Not compatible with current selection</span>}
            </div>
          </div>
        )}
      </div>
    );
  }
}
