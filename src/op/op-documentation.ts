/**
 * op (1Password CLI) documentation
 * Quick-reference content shown in the Docs tab.
 */

export interface DocSection {
  title: string;
  content: string;
}

export interface OpManPage {
  name: string;
  synopsis: string;
  description: string;
  sections: DocSection[];
  examples: Array<{ command: string; description: string }>;
}

export function getOpManPage(): OpManPage {
  return {
    name: 'op — 1Password CLI',
    synopsis: 'op [command] [subcommand] [flags]',
    description:
      '1Password CLI (op) lets you manage 1Password vaults, items, and secrets from the terminal. ' +
      'It supports signing in/out, listing accounts and vaults, CRUD on items and documents, ' +
      'reading secret references (op://Vault/Item/Field), injecting secrets into processes or config files, ' +
      'and managing service accounts and shell plugins.',

    sections: [
      {
        title: 'Authentication',
        content: [
          'op signin              Sign in to 1Password (opens browser or uses app integration)',
          'op signout             Sign out of the current account',
          'op signout --all       Sign out of all accounts',
          'op whoami              Show currently signed-in account info',
          '',
          'If 1Password app integration is enabled, op uses biometrics automatically.',
          'Without integration, use --session <token> with the token from op signin.',
        ].join('\n'),
      },
      {
        title: 'Accounts',
        content: [
          'op account list        List all locally configured accounts',
          'op account get         Show details for the current account',
          'op account add         Add a new account to sign in',
          'op account forget      Remove an account from local config',
        ].join('\n'),
      },
      {
        title: 'Vaults',
        content: [
          'op vault list          List all vaults',
          'op vault get <vault>   Get details about a vault',
          'op vault create <name> Create a new vault',
          'op vault delete <vault> Delete a vault (irreversible)',
        ].join('\n'),
      },
      {
        title: 'Items',
        content: [
          'op item list [--vault <v>] [--categories <c>] [--tags <t>]',
          '  List items, optionally filtered',
          '',
          'op item get <item> [--vault <v>] [--fields <f>]',
          '  Get item details or specific fields',
          '',
          'op item get <item> --otp',
          '  Get the one-time password for a TOTP item',
          '',
          'op item create --category Login --title "My Site" [fields...]',
          '  Create a new item',
          '',
          'op item edit <item> [field=value...]',
          '  Edit an item',
          '',
          'op item delete <item> [--archive]',
          '  Delete (or archive) an item',
        ].join('\n'),
      },
      {
        title: 'Documents',
        content: [
          'op document list [--vault <v>]',
          '  List document items',
          '',
          'op document get <item> [--out-file <path>]',
          '  Download a document to stdout or a file',
          '',
          'op document create <file> --title "My Doc" --vault <v>',
          '  Upload a file as a document item',
        ].join('\n'),
      },
      {
        title: 'Secret References (op://)',
        content: [
          'Secret references have the format:',
          '  op://Vault/Item/Field',
          '',
          'Examples:',
          '  op://Production/Database/password',
          '  op://Dev/API/key',
          '  op://app-prod/db/one-time password?attribute=otp',
          '',
          'op read op://Vault/Item/Field',
          '  Read the secret value to stdout (use with care — never log secrets)',
          '',
          'op read --out-file ./key.pem op://Vault/SSH/private-key',
          '  Save secret to a file',
        ].join('\n'),
      },
      {
        title: 'Run & Inject',
        content: [
          'op run -- <command>',
          '  Run a command with secrets from environment variables that are op:// references.',
          '  Secrets are masked in output by default.',
          '',
          'op run --env-file .env -- <command>',
          '  Load references from a dotenv file before running the command.',
          '',
          'op inject -i config.tpl -o config.yml',
          '  Render a config template that contains {{ op://... }} placeholders.',
          '',
          'op inject < config.tpl',
          '  Read template from stdin, write resolved config to stdout.',
        ].join('\n'),
      },
      {
        title: 'Service Accounts',
        content: [
          'Service accounts let non-interactive processes access 1Password.',
          '',
          'op service-account create "CI/CD" --vaults vault-id[:permission]',
          '  Create a service account and print its token (shown once only).',
          '',
          'op service-account ratelimit',
          '  Check API rate limit usage for the current service account.',
          '',
          'Set OP_SERVICE_ACCOUNT_TOKEN=<token> or use --session <token> to authenticate.',
        ].join('\n'),
      },
      {
        title: 'Shell Plugins',
        content: [
          'Shell plugins let you authenticate 3rd-party CLIs (AWS, GitHub, etc.) with 1Password.',
          '',
          'op plugin list            List all available plugins',
          'op plugin init <plugin>   Configure a plugin (e.g. aws, github)',
          'op plugin inspect         Show configured plugins on this machine',
          'op plugin clear           Remove all plugin configurations',
          '',
          'After setup, run the CLI normally and op will inject credentials via biometrics.',
        ].join('\n'),
      },
    ],

    examples: [
      {
        command: 'op whoami --format json',
        description: 'Check currently signed-in account as JSON',
      },
      {
        command: 'op vault list --format json',
        description: 'List all vaults in JSON format',
      },
      {
        command: 'op item list --vault Production --format json',
        description: 'List items in the Production vault',
      },
      {
        command: 'op item get "Database Prod" --vault Production --format json',
        description: 'Get all fields of an item',
      },
      {
        command: 'op item get Netflix --otp',
        description: 'Get the current TOTP code for Netflix',
      },
      {
        command: 'op read op://Production/Database/password',
        description: 'Read the password field (outputs secret — use carefully)',
      },
      {
        command: 'op run --env-file .env -- node server.js',
        description: 'Inject secrets into a Node process via .env references',
      },
      {
        command: 'op inject -i config.yml.tpl -o config.yml',
        description: 'Render a config template with real secrets',
      },
      {
        command: 'op service-account create "CI" --vaults vault-uuid:read_items',
        description: 'Create a read-only service account for CI',
      },
      {
        command: 'op plugin init aws',
        description: 'Configure 1Password to manage AWS CLI credentials',
      },
    ],
  };
}
