/**
 * Canonical command-execution contract for Cliterface tool services.
 *
 * Every tool's service module sends commands through this single integration
 * point. Today it's a stub returning mock output; in production this body is
 * swapped for a native bridge call (Tauri invoke, WKWebView postMessage,
 * Electron IPC, fetch to local HTTP API). The component layer never needs to
 * change.
 *
 * Tool-specific services (e.g. yabai-service, docker-service, task-service)
 * may keep richer mock implementations for testing; those should be kept as
 * private helpers internal to the service, not re-exported as the canonical
 * stub. Cross-tool imports go through this file.
 */

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export async function executeCommand(command: string): Promise<CommandResult> {
  console.log('[executeCommand]', command);
  return {
    stdout: `Mock output for: ${command}`,
    exitCode: 0,
  };
}
