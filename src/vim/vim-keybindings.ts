/**
 * vim / neovim keybinding reference data
 * Used by the vim-gui learning interface.
 */

export interface KeyBinding {
  keys: string;
  description: string;
  mnemonic?: string;
  example?: string;
}

export interface KeyGroup {
  title: string;
  bindings: KeyBinding[];
}

// ── Modes ──────────────────────────────────────────────────────────────────

export interface VimMode {
  name: string;
  shortName: string;
  color: string;
  description: string;
  enterFrom: string;
  exitWith: string;
  indicator: string;
}

export const VIM_MODES: VimMode[] = [
  {
    name: 'Normal',
    shortName: 'N',
    color: '#4ecca3',
    description: 'Navigate and issue commands. The home base — always return here with <Esc>.',
    enterFrom: 'Any mode → press <Esc> (or <C-[>)',
    exitWith: 'Press i, a, v, :, R, etc.',
    indicator: 'NORMAL',
  },
  {
    name: 'Insert',
    shortName: 'I',
    color: '#4dabf7',
    description: 'Type text as you expect. Every keystroke inserts a character.',
    enterFrom: 'Normal → i (before cursor), a (after), I (line start), A (line end), o (new line below), O (above)',
    exitWith: '<Esc> or <C-[>',
    indicator: '-- INSERT --',
  },
  {
    name: 'Visual (char)',
    shortName: 'V',
    color: '#e94560',
    description: 'Select characters. Operators (d, y, c, >, <, ~) act on the selection.',
    enterFrom: 'Normal → v',
    exitWith: '<Esc> or completing an operator',
    indicator: '-- VISUAL --',
  },
  {
    name: 'Visual Line',
    shortName: 'VL',
    color: '#e94560',
    description: 'Select whole lines.',
    enterFrom: 'Normal → V (uppercase)',
    exitWith: '<Esc>',
    indicator: '-- VISUAL LINE --',
  },
  {
    name: 'Visual Block',
    shortName: 'VB',
    color: '#e94560',
    description: 'Select a rectangular block of text (great for column edits).',
    enterFrom: 'Normal → <C-v>',
    exitWith: '<Esc>',
    indicator: '-- VISUAL BLOCK --',
  },
  {
    name: 'Command-line',
    shortName: 'C',
    color: '#ffc107',
    description: 'Type ex-commands (:w, :q, :s/…/…/, etc.) or search patterns (/ and ?).',
    enterFrom: 'Normal → : / ? !',
    exitWith: '<Enter> to execute, <Esc> to cancel',
    indicator: ':',
  },
  {
    name: 'Replace',
    shortName: 'R',
    color: '#ff6b6b',
    description: 'Overwrite characters in place.',
    enterFrom: 'Normal → R',
    exitWith: '<Esc>',
    indicator: '-- REPLACE --',
  },
  {
    name: 'Terminal (nvim)',
    shortName: 'T',
    color: '#a0a0a0',
    description: 'Embedded terminal emulator (neovim only). Run shell commands inside vim.',
    enterFrom: ':terminal or :term',
    exitWith: '<C-\\><C-n> to return to Normal mode',
    indicator: '-- TERMINAL --',
  },
];

// ── Motions ────────────────────────────────────────────────────────────────

export const MOTION_GROUPS: KeyGroup[] = [
  {
    title: 'Character',
    bindings: [
      { keys: 'h', description: 'Move left', mnemonic: 'h is leftmost key' },
      { keys: 'j', description: 'Move down', mnemonic: 'j has a tail pointing down' },
      { keys: 'k', description: 'Move up' },
      { keys: 'l', description: 'Move right', mnemonic: 'l is rightmost key' },
    ],
  },
  {
    title: 'Word',
    bindings: [
      { keys: 'w', description: 'Next word start', mnemonic: 'Word' },
      { keys: 'W', description: 'Next WORD start (whitespace-delimited)' },
      { keys: 'b', description: 'Previous word start', mnemonic: 'Back' },
      { keys: 'B', description: 'Previous WORD start' },
      { keys: 'e', description: 'End of word', mnemonic: 'End' },
      { keys: 'E', description: 'End of WORD' },
      { keys: 'ge', description: 'End of previous word' },
    ],
  },
  {
    title: 'Line',
    bindings: [
      { keys: '0', description: 'Start of line (column 0)' },
      { keys: '^', description: 'First non-blank character of line' },
      { keys: '$', description: 'End of line' },
      { keys: 'g_', description: 'Last non-blank character of line' },
    ],
  },
  {
    title: 'File',
    bindings: [
      { keys: 'gg', description: 'First line of file', mnemonic: 'Go to beginning' },
      { keys: 'G', description: 'Last line of file', mnemonic: 'Go to end' },
      { keys: 'NggNGN<C-f>', description: 'Jump to line N (e.g. 42G)', example: '42G' },
      { keys: '<C-f>', description: 'Page forward (down)' },
      { keys: '<C-b>', description: 'Page backward (up)' },
      { keys: '<C-d>', description: 'Half-page down' },
      { keys: '<C-u>', description: 'Half-page up' },
    ],
  },
  {
    title: 'Find on line',
    bindings: [
      { keys: 'f{c}', description: 'Find next char c forward on line', example: 'fa' },
      { keys: 'F{c}', description: 'Find prev char c backward on line', example: 'F(' },
      { keys: 't{c}', description: 'Till next char (stop before it)', example: 'td' },
      { keys: 'T{c}', description: 'Till prev char (stop after it)' },
      { keys: ';', description: 'Repeat last f/F/t/T forward' },
      { keys: ',', description: 'Repeat last f/F/t/T backward' },
    ],
  },
  {
    title: 'Search',
    bindings: [
      { keys: '/{pattern}', description: 'Search forward', example: '/hello' },
      { keys: '?{pattern}', description: 'Search backward', example: '?TODO' },
      { keys: 'n', description: 'Next match' },
      { keys: 'N', description: 'Previous match' },
      { keys: '*', description: 'Search forward for word under cursor' },
      { keys: '#', description: 'Search backward for word under cursor' },
    ],
  },
  {
    title: 'Matching',
    bindings: [{ keys: '%', description: 'Jump to matching bracket/paren/brace' }],
  },
];

// ── Operators ─────────────────────────────────────────────────────────────

export const OPERATOR_GROUPS: KeyGroup[] = [
  {
    title: 'Change / Delete',
    bindings: [
      { keys: 'd', description: 'Delete (into default register)' },
      { keys: 'dd', description: 'Delete current line' },
      { keys: 'D', description: 'Delete from cursor to end of line' },
      { keys: 'c', description: 'Change (delete + enter Insert mode)' },
      { keys: 'cc', description: 'Change whole line' },
      { keys: 'C', description: 'Change from cursor to end of line' },
      { keys: 's', description: 'Substitute character (= cl)' },
      { keys: 'S', description: 'Substitute line (= cc)' },
      { keys: 'x', description: 'Delete character under cursor' },
      { keys: 'X', description: 'Delete character before cursor' },
    ],
  },
  {
    title: 'Yank / Paste',
    bindings: [
      { keys: 'y', description: 'Yank (copy)' },
      { keys: 'yy', description: 'Yank current line' },
      { keys: 'Y', description: 'Yank to end of line' },
      { keys: 'p', description: 'Paste after cursor' },
      { keys: 'P', description: 'Paste before cursor' },
    ],
  },
  {
    title: 'Replace / Case',
    bindings: [
      { keys: 'r{c}', description: 'Replace single character with c', example: 'rx' },
      { keys: 'R', description: 'Enter Replace mode' },
      { keys: '~', description: 'Toggle case of character' },
      { keys: 'gu', description: 'Lowercase (operator)', example: 'guiw' },
      { keys: 'gU', description: 'Uppercase (operator)', example: 'gUiw' },
      { keys: 'g~', description: 'Toggle case (operator)' },
    ],
  },
  {
    title: 'Indent',
    bindings: [
      { keys: '>', description: 'Indent right' },
      { keys: '>>', description: 'Indent current line right' },
      { keys: '<', description: 'Indent left' },
      { keys: '<<', description: 'Indent current line left' },
      { keys: '=', description: 'Auto-indent' },
      { keys: '==', description: 'Auto-indent current line' },
    ],
  },
  {
    title: 'Undo / Redo',
    bindings: [
      { keys: 'u', description: 'Undo' },
      { keys: '<C-r>', description: 'Redo' },
      { keys: 'U', description: 'Undo all changes to current line' },
      { keys: '.', description: 'Repeat last change' },
    ],
  },
];

// ── Combo examples ─────────────────────────────────────────────────────────

export interface ComboExample {
  combo: string;
  breakdown: string;
  effect: string;
}

export const COMBO_EXAMPLES: ComboExample[] = [
  { combo: 'dw', breakdown: 'd (delete) + w (word)', effect: 'Delete from cursor to next word start' },
  { combo: 'd3w', breakdown: 'd + 3 + w', effect: 'Delete 3 words forward' },
  { combo: 'c$', breakdown: 'c (change) + $ (end of line)', effect: 'Change from cursor to end of line' },
  { combo: 'y2j', breakdown: 'y (yank) + 2 + j (down)', effect: 'Yank 3 lines (current + 2 below)' },
  { combo: '>i{', breakdown: '> (indent) + i{ (inside braces)', effect: 'Indent contents of curly braces' },
  { combo: 'ciw', breakdown: 'c (change) + iw (inner word)', effect: 'Change the entire word under cursor' },
  { combo: 'da"', breakdown: 'd (delete) + a" (around quotes)', effect: 'Delete a quoted string including quotes' },
  { combo: 'yap', breakdown: 'y (yank) + ap (a paragraph)', effect: 'Yank a whole paragraph' },
  { combo: 'gUiw', breakdown: 'gU (uppercase) + iw (inner word)', effect: 'UPPERCASE the current word' },
  { combo: 'ct,', breakdown: 'c (change) + t (till) + ,', effect: 'Change text up to next comma' },
  { combo: 'vit', breakdown: 'v (visual) + it (inner tag)', effect: 'Select contents of an HTML tag' },
  { combo: '>2j', breakdown: '> (indent) + 2j', effect: 'Indent 3 lines (current + 2 below)' },
  { combo: 'dgg', breakdown: 'd + gg (file start)', effect: 'Delete from cursor to start of file' },
  { combo: 'yG', breakdown: 'y + G (file end)', effect: 'Yank from cursor to end of file' },
];

// ── Text objects ───────────────────────────────────────────────────────────

export interface TextObject {
  keys: string;
  name: string;
  description: string;
  example: string;
}

export const TEXT_OBJECTS: TextObject[] = [
  { keys: 'iw / aw', name: 'inner/around word', description: 'iw excludes surrounding whitespace; aw includes it', example: 'ciw — change the word' },
  { keys: 'iW / aW', name: 'inner/around WORD', description: 'whitespace-delimited WORD', example: 'daW — delete WORD' },
  { keys: 'is / as', name: 'inner/around sentence', description: 'Sentence (ends at . ! ?)', example: 'yis — yank sentence' },
  { keys: 'ip / ap', name: 'inner/around paragraph', description: 'Paragraph (separated by blank lines)', example: 'dip — delete paragraph body' },
  { keys: 'i" / a"', name: 'inner/around double quotes', description: 'i" excludes quotes; a" includes them', example: 'ci" — change string contents' },
  { keys: "i' / a'", name: 'inner/around single quotes', description: 'Same as above for single quotes', example: "di' — delete single-quoted string" },
  { keys: 'i` / a`', name: 'inner/around backticks', description: 'Backtick-delimited string', example: 'yi` — yank backtick string' },
  { keys: 'i( / a(', name: 'inner/around parentheses', description: 'Also ib. i( excludes parens; a( includes', example: 'ci( — change function args' },
  { keys: 'i[ / a[', name: 'inner/around brackets', description: 'Square brackets', example: 'da[ — delete array including []' },
  { keys: 'i{ / a{', name: 'inner/around braces', description: 'Also iB. Curly braces', example: '>i{ — indent block' },
  { keys: 'it / at', name: 'inner/around HTML/XML tag', description: 'Content between matching XML/HTML tags', example: 'cit — change tag contents' },
  { keys: 'i< / a<', name: 'inner/around angle brackets', description: 'Angle-bracket delimited', example: 'di< — delete inside <>' },
];

// ── Windows, buffers, tabs ────────────────────────────────────────────────

export const WINDOW_GROUPS: KeyGroup[] = [
  {
    title: 'Splits',
    bindings: [
      { keys: ':sp', description: 'Split window horizontally (:split)', example: ':sp file.txt' },
      { keys: ':vsp', description: 'Split window vertically (:vsplit)', example: ':vsp file.txt' },
      { keys: '<C-w>s', description: 'Horizontal split (same file)' },
      { keys: '<C-w>v', description: 'Vertical split (same file)' },
      { keys: '<C-w>n', description: 'New empty horizontal split' },
    ],
  },
  {
    title: 'Window navigation',
    bindings: [
      { keys: '<C-w>h', description: 'Move to left window' },
      { keys: '<C-w>j', description: 'Move to window below' },
      { keys: '<C-w>k', description: 'Move to window above' },
      { keys: '<C-w>l', description: 'Move to right window' },
      { keys: '<C-w>w', description: 'Cycle through windows' },
      { keys: '<C-w>p', description: 'Previous window' },
      { keys: '<C-w>c', description: 'Close current window' },
      { keys: '<C-w>o', description: 'Close all other windows' },
      { keys: '<C-w>=', description: 'Equalize window sizes' },
      { keys: '<C-w>+', description: 'Increase height' },
      { keys: '<C-w>-', description: 'Decrease height' },
      { keys: '<C-w>>', description: 'Increase width' },
      { keys: '<C-w><', description: 'Decrease width' },
    ],
  },
  {
    title: 'Buffers',
    bindings: [
      { keys: ':ls', description: 'List all buffers (:buffers)' },
      { keys: ':bn', description: 'Next buffer' },
      { keys: ':bp', description: 'Previous buffer' },
      { keys: ':bd', description: 'Delete (close) buffer' },
      { keys: ':b{N}', description: 'Switch to buffer N', example: ':b3' },
      { keys: ':e {file}', description: 'Edit a file (opens in current buffer)', example: ':e src/main.ts' },
    ],
  },
  {
    title: 'Tabs',
    bindings: [
      { keys: ':tabnew', description: 'Open a new tab', example: ':tabnew file.ts' },
      { keys: ':tabn', description: 'Next tab (also gt)' },
      { keys: ':tabp', description: 'Previous tab (also gT)' },
      { keys: ':tabclose', description: 'Close current tab' },
      { keys: ':tabonly', description: 'Close all other tabs' },
      { keys: 'gt', description: 'Next tab' },
      { keys: 'gT', description: 'Previous tab' },
      { keys: '{N}gt', description: 'Go to tab N', example: '2gt' },
    ],
  },
];

// ── Marks, registers, macros ──────────────────────────────────────────────

export const MACRO_GROUPS: KeyGroup[] = [
  {
    title: 'Marks',
    bindings: [
      { keys: 'm{a-z}', description: 'Set mark at cursor position', example: 'ma — mark a' },
      { keys: "'{a-z}", description: 'Jump to line of mark', example: "'a — jump to mark a" },
      { keys: '`{a-z}', description: 'Jump to exact cursor position of mark' },
      { keys: "''", description: 'Jump back to previous position' },
      { keys: '`0', description: 'Last file position (persists across sessions)' },
      { keys: ':marks', description: 'List all marks' },
    ],
  },
  {
    title: 'Registers',
    bindings: [
      { keys: '"{reg}', description: 'Use register before y/d/c/p', example: '"ayy — yank line into register a' },
      { keys: '"0', description: 'Yank register (last yank, not deleted)' },
      { keys: '"+', description: 'System clipboard register' },
      { keys: '"*', description: 'Primary selection register (X11)' },
      { keys: '"_', description: 'Black hole register (discard)' },
      { keys: '"/', description: 'Last search pattern' },
      { keys: '".', description: 'Last inserted text' },
      { keys: '"%', description: 'Current file name' },
      { keys: ':reg', description: 'List all registers' },
    ],
  },
  {
    title: 'Macros',
    bindings: [
      { keys: 'q{a-z}', description: 'Start recording macro into register', example: 'qa — record into a' },
      { keys: 'q', description: 'Stop recording macro' },
      { keys: '@{a-z}', description: 'Execute macro from register', example: '@a — run macro a' },
      { keys: '@@', description: 'Repeat last executed macro' },
      { keys: '{N}@{a}', description: 'Execute macro N times', example: '10@a — run a 10 times' },
      { keys: ':norm @a', description: 'Apply macro to visual selection lines' },
    ],
  },
];

// ── Ex-commands ───────────────────────────────────────────────────────────

export const EX_COMMAND_GROUPS: KeyGroup[] = [
  {
    title: 'File operations',
    bindings: [
      { keys: ':w', description: 'Write (save) file', example: ':w' },
      { keys: ':w {file}', description: 'Save to a different file', example: ':w output.txt' },
      { keys: ':q', description: 'Quit (fails if unsaved changes)' },
      { keys: ':q!', description: 'Quit without saving (force)' },
      { keys: ':wq', description: 'Write and quit' },
      { keys: ':x', description: 'Write and quit (only writes if changed)' },
      { keys: ':e {file}', description: 'Edit a file', example: ':e ~/.vimrc' },
      { keys: ':e!', description: 'Reload file from disk (discard changes)' },
      { keys: ':saveas {file}', description: 'Save under new name and switch to it' },
    ],
  },
  {
    title: 'Substitution',
    bindings: [
      { keys: ':s/pat/rep/', description: 'Replace first match on current line', example: ':s/foo/bar/' },
      { keys: ':s/pat/rep/g', description: 'Replace all matches on current line', example: ':s/foo/bar/g' },
      { keys: ':%s/pat/rep/g', description: 'Replace all matches in file', example: ':%s/foo/bar/g' },
      { keys: ':%s/pat/rep/gc', description: 'Replace all with confirmation' },
      { keys: ':5,12s/pat/rep/', description: 'Replace in lines 5–12' },
      { keys: ":'<,'>s/pat/rep/", description: 'Replace in visual selection' },
    ],
  },
  {
    title: 'Global / grep',
    bindings: [
      { keys: ':g/pat/cmd', description: 'Run cmd on every line matching pat', example: ':g/TODO/d' },
      { keys: ':v/pat/cmd', description: 'Run cmd on every line NOT matching (inverse)', example: ':v/^#/d' },
      { keys: ':g/pat/p', description: 'Print all matching lines' },
    ],
  },
  {
    title: 'Navigation',
    bindings: [
      { keys: ':N', description: 'Go to line N', example: ':42' },
      { keys: ':find {file}', description: 'Find and open file in path' },
      { keys: ':help {topic}', description: 'Open vim help', example: ':help motion' },
      { keys: ':nohlsearch', description: 'Clear search highlighting (:noh)' },
    ],
  },
  {
    title: 'Ranges',
    bindings: [
      { keys: ':.', description: 'Current line' },
      { keys: ':$', description: 'Last line' },
      { keys: ':%', description: 'Entire file (1,$)' },
      { keys: ':1,5', description: 'Lines 1 through 5' },
      { keys: ":'a,'b", description: 'Lines between marks a and b' },
      { keys: ":'<,'>", description: 'Visual selection (auto-filled by V)' },
    ],
  },
];

// ── CLI flags ─────────────────────────────────────────────────────────────

export interface CliFlag {
  flag: string;
  arg?: string;
  description: string;
  example: string;
}

export const CLI_FLAGS: CliFlag[] = [
  { flag: '+N', description: 'Open file at line N (use + for last line)', example: 'vim +42 file.ts' },
  { flag: '-c', arg: '<cmd>', description: 'Execute ex-command after loading file', example: 'vim -c "set nu" file.txt' },
  { flag: '--cmd', arg: '<cmd>', description: 'Execute ex-command BEFORE loading any vimrc', example: "vim --cmd 'set nocompatible' file" },
  { flag: '-u', arg: '<vimrc>', description: 'Load specific vimrc (use NONE or NORC to skip)', example: 'vim -u ~/.vimrc.minimal file' },
  { flag: '-R', description: 'Read-only mode (view mode)', example: 'vim -R /etc/hosts' },
  { flag: '--clean', description: 'Skip vimrc, plugins, defaults (nvim only)', example: 'nvim --clean file.ts' },
  { flag: '-p', description: 'Open files in separate tabs', example: 'vim -p a.ts b.ts c.ts' },
  { flag: '-O', description: 'Open files in vertical splits', example: 'vim -O left.ts right.ts' },
  { flag: '-o', description: 'Open files in horizontal splits', example: 'vim -o top.ts bottom.ts' },
  { flag: '--version', description: 'Print version and feature list', example: 'vim --version' },
];

// ── Leader key conventions ────────────────────────────────────────────────

export interface LeaderBinding {
  chord: string;
  common: string;
  plugins?: string;
}

export const COMMON_LEADER_BINDINGS: LeaderBinding[] = [
  { chord: '<leader>w', common: ':w (save file)' },
  { chord: '<leader>q', common: ':q (quit)' },
  { chord: '<leader>e', common: ':e . (file explorer)' },
  { chord: '<leader>f', common: 'Find file (Telescope/fzf)', plugins: 'telescope.nvim, fzf-lua' },
  { chord: '<leader>g', common: 'Git operations', plugins: 'fugitive, gitsigns' },
  { chord: '<leader>b', common: 'Buffer operations' },
  { chord: '<leader>/', common: 'Search in project (grep)', plugins: 'Telescope live_grep' },
  { chord: '<leader>c', common: 'Code actions (LSP)', plugins: 'nvim-lsp, mason' },
  { chord: '<leader>d', common: 'Diagnostics / definitions (LSP)' },
  { chord: '<leader>r', common: 'Rename symbol (LSP)' },
  { chord: '<leader>h', common: 'Hunk operations (git diff)', plugins: 'gitsigns' },
  { chord: '<leader>n', common: 'Toggle line numbers / NERDTree' },
  { chord: '<leader>p', common: 'Paste from system clipboard' },
  { chord: '<leader>t', common: 'Open terminal (:terminal)' },
  { chord: '<leader>x', common: 'Close buffer / diagnostics list' },
];
