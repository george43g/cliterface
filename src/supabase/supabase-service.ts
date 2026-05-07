import { z } from 'zod';

export { type CommandResult, executeCommand } from '../utils/execute-command';
import { type CommandResult, executeCommand } from '../utils/execute-command';

// ── Zod validators ──────────────────────────────────────────────────────────

/** Supabase project refs are exactly 20 lowercase alphanumeric characters */
export const ProjectRefSchema = z.string().regex(/^[a-z0-9]{20}$/, 'Project ref must be exactly 20 lowercase alphanumeric characters');

export type ProjectRef = z.infer<typeof ProjectRefSchema>;

export const RegionSchema = z.enum([
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'sa-east-1',
  'ca-central-1',
]);

export type Region = z.infer<typeof RegionSchema>;

export const REGIONS: Region[] = RegionSchema.options;

// ── Auth ───────────────────────────────────────────────────────────────────

export const supabaseAuth = {
  async login(token?: string): Promise<CommandResult> {
    const tokenFlag = token ? ` --token ${token}` : '';
    return executeCommand(`supabase login${tokenFlag}`);
  },

  async logout(): Promise<CommandResult> {
    return executeCommand('supabase logout');
  },
};

// ── Projects ───────────────────────────────────────────────────────────────

export const supabaseProjects = {
  async list(output: 'pretty' | 'json' = 'json'): Promise<CommandResult> {
    return executeCommand(`supabase projects list --output ${output}`);
  },

  async create(name: string, orgId: string, dbPassword: string, region: Region): Promise<CommandResult> {
    return executeCommand(`supabase projects create "${name}" --org-id ${orgId} --db-password "${dbPassword}" --region ${region}`);
  },

  async apiKeys(projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase projects api-keys --project-ref ${projectRef}`);
  },
};

// ── Orgs ───────────────────────────────────────────────────────────────────

export const supabaseOrgs = {
  async list(output: 'pretty' | 'json' = 'json'): Promise<CommandResult> {
    return executeCommand(`supabase orgs list --output ${output}`);
  },

  async create(name: string): Promise<CommandResult> {
    return executeCommand(`supabase orgs create "${name}"`);
  },
};

// ── Local Dev ──────────────────────────────────────────────────────────────

export const supabaseLocal = {
  async init(): Promise<CommandResult> {
    return executeCommand('supabase init');
  },

  async link(projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase link --project-ref ${projectRef}`);
  },

  async unlink(): Promise<CommandResult> {
    return executeCommand('supabase unlink');
  },

  async start(): Promise<CommandResult> {
    return executeCommand('supabase start');
  },

  async stop(backup = false): Promise<CommandResult> {
    return executeCommand(`supabase stop${backup ? ' --backup' : ''}`);
  },

  async status(output: 'pretty' | 'json' = 'pretty'): Promise<CommandResult> {
    return executeCommand(`supabase status --output ${output}`);
  },
};

// ── DB ─────────────────────────────────────────────────────────────────────

export const supabaseDb = {
  async push(dryRun = false): Promise<CommandResult> {
    return executeCommand(`supabase db push${dryRun ? ' --dry-run' : ''}`);
  },

  async pull(schema = ''): Promise<CommandResult> {
    return executeCommand(`supabase db pull${schema ? ` --schema ${schema}` : ''}`);
  },

  async diff(schema = '', file = ''): Promise<CommandResult> {
    const fileFlag = file ? ` --file ${file}` : '';
    const schemaFlag = schema ? ` --schema ${schema}` : '';
    return executeCommand(`supabase db diff${schemaFlag}${fileFlag}`);
  },

  async reset(): Promise<CommandResult> {
    return executeCommand('supabase db reset');
  },

  async dump(dataOnly = false, schema = ''): Promise<CommandResult> {
    const dataFlag = dataOnly ? ' --data-only' : '';
    const schemaFlag = schema ? ` --schema ${schema}` : '';
    return executeCommand(`supabase db dump${dataFlag}${schemaFlag}`);
  },

  async lint(level: 'warning' | 'error' = 'warning'): Promise<CommandResult> {
    return executeCommand(`supabase db lint --level ${level}`);
  },

  async query(sql: string): Promise<CommandResult> {
    return executeCommand(`supabase db query "${sql.replace(/"/g, '\\"')}"`);
  },
};

// ── Migrations ─────────────────────────────────────────────────────────────

export const supabaseMigration = {
  async list(output: 'pretty' | 'json' = 'pretty'): Promise<CommandResult> {
    return executeCommand(`supabase migration list --output ${output}`);
  },

  async newMigration(name: string): Promise<CommandResult> {
    return executeCommand(`supabase migration new "${name}"`);
  },

  async up(): Promise<CommandResult> {
    return executeCommand('supabase migration up');
  },

  async repair(version: string, status: 'applied' | 'reverted'): Promise<CommandResult> {
    return executeCommand(`supabase migration repair ${version} --status ${status}`);
  },

  async squash(version = ''): Promise<CommandResult> {
    return executeCommand(`supabase migration squash${version ? ` --version ${version}` : ''}`);
  },
};

// ── Gen (Type generation) ──────────────────────────────────────────────────

export const supabaseGen = {
  async types(projectRef: string, schema = 'public', lang: 'typescript' = 'typescript'): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase gen types ${lang} --project-id ${projectRef} --schema ${schema}`);
  },

  async typesLocal(schema = 'public', lang: 'typescript' = 'typescript'): Promise<CommandResult> {
    return executeCommand(`supabase gen types ${lang} --local --schema ${schema}`);
  },
};

// ── Functions ──────────────────────────────────────────────────────────────

export const supabaseFunctions = {
  async list(projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase functions list --project-ref ${projectRef}`);
  },

  async newFunction(name: string): Promise<CommandResult> {
    return executeCommand(`supabase functions new ${name}`);
  },

  async serve(name = '', envFile = ''): Promise<CommandResult> {
    const envFlag = envFile ? ` --env-file ${envFile}` : '';
    return executeCommand(`supabase functions serve${name ? ` ${name}` : ''}${envFlag}`);
  },

  async deploy(name: string, projectRef: string, noVerifyJwt = false): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    const jwtFlag = noVerifyJwt ? ' --no-verify-jwt' : '';
    return executeCommand(`supabase functions deploy ${name} --project-ref ${projectRef}${jwtFlag}`);
  },

  async delete(name: string, projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase functions delete ${name} --project-ref ${projectRef}`);
  },

  async download(name: string, projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase functions download ${name} --project-ref ${projectRef}`);
  },
};

// ── Secrets ────────────────────────────────────────────────────────────────

export const supabaseSecrets = {
  async list(projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase secrets list --project-ref ${projectRef}`);
  },

  async set(projectRef: string, pairs: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase secrets set --project-ref ${projectRef} ${pairs}`);
  },

  async unset(projectRef: string, names: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase secrets unset --project-ref ${projectRef} ${names}`);
  },
};

// ── Branches ───────────────────────────────────────────────────────────────

export const supabaseBranches = {
  async list(projectRef: string, output: 'pretty' | 'json' = 'pretty'): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase branches list --project-ref ${projectRef} --output ${output}`);
  },

  async create(projectRef: string, name: string, region?: Region): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    const regionFlag = region ? ` --region ${region}` : '';
    return executeCommand(`supabase branches create ${name} --project-ref ${projectRef}${regionFlag}`);
  },

  async get(branchId: string, projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase branches get ${branchId} --project-ref ${projectRef}`);
  },

  async deleteBranch(branchId: string, projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase branches delete ${branchId} --project-ref ${projectRef}`);
  },

  async pause(branchId: string, projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase branches pause ${branchId} --project-ref ${projectRef}`);
  },

  async unpause(branchId: string, projectRef: string): Promise<CommandResult> {
    ProjectRefSchema.parse(projectRef);
    return executeCommand(`supabase branches unpause ${branchId} --project-ref ${projectRef}`);
  },
};
