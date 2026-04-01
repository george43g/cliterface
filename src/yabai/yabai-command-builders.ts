export type QueryDomain = 'displays' | 'spaces' | 'windows';
export type QueryArgumentType = '' | 'display' | 'space' | 'window';

export interface QueryCommandOptions {
  domain: QueryDomain;
  properties?: string;
  argumentType?: QueryArgumentType;
  argumentValue?: string;
}

export interface RuleCommandOptions {
  label?: string;
  app?: string;
  appNegated?: boolean;
  title?: string;
  titleNegated?: boolean;
  role?: string;
  roleNegated?: boolean;
  subrole?: string;
  subroleNegated?: boolean;
  display?: string;
  displayFollowFocus?: boolean;
  space?: string;
  spaceFollowFocus?: boolean;
  manage?: string;
  sticky?: string;
  mouseFollowsFocus?: string;
  subLayer?: string;
  opacity?: string;
  nativeFullscreen?: string;
  grid?: string;
  scratchpad?: string;
  oneShot?: boolean;
}

export interface SignalCommandOptions {
  event?: string;
  action?: string;
  label?: string;
  app?: string;
  appNegated?: boolean;
  title?: string;
  titleNegated?: boolean;
  active?: '' | 'yes' | 'no';
}

const SPECIAL_SHELL_CHARS = /[\s"'`$\\]/;

export function formatCliValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (!SPECIAL_SHELL_CHARS.test(trimmed)) {
    return trimmed;
  }

  return `"${trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').replace(/\n/g, '\\n')}"`;
}

function normalizeProperties(properties?: string): string {
  return (
    properties
      ?.split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .join(',') ?? ''
  );
}

function pushAssignment(parts: string[], key: string, value?: string): void {
  const trimmed = value?.trim();

  if (trimmed) {
    parts.push(`${key}=${formatCliValue(trimmed)}`);
  }
}

function pushSelectorAssignment(parts: string[], key: string, value?: string, followFocus = false): void {
  const trimmed = value?.trim();

  if (trimmed) {
    parts.push(`${key}=${followFocus ? '^' : ''}${formatCliValue(trimmed)}`);
  }
}

export function buildQueryCommand(options: QueryCommandOptions): string {
  const parts = ['yabai', '-m', 'query', `--${options.domain}`];
  const properties = normalizeProperties(options.properties);

  if (properties) {
    parts.push(properties);
  }

  if (options.argumentType) {
    parts.push(`--${options.argumentType}`);

    const argumentValue = options.argumentValue?.trim();
    if (argumentValue) {
      parts.push(formatCliValue(argumentValue));
    }
  }

  return parts.join(' ');
}

export function buildRuleCommand(options: RuleCommandOptions, mode: 'add' | 'apply' = 'add'): string {
  const parts = ['yabai', '-m', 'rule', mode === 'add' ? '--add' : '--apply'];

  if (mode === 'add' && options.oneShot) {
    parts.push('--one-shot');
  }

  pushAssignment(parts, 'label', options.label);
  pushAssignment(parts, `app${options.appNegated ? '!' : ''}`, options.app);
  pushAssignment(parts, `title${options.titleNegated ? '!' : ''}`, options.title);
  pushAssignment(parts, `role${options.roleNegated ? '!' : ''}`, options.role);
  pushAssignment(parts, `subrole${options.subroleNegated ? '!' : ''}`, options.subrole);
  pushSelectorAssignment(parts, 'display', options.display, options.displayFollowFocus);
  pushSelectorAssignment(parts, 'space', options.space, options.spaceFollowFocus);
  pushAssignment(parts, 'manage', options.manage);
  pushAssignment(parts, 'sticky', options.sticky);
  pushAssignment(parts, 'mouse_follows_focus', options.mouseFollowsFocus);
  pushAssignment(parts, 'sub-layer', options.subLayer);
  pushAssignment(parts, 'opacity', options.opacity);
  pushAssignment(parts, 'native-fullscreen', options.nativeFullscreen);
  pushAssignment(parts, 'grid', options.grid);
  pushAssignment(parts, 'scratchpad', options.scratchpad);

  return parts.join(' ');
}

export function buildSignalCommand(options: SignalCommandOptions): string {
  const parts = ['yabai', '-m', 'signal', '--add'];

  pushAssignment(parts, 'event', options.event);
  pushAssignment(parts, 'action', options.action);
  pushAssignment(parts, 'label', options.label);
  pushAssignment(parts, `app${options.appNegated ? '!' : ''}`, options.app);
  pushAssignment(parts, `title${options.titleNegated ? '!' : ''}`, options.title);
  pushAssignment(parts, 'active', options.active);

  return parts.join(' ');
}
