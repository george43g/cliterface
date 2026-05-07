// Curated from Obsidian vault:
//   - zprezto-module-utility.md   — general aliases and functions
//   - zprezto-module-history.md   — history options and aliases
//   - zprezto-module-editor.md    — key bindings and editor settings
//   - zprezto-module-directory.md — directory navigation options and aliases
//   - zprezto-module-osx.md       — macOS-specific aliases
//   - zsh-autosuggestions.md      — autosuggestion configuration
//   - zsh-syntax-highlighting.md  — syntax highlighting reference
//   - prezto.md                   — Zprezto framework overview
// Note: zsh.md in vault is the upstream zsh project README (no personal content).

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const ZSH_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Zprezto — Module Loading Order',
    body: 'Key ordering constraint: utility, gnu-utility, and completion modules must be loaded in the right sequence. Git module must come before completion.',
    tags: ['prezto', 'configuration', 'modules'],
    codeSnippet: `# In ~/.zpreztorc — recommended module load order:
zstyle ':prezto:load' pmodule \\
  'environment' \\
  'terminal' \\
  'editor' \\
  'history' \\
  'directory' \\
  'spectrum' \\
  'utility' \\
  'completion' \\
  'git' \\       # must come AFTER completion is set up? No — git must come BEFORE completion
  'syntax-highlighting' \\
  'history-substring-search' \\
  'autosuggestions' \\
  'prompt'

# NOTE: gnu-utility must be loaded BEFORE utility on non-GNU systems (macOS with coreutils).
# NOTE: git module must be loaded BEFORE completion module.`,
  },
  {
    heading: 'Zprezto Utility Module — General Aliases',
    body: 'General-purpose aliases from the Zprezto utility module.',
    tags: ['aliases', 'utility', 'zprezto'],
    codeSnippet: `_   # executes a command as another user (sudo)
b   # opens the default web browser
e   # opens the default editor ($EDITOR)
p   # opens the default pager
o   # opens files and directories (open / xdg-open)

get   # downloads files (curl, wget, or aria2c)
pbc   # copies to the pasteboard (pbcopy)
pbp   # pastes from the pasteboard (pbpaste)

diffu  # shorthand for diff --unified
sa     # search aliases for a word
mkdir  # creates directories including intermediary directories (-p)
type   # displays all the attribute values of a shell parameter`,
  },
  {
    heading: 'Zprezto Utility Module — File Listing Aliases',
    body: 'ls variants for different sorting and display options.',
    tags: ['aliases', 'ls', 'files', 'zprezto'],
    codeSnippet: `ls   # lists with directories grouped first (GNU only)
l    # lists in one column, hidden files
ll   # lists human readable sizes
lr   # lists human readable sizes, recursively
la   # lists human readable sizes, hidden files
lm   # lists human readable sizes, hidden files through pager
lx   # lists sorted by extension (GNU only)
lk   # lists sorted by size, largest last
lt   # lists sorted by date, most recent last
lc   # lists sorted by date, most recent last, shows change time
lu   # lists sorted by date, most recent last, shows access time`,
  },
  {
    heading: 'Zprezto Utility Module — Safe Ops & Resource Usage',
    body: 'Interactive variants of destructive commands and resource monitoring aliases.',
    tags: ['aliases', 'safety', 'utility', 'zprezto'],
    codeSnippet: `# Safe ops (cp, ln, mv, rm default to interactive mode):
cpi  # copies files and directories interactively
lni  # links files and directories interactively
mvi  # moves files and directories interactively
rmi  # removes files and directories interactively

# Resource usage:
df     # displays free disk space (human readable, uses pydf if installed)
du     # displays disk usage (human readable)
top    # displays information about processes
topc   # displays information about processes sorted by CPU usage
topm   # displays information about processes sorted by RAM usage

# Disable safe ops if unwanted:
# zstyle ':prezto:module:utility' safe-ops 'no'`,
  },
  {
    heading: 'Zprezto Utility Module — Functions',
    body: 'Useful shell functions from the utility module.',
    tags: ['functions', 'utility', 'zprezto'],
    codeSnippet: `cdls       # changes to a directory and lists its contents
dut        # displays the grand total disk usage (human readable)
find-exec  # finds files and executes a command on them
mkdcd      # makes a directory and changes to it
popdls     # pops an entry off the directory stack and lists its contents
pushdls    # pushes an entry onto the directory stack and lists its contents
slit       # prints columns 1, 2, 3 ... n
http-serve # serves a directory via HTTP`,
  },
  {
    heading: 'Zprezto History Module — Options',
    body: 'History behavior configuration from the Zprezto history module.',
    tags: ['configuration', 'history', 'zprezto'],
    codeSnippet: `# Options set by the history module:
BANG_HIST             # treats ! specially during expansion
EXTENDED_HISTORY      # writes history in :start:elapsed;command format
SHARE_HISTORY         # shares history between all sessions
HIST_EXPIRE_DUPS_FIRST  # expires duplicate events first when trimming
HIST_IGNORE_DUPS      # does not record an event just recorded again
HIST_IGNORE_ALL_DUPS  # deletes old event if new event is a duplicate
HIST_FIND_NO_DUPS     # does not display previously found events
HIST_IGNORE_SPACE     # does not record events starting with a space
HIST_SAVE_NO_DUPS     # does not write duplicate events to history file
HIST_VERIFY           # does not execute immediately upon history expansion
HIST_BEEP             # beeps when accessing non-existent history

# Alias:
history-stat  # lists the ten most used commands

# Configuration in ~/.zpreztorc:
zstyle ':prezto:module:history' histfile "~/.zsh_history"
zstyle ':prezto:module:history' histsize 10000
zstyle ':prezto:module:history' savehist 10000`,
  },
  {
    heading: 'Zprezto Editor Module — Key Bindings',
    body: 'Configure vi or emacs key bindings and dot expansion in the line editor.',
    tags: ['configuration', 'keybindings', 'editor', 'zprezto'],
    codeSnippet: `# In ~/.zpreztorc:

# Set key bindings to vi mode:
zstyle ':prezto:module:editor' key-bindings 'vi'
# Or emacs mode:
zstyle ':prezto:module:editor' key-bindings 'emacs'

# Enable auto-expansion of ... to ../..:
zstyle ':prezto:module:editor' dot-expansion 'yes'

# Configure WORDCHARS (what counts as part of a word):
zstyle ':prezto:module:editor' wordchars '*?_-.[]~&;!#$%^(){}<>'

# Use bindkey-all to inspect all key bindings across keymaps:
# bindkey-all | grep <pattern>`,
  },
  {
    heading: 'Zprezto Directory Module — Options & Aliases',
    body: 'Directory navigation options and shortcuts from the Zprezto directory module.',
    tags: ['configuration', 'navigation', 'directory', 'zprezto'],
    codeSnippet: `# Directory options set by the module:
AUTO_CD          # change to directory without typing cd
AUTO_PUSHD       # push old directory onto stack on cd
PUSHD_IGNORE_DUPS  # does not store duplicates in the stack
PUSHD_SILENT     # does not print the directory stack after pushd/popd
PUSHD_TO_HOME    # pushes to home when no argument given
CDABLE_VARS      # change directory to a path stored in a variable
EXTENDED_GLOB    # uses extended globbing syntax

# CLOBBER is disabled: > and >> will NOT overwrite existing files.
# Use >! and >>! to bypass this protection.

# Aliases:
d    # prints the contents of the directory stack
1    # changes to the 1st previous directory
2    # changes to the 2nd previous directory
# ... up to 9`,
  },
  {
    heading: 'Zprezto macOS Module — Finder & System Aliases',
    body: 'macOS-specific aliases and functions from the Zprezto osx module.',
    tags: ['aliases', 'macos', 'finder', 'zprezto'],
    codeSnippet: `cdf     # changes to the current Finder directory
pushdf  # pushes current working directory onto stack and changes to Finder directory

# Functions:
mand    # opens man pages in Dash.app
manp    # opens man pages in Preview.app
pfd     # prints the current Finder directory
pfs     # prints the current Finder selection
tab     # creates a new tab (Terminal or iTerm)
ql      # previews files in Quick Look
osx-rm-dir-metadata   # deletes .DS_Store and __MACOSX cruft
osx-ls-download-history  # displays macOS download history
osx-rm-download-history  # deletes macOS download history`,
  },
  {
    heading: 'zsh-autosuggestions — Configuration',
    body: 'Fish-like autosuggestions for Zsh. Accept suggestions with → or End key.',
    tags: ['plugins', 'autosuggestions', 'configuration'],
    codeSnippet: `# Accept suggestion: → (forward-char) or End (end-of-line)
# Partially accept up to cursor position: forward-word widget

# Suggestion strategy (try in order until match found):
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
# Options: history | completion | match_prev_cmd

# Highlight style (default: fg=8 — muted gray):
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#808080"
# Format: "fg=<color>,bg=<color>,bold,underline"

# NOTE: match_prev_cmd won't work well with HIST_IGNORE_ALL_DUPS or HIST_EXPIRE_DUPS_FIRST
# NOTE: iTerm2 users: ensure Background and ANSI Bright Black colors are different`,
  },
  {
    heading: 'zsh-syntax-highlighting — Load Order',
    body: 'Must be sourced at the END of .zshrc, after all other plugins. This is a frequent setup mistake.',
    tags: ['plugins', 'syntax-highlighting', 'gotcha'],
    codeSnippet: `# IMPORTANT: zsh-syntax-highlighting must be the LAST thing sourced in .zshrc.
# It hooks into ZLE and needs all other widgets to be defined first.

# In Zprezto: syntax-highlighting module must be loaded BEFORE
# history-substring-search and autosuggestions in zpreztorc.

# Correct order in zpreztorc:
# 'syntax-highlighting'
# 'history-substring-search'
# 'autosuggestions'`,
  },
  {
    heading: 'Zprezto — Update and Maintenance',
    body: 'How to keep Zprezto and its submodules up to date.',
    tags: ['maintenance', 'prezto'],
    codeSnippet: `# Automatic update:
zprezto-update

# Manual update:
cd $ZPREZTODIR
git pull
git submodule sync --recursive
git submodule update --init --recursive`,
  },
];
