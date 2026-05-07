import { executeCommand as _executeCommand, type CommandResult } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * zsh / zprezto execution service — stub implementation.
 * Replace `executeCommand` body with a native bridge (Tauri, Electron, WKWebView, HTTP) to go live.
 */
export async function executeCommand(cmd: string): Promise<CommandResult> {
  console.log('[zsh-service] executeCommand:', cmd);
  return _executeCommand(cmd);
}

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
