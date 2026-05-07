import { type CommandResult, executeCommand } from '../utils/execute-command';

export type { CommandResult };
export { executeCommand };

/**
 * zsh / zprezto execution service — stub implementation.
 * Replace `executeCommand` body with a native bridge (Tauri, Electron, WKWebView, HTTP) to go live.
 */
export const zshService = {
  async version(): Promise<CommandResult> {
    return executeCommand('zsh --version');
  },

  async listBindings(mode: 'emacs' | 'vi'): Promise<CommandResult> {
    return executeCommand(`zsh -c "bindkey -${mode === 'emacs' ? 'e' : 'v'} && bindkey"`);
  },

  async listAliases(): Promise<CommandResult> {
    return executeCommand('zsh -ic "alias"');
  },

  async listModules(): Promise<CommandResult> {
    return executeCommand('zsh -c "zmodload"');
  },
};
