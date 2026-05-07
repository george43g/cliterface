import { type CommandResult, executeCommand } from '../utils/execute-command';

export type { CommandResult };

/**
 * vim / neovim execution service
 *
 * vim is not really a "flags-first" tool — it's interactive. This service
 * handles the handful of truly useful non-interactive invocations (e.g. run
 * a script, open in read-only mode, check version) and builds the shell
 * command string so the user can copy-paste it.
 */

export interface VimCliOptions {
  /** -c <cmd>  Execute ex-command after loading first file */
  exCmd?: string;
  /** --cmd <cmd>  Execute ex-command BEFORE loading any file */
  preCmd?: string;
  /** -u <vimrc>  Use specified vimrc / NONE / NORC */
  vimrc?: string;
  /** -R  Read-only mode */
  readOnly?: boolean;
  /** --clean  No plugins, no vimrc (nvim) */
  clean?: boolean;
  /** +N  Open at line N (or last line if N is "$") */
  lineNumber?: string;
  /** -p  Open files in separate tabs */
  openTabs?: boolean;
  /** -O  Open files side-by-side */
  openSplit?: boolean;
  /** file(s) to open */
  files?: string;
  /** nvim instead of vim */
  useNvim?: boolean;
}

export function buildVimCommand(opts: VimCliOptions): string {
  const bin = opts.useNvim ? 'nvim' : 'vim';
  const parts: string[] = [bin];

  if (opts.clean) parts.push('--clean');
  if (opts.vimrc) parts.push('-u', opts.vimrc);
  if (opts.readOnly) parts.push('-R');
  if (opts.openTabs) parts.push('-p');
  if (opts.openSplit) parts.push('-O');
  if (opts.lineNumber) parts.push(`+${opts.lineNumber}`);
  if (opts.preCmd) parts.push('--cmd', `"${opts.preCmd}"`);
  if (opts.exCmd) parts.push('-c', `"${opts.exCmd}"`);
  if (opts.files) parts.push(opts.files);

  return parts.join(' ');
}

export const vimService = {
  async version(useNvim = false): Promise<CommandResult> {
    return executeCommand(`${useNvim ? 'nvim' : 'vim'} --version`);
  },

  async runScript(script: string, file: string, useNvim = false): Promise<CommandResult> {
    const bin = useNvim ? 'nvim' : 'vim';
    return executeCommand(`${bin} -c "${script}" -c "qa!" ${file}`);
  },

  async openReadOnly(file: string, useNvim = false): Promise<CommandResult> {
    const bin = useNvim ? 'nvim' : 'vim';
    return executeCommand(`${bin} -R ${file}`);
  },
};
