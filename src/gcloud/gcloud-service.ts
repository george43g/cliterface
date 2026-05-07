import { executeCommand as baseExecuteCommand } from '../utils/execute-command';

export type { CommandResult } from '../utils/execute-command';

import type { CommandResult } from '../yabai/yabai-service';

/**
 * gcloud execution service — stub bridge.
 * Replace executeCommand body with a real native bridge (Tauri, Electron,
 * WKWebView, HTTP) to connect to the host system.
 */
export async function executeCommand(cmd: string): Promise<CommandResult> {
  return baseExecuteCommand(cmd);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const gcloudAuth = {
  login(): Promise<CommandResult> {
    return executeCommand('gcloud auth login');
  },
  logout(account: string): Promise<CommandResult> {
    return executeCommand(`gcloud auth revoke ${account}`);
  },
  list(): Promise<CommandResult> {
    return executeCommand('gcloud auth list');
  },
  applicationDefaultLogin(): Promise<CommandResult> {
    return executeCommand('gcloud auth application-default login');
  },
  applicationDefaultRevoke(): Promise<CommandResult> {
    return executeCommand('gcloud auth application-default revoke');
  },
  printAccessToken(): Promise<CommandResult> {
    return executeCommand('gcloud auth print-access-token');
  },
};

// ── Config ────────────────────────────────────────────────────────────────────

export const gcloudConfig = {
  list(): Promise<CommandResult> {
    return executeCommand('gcloud config list');
  },
  configurationsList(): Promise<CommandResult> {
    return executeCommand('gcloud config configurations list');
  },
  configurationsCreate(name: string): Promise<CommandResult> {
    return executeCommand(`gcloud config configurations create ${name}`);
  },
  configurationsActivate(name: string): Promise<CommandResult> {
    return executeCommand(`gcloud config configurations activate ${name}`);
  },
  setProject(projectId: string): Promise<CommandResult> {
    return executeCommand(`gcloud config set project ${projectId}`);
  },
  setRegion(region: string): Promise<CommandResult> {
    return executeCommand(`gcloud config set compute/region ${region}`);
  },
  setZone(zone: string): Promise<CommandResult> {
    return executeCommand(`gcloud config set compute/zone ${zone}`);
  },
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const gcloudProjects = {
  list(): Promise<CommandResult> {
    return executeCommand('gcloud projects list');
  },
  describe(projectId: string): Promise<CommandResult> {
    return executeCommand(`gcloud projects describe ${projectId}`);
  },
  create(projectId: string, name: string): Promise<CommandResult> {
    return executeCommand(`gcloud projects create ${projectId} --name="${name}"`);
  },
  delete(projectId: string): Promise<CommandResult> {
    return executeCommand(`gcloud projects delete ${projectId}`);
  },
  getIamPolicy(projectId: string): Promise<CommandResult> {
    return executeCommand(`gcloud projects get-iam-policy ${projectId}`);
  },
  addIamPolicyBinding(projectId: string, member: string, role: string): Promise<CommandResult> {
    return executeCommand(`gcloud projects add-iam-policy-binding ${projectId} --member="${member}" --role="${role}"`);
  },
};

// ── Organisations & Billing ───────────────────────────────────────────────────

export const gcloudOrgs = {
  list(): Promise<CommandResult> {
    return executeCommand('gcloud organizations list');
  },
  billingAccountsList(): Promise<CommandResult> {
    return executeCommand('gcloud billing accounts list');
  },
  billingLink(projectId: string, billingAccount: string): Promise<CommandResult> {
    return executeCommand(`gcloud billing projects link ${projectId} --billing-account=${billingAccount}`);
  },
  billingUnlink(projectId: string): Promise<CommandResult> {
    return executeCommand(`gcloud billing projects unlink ${projectId}`);
  },
};

// ── Compute ───────────────────────────────────────────────────────────────────

export const gcloudCompute = {
  instancesList(project?: string, zone?: string): Promise<CommandResult> {
    let cmd = 'gcloud compute instances list';
    if (project) cmd += ` --project=${project}`;
    if (zone) cmd += ` --zone=${zone}`;
    return executeCommand(cmd);
  },
  instancesDescribe(instance: string, zone: string): Promise<CommandResult> {
    return executeCommand(`gcloud compute instances describe ${instance} --zone=${zone}`);
  },
  instancesCreate(name: string, machineType: string, zone: string, image: string): Promise<CommandResult> {
    return executeCommand(`gcloud compute instances create ${name} --machine-type=${machineType} --zone=${zone} --image-family=${image}`);
  },
  instancesStart(instance: string, zone: string): Promise<CommandResult> {
    return executeCommand(`gcloud compute instances start ${instance} --zone=${zone}`);
  },
  instancesStop(instance: string, zone: string): Promise<CommandResult> {
    return executeCommand(`gcloud compute instances stop ${instance} --zone=${zone}`);
  },
  instancesDelete(instance: string, zone: string): Promise<CommandResult> {
    return executeCommand(`gcloud compute instances delete ${instance} --zone=${zone} --quiet`);
  },
  instancesSsh(instance: string, zone: string, cmd?: string): Promise<CommandResult> {
    const extra = cmd ? ` -- ${cmd}` : '';
    return executeCommand(`gcloud compute ssh ${instance} --zone=${zone}${extra}`);
  },
  networksList(): Promise<CommandResult> {
    return executeCommand('gcloud compute networks list');
  },
  firewallRulesList(): Promise<CommandResult> {
    return executeCommand('gcloud compute firewall-rules list');
  },
  regionsList(): Promise<CommandResult> {
    return executeCommand('gcloud compute regions list');
  },
  zonesList(): Promise<CommandResult> {
    return executeCommand('gcloud compute zones list');
  },
};

// ── Storage ───────────────────────────────────────────────────────────────────

export const gcloudStorage = {
  bucketsList(): Promise<CommandResult> {
    return executeCommand('gcloud storage buckets list');
  },
  bucketsCreate(name: string, location: string): Promise<CommandResult> {
    return executeCommand(`gcloud storage buckets create gs://${name} --location=${location}`);
  },
  bucketsDelete(name: string): Promise<CommandResult> {
    return executeCommand(`gcloud storage buckets delete gs://${name}`);
  },
  objectsList(bucket: string): Promise<CommandResult> {
    return executeCommand(`gcloud storage ls gs://${bucket}`);
  },
  objectsCopy(src: string, dst: string): Promise<CommandResult> {
    return executeCommand(`gcloud storage cp ${src} ${dst}`);
  },
  objectsDelete(uri: string): Promise<CommandResult> {
    return executeCommand(`gcloud storage rm ${uri}`);
  },
};

// ── IAM ───────────────────────────────────────────────────────────────────────

export const gcloudIam = {
  serviceAccountsList(project?: string): Promise<CommandResult> {
    const extra = project ? ` --project=${project}` : '';
    return executeCommand(`gcloud iam service-accounts list${extra}`);
  },
  serviceAccountsCreate(name: string, displayName: string, project?: string): Promise<CommandResult> {
    let cmd = `gcloud iam service-accounts create ${name} --display-name="${displayName}"`;
    if (project) cmd += ` --project=${project}`;
    return executeCommand(cmd);
  },
  serviceAccountsDelete(email: string): Promise<CommandResult> {
    return executeCommand(`gcloud iam service-accounts delete ${email}`);
  },
  keysList(serviceAccount: string): Promise<CommandResult> {
    return executeCommand(`gcloud iam service-accounts keys list --iam-account=${serviceAccount}`);
  },
  keysCreate(serviceAccount: string, outputFile: string): Promise<CommandResult> {
    return executeCommand(`gcloud iam service-accounts keys create ${outputFile} --iam-account=${serviceAccount}`);
  },
  rolesList(project?: string): Promise<CommandResult> {
    const extra = project ? ` --project=${project}` : '';
    return executeCommand(`gcloud iam roles list${extra}`);
  },
};

// ── Cloud Functions ───────────────────────────────────────────────────────────

export const gcloudFunctions = {
  list(region?: string): Promise<CommandResult> {
    const extra = region ? ` --regions=${region}` : '';
    return executeCommand(`gcloud functions list${extra}`);
  },
  describe(name: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud functions describe ${name} --region=${region}`);
  },
  deploy(name: string, runtime: string, entryPoint: string, trigger: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud functions deploy ${name} --runtime=${runtime} --entry-point=${entryPoint} --trigger-${trigger} --region=${region}`);
  },
  delete(name: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud functions delete ${name} --region=${region}`);
  },
  call(name: string, region: string, data?: string): Promise<CommandResult> {
    const extra = data ? ` --data='${data}'` : '';
    return executeCommand(`gcloud functions call ${name} --region=${region}${extra}`);
  },
  logsList(name: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud functions logs read ${name} --region=${region}`);
  },
};

// ── Cloud Run ─────────────────────────────────────────────────────────────────

export const gcloudRun = {
  servicesList(region?: string): Promise<CommandResult> {
    const extra = region ? ` --region=${region}` : '';
    return executeCommand(`gcloud run services list${extra}`);
  },
  deploy(serviceName: string, image: string, region: string, allowUnauthenticated: boolean): Promise<CommandResult> {
    const auth = allowUnauthenticated ? ' --allow-unauthenticated' : ' --no-allow-unauthenticated';
    return executeCommand(`gcloud run deploy ${serviceName} --image=${image} --region=${region}${auth}`);
  },
  delete(serviceName: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud run services delete ${serviceName} --region=${region}`);
  },
  revisionsList(service: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud run revisions list --service=${service} --region=${region}`);
  },
};

// ── GKE ───────────────────────────────────────────────────────────────────────

export const gcloudGke = {
  clustersList(region?: string): Promise<CommandResult> {
    const extra = region ? ` --region=${region}` : '';
    return executeCommand(`gcloud container clusters list${extra}`);
  },
  getCredentials(cluster: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud container clusters get-credentials ${cluster} --region=${region}`);
  },
  describe(cluster: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud container clusters describe ${cluster} --region=${region}`);
  },
  delete(cluster: string, region: string): Promise<CommandResult> {
    return executeCommand(`gcloud container clusters delete ${cluster} --region=${region} --quiet`);
  },
};

// ── Logging ───────────────────────────────────────────────────────────────────

export const gcloudLogging = {
  read(filter: string, limit: number, project?: string): Promise<CommandResult> {
    let cmd = `gcloud logging read "${filter}" --limit=${limit} --format=json`;
    if (project) cmd += ` --project=${project}`;
    return executeCommand(cmd);
  },
  logsList(project?: string): Promise<CommandResult> {
    const extra = project ? ` --project=${project}` : '';
    return executeCommand(`gcloud logging logs list${extra}`);
  },
};

// ── Secrets ───────────────────────────────────────────────────────────────────

export const gcloudSecrets = {
  list(project?: string): Promise<CommandResult> {
    const extra = project ? ` --project=${project}` : '';
    return executeCommand(`gcloud secrets list${extra}`);
  },
  create(name: string, dataFile: string): Promise<CommandResult> {
    return executeCommand(`gcloud secrets create ${name} --data-file=${dataFile}`);
  },
  delete(name: string): Promise<CommandResult> {
    return executeCommand(`gcloud secrets delete ${name} --quiet`);
  },
  versionsAdd(secret: string, dataFile: string): Promise<CommandResult> {
    return executeCommand(`gcloud secrets versions add ${secret} --data-file=${dataFile}`);
  },
  versionsAccess(secret: string, version = 'latest'): Promise<CommandResult> {
    return executeCommand(`gcloud secrets versions access ${version} --secret=${secret}`);
  },
  versionsList(secret: string): Promise<CommandResult> {
    return executeCommand(`gcloud secrets versions list ${secret}`);
  },
};

// ── Components ────────────────────────────────────────────────────────────────

export const gcloudComponents = {
  list(): Promise<CommandResult> {
    return executeCommand('gcloud components list');
  },
  install(component: string): Promise<CommandResult> {
    return executeCommand(`gcloud components install ${component} --quiet`);
  },
  remove(component: string): Promise<CommandResult> {
    return executeCommand(`gcloud components remove ${component} --quiet`);
  },
  update(): Promise<CommandResult> {
    return executeCommand('gcloud components update --quiet');
  },
};
