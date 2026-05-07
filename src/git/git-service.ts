import { type CommandResult, executeCommand as sharedExecuteCommand } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * Git execution service — stub implementation.
 * Replace executeCommand with a real native bridge in production.
 */
export async function executeCommand(command: string): Promise<CommandResult> {
  return sharedExecuteCommand(command);
}

export const gitService = {
  // ── Status / inspection ───────────────────────────────────────────────────
  async status(short = false): Promise<CommandResult> {
    return executeCommand(`git status${short ? ' --short' : ''}`);
  },

  async log(args = '--oneline -20'): Promise<CommandResult> {
    return executeCommand(`git log ${args}`);
  },

  async diff(args = ''): Promise<CommandResult> {
    return executeCommand(`git diff${args ? ` ${args}` : ''}`);
  },

  async show(ref = 'HEAD'): Promise<CommandResult> {
    return executeCommand(`git show ${ref}`);
  },

  async blame(file: string, opts = ''): Promise<CommandResult> {
    return executeCommand(`git blame${opts ? ` ${opts}` : ''} ${file}`);
  },

  // ── Staging ───────────────────────────────────────────────────────────────
  async add(pathspec: string): Promise<CommandResult> {
    return executeCommand(`git add ${pathspec}`);
  },

  async restore(pathspec: string, staged = false): Promise<CommandResult> {
    return executeCommand(`git restore${staged ? ' --staged' : ''} ${pathspec}`);
  },

  // ── Commit ────────────────────────────────────────────────────────────────
  async commit(message: string, amend = false): Promise<CommandResult> {
    const flags = amend ? '--amend -m' : '-m';
    return executeCommand(`git commit ${flags} ${JSON.stringify(message)}`);
  },

  // ── Branch ────────────────────────────────────────────────────────────────
  async branchList(all = false): Promise<CommandResult> {
    return executeCommand(`git branch${all ? ' -a' : ''} --format="%(refname:short) %(objectname:short) %(upstream:short)"`);
  },

  async branchCreate(name: string, startPoint = ''): Promise<CommandResult> {
    return executeCommand(`git branch ${name}${startPoint ? ` ${startPoint}` : ''}`);
  },

  async branchDelete(name: string, force = false): Promise<CommandResult> {
    return executeCommand(`git branch ${force ? '-D' : '-d'} ${name}`);
  },

  async switchBranch(name: string, create = false): Promise<CommandResult> {
    return executeCommand(`git switch${create ? ' -c' : ''} ${name}`);
  },

  // ── Merge / Rebase ────────────────────────────────────────────────────────
  async merge(branch: string, noFF = false): Promise<CommandResult> {
    return executeCommand(`git merge${noFF ? ' --no-ff' : ''} ${branch}`);
  },

  async rebase(target: string): Promise<CommandResult> {
    return executeCommand(`git rebase ${target}`);
  },

  async abortRebase(): Promise<CommandResult> {
    return executeCommand('git rebase --abort');
  },

  async continueRebase(): Promise<CommandResult> {
    return executeCommand('git rebase --continue');
  },

  // ── Remote sync ───────────────────────────────────────────────────────────
  async fetch(remote = '', prune = false): Promise<CommandResult> {
    return executeCommand(`git fetch${remote ? ` ${remote}` : ''}${prune ? ' --prune' : ''}`);
  },

  async pull(remote = 'origin', branch = '', rebase = false): Promise<CommandResult> {
    const target = [remote, branch].filter(Boolean).join(' ');
    return executeCommand(`git pull${rebase ? ' --rebase' : ''} ${target}`);
  },

  async push(remote = 'origin', branch = '', forceWithLease = false): Promise<CommandResult> {
    const target = [remote, branch].filter(Boolean).join(' ');
    return executeCommand(`git push${forceWithLease ? ' --force-with-lease' : ''} ${target}`);
  },

  async pushSetUpstream(remote = 'origin', branch: string): Promise<CommandResult> {
    return executeCommand(`git push --set-upstream ${remote} ${branch}`);
  },

  // ── Stash ─────────────────────────────────────────────────────────────────
  async stashList(): Promise<CommandResult> {
    return executeCommand('git stash list');
  },

  async stashPush(message = '', includeUntracked = false): Promise<CommandResult> {
    return executeCommand(`git stash push${includeUntracked ? ' -u' : ''}${message ? ` -m ${JSON.stringify(message)}` : ''}`);
  },

  async stashPop(index?: number): Promise<CommandResult> {
    return executeCommand(`git stash pop${index !== undefined ? ` stash@{${index}}` : ''}`);
  },

  async stashApply(index?: number): Promise<CommandResult> {
    return executeCommand(`git stash apply${index !== undefined ? ` stash@{${index}}` : ''}`);
  },

  async stashDrop(index: number): Promise<CommandResult> {
    return executeCommand(`git stash drop stash@{${index}}`);
  },

  async stashShow(index = 0): Promise<CommandResult> {
    return executeCommand(`git stash show -p stash@{${index}}`);
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  async tagList(): Promise<CommandResult> {
    return executeCommand('git tag -l --sort=-version:refname');
  },

  async tagCreate(name: string, message = '', ref = ''): Promise<CommandResult> {
    const annotated = message ? ` -a -m ${JSON.stringify(message)}` : '';
    return executeCommand(`git tag${annotated} ${name}${ref ? ` ${ref}` : ''}`);
  },

  async tagDelete(name: string): Promise<CommandResult> {
    return executeCommand(`git tag -d ${name}`);
  },

  // ── Remotes ───────────────────────────────────────────────────────────────
  async remoteList(): Promise<CommandResult> {
    return executeCommand('git remote -v');
  },

  async remoteAdd(name: string, url: string): Promise<CommandResult> {
    return executeCommand(`git remote add ${name} ${url}`);
  },

  async remoteRemove(name: string): Promise<CommandResult> {
    return executeCommand(`git remote remove ${name}`);
  },

  // ── Reset ─────────────────────────────────────────────────────────────────
  async reset(mode: 'soft' | 'mixed' | 'hard', ref = 'HEAD'): Promise<CommandResult> {
    return executeCommand(`git reset --${mode} ${ref}`);
  },

  // ── Cherry-pick / Revert ─────────────────────────────────────────────────
  async cherryPick(ref: string): Promise<CommandResult> {
    return executeCommand(`git cherry-pick ${ref}`);
  },

  async revert(ref: string, noCommit = false): Promise<CommandResult> {
    return executeCommand(`git revert${noCommit ? ' --no-commit' : ''} ${ref}`);
  },

  // ── Clean ─────────────────────────────────────────────────────────────────
  async cleanDryRun(): Promise<CommandResult> {
    return executeCommand('git clean -nfd');
  },

  async clean(): Promise<CommandResult> {
    return executeCommand('git clean -fd');
  },

  // ── Config ────────────────────────────────────────────────────────────────
  async configList(global = false): Promise<CommandResult> {
    return executeCommand(`git config${global ? ' --global' : ''} --list`);
  },

  async configSet(key: string, value: string, global = false): Promise<CommandResult> {
    return executeCommand(`git config${global ? ' --global' : ''} ${key} ${JSON.stringify(value)}`);
  },

  // ── Worktree / Submodule ─────────────────────────────────────────────────
  async worktreeList(): Promise<CommandResult> {
    return executeCommand('git worktree list');
  },

  async submoduleStatus(): Promise<CommandResult> {
    return executeCommand('git submodule status');
  },

  async submoduleUpdate(init = true): Promise<CommandResult> {
    return executeCommand(`git submodule update${init ? ' --init' : ''} --recursive`);
  },

  // ── Bisect ────────────────────────────────────────────────────────────────
  async bisectStart(): Promise<CommandResult> {
    return executeCommand('git bisect start');
  },

  async bisectGood(ref = ''): Promise<CommandResult> {
    return executeCommand(`git bisect good${ref ? ` ${ref}` : ''}`);
  },

  async bisectBad(ref = ''): Promise<CommandResult> {
    return executeCommand(`git bisect bad${ref ? ` ${ref}` : ''}`);
  },

  async bisectReset(): Promise<CommandResult> {
    return executeCommand('git bisect reset');
  },
};
