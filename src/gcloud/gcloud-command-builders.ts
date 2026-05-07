/**
 * gcloud command builder helpers — pure functions, no side effects.
 * Validates inputs and assembles CLI argument strings.
 */

// ── Validation helpers (Zod-free, single-file bundle target) ─────────────────

/** Validate a GCP project ID: lowercase letters, digits, hyphens, 6-30 chars. */
export function validateProjectId(id: string): { valid: boolean; error?: string } {
  if (!id) return { valid: false, error: 'Project ID is required' };
  if (id.length < 6 || id.length > 30) return { valid: false, error: 'Must be 6–30 characters' };
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(id)) {
    return { valid: false, error: 'Lowercase letters, digits and hyphens only; must start with a letter' };
  }
  return { valid: true };
}

/** Validate a GCP region (e.g. us-central1). */
export function validateRegion(region: string): { valid: boolean; error?: string } {
  if (!region) return { valid: false, error: 'Region is required' };
  if (!/^[a-z]+-[a-z]+\d+$/.test(region)) {
    return { valid: false, error: 'Expected format: us-central1' };
  }
  return { valid: true };
}

/** Validate a GCP zone (e.g. us-central1-a). */
export function validateZone(zone: string): { valid: boolean; error?: string } {
  if (!zone) return { valid: false, error: 'Zone is required' };
  if (!/^[a-z]+-[a-z]+\d+-[a-z]$/.test(zone)) {
    return { valid: false, error: 'Expected format: us-central1-a' };
  }
  return { valid: true };
}

/** Validate a GCS bucket name: 3-63 chars, lowercase letters, digits, hyphens, dots, underscores. */
export function validateBucketName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Bucket name is required' };
  if (name.length < 3 || name.length > 63) return { valid: false, error: 'Must be 3–63 characters' };
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(name)) {
    return { valid: false, error: 'Lowercase letters, digits, hyphens, underscores and dots only' };
  }
  return { valid: true };
}

/** Validate a service account email. */
export function validateServiceAccountEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email is required' };
  if (!/@.*\.iam\.gserviceaccount\.com$/.test(email)) {
    return { valid: false, error: 'Expected format: name@project.iam.gserviceaccount.com' };
  }
  return { valid: true };
}

// ── Common GCP regions ────────────────────────────────────────────────────────

export const COMMON_REGIONS = [
  'us-central1',
  'us-east1',
  'us-east4',
  'us-west1',
  'us-west2',
  'us-west3',
  'us-west4',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'europe-west6',
  'europe-north1',
  'asia-east1',
  'asia-east2',
  'asia-northeast1',
  'asia-northeast2',
  'asia-southeast1',
  'asia-southeast2',
  'australia-southeast1',
  'southamerica-east1',
  'northamerica-northeast1',
] as const;

export const COMMON_ZONES = [
  'us-central1-a',
  'us-central1-b',
  'us-central1-c',
  'us-east1-b',
  'us-east1-c',
  'us-west1-a',
  'us-west1-b',
  'europe-west1-b',
  'europe-west1-c',
  'asia-east1-a',
  'asia-east1-b',
  'asia-northeast1-a',
] as const;

export const MACHINE_TYPES = [
  'e2-micro',
  'e2-small',
  'e2-medium',
  'e2-standard-2',
  'e2-standard-4',
  'e2-standard-8',
  'n1-standard-1',
  'n1-standard-2',
  'n1-standard-4',
  'n2-standard-2',
  'n2-standard-4',
  'c2-standard-4',
  'c2-standard-8',
] as const;

export const IMAGE_FAMILIES = ['debian-12', 'debian-11', 'ubuntu-2204-lts', 'ubuntu-2004-lts', 'cos-stable', 'rhel-9', 'centos-stream-9'] as const;

export const FUNCTION_RUNTIMES = [
  'nodejs20',
  'nodejs18',
  'nodejs16',
  'python312',
  'python311',
  'python310',
  'python39',
  'go122',
  'go121',
  'go119',
  'java21',
  'java17',
  'ruby32',
  'php82',
] as const;

export const GCS_LOCATIONS = ['US', 'EU', 'ASIA', 'us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'] as const;

export const IAM_ROLES = [
  'roles/viewer',
  'roles/editor',
  'roles/owner',
  'roles/compute.admin',
  'roles/compute.viewer',
  'roles/storage.admin',
  'roles/storage.objectAdmin',
  'roles/storage.objectViewer',
  'roles/iam.serviceAccountUser',
  'roles/iam.serviceAccountAdmin',
  'roles/cloudfunctions.admin',
  'roles/run.admin',
  'roles/container.admin',
  'roles/secretmanager.admin',
  'roles/secretmanager.secretAccessor',
  'roles/logging.viewer',
  'roles/monitoring.viewer',
] as const;

// ── Command preview builders ──────────────────────────────────────────────────

export interface ComputeCreateOptions {
  name: string;
  machineType: string;
  zone: string;
  imageFamily: string;
}

export function buildComputeCreateCommand(opts: ComputeCreateOptions): string {
  return `gcloud compute instances create ${opts.name} --machine-type=${opts.machineType} --zone=${opts.zone} --image-family=${opts.imageFamily}`;
}

export interface FunctionDeployOptions {
  name: string;
  runtime: string;
  entryPoint: string;
  trigger: string;
  region: string;
}

export function buildFunctionDeployCommand(opts: FunctionDeployOptions): string {
  return `gcloud functions deploy ${opts.name} --runtime=${opts.runtime} --entry-point=${opts.entryPoint} --trigger-${opts.trigger} --region=${opts.region}`;
}

export interface RunDeployOptions {
  serviceName: string;
  image: string;
  region: string;
  allowUnauthenticated: boolean;
}

export function buildRunDeployCommand(opts: RunDeployOptions): string {
  const auth = opts.allowUnauthenticated ? '--allow-unauthenticated' : '--no-allow-unauthenticated';
  return `gcloud run deploy ${opts.serviceName} --image=${opts.image} --region=${opts.region} ${auth}`;
}
