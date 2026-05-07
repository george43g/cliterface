export interface KeyBinding {
  keys: string;
  description: string;
  widget?: string;
  category?: string;
}

export interface KeyBindingGroup {
  title: string;
  bindings: KeyBinding[];
}

export const emacsBindings: KeyBindingGroup[] = [
  {
    title: 'Navigation',
    bindings: [
      { keys: 'Ctrl+A', description: 'Move to beginning of line', widget: 'beginning-of-line' },
      { keys: 'Ctrl+E', description: 'Move to end of line', widget: 'end-of-line' },
      { keys: 'Ctrl+F', description: 'Move forward one character', widget: 'forward-char' },
      { keys: 'Ctrl+B', description: 'Move backward one character', widget: 'backward-char' },
      { keys: 'Alt+F', description: 'Move forward one word', widget: 'forward-word' },
      { keys: 'Alt+B', description: 'Move backward one word', widget: 'backward-word' },
      { keys: 'Ctrl+XX', description: 'Toggle between beginning of line and current position', widget: 'exchange-point-and-mark' },
    ],
  },
  {
    title: 'Editing',
    bindings: [
      { keys: 'Ctrl+D', description: 'Delete character under cursor (or logout if line empty)', widget: 'delete-char-or-list' },
      { keys: 'Ctrl+H / Backspace', description: 'Delete character before cursor', widget: 'backward-delete-char' },
      { keys: 'Ctrl+W', description: 'Delete word before cursor', widget: 'backward-kill-word' },
      { keys: 'Alt+D', description: 'Delete word after cursor', widget: 'kill-word' },
      { keys: 'Ctrl+K', description: 'Kill from cursor to end of line', widget: 'kill-line' },
      { keys: 'Ctrl+U', description: 'Kill from cursor to beginning of line', widget: 'backward-kill-line' },
      { keys: 'Ctrl+Y', description: 'Yank (paste) most recently killed text', widget: 'yank' },
      { keys: 'Alt+Y', description: 'Yank previous killed text (cycle through kill ring)', widget: 'yank-pop' },
      { keys: 'Ctrl+T', description: 'Transpose characters', widget: 'transpose-chars' },
      { keys: 'Alt+T', description: 'Transpose words', widget: 'transpose-words' },
      { keys: 'Alt+U', description: 'Uppercase word', widget: 'up-case-word' },
      { keys: 'Alt+L', description: 'Lowercase word', widget: 'down-case-word' },
      { keys: 'Alt+C', description: 'Capitalize word', widget: 'capitalize-word' },
      { keys: 'Ctrl+/', description: 'Undo', widget: 'undo' },
      { keys: 'Alt+.', description: 'Insert last argument of previous command', widget: 'insert-last-word' },
      { keys: 'Alt+_', description: 'Insert last argument of previous command', widget: 'insert-last-word' },
    ],
  },
  {
    title: 'History',
    bindings: [
      { keys: 'Ctrl+P', description: 'Previous command in history', widget: 'up-line-or-history' },
      { keys: 'Ctrl+N', description: 'Next command in history', widget: 'down-line-or-history' },
      { keys: 'Ctrl+R', description: 'Reverse incremental history search', widget: 'history-incremental-search-backward' },
      { keys: 'Ctrl+S', description: 'Forward incremental history search', widget: 'history-incremental-search-forward' },
      { keys: 'Alt+P', description: 'Search backward in history for string before cursor', widget: 'history-search-backward' },
      { keys: 'Alt+N', description: 'Search forward in history for string before cursor', widget: 'history-search-forward' },
      { keys: 'Up Arrow', description: 'Previous command (or search with prefix)', widget: 'up-line-or-history' },
      { keys: 'Down Arrow', description: 'Next command (or search with prefix)', widget: 'down-line-or-history' },
    ],
  },
  {
    title: 'Completion',
    bindings: [
      { keys: 'Tab', description: 'Expand or complete', widget: 'expand-or-complete' },
      { keys: 'Shift+Tab', description: 'Reverse menu completion', widget: 'reverse-menu-complete' },
      { keys: 'Ctrl+I', description: 'Expand or complete (same as Tab)', widget: 'expand-or-complete' },
      { keys: 'Alt+/', description: 'File name expansion', widget: '_expand_alias' },
      { keys: 'Ctrl+X Ctrl+F', description: 'File name list', widget: '_list_files' },
    ],
  },
  {
    title: 'Control',
    bindings: [
      { keys: 'Ctrl+C', description: 'Interrupt (SIGINT) — cancel current command', widget: 'send-break' },
      { keys: 'Ctrl+Z', description: 'Suspend (SIGTSTP) — background current process', widget: 'push-line' },
      { keys: 'Ctrl+L', description: 'Clear screen', widget: 'clear-screen' },
      { keys: 'Ctrl+G', description: 'Abort current edit / send-break', widget: 'send-break' },
      { keys: 'Ctrl+J / Enter', description: 'Accept and execute line', widget: 'accept-line' },
      { keys: 'Ctrl+O', description: 'Accept line and fetch next history entry', widget: 'accept-line-and-down-history' },
      { keys: 'Ctrl+Q', description: 'Push line onto stack (save for later)', widget: 'push-line' },
      { keys: 'Alt+Q', description: 'Push input onto buffer stack', widget: 'push-input' },
    ],
  },
];

export const viBindings: KeyBindingGroup[] = [
  {
    title: 'Normal Mode — Navigation',
    bindings: [
      { keys: 'h', description: 'Move left one character', category: 'normal' },
      { keys: 'l', description: 'Move right one character', category: 'normal' },
      { keys: 'w', description: 'Move forward one word', category: 'normal' },
      { keys: 'b', description: 'Move backward one word', category: 'normal' },
      { keys: 'e', description: 'Move to end of word', category: 'normal' },
      { keys: '0', description: 'Move to beginning of line', category: 'normal' },
      { keys: '$', description: 'Move to end of line', category: 'normal' },
      { keys: '^', description: 'Move to first non-whitespace character', category: 'normal' },
    ],
  },
  {
    title: 'Normal Mode — Editing',
    bindings: [
      { keys: 'x', description: 'Delete character under cursor', category: 'normal' },
      { keys: 'X', description: 'Delete character before cursor', category: 'normal' },
      { keys: 'dw', description: 'Delete word', category: 'normal' },
      { keys: 'dd / D', description: 'Delete to end of line', category: 'normal' },
      { keys: 'd0', description: 'Delete to beginning of line', category: 'normal' },
      { keys: 'cw', description: 'Change word', category: 'normal' },
      { keys: 'cc / C', description: 'Change to end of line (re-enter insert mode)', category: 'normal' },
      { keys: 'yy / Y', description: 'Yank (copy) line', category: 'normal' },
      { keys: 'p', description: 'Paste after cursor', category: 'normal' },
      { keys: 'P', description: 'Paste before cursor', category: 'normal' },
      { keys: 'u', description: 'Undo', category: 'normal' },
      { keys: 'r', description: 'Replace character', category: 'normal' },
      { keys: '.', description: 'Repeat last change', category: 'normal' },
    ],
  },
  {
    title: 'Mode Switching',
    bindings: [
      { keys: 'Esc', description: 'Enter normal mode from insert mode', category: 'mode' },
      { keys: 'i', description: 'Enter insert mode before cursor', category: 'mode' },
      { keys: 'a', description: 'Enter insert mode after cursor', category: 'mode' },
      { keys: 'I', description: 'Enter insert mode at beginning of line', category: 'mode' },
      { keys: 'A', description: 'Enter insert mode at end of line', category: 'mode' },
      { keys: 'v', description: 'Enter visual mode (select characters)', category: 'mode' },
      { keys: 'V', description: 'Enter visual line mode', category: 'mode' },
    ],
  },
  {
    title: 'History (both modes)',
    bindings: [
      { keys: 'Ctrl+R', description: 'Reverse history search (insert mode)', category: 'history' },
      { keys: 'k / Up', description: 'Previous command (normal mode)', category: 'history' },
      { keys: 'j / Down', description: 'Next command (normal mode)', category: 'history' },
      { keys: '/', description: 'Search history backward (normal mode)', category: 'history' },
      { keys: '?', description: 'Search history forward (normal mode)', category: 'history' },
      { keys: 'n', description: 'Repeat search (same direction)', category: 'history' },
      { keys: 'N', description: 'Repeat search (opposite direction)', category: 'history' },
    ],
  },
];

export const bindkeyExamples: { code: string; description: string }[] = [
  { code: 'bindkey -e', description: 'Switch to emacs key bindings' },
  { code: 'bindkey -v', description: 'Switch to vi key bindings' },
  { code: "bindkey '^R' history-incremental-search-backward", description: 'Bind Ctrl+R to history search' },
  { code: "bindkey '^[.' insert-last-word", description: 'Bind Alt+. to insert last word' },
  { code: "bindkey '^[[A' history-search-backward", description: 'Bind Up arrow to history search with prefix' },
  { code: "bindkey '^[[B' history-search-forward", description: 'Bind Down arrow to history search with prefix' },
  { code: 'bindkey', description: 'List all current key bindings' },
  { code: 'bindkey -l', description: 'List all keymaps' },
  { code: 'bindkey -M emacs', description: 'Show emacs keymap bindings' },
  { code: 'bindkey -M vicmd', description: 'Show vi command mode bindings' },
  { code: 'bindkey -M viins', description: 'Show vi insert mode bindings' },
];
