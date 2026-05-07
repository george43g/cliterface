// zsh-personal.ts
// Personal zsh configuration extracted from ~/dotfiles/shell/.zshrc
// Pure data — no rendering logic.

export interface ZshAlias {
  alias: string;
  command: string;
  category: string;
  description: string;
}

export interface ZshPlugin {
  name: string;
  manager: string;
  purpose: string;
  enables?: string[];
}

export interface ZshBinding {
  keys: string;
  action: string;
  note?: string;
}

export const ZSH_ALIASES: ZshAlias[] = [
  // --- Filesystem ---
  { alias: 'll', command: 'colorls -lA --sd --gs', category: 'Filesystem', description: 'Long list, all, sort dirs first, git status' },
  { alias: 'lc', command: 'colorls -At --sd', category: 'Filesystem', description: 'Colorls tree, sort dirs first' },
  { alias: 'l', command: 'colorls -1 -A --sd --gs', category: 'Filesystem', description: 'One-per-line, all, dirs first, git status' },

  // --- Navigation ---
  { alias: 'g', command: 'cd ~/repos', category: 'Navigation', description: 'Jump to repos directory' },
  { alias: 'dot', command: 'cd ~/dotfiles', category: 'Navigation', description: 'Jump to dotfiles directory' },

  // --- Git ---
  {
    alias: 'gst',
    command: 'git status -b --long --show-stash -uall --column --find-renames',
    category: 'Git',
    description: 'Verbose git status with branch, stash, column, renames',
  },

  // --- Network ---
  { alias: 'shl', command: 'smbutil lookup', category: 'Network', description: 'SMB host lookup' },

  // --- GPG ---
  { alias: 'pgv', command: 'gpg --verify <pbpaste>', category: 'GPG', description: 'Verify PGP signature from clipboard (via temp file)' },
  { alias: 'pgd', command: 'pbpaste | gpg -d', category: 'GPG', description: 'Decrypt clipboard contents with available secret key' },
  { alias: 'pge', command: 'pbpaste | gpg --armor --encrypt -r <key>', category: 'GPG', description: 'Encrypt clipboard to specified GPG key (email/name)' },
  { alias: 'pgl', command: 'gpg --armor --export <id>', category: 'GPG', description: 'Export/list public key in armored format' },
  { alias: 'pgi', command: 'pbpaste | gpg --import', category: 'GPG', description: 'Import public key from clipboard' },

  // --- ZNT shorthand aliases ---
  { alias: 'naliases', command: 'n-aliases', category: 'ZNT', description: 'ZNT: browse aliases' },
  { alias: 'ncd', command: 'n-cd', category: 'ZNT', description: 'ZNT: interactive cd' },
  { alias: 'nenv', command: 'n-env', category: 'ZNT', description: 'ZNT: browse env vars' },
  { alias: 'nfunctions', command: 'n-functions', category: 'ZNT', description: 'ZNT: browse functions' },
  { alias: 'nhistory', command: 'n-history', category: 'ZNT', description: 'ZNT: browse history' },
  { alias: 'nkill', command: 'n-kill', category: 'ZNT', description: 'ZNT: kill process' },
  { alias: 'noptions', command: 'n-options', category: 'ZNT', description: 'ZNT: browse zsh options' },
  { alias: 'npanelize', command: 'n-panelize', category: 'ZNT', description: 'ZNT: panelize stdin' },
  { alias: 'nhelp', command: 'n-help', category: 'ZNT', description: 'ZNT: help' },
];

export const ZSH_KEYBINDINGS: ZshBinding[] = [
  { keys: 'bindkey -v', action: 'Vi-mode enabled globally', note: 'KEYTIMEOUT=1 (10ms mode switch)' },
  { keys: '^R', action: 'ZNT history widget (interactive history search)', note: 'Replaces default reverse-i-search' },
  { keys: '^X^A', action: 'all-matches completion (show all possible completions at once)', note: 'Custom zle widget' },
  { keys: 'Esc / jk', action: 'Switch to normal (vi command) mode', note: 'KEYTIMEOUT=1 keeps it snappy' },
];

export const ZSH_PLUGINS: ZshPlugin[] = [
  { name: 'Powerlevel10k (p10k)', manager: 'Antidote', purpose: 'Prompt theme with instant prompt support', enables: ['p10k-instant-prompt', 'p10k configure'] },
  { name: 'alias-tips', manager: 'Antidote', purpose: 'Shows alias hint when you type the full command (ZSH_PLUGINS_ALIAS_TIPS_REVEAL=1)', enables: ['Real-time alias reminder'] },
  {
    name: 'zsh-navigation-tools (ZNT)',
    manager: 'manual (autoload)',
    purpose: 'ncurses-based interactive navigation tools',
    enables: ['n-history', 'n-cd', 'n-list', 'n-options', 'n-functions', 'n-kill', 'n-panelize', 'n-env', 'n-aliases'],
  },
  { name: 'kitty integration', manager: 'Antidote / kitty', purpose: 'Kitty terminal completions and shell integration', enables: ['kitty + complete setup zsh'] },
  {
    name: 'zoxide',
    manager: 'brew (eval)',
    purpose: 'Smart directory jumper (fasd replacement)',
    enables: ['z <query>  — jump to best match', 'zi <query>  — interactive selection with fzf'],
  },
  { name: 'Prezto', manager: 'manual (.zprezto)', purpose: 'Zsh framework (loaded first, before Antidote)', enables: ['Prezto modules'] },
  { name: 'Antidote', manager: 'brew', purpose: 'Plugin manager (static loading via antidote load)', enables: ['~/.zsh_plugins.txt'] },
  { name: '1Password CLI completion', manager: 'op', purpose: 'op command completion (eval "$(op completion zsh)")', enables: ['compdef _op op'] },
  { name: 'Docker CLI completions', manager: 'Docker Desktop', purpose: 'Docker command completions', enables: ['compinit from /Users/george/.docker/completions'] },
];

export const ZSH_SETTINGS = {
  viMode: true,
  keyTimeout: 1,
  historyMode: 'APPEND_HISTORY (multi-terminal safe)',
  historyOptions: ['AUTO_PUSHD', 'HIST_IGNORE_DUPS', 'PUSHD_IGNORE_DUPS'],
  aliasTipsReveal: true,
  promptTheme: 'Powerlevel10k',
  completionSystem: 'compinit',
  directoryJumper: 'zoxide (z / zi)',
};
