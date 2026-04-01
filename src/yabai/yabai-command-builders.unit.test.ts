import { describe, expect, it } from 'vitest';
import { buildQueryCommand, buildRuleCommand, buildSignalCommand } from './yabai-command-builders';

describe('yabai command builders', () => {
  it('builds query commands with normalized properties', () => {
    expect(
      buildQueryCommand({
        domain: 'windows',
        properties: ' id, title , app ',
        argumentType: 'space',
        argumentValue: 'next',
      }),
    ).toBe('yabai -m query --windows id,title,app --space next');

    expect(
      buildQueryCommand({
        domain: 'windows',
        argumentType: 'window',
      }),
    ).toBe('yabai -m query --windows --window');
  });

  it('builds rule commands with filters, routing, and one-shot mode', () => {
    expect(
      buildRuleCommand({
        label: 'dialog rule',
        app: '^Finder$',
        title: 'Preferences Panel',
        space: 'code',
        spaceFollowFocus: true,
        manage: 'off',
        sticky: 'on',
        subLayer: 'above',
        oneShot: true,
      }),
    ).toBe('yabai -m rule --add --one-shot label="dialog rule" app="^Finder\\$" title="Preferences Panel" space=^code manage=off sticky=on sub-layer=above');

    expect(
      buildRuleCommand(
        {
          app: '^Music$',
          scratchpad: 'player',
        },
        'apply',
      ),
    ).toBe('yabai -m rule --apply app="^Music\\$" scratchpad=player');
  });

  it('builds signal commands with filters and actions', () => {
    expect(
      buildSignalCommand({
        event: 'window_focused',
        label: 'flash focus',
        title: 'Picture in Picture',
        titleNegated: true,
        active: 'yes',
        action: 'yabai -m window --opacity 0.1',
      }),
    ).toBe('yabai -m signal --add event=window_focused action="yabai -m window --opacity 0.1" label="flash focus" title!="Picture in Picture" active=yes');
  });
});
