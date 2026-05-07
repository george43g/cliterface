// vim-personal.ts
// Personal vim configuration extracted from ~/dotfiles/vim_runtime/
// Pure data — no rendering logic.

export interface PersonalKeybinding {
  keys: string;
  mode?: string;
  action: string;
  group: string;
  plugin?: string;
}

export const VIM_LEADER = ',';

export const VIM_PERSONAL_BINDINGS: PersonalKeybinding[] = [
  // --- File / Buffer ---
  { keys: ',w', mode: 'n', action: 'Fast save (:w!)', group: 'File' },
  { keys: ',f', mode: 'n/v', action: 'Open MRU file list / Format selection (Prettier via CoC)', group: 'File', plugin: 'MRU + CoC' },
  { keys: ',j', mode: 'n', action: 'Open CtrlP fuzzy file finder', group: 'File', plugin: 'CtrlP' },
  { keys: ',b', mode: 'n', action: 'CtrlP buffer list', group: 'File', plugin: 'CtrlP' },
  { keys: ',o', mode: 'n', action: 'Open BufExplorer', group: 'File', plugin: 'BufExplorer' },
  { keys: '<C-f>', mode: 'n', action: 'CtrlP file finder (mapped via ctrlp_map)', group: 'File', plugin: 'CtrlP' },

  // --- Navigation ---
  { keys: ',,w', mode: 'n/v', action: 'EasyMotion word jump (forward+back)', group: 'Navigation', plugin: 'EasyMotion' },
  { keys: ',,f', mode: 'n/v', action: 'EasyMotion char find (global, bi-directional)', group: 'Navigation', plugin: 'EasyMotion' },
  { keys: ',,s', mode: 'n', action: 'EasyMotion 2-char find (overwin)', group: 'Navigation', plugin: 'EasyMotion' },
  { keys: '<ScrollWheelDown>', mode: 'n', action: 'Smooth scroll down (comfortable_motion)', group: 'Navigation', plugin: 'comfortable_motion' },
  { keys: '<ScrollWheelUp>', mode: 'n', action: 'Smooth scroll up (comfortable_motion)', group: 'Navigation', plugin: 'comfortable_motion' },

  // --- NERDTree ---
  { keys: ',nn', mode: 'n', action: 'Toggle NERDTree', group: 'File browsing', plugin: 'NERDTree' },
  { keys: ',nb', mode: 'n', action: 'NERDTree from bookmark', group: 'File browsing', plugin: 'NERDTree' },
  { keys: ',nf', mode: 'n', action: 'NERDTree find current file', group: 'File browsing', plugin: 'NERDTree' },

  // --- CoC LSP ---
  { keys: 'gd', mode: 'n', action: 'Go to definition', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: 'gy', mode: 'n', action: 'Go to type definition', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: 'gi', mode: 'n', action: 'Go to implementation', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: 'gr', mode: 'n', action: 'Go to references', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: 'K', mode: 'n', action: 'Show hover documentation', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: '[g', mode: 'n', action: 'Previous diagnostic', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: ']g', mode: 'n', action: 'Next diagnostic', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: ',rn', mode: 'n', action: 'Rename symbol', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: ',a', mode: 'n/v', action: 'Code action (selected region)', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: ',ac', mode: 'n', action: 'Code action (current line)', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: ',qf', mode: 'n', action: 'Auto-fix problem on current line', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: '<TAB>', mode: 'i', action: 'Trigger completion / navigate menu down', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: '<S-TAB>', mode: 'i', action: 'Navigate completion menu up', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: '<C-Space>', mode: 'i', action: 'Force trigger completion', group: 'LSP/CoC', plugin: 'CoC' },
  { keys: '<TAB>', mode: 'n/v', action: 'Range select (textDocument/selectionRange)', group: 'LSP/CoC', plugin: 'CoC' },

  // --- CoC Lists (space prefix) ---
  { keys: '<space>a', mode: 'n', action: 'CocList: show all diagnostics', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>e', mode: 'n', action: 'CocList: manage extensions', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>c', mode: 'n', action: 'CocList: show commands', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>o', mode: 'n', action: 'CocList: document outline', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>s', mode: 'n', action: 'CocList: search workspace symbols', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>j', mode: 'n', action: 'CocNext: next list item', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>k', mode: 'n', action: 'CocPrev: previous list item', group: 'CoC Lists', plugin: 'CoC' },
  { keys: '<space>p', mode: 'n', action: 'CocListResume: resume latest list', group: 'CoC Lists', plugin: 'CoC' },

  // --- Git ---
  { keys: ',d', mode: 'n', action: 'Toggle GitGutter (diff signs)', group: 'Git', plugin: 'GitGutter' },
  { keys: ',v', mode: 'n/v', action: 'Copy GitHub permalink for current line to clipboard', group: 'Git', plugin: 'Fugitive (GBrowse!)' },

  // --- Editing ---
  { keys: ',z', mode: 'n', action: 'Toggle Goyo distraction-free mode', group: 'Distraction-free', plugin: 'Goyo' },
  { keys: '<C-s>', mode: 'n', action: 'Start multi-cursor on word', group: 'Editing', plugin: 'vim-multiple-cursors' },
  { keys: '<A-s>', mode: 'n', action: 'Select all occurrences of word (multi-cursor)', group: 'Editing', plugin: 'vim-multiple-cursors' },
  { keys: 'g<C-s>', mode: 'n', action: 'Start multi-cursor (WORD)', group: 'Editing', plugin: 'vim-multiple-cursors' },
  { keys: '<C-j>', mode: 'i', action: 'Trigger snipMate snippet', group: 'Editing', plugin: 'snipMate' },
  { keys: '<C-p>', mode: 'n', action: 'YankStack: paste older yank', group: 'Editing', plugin: 'YankStack' },
  { keys: '<C-n>', mode: 'n', action: 'YankStack: paste newer yank', group: 'Editing', plugin: 'YankStack' },

  // --- Surround ---
  { keys: 'cs\'"', mode: 'n', action: 'Change surrounding \' to "', group: 'Surround', plugin: 'vim-surround' },
  { keys: "ds'", mode: 'n', action: "Delete surrounding '", group: 'Surround', plugin: 'vim-surround' },
  { keys: 'S<char>', mode: 'v', action: 'Surround selection with <char>', group: 'Surround', plugin: 'vim-surround' },
  { keys: 'ysiw"', mode: 'n', action: 'Surround inner word with "', group: 'Surround', plugin: 'vim-surround' },

  // --- Text objects (CoC) ---
  { keys: 'if / af', mode: 'x/o', action: 'Function inner / around text objects', group: 'Text Objects', plugin: 'CoC' },
];

export interface PersonalPlugin {
  name: string;
  purpose: string;
  bindings?: string[];
}

export const VIM_PERSONAL_PLUGINS: PersonalPlugin[] = [
  {
    name: 'CoC (Conquer of Completion)',
    purpose: 'LSP engine: completion, diagnostics, code actions, rename, format',
    bindings: ['gd gy gi gr', 'K', '[g ]g', ',rn ,a ,ac ,qf', '<space>a-s', '<TAB> <C-Space>'],
  },
  { name: 'NERDTree', purpose: 'File tree browser (opens on right, width=35)', bindings: [',nn ,nb ,nf'] },
  { name: 'CtrlP', purpose: 'Fuzzy file + buffer finder (ignores node_modules/.git)', bindings: ['<C-f> ,j ,b'] },
  { name: 'EasyMotion', purpose: 'Jump anywhere with minimal keystrokes (smartcase)', bindings: [',,w ,,f ,,s'] },
  { name: 'GitGutter', purpose: 'Show git diff signs in gutter (off by default, toggle with ,d)', bindings: [',d'] },
  { name: 'Fugitive', purpose: 'Git integration — GBrowse copies GitHub line URL', bindings: [',v'] },
  { name: 'Goyo', purpose: 'Distraction-free writing (width=100)', bindings: [',z'] },
  { name: 'vim-surround', purpose: 'Surround text objects with quotes/brackets/tags', bindings: ['cs ds S ysiw'] },
  { name: 'vim-multiple-cursors', purpose: 'Multi-cursor editing', bindings: ['<C-s> <A-s> g<C-s>'] },
  { name: 'Ale', purpose: 'Async linting (eslint/flake8/golint) — runs on save only', bindings: [] },
  { name: 'Lightline', purpose: 'Status line (wombat theme, shows git branch via Fugitive)', bindings: [] },
  { name: 'YankStack', purpose: 'Cycle through yank history', bindings: ['<C-p> <C-n>'] },
  { name: 'snipMate', purpose: 'Snippet expansion', bindings: ['<C-j>'] },
  { name: 'BufExplorer', purpose: 'Buffer list explorer', bindings: [',o'] },
  { name: 'MRU', purpose: 'Most Recently Used files (max 400 entries)', bindings: [',f'] },
  { name: 'comfortable_motion', purpose: 'Smooth scroll wheel motion', bindings: ['<ScrollWheelDown> <ScrollWheelUp>'] },
  { name: 'WebDevIcons', purpose: 'File-type icons in NERDTree (folder node decoration enabled)', bindings: [] },
  { name: 'ZenCoding (Emmet)', purpose: 'HTML/CSS expansion (all modes enabled)', bindings: [] },
  { name: 'EditorConfig', purpose: 'Per-project editor config (excludes fugitive:// buffers)', bindings: [] },
];

export const VIM_PERSONAL_THEME = {
  font: 'Hack_Nerd_Font:h19',
  lineNumbers: 'relative',
  statusLine: 'lightline (wombat colorscheme)',
  colorscheme: 'wombat (via amix/vimrc base)',
  airlinePowerlineFonts: true,
};

export const VIM_PERSONAL_SETTINGS = {
  leader: ',',
  encoding: 'utf8',
  hidden: true,
  updatetime: 300,
  signcolumn: 'yes',
  cmdheight: 2,
  goyo_width: 100,
  ale_lint_on_save_only: true,
  nerdtree_position: 'right',
  nerdtree_size: 35,
  ctrlp_max_height: 20,
  ctrlp_ignores: 'node_modules, .DS_Store, .git, .coffee',
  easymotion_smartcase: true,
};
