/**
 * npm command builder helpers and preset data
 */

export const NPM_SCRIPT_PRESETS = [
  { name: 'start', description: 'Start the application' },
  { name: 'build', description: 'Build for production' },
  { name: 'test', description: 'Run tests' },
  { name: 'lint', description: 'Run linter' },
  { name: 'format', description: 'Format code' },
  { name: 'dev', description: 'Start development server' },
  { name: 'preview', description: 'Preview production build' },
  { name: 'typecheck', description: 'Type check TypeScript' },
];

export const NPM_COMMON_PACKAGES = [
  { name: 'typescript', description: 'TypeScript compiler', dev: true },
  { name: 'eslint', description: 'JavaScript linter', dev: true },
  { name: 'prettier', description: 'Code formatter', dev: true },
  { name: 'vitest', description: 'Vite-native test framework', dev: true },
  { name: 'vite', description: 'Build tool and dev server', dev: true },
  { name: 'react', description: 'UI library' },
  { name: 'next', description: 'React framework' },
  { name: 'zod', description: 'Schema validation' },
  { name: 'tailwindcss', description: 'Utility CSS framework', dev: true },
  { name: '@types/node', description: 'Node.js type definitions', dev: true },
];

export const PACKAGE_SPEC_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[\w.^~-]+)?$/i;

export function validatePackageSpec(spec: string): { valid: boolean; error?: string } {
  if (!spec.trim()) return { valid: false, error: 'Package name cannot be empty' };
  const parts = spec.trim().split(/\s+/);
  const invalid = parts.find(p => !PACKAGE_SPEC_REGEX.test(p));
  if (invalid) return { valid: false, error: `Invalid package spec: ${invalid}` };
  return { valid: true };
}

export function formatPackageList(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}
