import { Component, h, Prop } from '@stencil/core';

export type CardVariant = 'default' | 'accent' | 'warning' | 'danger' | 'info';

@Component({
  tag: 'cli-card',
  styleUrl: 'cli-card.css',
  scoped: true,
})
export class CliCard {
  @Prop() cardTitle?: string;
  @Prop() badge?: string;
  @Prop() badgeType: 'sip' | 'safe' | 'default' = 'default';
  @Prop() variant: CardVariant = 'default';
  @Prop() clickable = false;
  @Prop() fullWidth = false;

  private getVariantClass(): string {
    const variants: Record<CardVariant, string> = {
      default: '',
      accent: 'cli-card-accent',
      warning: 'cli-card-warning',
      danger: 'cli-card-danger',
      info: 'cli-card-info',
    };
    return variants[this.variant];
  }

  render() {
    const classes = ['cli-card', this.getVariantClass(), this.clickable && 'cli-card-clickable', this.fullWidth && 'cli-card-full'].filter(Boolean).join(' ');

    return (
      <div class={classes}>
        {(this.cardTitle || this.badge) && (
          <div class="cli-card-header">
            {this.cardTitle && <h3 class="cli-card-title">{this.cardTitle}</h3>}
            {this.badge && <span class={`cli-card-badge cli-card-badge-${this.badgeType}`}>{this.badge}</span>}
          </div>
        )}
        <div class="cli-card-content">
          <slot></slot>
        </div>
      </div>
    );
  }
}
