import { z } from 'zod';

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

/**
 * Core command execution stub — replace this body with a real native bridge.
 * Tauri:    return await invoke('execute', { command: cmd });
 * Electron: return await ipcRenderer.invoke('exec', cmd);
 * WKWebView: return await window.webkit.messageHandlers.exec.postMessage(cmd);
 */
export async function executeCommand(cmd: string): Promise<CommandResult> {
  console.log('[firebase:executeCommand]', cmd);
  return { stdout: `[mock] ${cmd}`, exitCode: 0 };
}

// ── Zod validators ────────────────────────────────────────────────────────────

export const ProjectIdSchema = z
  .string()
  .min(1, 'Project ID is required')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Project ID may only contain letters, digits, hyphens and underscores');

export const RegionSchema = z.enum([
  'us-central1',
  'us-east1',
  'us-east4',
  'us-west1',
  'us-west2',
  'us-west3',
  'us-west4',
  'northamerica-northeast1',
  'southamerica-east1',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west6',
  'asia-east1',
  'asia-east2',
  'asia-northeast1',
  'asia-northeast2',
  'asia-northeast3',
  'asia-south1',
  'asia-southeast1',
  'asia-southeast2',
  'australia-southeast1',
]);

export const DeployTargetSchema = z.enum(['hosting', 'functions', 'firestore', 'database', 'storage', 'auth']);

export const EmulatorSchema = z.enum(['auth', 'functions', 'firestore', 'database', 'hosting', 'pubsub', 'storage', 'eventarc']);

export type Region = z.infer<typeof RegionSchema>;
export type DeployTarget = z.infer<typeof DeployTargetSchema>;
export type Emulator = z.infer<typeof EmulatorSchema>;

// ── Service helpers ───────────────────────────────────────────────────────────

/** Base firebase invocation, optionally scoped to a project. */
function firebase(subcommand: string, projectId?: string): string {
  const projectFlag = projectId ? ` --project ${projectId}` : '';
  return `firebase${projectFlag} ${subcommand}`;
}

export const firebaseService = {
  // Auth
  login(): Promise<CommandResult> {
    return executeCommand('firebase login');
  },
  loginCI(): Promise<CommandResult> {
    return executeCommand('firebase login:ci');
  },
  logout(email?: string): Promise<CommandResult> {
    return executeCommand(email ? `firebase logout ${email}` : 'firebase logout');
  },

  // Projects
  projectsList(): Promise<CommandResult> {
    return executeCommand('firebase projects:list');
  },
  use(projectId: string): Promise<CommandResult> {
    ProjectIdSchema.parse(projectId);
    return executeCommand(`firebase use ${projectId}`);
  },
  useClear(): Promise<CommandResult> {
    return executeCommand('firebase use --clear');
  },

  // Apps
  appsList(platform?: string): Promise<CommandResult> {
    return executeCommand(platform ? `firebase apps:list ${platform}` : 'firebase apps:list');
  },
  appsCreate(platform: string, displayName: string): Promise<CommandResult> {
    return executeCommand(`firebase apps:create ${platform} "${displayName}"`);
  },

  // Deploy
  deploy(opts: { projectId?: string; only?: string[]; except?: string[]; message?: string; force?: boolean; dryRun?: boolean } = {}): Promise<CommandResult> {
    const parts: string[] = ['firebase deploy'];
    if (opts.projectId) parts.push(`--project ${opts.projectId}`);
    if (opts.only && opts.only.length > 0) parts.push(`--only ${opts.only.join(',')}`);
    if (opts.except && opts.except.length > 0) parts.push(`--except ${opts.except.join(',')}`);
    if (opts.message) parts.push(`--message "${opts.message}"`);
    if (opts.force) parts.push('--force');
    if (opts.dryRun) parts.push('--dry-run');
    return executeCommand(parts.join(' '));
  },

  // Functions
  functionsList(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('functions:list', projectId));
  },
  functionsLog(opts: { only?: string; lines?: number; projectId?: string } = {}): Promise<CommandResult> {
    const parts: string[] = [firebase('functions:log', opts.projectId)];
    if (opts.only) parts.push(`--only ${opts.only}`);
    if (opts.lines) parts.push(`--lines ${opts.lines}`);
    return executeCommand(parts.join(' '));
  },

  // Firestore
  firestoreDelete(path: string, opts: { recursive?: boolean; force?: boolean; projectId?: string } = {}): Promise<CommandResult> {
    const parts: string[] = [firebase(`firestore:delete "${path}"`, opts.projectId)];
    if (opts.recursive) parts.push('--recursive');
    if (opts.force) parts.push('--force');
    return executeCommand(parts.join(' '));
  },
  firestoreIndexes(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('firestore:indexes', projectId));
  },
  firestoreDatabasesList(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('firestore:databases:list', projectId));
  },

  // Realtime Database
  databaseGet(path: string, projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase(`database:get "${path}"`, projectId));
  },

  // Hosting
  hostingChannelList(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('hosting:channel:list', projectId));
  },
  hostingChannelCreate(channelId: string, projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase(`hosting:channel:create ${channelId}`, projectId));
  },
  hostingChannelDeploy(channelId: string, projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase(`hosting:channel:deploy ${channelId}`, projectId));
  },
  hostingSitesList(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('hosting:sites:list', projectId));
  },

  // Emulators
  emulatorsStart(emulators?: string[], importDir?: string): Promise<CommandResult> {
    const parts: string[] = ['firebase emulators:start'];
    if (emulators && emulators.length > 0) parts.push(`--only ${emulators.join(',')}`);
    if (importDir) parts.push(`--import ${importDir}`);
    return executeCommand(parts.join(' '));
  },

  // Extensions
  extList(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('ext:list', projectId));
  },

  // App Hosting
  apphostingBackendsList(projectId?: string): Promise<CommandResult> {
    return executeCommand(firebase('apphosting:backends:list', projectId));
  },

  // Raw command passthrough
  raw(cmd: string): Promise<CommandResult> {
    return executeCommand(cmd.startsWith('firebase') ? cmd : `firebase ${cmd}`);
  },
};
