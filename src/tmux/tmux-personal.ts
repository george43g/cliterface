// tmux-personal.ts
// Personal tmux configuration extracted from ~/dotfiles/tmux/ + shell/.tmux.conf.local
// Pure data — no rendering logic.

export interface TmuxBinding {
  keys: string;
  action: string;
  group: string;
  note?: string;
}

export const TMUX_PREFIX_PRIMARY = 'C-b';
export const TMUX_PREFIX_SECONDARY = 'C-a';

export const TMUX_BINDINGS: TmuxBinding[] = [
  // --- Config management ---
  { keys: '<prefix> e', action: 'Edit .tmux.conf.local in new window (auto-reloads after save)', group: 'Config' },
  { keys: '<prefix> r', action: 'Reload tmux configuration', group: 'Config' },

  // --- Sessions ---
  { keys: '<prefix> C-c', action: 'Create new session', group: 'Sessions' },
  { keys: '<prefix> C-f', action: 'Find/switch session by name (command-prompt)', group: 'Sessions' },
  { keys: '<prefix> BTab', action: 'Switch to last (previous) session', group: 'Sessions' },

  // --- Windows ---
  { keys: '<prefix> Tab', action: 'Switch to last active window', group: 'Windows' },
  { keys: '<prefix> C-h', action: 'Select previous window (repeatable)', group: 'Windows' },
  { keys: '<prefix> C-l', action: 'Select next window (repeatable)', group: 'Windows' },
  { keys: '<prefix> C-S-H', action: 'Swap window left', group: 'Windows' },
  { keys: '<prefix> C-S-L', action: 'Swap window right', group: 'Windows' },

  // --- Panes ---
  { keys: '<prefix> -', action: 'Split pane horizontally (v split)', group: 'Panes' },
  { keys: '<prefix> _', action: 'Split pane vertically (h split)', group: 'Panes' },
  { keys: '<prefix> h', action: 'Move to left pane (repeatable)', group: 'Panes' },
  { keys: '<prefix> j', action: 'Move to pane below (repeatable)', group: 'Panes' },
  { keys: '<prefix> k', action: 'Move to pane above (repeatable)', group: 'Panes' },
  { keys: '<prefix> l', action: 'Move to right pane (repeatable)', group: 'Panes' },
  { keys: '<prefix> >', action: 'Swap pane with next', group: 'Panes' },
  { keys: '<prefix> <', action: 'Swap pane with previous', group: 'Panes' },
  { keys: '<prefix> +', action: 'Maximize current pane (toggle)', group: 'Panes' },
  { keys: '<prefix> H', action: 'Resize pane left 2 (repeatable)', group: 'Panes' },
  { keys: '<prefix> J', action: 'Resize pane down 2 (repeatable)', group: 'Panes' },
  { keys: '<prefix> K', action: 'Resize pane up 2 (repeatable)', group: 'Panes' },
  { keys: '<prefix> L', action: 'Resize pane right 2 (repeatable)', group: 'Panes' },
  { keys: '<prefix> q', action: 'Show pane numbers (then press number to jump)', group: 'Panes' },

  // --- Mouse / toggles ---
  { keys: '<prefix> m', action: 'Toggle mouse mode', group: 'Toggles' },
  { keys: 'C-l', action: 'Clear screen AND clear scrollback history (no prefix)', group: 'Toggles', note: 'Bound without prefix (-n)' },

  // --- Copy mode ---
  { keys: '<prefix> Enter', action: 'Enter copy mode', group: 'Copy' },
  { keys: 'v', action: 'Begin selection (copy mode, vi-style)', group: 'Copy' },
  { keys: 'C-v', action: 'Toggle rectangle selection (copy mode)', group: 'Copy' },
  { keys: 'y', action: 'Copy selection + exit copy mode (→ macOS clipboard)', group: 'Copy' },
  { keys: 'H', action: 'Jump to start of line (copy mode)', group: 'Copy' },
  { keys: 'L', action: 'Jump to end of line (copy mode)', group: 'Copy' },

  // --- Buffers ---
  { keys: '<prefix> b', action: 'List paste buffers', group: 'Buffers' },
  { keys: '<prefix> p', action: 'Paste from top paste buffer', group: 'Buffers' },
  { keys: '<prefix> P', action: 'Choose buffer interactively', group: 'Buffers' },

  // --- Facebook PathPicker ---
  { keys: '<prefix> F', action: 'Open Facebook PathPicker for current pane', group: 'Extras' },
];

export interface TmuxStatusSymbol {
  symbol: string;
  meaning: string;
}

export const TMUX_STATUS_SYMBOLS: TmuxStatusSymbol[] = [
  { symbol: '⌨', meaning: 'Prefix key active (U+2328)' },
  { symbol: '↗', meaning: 'Mouse mode enabled (U+2197)' },
  { symbol: '⚇', meaning: 'Pane pairing active (U+2687)' },
  { symbol: '⚏', meaning: 'Panes synchronized (via synchronized toggle)' },
  { symbol: '!', meaning: 'Running as root' },
  { symbol: '❐', meaning: 'Session name prefix in status bar' },
  { symbol: '↑', meaning: 'Uptime indicator in status-left' },
];

export interface TmuxThemeColor {
  id: string;
  hex: string;
  label: string;
}

export const TMUX_THEME_COLORS: TmuxThemeColor[] = [
  { id: '1', hex: '#080808', label: 'dark gray (bg)' },
  { id: '2', hex: '#303030', label: 'gray' },
  { id: '3', hex: '#8a8a8a', label: 'light gray' },
  { id: '4', hex: '#00afff', label: 'light blue (active)' },
  { id: '5', hex: '#ffff00', label: 'yellow (message/mode)' },
  { id: '6', hex: '#080808', label: 'dark gray' },
  { id: '7', hex: '#e4e4e4', label: 'white' },
  { id: '8', hex: '#080808', label: 'dark gray' },
  { id: '9', hex: '#ffff00', label: 'yellow (status-left bg)' },
  { id: '10', hex: '#ff00af', label: 'pink (status-left 2nd)' },
  { id: '11', hex: '#5fff00', label: 'green (status-left 3rd)' },
  { id: '12', hex: '#8a8a8a', label: 'light gray' },
  { id: '13', hex: '#e4e4e4', label: 'white' },
  { id: '14', hex: '#080808', label: 'dark gray' },
  { id: '15', hex: '#080808', label: 'dark gray' },
  { id: '16', hex: '#d70000', label: 'red (active pane sync border)' },
  { id: '17', hex: '#e4e4e4', label: 'white' },
];

export const TMUX_SETTINGS = {
  framework: 'oh-my-tmux (gpakosz/.tmux)',
  prefixes: ['C-b (default)', 'C-a (screen-compat)'],
  baseIndex: 1,
  paneBaseIndex: 1,
  historyLimit: 5000,
  repeatTime: 600,
  statusInterval: 10,
  rgb24bit: 'auto',
  newPaneRetainPath: true,
  statusLeft: '❐ #S | uptime',
  statusRight: 'prefix mouse pairing sync battery | time | user | hostname',
  terminalTitle: '#h ❐ #S ● #I #W',
};
