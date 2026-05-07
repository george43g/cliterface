/**
 * Inline documentation for the `skills` CLI (npx skills v1.5.5)
 * Source: https://skills.sh/ and `npx skills --help`
 */

export interface DocSection {
  title: string;
  content: string;
}

export interface ManPage {
  name: string;
  synopsis: string;
  description: string;
  sections: DocSection[];
  examples: { command: string; description: string }[];
}

export function getNpxSkillsManPage(): ManPage {
  return {
    name: 'skills — Reusable AI agent skills manager',
    synopsis: 'npx skills <command> [options]',
    description:
      'The `skills` CLI manages reusable AI agent skill packages. ' +
      'Skills are small prompt/instruction bundles that teach AI coding agents (Claude Code, Cursor, Copilot, etc.) ' +
      'new capabilities. They live in agent-specific directories and are activated automatically by the agent harness.',
    sections: [
      {
        title: 'Manage Skills',
        content: [
          'add <package>        Add a skill package (alias: a)',
          '                     e.g. vercel-labs/agent-skills',
          '                          https://github.com/vercel-labs/agent-skills',
          'remove [skills]      Remove installed skills',
          'list, ls             List installed skills',
          'find [query]         Search for skills interactively',
        ].join('\n'),
      },
      {
        title: 'Updates',
        content: [
          'update [skills...]   Update skills to latest versions (alias: upgrade)',
          '',
          'Options:',
          '  -g, --global           Update global skills only',
          '  -p, --project          Update project skills only',
          '  -y, --yes              Skip scope prompt',
        ].join('\n'),
      },
      {
        title: 'Project Utilities',
        content: [
          'experimental_install Restore skills from skills-lock.json',
          'init [name]          Initialize a new skill (creates SKILL.md)',
          'experimental_sync    Sync skills from node_modules into agent directories',
        ].join('\n'),
      },
      {
        title: 'Common Flags',
        content: [
          '-g, --global           Apply to global (user-level) scope',
          '-a, --agent <agents>   Specify one or more agents (e.g. claude-code cursor)',
          '-s, --skill <skills>   Specify skill names to install',
          '-y, --yes              Skip confirmation prompts',
          '--copy                 Copy files instead of symlinking',
          "--all                  Shorthand for --skill '*' --agent '*' -y",
          '--json                 Output as JSON (ls only)',
          '--version, -v          Show version number',
        ].join('\n'),
      },
    ],
    examples: [
      { command: 'npx skills add vercel-labs/agent-skills', description: 'Install a GitHub-hosted skill package' },
      { command: 'npx skills add vercel-labs/agent-skills -g', description: 'Install globally for all projects' },
      { command: 'npx skills add vercel-labs/agent-skills -a claude-code cursor', description: 'Install for specific agents' },
      { command: 'npx skills add my-skills --all', description: 'Install all skills for all agents, skip prompts' },
      { command: 'npx skills list', description: 'List project-level installed skills' },
      { command: 'npx skills ls -g', description: 'List global skills' },
      { command: 'npx skills ls -a claude-code --json', description: 'List Claude Code skills as JSON' },
      { command: 'npx skills find typescript', description: 'Search registry for TypeScript-related skills' },
      { command: 'npx skills remove web-design', description: 'Remove a skill by name' },
      { command: 'npx skills remove -g --all', description: 'Remove all global skills (destructive)' },
      { command: 'npx skills update', description: 'Update all project skills' },
      { command: 'npx skills update -g', description: 'Update global skills' },
      { command: 'npx skills init my-skill', description: 'Scaffold a new skill package' },
      { command: 'npx skills experimental_install', description: 'Restore skills from skills-lock.json' },
      { command: 'npx skills experimental_sync -y', description: 'Sync from node_modules without prompts' },
    ],
  };
}

export const KNOWN_AGENTS = ['claude-code', 'cursor', 'copilot', 'windsurf', 'aider', 'continue', 'cline', 'zed'];
