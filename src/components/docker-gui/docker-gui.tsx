import { Component, h, State } from '@stencil/core';
import { type CommandResult, dockerService, executeCommand } from '../../docker/docker-service';
import { DOCKER_VAULT_NOTES } from '../../docker/docker-vault-notes';

const TABS = [
  { id: 'containers', label: '🐳 Containers' },
  { id: 'images', label: '📦 Images' },
  { id: 'volumes', label: '💾 Volumes' },
  { id: 'networks', label: '🌐 Networks' },
  { id: 'build', label: '🔨 Build' },
  { id: 'run', label: '▶️ Run' },
  { id: 'system', label: '⚙️ System' },
  { id: 'notes', label: '📓 Notes' },
];

@Component({
  tag: 'docker-gui',
  styleUrl: 'docker-gui.css',
  scoped: true,
})
export class DockerGui {
  // ── Global state ────────────────────────────────────────────────────────────
  @State() activeTab = 'containers';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';
  @State() lastCommand = 'docker ...';
  @State() output = 'Select a tab and run a command to see output here.';

  // ── Containers tab ─────────────────────────────────────────────────────────
  @State() showAllContainers = false;
  @State() containerTarget = ''; // ID/name for targeted operations
  @State() logTail = '50';
  @State() logTimestamps = false;
  @State() execCmd = 'sh';
  @State() execInteractive = true;
  @State() cpLocalPath = '';
  @State() cpRemotePath = '';
  @State() cpDirection: 'to' | 'from' = 'to';

  // ── Images tab ─────────────────────────────────────────────────────────────
  @State() showAllImages = false;
  @State() imageRef = ''; // for pull / rmi / tag / push
  @State() imageTarget = ''; // for push / tag source
  @State() imageTagTarget = ''; // tag destination
  @State() searchTerm = '';
  @State() saveImageRef = '';
  @State() saveOutputPath = '';
  @State() loadInputPath = '';

  // ── Build tab ──────────────────────────────────────────────────────────────
  @State() buildContext = '.';
  @State() buildTag = 'my-image:latest';
  @State() buildDockerfile = '';
  @State() buildArgs: string[] = [];
  @State() buildArgInput = '';

  // ── Run tab ────────────────────────────────────────────────────────────────
  @State() runImage = '';
  @State() runName = '';
  @State() runPorts: string[] = [];
  @State() runPortInput = '';
  @State() runVolumes: string[] = [];
  @State() runVolumeInput = '';
  @State() runEnvs: string[] = [];
  @State() runEnvInput = '';
  @State() runDetach = true;
  @State() runRm = false;
  @State() runNetwork = '';
  @State() runEntrypoint = '';
  @State() runCommand = '';

  // ── Volumes tab ───────────────────────────────────────────────────────────
  @State() newVolumeName = '';
  @State() volumeTarget = '';

  // ── Networks tab ─────────────────────────────────────────────────────────
  @State() newNetworkName = '';
  @State() newNetworkDriver = 'bridge';
  @State() networkTarget = '';

  // ── System tab ────────────────────────────────────────────────────────────
  @State() pruneAll = false;
  @State() pruneVolumes = false;

  // ── System / registry ─────────────────────────────────────────────────────
  @State() loginServer = '';
  @State() loginUser = '';
  @State() loginPassword = '';
  @State() logoutServer = '';

  // ── Command preview ────────────────────────────────────────────────────────
  @State() previewCommand = '';

  // ─────────────────────────────────────────────────────────────────────────
  // Execution helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async run(resultPromise: Promise<CommandResult>, cmdStr: string): Promise<void> {
    this.status = 'running';
    this.statusMessage = 'Running…';
    this.lastCommand = cmdStr;
    this.output = 'Executing…';
    try {
      const result = await resultPromise;
      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async runDestructive(resultPromise: Promise<CommandResult>, cmdStr: string): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`Run destructive command?\n\n${cmdStr}`)) return;
    return this.run(resultPromise, cmdStr);
  }

  private clearOutput(): void {
    this.output = 'Select a tab and run a command to see output here.';
    this.lastCommand = 'docker ...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(this.output);
      this.statusMessage = 'Copied!';
      if (typeof window !== 'undefined')
        window.setTimeout(() => {
          this.statusMessage = 'Done';
        }, 1500);
    }
  }

  private async runRaw(cmd: string): Promise<void> {
    if (!cmd.trim()) return;
    return this.run(executeCommand(cmd), cmd);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build command preview for Run tab
  // ─────────────────────────────────────────────────────────────────────────

  private buildRunPreview(): string {
    const parts = ['docker run'];
    if (this.runDetach) parts.push('-d');
    if (this.runRm) parts.push('--rm');
    if (this.runName) parts.push(`--name ${this.runName}`);
    for (const p of this.runPorts) parts.push(`-p ${p}`);
    for (const v of this.runVolumes) parts.push(`-v ${v}`);
    for (const e of this.runEnvs) parts.push(`-e ${e}`);
    if (this.runNetwork) parts.push(`--network ${this.runNetwork}`);
    if (this.runEntrypoint) parts.push(`--entrypoint ${this.runEntrypoint}`);
    parts.push(this.runImage || '<image>');
    if (this.runCommand) parts.push(this.runCommand);
    return parts.join(' ');
  }

  private buildBuildPreview(): string {
    const argFlags = this.buildArgs
      .filter(Boolean)
      .map(a => `--build-arg ${a}`)
      .join(' ');
    const dfFlag = this.buildDockerfile ? `-f ${this.buildDockerfile}` : '';
    return `docker build ${dfFlag} ${argFlags} -t ${this.buildTag || '<tag>'} ${this.buildContext}`.replace(/\s+/g, ' ').trim();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: tabs navigation
  // ─────────────────────────────────────────────────────────────────────────

  renderTabs() {
    return (
      <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            class={`cli-tab${this.activeTab === tab.id ? ' cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
              this.clearOutput();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: shared output panel
  // ─────────────────────────────────────────────────────────────────────────

  renderOutputPanel() {
    const statusClass = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';
    return (
      <div class="cli-card mt-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-text2 text-sm">
            Status: <span class={statusClass}>{this.statusMessage}</span>
          </span>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <div class="cli-cmd-preview text-sm mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Containers
  // ─────────────────────────────────────────────────────────────────────────

  renderContainersTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Query */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Containers</h3>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.showAllContainers}
              onChange={(e: Event) => {
                this.showAllContainers = (e.target as HTMLInputElement).checked;
              }}
            />
            Show all (including stopped)
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => this.run(dockerService.listContainers(this.showAllContainers), `docker ps${this.showAllContainers ? ' -a' : ''}`)}
          >
            docker ps{this.showAllContainers ? ' -a' : ''}
          </button>
        </div>

        {/* Target container */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Target Container</h3>
          <input
            type="text"
            class="cli-input w-full mb-3"
            placeholder="Container ID or name"
            value={this.containerTarget}
            onInput={(e: Event) => {
              this.containerTarget = (e.target as HTMLInputElement).value;
            }}
          />
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.run(dockerService.containerStats(this.containerTarget), `docker stats --no-stream ${this.containerTarget}`.trim())}
            >
              Stats
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.run(dockerService.containerTop(this.containerTarget), `docker top ${this.containerTarget}`)}
            >
              Top
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.run(dockerService.inspectObject(this.containerTarget), `docker inspect ${this.containerTarget}`)}
            >
              Inspect
            </button>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(dockerService.startContainer(this.containerTarget), `docker start ${this.containerTarget}`)}>
              Start
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => this.run(dockerService.restartContainer(this.containerTarget), `docker restart ${this.containerTarget}`)}
            >
              Restart
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-warning"
              onClick={() => this.run(dockerService.stopContainer(this.containerTarget), `docker stop ${this.containerTarget}`)}
            >
              Stop
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.killContainer(this.containerTarget), `docker kill ${this.containerTarget}`)}
            >
              Kill
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.removeContainer(this.containerTarget, false), `docker rm ${this.containerTarget}`)}
            >
              Remove
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.removeContainer(this.containerTarget, true), `docker rm -f ${this.containerTarget}`)}
            >
              Force Remove
            </button>
          </div>
        </div>

        {/* Logs */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Container Logs</h3>
          <div class="flex gap-3 mb-3 flex-wrap">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Tail lines
              <input
                type="text"
                class="cli-input w-24"
                value={this.logTail}
                onInput={(e: Event) => {
                  this.logTail = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 mt-4">
              <input
                type="checkbox"
                checked={this.logTimestamps}
                onChange={(e: Event) => {
                  this.logTimestamps = (e.target as HTMLInputElement).checked;
                }}
              />
              Timestamps
            </label>
          </div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(
                dockerService.containerLogs(this.containerTarget, this.logTail, this.logTimestamps),
                `docker logs${this.logTail !== 'all' ? ` --tail ${this.logTail}` : ''}${this.logTimestamps ? ' --timestamps' : ''} ${this.containerTarget}`.trim(),
              )
            }
          >
            Fetch Logs
          </button>
        </div>

        {/* Exec */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Exec in Container</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="sh"
              value={this.execCmd}
              onInput={(e: Event) => {
                this.execCmd = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.execInteractive}
              onChange={(e: Event) => {
                this.execInteractive = (e.target as HTMLInputElement).checked;
              }}
            />
            Interactive (-it)
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() =>
              this.run(
                dockerService.execContainer(this.containerTarget, this.execCmd, this.execInteractive),
                `docker exec${this.execInteractive ? ' -it' : ''} ${this.containerTarget} ${this.execCmd}`.trim(),
              )
            }
          >
            Execute
          </button>
        </div>

        {/* Copy files */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Copy Files (docker cp)</h3>
          <div class="flex flex-wrap gap-3 mb-3 items-end">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Direction
              <select
                class="cli-select"
                onChange={(e: Event) => {
                  this.cpDirection = (e.target as HTMLSelectElement).value as 'to' | 'from';
                }}
              >
                <option value="to">Local → Container</option>
                <option value="from">Container → Local</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Local path
              <input
                type="text"
                class="cli-input w-full"
                placeholder="/local/path"
                value={this.cpLocalPath}
                onInput={(e: Event) => {
                  this.cpLocalPath = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1">
              Container path
              <input
                type="text"
                class="cli-input w-full"
                placeholder="/container/path"
                value={this.cpRemotePath}
                onInput={(e: Event) => {
                  this.cpRemotePath = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                if (this.cpDirection === 'to') {
                  this.run(
                    dockerService.copyToContainer(this.cpLocalPath, this.containerTarget, this.cpRemotePath),
                    `docker cp ${this.cpLocalPath} ${this.containerTarget}:${this.cpRemotePath}`,
                  );
                } else {
                  this.run(
                    dockerService.copyFromContainer(this.containerTarget, this.cpRemotePath, this.cpLocalPath),
                    `docker cp ${this.containerTarget}:${this.cpRemotePath} ${this.cpLocalPath}`,
                  );
                }
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Images
  // ─────────────────────────────────────────────────────────────────────────

  renderImagesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* List images */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Images</h3>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.showAllImages}
              onChange={(e: Event) => {
                this.showAllImages = (e.target as HTMLInputElement).checked;
              }}
            />
            Show all (including intermediate)
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => this.run(dockerService.listImages(this.showAllImages), `docker images${this.showAllImages ? ' -a' : ''}`)}
          >
            docker images
          </button>
        </div>

        {/* Search */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Search Docker Hub</h3>
          <div class="flex gap-2 mb-3">
            <input
              type="text"
              class="cli-input flex-1"
              placeholder="nginx"
              value={this.searchTerm}
              onInput={(e: Event) => {
                this.searchTerm = (e.target as HTMLInputElement).value;
              }}
            />
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.searchImage(this.searchTerm), `docker search ${this.searchTerm}`)}>
              Search
            </button>
          </div>
        </div>

        {/* Pull / Push */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Pull / Push</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Image reference (name:tag)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="nginx:latest"
              value={this.imageRef}
              onInput={(e: Event) => {
                this.imageRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.pullImage(this.imageRef), `docker pull ${this.imageRef}`)}>
              Pull
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run(dockerService.pushImage(this.imageRef), `docker push ${this.imageRef}`)}>
              Push
            </button>
          </div>
        </div>

        {/* Tag */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Tag Image</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Source image
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="myimage:latest"
              value={this.imageTarget}
              onInput={(e: Event) => {
                this.imageTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Target tag
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="registry/myimage:v1.0"
              value={this.imageTagTarget}
              onInput={(e: Event) => {
                this.imageTagTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() => this.run(dockerService.tagImage(this.imageTarget, this.imageTagTarget), `docker tag ${this.imageTarget} ${this.imageTagTarget}`)}
          >
            Tag
          </button>
        </div>

        {/* Inspect / Remove */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Inspect / Remove</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Image ID or reference
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="nginx:latest or abc123"
              value={this.imageRef}
              onInput={(e: Event) => {
                this.imageRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.run(dockerService.inspectObject(this.imageRef), `docker inspect ${this.imageRef}`)}
            >
              Inspect
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.removeImage(this.imageRef, false), `docker rmi ${this.imageRef}`)}
            >
              Remove (rmi)
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.removeImage(this.imageRef, true), `docker rmi -f ${this.imageRef}`)}
            >
              Force Remove
            </button>
          </div>
        </div>

        {/* Save / Load */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Save / Load Image</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Image to save
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="nginx:latest"
              value={this.saveImageRef}
              onInput={(e: Event) => {
                this.saveImageRef = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Output file path
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="/tmp/nginx.tar"
              value={this.saveOutputPath}
              onInput={(e: Event) => {
                this.saveOutputPath = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2 mb-4">
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => this.run(dockerService.saveImage(this.saveImageRef, this.saveOutputPath), `docker save -o ${this.saveOutputPath} ${this.saveImageRef}`)}
            >
              Save
            </button>
          </div>
          <hr class="section-divider" />
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Load from tar file
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="/tmp/nginx.tar"
              value={this.loadInputPath}
              onInput={(e: Event) => {
                this.loadInputPath = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(dockerService.loadImage(this.loadInputPath), `docker load -i ${this.loadInputPath}`)}>
            Load
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Volumes
  // ─────────────────────────────────────────────────────────────────────────

  renderVolumesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Volumes</h3>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.listVolumes(), 'docker volume ls')}>
            docker volume ls
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Volume</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Volume name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-volume"
              value={this.newVolumeName}
              onInput={(e: Event) => {
                this.newVolumeName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.run(dockerService.createVolume(this.newVolumeName), `docker volume create ${this.newVolumeName}`)}>
            Create
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Volume Actions</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Volume name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-volume"
              value={this.volumeTarget}
              onInput={(e: Event) => {
                this.volumeTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.run(dockerService.inspectObject(this.volumeTarget), `docker volume inspect ${this.volumeTarget}`)}
            >
              Inspect
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.removeVolume(this.volumeTarget), `docker volume rm ${this.volumeTarget}`)}
            >
              Remove
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            Prune Unused Volumes
            <span class="cli-badge-sip">Destructive</span>
          </h3>
          <p class="text-text2 text-sm mb-3">Removes all local volumes not used by at least one container.</p>
          <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.runDestructive(dockerService.pruneVolumes(), 'docker volume prune -f')}>
            Prune Volumes
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Networks
  // ─────────────────────────────────────────────────────────────────────────

  renderNetworksTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">List Networks</h3>
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.listNetworks(), 'docker network ls')}>
            docker network ls
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Network</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Network name
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-network"
              value={this.newNetworkName}
              onInput={(e: Event) => {
                this.newNetworkName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Driver
            <select
              class="cli-select"
              onChange={(e: Event) => {
                this.newNetworkDriver = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="bridge">bridge</option>
              <option value="host">host</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
              <option value="none">none</option>
            </select>
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() =>
              this.run(dockerService.createNetwork(this.newNetworkName, this.newNetworkDriver), `docker network create --driver ${this.newNetworkDriver} ${this.newNetworkName}`)
            }
          >
            Create
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Network Actions</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Network name or ID
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-network"
              value={this.networkTarget}
              onInput={(e: Event) => {
                this.networkTarget = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => this.run(dockerService.inspectObject(this.networkTarget), `docker network inspect ${this.networkTarget}`)}
            >
              Inspect
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-danger"
              onClick={() => this.runDestructive(dockerService.removeNetwork(this.networkTarget), `docker network rm ${this.networkTarget}`)}
            >
              Remove
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            Prune Unused Networks
            <span class="cli-badge-sip">Destructive</span>
          </h3>
          <p class="text-text2 text-sm mb-3">Removes all networks not used by at least one container.</p>
          <button type="button" class="cli-btn cli-btn-danger" onClick={() => this.runDestructive(dockerService.pruneNetworks(), 'docker network prune -f')}>
            Prune Networks
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Build
  // ─────────────────────────────────────────────────────────────────────────

  renderBuildTab() {
    const preview = this.buildBuildPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Build Image from Dockerfile</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Build context path
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="."
                value={this.buildContext}
                onInput={(e: Event) => {
                  this.buildContext = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Image tag (-t)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="my-image:latest"
                value={this.buildTag}
                onInput={(e: Event) => {
                  this.buildTag = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Dockerfile path (optional, -f)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="Dockerfile"
                value={this.buildDockerfile}
                onInput={(e: Event) => {
                  this.buildDockerfile = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>

          <h4 class="text-sm text-text2 mb-2">Build Args (--build-arg KEY=VALUE)</h4>
          {this.buildArgs.map((arg, i) => (
            <div key={i} class="build-arg-row">
              <span class="font-mono text-sm flex-1 bg-bg3 px-2 py-1 rounded">{arg}</span>
              <button
                type="button"
                class="remove-btn"
                onClick={() => {
                  this.buildArgs = this.buildArgs.filter((_, idx) => idx !== i);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="NODE_ENV=production"
              value={this.buildArgInput}
              onInput={(e: Event) => {
                this.buildArgInput = (e.target as HTMLInputElement).value;
              }}
            />
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                if (this.buildArgInput.trim()) {
                  this.buildArgs = [...this.buildArgs, this.buildArgInput.trim()];
                  this.buildArgInput = '';
                }
              }}
            >
              Add Arg
            </button>
          </div>

          <div class="cli-cmd-preview mb-3">{preview}</div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => this.run(dockerService.buildImage(this.buildContext, this.buildTag, this.buildDockerfile, this.buildArgs), preview)}
          >
            Build Image
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Run
  // ─────────────────────────────────────────────────────────────────────────

  renderRunTab() {
    const preview = this.buildRunPreview();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Basic Options</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Image
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="nginx:latest"
              value={this.runImage}
              onInput={(e: Event) => {
                this.runImage = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Container name (--name)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-container"
              value={this.runName}
              onInput={(e: Event) => {
                this.runName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Network (--network)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="bridge"
              value={this.runNetwork}
              onInput={(e: Event) => {
                this.runNetwork = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Entrypoint (--entrypoint)
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="/bin/sh"
              value={this.runEntrypoint}
              onInput={(e: Event) => {
                this.runEntrypoint = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command override
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="echo hello"
              value={this.runCommand}
              onInput={(e: Event) => {
                this.runCommand = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.runDetach}
                onChange={(e: Event) => {
                  this.runDetach = (e.target as HTMLInputElement).checked;
                }}
              />
              Detached (-d)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.runRm}
                onChange={(e: Event) => {
                  this.runRm = (e.target as HTMLInputElement).checked;
                }}
              />
              Auto-remove (--rm)
            </label>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Port Mappings (-p)</h3>
          {this.runPorts.map((p, i) => (
            <div key={i} class="port-row">
              <span class="font-mono text-sm flex-1 bg-bg3 px-2 py-1 rounded">{p}</span>
              <button
                type="button"
                class="remove-btn"
                onClick={() => {
                  this.runPorts = this.runPorts.filter((_, idx) => idx !== i);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="8080:80"
              value={this.runPortInput}
              onInput={(e: Event) => {
                this.runPortInput = (e.target as HTMLInputElement).value;
              }}
            />
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                if (this.runPortInput.trim()) {
                  this.runPorts = [...this.runPorts, this.runPortInput.trim()];
                  this.runPortInput = '';
                }
              }}
            >
              Add Port
            </button>
          </div>

          <h3 class="text-text2 text-base mb-3">Volume Mounts (-v)</h3>
          {this.runVolumes.map((v, i) => (
            <div key={i} class="vol-row">
              <span class="font-mono text-sm flex-1 bg-bg3 px-2 py-1 rounded">{v}</span>
              <button
                type="button"
                class="remove-btn"
                onClick={() => {
                  this.runVolumes = this.runVolumes.filter((_, idx) => idx !== i);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="/host/path:/container/path"
              value={this.runVolumeInput}
              onInput={(e: Event) => {
                this.runVolumeInput = (e.target as HTMLInputElement).value;
              }}
            />
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                if (this.runVolumeInput.trim()) {
                  this.runVolumes = [...this.runVolumes, this.runVolumeInput.trim()];
                  this.runVolumeInput = '';
                }
              }}
            >
              Add Volume
            </button>
          </div>

          <h3 class="text-text2 text-base mb-3">Environment Variables (-e)</h3>
          {this.runEnvs.map((e, i) => (
            <div key={i} class="env-row">
              <span class="font-mono text-sm flex-1 bg-bg3 px-2 py-1 rounded">{e}</span>
              <button
                type="button"
                class="remove-btn"
                onClick={() => {
                  this.runEnvs = this.runEnvs.filter((_, idx) => idx !== i);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div class="flex gap-2">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="MY_VAR=value"
              value={this.runEnvInput}
              onInput={(e: Event) => {
                this.runEnvInput = (e.target as HTMLInputElement).value;
              }}
            />
            <button
              type="button"
              class="cli-btn cli-btn-sm cli-btn-success"
              onClick={() => {
                if (this.runEnvInput.trim()) {
                  this.runEnvs = [...this.runEnvs, this.runEnvInput.trim()];
                  this.runEnvInput = '';
                }
              }}
            >
              Add Env
            </button>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview mb-3">{preview}</div>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() =>
              this.run(
                dockerService.runContainer(this.runImage, {
                  name: this.runName,
                  ports: this.runPorts,
                  volumes: this.runVolumes,
                  envs: this.runEnvs,
                  detach: this.runDetach,
                  rm: this.runRm,
                  network: this.runNetwork,
                  entrypoint: this.runEntrypoint,
                  command: this.runCommand,
                }),
                preview,
              )
            }
          >
            Run Container
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: System
  // ─────────────────────────────────────────────────────────────────────────

  renderSystemTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Info / Stats / DF */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">System Info</h3>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.systemInfo(), 'docker system info')}>
              system info
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.systemDf(), 'docker system df')}>
              system df
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(dockerService.version(), 'docker version')}>
              version
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-success" onClick={() => this.run(dockerService.containerStats(), 'docker stats --no-stream')}>
              All container stats
            </button>
          </div>
        </div>

        {/* System Prune */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3 flex items-center gap-2">
            System Prune
            <span class="cli-badge-sip">Destructive</span>
          </h3>
          <p class="text-text2 text-sm mb-3">Remove stopped containers, dangling images, unused networks, and optionally all unused data.</p>
          <label class="flex items-center gap-2 text-sm text-text2 mb-2">
            <input
              type="checkbox"
              checked={this.pruneAll}
              onChange={(e: Event) => {
                this.pruneAll = (e.target as HTMLInputElement).checked;
              }}
            />
            Remove all unused images (not just dangling) — (-a)
          </label>
          <label class="flex items-center gap-2 text-sm text-text2 mb-3">
            <input
              type="checkbox"
              checked={this.pruneVolumes}
              onChange={(e: Event) => {
                this.pruneVolumes = (e.target as HTMLInputElement).checked;
              }}
            />
            Also remove unused volumes (--volumes)
          </label>
          <div class="cli-cmd-preview mb-3">{`docker system prune -f${this.pruneAll ? ' -a' : ''}${this.pruneVolumes ? ' --volumes' : ''}`}</div>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() =>
              this.runDestructive(
                dockerService.systemPrune(this.pruneAll, this.pruneVolumes),
                `docker system prune -f${this.pruneAll ? ' -a' : ''}${this.pruneVolumes ? ' --volumes' : ''}`,
              )
            }
          >
            System Prune
          </button>
        </div>

        {/* Login / Logout */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Registry Login</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Registry (leave blank for Docker Hub)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="ghcr.io"
              value={this.loginServer}
              onInput={(e: Event) => {
                this.loginServer = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Username
            <input
              type="text"
              class="cli-input w-full"
              placeholder="username"
              value={this.loginUser}
              onInput={(e: Event) => {
                this.loginUser = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Password / PAT
            <input
              type="password"
              class="cli-input w-full"
              placeholder="••••••••"
              value={this.loginPassword}
              onInput={(e: Event) => {
                this.loginPassword = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm"
            onClick={() =>
              this.run(
                dockerService.login(this.loginServer, this.loginUser, this.loginPassword),
                `docker login${this.loginServer ? ` ${this.loginServer}` : ''} -u ${this.loginUser} -p ***`,
              )
            }
          >
            Login
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Registry Logout</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Registry (leave blank for Docker Hub)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="ghcr.io"
              value={this.logoutServer}
              onInput={(e: Event) => {
                this.logoutServer = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-sm cli-btn-warning"
            onClick={() => this.run(dockerService.logout(this.logoutServer), `docker logout${this.logoutServer ? ` ${this.logoutServer}` : ''}`)}
          >
            Logout
          </button>
        </div>

        {/* Raw command */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Raw Command</h3>
          <p class="text-text2 text-sm mb-3">Escape hatch — enter any docker command directly.</p>
          <div class="flex gap-2">
            <input
              type="text"
              class="cli-input flex-1 font-mono"
              placeholder="docker ps -a --format json"
              onInput={() => {}}
              ref={el => {
                if (el) (el as HTMLInputElement).dataset.rawCmd = '';
              }}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  this.runRaw(input.value);
                }
              }}
            />
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={(e: MouseEvent) => {
                const input = (e.target as HTMLElement).closest('.cli-card')?.querySelector('input[type="text"]');
                if (input) this.runRaw((input as HTMLInputElement).value);
              }}
            >
              Run
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Notes
  // ─────────────────────────────────────────────────────────────────────────

  renderNotesTab() {
    return (
      <div class="grid grid-cols-1 gap-4">
        {DOCKER_VAULT_NOTES.map((n, i) => (
          <div key={i} class="cli-card">
            <h3 class="text-base mb-2">{n.heading}</h3>
            {n.tags && n.tags.length > 0 && (
              <div class="mb-2 flex flex-wrap gap-1">
                {n.tags.map(t => (
                  <span key={t} class="text-xs px-2 py-0.5 bg-bg3 rounded text-text2">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <pre class="text-sm text-text whitespace-pre-wrap font-mono leading-relaxed">{n.body}</pre>
            {n.codeSnippet && <pre class="text-xs mt-2 p-2 bg-bg3 rounded font-mono whitespace-pre-wrap text-accent">{n.codeSnippet}</pre>}
          </div>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen pb-8">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🐳</span> Docker GUI
          </h2>
          <p class="text-text2 text-sm">Visual interface for Docker — container management</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'containers' && this.renderContainersTab()}
          {this.activeTab === 'images' && this.renderImagesTab()}
          {this.activeTab === 'volumes' && this.renderVolumesTab()}
          {this.activeTab === 'networks' && this.renderNetworksTab()}
          {this.activeTab === 'build' && this.renderBuildTab()}
          {this.activeTab === 'run' && this.renderRunTab()}
          {this.activeTab === 'system' && this.renderSystemTab()}
          {this.activeTab === 'notes' && this.renderNotesTab()}
        </div>

        {this.renderOutputPanel()}
      </div>
    );
  }
}
