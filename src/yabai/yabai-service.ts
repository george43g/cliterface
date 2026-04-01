export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export interface YabaiQueryResponse<T> {
  data: T;
  error?: string;
}

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
  manage?: boolean;
  sticky?: boolean;
  mouse_follows_focus?: boolean;
  'sub-layer': string;
  'native-fullscreen'?: boolean;
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
  'dock_did_change_pref',
  'dock_did_restart',
  'menu_bar_hidden_changed',
  'system_woke',
] as const;

const MOCK_DISPLAYS: YabaiDisplay[] = [
  {
    id: 1,
    uuid: 'DISPLAY-UUID-1',
    index: 1,
    label: 'main',
    frame: { x: 0, y: 0, w: 1728, h: 1117 },
    spaces: [1, 2, 3],
    'has-focus': true,
  },
  {
    id: 2,
    uuid: 'DISPLAY-UUID-2',
    index: 2,
    label: 'left',
    frame: { x: -1440, y: 80, w: 1440, h: 900 },
    spaces: [4, 5],
    'has-focus': false,
  },
];

const MOCK_SPACES: YabaiSpace[] = [
  {
    id: 11,
    uuid: 'SPACE-UUID-1',
    index: 1,
    label: 'web',
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
    id: 12,
    uuid: 'SPACE-UUID-2',
    index: 2,
    label: 'code',
    type: 'stack',
    display: 1,
    windows: [102],
    'first-window': 102,
    'last-window': 102,
    'has-focus': false,
    'is-visible': false,
    'is-native-fullscreen': false,
  },
  {
    id: 13,
    uuid: 'SPACE-UUID-3',
    index: 3,
    label: 'chat',
    type: 'float',
    display: 1,
    windows: [],
    'first-window': 0,
    'last-window': 0,
    'has-focus': false,
    'is-visible': false,
    'is-native-fullscreen': false,
  },
  {
    id: 21,
    uuid: 'SPACE-UUID-4',
    index: 4,
    label: 'aux',
    type: 'bsp',
    display: 2,
    windows: [201],
    'first-window': 201,
    'last-window': 201,
    'has-focus': false,
    'is-visible': true,
    'is-native-fullscreen': false,
  },
  {
    id: 22,
    uuid: 'SPACE-UUID-5',
    index: 5,
    label: 'media',
    type: 'float',
    display: 2,
    windows: [],
    'first-window': 0,
    'last-window': 0,
    'has-focus': false,
    'is-visible': false,
    'is-native-fullscreen': false,
  },
];

const MOCK_WINDOWS: YabaiWindow[] = [
  {
    id: 100,
    pid: 4101,
    app: 'Safari',
    title: 'Cliterface Roadmap',
    scratchpad: '',
    frame: { x: 0, y: 0, w: 864, h: 1117 },
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
    'split-type': 'vertical',
    'split-child': 'first_child',
    'stack-index': 0,
    'can-move': true,
    'can-resize': true,
    'has-focus': false,
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
  {
    id: 101,
    pid: 4102,
    app: 'Terminal',
    title: 'cliterface — bun run dev',
    scratchpad: '',
    frame: { x: 864, y: 0, w: 864, h: 1117 },
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
    'split-type': 'vertical',
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
  {
    id: 102,
    pid: 4103,
    app: 'VS Code',
    title: 'src/components/yabai-gui/yabai-gui.tsx',
    scratchpad: '',
    frame: { x: 80, y: 64, w: 1568, h: 989 },
    role: 'AXWindow',
    subrole: 'AXStandardWindow',
    'root-window': true,
    display: 1,
    space: 2,
    level: 0,
    'sub-level': 0,
    layer: 'normal',
    'sub-layer': 'normal',
    opacity: 0.95,
    'split-type': 'none',
    'split-child': 'none',
    'stack-index': 1,
    'can-move': true,
    'can-resize': true,
    'has-focus': false,
    'has-shadow': true,
    'has-parent-zoom': false,
    'has-fullscreen-zoom': false,
    'has-ax-reference': true,
    'is-native-fullscreen': false,
    'is-visible': false,
    'is-minimized': false,
    'is-hidden': false,
    'is-floating': false,
    'is-sticky': false,
    'is-grabbed': false,
  },
  {
    id: 201,
    pid: 4201,
    app: 'Music',
    title: 'Lo-fi Playlist',
    scratchpad: 'player',
    frame: { x: -1320, y: 120, w: 1200, h: 760 },
    role: 'AXWindow',
    subrole: 'AXStandardWindow',
    'root-window': true,
    display: 2,
    space: 4,
    level: 0,
    'sub-level': 0,
    layer: 'normal',
    'sub-layer': 'above',
    opacity: 1,
    'split-type': 'none',
    'split-child': 'none',
    'stack-index': 0,
    'can-move': true,
    'can-resize': true,
    'has-focus': false,
    'has-shadow': true,
    'has-parent-zoom': false,
    'has-fullscreen-zoom': false,
    'has-ax-reference': true,
    'is-native-fullscreen': false,
    'is-visible': true,
    'is-minimized': false,
    'is-hidden': false,
    'is-floating': true,
    'is-sticky': true,
    'is-grabbed': false,
  },
];

const MOCK_RULES: YabaiRule[] = [
  {
    index: 0,
    label: 'finder-float',
    app: '^Finder$',
    title: 'Info|Copy',
    role: '',
    subrole: '',
    display: 0,
    space: 0,
    follow_space: false,
    opacity: 0,
    manage: false,
    sticky: false,
    mouse_follows_focus: false,
    'sub-layer': 'above',
    'native-fullscreen': false,
    grid: '',
    scratchpad: '',
    'one-shot': false,
    flags: 'manage=off, sub-layer=above',
  },
  {
    index: 1,
    label: 'player-scratchpad',
    app: '^Music$',
    title: '',
    role: '',
    subrole: '',
    display: 0,
    space: 0,
    follow_space: false,
    opacity: 0.9,
    manage: false,
    sticky: true,
    mouse_follows_focus: true,
    'sub-layer': 'above',
    'native-fullscreen': false,
    grid: '1:4:3:0:1:1',
    scratchpad: 'player',
    'one-shot': false,
    flags: 'sticky=on, scratchpad=player',
  },
];

const MOCK_SIGNALS: YabaiSignal[] = [
  {
    index: 0,
    label: 'flash_focus',
    app: '',
    title: '',
    active: true,
    event: 'window_focused',
    action: 'yabai -m window --opacity 0.1 && sleep 0.05 && yabai -m window --opacity 0.0',
  },
  {
    index: 1,
    label: 'reload_sa',
    app: '',
    title: '',
    active: false,
    event: 'dock_did_restart',
    action: 'sudo yabai --load-sa',
  },
];

const HELP_OUTPUT = `yabai (mock)

Supported flows in this demo bridge:
  yabai -m query --displays|--spaces|--windows
  yabai -m rule --list|--add|--apply|--remove
  yabai -m signal --list|--add|--remove
  yabai --install-service|--start-service|--restart-service|--stop-service|--uninstall-service
  yabai --load-sa`;

function tokenizeCommand(command: string): string[] {
  const matches = command.match(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\S+/g) ?? [];

  return matches.map(token => {
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return token
        .slice(1, -1)
        .replace(/\\(["\\$`])/g, '$1')
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\');
    }

    return token;
  });
}

function getFlagValue(tokens: string[], flag: string): { present: boolean; value?: string } {
  const index = tokens.indexOf(flag);

  if (index === -1) {
    return { present: false };
  }

  const next = tokens[index + 1];
  if (!next || next.startsWith('--')) {
    return { present: true };
  }

  return { present: true, value: next };
}

function findFocusedDisplay(): YabaiDisplay {
  return MOCK_DISPLAYS.find(display => display['has-focus']) ?? MOCK_DISPLAYS[0];
}

function findFocusedSpace(): YabaiSpace {
  return MOCK_SPACES.find(space => space['has-focus']) ?? MOCK_SPACES[0];
}

function findFocusedWindow(): YabaiWindow {
  return MOCK_WINDOWS.find(window => window['has-focus']) ?? MOCK_WINDOWS[0];
}

function rotateSelection<T>(items: T[], currentIndex: number, offset: number): T {
  return items[(currentIndex + offset + items.length) % items.length];
}

function resolveDisplaySelector(selector?: string): YabaiDisplay | undefined {
  const displays = [...MOCK_DISPLAYS].sort((left, right) => left.index - right.index);
  const focusedDisplay = findFocusedDisplay();
  const focusedIndex = displays.findIndex(display => display.index === focusedDisplay.index);
  const normalized = selector?.trim();

  if (!normalized || normalized === 'mouse') {
    return focusedDisplay;
  }

  switch (normalized) {
    case 'prev':
      return rotateSelection(displays, focusedIndex, -1);
    case 'next':
      return rotateSelection(displays, focusedIndex, 1);
    case 'first':
      return displays[0];
    case 'last':
      return displays[displays.length - 1];
    case 'recent':
      return displays.find(display => display.index !== focusedDisplay.index) ?? focusedDisplay;
    default:
      if (/^\d+$/.test(normalized)) {
        return displays.find(display => display.index === Number(normalized));
      }

      return displays.find(display => display.label === normalized || display.uuid === normalized);
  }
}

function resolveSpaceSelector(selector?: string): YabaiSpace | undefined {
  const spaces = [...MOCK_SPACES].sort((left, right) => left.index - right.index);
  const focusedSpace = findFocusedSpace();
  const focusedIndex = spaces.findIndex(space => space.index === focusedSpace.index);
  const normalized = selector?.trim();

  if (!normalized || normalized === 'mouse') {
    return focusedSpace;
  }

  switch (normalized) {
    case 'prev':
      return rotateSelection(spaces, focusedIndex, -1);
    case 'next':
      return rotateSelection(spaces, focusedIndex, 1);
    case 'first':
      return spaces[0];
    case 'last':
      return spaces[spaces.length - 1];
    case 'recent':
      return spaces.find(space => space.index !== focusedSpace.index) ?? focusedSpace;
    default:
      if (/^\d+$/.test(normalized)) {
        return spaces.find(space => space.index === Number(normalized));
      }

      return spaces.find(space => space.label === normalized || space.uuid === normalized);
  }
}

function resolveWindowSelector(selector?: string): YabaiWindow | undefined {
  const windows = [...MOCK_WINDOWS];
  const focusedWindow = findFocusedWindow();
  const focusedIndex = windows.findIndex(window => window.id === focusedWindow.id);
  const normalized = selector?.trim();

  if (!normalized || normalized === 'mouse') {
    return focusedWindow;
  }

  switch (normalized) {
    case 'prev':
      return rotateSelection(windows, focusedIndex, -1);
    case 'next':
      return rotateSelection(windows, focusedIndex, 1);
    case 'first':
      return windows[0];
    case 'last':
      return windows[windows.length - 1];
    case 'recent':
      return windows.find(window => window.id !== focusedWindow.id) ?? focusedWindow;
    case 'largest':
      return [...windows].sort((left, right) => right.frame.w * right.frame.h - left.frame.w * left.frame.h)[0];
    case 'smallest':
      return [...windows].sort((left, right) => left.frame.w * left.frame.h - right.frame.w * right.frame.h)[0];
    default:
      if (/^\d+$/.test(normalized)) {
        return windows.find(window => window.id === Number(normalized));
      }

      return undefined;
  }
}

function extractQueryProperties(tokens: string[]): string[] {
  const queryIndex = tokens.findIndex(token => token === '--displays' || token === '--spaces' || token === '--windows');
  const propertiesToken = queryIndex >= 0 ? tokens[queryIndex + 1] : undefined;

  if (!propertiesToken || propertiesToken.startsWith('--')) {
    return [];
  }

  return propertiesToken
    .split(',')
    .map(property => property.trim())
    .filter(Boolean);
}

function selectProperties<T extends object>(data: T | T[] | null, properties: string[]) {
  if (!properties.length || data === null) {
    return data;
  }

  const pick = (item: T) => {
    const record = item as Record<string, unknown>;
    return Object.fromEntries(properties.filter(property => property in record).map(property => [property, record[property]]));
  };

  return Array.isArray(data) ? data.map(pick) : pick(data);
}

function formatQueryOutput<T extends object>(data: T[], properties: string[], singleResult = false): string {
  const selected = singleResult ? (data[0] ?? null) : data;
  return JSON.stringify(selectProperties(selected, properties), null, 2);
}

function handleQueryCommand(tokens: string[]): CommandResult | null {
  const properties = extractQueryProperties(tokens);
  const displayConstraint = getFlagValue(tokens, '--display');
  const spaceConstraint = getFlagValue(tokens, '--space');
  const windowConstraint = getFlagValue(tokens, '--window');

  if (tokens.includes('--displays')) {
    const displays = displayConstraint.present ? ([resolveDisplaySelector(displayConstraint.value)].filter(Boolean) as YabaiDisplay[]) : MOCK_DISPLAYS;

    return {
      stdout: formatQueryOutput(displays, properties, displayConstraint.present),
      exitCode: 0,
    };
  }

  if (tokens.includes('--spaces')) {
    let spaces = [...MOCK_SPACES];

    if (displayConstraint.present) {
      const display = resolveDisplaySelector(displayConstraint.value);
      spaces = display ? spaces.filter(space => space.display === display.index) : [];
    }

    if (spaceConstraint.present) {
      const space = resolveSpaceSelector(spaceConstraint.value);
      spaces = space ? spaces.filter(entry => entry.index === space.index) : [];
    }

    return {
      stdout: formatQueryOutput(spaces, properties, spaceConstraint.present),
      exitCode: 0,
    };
  }

  if (tokens.includes('--windows')) {
    let windows = [...MOCK_WINDOWS];

    if (displayConstraint.present) {
      const display = resolveDisplaySelector(displayConstraint.value);
      windows = display ? windows.filter(window => window.display === display.index) : [];
    }

    if (spaceConstraint.present) {
      const space = resolveSpaceSelector(spaceConstraint.value);
      windows = space ? windows.filter(window => window.space === space.index) : [];
    }

    if (windowConstraint.present) {
      const window = resolveWindowSelector(windowConstraint.value);
      windows = window ? windows.filter(entry => entry.id === window.id) : [];
    }

    return {
      stdout: formatQueryOutput(windows, properties, windowConstraint.present),
      exitCode: 0,
    };
  }

  return null;
}

function describeOperation(tokens: string[]): string {
  if (tokens.includes('--install-service')) {
    return 'Installed launchd service definition (mock).';
  }

  if (tokens.includes('--uninstall-service')) {
    return 'Removed launchd service definition (mock).';
  }

  if (tokens.includes('--start-service')) {
    return 'Started yabai service (mock).';
  }

  if (tokens.includes('--restart-service')) {
    return 'Restarted yabai service (mock).';
  }

  if (tokens.includes('--stop-service')) {
    return 'Stopped yabai service (mock).';
  }

  if (tokens.includes('--load-sa')) {
    return 'Loaded scripting addition into Dock.app (mock).';
  }

  if (tokens.includes('--apply') && tokens.includes('rule')) {
    return 'Applied rule(s) to currently known windows (mock).';
  }

  if (tokens.includes('--remove') && tokens.includes('rule')) {
    return `Removed rule ${tokens[tokens.indexOf('--remove') + 1] ?? '(selector missing)'} (mock).`;
  }

  if (tokens.includes('--add') && tokens.includes('rule')) {
    return 'Added rule to yabai rule table (mock).';
  }

  if (tokens.includes('--remove') && tokens.includes('signal')) {
    return `Removed signal ${tokens[tokens.indexOf('--remove') + 1] ?? '(selector missing)'} (mock).`;
  }

  if (tokens.includes('--add') && tokens.includes('signal')) {
    return 'Added signal to yabai event table (mock).';
  }

  if (tokens.includes('config')) {
    return `Updated configuration: ${tokens.slice(tokens.indexOf('config') + 1).join(' ')} (mock).`;
  }

  return `Command executed successfully (mock): ${tokens.join(' ')}`;
}

export async function executeCommand(command: string): Promise<CommandResult> {
  console.log('[executeCommand]', command);

  const tokens = tokenizeCommand(command);

  if (tokens.includes('-v') || tokens.includes('--version')) {
    return { stdout: 'yabai-v7.1.17 (mock bridge)', exitCode: 0 };
  }

  if (tokens.includes('-h') || tokens.includes('--help')) {
    return { stdout: HELP_OUTPUT, exitCode: 0 };
  }

  const queryResult = handleQueryCommand(tokens);
  if (queryResult) {
    return queryResult;
  }

  if (tokens.includes('rule') && tokens.includes('--list')) {
    return { stdout: JSON.stringify(MOCK_RULES, null, 2), exitCode: 0 };
  }

  if (tokens.includes('signal') && tokens.includes('--list')) {
    return { stdout: JSON.stringify(MOCK_SIGNALS, null, 2), exitCode: 0 };
  }

  return {
    stdout: describeOperation(tokens),
    exitCode: 0,
  };
}

export const yabai = {
  async window(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m window ${args}`);
  },

  async space(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m space ${args}`);
  },

  async display(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m display ${args}`);
  },

  async config(key: string, value: string): Promise<CommandResult> {
    return executeCommand(`yabai -m config ${key} ${value}`);
  },

  async rule(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m rule ${args}`);
  },

  async signal(args: string): Promise<CommandResult> {
    return executeCommand(`yabai -m signal ${args}`);
  },

  async service(action: string): Promise<CommandResult> {
    return executeCommand(`yabai --${action}-service`);
  },

  async query(type: 'displays' | 'spaces' | 'windows', properties = '', argumentType: '' | 'display' | 'space' | 'window' = '', argumentValue = ''): Promise<CommandResult> {
    let command = `yabai -m query --${type}`;

    if (properties.trim()) {
      command += ` ${properties.trim()}`;
    }

    if (argumentType) {
      command += ` --${argumentType}`;
    }

    if (argumentValue.trim()) {
      command += ` ${argumentValue.trim()}`;
    }

    return executeCommand(command);
  },
};

export type CommandStatus = 'idle' | 'running' | 'success' | 'error';

export interface StatusState {
  status: CommandStatus;
  message: string;
  lastCommand: string;
}
