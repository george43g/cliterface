/**
 * tee documentation — man page content and reference material
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

export const teeManPage: ManPageData = {
  name: 'tee',
  synopsis: 'tee [-ai] [file ...]',
  description: `tee reads from standard input and writes to standard output AND to one or more files simultaneously. The output is unbuffered.

The name comes from the T-shaped pipe fitting in plumbing: water (data) flows through in two directions at once. In Unix pipelines, tee lets you see what's flowing through a pipe without interrupting it — you capture it to a file while still passing it downstream.

Two flags:
  -a   Append to files instead of overwriting them (safe for logs).
  -i   Ignore the SIGINT signal (Ctrl-C), useful in interactive pipelines.`,

  sections: [
    {
      title: 'Flags',
      content: `-a    Append the output to files rather than overwriting them.
      Use this for logs — your existing data is preserved.

-i    Ignore SIGINT (the signal sent by Ctrl-C).
      Normally Ctrl-C terminates tee immediately, which can
      leave files in a partial state. -i lets tee finish
      draining the pipe before exiting.`,
    },
    {
      title: 'The sudo tee Idiom',
      content: `The most famous tee pattern: writing to files you don't own.

  echo "value" | sudo tee /etc/some-config

Why not: sudo echo "value" > /etc/some-config ?
Because shell redirection (>) happens as YOUR user, before sudo
runs. The shell tries to open the file and is denied.

With tee, sudo runs tee (which gets root privileges), and tee
does the writing. The redirect > is unnecessary — tee's whole
job is to write to the file.

To append:  echo "line" | sudo tee -a /etc/config`,
    },
    {
      title: 'Multiple Files',
      content: `tee can write to any number of files at once:

  cmd | tee file1 file2 file3

All files receive identical copies of stdin. stdout also
receives the full stream. This is how you split a pipeline
into multiple branches.

Example — write build output to a log AND send to another tool:
  make 2>&1 | tee build.log | grep "error"`,
    },
    {
      title: 'Stderr Capture',
      content: `By default tee only captures stdout. To also capture stderr:

  cmd 2>&1 | tee output.log

The 2>&1 redirects stderr into stdout before tee sees it,
so both streams end up in the file and on your terminal.`,
    },
    {
      title: 'Discard stdout (silent file write)',
      content: `Sometimes you only want the file, not terminal output:

  cmd | tee file.log > /dev/null

The file still gets the full stream; your terminal sees nothing.`,
    },
  ],

  examples: [
    { command: 'echo "Hello" | tee greetings.txt', description: 'Write to file and stdout simultaneously' },
    { command: 'ls -la | tee listing.txt', description: 'Capture directory listing while still seeing it' },
    { command: 'make 2>&1 | tee build.log | grep -i error', description: 'Log full build output, filter errors to terminal' },
    { command: 'echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf', description: 'Write to privileged file via sudo tee' },
    { command: 'echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf', description: 'Append to privileged config' },
    { command: 'tail -f app.log | tee errors.log | grep ERROR', description: 'Follow logs, save a copy, filter on terminal' },
    { command: 'curl -s https://example.com | tee page.html | wc -c', description: 'Download, save, and count bytes' },
    { command: 'cmd | tee file1 file2 file3', description: 'Split output to multiple files simultaneously' },
  ],
};

export function getTeeManPage(): ManPageData {
  return teeManPage;
}
