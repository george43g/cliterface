/**
 * tmux command builders
 * Typed helpers for constructing tmux CLI commands.
 */

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface NewSessionOptions {
  sessionName?: string;
  detached?: boolean;
  startDirectory?: string;
  windowName?: string;
}

export function buildNewSession(opts: NewSessionOptions = {}): string {
  const parts: string[] = ['tmux', 'new-session'];
  if (opts.detached) parts.push('-d');
  if (opts.sessionName) parts.push('-s', opts.sessionName);
  if (opts.windowName) parts.push('-n', opts.windowName);
  if (opts.startDirectory) parts.push('-c', opts.startDirectory);
  return parts.join(' ');
}

export function buildKillSession(sessionName?: string): string {
  if (sessionName) return `tmux kill-session -t ${sessionName}`;
  return 'tmux kill-session';
}

export function buildAttachSession(sessionName?: string, readOnly?: boolean): string {
  const parts: string[] = ['tmux', 'attach-session'];
  if (sessionName) parts.push('-t', sessionName);
  if (readOnly) parts.push('-r');
  return parts.join(' ');
}

export function buildListSessions(format?: string): string {
  if (format) return `tmux list-sessions -F '${format}'`;
  return 'tmux list-sessions';
}

// ── Windows ───────────────────────────────────────────────────────────────────

export interface NewWindowOptions {
  windowName?: string;
  target?: string;
  startDirectory?: string;
  detached?: boolean;
}

export function buildNewWindow(opts: NewWindowOptions = {}): string {
  const parts: string[] = ['tmux', 'new-window'];
  if (opts.detached) parts.push('-d');
  if (opts.target) parts.push('-t', opts.target);
  if (opts.windowName) parts.push('-n', opts.windowName);
  if (opts.startDirectory) parts.push('-c', opts.startDirectory);
  return parts.join(' ');
}

export function buildKillWindow(target?: string): string {
  if (target) return `tmux kill-window -t ${target}`;
  return 'tmux kill-window';
}

export function buildListWindows(target?: string, format?: string): string {
  const parts: string[] = ['tmux', 'list-windows'];
  if (target) parts.push('-t', target);
  if (format) parts.push('-F', `'${format}'`);
  return parts.join(' ');
}

export function buildSwapWindow(srcTarget: string, dstTarget: string): string {
  return `tmux swap-window -s ${srcTarget} -t ${dstTarget}`;
}

// ── Panes ─────────────────────────────────────────────────────────────────────

export function buildListPanes(target?: string, format?: string, allSessions?: boolean): string {
  const parts: string[] = ['tmux', 'list-panes'];
  if (allSessions) parts.push('-a');
  else if (target) parts.push('-t', target);
  if (format) parts.push('-F', `'${format}'`);
  return parts.join(' ');
}

export function buildKillPane(target?: string): string {
  if (target) return `tmux kill-pane -t ${target}`;
  return 'tmux kill-pane';
}

export interface SplitWindowOptions {
  target?: string;
  vertical?: boolean; // -v splits horizontally (top/bottom), default is -h (left/right)
  percent?: number;
  startDirectory?: string;
}

export function buildSplitWindow(opts: SplitWindowOptions = {}): string {
  const parts: string[] = ['tmux', 'split-window'];
  // tmux: -h splits left/right, -v splits top/bottom
  if (opts.vertical) parts.push('-v');
  else parts.push('-h');
  if (opts.target) parts.push('-t', opts.target);
  if (opts.percent !== undefined) parts.push('-p', String(opts.percent));
  if (opts.startDirectory) parts.push('-c', opts.startDirectory);
  return parts.join(' ');
}

export function buildSwapPane(srcTarget: string, dstTarget: string): string {
  return `tmux swap-pane -s ${srcTarget} -t ${dstTarget}`;
}

// ── Sending keys / capture ────────────────────────────────────────────────────

export function buildSendKeys(target: string, keys: string, enter = true): string {
  const parts: string[] = ['tmux', 'send-keys', '-t', target, `"${keys}"`];
  if (enter) parts.push('Enter');
  return parts.join(' ');
}

export interface CapturePaneOptions {
  target?: string;
  startLine?: number;
  endLine?: number;
  joinLines?: boolean;
}

export function buildCapturePane(opts: CapturePaneOptions = {}): string {
  const parts: string[] = ['tmux', 'capture-pane', '-p'];
  if (opts.target) parts.push('-t', opts.target);
  if (opts.joinLines) parts.push('-J');
  if (opts.startLine !== undefined) parts.push('-S', String(opts.startLine));
  if (opts.endLine !== undefined) parts.push('-E', String(opts.endLine));
  return parts.join(' ');
}

// ── Options ───────────────────────────────────────────────────────────────────

export type OptionScope = 'global' | 'session' | 'window' | 'pane';

export function buildSetOption(option: string, value: string, scope: OptionScope = 'global', target?: string): string {
  const parts: string[] = ['tmux', 'set-option'];
  if (scope === 'global') parts.push('-g');
  if (scope === 'window') parts.push('-w');
  if (scope === 'pane') parts.push('-p');
  if (target) parts.push('-t', target);
  parts.push(option, value);
  return parts.join(' ');
}

export function buildSetWindowOption(option: string, value: string, global = true, target?: string): string {
  const parts: string[] = ['tmux', 'set-window-option'];
  if (global) parts.push('-g');
  if (target) parts.push('-t', target);
  parts.push(option, value);
  return parts.join(' ');
}

export function buildSourceFile(filePath = '~/.tmux.conf'): string {
  return `tmux source-file ${filePath}`;
}

export function buildDisplayMessage(message: string, target?: string): string {
  const parts: string[] = ['tmux', 'display-message'];
  if (target) parts.push('-t', target);
  parts.push(`"${message}"`);
  return parts.join(' ');
}

// ── Common format strings ─────────────────────────────────────────────────────

export const FORMAT_SESSION = '#{session_name}: #{session_windows} windows (#{session_attached} attached)';
export const FORMAT_WINDOW = '#{window_index}: #{window_name} [#{window_width}x#{window_height}] #{window_flags}';
export const FORMAT_PANE = '#{pane_index}: #{pane_title} [#{pane_width}x#{pane_height}] #{pane_current_command}';

// ── Common .tmux.conf snippets ────────────────────────────────────────────────

export interface ConfigSnippet {
  id: string;
  label: string;
  description: string;
  snippet: string;
  category: string;
}

export const configSnippets: ConfigSnippet[] = [
  {
    id: 'prefix-ctrl-a',
    label: 'Change prefix to Ctrl+a',
    description: 'Use Ctrl+a as the prefix key (screen-style)',
    category: 'general',
    snippet: `unbind C-b\nset-option -g prefix C-a\nbind-key C-a send-prefix`,
  },
  {
    id: 'mouse-on',
    label: 'Enable mouse support',
    description: 'Allow mouse clicks and scrolling',
    category: 'general',
    snippet: 'set -g mouse on',
  },
  {
    id: 'base-index-1',
    label: 'Start window index at 1',
    description: 'Number windows starting from 1 instead of 0',
    category: 'general',
    snippet: `set -g base-index 1\nsetw -g pane-base-index 1\nset -g renumber-windows on`,
  },
  {
    id: 'vim-keys',
    label: 'Vim-style pane navigation',
    description: 'Use h/j/k/l to switch panes (prefix + h/j/k/l)',
    category: 'navigation',
    snippet: `bind h select-pane -L\nbind j select-pane -D\nbind k select-pane -U\nbind l select-pane -R`,
  },
  {
    id: 'vim-copy-mode',
    label: 'Vim copy mode',
    description: 'Use vi keys in copy mode',
    category: 'copy-mode',
    snippet: `set-window-option -g mode-keys vi\nbind-key -T copy-mode-vi v send-keys -X begin-selection\nbind-key -T copy-mode-vi y send-keys -X copy-selection-and-cancel`,
  },
  {
    id: 'split-intuitive',
    label: 'Intuitive split keys',
    description: 'Use | and - for vertical/horizontal splits',
    category: 'navigation',
    snippet: `bind | split-window -h -c "#{pane_current_path}"\nbind - split-window -v -c "#{pane_current_path}"\nunbind '"'\nunbind %`,
  },
  {
    id: 'resize-pane',
    label: 'Vim-style pane resize',
    description: 'Resize panes with prefix + H/J/K/L',
    category: 'navigation',
    snippet: `bind -r H resize-pane -L 5\nbind -r J resize-pane -D 5\nbind -r K resize-pane -U 5\nbind -r L resize-pane -R 5`,
  },
  {
    id: 'status-bar',
    label: 'Minimal status bar',
    description: 'Simple dark status bar',
    category: 'appearance',
    snippet: `set -g status-style 'bg=#1a1a2e fg=#eaeaea'\nset -g status-left '#[fg=#4ecca3]#S '\nset -g status-right '#[fg=#a0a0a0]%H:%M %d-%b'\nset -g window-status-current-style 'fg=#e94560 bold'`,
  },
  {
    id: 'history-limit',
    label: 'Increase scrollback buffer',
    description: 'Set scrollback history to 10,000 lines',
    category: 'general',
    snippet: 'set -g history-limit 10000',
  },
  {
    id: 'escape-time',
    label: 'Remove escape delay',
    description: 'Fix escape key delay for vim/neovim',
    category: 'general',
    snippet: 'set -sg escape-time 0',
  },
  {
    id: 'reload-config',
    label: 'Reload config binding',
    description: 'Bind prefix+r to reload ~/.tmux.conf',
    category: 'general',
    snippet: `bind r source-file ~/.tmux.conf \\; display-message "Config reloaded!"`,
  },
  {
    id: '256color',
    label: 'Enable 256 colors',
    description: 'Set terminal to use 256 colors',
    category: 'appearance',
    snippet: `set -g default-terminal "screen-256color"\nset -ga terminal-overrides ",xterm-256color:Tc"`,
  },
];
