import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

export interface CopyOptions {
  recursive?: boolean;
  interactive?: boolean;
  preserveAttrs?: boolean;
  archive?: boolean;
}

export interface MoveOptions {
  interactive?: boolean;
}

export interface RemoveOptions {
  recursive?: boolean;
  force?: boolean;
  interactive?: boolean;
}

export interface FindOptions {
  name?: string;
  type?: 'f' | 'd' | 'l';
  mtime?: string;
  size?: string;
  exec?: string;
  print0?: boolean;
  maxdepth?: number;
}

export interface GrepOptions {
  extendedRegex?: boolean;
  recursive?: boolean;
  lineNumbers?: boolean;
  ignoreCase?: boolean;
  invertMatch?: boolean;
  filesWithMatches?: boolean;
  count?: boolean;
  include?: string;
}

export interface SortOptions {
  numeric?: boolean;
  reverse?: boolean;
  unique?: boolean;
  key?: string;
}

export interface TarOptions {
  operation: 'create' | 'extract' | 'list';
  verbose?: boolean;
  gzip?: boolean;
  bzip2?: boolean;
  xz?: boolean;
  file?: string;
  directory?: string;
}

export const posixService = {
  // File listing
  async ls(path = '.', flags: string[] = []): Promise<CommandResult> {
    const f = flags.length ? flags.join('') : '';
    return executeCommand(`ls${f ? ` ${f}` : ''} ${path}`);
  },

  async stat(path: string): Promise<CommandResult> {
    return executeCommand(`stat ${path}`);
  },

  async file(path: string): Promise<CommandResult> {
    return executeCommand(`file ${path}`);
  },

  async du(path = '.', humanReadable = true, summarize = false): Promise<CommandResult> {
    const flags = [humanReadable ? 'h' : '', summarize ? 's' : ''].filter(Boolean).join('');
    return executeCommand(`du${flags ? ` -${flags}` : ''} ${path}`);
  },

  async df(humanReadable = true): Promise<CommandResult> {
    return executeCommand(`df${humanReadable ? ' -h' : ''}`);
  },

  async wc(path: string, flags: string[] = []): Promise<CommandResult> {
    const f = flags.join('');
    return executeCommand(`wc${f ? ` ${f}` : ''} ${path}`);
  },

  // Text processing
  async head(path: string, lines = 10, follow = false): Promise<CommandResult> {
    const flags = [`-n ${lines}`, follow ? '-f' : ''].filter(Boolean).join(' ');
    return executeCommand(`head ${flags} ${path}`);
  },

  async tail(path: string, lines = 10, follow = false): Promise<CommandResult> {
    const flags = [`-n ${lines}`, follow ? '-f' : ''].filter(Boolean).join(' ');
    return executeCommand(`tail ${flags} ${path}`);
  },

  async grep(pattern: string, path: string, opts: GrepOptions = {}): Promise<CommandResult> {
    const flags = [
      opts.extendedRegex ? '-E' : '',
      opts.recursive ? '-r' : '',
      opts.lineNumbers ? '-n' : '',
      opts.ignoreCase ? '-i' : '',
      opts.invertMatch ? '-v' : '',
      opts.filesWithMatches ? '-l' : '',
      opts.count ? '-c' : '',
      opts.include ? `--include="${opts.include}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return executeCommand(`grep ${flags} '${pattern}' ${path}`);
  },

  async find(path = '.', opts: FindOptions = {}): Promise<CommandResult> {
    const args = [path];
    if (opts.name) args.push(`-name '${opts.name}'`);
    if (opts.type) args.push(`-type ${opts.type}`);
    if (opts.mtime) args.push(`-mtime ${opts.mtime}`);
    if (opts.size) args.push(`-size ${opts.size}`);
    if (opts.maxdepth !== undefined) args.push(`-maxdepth ${opts.maxdepth}`);
    if (opts.exec) args.push(`-exec ${opts.exec} {} \\;`);
    if (opts.print0) args.push('-print0');
    return executeCommand(`find ${args.join(' ')}`);
  },

  async sort(path: string, opts: SortOptions = {}): Promise<CommandResult> {
    const flags = [opts.numeric ? '-n' : '', opts.reverse ? '-r' : '', opts.unique ? '-u' : '', opts.key ? `-k ${opts.key}` : ''].filter(Boolean).join(' ');
    return executeCommand(`sort ${flags} ${path}`);
  },

  async cut(path: string, delimiter: string, fields: string): Promise<CommandResult> {
    return executeCommand(`cut -d'${delimiter}' -f${fields} ${path}`);
  },

  async tr(from: string, to: string, input: string): Promise<CommandResult> {
    return executeCommand(`echo '${input}' | tr '${from}' '${to}'`);
  },

  async uniq(path: string, count = false, duplicatesOnly = false): Promise<CommandResult> {
    const flags = [count ? '-c' : '', duplicatesOnly ? '-d' : ''].filter(Boolean).join(' ');
    return executeCommand(`uniq${flags ? ` ${flags}` : ''} ${path}`);
  },

  // File ops
  async cp(src: string, dest: string, opts: CopyOptions = {}): Promise<CommandResult> {
    const flags = [opts.recursive ? '-r' : '', opts.interactive ? '-i' : '', opts.preserveAttrs ? '-p' : '', opts.archive ? '-a' : ''].filter(Boolean).join(' ');
    return executeCommand(`cp ${flags} ${src} ${dest}`);
  },

  async mv(src: string, dest: string, opts: MoveOptions = {}): Promise<CommandResult> {
    return executeCommand(`mv${opts.interactive ? ' -i' : ''} ${src} ${dest}`);
  },

  async rm(path: string, opts: RemoveOptions = {}): Promise<CommandResult> {
    const flags = [opts.recursive ? 'r' : '', opts.force ? 'f' : '', opts.interactive ? 'i' : ''].filter(Boolean).join('');
    return executeCommand(`rm${flags ? ` -${flags}` : ''} ${path}`);
  },

  async mkdir(path: string, parents = false): Promise<CommandResult> {
    return executeCommand(`mkdir${parents ? ' -p' : ''} ${path}`);
  },

  async touch(path: string): Promise<CommandResult> {
    return executeCommand(`touch ${path}`);
  },

  async chmod(mode: string, path: string, recursive = false): Promise<CommandResult> {
    return executeCommand(`chmod${recursive ? ' -R' : ''} ${mode} ${path}`);
  },

  async chown(owner: string, path: string, recursive = false): Promise<CommandResult> {
    return executeCommand(`chown${recursive ? ' -R' : ''} ${owner} ${path}`);
  },

  // Process
  async kill(pid: string, signal = '15'): Promise<CommandResult> {
    return executeCommand(`kill -${signal} ${pid}`);
  },

  async which(cmd: string): Promise<CommandResult> {
    return executeCommand(`which ${cmd}`);
  },

  async env(): Promise<CommandResult> {
    return executeCommand('env');
  },

  async nohup(cmd: string): Promise<CommandResult> {
    return executeCommand(`nohup ${cmd} &`);
  },

  // Date / Time
  async date(format?: string): Promise<CommandResult> {
    return executeCommand(format ? `date '+${format}'` : 'date');
  },

  async sleep(seconds: number): Promise<CommandResult> {
    return executeCommand(`sleep ${seconds}`);
  },

  // Compression
  async tar(opts: TarOptions, paths: string[] = []): Promise<CommandResult> {
    const opFlag = opts.operation === 'create' ? 'c' : opts.operation === 'extract' ? 'x' : 't';
    const flags = [opFlag, opts.verbose ? 'v' : '', opts.gzip ? 'z' : opts.bzip2 ? 'j' : opts.xz ? 'J' : '', 'f'].filter(Boolean).join('');
    const fileArg = opts.file ? opts.file : 'archive.tar.gz';
    const dirArg = opts.directory ? ` -C ${opts.directory}` : '';
    const pathArgs = paths.length ? ` ${paths.join(' ')}` : '';
    return executeCommand(`tar -${flags} ${fileArg}${dirArg}${pathArgs}`);
  },

  async gzip(path: string, decompress = false): Promise<CommandResult> {
    return executeCommand(`gzip${decompress ? ' -d' : ''} ${path}`);
  },

  async zip(archive: string, paths: string[]): Promise<CommandResult> {
    return executeCommand(`zip ${archive} ${paths.join(' ')}`);
  },

  async unzip(archive: string, dest?: string): Promise<CommandResult> {
    return executeCommand(`unzip ${archive}${dest ? ` -d ${dest}` : ''}`);
  },
};
