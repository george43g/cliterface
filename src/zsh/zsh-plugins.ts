export interface ZpreztoAlias {
  alias: string;
  expansion: string;
  description?: string;
}

export interface ZpreztoPlugin {
  id: string;
  name: string;
  description: string;
  enables: string[];
  aliases?: ZpreztoAlias[];
  keybindings?: { keys: string; description: string }[];
  config?: { option: string; description: string; example?: string }[];
  note?: string;
}

export const zpreztoPlugins: ZpreztoPlugin[] = [
  {
    id: 'editor',
    name: 'editor',
    description: 'Sets key bindings for the command-line editor. Controls whether to use Emacs or Vi mode. Loaded early since other modules may depend on it.',
    enables: ['Emacs or Vi key bindings', 'Dot-expansion and history key overrides', 'Smart URL quoting'],
    keybindings: [
      { keys: 'Tab', description: 'Smart completion (expand or complete)' },
      { keys: 'Shift+Tab', description: 'Reverse menu complete' },
      { keys: 'Alt+.', description: 'Insert last argument of previous command' },
    ],
    config: [
      { option: "zstyle ':prezto:module:editor' key-bindings 'emacs'", description: 'Use emacs key bindings (default)', example: '# in ~/.zpreztorc' },
      { option: "zstyle ':prezto:module:editor' key-bindings 'vi'", description: 'Use vi key bindings' },
      { option: "zstyle ':prezto:module:editor' dot-expansion 'yes'", description: 'Auto-expand ... to ../..' },
    ],
  },
  {
    id: 'completion',
    name: 'completion',
    description: 'Loads and configures tab completion for zsh. Enables menu completion, case-insensitive matching, and rich completion listings.',
    enables: [
      'Case-insensitive completion',
      'Menu-select completion list',
      'Partial-word and substring completion',
      'Completion caching for performance',
      'Rich completion formatting with colors',
    ],
    config: [
      { option: "zstyle ':prezto:module:completion:*' color 'yes'", description: 'Colorize completion listings' },
      { option: 'autoload -Uz compinit && compinit', description: 'Manual initialization (prezto does this automatically)' },
      { option: 'setopt COMPLETE_IN_WORD', description: 'Complete from inside a word' },
      { option: 'setopt MENU_COMPLETE', description: 'Automatically select first completion' },
    ],
  },
  {
    id: 'history',
    name: 'history',
    description: 'Sets history options and defines aliases for working with shell history.',
    enables: ['Shared history across sessions', 'Duplicate removal', 'History file with timestamps'],
    aliases: [{ alias: 'history-stat', expansion: "fc -l 1 | awk '{print $2}' | sort | uniq -c | sort -rn | head", description: 'Top 20 most-used commands' }],
    config: [
      { option: 'HISTFILE=~/.zsh_history', description: 'History file location' },
      { option: 'HISTSIZE=10000', description: 'Number of history entries in memory' },
      { option: 'SAVEHIST=10000', description: 'Number of entries saved to file' },
      { option: 'setopt SHARE_HISTORY', description: 'Share history between sessions' },
      { option: 'setopt HIST_IGNORE_DUPS', description: 'Ignore duplicate consecutive entries' },
      { option: 'setopt HIST_IGNORE_ALL_DUPS', description: 'Remove older duplicate entries' },
      { option: 'setopt HIST_FIND_NO_DUPS', description: 'Skip duplicates when searching' },
      { option: 'setopt HIST_REDUCE_BLANKS', description: 'Strip superfluous whitespace' },
    ],
  },
  {
    id: 'history-substring-search',
    name: 'history-substring-search',
    description: 'Binds Up/Down arrow keys to search history for lines matching the typed prefix. Must be loaded after syntax-highlighting.',
    enables: ['Type-ahead history search with Up/Down arrows', 'Visual highlighting of matched portion'],
    keybindings: [
      { keys: 'Up Arrow', description: 'Search history backward for lines matching what is typed so far' },
      { keys: 'Down Arrow', description: 'Search history forward for lines matching what is typed so far' },
      { keys: 'Ctrl+P', description: 'Also bound to history-substring-search-up (emacs mode)' },
      { keys: 'Ctrl+N', description: 'Also bound to history-substring-search-down (emacs mode)' },
    ],
    config: [
      { option: "zstyle ':prezto:module:history-substring-search' color 'yes'", description: 'Highlight matched portion' },
      { option: "HISTORY_SUBSTRING_SEARCH_HIGHLIGHT_FOUND='bg=magenta,fg=white,bold'", description: 'Style for found match' },
      { option: "HISTORY_SUBSTRING_SEARCH_HIGHLIGHT_NOT_FOUND='bg=red,fg=white,bold'", description: 'Style for no match' },
    ],
    note: "Load after syntax-highlighting in .zpreztorc: ('syntax-highlighting' 'history-substring-search')",
  },
  {
    id: 'syntax-highlighting',
    name: 'syntax-highlighting',
    description: 'Fish-shell-like real-time syntax highlighting of commands as you type. Wraps zsh-syntax-highlighting.',
    enables: [
      'Commands highlighted green when valid, red when not found',
      'Paths underlined when they exist',
      'Strings, flags, and arguments colored distinctly',
      'Bracket and quote matching',
    ],
    config: [
      { option: "zstyle ':prezto:module:syntax-highlighting' color 'yes'", description: 'Enable colors' },
      { option: "zstyle ':prezto:module:syntax-highlighting' highlighters 'main' 'brackets' 'pattern' 'cursor'", description: 'Choose which highlighters to enable' },
      { option: "zstyle ':prezto:module:syntax-highlighting' styles 'builtin' 'bg=blue'", description: 'Override a specific token style' },
    ],
    note: 'Must be loaded before history-substring-search.',
  },
  {
    id: 'git',
    name: 'git',
    description: 'Provides a rich set of Git aliases and functions. One of the most feature-rich zprezto modules.',
    enables: ['Dozens of git shorthand aliases', 'Git log formatting functions', 'Branch and status helpers'],
    aliases: [
      { alias: 'g', expansion: 'git', description: 'Git shorthand' },
      { alias: 'ga', expansion: 'git add', description: 'Stage files' },
      { alias: 'gcm', expansion: 'git commit --message', description: 'Commit with message' },
      { alias: 'gcam', expansion: 'git commit --all --message', description: 'Commit all with message' },
      { alias: 'gco', expansion: 'git checkout', description: 'Checkout branch/file' },
      { alias: 'gcb', expansion: 'git checkout -b', description: 'Create and checkout new branch' },
      { alias: 'gd', expansion: 'git diff', description: 'Show diff' },
      { alias: 'gds', expansion: 'git diff --staged', description: 'Show staged diff' },
      { alias: 'gf', expansion: 'git fetch', description: 'Fetch from remote' },
      { alias: 'gl', expansion: 'git pull', description: 'Pull from remote' },
      { alias: 'gm', expansion: 'git merge', description: 'Merge branch' },
      { alias: 'gp', expansion: 'git push', description: 'Push to remote' },
      { alias: 'gr', expansion: 'git rebase', description: 'Rebase branch' },
      { alias: 'gst', expansion: 'git status', description: 'Show working tree status' },
      { alias: 'gsta', expansion: 'git stash', description: 'Stash changes' },
      { alias: 'gstp', expansion: 'git stash pop', description: 'Pop stash' },
      { alias: 'glog', expansion: 'git log --topo-order --pretty=format:...', description: 'Formatted log' },
      { alias: 'gwc', expansion: 'git whatchanged -p --abbrev-commit --pretty=medium', description: 'What changed' },
    ],
  },
  {
    id: 'prompt',
    name: 'prompt',
    description: 'Provides prompt themes. Load after other modules. Configure which theme via zstyle.',
    enables: ['Switchable prompt themes', 'Async prompt updates (with async module)', 'Git status in prompt'],
    config: [
      { option: "zstyle ':prezto:module:prompt' theme 'sorin'", description: 'Use the Sorin theme (default)' },
      { option: "zstyle ':prezto:module:prompt' theme 'pure'", description: 'Use Pure theme' },
      { option: "zstyle ':prezto:module:prompt' theme 'powerlevel10k'", description: 'Use Powerlevel10k (must install separately)' },
      { option: "zstyle ':prezto:module:prompt' theme 'minimal'", description: 'Minimal theme' },
      { option: 'prompt -l', description: 'List available themes' },
      { option: 'prompt -p', description: 'Preview all themes' },
      { option: 'prompt sorin', description: 'Switch theme in current session' },
    ],
  },
  {
    id: 'directory',
    name: 'directory',
    description: 'Sets directory options and defines aliases for navigating the filesystem.',
    enables: ['AUTO_CD — type a directory name without cd', 'PUSHD_IGNORE_DUPS — no duplicate dirs in stack', 'Extended globbing options'],
    aliases: [
      { alias: 'd', expansion: 'dirs -v', description: 'List directory stack with indices' },
      { alias: '1', expansion: 'cd -1', description: 'Go to 1st dir in stack' },
      { alias: '2', expansion: 'cd -2', description: 'Go to 2nd dir in stack' },
      { alias: '3', expansion: 'cd -3', description: 'Go to 3rd dir in stack' },
      { alias: '..', expansion: 'cd ..', description: 'Up one directory' },
      { alias: '...', expansion: 'cd ../..', description: 'Up two directories' },
      { alias: '....', expansion: 'cd ../../..', description: 'Up three directories' },
    ],
  },
  {
    id: 'autosuggestions',
    name: 'autosuggestions',
    description: 'Fish-shell-like command suggestions based on history and completions. Wraps zsh-autosuggestions.',
    enables: ['Ghost-text suggestions as you type', 'Accept full suggestion', 'Accept next word of suggestion'],
    keybindings: [
      { keys: 'Right Arrow', description: 'Accept full suggestion' },
      { keys: 'Ctrl+F', description: 'Accept full suggestion (emacs mode)' },
      { keys: 'Alt+Right', description: 'Accept next word of suggestion' },
      { keys: 'Alt+F', description: 'Accept next word of suggestion (emacs mode)' },
      { keys: 'Ctrl+U', description: 'Clear suggestion' },
    ],
    config: [
      { option: "ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=8'", description: 'Color of suggestion text (grey)' },
      { option: 'ZSH_AUTOSUGGEST_STRATEGY=(history completion)', description: 'Source: history first, then completion' },
      { option: 'ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20', description: 'Max line length to suggest for' },
    ],
  },
  {
    id: 'utility',
    name: 'utility',
    description: 'Provides general utility functions and aliases, including color ls, safer operations, and common shortcuts.',
    enables: ['Colored ls output', 'Grep with color', 'diff with color', 'Safer rm/mv/cp with -i'],
    aliases: [
      { alias: 'ls', expansion: 'ls --color=auto', description: 'List with colors (GNU) or ls -G (macOS)' },
      { alias: 'll', expansion: 'ls -lh', description: 'Long listing, human-readable sizes' },
      { alias: 'la', expansion: 'ls -lAh', description: 'Long listing including hidden files' },
      { alias: 'lk', expansion: 'ls -lSrh', description: 'Sort by size, largest last' },
      { alias: 'lt', expansion: 'ls -ltrh', description: 'Sort by date, newest last' },
      { alias: 'grep', expansion: 'grep --color=auto', description: 'Grep with color' },
      { alias: 'rm', expansion: 'rm -i', description: 'Prompt before removal' },
      { alias: 'mv', expansion: 'mv -i', description: 'Prompt before overwrite' },
      { alias: 'cp', expansion: 'cp -i', description: 'Prompt before overwrite' },
    ],
  },
  {
    id: 'node',
    name: 'node',
    description: 'Provides Node.js and npm/nvm integration, including PATH setup.',
    enables: ['nvm integration', 'npm completion', 'node_modules/.bin on PATH within projects'],
    aliases: [{ alias: 'node-docs', expansion: 'open https://nodejs.org/en/docs/', description: 'Open Node.js documentation' }],
  },
  {
    id: 'python',
    name: 'python',
    description: 'Provides Python/pip/virtualenv/pyenv integration.',
    enables: ['pyenv integration', 'virtualenv auto-activation', 'Python PATH management'],
    aliases: [
      { alias: 'py', expansion: 'python3', description: 'Python 3 shorthand' },
      { alias: 'pip', expansion: 'pip3', description: 'pip3 shorthand' },
    ],
  },
  {
    id: 'ssh',
    name: 'ssh',
    description: 'Provides SSH agent management so keys are remembered across sessions.',
    enables: ['ssh-agent auto-start', 'Key persistence across sessions', 'Identities auto-loaded on first use'],
    config: [{ option: "zstyle ':prezto:module:ssh:load' identities 'id_rsa' 'id_ed25519'", description: 'Identities to load on start' }],
  },
  {
    id: 'tmux',
    name: 'tmux',
    description: 'Provides tmux integration and aliases.',
    enables: ['Auto-start tmux on SSH', 'tmux session management aliases'],
    aliases: [
      { alias: 'tmuxa', expansion: 'tmux attach-session', description: 'Attach to a tmux session' },
      { alias: 'tmuxl', expansion: 'tmux list-sessions', description: 'List tmux sessions' },
    ],
    config: [
      { option: "zstyle ':prezto:module:tmux:auto-start' local 'yes'", description: 'Auto-start tmux in local sessions' },
      { option: "zstyle ':prezto:module:tmux:auto-start' remote 'yes'", description: 'Auto-start tmux in remote (SSH) sessions' },
    ],
  },
];

export const zpreztoRcTemplate = `# ~/.zpreztorc — zprezto configuration

# Modules to load (order matters!)
zstyle ':prezto:load' pmodule \\
  'environment' \\
  'terminal' \\
  'editor' \\
  'history' \\
  'directory' \\
  'spectrum' \\
  'utility' \\
  'completion' \\
  'autosuggestions' \\
  'syntax-highlighting' \\
  'history-substring-search' \\
  'git' \\
  'node' \\
  'python' \\
  'ssh' \\
  'prompt'

# Editor: emacs or vi key bindings
zstyle ':prezto:module:editor' key-bindings 'emacs'

# Prompt theme
zstyle ':prezto:module:prompt' theme 'sorin'

# Color output
zstyle ':prezto:*:*' color 'yes'
`;
