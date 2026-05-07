/**
 * scp command builders — structured command construction and examples
 */

import { buildScpCommand, type ScpDirection, type ScpOptions } from './scp-service';

export interface ScpPreset {
  name: string;
  description: string;
  direction: ScpDirection;
  source: string;
  destination: string;
  options: ScpOptions;
}

export interface ScpExample {
  name: string;
  command: string;
  description: string;
  category: 'upload' | 'download' | 'remote-to-remote' | 'advanced';
}

export const scpPresets: ScpPreset[] = [
  {
    name: 'Simple Upload',
    description: 'Copy a local file to a remote server',
    direction: 'upload',
    source: './file.txt',
    destination: 'user@host:/home/user/',
    options: {},
  },
  {
    name: 'Simple Download',
    description: 'Copy a file from a remote server locally',
    direction: 'download',
    source: 'user@host:/remote/file.txt',
    destination: './',
    options: {},
  },
  {
    name: 'Recursive Upload',
    description: 'Upload a whole directory tree',
    direction: 'upload',
    source: './myproject/',
    destination: 'user@host:/var/www/',
    options: { recursive: true },
  },
  {
    name: 'Recursive Download',
    description: 'Download a whole directory tree',
    direction: 'download',
    source: 'user@host:/var/log/myapp/',
    destination: './logs/',
    options: { recursive: true },
  },
  {
    name: 'Custom Port + Key',
    description: 'Non-standard port with key-based auth',
    direction: 'upload',
    source: './deploy.tar.gz',
    destination: 'deploy@prod:/srv/releases/',
    options: { port: 2222, identityFile: '~/.ssh/deploy_key' },
  },
  {
    name: 'Preserve Timestamps',
    description: 'Upload keeping original file timestamps and modes',
    direction: 'upload',
    source: './archive.tar.gz',
    destination: 'user@host:/backups/',
    options: { preserve: true },
  },
  {
    name: 'Legacy Protocol (-O)',
    description: 'Force old SCP protocol for older/incompatible servers',
    direction: 'download',
    source: 'user@old-server:/data/export.csv',
    destination: './',
    options: { legacyScp: true },
  },
  {
    name: 'Via Jump Host',
    description: 'Access a target behind a bastion host',
    direction: 'download',
    source: 'user@internal:/etc/config',
    destination: './',
    options: { jumpHost: 'bastion.example.com' },
  },
  {
    name: 'Bandwidth Throttled',
    description: 'Limit bandwidth to ~125 KB/s (1000 Kbit/s)',
    direction: 'upload',
    source: './bigfile.iso',
    destination: 'user@host:/tmp/',
    options: { bandwidthLimit: 1000 },
  },
  {
    name: 'Remote to Remote',
    description: 'Copy between two remote hosts via local machine',
    direction: 'remote-to-remote',
    source: 'user1@host1:/data/export.sql',
    destination: 'user2@host2:/imports/',
    options: { threeParty: true },
  },
];

export const scpExamples: ScpExample[] = [
  {
    name: 'Upload File',
    command: 'scp report.pdf user@server:/home/user/docs/',
    description: 'Simple file upload to remote home directory',
    category: 'upload',
  },
  {
    name: 'Upload Directory',
    command: 'scp -r ./dist user@server:/var/www/app/',
    description: 'Recursively upload a build output directory',
    category: 'upload',
  },
  {
    name: 'Download Log',
    command: 'scp user@server:/var/log/app.log ./',
    description: 'Pull a single log file from a server',
    category: 'download',
  },
  {
    name: 'Download Directory',
    command: 'scp -r user@server:/var/log/myapp/ ./logs/',
    description: 'Download an entire log directory',
    category: 'download',
  },
  {
    name: 'Custom Port + Key',
    command: 'scp -P 2222 -i ~/.ssh/id_ed25519 deploy.tar.gz user@host:/srv/',
    description: 'Upload with non-standard port and explicit key file',
    category: 'advanced',
  },
  {
    name: 'Jump Host',
    command: 'scp -J bastion.corp user@internal:/etc/app.conf ./',
    description: 'Download from a host reachable only through a bastion',
    category: 'advanced',
  },
  {
    name: 'Remote-to-Remote',
    command: 'scp -3 user1@host1:/data/db.sql user2@host2:/backups/',
    description: 'Transfer file between two remotes, routed locally',
    category: 'remote-to-remote',
  },
  {
    name: 'Legacy Server',
    command: 'scp -O -r user@old-server:/exports/ ./imports/',
    description: 'Force legacy SCP protocol (OpenSSH < 9.0 compatibility)',
    category: 'advanced',
  },
  {
    name: 'Throttled Transfer',
    command: 'scp -l 500 bigfile.iso user@host:/mnt/storage/',
    description: 'Limit to 500 Kbit/s (~62 KB/s) to avoid saturating the link',
    category: 'advanced',
  },
  {
    name: 'Preserve + Verbose',
    command: 'scp -pvr ./src user@host:/opt/myapp/',
    description: 'Upload directory preserving timestamps, verbose SSH output',
    category: 'upload',
  },
];

/**
 * Build a command from a preset (for display / loading).
 */
export function presetToCommand(preset: ScpPreset): string {
  return buildScpCommand(preset.source, preset.destination, preset.options);
}

/**
 * Infer a default direction label from source/destination path strings.
 */
export function inferDirection(source: string, destination: string): ScpDirection {
  const srcRemote = /^([A-Za-z0-9_.%-]+@)?[A-Za-z0-9._%-]+:/.test(source);
  const dstRemote = /^([A-Za-z0-9_.%-]+@)?[A-Za-z0-9._%-]+:/.test(destination);
  if (srcRemote && dstRemote) return 'remote-to-remote';
  if (srcRemote) return 'download';
  return 'upload';
}
