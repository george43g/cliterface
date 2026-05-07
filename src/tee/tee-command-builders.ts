import { z } from 'zod';

/**
 * tee command builders
 * Construct tee command lines with validation
 */

// ── Zod schemas ─────────────────────────────────────────────────────────────

export const OutputFileSchema = z.object({
  path: z
    .string()
    .min(1, 'Path cannot be empty')
    .max(4096, 'Path too long')
    .refine(p => !p.includes('\0'), 'Path must not contain null bytes')
    .refine(p => p.trim().length > 0, 'Path cannot be only whitespace'),
  append: z.boolean().default(false),
});

export type OutputFile = z.infer<typeof OutputFileSchema>;

export const TeeCommandSchema = z.object({
  inputCmd: z.string().default(''),
  outputFiles: z.array(OutputFileSchema).max(16, 'Max 16 output files'),
  appendAll: z.boolean().default(false),
  ignoreInterrupt: z.boolean().default(false),
});

export type TeeCommand = z.infer<typeof TeeCommandSchema>;

// ── Validation helpers ───────────────────────────────────────────────────────

export function validateOutputPath(path: string): { valid: boolean; error?: string } {
  const result = OutputFileSchema.shape.path.safeParse(path);
  if (result.success) return { valid: true };
  return { valid: false, error: result.error.issues[0]?.message };
}

export function validateTeeCommand(cmd: TeeCommand): { valid: boolean; errors: string[] } {
  const result = TeeCommandSchema.safeParse(cmd);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map(i => i.message),
  };
}

// ── Command builder ──────────────────────────────────────────────────────────

export function buildTeeCommandString(cmd: TeeCommand): string {
  const teeParts: string[] = ['tee'];

  if (cmd.appendAll) teeParts.push('-a');
  if (cmd.ignoreInterrupt) teeParts.push('-i');

  const validFiles = cmd.outputFiles.filter(f => f.path.trim().length > 0);
  for (const f of validFiles) {
    const p = f.path.trim();
    teeParts.push(p.includes(' ') ? `"${p}"` : p);
  }

  const teeStr = teeParts.join(' ');
  return cmd.inputCmd.trim() ? `${cmd.inputCmd.trim()} | ${teeStr}` : teeStr;
}

// ── Pattern definitions ──────────────────────────────────────────────────────

export interface TeePattern {
  id: string;
  name: string;
  description: string;
  command: string;
  explanation: string;
  category: 'sudo' | 'logging' | 'split' | 'debug';
}

export const TEE_PATTERNS: TeePattern[] = [
  {
    id: 'sudo-write',
    name: 'sudo tee: Write privileged file',
    description: 'Write content to a root-owned file using the sudo tee idiom',
    command: 'echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf',
    explanation: 'Shell redirection (>) runs as your user, so "sudo echo > /etc/file" fails. ' + 'sudo tee solves this: tee runs as root and does the write.',
    category: 'sudo',
  },
  {
    id: 'sudo-append',
    name: 'sudo tee -a: Append to privileged file',
    description: 'Safely append a line to a root-owned config file',
    command: 'echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf',
    explanation: '-a (append) preserves existing file contents. Without -a, tee overwrites the file completely — dangerous for config files.',
    category: 'sudo',
  },
  {
    id: 'log-and-console',
    name: 'Log + console (append mode)',
    description: 'Run a command, log all output to a file, and still see it on screen',
    command: 'make 2>&1 | tee -a build.log',
    explanation: '2>&1 merges stderr into stdout before tee sees it, capturing both streams. ' + '-a ensures previous build logs are preserved.',
    category: 'logging',
  },
  {
    id: 'tail-and-filter',
    name: 'Follow log, save copy, filter terminal',
    description: 'Watch a live log file, save everything, show only errors on screen',
    command: 'tail -f /var/log/app.log | tee -a app-copy.log | grep --line-buffered ERROR',
    explanation: 'tee saves the full stream to app-copy.log, then pipes everything to grep. ' + '--line-buffered prevents grep from buffering output in a live tail.',
    category: 'logging',
  },
  {
    id: 'multi-file-split',
    name: 'Multi-file split',
    description: 'Send one stream to multiple files simultaneously',
    command: 'curl -s https://api.example.com/data | tee raw.json backup.json | jq .',
    explanation: 'Both raw.json and backup.json receive the full API response. ' + 'The pipeline continues to jq for pretty-printing on screen.',
    category: 'split',
  },
  {
    id: 'debug-pipeline',
    name: 'Debug pipeline step',
    description: 'Inspect intermediate pipeline data without breaking the pipeline',
    command: "cat data.csv | tee /tmp/step1.csv | awk -F, '{print $2}' | tee /tmp/step2.txt | sort",
    explanation: 'Insert tee at any pipeline stage to capture intermediate data for debugging. ' + 'The pipeline continues normally — tee is transparent to the flow.',
    category: 'debug',
  },
  {
    id: 'silent-copy',
    name: 'Silent file copy (no terminal output)',
    description: 'Save to file but suppress terminal output',
    command: 'cmd | tee output.log > /dev/null',
    explanation: 'Redirect stdout to /dev/null after tee. tee has already written to the file, ' + 'but the terminal gets nothing. Useful in scripts.',
    category: 'split',
  },
];

// ── Category grouping ────────────────────────────────────────────────────────

export const PATTERN_CATEGORIES = [
  { id: 'sudo', label: 'sudo tee Idiom', icon: '🔑' },
  { id: 'logging', label: 'Logging', icon: '📝' },
  { id: 'split', label: 'Multi-output / Split', icon: '🔀' },
  { id: 'debug', label: 'Pipeline Debug', icon: '🔍' },
] as const;
