/**
 * Docker Compose service module
 * Provides typed helpers for docker compose commands (Compose V2 plugin).
 * The single integration point is executeCommand() — swap the stub body
 * for a Tauri invoke, Electron IPC, WKWebView handler, or HTTP call.
 */

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_PS = `NAME                    IMAGE               COMMAND                  SERVICE    CREATED         STATUS              PORTS
myapp-web-1             nginx:alpine        "/docker-entrypoint.…"   web        2 hours ago     Up 2 hours          0.0.0.0:8080->80/tcp
myapp-api-1             node:20-alpine      "node server.js"         api        2 hours ago     Up 2 hours          0.0.0.0:3000->3000/tcp
myapp-db-1              postgres:16         "docker-entrypoint.s…"   db         2 hours ago     Up 2 hours          5432/tcp
myapp-redis-1           redis:7-alpine      "docker-entrypoint.s…"   redis      2 hours ago     Up 2 hours          6379/tcp`;

const MOCK_LOGS = `myapp-api-1  | > node server.js
myapp-api-1  | Server listening on port 3000
myapp-db-1   | PostgreSQL init process complete; ready for start up.
myapp-db-1   | 2024-01-15 10:00:00.000 UTC [1] LOG:  database system is ready to accept connections
myapp-web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
myapp-redis-1 | 1:M 15 Jan 2024 10:00:01.000 * Ready to accept connections`;

const MOCK_CONFIG = `name: myapp
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    depends_on:
      - api
  api:
    image: node:20-alpine
    command: node server.js
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db
      - redis
  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    volumes:
      - db-data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
volumes:
  db-data:`;

const MOCK_TOP = `myapp-web-1
UID    PID    PPID   C    STIME   TTY   TIME       CMD
root   1      0      0    10:00   ?     00:00:00   nginx: master process
nginx  7      1      0    10:00   ?     00:00:00   nginx: worker process

myapp-api-1
UID    PID    PPID   C    STIME   TTY   TIME       CMD
node   1      0      0    10:00   ?     00:00:02   node server.js

myapp-db-1
UID    PID    PPID   C    STIME   TTY   TIME       CMD
999    1      0      0    10:00   ?     00:00:01   postgres`;

const MOCK_VERSION = `Docker Compose version v2.24.6`;

const MOCK_LS = `NAME      STATUS    CONFIG FILES
myapp     running(4)  /home/user/myapp/docker-compose.yml
staging   exited(2)   /home/user/staging/compose.yml`;

const MOCK_IMAGES = `CONTAINER           REPOSITORY          TAG                 IMAGE ID       SIZE
myapp-web-1         nginx               alpine              2b7d6430f78d   23.5MB
myapp-api-1         node                20-alpine           b5d09d22b9d5   131MB
myapp-db-1          postgres            16                  75282fa4a430   432MB
myapp-redis-1       redis               7-alpine            3358aea34e8c   41.5MB`;

function mockResponse(cmd: string): CommandResult {
  const tokens = cmd.trim().split(/\s+/);
  const subCmd = tokens.find(t =>
    [
      'up',
      'down',
      'ps',
      'logs',
      'exec',
      'run',
      'build',
      'pull',
      'push',
      'start',
      'stop',
      'restart',
      'pause',
      'unpause',
      'kill',
      'rm',
      'config',
      'top',
      'port',
      'events',
      'cp',
      'watch',
      'version',
      'ls',
      'images',
      'scale',
      'stats',
    ].includes(t),
  );

  switch (subCmd) {
    case 'ps':
      return { stdout: MOCK_PS, exitCode: 0 };
    case 'logs':
      return { stdout: MOCK_LOGS, exitCode: 0 };
    case 'config':
      return { stdout: MOCK_CONFIG, exitCode: 0 };
    case 'top':
      return { stdout: MOCK_TOP, exitCode: 0 };
    case 'version':
      return { stdout: MOCK_VERSION, exitCode: 0 };
    case 'ls':
      return { stdout: MOCK_LS, exitCode: 0 };
    case 'images':
      return { stdout: MOCK_IMAGES, exitCode: 0 };
    case 'up':
      return {
        stdout:
          '[+] Running 4/4\n ✔ Container myapp-web-1    Started\n ✔ Container myapp-api-1    Started\n ✔ Container myapp-db-1     Started\n ✔ Container myapp-redis-1  Started',
        exitCode: 0,
      };
    case 'down':
      return {
        stdout:
          '[+] Running 5/5\n ✔ Container myapp-web-1    Removed\n ✔ Container myapp-api-1    Removed\n ✔ Container myapp-db-1     Removed\n ✔ Container myapp-redis-1  Removed\n ✔ Network myapp_default     Removed',
        exitCode: 0,
      };
    case 'build':
      return {
        stdout:
          '[+] Building 2.4s (10/10) FINISHED\n => [internal] load build definition\n => [internal] load .dockerignore\n => CACHED [1/3] FROM node:20-alpine\n => [2/3] COPY package*.json ./\n => [3/3] RUN npm ci\n => exporting to image',
        exitCode: 0,
      };
    case 'pull':
      return { stdout: '[+] Pulling 4/4\n ✔ web Pulled\n ✔ api Pulled\n ✔ db Pulled\n ✔ redis Pulled', exitCode: 0 };
    case 'push':
      return { stdout: '[+] Pushing 1/1\n ✔ api Pushed', exitCode: 0 };
    case 'start':
      return {
        stdout:
          '[+] Running 4/4\n ✔ Container myapp-web-1    Started\n ✔ Container myapp-api-1    Started\n ✔ Container myapp-db-1     Started\n ✔ Container myapp-redis-1  Started',
        exitCode: 0,
      };
    case 'stop':
      return {
        stdout:
          '[+] Stopping 4/4\n ✔ Container myapp-web-1    Stopped\n ✔ Container myapp-api-1    Stopped\n ✔ Container myapp-db-1     Stopped\n ✔ Container myapp-redis-1  Stopped',
        exitCode: 0,
      };
    case 'restart':
      return {
        stdout:
          '[+] Restarting 4/4\n ✔ Container myapp-web-1    Started\n ✔ Container myapp-api-1    Started\n ✔ Container myapp-db-1     Started\n ✔ Container myapp-redis-1  Started',
        exitCode: 0,
      };
    case 'pause':
      return {
        stdout: '[+] Pausing 4/4\n ✔ Container myapp-web-1    Paused\n ✔ Container myapp-api-1    Paused\n ✔ Container myapp-db-1     Paused\n ✔ Container myapp-redis-1  Paused',
        exitCode: 0,
      };
    case 'unpause':
      return {
        stdout:
          '[+] Unpausing 4/4\n ✔ Container myapp-web-1    Unpaused\n ✔ Container myapp-api-1    Unpaused\n ✔ Container myapp-db-1     Unpaused\n ✔ Container myapp-redis-1  Unpaused',
        exitCode: 0,
      };
    case 'kill':
      return {
        stdout: '[+] Killing 4/4\n ✔ Container myapp-web-1    Killed\n ✔ Container myapp-api-1    Killed\n ✔ Container myapp-db-1     Killed\n ✔ Container myapp-redis-1  Killed',
        exitCode: 0,
      };
    case 'rm':
      return { stdout: '? Going to remove myapp-web-1, myapp-api-1\n[+] Removing 2/2\n ✔ Container myapp-web-1    Removed\n ✔ Container myapp-api-1    Removed', exitCode: 0 };
    case 'exec':
    case 'run':
      return { stdout: '(mock) Command executed in container', exitCode: 0 };
    case 'port':
      return { stdout: '0.0.0.0:8080', exitCode: 0 };
    case 'events':
      return {
        stdout:
          '2024-01-15T10:00:00.000000000Z container start myapp-web-1 (image=nginx:alpine)\n2024-01-15T10:00:01.000000000Z container start myapp-api-1 (image=node:20-alpine)',
        exitCode: 0,
      };
    case 'cp':
      return { stdout: '(mock) File copied successfully', exitCode: 0 };
    case 'watch':
      return { stdout: 'Watch enabled — rebuilding on file changes (mock)', exitCode: 0 };
    case 'scale':
      return { stdout: '[+] Scaling api to 3\n ✔ Container myapp-api-2    Started\n ✔ Container myapp-api-3    Started', exitCode: 0 };
    case 'stats':
      return {
        stdout:
          'CONTAINER ID   NAME              CPU %   MEM USAGE / LIMIT     MEM %\nabc123         myapp-web-1       0.1%    12MiB / 2GiB          0.6%\ndef456         myapp-api-1       2.3%    128MiB / 2GiB         6.2%',
        exitCode: 0,
      };
    default:
      return { stdout: `(mock) docker ${cmd.replace('docker ', '')}`, exitCode: 0 };
  }
}

// ── Core execute function ──────────────────────────────────────────────────

export async function executeCommand(cmd: string): Promise<CommandResult> {
  // STUB — replace with actual native bridge:
  //   Tauri:    return await invoke('execute', { command: cmd });
  //   Electron: return await ipcRenderer.invoke('exec', cmd);
  //   WKWebView: return await window.webkit.messageHandlers.exec.postMessage(cmd);
  console.log('[docker-compose executeCommand]', cmd);
  return mockResponse(cmd);
}

// ── Typed service helpers ─────────────────────────────────────────────────

export interface UpOptions {
  detach?: boolean;
  build?: boolean;
  forceRecreate?: boolean;
  noRecreate?: boolean;
  removeOrphans?: boolean;
  pull?: 'always' | 'missing' | 'never';
  scale?: Record<string, number>;
  services?: string[];
}

export interface DownOptions {
  volumes?: boolean;
  removeOrphans?: boolean;
  rmi?: 'all' | 'local';
  timeout?: number;
  services?: string[];
}

export interface LogsOptions {
  follow?: boolean;
  tail?: string;
  timestamps?: boolean;
  services?: string[];
}

export interface ExecOptions {
  service: string;
  command: string;
  user?: string;
  workdir?: string;
  detach?: boolean;
}

export interface RunOptions {
  service: string;
  command: string;
  detach?: boolean;
  rm?: boolean;
  noTty?: boolean;
  user?: string;
  env?: string;
}

export const dockerCompose = {
  async up(opts: UpOptions = {}): Promise<CommandResult> {
    const parts = ['docker compose up'];
    if (opts.detach) parts.push('-d');
    if (opts.build) parts.push('--build');
    if (opts.forceRecreate) parts.push('--force-recreate');
    if (opts.noRecreate) parts.push('--no-recreate');
    if (opts.removeOrphans) parts.push('--remove-orphans');
    if (opts.pull && opts.pull !== 'missing') parts.push(`--pull ${opts.pull}`);
    if (opts.scale) {
      for (const [svc, n] of Object.entries(opts.scale)) {
        parts.push(`--scale ${svc}=${n}`);
      }
    }
    if (opts.services?.length) parts.push(...opts.services);
    return executeCommand(parts.join(' '));
  },

  async down(opts: DownOptions = {}): Promise<CommandResult> {
    const parts = ['docker compose down'];
    if (opts.volumes) parts.push('-v');
    if (opts.removeOrphans) parts.push('--remove-orphans');
    if (opts.rmi) parts.push(`--rmi ${opts.rmi}`);
    if (opts.timeout !== undefined) parts.push(`-t ${opts.timeout}`);
    if (opts.services?.length) parts.push(...opts.services);
    return executeCommand(parts.join(' '));
  },

  async ps(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose ps'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async logs(opts: LogsOptions = {}): Promise<CommandResult> {
    const parts = ['docker compose logs'];
    if (opts.follow) parts.push('-f');
    if (opts.tail) parts.push(`--tail=${opts.tail}`);
    if (opts.timestamps) parts.push('-t');
    if (opts.services?.length) parts.push(...opts.services);
    return executeCommand(parts.join(' '));
  },

  async build(services?: string[], noCache = false): Promise<CommandResult> {
    const parts = ['docker compose build'];
    if (noCache) parts.push('--no-cache');
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async pull(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose pull'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async push(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose push'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async start(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose start'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async stop(services?: string[], timeout?: number): Promise<CommandResult> {
    const parts = ['docker compose stop'];
    if (timeout !== undefined) parts.push(`-t ${timeout}`);
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async restart(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose restart'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async pause(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose pause'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async unpause(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose unpause'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async kill(services?: string[], signal?: string): Promise<CommandResult> {
    const parts = ['docker compose kill'];
    if (signal) parts.push(`-s ${signal}`);
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async rm(services?: string[], force = false, stopFirst = false): Promise<CommandResult> {
    const parts = ['docker compose rm'];
    if (force) parts.push('-f');
    if (stopFirst) parts.push('-s');
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async exec(opts: ExecOptions): Promise<CommandResult> {
    const parts = ['docker compose exec'];
    if (opts.user) parts.push(`-u ${opts.user}`);
    if (opts.workdir) parts.push(`-w ${opts.workdir}`);
    if (opts.detach) parts.push('-d');
    parts.push(opts.service, opts.command);
    return executeCommand(parts.join(' '));
  },

  async run(opts: RunOptions): Promise<CommandResult> {
    const parts = ['docker compose run'];
    if (opts.detach) parts.push('-d');
    if (opts.rm) parts.push('--rm');
    if (opts.noTty) parts.push('-T');
    if (opts.user) parts.push(`-u ${opts.user}`);
    if (opts.env) parts.push(`-e ${opts.env}`);
    parts.push(opts.service, opts.command);
    return executeCommand(parts.join(' '));
  },

  async config(): Promise<CommandResult> {
    return executeCommand('docker compose config');
  },

  async top(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose top'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async port(service: string, privatePort: string): Promise<CommandResult> {
    return executeCommand(`docker compose port ${service} ${privatePort}`);
  },

  async events(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose events'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async cp(src: string, dst: string): Promise<CommandResult> {
    return executeCommand(`docker compose cp ${src} ${dst}`);
  },

  async watch(): Promise<CommandResult> {
    return executeCommand('docker compose watch');
  },

  async version(): Promise<CommandResult> {
    return executeCommand('docker compose version');
  },

  async ls(): Promise<CommandResult> {
    return executeCommand('docker compose ls');
  },

  async images(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose images'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },

  async scale(serviceScales: Record<string, number>): Promise<CommandResult> {
    const parts = ['docker compose scale'];
    for (const [svc, n] of Object.entries(serviceScales)) {
      parts.push(`${svc}=${n}`);
    }
    return executeCommand(parts.join(' '));
  },

  async stats(services?: string[]): Promise<CommandResult> {
    const parts = ['docker compose stats', '--no-stream'];
    if (services?.length) parts.push(...services);
    return executeCommand(parts.join(' '));
  },
};

// ── Zod-style service name validation ────────────────────────────────────

const SERVICE_NAME_PATTERN = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

export function validateServiceName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) return { valid: false, error: 'Service name cannot be empty' };
  if (name.length > 63) return { valid: false, error: 'Service name too long (max 63 chars)' };
  if (!SERVICE_NAME_PATTERN.test(name)) {
    return { valid: false, error: 'Service name must be lowercase alphanumeric, hyphens or underscores' };
  }
  return { valid: true };
}

export function validateServiceNames(names: string): string[] {
  return names
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => validateServiceName(s).valid);
}
