// yabai-personal.ts
// Personal yabai + Hammerspoon (wm-stack) configuration from ~/dotfiles/
// Pure data — no rendering logic.

export interface HsBinding {
  keys: string;
  action: string;
  mode?: string;
  group: string;
}

export interface HsMode {
  name: string;
  entryKeys: string;
  color: string;
  description: string;
}

export interface HsModeItem {
  keys: string;
  action: string;
}

// Modal entry points
export const HS_MODES: HsMode[] = [
  { name: 'Resize', entryKeys: '⌃ ⌥ R', color: '#FF6600', description: 'Resize focused window edges' },
  { name: 'Move', entryKeys: '⌃ ⌥ M', color: '#00FF66', description: 'Move focused window on screen or to display' },
  { name: 'Layout', entryKeys: '⌃ ⌥ B', color: '#6ea8fe', description: 'Build custom multi-pane layouts with templates' },
];

// Resize mode bindings
export const HS_RESIZE_ITEMS: HsModeItem[] = [
  { keys: 'H/J/K/L', action: 'Expand edge (left/down/up/right)' },
  { keys: '⇧ H/J/K/L', action: 'Shrink edge' },
  { keys: '⌃ H/J/K/L', action: 'Big expand (large step)' },
  { keys: '⌥ H/J/K/L', action: 'Snap edge to screen boundary' },
  { keys: '=', action: 'Grow all edges' },
  { keys: '-', action: 'Shrink all edges' },
  { keys: 'F', action: 'Fill screen' },
  { keys: 'V', action: 'Center 50%' },
  { keys: 'M', action: 'Switch to Move mode' },
  { keys: 'Escape', action: 'Exit mode' },
];

// Move mode bindings
export const HS_MOVE_ITEMS: HsModeItem[] = [
  { keys: 'H/J/K/L', action: 'Nudge window (small step)' },
  { keys: '⇧ H/J/K/L', action: 'Large nudge' },
  { keys: '⌥ H/J/K/L', action: 'Snap edge to nearest boundary' },
  { keys: '7 8 9', action: 'Position: top-left / top / top-right' },
  { keys: '4 5 6', action: 'Position: left / center / right' },
  { keys: '1 2 3', action: 'Position: bot-left / bottom / bot-right' },
  { keys: '0', action: 'Fill screen' },
  { keys: 'Q W E', action: 'Thirds: left / center / right' },
  { keys: 'A D', action: 'Two-thirds: left / right' },
  { keys: 'C X V', action: 'Center / horizontal half / vertical half' },
  { keys: 'G', action: 'Center 50%' },
  { keys: 'N P', action: 'Move to next / previous display' },
  { keys: 'R', action: 'Switch to Resize mode' },
  { keys: 'Escape', action: 'Exit mode' },
];

// Layout builder mode bindings
export const HS_LAYOUT_ITEMS: HsModeItem[] = [
  { keys: '1', action: 'Template: 2x2 grid' },
  { keys: '2', action: 'Template: split (2-pane)' },
  { keys: '3', action: 'Template: T-top' },
  { keys: '4', action: 'Template: stack' },
  { keys: '5', action: 'Template: T-bottom' },
  { keys: 'H/J/K/L', action: 'Focus pane (home row)' },
  { keys: 'A-Z / AA..', action: 'Assign window by hint label' },
  { keys: '/', action: 'Gather windows by fuzzy title search' },
  { keys: 'Tab / ⇧Tab', action: 'Next / previous pane' },
  { keys: '⇧S', action: 'Toggle pane stack' },
  { keys: 'Return', action: 'Done / apply layout' },
  { keys: 'Escape', action: 'Cancel (removes new space in template phase)' },
];

// Global Hammerspoon bindings (outside modes)
export const HS_GLOBAL_BINDINGS: HsBinding[] = [
  { keys: '⌃ ⌥ R', action: 'Enter Resize mode', group: 'Modes' },
  { keys: '⌃ ⌥ M', action: 'Enter Move mode', group: 'Modes' },
  { keys: '⌃ ⌥ B', action: 'Enter Layout Builder mode', group: 'Modes' },
  { keys: '⌃ ⌥ ⇧ G', action: 'Gather all windows to current space', group: 'Window Management' },
];

export const HS_SETTINGS = {
  framework: 'Hammerspoon with ModalMgr Spoon',
  wmStack: '~/dotfiles/wm-stack/ (modular Lua)',
  animationDuration: 0,
  minWindowSize: '100×100 px',
  features: [
    'Modal window management (resize/move/layout)',
    'Space picker',
    'Stackline (window stacking indicators)',
    'Toast notifications',
    'Dashboard',
    'Cheatsheet overlay',
    'Action log',
    'Taskwarrior integration',
  ],
};
