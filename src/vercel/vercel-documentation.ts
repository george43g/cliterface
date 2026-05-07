/**
 * Vercel CLI documentation reference
 * Inline docs for the GUI's Docs tab (no network calls, no dynamic imports)
 */

export interface DocSection {
  title: string;
  content: string;
}

export interface DocPage {
  name: string;
  synopsis: string;
  description: string;
  sections: DocSection[];
  examples: { command: string; description: string }[];
}

export function getVercelManPage(): DocPage {
  return {
    name: 'vercel — Vercel CLI',
    synopsis: 'vercel [options] <command | path>',
    description:
      'The Vercel CLI deploys projects to Vercel and manages environments, domains, teams, and more. ' +
      'By default, running `vercel` in a project directory performs a preview deployment. ' +
      'Add `--prod` to target production.',
    sections: [
      {
        title: 'Auth',
        content:
          'vercel login [email]    Log in (opens browser OAuth or email magic-link)\n' +
          'vercel logout           Log out of the current session\n' +
          'vercel whoami           Print the authenticated username / team slug',
      },
      {
        title: 'Linking',
        content:
          'vercel link             Link the current directory to a Vercel project\n' +
          'vercel unlink           Remove the .vercel/ link\n' +
          'vercel pull             Pull project settings & env vars from the cloud',
      },
      {
        title: 'Deploy',
        content:
          'vercel                  Preview deploy (default)\n' +
          'vercel --prod           Production deploy\n' +
          'vercel build            Build locally into .vercel/output\n' +
          'vercel deploy --prebuilt  Deploy a prebuilt .vercel/output directory\n' +
          'vercel redeploy <id>    Rebuild a previous deployment\n' +
          'vercel promote <id>     Promote a preview to production\n' +
          'vercel rollback [id]    Roll back to a previous production deployment\n' +
          'vercel rm <id>          Remove a deployment',
      },
      {
        title: 'Deployments List & Inspect',
        content: 'vercel ls [project]     List recent deployments\n' + 'vercel inspect <id>     Show deployment details',
      },
      {
        title: 'Environment Variables',
        content:
          'vercel env list [env]          List env vars (production|preview|development)\n' +
          'vercel env add <name> <env>    Add an env var (prompts for value)\n' +
          'vercel env pull [file]         Pull dev env vars to a local file\n' +
          'vercel env remove <name> [env] Remove an env var',
      },
      {
        title: 'Domains',
        content:
          'vercel domains list             List all domains\n' +
          'vercel domains inspect <domain> Show domain details\n' +
          'vercel domains add <d> <proj>   Add a domain to a project\n' +
          'vercel domains remove <domain>  Remove a domain\n' +
          'vercel domains buy <domain>     Purchase a domain',
      },
      {
        title: 'Logs',
        content:
          'vercel logs <id|url>        Show runtime logs\n' +
          '  --follow (-f)             Stream live logs\n' +
          '  --level <level>           Filter: error|warning|info|fatal\n' +
          '  --limit <n>               Max results (default 100)\n' +
          '  --query <q>               Advanced filter syntax',
      },
      {
        title: 'Teams',
        content:
          'vercel teams list           List teams you belong to\n' +
          'vercel teams add [name]     Create a new team\n' +
          'vercel teams invite <email> Invite a member\n' +
          'vercel teams switch [slug]  Switch active team scope\n' +
          'vercel teams members        List members of the current team',
      },
      {
        title: 'Projects',
        content:
          'vercel project list         List projects in the current scope\n' +
          'vercel project inspect [n]  Show project details\n' +
          'vercel project add <name>   Create a new project\n' +
          'vercel project remove <n>   Delete a project',
      },
    ],
    examples: [
      { command: 'vercel', description: 'Preview-deploy the current directory' },
      { command: 'vercel --prod', description: 'Production deploy' },
      { command: 'vercel build && vercel deploy --prebuilt', description: 'Build locally then deploy' },
      { command: 'vercel rollback', description: 'Instantly revert to previous production' },
      { command: 'vercel env pull .env.local', description: 'Pull dev env vars to file' },
      { command: 'vercel logs <id> --follow', description: 'Stream live runtime logs' },
      { command: 'vercel domains add example.com my-project', description: 'Attach a domain to a project' },
      { command: 'vercel teams switch my-org', description: 'Switch to a different team scope' },
    ],
  };
}
