// Curated from Obsidian vault:
//   - oh-my-tmux.md (442 lines) — keybindings and configuration reference
//   - zprezto-module-tmux.md (95 lines) — Zprezto tmux module settings and aliases
//   - oh-my-tmux-default-conf.md (1900 lines) — default config (not pasted verbatim)
// Note: tmux.md in vault is the upstream project README (no personal content).

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const TMUX_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Oh My Tmux! — Key Bindings Overview',
    body: 'This setup uses C-a as secondary prefix (keeping C-b as default). All bindings use <prefix> = C-a or C-b.',
    tags: ['keybindings', 'oh-my-tmux'],
    codeSnippet: `<prefix> e      # open .local customization file in $EDITOR
<prefix> r      # reload configuration

C-l             # clear screen AND tmux history (no prefix needed)

<prefix> C-c    # create a new session
<prefix> C-f    # switch to another session by name

<prefix> C-h    # navigate to previous window
<prefix> C-l    # navigate to next window
<prefix> Tab    # bring to last active window

<prefix> -      # split current pane vertically (top/bottom)
<prefix> _      # split current pane horizontally (left/right)

<prefix> h/j/k/l  # navigate panes (Vim-style)
<prefix> H/J/K/L  # resize panes (Vim-style)
<prefix> < / >  # swap current pane with previous/next
<prefix> +      # maximize current pane to a new window

<prefix> m      # toggle mouse mode on/off`,
  },
  {
    heading: 'Oh My Tmux! — Copy Mode Bindings',
    body: 'Vi-style copy mode bindings. Enter copy mode with <prefix> Enter.',
    tags: ['keybindings', 'copy-mode', 'oh-my-tmux'],
    codeSnippet: `<prefix> Enter  # enter copy mode

# In copy-mode-vi:
v        # begin selection / visual mode
C-v      # toggle between blockwise visual mode and visual mode
H        # jump to start of line
L        # jump to end of line
y        # copy selection to top paste buffer
Escape   # cancel current operation

# Paste buffers:
<prefix> b      # list paste buffers
<prefix> p      # paste from top paste buffer
<prefix> P      # choose which paste buffer to paste from

# Clipboard integration (pbcopy on macOS):
# bind y automatically copies to OS clipboard via pbcopy/xclip/wl-copy`,
  },
  {
    heading: 'Oh My Tmux! — Tmux Default Config Highlights',
    body: 'Key settings from the oh-my-tmux default configuration.',
    tags: ['configuration', 'oh-my-tmux'],
    codeSnippet: `set -g default-terminal "screen-256color"
set -s escape-time 10          # faster command sequences
set -sg repeat-time 600        # increase repeat timeout
set -s focus-events on

set -g prefix2 C-a             # GNU-Screen compatible secondary prefix

set -g history-limit 5000      # boost history

set -g base-index 1            # start windows numbering at 1
setw -g pane-base-index 1      # make pane numbering consistent with windows

setw -g automatic-rename on    # rename window to reflect current program
set -g renumber-windows on     # renumber windows when a window is closed
set -g set-titles on           # set terminal title`,
  },
  {
    heading: 'Oh My Tmux! — Status Line Variables',
    body: 'Builtin variables available in tmux_conf_theme_status_left/right for customizing the status bar.',
    tags: ['configuration', 'status-bar', 'oh-my-tmux'],
    codeSnippet: `#{battery_bar}          # horizontal battery charge bar
#{battery_hbar}         # 1 character wide horizontal battery bar
#{battery_percentage}   # battery percentage
#{battery_status}       # is battery charging or discharging?
#{circled_session_name} # circled session number (⓪ to ⑳)
#{hostname}             # SSH/Mosh aware hostname information
#{hostname_ssh}         # hostname, blank when not in SSH/Mosh
#{loadavg}              # load average
#{pairing}              # is current session attached to more than one client?
#{pretty_pane_current_path}  # prettified current pane path
#{prefix}               # is prefix being depressed?
#{root}                 # is the current user root?
#{synchronized}         # are the panes synchronized?
#{uptime_d}             # uptime days
#{uptime_h}             # uptime hours
#{uptime_m}             # uptime minutes
#{username}             # SSH/Mosh aware username
#{username_ssh}         # username, blank when not in SSH/Mosh`,
  },
  {
    heading: 'Oh My Tmux! — Powerline Look Setup',
    body: 'Enable Powerline symbols in the status bar by editing your .local customization file.',
    tags: ['configuration', 'powerline', 'oh-my-tmux'],
    codeSnippet: `# In ~/.tmux.conf.local (open with <prefix> e):
tmux_conf_theme_left_separator_main='\\uE0B0'   #
tmux_conf_theme_left_separator_sub='\\uE0B1'    #
tmux_conf_theme_right_separator_main='\\uE0B2'  #
tmux_conf_theme_right_separator_sub='\\uE0B3'   #

# Requires a Powerline-patched font or Source Code Pro`,
  },
  {
    heading: 'Oh My Tmux! — Weather in Status Bar',
    body: 'Use wttr.in to show weather in the status line (updates every 15 minutes via sleep).',
    tags: ['configuration', 'status-bar', 'oh-my-tmux'],
    codeSnippet: `# In ~/.tmux.conf.local:
tmux_conf_theme_status_right='#{prefix}#{pairing}#{synchronized} #(curl -m 1 wttr.in?format=3 2>/dev/null; sleep 900) , %R , %d %b | #{username}#{root} | #{hostname} '

# Note: sleep 900 ensures the curl is issued at most every 15 minutes.
# The %% syntax is required to escape % in strftime context.`,
  },
  {
    heading: 'Oh My Tmux! — TPM Plugin Manager',
    body: 'TPM bindings differ from upstream: use prefix+I to install, prefix+u to update.',
    tags: ['plugins', 'tpm', 'oh-my-tmux'],
    codeSnippet: `# In ~/.tmux.conf.local:
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# TPM key bindings (oh-my-tmux variant):
<prefix> I         # install plugins
<prefix> Alt+u     # uninstall plugins
<prefix> u         # update plugins

# NOTE: Do NOT add 'set -g @plugin tmux-plugins/tpm' to any config file.
# NOTE: Do NOT add 'run ~/.tmux/plugins/tpm/tpm' either — oh-my-tmux handles this.`,
  },
  {
    heading: 'Zprezto Tmux Module — Settings',
    body: 'Zprezto tmux module configuration options.',
    tags: ['configuration', 'zprezto', 'auto-start'],
    codeSnippet: `# Auto-start tmux on local terminal launch:
zstyle ':prezto:module:tmux:auto-start' local 'yes'

# Auto-start tmux on SSH connections:
zstyle ':prezto:module:tmux:auto-start' remote 'yes'

# Change the default session name (default is 'prezto'):
zstyle ':prezto:module:tmux:session' name 'main'

# iTerm2 integration (macOS):
zstyle ':prezto:module:tmux:iterm' integrate 'yes'

# Shell aliases provided:
# tmuxa  — attaches or switches to a tmux session
# tmuxl  — lists sessions managed by the tmux server`,
  },
  {
    heading: 'Tmux macOS Gotcha — reattach-to-user-namespace',
    body: 'On macOS, tmux may show "Socket is not connected" errors. Fix by installing reattach-to-user-namespace via Homebrew.',
    tags: ['macos', 'gotcha', 'setup'],
    codeSnippet: `# Install:
brew install reattach-to-user-namespace

# Add to tmux.conf.local:
set-option -g default-command "reattach-to-user-namespace -l $SHELL -l"

# This also fixes clipboard integration (pbcopy/pbpaste) inside tmux.`,
  },
];
