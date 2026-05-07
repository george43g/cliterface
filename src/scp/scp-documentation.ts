/**
 * scp documentation — embedded man-page summary and examples
 */

export interface ManSection {
  title: string;
  content: string;
}

export interface ManExample {
  command: string;
  description: string;
}

export interface ScpManPage {
  name: string;
  synopsis: string;
  description: string;
  sections: ManSection[];
  examples: ManExample[];
}

export const scpManPage: ScpManPage = {
  name: 'scp — OpenSSH secure file copy',
  synopsis: 'scp [options] source ... target',
  description: `scp copies files between hosts over a network using the SSH protocol for encryption
and authentication. Since OpenSSH 9.0 the default transfer protocol is SFTP; use
-O to fall back to the legacy SCP protocol (needed for very old servers or ~/ path
expansion quirks).

Path forms:
  local          /path/to/file  or  relative/path
  remote         [user@]host:path
  URI form       scp://[user@]host[:port][/path]

WARNING: scp overwrites the destination without interactive confirmation (-i does
not exist in scp). Always double-check your destination path before running.`,
  sections: [
    {
      title: 'Key Flags',
      content: `-r          Recursively copy directories (follows symlinks)
-P PORT     Remote port (capital P — lowercase -p is used for preserve)
-i KEY      Identity (private key) file
-p          Preserve mtimes, atimes, and mode bits
-q          Quiet — suppress progress meter and SSH diagnostics
-v          Verbose — SSH debug output (helpful for auth issues)
-C          Enable SSH compression (useful on slow links)
-B          Batch mode — fail instead of prompting for passwords
-l KBITS    Bandwidth limit in Kbit/s (e.g. -l 1000 ≈ 125 KB/s)
-3          Remote-to-remote: relay through local host (default since OpenSSH 9)
-O          Force legacy SCP protocol (pre-9.0 behaviour)
-J HOST     Jump host — equivalent to ProxyJump in ssh_config
-F FILE     Alternative ssh_config file`,
    },
    {
      title: 'Path Syntax',
      content: `Upload (local → remote):
  scp file.txt user@host:/remote/dir/

Download (remote → local):
  scp user@host:/remote/file.txt ./local/

Remote-to-remote (via local with -3):
  scp -3 user1@host1:/path user2@host2:/path

Recursive directory:
  scp -r ./mydir user@host:/destination/

Multiple sources:
  scp file1 file2 user@host:/dest/`,
    },
    {
      title: 'Port & Auth',
      content: `Custom port:         scp -P 2222 file user@host:/dest/
Key-based auth:      scp -i ~/.ssh/id_ed25519 file user@host:/dest/
Jump host:           scp -J bastion user@target:/path ./
Batch (no prompts):  scp -B file user@host:/dest/`,
    },
    {
      title: 'Protocol Note (OpenSSH ≥ 9.0)',
      content: `Since OpenSSH 9.0 scp uses SFTP by default. This can break:
  • Servers that only speak the old SCP protocol
  • Wildcard expansion on some servers
  • ~/ path expansion on older SFTP servers

Fix: add -O to force legacy SCP protocol.

For transfers where rsync is available, prefer:
  rsync -avz -e ssh source user@host:/dest/
It provides progress, partial transfers, and checksums.`,
    },
  ],
  examples: [
    { command: 'scp report.pdf user@server:/home/user/', description: 'Upload single file' },
    { command: 'scp user@server:/var/log/app.log ./', description: 'Download single file' },
    { command: 'scp -r ./dist user@server:/var/www/', description: 'Upload directory recursively' },
    { command: 'scp -P 2222 -i ~/.ssh/id_ed25519 file.txt user@host:/tmp/', description: 'Custom port + key file' },
    { command: 'scp -O -r legacy-server:/data/ ./backup/', description: 'Download from old server (legacy SCP protocol)' },
    { command: 'scp -J bastion user@internal:/etc/config ./', description: 'Copy via jump host' },
    { command: 'scp -l 500 bigfile.zip user@host:/tmp/', description: 'Bandwidth-limited upload (~62 KB/s)' },
    { command: 'scp -3 user1@host1:/file user2@host2:/dest/', description: 'Remote-to-remote through local host' },
  ],
};

export function getScpManPage(): ScpManPage {
  return scpManPage;
}
