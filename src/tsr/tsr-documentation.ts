/**
 * tsr (ts-remove-unused) documentation
 * Source: https://github.com/line/ts-remove-unused
 */

export interface TsrManPage {
  name: string;
  synopsis: string;
  description: string;
  sections: Array<{ title: string; content: string }>;
  examples: Array<{ command: string; description: string }>;
}

export function getTsrManPage(): TsrManPage {
  return {
    name: 'tsr — TypeScript dead-code remover',
    synopsis: 'tsr [options] <entryPoint...>',
    description:
      'tsr (ts-remove-unused) statically analyses a TypeScript project and removes exports, ' +
      'declarations, and files that are not reachable from the specified entry points. ' +
      'By default it runs in dry-run mode and only reports unused code. ' +
      'Pass --write to apply changes to disk.',
    sections: [
      {
        title: 'OPTIONS',
        content: [
          '-p, --project <file>   Path to tsconfig.json (default: tsconfig.json in cwd)',
          '-w, --write            Write changes in place (DESTRUCTIVE — commit first!)',
          '-r, --recursive        Run multiple passes until the project is fully clean',
          '    --include-d-ts     Also check .d.ts declaration files for unused exports',
          '-h, --help             Display help',
          '-v, --version          Display version',
        ].join('\n'),
      },
      {
        title: 'ENTRY POINTS',
        content: [
          'Entry points are JavaScript regular expression patterns (as strings).',
          'Files matched by a pattern are treated as roots — their exports are never removed.',
          '',
          'Examples:',
          "  'src/index\\.ts$'         Single entry file",
          "  'src/pages/.*\\.tsx$'     All page components",
          "  'src/(main|server)\\.ts$' Multiple roots via alternation",
        ].join('\n'),
      },
      {
        title: 'SAFETY NOTES',
        content: [
          '• --write permanently modifies your source files.',
          '  Always commit / snapshot your project before applying.',
          '• --recursive can cascade: removing one export may reveal more.',
          '  Run scan first to understand the full impact.',
          '• Test files should be listed as entry points if you want them kept.',
          '• Dynamic imports and string-based require() calls are not tracked.',
        ].join('\n'),
      },
    ],
    examples: [
      {
        command: "tsr 'src/main\\.ts$'",
        description: 'Scan — report unused code reachable from src/main.ts',
      },
      {
        command: "tsr --write 'src/main\\.ts$'",
        description: 'Apply — remove unused code (destructive)',
      },
      {
        command: "tsr --recursive 'src/main\\.ts$'",
        description: 'Scan with multiple passes until project is clean',
      },
      {
        command: "tsr --write --recursive 'src/main\\.ts$'",
        description: 'Apply recursively until no unused code remains',
      },
      {
        command: "tsr --project tsconfig.app.json 'src/index\\.ts$'",
        description: 'Use a custom tsconfig',
      },
      {
        command: "tsr --include-d-ts 'src/index\\.ts$'",
        description: 'Also check .d.ts declaration files',
      },
      {
        command: "tsr 'src/pages/.*\\.tsx$' 'src/api/.*\\.ts$'",
        description: 'Multiple entry point patterns',
      },
    ],
  };
}

export const tsrEntryPointPresets = [
  {
    label: 'Single entry (src/index.ts)',
    pattern: 'src/index\\.ts$',
    description: 'Standard single-entry project',
  },
  {
    label: 'Single entry (src/main.ts)',
    pattern: 'src/main\\.ts$',
    description: 'Vite / webpack typical main file',
  },
  {
    label: 'Next.js pages',
    pattern: 'src/pages/.*\\.tsx?$',
    description: 'All files under src/pages/',
  },
  {
    label: 'Next.js app router',
    pattern: 'src/app/.*\\.(page|layout|route|loading|error)\\.tsx?$',
    description: 'Next.js App Router special files',
  },
  {
    label: 'Library index',
    pattern: 'src/index\\.ts$',
    description: 'Library with a barrel index',
  },
  {
    label: 'All test files',
    pattern: '\\.(test|spec)\\.(ts|tsx)$',
    description: 'Keep test files as roots (not deleted)',
  },
  {
    label: 'Custom pattern',
    pattern: '',
    description: 'Enter your own regex pattern',
  },
];
