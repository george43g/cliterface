/**
 * tmux keybindings cheatsheet data
 * Default keybindings for tmux 3.x (prefix: Ctrl+b)
 *
 * Design note: `customBindings` is left as an injectable hook so that
 * user-defined dotfile keybindings can be loaded later (e.g. from a
 * local file picker or a future dotfile-reader service).
 */

export interface TmuxKeybinding {
  key: string;
  description: string;
  category: string;
  isPrefix?: boolean; // key needs prefix (Ctrl+b) before it
}

export interface TmuxKeyCategory {
  id: string;
  label: string;
  bindings: TmuxKeybinding[];
}

export const DEFAULT_PREFIX = 'Ctrl+b';

export const tmuxKeybindingCategories: TmuxKeyCategory[] = [
  {
    id: 'sessions',
    label: 'Sessions',
    bindings: [
      { key: 'd', description: 'Detach from current session', category: 'sessions', isPrefix: true },
      { key: '$', description: 'Rename current session', category: 'sessions', isPrefix: true },
      { key: 's', description: 'List/choose sessions interactively', category: 'sessions', isPrefix: true },
      { key: '(', description: 'Switch to previous session', category: 'sessions', isPrefix: true },
      { key: ')', description: 'Switch to next session', category: 'sessions', isPrefix: true },
      { key: 'L', description: 'Switch to last (most recently used) session', category: 'sessions', isPrefix: true },
      { key: 'D', description: 'Choose a client to detach', category: 'sessions', isPrefix: true },
      { key: '$', description: 'Rename current session', category: 'sessions', isPrefix: true },
    ],
  },
  {
    id: 'windows',
    label: 'Windows',
    bindings: [
      { key: 'c', description: 'Create a new window', category: 'windows', isPrefix: true },
      { key: '&', description: 'Kill the current window (with confirm)', category: 'windows', isPrefix: true },
      { key: ',', description: 'Rename current window', category: 'windows', isPrefix: true },
      { key: 'n', description: 'Move to next window', category: 'windows', isPrefix: true },
      { key: 'p', description: 'Move to previous window', category: 'windows', isPrefix: true },
      { key: 'l', description: 'Move to previously selected window', category: 'windows', isPrefix: true },
      { key: 'w', description: 'Choose current window interactively', category: 'windows', isPrefix: true },
      { key: '0–9', description: 'Select window by number', category: 'windows', isPrefix: true },
      { key: "'", description: 'Prompt for window index to select', category: 'windows', isPrefix: true },
      { key: '.', description: 'Prompt for index to move current window', category: 'windows', isPrefix: true },
      { key: 'f', description: 'Prompt to search for text in open windows', category: 'windows', isPrefix: true },
      { key: 'i', description: 'Display info about the current window', category: 'windows', isPrefix: true },
      { key: 'Space', description: 'Arrange window in next preset layout', category: 'windows', isPrefix: true },
      { key: 'M-1 to M-7', description: 'Arrange panes in preset layouts', category: 'windows', isPrefix: true },
    ],
  },
  {
    id: 'panes',
    label: 'Panes',
    bindings: [
      { key: '"', description: 'Split pane horizontally (top/bottom)', category: 'panes', isPrefix: true },
      { key: '%', description: 'Split pane vertically (left/right)', category: 'panes', isPrefix: true },
      { key: 'x', description: 'Kill current pane (with confirm)', category: 'panes', isPrefix: true },
      { key: '!', description: 'Break pane into its own window', category: 'panes', isPrefix: true },
      { key: 'o', description: 'Select next pane', category: 'panes', isPrefix: true },
      { key: ';', description: 'Move to previously active pane', category: 'panes', isPrefix: true },
      { key: 'q', description: 'Briefly display pane indexes', category: 'panes', isPrefix: true },
      { key: 'z', description: 'Toggle zoom state of current pane', category: 'panes', isPrefix: true },
      { key: '{', description: 'Swap pane with previous pane', category: 'panes', isPrefix: true },
      { key: '}', description: 'Swap pane with next pane', category: 'panes', isPrefix: true },
      { key: 'C-o', description: 'Rotate panes in current window forwards', category: 'panes', isPrefix: true },
      { key: 'M-o', description: 'Rotate panes in current window backwards', category: 'panes', isPrefix: true },
      { key: 'm', description: 'Mark current pane', category: 'panes', isPrefix: true },
      { key: 'M', description: 'Clear the marked pane', category: 'panes', isPrefix: true },
      { key: 'Arrow keys', description: 'Select pane in direction (Up/Down/Left/Right)', category: 'panes', isPrefix: true },
      { key: 'C-Arrow', description: 'Resize pane by 1 cell', category: 'panes', isPrefix: true },
      { key: 'M-Arrow', description: 'Resize pane by 5 cells', category: 'panes', isPrefix: true },
    ],
  },
  {
    id: 'copy-mode',
    label: 'Copy Mode',
    bindings: [
      { key: '[', description: 'Enter copy mode', category: 'copy-mode', isPrefix: true },
      { key: ']', description: 'Paste most recently copied buffer', category: 'copy-mode', isPrefix: true },
      { key: '#', description: 'List all paste buffers', category: 'copy-mode', isPrefix: true },
      { key: '-', description: 'Delete the most recently copied buffer', category: 'copy-mode', isPrefix: true },
      { key: '=', description: 'Choose buffer to paste from list', category: 'copy-mode', isPrefix: true },
      { key: 'Page Up', description: 'Enter copy mode and scroll one page up', category: 'copy-mode', isPrefix: true },
      { key: 'q (in copy mode)', description: 'Quit copy mode', category: 'copy-mode', isPrefix: false },
      { key: 'Space (in copy mode)', description: 'Start selection (vi mode)', category: 'copy-mode', isPrefix: false },
      { key: 'Enter (in copy mode)', description: 'Copy selection', category: 'copy-mode', isPrefix: false },
      { key: '/ (in copy mode)', description: 'Search forwards', category: 'copy-mode', isPrefix: false },
      { key: '? (in copy mode)', description: 'Search backwards', category: 'copy-mode', isPrefix: false },
    ],
  },
  {
    id: 'command',
    label: 'Command / Misc',
    bindings: [
      { key: ':', description: 'Enter the tmux command prompt', category: 'command', isPrefix: true },
      { key: '?', description: 'List all key bindings', category: 'command', isPrefix: true },
      { key: 'r', description: 'Force redraw of attached client', category: 'command', isPrefix: true },
      { key: 't', description: 'Show the time', category: 'command', isPrefix: true },
      { key: '~', description: 'Show previous messages from tmux', category: 'command', isPrefix: true },
      { key: 'C-z', description: 'Suspend the tmux client', category: 'command', isPrefix: true },
      { key: 'C-b', description: 'Send the prefix key through to the application', category: 'command', isPrefix: true },
    ],
  },
];

/** Placeholder for user-customised bindings loaded at runtime */
export interface CustomKeybindingSource {
  label: string; // e.g. "~/.tmux.conf"
  categories: TmuxKeyCategory[];
}

export let customKeybindingSource: CustomKeybindingSource | null = null;

/**
 * Load custom keybindings from an external source (e.g. dotfiles).
 * Call this at runtime when you have access to a local file reader.
 */
export function loadCustomKeybindings(source: CustomKeybindingSource): void {
  customKeybindingSource = source;
}
