/**
 * SSH inline documentation and man-page summaries
 */

export interface ManSection {
  title: string;
  content: string;
}

export interface ManExample {
  command: string;
  description: string;
}

export interface ManPageData {
  name: string;
  synopsis: string;
  description: string;
  sections: ManSection[];
  examples: ManExample[];
}

export const sshManPage: ManPageData = {
  name: 'ssh',
  synopsis: 'ssh [options] [user@]hostname [command]',
  description: `ssh (OpenSSH remote login client) establishes encrypted connections to remote hosts.
It supports interactive login shells, remote command execution, port forwarding (local, remote, dynamic SOCKS),
X11 forwarding, jump hosts, and multiplexing via ControlMaster.

Authentication methods: public key, password, GSSAPI, and host-based.`,
  sections: [
    {
      title: 'Common Flags',
      content: `-p port         Connect to port (default: 22)
-i identity     Identity (private key) file
-l user         Login name on remote host
-J jump         Jump host (ProxyJump): [user@]host[:port]
-L local:host:remote   Local port forward
-R remote:host:local   Remote port forward
-D [addr:]port  Dynamic (SOCKS) port forward
-N              No remote command (for forwarding)
-f              Fork into background before execution
-A              Enable agent forwarding
-C              Enable compression
-v              Verbose (debug) output
-G              Print effective config and exit
-Q type         Query supported algorithms`,
    },
    {
      title: 'Port Forwarding',
      content: `Local (-L): Traffic to localhost:PORT is forwarded to REMOTE_HOST:REMOTE_PORT via the SSH server.
  Example: ssh -L 8080:intranet-site:80 bastion.example.com

Remote (-R): Traffic to REMOTE_PORT on the server is forwarded back to LOCAL_HOST:LOCAL_PORT.
  Example: ssh -R 9000:localhost:3000 user@remote

Dynamic (-D): Creates a SOCKS4/5 proxy on LOCAL_PORT.
  Example: ssh -D 1080 user@remote (then set SOCKS proxy to localhost:1080)`,
    },
    {
      title: 'Key Management (ssh-keygen)',
      content: `ssh-keygen -t ed25519 -C "comment"  Generate Ed25519 key (recommended)
ssh-keygen -t rsa -b 4096           Generate 4096-bit RSA key
ssh-keygen -l -f ~/.ssh/id_ed25519  Show key fingerprint
ssh-keygen -p -f ~/.ssh/id_ed25519  Change key passphrase
ssh-keygen -F hostname              Find host in known_hosts
ssh-keygen -R hostname              Remove host from known_hosts`,
    },
    {
      title: 'Agent (ssh-add)',
      content: `ssh-add                    Add default keys to agent
ssh-add ~/.ssh/id_ed25519  Add specific key
ssh-add -l                 List loaded keys (fingerprints)
ssh-add -L                 List loaded keys (public keys)
ssh-add -d ~/.ssh/id_ed25519  Remove specific key
ssh-add -D                 Remove all keys
ssh-add -t 3600            Add with 1-hour expiry`,
    },
    {
      title: '~/.ssh/config Syntax',
      content: `Host alias
    HostName real.host.com
    User myuser
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    ForwardAgent yes
    ServerAliveInterval 60

Host bastion
    HostName bastion.example.com

Host internal-*
    ProxyJump bastion`,
    },
    {
      title: 'Multiplexing (ControlMaster)',
      content: `Add to ~/.ssh/config:
  ControlMaster auto
  ControlPath ~/.ssh/cm-%r@%h:%p
  ControlPersist 10m

# Check existing mux connection:
  ssh -O check user@host

# Stop mux master:
  ssh -O stop user@host`,
    },
  ],
  examples: [
    { command: 'ssh user@host.example.com', description: 'Basic login' },
    { command: 'ssh -p 2222 user@host', description: 'Connect on custom port' },
    { command: 'ssh -i ~/.ssh/id_ed25519 user@host', description: 'Specify identity file' },
    { command: 'ssh -J bastion user@internal', description: 'Connect via jump host' },
    { command: 'ssh user@host "ls -la /var/log"', description: 'Execute remote command' },
    { command: 'ssh -L 5432:db.internal:5432 user@bastion', description: 'Tunnel local port to DB' },
    { command: 'ssh -R 8080:localhost:3000 user@remote', description: 'Expose local service remotely' },
    { command: 'ssh -D 1080 -N -f user@remote', description: 'SOCKS5 proxy in background' },
    { command: 'ssh -G user@host', description: 'Print effective config for host' },
    { command: 'ssh -Q cipher', description: 'List supported ciphers' },
  ],
};

export function getSshManPage(): ManPageData {
  return sshManPage;
}

export const sshKeygenManPage: ManPageData = {
  name: 'ssh-keygen',
  synopsis: 'ssh-keygen [-t type] [-b bits] [-C comment] [-f output_file]',
  description: 'Generates, manages, and converts OpenSSH authentication keys.',
  sections: [
    {
      title: 'Key Types',
      content: `ed25519   Modern elliptic curve — recommended (fixed size, fast)
ecdsa     ECDSA (256/384/521 bits)
rsa       RSA (min 1024 bits, recommend 4096)`,
    },
    {
      title: 'Common Operations',
      content: `-t type      Key type (ed25519, ecdsa, rsa)
-b bits      Key size (RSA: 2048/4096, ECDSA: 256/384/521)
-C comment   Key comment (usually "user@host")
-f file      Output file path
-l           Show fingerprint
-p           Change passphrase
-F host      Find host in known_hosts
-R host      Remove host from known_hosts
-a rounds    KDF rounds (higher = slower but more secure)`,
    },
  ],
  examples: [
    { command: 'ssh-keygen -t ed25519 -C "me@work"', description: 'Generate Ed25519 key' },
    { command: 'ssh-keygen -t rsa -b 4096 -C "legacy"', description: 'Generate 4096-bit RSA key' },
    { command: 'ssh-keygen -l -f ~/.ssh/id_ed25519.pub', description: 'Show fingerprint' },
    { command: 'ssh-keygen -p -f ~/.ssh/id_ed25519', description: 'Change passphrase' },
    { command: 'ssh-keygen -R host.example.com', description: 'Remove from known_hosts' },
  ],
};
