/**
 * tmux service module
 * All command execution goes through `executeCommand()` — a single stub that
 * can be swapped for a real native bridge (Tauri, Electron, WKWebView, etc.).
 */

export { type CommandResult, executeCommand } from '../utils/execute-command';
import { type CommandResult, executeCommand } from '../utils/execute-command';

// ── Session helpers ────────────────────────────────────────────────────────────

export const tmuxService = {
  async listSessions(): Promise<CommandResult> {
    return executeCommand('tmux list-sessions');
  },

  async newSession(name: string, detached = true, dir?: string): Promise<CommandResult> {
    const parts = ['tmux', 'new-session'];
    if (detached) parts.push('-d');
    if (name) parts.push('-s', name);
    if (dir) parts.push('-c', dir);
    return executeCommand(parts.join(' '));
  },

  async killSession(name: string): Promise<CommandResult> {
    return executeCommand(`tmux kill-session -t ${name}`);
  },

  async attachSession(name: string): Promise<CommandResult> {
    return executeCommand(`tmux attach-session -t ${name}`);
  },

  // ── Window helpers ──────────────────────────────────────────────────────────

  async listWindows(target?: string): Promise<CommandResult> {
    if (target) return executeCommand(`tmux list-windows -t ${target}`);
    return executeCommand('tmux list-windows');
  },

  async newWindow(target?: string, name?: string): Promise<CommandResult> {
    const parts = ['tmux', 'new-window'];
    if (target) parts.push('-t', target);
    if (name) parts.push('-n', name);
    return executeCommand(parts.join(' '));
  },

  async killWindow(target: string): Promise<CommandResult> {
    return executeCommand(`tmux kill-window -t ${target}`);
  },

  async swapWindow(src: string, dst: string): Promise<CommandResult> {
    return executeCommand(`tmux swap-window -s ${src} -t ${dst}`);
  },

  // ── Pane helpers ────────────────────────────────────────────────────────────

  async listPanes(target?: string, allSessions = false): Promise<CommandResult> {
    if (allSessions) return executeCommand('tmux list-panes -a');
    if (target) return executeCommand(`tmux list-panes -t ${target}`);
    return executeCommand('tmux list-panes');
  },

  async killPane(target?: string): Promise<CommandResult> {
    if (target) return executeCommand(`tmux kill-pane -t ${target}`);
    return executeCommand('tmux kill-pane');
  },

  async splitWindow(target?: string, vertical = false, percent?: number): Promise<CommandResult> {
    const parts = ['tmux', 'split-window', vertical ? '-v' : '-h'];
    if (target) parts.push('-t', target);
    if (percent !== undefined) parts.push('-p', String(percent));
    return executeCommand(parts.join(' '));
  },

  async swapPane(src: string, dst: string): Promise<CommandResult> {
    return executeCommand(`tmux swap-pane -s ${src} -t ${dst}`);
  },

  // ── Keys / capture ──────────────────────────────────────────────────────────

  async sendKeys(target: string, keys: string, enter = true): Promise<CommandResult> {
    const parts = ['tmux', 'send-keys', '-t', target, `"${keys}"`];
    if (enter) parts.push('Enter');
    return executeCommand(parts.join(' '));
  },

  async capturePane(target?: string, joinLines = false): Promise<CommandResult> {
    const parts = ['tmux', 'capture-pane', '-p'];
    if (joinLines) parts.push('-J');
    if (target) parts.push('-t', target);
    return executeCommand(parts.join(' '));
  },

  // ── Options ─────────────────────────────────────────────────────────────────

  async setOption(option: string, value: string, global = true): Promise<CommandResult> {
    return executeCommand(`tmux set-option ${global ? '-g' : ''} ${option} ${value}`.trim());
  },

  async setWindowOption(option: string, value: string, global = true): Promise<CommandResult> {
    return executeCommand(`tmux set-window-option ${global ? '-g' : ''} ${option} ${value}`.trim());
  },

  async sourceFile(path = '~/.tmux.conf'): Promise<CommandResult> {
    return executeCommand(`tmux source-file ${path}`);
  },

  async displayMessage(message: string): Promise<CommandResult> {
    return executeCommand(`tmux display-message "${message}"`);
  },

  async version(): Promise<CommandResult> {
    return executeCommand('tmux -V');
  },
};
