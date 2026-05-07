import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * nmap execution service
 * NOTE: executeCommand is a stub — replace its body with your native bridge
 * (Tauri invoke, Electron IPC, WKWebView handler, HTTP POST, etc.)
 */
export const nmapService = {
  async execute(args: string): Promise<CommandResult> {
    return executeCommand(`nmap ${args}`);
  },

  async version(): Promise<string> {
    const result = await executeCommand('nmap --version');
    return result.stdout.trim() || 'nmap (version unknown)';
  },
};
