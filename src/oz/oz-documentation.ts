/**
 * oz-documentation.ts
 * Inline reference for the oz CLI, sourced from:
 *   https://docs.warp.dev/reference/cli/cli
 *   https://docs.warp.dev/reference/cli/quickstart
 *   https://docs.warp.dev/agent-platform/cloud-agents/self-hosting
 */

export interface DocSection {
  title: string;
  content: string;
}

export interface OzManPage {
  name: string;
  synopsis: string;
  description: string;
  sections: DocSection[];
  examples: { command: string; description: string }[];
}

export function getOzManPage(): OzManPage {
  return {
    name: 'oz — Warp Cloud Agent CLI',
    synopsis: 'oz <command> [subcommand] [flags]',
    description:
      "oz is the command-line interface for Warp's Oz orchestration platform. It lets you launch AI agents on tasks locally or in the cloud, manage runs, configure environments, and schedule recurring agent jobs. Use WARP_API_KEY for non-interactive / CI authentication.",
    sections: [
      {
        title: 'Authentication',
        content: [
          'oz login',
          '    Interactive browser-based sign-in. Stores credentials locally.',
          '',
          'Environment variable (CI / headless):',
          '    export WARP_API_KEY="wk-..."',
        ].join('\n'),
      },
      {
        title: 'Agent Commands',
        content: [
          'oz agent run --prompt "TEXT" [flags]',
          '    Run an agent locally in the current working directory.',
          '',
          '    -C, --cwd PATH         Working directory for agent execution',
          '    -n, --name NAME        Label / group name for the run',
          '    --share [TARGET]       Enable session sharing; optional access spec',
          '                           e.g. --share user@example.com:view',
          '    --profile ID           Agent profile to apply',
          '    --model MODEL_ID       Override the default model',
          '    --skill SPEC           Use a skill as the base prompt',
          '    --mcp SPEC             Start an MCP server (repeatable)',
          '    -e, --environment ID   Run inside a cloud environment',
          '    -f, --file PATH        Load config from YAML/JSON file',
          '',
          'oz agent run-cloud --environment ID --prompt "TEXT" [flags]',
          '    Dispatch agent task to remote cloud infrastructure.',
          '',
          '    All flags from "agent run" plus:',
          '    --no-environment       Run without an environment',
          '    --open                 Open session in the Warp UI',
          '    --host WORKER_ID       Route to a self-hosted worker',
          '    --computer-use         Enable Computer Use capability',
          '    --attach PATH          Attach image file (max 5, repeatable)',
          '',
          'oz agent list [--repo owner/repo]',
          '    List available skills / agents from environments.',
          '    --repo    Filter by repository (owner/repo format)',
        ].join('\n'),
      },
      {
        title: 'Run Management',
        content: [
          'oz run list [--limit N]',
          '    List recent cloud agent runs (default: 10).',
          '    --limit N   Number of results to return',
          '',
          'oz run get <RUN_ID>',
          '    Retrieve full details for a specific run.',
        ].join('\n'),
      },
      {
        title: 'Environments & Models',
        content: [
          'oz environment list',
          '    Show available environment IDs.',
          '',
          'oz environment image list',
          '    Show suggested base Docker images for cloud environments.',
          '',
          'oz model list',
          '    Display all available AI models.',
        ].join('\n'),
      },
      {
        title: 'Scheduling',
        content: [
          'oz schedule create --name NAME --cron "EXPR" [flags]',
          '    Create a recurring scheduled agent run.',
          '',
          '    --name NAME          Schedule label (required)',
          '    --cron "EXPR"        Standard cron expression (required)',
          '    --prompt "TEXT"      Task prompt for the agent',
          '    --skill SPEC         Use a skill instead of inline prompt',
          '    --environment ID     Target environment',
          '    --host WORKER_ID     Route to a self-hosted worker',
          '',
          'oz schedule update <SCHEDULE_ID> [flags]',
          '    Update an existing schedule (e.g. change --host routing).',
          '    NOTE: "oz schedule update" inferred from self-hosting docs; exact',
          '    flags may differ — confirm with "oz help".',
        ].join('\n'),
      },
      {
        title: 'Session Sharing',
        content: [
          'Pass --share to oz agent run to share the session.',
          '',
          '--share                  Self-access only (generates a tracking link)',
          '--share user@email.com   Read-only access for another user',
          '--share user@email.com:view   Explicit read-only',
          '--share user@email.com:edit   Read/write access',
          '--share team             Team read-only',
          '--share team:edit        Team read/write',
        ].join('\n'),
      },
      {
        title: 'CI / Headless Usage',
        content: [
          'Set WARP_API_KEY instead of running oz login:',
          '    export WARP_API_KEY="wk-..."',
          '    oz agent run-cloud --environment prod --prompt "Run tests"',
          '',
          'GitHub Actions: use the warpdotdev/oz-agent-action action.',
          '    Supported runners: GitHub Actions, Jenkins, Buildkite,',
          '    Kubernetes pods, or any custom orchestrator.',
        ].join('\n'),
      },
    ],
    examples: [
      {
        command: 'oz login',
        description: 'Authenticate interactively via browser',
      },
      {
        command: 'oz agent run --prompt "Summarize this repo"',
        description: 'Run a local agent on the current directory',
      },
      {
        command: 'oz agent run --prompt "Fix lint errors" --share --name "lint-fix"',
        description: 'Run with session sharing and a label',
      },
      {
        command: 'oz agent run-cloud --environment staging --prompt "Run test suite"',
        description: 'Dispatch to a cloud environment',
      },
      {
        command: 'oz agent run-cloud --skill refactor --environment prod --open',
        description: 'Launch a saved skill in production, open in Warp',
      },
      {
        command: 'oz run list --limit 20',
        description: 'Show the 20 most recent runs',
      },
      {
        command: 'oz run get run_abc123',
        description: 'Fetch full details for a specific run',
      },
      {
        command: 'oz environment list',
        description: 'List available environment IDs',
      },
      {
        command: 'oz model list',
        description: 'Show all available AI models',
      },
      {
        command: 'oz schedule create --name "nightly-cleanup" --cron "0 2 * * *" --prompt "Remove dead code" --environment prod',
        description: 'Schedule a nightly agent run',
      },
    ],
  };
}
