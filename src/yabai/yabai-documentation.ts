import { registerToolTips, type ManPageData } from '../utils/tooltip-registry';

/**
 * Yabai documentation and tooltip registry
 */

export function registerYabaiDocumentation(): void {
  // Query commands
  registerToolTips('yabai', {
    query: {
      title: 'Query Commands',
      description: 'Retrieve information about displays, spaces, and windows',
      examples: ['yabai -m query --displays', 'yabai -m query --windows --space 1'],
    },
    'query.displays': {
      title: 'Query Displays',
      description: 'Get information about connected displays/monitors',
      examples: ['yabai -m query --displays', 'yabai -m query --displays --display 1'],
    },
    'query.spaces': {
      title: 'Query Spaces',
      description: 'Get information about mission control spaces',
      examples: ['yabai -m query --spaces', 'yabai -m query --spaces --display 1'],
    },
    'query.windows': {
      title: 'Query Windows',
      description: 'Get information about application windows',
      examples: ['yabai -m query --windows', 'yabai -m query --windows --space 2'],
    },

    // Window commands
    window: {
      title: 'Window Management',
      description: 'Control and manipulate application windows',
      examples: ['yabai -m window --focus next', 'yabai -m window --toggle float'],
    },
    'window.focus': {
      title: 'Focus Window',
      description: 'Change focus to a different window',
      examples: ['yabai -m window --focus next', 'yabai -m window --focus prev', 'yabai -m window --focus recent'],
    },
    'window.move': {
      title: 'Move Window',
      description: 'Move window to a different space or display',
      examples: ['yabai -m window --space 2', 'yabai -m window --display 1'],
    },
    'window.toggle': {
      title: 'Toggle Window Properties',
      description: 'Toggle window states like float, sticky, zoom, etc.',
      examples: ['yabai -m window --toggle float', 'yabai -m window --toggle sticky'],
    },

    // Space commands
    space: {
      title: 'Space Management',
      description: 'Control mission control spaces (desktops)',
      examples: ['yabai -m space --focus next', 'yabai -m space --create'],
    },
    'space.focus': {
      title: 'Focus Space',
      description: 'Switch to a different space',
      examples: ['yabai -m space --focus 1', 'yabai -m space --focus prev', 'yabai -m space --focus next'],
    },
    'space.create': {
      title: 'Create Space',
      description: 'Create a new mission control space',
      examples: ['yabai -m space --create', 'yabai -m space --create 2'],
    },
    'space.destroy': {
      title: 'Destroy Space',
      description: 'Remove a mission control space',
      examples: ['yabai -m space --destroy', 'yabai -m space 2 --destroy'],
      seeAlso: ['space.focus', 'space.create'],
    },

    // Display commands
    display: {
      title: 'Display Management',
      description: 'Control connected displays/monitors',
      examples: ['yabai -m display --focus next', 'yabai -m display --focus 1'],
    },

    // Config
    config: {
      title: 'Configuration',
      description: 'Get or set yabai configuration options',
      examples: ['yabai -m config window_border on', 'yabai -m config layout bsp'],
    },

    // Rules
    rule: {
      title: 'Window Rules',
      description: 'Define automatic window behavior rules',
      examples: ['yabai -m rule --add app=\"Safari\" manage=off'],
    },
    'rule.add': {
      title: 'Add Rule',
      description: 'Add a new window management rule',
      examples: ['yabai -m rule --add app=\"Firefox\" space=2'],
    },
    'rule.remove': {
      title: 'Remove Rule',
      description: 'Remove an existing rule by index or label',
      examples: ['yabai -m rule --remove 0'],
    },

    // Signals
    signal: {
      title: 'Event Signals',
      description: 'Subscribe to window manager events',
      examples: ['yabai -m signal --add event=window_focused action=\"echo focused\"'],
    },
  });
}

export const yabaiManPage: ManPageData = {
  name: 'yabai',
  synopsis: 'yabai [command] [options]',
  description: `yabai is a tiling window manager for macOS based on binary space partitioning.

It provides powerful window management features including:
- Automatic window tiling using BSP (Binary Space Partitioning)
- Customizable gaps and padding
- Multi-monitor support
- Window rules and signals
- Mission Control integration
- Scripting through CLI commands

Note: Some features require disabling System Integrity Protection (SIP) for the scripting addition.`,
  sections: [
    {
      title: 'Query Commands',
      content: `The query domain is used to retrieve information about the current state.

Available queries:
  --displays    List all connected displays
  --spaces      List all mission control spaces
  --windows     List all managed windows
  
Modifiers:
  --display <id>     Filter by display
  --space <id>       Filter by space
  --window <id>      Filter by window`,
    },
    {
      title: 'Window Commands',
      content: `Control individual windows.

Actions:
  --focus <selector>    Focus a window
  --swap <selector>     Swap position with another window
  --warp <selector>     Warp window into another container
  --toggle <property>   Toggle window property
  --close               Close the window
  --minimize            Minimize the window
  
Toggle properties:
  float, sticky, pip, shadow, split, zoom-parent, zoom-fullscreen, native-fullscreen`,
    },
    {
      title: 'Space Commands',
      content: `Control mission control spaces.

Actions:
  --focus <selector>    Focus a space
  --create [display]    Create a new space
  --destroy [selector]  Remove a space
  --move <selector>     Move space order
  --swap <selector>     Swap spaces
  --display <selector>  Move space to display
  --balance [axis]      Balance tree
  --mirror <axis>       Mirror tree
  --rotate <angle>      Rotate tree (90/180/270)`,
    },
  ],
  examples: [
    { command: 'yabai -m query --windows --space 1', description: 'List all windows on space 1' },
    { command: 'yabai -m window --focus next', description: 'Focus next window' },
    { command: 'yabai -m window --toggle float', description: 'Toggle floating for focused window' },
    { command: 'yabai -m space --create', description: 'Create new space' },
    { command: 'yabai -m config layout bsp', description: 'Set layout to BSP' },
    { command: 'yabai -m rule --add app="Finder" manage=off', description: "Don't manage Finder windows" },
  ],
};

export function getYabaiManPage(): ManPageData {
  return yabaiManPage;
}
