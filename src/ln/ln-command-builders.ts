import { z } from 'zod';
import type { LnCommandOptions } from './ln-service';
import { buildLnCommand } from './ln-service';

/**
 * Zod schema for validating ln inputs
 */
export const LnInputSchema = z.object({
  source: z
    .string()
    .min(1, 'Source path is required')
    .refine(s => !s.includes('\0'), 'Path must not contain null bytes'),
  target: z
    .string()
    .min(1, 'Target (link name/path) is required')
    .refine(s => !s.includes('\0'), 'Path must not contain null bytes'),
  linkType: z.enum(['symbolic', 'hard']).default('symbolic'),
  force: z.boolean().default(false),
  interactive: z.boolean().default(false),
  noDeref: z.boolean().default(false),
  verbose: z.boolean().default(false),
  physical: z.boolean().default(false),
});

export type LnInput = z.infer<typeof LnInputSchema>;

export interface LnValidationOk {
  success: true;
  data: LnInput;
}

export interface LnValidationFail {
  success: false;
  errors: string[];
}

export type LnValidationResult = LnValidationOk | LnValidationFail;

/**
 * Validate ln inputs and return structured result
 */
export function validateLnInput(raw: unknown): LnValidationOk | LnValidationFail {
  const result = LnInputSchema.safeParse(raw);
  if (result.success) {
    const ok: LnValidationOk = { success: true, data: result.data };
    return ok;
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
  const fail: LnValidationFail = { success: false, errors };
  return fail;
}

/**
 * Build command from validated input
 */
export function buildLnCommandFromInput(input: LnInput): string {
  const opts: LnCommandOptions = {
    source: input.source,
    target: input.target,
    options: {
      linkType: input.linkType,
      force: input.force,
      interactive: input.interactive,
      noDeref: input.noDeref,
      verbose: input.verbose,
      physical: input.physical,
    },
  };
  return buildLnCommand(opts);
}

/**
 * Quick-access preset commands
 */
export interface LnPreset {
  name: string;
  description: string;
  source: string;
  target: string;
  linkType: 'symbolic' | 'hard';
  force?: boolean;
  noDeref?: boolean;
  verbose?: boolean;
}

export const LN_PRESETS: LnPreset[] = [
  {
    name: 'Symlink a binary',
    description: 'Link a versioned binary to a generic name in /usr/local/bin',
    source: '/usr/local/bin/node-v20',
    target: '/usr/local/bin/node',
    linkType: 'symbolic',
  },
  {
    name: 'Link config to dotfiles',
    description: 'Create a symlink from ~/.config to your dotfiles repo',
    source: '~/dotfiles/config',
    target: '~/.config',
    linkType: 'symbolic',
  },
  {
    name: 'Replace symlink (safe)',
    description: 'Atomically replace an existing symlink without following it',
    source: '/new/target',
    target: '/existing/link',
    linkType: 'symbolic',
    force: true,
    noDeref: true,
  },
  {
    name: 'Hard link a file',
    description: 'Create a hard link — both names share the same inode',
    source: '/data/archive/2024-01.log',
    target: '/data/current/latest.log',
    linkType: 'hard',
  },
];
