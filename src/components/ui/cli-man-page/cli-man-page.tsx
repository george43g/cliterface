import { Component, h, Prop, State } from '@stencil/core';

export interface ManPageSection {
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

export interface ManPageContent {
  name: string;
  synopsis: string;
  description: string;
  sections: ManPageSection[];
  examples: { command: string; description: string }[];
}

@Component({
  tag: 'cli-man-page',
  styleUrl: 'cli-man-page.css',
  scoped: true,
})
export class CliManPage {
  @Prop() content?: ManPageContent;
  @Prop() searchQuery = '';

  @State() activeSection: string | null = null;
  @State() expandedSections: Set<string> = new Set();

  private toggleSection(title: string) {
    const newExpanded = new Set(this.expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    this.expandedSections = newExpanded;
  }

  private highlightMatch(text: string): string {
    if (!this.searchQuery) return text;
    const regex = new RegExp(`(${this.searchQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  render() {
    if (!this.content) {
      return (
        <div class="cli-man-page">
          <div class="cli-man-empty">
            <p>No documentation available</p>
          </div>
        </div>
      );
    }

    return (
      <div class="cli-man-page">
        <header class="cli-man-header">
          <h1 class="cli-man-title">{this.content.name}</h1>
          <div class="cli-man-synopsis">
            <span class="cli-man-label">SYNOPSIS</span>
            <code class="cli-man-code">{this.content.synopsis}</code>
          </div>
        </header>

        <section class="cli-man-description">
          <p innerHTML={this.highlightMatch(this.content.description)}></p>
        </section>

        <div class="cli-man-sections">
          {this.content.sections.map(section => (
            <div key={section.title} class={`cli-man-section ${this.expandedSections.has(section.title) ? 'cli-man-section-expanded' : ''}`}>
              <button type="button" class="cli-man-section-header" onClick={() => this.toggleSection(section.title)}>
                <span class="cli-man-section-title">{section.title}</span>
                <span class="cli-man-section-toggle">{this.expandedSections.has(section.title) ? '−' : '+'}</span>
              </button>

              {this.expandedSections.has(section.title) && (
                <div class="cli-man-section-content">
                  <div class="cli-man-text" innerHTML={this.highlightMatch(section.content)}></div>

                  {section.subsections?.map(sub => (
                    <div key={sub.title} class="cli-man-subsection">
                      <h4 class="cli-man-subsection-title">{sub.title}</h4>
                      <div class="cli-man-text" innerHTML={this.highlightMatch(sub.content)}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {this.content.examples.length > 0 && (
          <section class="cli-man-examples">
            <h3 class="cli-man-examples-title">EXAMPLES</h3>
            <div class="cli-man-examples-list">
              {this.content.examples.map((example, index) => (
                <div key={index} class="cli-man-example">
                  <code class="cli-man-example-code">{example.command}</code>
                  <p class="cli-man-example-desc">{example.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }
}
