/**
 * ln documentation — flag descriptions, pitfalls, companion commands
 */

export interface FlagDoc {
  flag: string;
  shorthand: string;
  title: string;
  description: string;
  destructive?: boolean;
  symbolicOnly?: boolean;
  hardOnly?: boolean;
}

export const LN_FLAGS: FlagDoc[] = [
  {
    flag: '-s',
    shorthand: 's',
    title: 'Symbolic link',
    description: 'Create a symbolic (soft) link. The link contains the path string, not the inode. Works across filesystems and can point to directories.',
  },
  {
    flag: '-f',
    shorthand: 'f',
    title: 'Force overwrite',
    description: 'If the target already exists, remove it silently and create the new link. Destructive — the existing file/link is deleted without confirmation.',
    destructive: true,
  },
  {
    flag: '-i',
    shorthand: 'i',
    title: 'Interactive',
    description: 'Prompt before overwriting an existing target. Overrides -f if specified afterwards.',
  },
  {
    flag: '-h / -n',
    shorthand: 'h',
    title: 'No-deref target',
    description: 'If the target is a symlink pointing to a directory, do not follow it. Useful with -f to replace a symlink that points to a directory.',
    symbolicOnly: false,
  },
  {
    flag: '-v',
    shorthand: 'v',
    title: 'Verbose',
    description: 'Print each link as it is created.',
  },
  {
    flag: '-P',
    shorthand: 'P',
    title: 'Physical (hard to symlink)',
    description: 'When hard-linking to a symlink, create the hard link to the symlink itself rather than its target. Cancels -L.',
    hardOnly: true,
  },
];

export interface Pitfall {
  title: string;
  description: string;
  example?: string;
  fix?: string;
}

export const LN_PITFALLS: Pitfall[] = [
  {
    title: 'Broken symlinks (dangling links)',
    description:
      'A symlink stores the path you gave — not the resolved target. If you use a relative path and later move the link, or if the target file is deleted or renamed, the link becomes dangling (broken).',
    example: 'ln -s ../lib/foo.so ./bin/foo.so  # works only from this directory',
    fix: "Use absolute paths for stable symlinks, or ensure relative paths are computed from the link's location, not the current directory.",
  },
  {
    title: 'Hard links cannot cross filesystems',
    description: 'Hard links share an inode. Inodes are local to a filesystem, so you cannot create a hard link to a file on a different mounted filesystem or partition.',
    example: 'ln /mnt/disk/file ~/link  # FAILS: cross-device link',
    fix: 'Use a symbolic link (-s) instead for cross-filesystem references.',
  },
  {
    title: 'Hard links cannot link to directories',
    description: 'Most Unix systems forbid hard-linking directories (only root may do so, and only in rare cases) to prevent cycles in the filesystem graph.',
    example: 'ln /usr/local/lib ~/lib  # FAILS: is a directory',
    fix: 'Use a symbolic link (-s) to create a directory alias.',
  },
  {
    title: 'Relative-path gotcha when target is a directory',
    description:
      'If the target is an existing directory, ln places the link inside it, using the last component of source as the link name. Your relative path is then resolved relative to the directory — which may differ from where you ran ln.',
    example: 'ln -s ../src/app.ts dist/  # creates dist/app.ts -> ../src/app.ts (resolves from dist/, may break)',
    fix: 'Verify with readlink -f or realpath after creating the link.',
  },
  {
    title: '-f silently removes the target',
    description: 'The -f (force) flag unlinks the existing target without any prompt. If the target is a regular file with unique content, that data is permanently lost.',
    example: 'ln -sf /dev/null ~/important-config  # destroys the config file',
    fix: 'Always preview the command before using -f. Use -i for interactive confirmation instead.',
  },
  {
    title: 'Symlink vs hard link — deletion behaviour',
    description:
      'Deleting a hard link does not remove the data until all hard links to that inode are removed. Deleting a symlink removes only the link entry; the target file is unaffected. Deleting the target of a symlink leaves a dangling link.',
    example: 'rm ~/link  # hard link: file still exists via other names; symlink: target file untouched',
  },
];

export interface CompanionCommand {
  name: string;
  synopsis: string;
  description: string;
  examples: string[];
}

export const LN_COMPANIONS: CompanionCommand[] = [
  {
    name: 'readlink',
    synopsis: 'readlink [-f] <path>',
    description:
      'Print the value of a symbolic link. With -f, resolve the path fully (follow all symlinks and canonicalize). On macOS the -f flag requires the target to exist; use `realpath` for a guaranteed canonical path.',
    examples: ['readlink ~/my-link', 'readlink -f ~/my-link'],
  },
  {
    name: 'realpath',
    synopsis: 'realpath <path>',
    description: 'Resolve all symlinks and print the canonical absolute path. Useful for verifying that a symlink resolves where you expect.',
    examples: ['realpath ~/my-link', 'realpath ../relative/path'],
  },
  {
    name: 'unlink',
    synopsis: 'unlink <file>',
    description: 'Remove a single file or symlink using the unlink(2) system call directly. Unlike `rm`, it accepts exactly one argument and cannot delete directories.',
    examples: ['unlink ~/my-link', 'unlink /tmp/stale-symlink'],
  },
];
