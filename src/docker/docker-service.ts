/**
 * Docker service — typed helpers around `docker` CLI.
 * executeCommand is the single native-bridge integration point.
 * Swap its body for Tauri invoke / Electron IPC / WKWebView / HTTP.
 */

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DockerContainer {
  id: string;
  names: string;
  image: string;
  status: string;
  ports: string;
  created: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
}

// ── Mock data for stub mode ───────────────────────────────────────────────────

const MOCK_CONTAINERS = `CONTAINER ID   IMAGE           COMMAND                  CREATED         STATUS                    PORTS                    NAMES
a1b2c3d4e5f6   nginx:latest    "/docker-entrypoint.…"   2 hours ago     Up 2 hours                0.0.0.0:80->80/tcp       web-server
b2c3d4e5f6a1   postgres:15     "docker-entrypoint.s…"   3 hours ago     Up 3 hours                0.0.0.0:5432->5432/tcp   postgres-db
c3d4e5f6a1b2   redis:7         "docker-entrypoint.s…"   1 day ago       Exited (0) 30 minutes     0.0.0.0:6379->6379/tcp   redis-cache`;

const MOCK_IMAGES = `REPOSITORY          TAG       IMAGE ID       CREATED        SIZE
nginx               latest    a1b2c3d4e5f6   2 days ago     187MB
postgres            15        b2c3d4e5f6a1   1 week ago     412MB
redis               7         c3d4e5f6a1b2   2 weeks ago    138MB
node                20-alpine d4e5f6a1b2c3   3 weeks ago    171MB
ubuntu              22.04     e5f6a1b2c3d4   1 month ago    77.9MB`;

const MOCK_VOLUMES = `DRIVER    VOLUME NAME
local     postgres_data
local     redis_data
local     app_uploads`;

const MOCK_NETWORKS = `NETWORK ID     NAME              DRIVER    SCOPE
a1b2c3d4e5f6   bridge            bridge    local
b2c3d4e5f6a1   host              host      local
c3d4e5f6a1b2   none              null      local
d4e5f6a1b2c3   my-app-network    bridge    local`;

const MOCK_STATS = `CONTAINER ID   NAME           CPU %     MEM USAGE / LIMIT     MEM %     NET I/O          BLOCK I/O
a1b2c3d4e5f6   web-server     0.12%     45.2MiB / 7.77GiB    0.57%     1.5kB / 2.3kB    0B / 0B
b2c3d4e5f6a1   postgres-db    0.08%     89.4MiB / 7.77GiB    1.12%     2.1kB / 1.8kB    120MB / 60MB`;

const MOCK_INFO = `Client:
 Version:    24.0.7
 Context:    desktop-linux
 Debug Mode: false

Server:
 Engine:
  Version:          24.0.7
  OS/Arch:          linux/arm64
  Containers: 3
   Running: 2
   Paused: 0
   Stopped: 1
 Images: 5
 Storage Driver: overlay2
 Memory: 7.77GiB`;

function mockDescribeOperation(cmd: string): string {
  return `[stub] Would execute: ${cmd}\n\nReplace executeCommand() body with your native bridge to run real commands.`;
}

// ── Core bridge ───────────────────────────────────────────────────────────────

export async function executeCommand(command: string): Promise<CommandResult> {
  console.log('[docker-service] executeCommand:', command);

  const tokens = command.trim().split(/\s+/);
  const sub = tokens[1] ?? '';
  const sub2 = tokens[2] ?? '';

  // Mock read-only queries
  if (sub === 'ps') {
    return { stdout: MOCK_CONTAINERS, exitCode: 0 };
  }
  if (sub === 'images') {
    return { stdout: MOCK_IMAGES, exitCode: 0 };
  }
  if (sub === 'volume' && sub2 === 'ls') {
    return { stdout: MOCK_VOLUMES, exitCode: 0 };
  }
  if (sub === 'network' && sub2 === 'ls') {
    return { stdout: MOCK_NETWORKS, exitCode: 0 };
  }
  if (sub === 'stats') {
    return { stdout: MOCK_STATS, exitCode: 0 };
  }
  if ((sub === 'system' && sub2 === 'info') || sub === 'info') {
    return { stdout: MOCK_INFO, exitCode: 0 };
  }
  if (sub === 'system' && sub2 === 'df') {
    return {
      stdout:
        'TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE\nImages          5         3         990.9MB   400MB (40%)\nContainers      3         2         0B        0B\nLocal Volumes   3         2         1.23GB    615MB (50%)',
      exitCode: 0,
    };
  }
  if (sub === 'version') {
    return { stdout: 'Docker version 24.0.7, build afdd53b', exitCode: 0 };
  }
  if (sub === 'search') {
    return {
      stdout:
        'NAME                                         DESCRIPTION                                     STARS\nnginx                                        Official build of Nginx.                        19234\nubuntu                                       Ubuntu is a Debian-based Linux operating sy…    16123\nnode                                         Node.js is a JavaScript-based platform for…     13456',
      exitCode: 0,
    };
  }

  // All mutating / destructive ops describe themselves
  return { stdout: mockDescribeOperation(command), exitCode: 0 };
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export const dockerService = {
  // Containers
  async listContainers(all = false): Promise<CommandResult> {
    return executeCommand(`docker ps${all ? ' -a' : ''}`);
  },
  async stopContainer(id: string): Promise<CommandResult> {
    return executeCommand(`docker stop ${id}`);
  },
  async killContainer(id: string, signal = 'SIGKILL'): Promise<CommandResult> {
    return executeCommand(`docker kill --signal ${signal} ${id}`);
  },
  async removeContainer(id: string, force = false): Promise<CommandResult> {
    return executeCommand(`docker rm${force ? ' -f' : ''} ${id}`);
  },
  async startContainer(id: string): Promise<CommandResult> {
    return executeCommand(`docker start ${id}`);
  },
  async restartContainer(id: string): Promise<CommandResult> {
    return executeCommand(`docker restart ${id}`);
  },
  async containerLogs(id: string, tail: string, timestamps: boolean): Promise<CommandResult> {
    const flags = [tail !== 'all' ? `--tail ${tail}` : '', timestamps ? '--timestamps' : ''].filter(Boolean).join(' ');
    return executeCommand(`docker logs ${flags} ${id}`.trim());
  },
  async containerStats(id = ''): Promise<CommandResult> {
    return executeCommand(`docker stats --no-stream ${id}`.trim());
  },
  async containerTop(id: string): Promise<CommandResult> {
    return executeCommand(`docker top ${id}`);
  },
  async execContainer(id: string, cmd: string, interactive: boolean): Promise<CommandResult> {
    const flags = interactive ? '-it' : '';
    return executeCommand(`docker exec ${flags} ${id} ${cmd}`.trim());
  },
  async inspectObject(id: string): Promise<CommandResult> {
    return executeCommand(`docker inspect ${id}`);
  },
  async copyToContainer(localPath: string, containerId: string, remotePath: string): Promise<CommandResult> {
    return executeCommand(`docker cp ${localPath} ${containerId}:${remotePath}`);
  },
  async copyFromContainer(containerId: string, remotePath: string, localPath: string): Promise<CommandResult> {
    return executeCommand(`docker cp ${containerId}:${remotePath} ${localPath}`);
  },

  // Images
  async listImages(all = false): Promise<CommandResult> {
    return executeCommand(`docker images${all ? ' -a' : ''}`);
  },
  async pullImage(ref: string): Promise<CommandResult> {
    return executeCommand(`docker pull ${ref}`);
  },
  async pushImage(ref: string): Promise<CommandResult> {
    return executeCommand(`docker push ${ref}`);
  },
  async tagImage(source: string, target: string): Promise<CommandResult> {
    return executeCommand(`docker tag ${source} ${target}`);
  },
  async removeImage(ref: string, force = false): Promise<CommandResult> {
    return executeCommand(`docker rmi${force ? ' -f' : ''} ${ref}`);
  },
  async saveImage(ref: string, output: string): Promise<CommandResult> {
    return executeCommand(`docker save -o ${output} ${ref}`);
  },
  async loadImage(input: string): Promise<CommandResult> {
    return executeCommand(`docker load -i ${input}`);
  },
  async searchImage(term: string): Promise<CommandResult> {
    return executeCommand(`docker search ${term}`);
  },

  // Build
  async buildImage(contextPath: string, tag: string, dockerfile: string, buildArgs: string[]): Promise<CommandResult> {
    const argFlags = buildArgs
      .filter(Boolean)
      .map(a => `--build-arg ${a}`)
      .join(' ');
    const dockerfileFlag = dockerfile ? `-f ${dockerfile}` : '';
    return executeCommand(`docker build ${dockerfileFlag} ${argFlags} -t ${tag} ${contextPath}`.replace(/\s+/g, ' ').trim());
  },

  // Run
  async runContainer(
    image: string,
    opts: {
      name?: string;
      ports?: string[];
      volumes?: string[];
      envs?: string[];
      detach?: boolean;
      rm?: boolean;
      network?: string;
      entrypoint?: string;
      command?: string;
    },
  ): Promise<CommandResult> {
    const parts = ['docker run'];
    if (opts.detach) parts.push('-d');
    if (opts.rm) parts.push('--rm');
    if (opts.name) parts.push(`--name ${opts.name}`);
    for (const p of opts.ports ?? []) parts.push(`-p ${p}`);
    for (const v of opts.volumes ?? []) parts.push(`-v ${v}`);
    for (const e of opts.envs ?? []) parts.push(`-e ${e}`);
    if (opts.network) parts.push(`--network ${opts.network}`);
    if (opts.entrypoint) parts.push(`--entrypoint ${opts.entrypoint}`);
    parts.push(image);
    if (opts.command) parts.push(opts.command);
    return executeCommand(parts.join(' '));
  },

  // Volumes
  async listVolumes(): Promise<CommandResult> {
    return executeCommand('docker volume ls');
  },
  async createVolume(name: string): Promise<CommandResult> {
    return executeCommand(`docker volume create ${name}`);
  },
  async removeVolume(name: string): Promise<CommandResult> {
    return executeCommand(`docker volume rm ${name}`);
  },
  async pruneVolumes(): Promise<CommandResult> {
    return executeCommand('docker volume prune -f');
  },

  // Networks
  async listNetworks(): Promise<CommandResult> {
    return executeCommand('docker network ls');
  },
  async createNetwork(name: string, driver = 'bridge'): Promise<CommandResult> {
    return executeCommand(`docker network create --driver ${driver} ${name}`);
  },
  async removeNetwork(name: string): Promise<CommandResult> {
    return executeCommand(`docker network rm ${name}`);
  },
  async pruneNetworks(): Promise<CommandResult> {
    return executeCommand('docker network prune -f');
  },

  // System
  async systemInfo(): Promise<CommandResult> {
    return executeCommand('docker system info');
  },
  async systemDf(): Promise<CommandResult> {
    return executeCommand('docker system df');
  },
  async systemPrune(all = false, volumes = false): Promise<CommandResult> {
    return executeCommand(`docker system prune -f${all ? ' -a' : ''}${volumes ? ' --volumes' : ''}`);
  },
  async version(): Promise<CommandResult> {
    return executeCommand('docker version');
  },

  // Registry
  async login(server: string, username: string, password: string): Promise<CommandResult> {
    return executeCommand(`docker login ${server ? `${server} ` : ''}-u ${username} -p ${password}`.trim());
  },
  async logout(server = ''): Promise<CommandResult> {
    return executeCommand(`docker logout ${server}`.trim());
  },
};
