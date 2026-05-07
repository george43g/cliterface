import { Component, h, State } from '@stencil/core';
import {
  buildComputeCreateCommand,
  buildFunctionDeployCommand,
  buildRunDeployCommand,
  COMMON_REGIONS,
  COMMON_ZONES,
  FUNCTION_RUNTIMES,
  GCS_LOCATIONS,
  IAM_ROLES,
  IMAGE_FAMILIES,
  MACHINE_TYPES,
  validateBucketName,
  validateProjectId,
  validateServiceAccountEmail,
  validateZone,
} from '../../gcloud/gcloud-command-builders';
import {
  type CommandResult,
  gcloudAuth,
  gcloudComponents,
  gcloudCompute,
  gcloudConfig,
  gcloudFunctions,
  gcloudGke,
  gcloudIam,
  gcloudLogging,
  gcloudOrgs,
  gcloudProjects,
  gcloudRun,
  gcloudSecrets,
  gcloudStorage,
} from '../../gcloud/gcloud-service';

const TABS = [
  { id: 'auth', label: '🔐 Auth' },
  { id: 'projects', label: '📁 Projects/Billing' },
  { id: 'compute', label: '💻 Compute' },
  { id: 'storage', label: '🗄️ Storage' },
  { id: 'iam', label: '🛡️ IAM' },
  { id: 'serverless', label: '⚡ Serverless' },
  { id: 'gke', label: '⚓ GKE' },
  { id: 'logging', label: '📋 Logging' },
  { id: 'secrets', label: '🔒 Secrets' },
  { id: 'components', label: '🧩 Components' },
];

@Component({
  tag: 'gcloud-gui',
  styleUrl: 'gcloud-gui.css',
  scoped: true,
})
export class GcloudGui {
  // ── Tab state ────────────────────────────────────────────────────────────────
  @State() activeTab = 'auth';

  // ── Output state ─────────────────────────────────────────────────────────────
  @State() lastCommand = 'Ready…';
  @State() output = 'Select a tab and run a command.';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';

  // ── Projects/Billing ─────────────────────────────────────────────────────────
  @State() projectId = '';
  @State() projectName = '';
  @State() billingAccount = '';
  @State() orgDescribeId = '';

  // ── Compute ──────────────────────────────────────────────────────────────────
  @State() computeInstance = '';
  @State() computeZone: string = COMMON_ZONES[0];
  @State() computeMachineType: string = MACHINE_TYPES[0];
  @State() computeImage: string = IMAGE_FAMILIES[0];
  @State() computeNewName = '';

  // ── Storage ──────────────────────────────────────────────────────────────────
  @State() storageBucket = '';
  @State() storageLocation: string = GCS_LOCATIONS[0];
  @State() storageObjectUri = '';
  @State() storageCopySrc = '';
  @State() storageCopyDst = '';

  // ── IAM ──────────────────────────────────────────────────────────────────────
  @State() iamSaName = '';
  @State() iamSaDisplayName = '';
  @State() iamSaEmail = '';
  @State() iamKeyOutputFile = '~/key.json';
  @State() iamMember = '';
  @State() iamRole: string = IAM_ROLES[0];

  // ── Functions ─────────────────────────────────────────────────────────────────
  @State() fnName = '';
  @State() fnRuntime: string = FUNCTION_RUNTIMES[0];
  @State() fnEntryPoint = 'main';
  @State() fnTrigger = 'http';
  @State() fnRegion: string = COMMON_REGIONS[0];
  @State() fnCallData = '';

  // ── Cloud Run ─────────────────────────────────────────────────────────────────
  @State() runService = '';
  @State() runImage = '';
  @State() runRegion: string = COMMON_REGIONS[0];
  @State() runAllowUnauth = false;

  // ── GKE ───────────────────────────────────────────────────────────────────────
  @State() gkeCluster = '';
  @State() gkeRegion: string = COMMON_REGIONS[0];

  // ── Logging ───────────────────────────────────────────────────────────────────
  @State() logFilter = 'severity>=ERROR';
  @State() logLimit = 50;
  @State() logProject = '';

  // ── Secrets ───────────────────────────────────────────────────────────────────
  @State() secretName = '';
  @State() secretDataFile = '-';
  @State() secretVersion = 'latest';

  // ── Components ────────────────────────────────────────────────────────────────
  @State() componentId = '';

  // ── Raw tab ──────────────────────────────────────────────────────────────────
  @State() rawInput = '';

  // ── Validation errors ─────────────────────────────────────────────────────────
  @State() validationError = '';

  // ── Core execute helper ──────────────────────────────────────────────────────

  private async run(cmdFn: () => Promise<CommandResult>, preview: string, confirm = false): Promise<void> {
    if (confirm && typeof window !== 'undefined') {
      if (!window.confirm(`Execute: ${preview}?\n\nThis action may be destructive.`)) return;
    }
    this.lastCommand = preview;
    this.status = 'running';
    this.statusMessage = 'Running…';
    this.output = 'Executing…';
    this.validationError = '';
    try {
      const result = await cmdFn();
      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(this.output);
  }

  // ── Output pane ──────────────────────────────────────────────────────────────

  private renderOutput() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-3">
            <span class="text-text2 text-sm">Status:</span>
            <span class={`text-sm font-medium ${statusColor}`}>{this.statusMessage}</span>
          </div>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
            Copy
          </button>
        </div>
        <div class="cli-cmd-preview text-sm mb-2">{this.lastCommand}</div>
        <pre class="cli-output">{this.output}</pre>
        {this.validationError && <p class="text-danger text-sm mt-2">{this.validationError}</p>}
      </div>
    );
  }

  // ── Auth tab ─────────────────────────────────────────────────────────────────

  private renderAuthTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">User Auth</h3>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudAuth.list(), 'gcloud auth list')}>
              List Accounts
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run(() => gcloudAuth.login(), 'gcloud auth login')}>
              Login
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudAuth.printAccessToken(), 'gcloud auth print-access-token')}>
              Print Access Token
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Application Default Credentials</h3>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn" onClick={() => this.run(() => gcloudAuth.applicationDefaultLogin(), 'gcloud auth application-default login')}>
              ADC Login
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => this.run(() => gcloudAuth.applicationDefaultRevoke(), 'gcloud auth application-default revoke', true)}
            >
              ADC Revoke
            </button>
          </div>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Config &amp; Configurations</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudConfig.list(), 'gcloud config list')}>
              Config List
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudConfig.configurationsList(), 'gcloud config configurations list')}>
              Configurations List
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              class="cli-input"
              placeholder="Config name (e.g. prod)"
              value={this.rawInput}
              onInput={(e: Event) => (this.rawInput = (e.target as HTMLInputElement).value)}
            />
            <button
              type="button"
              class="cli-btn"
              onClick={() => this.run(() => gcloudConfig.configurationsCreate(this.rawInput), `gcloud config configurations create ${this.rawInput}`)}
            >
              Create Configuration
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => this.run(() => gcloudConfig.configurationsActivate(this.rawInput), `gcloud config configurations activate ${this.rawInput}`)}
            >
              Activate Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Projects/Billing tab ─────────────────────────────────────────────────────

  private renderProjectsTab() {
    const projectValid = validateProjectId(this.projectId);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Projects</h3>
          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run(() => gcloudProjects.list(), 'gcloud projects list')}>
            List Projects
          </button>

          <div class="flex flex-col gap-2 mb-3">
            <input
              type="text"
              class={`cli-input ${this.projectId && !projectValid.valid ? 'cli-input-invalid' : ''}`}
              placeholder="project-id (e.g. my-project-123)"
              value={this.projectId}
              onInput={(e: Event) => (this.projectId = (e.target as HTMLInputElement).value.toLowerCase())}
            />
            {this.projectId && !projectValid.valid && <span class="text-danger text-xs">{projectValid.error}</span>}
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!projectValid.valid) {
                  this.validationError = projectValid.error ?? 'Invalid project ID';
                  return;
                }
                this.run(() => gcloudProjects.describe(this.projectId), `gcloud projects describe ${this.projectId}`);
              }}
            >
              Describe
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!projectValid.valid || !this.projectName) {
                  this.validationError = 'Valid project ID and name required';
                  return;
                }
                this.run(() => gcloudProjects.create(this.projectId, this.projectName), `gcloud projects create ${this.projectId} --name="${this.projectName}"`);
              }}
            >
              Create
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!projectValid.valid) {
                  this.validationError = projectValid.error ?? 'Invalid project ID';
                  return;
                }
                this.run(() => gcloudProjects.delete(this.projectId), `gcloud projects delete ${this.projectId}`, true);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!projectValid.valid) {
                  this.validationError = projectValid.error ?? 'Invalid project ID';
                  return;
                }
                this.run(() => gcloudConfig.setProject(this.projectId), `gcloud config set project ${this.projectId}`);
              }}
            >
              Set as Active
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mt-3">
            Display Name
            <input
              type="text"
              class="cli-input"
              placeholder="My Project"
              value={this.projectName}
              onInput={(e: Event) => (this.projectName = (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Organisations &amp; Billing</h3>
          <button type="button" class="cli-btn cli-btn-success mb-3" onClick={() => this.run(() => gcloudOrgs.list(), 'gcloud organizations list')}>
            List Organisations
          </button>
          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run(() => gcloudOrgs.billingAccountsList(), 'gcloud billing accounts list')}>
            List Billing Accounts
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Billing Account ID
            <input
              type="text"
              class="cli-input"
              placeholder="ABCDEF-123456-ABCDEF"
              value={this.billingAccount}
              onInput={(e: Event) => (this.billingAccount = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex gap-2 mt-2">
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!projectValid.valid || !this.billingAccount) {
                  this.validationError = 'Project ID and billing account required';
                  return;
                }
                this.run(
                  () => gcloudOrgs.billingLink(this.projectId, this.billingAccount),
                  `gcloud billing projects link ${this.projectId} --billing-account=${this.billingAccount}`,
                );
              }}
            >
              Link Billing
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!projectValid.valid) {
                  this.validationError = projectValid.error ?? 'Invalid project ID';
                  return;
                }
                this.run(() => gcloudOrgs.billingUnlink(this.projectId), `gcloud billing projects unlink ${this.projectId}`, true);
              }}
            >
              Unlink Billing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Compute tab ──────────────────────────────────────────────────────────────

  private renderComputeTab() {
    const zoneValid = validateZone(this.computeZone);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Instances</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Instance Name
              <input
                type="text"
                class="cli-input"
                placeholder="my-instance"
                value={this.computeInstance}
                onInput={(e: Event) => (this.computeInstance = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Zone
              <select class="cli-select" onChange={(e: Event) => (this.computeZone = (e.target as HTMLSelectElement).value)}>
                {COMMON_ZONES.map(z => (
                  <option key={z} value={z} selected={this.computeZone === z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudCompute.instancesList(), 'gcloud compute instances list')}>
              List All
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.computeInstance) {
                  this.validationError = 'Instance name required';
                  return;
                }
                if (!zoneValid.valid) {
                  this.validationError = zoneValid.error ?? 'Invalid zone';
                  return;
                }
                this.run(
                  () => gcloudCompute.instancesDescribe(this.computeInstance, this.computeZone),
                  `gcloud compute instances describe ${this.computeInstance} --zone=${this.computeZone}`,
                );
              }}
            >
              Describe
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.computeInstance) {
                  this.validationError = 'Instance name required';
                  return;
                }
                if (!zoneValid.valid) {
                  this.validationError = zoneValid.error ?? 'Invalid zone';
                  return;
                }
                this.run(
                  () => gcloudCompute.instancesStart(this.computeInstance, this.computeZone),
                  `gcloud compute instances start ${this.computeInstance} --zone=${this.computeZone}`,
                );
              }}
            >
              Start
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-warning"
              onClick={() => {
                if (!this.computeInstance) {
                  this.validationError = 'Instance name required';
                  return;
                }
                if (!zoneValid.valid) {
                  this.validationError = zoneValid.error ?? 'Invalid zone';
                  return;
                }
                this.run(
                  () => gcloudCompute.instancesStop(this.computeInstance, this.computeZone),
                  `gcloud compute instances stop ${this.computeInstance} --zone=${this.computeZone}`,
                );
              }}
            >
              Stop
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.computeInstance) {
                  this.validationError = 'Instance name required';
                  return;
                }
                if (!zoneValid.valid) {
                  this.validationError = zoneValid.error ?? 'Invalid zone';
                  return;
                }
                this.run(
                  () => gcloudCompute.instancesDelete(this.computeInstance, this.computeZone),
                  `gcloud compute instances delete ${this.computeInstance} --zone=${this.computeZone} --quiet`,
                  true,
                );
              }}
            >
              Delete
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.computeInstance) {
                  this.validationError = 'Instance name required';
                  return;
                }
                if (!zoneValid.valid) {
                  this.validationError = zoneValid.error ?? 'Invalid zone';
                  return;
                }
                this.run(() => gcloudCompute.instancesSsh(this.computeInstance, this.computeZone), `gcloud compute ssh ${this.computeInstance} --zone=${this.computeZone}`);
              }}
            >
              SSH
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Create Instance</h3>
          <div class="grid grid-cols-1 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              New Instance Name
              <input
                type="text"
                class="cli-input"
                placeholder="my-new-vm"
                value={this.computeNewName}
                onInput={(e: Event) => (this.computeNewName = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Machine Type
              <select class="cli-select" onChange={(e: Event) => (this.computeMachineType = (e.target as HTMLSelectElement).value)}>
                {MACHINE_TYPES.map(m => (
                  <option key={m} value={m} selected={this.computeMachineType === m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Image Family
              <select class="cli-select" onChange={(e: Event) => (this.computeImage = (e.target as HTMLSelectElement).value)}>
                {IMAGE_FAMILIES.map(img => (
                  <option key={img} value={img} selected={this.computeImage === img}>
                    {img}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="cli-cmd-preview text-xs mb-3">
            {buildComputeCreateCommand({
              name: this.computeNewName || '<name>',
              machineType: this.computeMachineType,
              zone: this.computeZone,
              imageFamily: this.computeImage,
            })}
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.computeNewName) {
                this.validationError = 'Instance name required';
                return;
              }
              this.run(
                () => gcloudCompute.instancesCreate(this.computeNewName, this.computeMachineType, this.computeZone, this.computeImage),
                buildComputeCreateCommand({
                  name: this.computeNewName,
                  machineType: this.computeMachineType,
                  zone: this.computeZone,
                  imageFamily: this.computeImage,
                }),
              );
            }}
          >
            Create Instance
          </button>
        </div>

        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">Networks &amp; Firewall</h3>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudCompute.networksList(), 'gcloud compute networks list')}>
              List Networks
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudCompute.firewallRulesList(), 'gcloud compute firewall-rules list')}>
              List Firewall Rules
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudCompute.regionsList(), 'gcloud compute regions list')}>
              List Regions
            </button>
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudCompute.zonesList(), 'gcloud compute zones list')}>
              List Zones
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Storage tab ──────────────────────────────────────────────────────────────

  private renderStorageTab() {
    const bucketValid = validateBucketName(this.storageBucket);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Buckets</h3>
          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run(() => gcloudStorage.bucketsList(), 'gcloud storage buckets list')}>
            List Buckets
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Bucket Name
            <input
              type="text"
              class={`cli-input ${this.storageBucket && !bucketValid.valid ? 'cli-input-invalid' : ''}`}
              placeholder="my-bucket-name"
              value={this.storageBucket}
              onInput={(e: Event) => (this.storageBucket = (e.target as HTMLInputElement).value.toLowerCase())}
            />
            {this.storageBucket && !bucketValid.valid && <span class="text-danger text-xs">{bucketValid.error}</span>}
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Location
            <select class="cli-select" onChange={(e: Event) => (this.storageLocation = (e.target as HTMLSelectElement).value)}>
              {GCS_LOCATIONS.map(loc => (
                <option key={loc} value={loc} selected={this.storageLocation === loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!bucketValid.valid) {
                  this.validationError = bucketValid.error ?? 'Invalid bucket name';
                  return;
                }
                this.run(() => gcloudStorage.objectsList(this.storageBucket), `gcloud storage ls gs://${this.storageBucket}`);
              }}
            >
              List Objects
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!bucketValid.valid) {
                  this.validationError = bucketValid.error ?? 'Invalid bucket name';
                  return;
                }
                this.run(
                  () => gcloudStorage.bucketsCreate(this.storageBucket, this.storageLocation),
                  `gcloud storage buckets create gs://${this.storageBucket} --location=${this.storageLocation}`,
                );
              }}
            >
              Create Bucket
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!bucketValid.valid) {
                  this.validationError = bucketValid.error ?? 'Invalid bucket name';
                  return;
                }
                this.run(() => gcloudStorage.bucketsDelete(this.storageBucket), `gcloud storage buckets delete gs://${this.storageBucket}`, true);
              }}
            >
              Delete Bucket
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Objects</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Source URI (gs:// or local path)
            <input
              type="text"
              class="cli-input"
              placeholder="gs://bucket/object or ./local-file"
              value={this.storageCopySrc}
              onInput={(e: Event) => (this.storageCopySrc = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Destination URI
            <input
              type="text"
              class="cli-input"
              placeholder="gs://bucket/object or ./local-file"
              value={this.storageCopyDst}
              onInput={(e: Event) => (this.storageCopyDst = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn mb-4"
            onClick={() => {
              if (!this.storageCopySrc || !this.storageCopyDst) {
                this.validationError = 'Source and destination required';
                return;
              }
              this.run(() => gcloudStorage.objectsCopy(this.storageCopySrc, this.storageCopyDst), `gcloud storage cp ${this.storageCopySrc} ${this.storageCopyDst}`);
            }}
          >
            Copy Object
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Object URI to Delete
            <input
              type="text"
              class="cli-input"
              placeholder="gs://bucket/object"
              value={this.storageObjectUri}
              onInput={(e: Event) => (this.storageObjectUri = (e.target as HTMLInputElement).value)}
            />
          </label>
          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (!this.storageObjectUri) {
                this.validationError = 'Object URI required';
                return;
              }
              this.run(() => gcloudStorage.objectsDelete(this.storageObjectUri), `gcloud storage rm ${this.storageObjectUri}`, true);
            }}
          >
            Delete Object
          </button>
        </div>
      </div>
    );
  }

  // ── IAM tab ──────────────────────────────────────────────────────────────────

  private renderIamTab() {
    const saEmailValid = validateServiceAccountEmail(this.iamSaEmail);
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Service Accounts</h3>
          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run(() => gcloudIam.serviceAccountsList(), 'gcloud iam service-accounts list')}>
            List Service Accounts
          </button>

          <div class="grid grid-cols-1 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              SA Name (short id)
              <input type="text" class="cli-input" placeholder="my-sa" value={this.iamSaName} onInput={(e: Event) => (this.iamSaName = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Display Name
              <input
                type="text"
                class="cli-input"
                placeholder="My Service Account"
                value={this.iamSaDisplayName}
                onInput={(e: Event) => (this.iamSaDisplayName = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <button
            type="button"
            class="cli-btn mb-4"
            onClick={() => {
              if (!this.iamSaName) {
                this.validationError = 'SA name required';
                return;
              }
              this.run(
                () => gcloudIam.serviceAccountsCreate(this.iamSaName, this.iamSaDisplayName),
                `gcloud iam service-accounts create ${this.iamSaName} --display-name="${this.iamSaDisplayName}"`,
              );
            }}
          >
            Create SA
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            SA Email
            <input
              type="text"
              class={`cli-input ${this.iamSaEmail && !saEmailValid.valid ? 'cli-input-invalid' : ''}`}
              placeholder="name@project.iam.gserviceaccount.com"
              value={this.iamSaEmail}
              onInput={(e: Event) => (this.iamSaEmail = (e.target as HTMLInputElement).value)}
            />
            {this.iamSaEmail && !saEmailValid.valid && <span class="text-danger text-xs">{saEmailValid.error}</span>}
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!saEmailValid.valid) {
                  this.validationError = saEmailValid.error ?? 'Invalid SA email';
                  return;
                }
                this.run(() => gcloudIam.keysList(this.iamSaEmail), `gcloud iam service-accounts keys list --iam-account=${this.iamSaEmail}`);
              }}
            >
              List Keys
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!saEmailValid.valid) {
                  this.validationError = saEmailValid.error ?? 'Invalid SA email';
                  return;
                }
                this.run(
                  () => gcloudIam.keysCreate(this.iamSaEmail, this.iamKeyOutputFile),
                  `gcloud iam service-accounts keys create ${this.iamKeyOutputFile} --iam-account=${this.iamSaEmail}`,
                );
              }}
            >
              Create Key
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!saEmailValid.valid) {
                  this.validationError = saEmailValid.error ?? 'Invalid SA email';
                  return;
                }
                this.run(() => gcloudIam.serviceAccountsDelete(this.iamSaEmail), `gcloud iam service-accounts delete ${this.iamSaEmail}`, true);
              }}
            >
              Delete SA
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">IAM Policy Bindings</h3>
          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run(() => gcloudIam.rolesList(), 'gcloud iam roles list')}>
            List Roles
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Member (user:/serviceAccount:/group:)
            <input
              type="text"
              class="cli-input"
              placeholder="user:alice@example.com"
              value={this.iamMember}
              onInput={(e: Event) => (this.iamMember = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Role
            <select class="cli-select" onChange={(e: Event) => (this.iamRole = (e.target as HTMLSelectElement).value)}>
              {IAM_ROLES.map(r => (
                <option key={r} value={r} selected={this.iamRole === r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Key Output File
            <input
              type="text"
              class="cli-input"
              placeholder="~/key.json"
              value={this.iamKeyOutputFile}
              onInput={(e: Event) => (this.iamKeyOutputFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              const pid = validateProjectId(this.projectId);
              if (!pid.valid) {
                this.validationError = 'Set a valid project ID in the Projects tab first';
                return;
              }
              if (!this.iamMember) {
                this.validationError = 'Member required';
                return;
              }
              this.run(
                () => gcloudProjects.addIamPolicyBinding(this.projectId, this.iamMember, this.iamRole),
                `gcloud projects add-iam-policy-binding ${this.projectId} --member="${this.iamMember}" --role="${this.iamRole}"`,
              );
            }}
          >
            Add IAM Binding
          </button>
        </div>
      </div>
    );
  }

  // ── Serverless tab ───────────────────────────────────────────────────────────

  private renderServerlessTab() {
    const fnCmd = buildFunctionDeployCommand({
      name: this.fnName || '<name>',
      runtime: this.fnRuntime,
      entryPoint: this.fnEntryPoint,
      trigger: this.fnTrigger,
      region: this.fnRegion,
    });
    const runCmd = buildRunDeployCommand({
      serviceName: this.runService || '<service>',
      image: this.runImage || '<image>',
      region: this.runRegion,
      allowUnauthenticated: this.runAllowUnauth,
    });

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Cloud Functions */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Cloud Functions</h3>

          <div class="grid grid-cols-1 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Function Name
              <input type="text" class="cli-input" placeholder="my-function" value={this.fnName} onInput={(e: Event) => (this.fnName = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Runtime
              <select class="cli-select" onChange={(e: Event) => (this.fnRuntime = (e.target as HTMLSelectElement).value)}>
                {FUNCTION_RUNTIMES.map(r => (
                  <option key={r} value={r} selected={this.fnRuntime === r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Entry Point
              <input
                type="text"
                class="cli-input"
                placeholder="main"
                value={this.fnEntryPoint}
                onInput={(e: Event) => (this.fnEntryPoint = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Trigger
              <select class="cli-select" onChange={(e: Event) => (this.fnTrigger = (e.target as HTMLSelectElement).value)}>
                <option value="http">HTTP</option>
                <option value="topic">Pub/Sub topic</option>
                <option value="bucket">GCS bucket</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Region
              <select class="cli-select" onChange={(e: Event) => (this.fnRegion = (e.target as HTMLSelectElement).value)}>
                {COMMON_REGIONS.map(r => (
                  <option key={r} value={r} selected={this.fnRegion === r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="cli-cmd-preview text-xs mb-3">{fnCmd}</div>

          <div class="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.run(() => gcloudFunctions.list(this.fnRegion), `gcloud functions list --regions=${this.fnRegion}`)}
            >
              List
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.fnName) {
                  this.validationError = 'Function name required';
                  return;
                }
                this.run(() => gcloudFunctions.deploy(this.fnName, this.fnRuntime, this.fnEntryPoint, this.fnTrigger, this.fnRegion), fnCmd);
              }}
            >
              Deploy
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.fnName) {
                  this.validationError = 'Function name required';
                  return;
                }
                this.run(() => gcloudFunctions.describe(this.fnName, this.fnRegion), `gcloud functions describe ${this.fnName} --region=${this.fnRegion}`);
              }}
            >
              Describe
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.fnName) {
                  this.validationError = 'Function name required';
                  return;
                }
                this.run(() => gcloudFunctions.call(this.fnName, this.fnRegion, this.fnCallData || undefined), `gcloud functions call ${this.fnName} --region=${this.fnRegion}`);
              }}
            >
              Call
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.fnName) {
                  this.validationError = 'Function name required';
                  return;
                }
                this.run(() => gcloudFunctions.logsList(this.fnName, this.fnRegion), `gcloud functions logs read ${this.fnName} --region=${this.fnRegion}`);
              }}
            >
              Logs
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.fnName) {
                  this.validationError = 'Function name required';
                  return;
                }
                this.run(() => gcloudFunctions.delete(this.fnName, this.fnRegion), `gcloud functions delete ${this.fnName} --region=${this.fnRegion}`, true);
              }}
            >
              Delete
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2">
            Call Data (JSON)
            <input
              type="text"
              class="cli-input"
              placeholder='{"key":"value"}'
              value={this.fnCallData}
              onInput={(e: Event) => (this.fnCallData = (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {/* Cloud Run */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Cloud Run</h3>

          <div class="grid grid-cols-1 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Service Name
              <input
                type="text"
                class="cli-input"
                placeholder="my-service"
                value={this.runService}
                onInput={(e: Event) => (this.runService = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Container Image
              <input
                type="text"
                class="cli-input"
                placeholder="gcr.io/my-project/my-image:latest"
                value={this.runImage}
                onInput={(e: Event) => (this.runImage = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Region
              <select class="cli-select" onChange={(e: Event) => (this.runRegion = (e.target as HTMLSelectElement).value)}>
                {COMMON_REGIONS.map(r => (
                  <option key={r} value={r} selected={this.runRegion === r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={this.runAllowUnauth} onChange={(e: Event) => (this.runAllowUnauth = (e.target as HTMLInputElement).checked)} />
              Allow unauthenticated
            </label>
          </div>

          <div class="cli-cmd-preview text-xs mb-3">{runCmd}</div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.run(() => gcloudRun.servicesList(this.runRegion), `gcloud run services list --region=${this.runRegion}`)}
            >
              List Services
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.runService || !this.runImage) {
                  this.validationError = 'Service name and image required';
                  return;
                }
                this.run(() => gcloudRun.deploy(this.runService, this.runImage, this.runRegion, this.runAllowUnauth), runCmd);
              }}
            >
              Deploy
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.runService) {
                  this.validationError = 'Service name required';
                  return;
                }
                this.run(() => gcloudRun.revisionsList(this.runService, this.runRegion), `gcloud run revisions list --service=${this.runService} --region=${this.runRegion}`);
              }}
            >
              Revisions
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.runService) {
                  this.validationError = 'Service name required';
                  return;
                }
                this.run(() => gcloudRun.delete(this.runService, this.runRegion), `gcloud run services delete ${this.runService} --region=${this.runRegion}`, true);
              }}
            >
              Delete Service
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GKE tab ──────────────────────────────────────────────────────────────────

  private renderGkeTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Kubernetes Engine Clusters</h3>

          <div class="grid grid-cols-1 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Cluster Name
              <input
                type="text"
                class="cli-input"
                placeholder="my-cluster"
                value={this.gkeCluster}
                onInput={(e: Event) => (this.gkeCluster = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Region / Zone
              <select class="cli-select" onChange={(e: Event) => (this.gkeRegion = (e.target as HTMLSelectElement).value)}>
                {COMMON_REGIONS.map(r => (
                  <option key={r} value={r} selected={this.gkeRegion === r}>
                    {r}
                  </option>
                ))}
                {COMMON_ZONES.map(z => (
                  <option key={z} value={z} selected={this.gkeRegion === (z as string)}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudGke.clustersList(), 'gcloud container clusters list')}>
              List Clusters
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.gkeCluster) {
                  this.validationError = 'Cluster name required';
                  return;
                }
                this.run(() => gcloudGke.describe(this.gkeCluster, this.gkeRegion), `gcloud container clusters describe ${this.gkeCluster} --region=${this.gkeRegion}`);
              }}
            >
              Describe
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.gkeCluster) {
                  this.validationError = 'Cluster name required';
                  return;
                }
                this.run(
                  () => gcloudGke.getCredentials(this.gkeCluster, this.gkeRegion),
                  `gcloud container clusters get-credentials ${this.gkeCluster} --region=${this.gkeRegion}`,
                );
              }}
            >
              Get Credentials
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.gkeCluster) {
                  this.validationError = 'Cluster name required';
                  return;
                }
                this.run(() => gcloudGke.delete(this.gkeCluster, this.gkeRegion), `gcloud container clusters delete ${this.gkeCluster} --region=${this.gkeRegion} --quiet`, true);
              }}
            >
              Delete Cluster
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-base text-text2 mb-2">Tips</h3>
          <ul class="text-sm text-text2 space-y-2 list-disc list-inside">
            <li>
              Use <code class="text-info">get-credentials</code> to update kubeconfig for <code>kubectl</code>
            </li>
            <li>
              Autopilot clusters use <code>--region</code>; Standard clusters use <code>--zone</code>
            </li>
            <li>
              After getting credentials, use <code>kubectl get pods --all-namespaces</code>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // ── Logging tab ──────────────────────────────────────────────────────────────

  private renderLoggingTab() {
    const logCmd = `gcloud logging read "${this.logFilter}" --limit=${this.logLimit} --format=json${this.logProject ? ` --project=${this.logProject}` : ''}`;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Read Logs</h3>

          <div class="grid grid-cols-1 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Filter (advanced log filter)
              <input
                type="text"
                class="cli-input font-mono"
                placeholder='severity>=ERROR resource.type="gce_instance"'
                value={this.logFilter}
                onInput={(e: Event) => (this.logFilter = (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Limit (entries)
              <input
                type="number"
                class="cli-input"
                min="1"
                max="1000"
                value={this.logLimit}
                onInput={(e: Event) => (this.logLimit = Number((e.target as HTMLInputElement).value) || 50)}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Project (optional override)
              <input
                type="text"
                class="cli-input"
                placeholder="my-project-123"
                value={this.logProject}
                onInput={(e: Event) => (this.logProject = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="cli-cmd-preview text-xs mb-3">{logCmd}</div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => this.run(() => gcloudLogging.read(this.logFilter, this.logLimit, this.logProject || undefined), logCmd)}
            >
              Read Logs
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() =>
                this.run(() => gcloudLogging.logsList(this.logProject || undefined), `gcloud logging logs list${this.logProject ? ` --project=${this.logProject}` : ''}`)
              }
            >
              List Log Names
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-base text-text2 mb-2">Common Filters</h3>
          <div class="space-y-2">
            {[
              { label: 'Errors only', filter: 'severity>=ERROR' },
              { label: 'GCE instance logs', filter: 'resource.type="gce_instance"' },
              { label: 'Cloud Run logs', filter: 'resource.type="cloud_run_revision"' },
              { label: 'Cloud Functions logs', filter: 'resource.type="cloud_function"' },
              { label: 'GKE cluster logs', filter: 'resource.type="k8s_cluster"' },
              { label: 'Last hour', filter: 'timestamp>="2024-01-01T00:00:00Z"' },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                class="cli-btn cli-btn-sm w-full text-left"
                onClick={() => {
                  this.logFilter = item.filter;
                }}
              >
                <span class="font-medium">{item.label}</span>
                <br />
                <code class="text-xs opacity-70">{item.filter}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Secrets tab ──────────────────────────────────────────────────────────────

  private renderSecretsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Secret Manager</h3>

          <button type="button" class="cli-btn cli-btn-success mb-4" onClick={() => this.run(() => gcloudSecrets.list(), 'gcloud secrets list')}>
            List Secrets
          </button>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Secret Name
            <input
              type="text"
              class="cli-input"
              placeholder="my-api-key"
              value={this.secretName}
              onInput={(e: Event) => (this.secretName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Data File (- for stdin)
            <input
              type="text"
              class="cli-input"
              placeholder="- or /path/to/secret"
              value={this.secretDataFile}
              onInput={(e: Event) => (this.secretDataFile = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.secretName) {
                  this.validationError = 'Secret name required';
                  return;
                }
                this.run(() => gcloudSecrets.create(this.secretName, this.secretDataFile), `gcloud secrets create ${this.secretName} --data-file=${this.secretDataFile}`);
              }}
            >
              Create Secret
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.secretName) {
                  this.validationError = 'Secret name required';
                  return;
                }
                this.run(() => gcloudSecrets.delete(this.secretName), `gcloud secrets delete ${this.secretName} --quiet`, true);
              }}
            >
              Delete Secret
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Secret Versions</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Secret Name
            <input
              type="text"
              class="cli-input"
              placeholder="my-api-key"
              value={this.secretName}
              onInput={(e: Event) => (this.secretName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Version (latest or number)
            <input
              type="text"
              class="cli-input"
              placeholder="latest"
              value={this.secretVersion}
              onInput={(e: Event) => (this.secretVersion = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.secretName) {
                  this.validationError = 'Secret name required';
                  return;
                }
                this.run(() => gcloudSecrets.versionsList(this.secretName), `gcloud secrets versions list ${this.secretName}`);
              }}
            >
              List Versions
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.secretName) {
                  this.validationError = 'Secret name required';
                  return;
                }
                this.run(
                  () => gcloudSecrets.versionsAccess(this.secretName, this.secretVersion),
                  `gcloud secrets versions access ${this.secretVersion} --secret=${this.secretName}`,
                );
              }}
            >
              Access Secret
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.secretName) {
                  this.validationError = 'Secret name required';
                  return;
                }
                this.run(
                  () => gcloudSecrets.versionsAdd(this.secretName, this.secretDataFile),
                  `gcloud secrets versions add ${this.secretName} --data-file=${this.secretDataFile}`,
                );
              }}
            >
              Add Version
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Components tab ───────────────────────────────────────────────────────────

  private renderComponentsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">SDK Components</h3>

          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" class="cli-btn cli-btn-success" onClick={() => this.run(() => gcloudComponents.list(), 'gcloud components list')}>
              List Components
            </button>
            <button type="button" class="cli-btn" onClick={() => this.run(() => gcloudComponents.update(), 'gcloud components update --quiet')}>
              Update All
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-2">
            Component ID
            <input
              type="text"
              class="cli-input"
              placeholder="kubectl, beta, alpha, gsutil …"
              value={this.componentId}
              onInput={(e: Event) => (this.componentId = (e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.componentId) {
                  this.validationError = 'Component ID required';
                  return;
                }
                this.run(() => gcloudComponents.install(this.componentId), `gcloud components install ${this.componentId} --quiet`);
              }}
            >
              Install
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.componentId) {
                  this.validationError = 'Component ID required';
                  return;
                }
                this.run(() => gcloudComponents.remove(this.componentId), `gcloud components remove ${this.componentId} --quiet`, true);
              }}
            >
              Remove
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-base text-text2 mb-2">Common Components</h3>
          <div class="grid grid-cols-2 gap-2">
            {['kubectl', 'beta', 'alpha', 'gsutil', 'bq', 'docker-credential-gcr', 'cloud-run-proxy', 'cloud-datastore-emulator', 'pubsub-emulator', 'bigtable'].map(comp => (
              <button
                key={comp}
                type="button"
                class="cli-btn cli-btn-sm text-left"
                onClick={() => {
                  this.componentId = comp;
                }}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tabs renderer ────────────────────────────────────────────────────────────

  private renderTabs() {
    return (
      <div class="flex flex-wrap gap-1 mb-4 border-b border-accent2 pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
              this.validationError = '';
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // ── Root render ──────────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen pb-16">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🌩️</span> gcloud GUI
          </h2>
          <p class="text-text2 text-sm">Google Cloud SDK — visual interface</p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'auth' && this.renderAuthTab()}
          {this.activeTab === 'projects' && this.renderProjectsTab()}
          {this.activeTab === 'compute' && this.renderComputeTab()}
          {this.activeTab === 'storage' && this.renderStorageTab()}
          {this.activeTab === 'iam' && this.renderIamTab()}
          {this.activeTab === 'serverless' && this.renderServerlessTab()}
          {this.activeTab === 'gke' && this.renderGkeTab()}
          {this.activeTab === 'logging' && this.renderLoggingTab()}
          {this.activeTab === 'secrets' && this.renderSecretsTab()}
          {this.activeTab === 'components' && this.renderComponentsTab()}
        </div>

        {this.renderOutput()}
      </div>
    );
  }
}
