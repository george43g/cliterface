/**
 * Firebase CLI documentation — inline reference content
 */

export interface ManSection {
  title: string;
  content: string;
}

export interface ManPage {
  name: string;
  synopsis: string;
  description: string;
  sections: ManSection[];
  examples: { command: string; description: string }[];
}

export function getFirebaseManPage(): ManPage {
  return {
    name: 'firebase — Firebase CLI',
    synopsis: 'firebase [options] [command]',
    description:
      'The Firebase CLI lets you manage, view, and deploy to your Firebase projects from the command line. It wraps the Firebase REST APIs and provides helpers for local development via the Firebase Local Emulator Suite.',
    sections: [
      {
        title: 'Global Options',
        content: `  -P, --project <alias>   Firebase project to use
  --account <email>       Google account for authorization
  -j, --json              Output JSON (enables non-interactive mode)
  --non-interactive       Error instead of prompting
  --debug                 Verbose debug output
  -c, --config <path>     Path to firebase.json`,
      },
      {
        title: 'Auth Commands',
        content: `  firebase login            Log in to Firebase (opens browser)
  firebase login:ci         Generate a CI token (non-interactive)
  firebase logout [email]   Log out of Firebase`,
      },
      {
        title: 'Project Commands',
        content: `  firebase projects:list          List all accessible projects
  firebase use [alias_or_id]      Set active project
  firebase use --add              Add project alias interactively
  firebase use --clear            Clear active project`,
      },
      {
        title: 'Deploy',
        content: `  firebase deploy                           Deploy everything
  firebase deploy --only hosting            Deploy only Hosting
  firebase deploy --only functions          Deploy only Functions
  firebase deploy --only functions:myFunc   Deploy a single function
  firebase deploy --except functions        Deploy all except Functions
  firebase deploy --dry-run                 Validate without deploying
  firebase deploy --message "v2 release"    Tag the deployment`,
      },
      {
        title: 'Emulators',
        content: `  firebase emulators:start                     Start all emulators
  firebase emulators:start --only auth,functions   Start specific emulators
  firebase emulators:start --import ./data         Import saved data
  firebase emulators:exec <script>                 Run script with emulators`,
      },
      {
        title: 'Functions',
        content: `  firebase functions:list              List deployed functions
  firebase functions:log               View function logs
  firebase functions:log --only fn1    View logs for a specific function
  firebase functions:log --lines 50    Fetch last 50 log lines`,
      },
      {
        title: 'Firestore',
        content: `  firebase firestore:indexes                List Firestore indexes
  firebase firestore:databases:list         List Firestore databases
  firebase firestore:delete /path           Delete a document/collection
  firebase firestore:delete /path -r        Recursively delete`,
      },
      {
        title: 'Hosting Channels',
        content: `  firebase hosting:channel:list             List preview channels
  firebase hosting:channel:create <id>      Create a preview channel
  firebase hosting:channel:deploy <id>      Deploy to a preview channel
  firebase hosting:sites:list               List all hosting sites`,
      },
      {
        title: 'Extensions',
        content: `  firebase ext:list           List installed extensions
  firebase ext:install <id>   Install an extension`,
      },
      {
        title: 'App Hosting',
        content: `  firebase apphosting:backends:list          List App Hosting backends
  firebase apphosting:backends:create        Create a backend
  firebase apphosting:backends:delete <id>   Delete a backend`,
      },
    ],
    examples: [
      { command: 'firebase login', description: 'Authenticate with Google' },
      { command: 'firebase projects:list', description: 'List all Firebase projects' },
      { command: 'firebase use my-project-id', description: 'Switch to a project' },
      { command: 'firebase deploy --only hosting', description: 'Deploy static site only' },
      { command: 'firebase deploy --only functions:api', description: 'Deploy one function' },
      { command: 'firebase emulators:start --only firestore,auth', description: 'Start specific emulators' },
      { command: 'firebase functions:log --lines 100', description: 'View last 100 log lines' },
      { command: 'firebase hosting:channel:deploy preview', description: 'Deploy to preview channel' },
      { command: 'firebase ext:list', description: 'List installed extensions' },
    ],
  };
}
