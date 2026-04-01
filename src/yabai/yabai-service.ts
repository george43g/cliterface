export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export interface YabaiQueryResponse<T> {
  data: T;
  error?: string;
}

// Display data structure from yabai query
type Frame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export interface YabaiDisplay {
  id: number;
  uuid: string;
  index: number;
  label: string;
  frame: Frame;
  spaces: number[];
  'has-focus': boolean;
}

export interface YabaiSpace {
  id: number;
  uuid: string;
  index: number;
  label: string;
  type: 'bsp' | 'stack' | 'float';
  display: number;
  windows: number[];
  'first-window': number;
  'last-window': number;
  'has-focus': boolean;
  'is-visible': boolean;
  'is-native-fullscreen': boolean;
}

export interface YabaiWindow {
  id: number;
  pid: number;
  app: string;
  title: string;
  scratchpad: string;
  frame: Frame;
  role: string;
  subrole: string;
  'root-window': boolean;
  display: number;
  space: number;
  level: number;
  'sub-level': number;
  layer: string;
  'sub-layer': string;
  opacity: number;
  'split-type': string;
  'split-child': string;
  'stack-index': number;
  'can-move': boolean;
  'can-resize': boolean;
  'has-focus': boolean;
  'has-shadow': boolean;
  'has-parent-zoom': boolean;
  'has-fullscreen-zoom': boolean;
  'has-ax-reference': boolean;
  'is-native-fullscreen': boolean;
  'is-visible': boolean;
  'is-minimized': boolean;
  'is-hidden': boolean;
  'is-floating': boolean;
  'is-sticky': boolean;
  'is-grabbed': boolean;
}

export interface YabaiRule {
  index: number;
  label: string;
  app: string;
  title: string;
  role: string;
  subrole: string;
  display: number;
  space: number;
  follow_space: boolean;
  opacity: number;
  manage: boolean;
  sticky: boolean;
  mouse_follows_focus: boolean;
  'sub-layer': string;
  'native-fullscreen': boolean;
  grid: string;
  scratchpad: string;
  'one-shot': boolean;
  flags: string;
}

export interface YabaiSignal {
  index: number;
  label: string;
  app: string;
  title: string;
  active: boolean;
  event: string;
  action: string;
}

// Event types for signals
export const SIGNAL_EVENTS = [
  'application_launched',
  'application_terminated',
  'application_front_switched',
  'application_activated',
  'application_deactivated',
  'application_visible',
  'application_hidden',
  'window_created',
  'window_destroyed',
  'window_focused',
  'window_moved',
  'window_resized',
  'window_minimized',
  'window_deminimized',
  'window_title_changed',
  'space_created',
  'space_destroyed',
  'space_changed',
  'display_added',
  'display_removed',
  'display_moved',
  'display_resized',
  'display_changed',
  'mission_control_enter',
  'mission_control_exit',
  'dock_did_restart',
  'system_woke',
] as const;

// CLI Command Executor - Native Bridge Stub
export async function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB: Replace with actual native bridge call
  // Examples:
  //   Tauri: return await invoke('execute', { command: cmd })
  //   Electron: return await ipcRenderer.invoke('exec', cmd)
  //   WKWebView: return await window.webkit.messageHandlers.exec.postMessage(cmd)
  //   HTTP: return await fetch('/api/exec', { method: 'POST', body: cmd })

  console.log('[executeCommand]', cmd);

  // Mock responses for demo
  if (cmd.includes('query --displays')) {
    const data: YabaiDisplay[] = [
      {
        id: 1,
        uuid: 'UUID-1',
        index: 1,
        label: '',
        frame: { x: 0, y: 0, w: 1920, h: 1080 },
        spaces: [1, 2, 3],
        'has-focus': true,
      },
    ];
    return { stdout: JSON.stringify(data, null, 2), exitCode: 0 };
  }

  if (cmd.includes('query --spaces')) {
    const data: YabaiSpace[] = [
      {
        id: 1,
        uuid: 'S1',
        index: 1,
        label: '',
        type: 'bsp',
        display: 1,
        windows: [100, 101],
        'first-window': 100,
        'last-window': 101,
        'has-focus': true,
        'is-visible': true,
        'is-native-fullscreen': false,
      },
      {
        id: 2,
        uuid: 'S2',
        index: 2,
        label: '',
        type: 'float',
        display: 1,
        windows: [],
        'first-window': 0,
        'last-window': 0,
        'has-focus': false,
        'is-visible': false,
        'is-native-fullscreen': false,
      },
    ];
    return { stdout: JSON.stringify(data, null, 2), exitCode: 0 };
  }

  if (cmd.includes('query --windows')) {
    const data: YabaiWindow[] = [
      {
        id: 100,
        pid: 1234,
        app: 'Safari',
        title: 'GitHub',
        scratchpad: '',
        frame: { x: 0, y: 0, w: 960, h: 1080 },
        role: 'AXWindow',
        subrole: 'AXStandardWindow',
        'root-window': true,
        display: 1,
        space: 1,
        level: 0,
        'sub-level': 0,
        layer: 'normal',
        'sub-layer': 'normal',
        opacity: 1,
        'split-type': 'horizontal',
        'split-child': 'second_child',
        'stack-index': 0,
        'can-move': true,
        'can-resize': true,
        'has-focus': true,
        'has-shadow': true,
        'has-parent-zoom': false,
        'has-fullscreen-zoom': false,
        'has-ax-reference': true,
        'is-native-fullscreen': false,
        'is-visible': true,
        'is-minimized': false,
        'is-hidden': false,
        'is-floating': false,
        'is-sticky': false,
        'is-grabbed': false,
      },
    ];
    return { stdout: JSON.stringify(data, null, 2), exitCode: 0 };
  }

  if (cmd.includes('rule --list')) {
    const data: YabaiRule[] = [
      {
        index: 0,
        label: 'Finder',
        app: 'Finder',
        title: '',
        role: '',
        subrole: '',
        display: 0,
        space: 0,
        follow_space: false,
        opacity: 0,
        manage: false,
        sticky: false,
        mouse_follows_focus: false,
        'sub-layer': '',
        'native-fullscreen': false,
        grid: '',
        scratchpad: '',
        'one-shot': false,
        flags: 'manage=off',
      },
    ];
    return { stdout: JSON.stringify(data, null, 2), exitCode: 0 };
  }

  if (cmd.includes('signal --list')) {
    const data: YabaiSignal[] = [
      {
        index: 0,
        label: '',
        app: '',
        title: '',
        active: false,
        event: 'application_launched',
        action: 'echo "App launched: $YABAI_PROCESS_ID"',
      },
    ];
    return { stdout: JSON.stringify(data, null, 2), exitCode: 0 };
  }

  // Generic mock success
  return {
    stdout: `Command executed successfully (mock): ${cmd}`,
    exitCode: 0,
  };
}

// Helper functions for specific operations
export const yabai = {
  // Window operations
  async window(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m window ${args}`);
  },

  // Space operations
  async space(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m space ${args}`);
  },

  // Display operations
  async display(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m display ${args}`);
  },

  // Config operations
  async config(key: string, value: string): Promise<CommandResult> {
    return executeCommand(`yabai -m config ${key} ${value}`);
  },

  // Rule operations
  async rule(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m rule ${args}`);
  },

  // Signal operations
  async signal(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m signal ${args}`);
  },

  // Service operations
  async service(action: string): Promise<CommandResult> {
    return executeCommand(`yabai --${action}-service`);
  },

  // Query operations
  async query(type: 'displays' | 'spaces' | 'windows', selector?: string, props?: string): Promise<CommandResult> {
    let cmd = `yabai -m query --${type}`;
    if (selector) cmd += ` ${selector}`;
    if (props) cmd += ` ${props}`;
    return executeCommand(cmd);
  },
};

// Status tracking
export type CommandStatus = 'idle' | 'running' | 'success' | 'error';

export interface StatusState {
  status: CommandStatus;
  message: string;
  lastCommand: string;
}
