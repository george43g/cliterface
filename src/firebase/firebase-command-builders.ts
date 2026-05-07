/**
 * Firebase CLI command builders
 * Constructs validated command strings for firebase-service.ts
 */

export interface DeployOptions {
  projectId?: string;
  only?: string[];
  except?: string[];
  message?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface EmulatorOptions {
  only?: string[];
  importDir?: string;
  exportOnExit?: string;
  inspectFunctions?: boolean;
}

export interface FunctionsLogOptions {
  only?: string;
  lines?: number;
  projectId?: string;
}

/** Build a `firebase deploy` command string from structured options. */
export function buildDeployCommand(opts: DeployOptions): string {
  const parts: string[] = ['firebase deploy'];
  if (opts.projectId) parts.push(`--project ${opts.projectId}`);
  if (opts.only && opts.only.length > 0) parts.push(`--only ${opts.only.join(',')}`);
  if (opts.except && opts.except.length > 0) parts.push(`--except ${opts.except.join(',')}`);
  if (opts.message) parts.push(`--message "${opts.message}"`);
  if (opts.force) parts.push('--force');
  if (opts.dryRun) parts.push('--dry-run');
  return parts.join(' ');
}

/** Build a `firebase emulators:start` command from structured options. */
export function buildEmulatorCommand(opts: EmulatorOptions): string {
  const parts: string[] = ['firebase emulators:start'];
  if (opts.only && opts.only.length > 0) parts.push(`--only ${opts.only.join(',')}`);
  if (opts.importDir) parts.push(`--import ${opts.importDir}`);
  if (opts.exportOnExit) parts.push(`--export-on-exit ${opts.exportOnExit}`);
  if (opts.inspectFunctions) parts.push('--inspect-functions');
  return parts.join(' ');
}

/** Build a `firebase functions:log` command. */
export function buildFunctionsLogCommand(opts: FunctionsLogOptions): string {
  const parts: string[] = ['firebase functions:log'];
  if (opts.projectId) parts.push(`--project ${opts.projectId}`);
  if (opts.only) parts.push(`--only ${opts.only}`);
  if (opts.lines !== undefined) parts.push(`--lines ${opts.lines}`);
  return parts.join(' ');
}

/** Deploy target options for the deploy tab checkboxes. */
export const DEPLOY_TARGETS = [
  { id: 'hosting', label: 'Hosting', description: 'Static site + CDN' },
  { id: 'functions', label: 'Functions', description: 'Cloud Functions for Firebase' },
  { id: 'firestore', label: 'Firestore', description: 'Firestore rules + indexes' },
  { id: 'database', label: 'Database', description: 'Realtime Database rules' },
  { id: 'storage', label: 'Storage', description: 'Cloud Storage rules' },
  { id: 'auth', label: 'Auth', description: 'Firebase Auth config' },
] as const;

/** Emulator names available for selection. */
export const EMULATOR_OPTIONS = [
  { id: 'auth', label: 'Auth' },
  { id: 'functions', label: 'Functions' },
  { id: 'firestore', label: 'Firestore' },
  { id: 'database', label: 'Database' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'pubsub', label: 'Pub/Sub' },
  { id: 'storage', label: 'Storage' },
  { id: 'eventarc', label: 'Eventarc' },
] as const;

/** Firebase features available for `firebase init`. */
export const INIT_FEATURES = [
  { id: 'hosting', label: 'Hosting', description: 'Configure Firebase Hosting' },
  { id: 'functions', label: 'Functions', description: 'Set up Cloud Functions' },
  { id: 'firestore', label: 'Firestore', description: 'Set up Cloud Firestore' },
  { id: 'database', label: 'Realtime Database', description: 'Set up Realtime Database' },
  { id: 'storage', label: 'Storage', description: 'Set up Cloud Storage' },
  { id: 'auth', label: 'Auth', description: 'Set up Firebase Auth (Emulator)' },
  { id: 'emulators', label: 'Emulators', description: 'Set up local emulators' },
  { id: 'remoteconfig', label: 'Remote Config', description: 'Set up Remote Config' },
] as const;

/** App platforms supported for `firebase apps:create`. */
export const APP_PLATFORMS = [
  { value: 'WEB', label: 'Web' },
  { value: 'IOS', label: 'iOS' },
  { value: 'ANDROID', label: 'Android' },
] as const;
