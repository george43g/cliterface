// Curated from Obsidian vault: zprezto-module-git.md (464 lines)
// Source: Zprezto Git module alias reference — the user's curated shell alias cheatsheet.

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const GIT_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Zprezto Git Aliases — Branch (gb)',
    body: 'Branch management shortcuts provided by the Zprezto git module.',
    tags: ['aliases', 'branch', 'zprezto'],
    codeSnippet: `gb   # lists, creates, renames, and deletes branches
gbc  # creates a new branch
gbl  # lists branches and their commits (also gbv)
gbL  # lists all local and remote branches and their commits
gbr  # renames a branch (also gbm)
gbR  # renames a branch even if the new branch name already exists (also gbM)
gbs  # lists branches and their commits with ancestry graphs
gbS  # lists local and remote branches and their commits with ancestry graphs
gbV  # lists branches with more verbose information about their commits
gbx  # deletes a branch (also gbd)
gbX  # deletes a branch irrespective of its merged status (also gbD)`,
  },
  {
    heading: 'Zprezto Git Aliases — Commit (gc)',
    body: 'Commit and staging shortcuts.',
    tags: ['aliases', 'commit', 'zprezto'],
    codeSnippet: `gc    # records changes to the repository
gca   # stages all modified and deleted files
gcm   # records changes with the given message
gcam  # stages all modified and deleted files, and records changes with a message
gco   # checks out a branch or paths to work tree
gcO   # checks out hunks from the index or the tree interactively
gcf   # amends the tip of the current branch using the same log message as HEAD
gcF   # amends the tip of the current branch (opens editor)
gcp   # applies changes introduced by existing commits (cherry-pick)
gcP   # applies changes introduced by existing commits without committing
gcr   # reverts existing commits
gcR   # removes the HEAD commit
gcs   # displays commits with various objects
gcl   # lists lost commits
gcy   # displays commits yet to be applied to upstream (short)
gcY   # displays commits yet to be applied to upstream`,
  },
  {
    heading: 'Zprezto Git Aliases — Fetch & Remote (gf, gR)',
    body: 'Fetch and remote management shortcuts.',
    tags: ['aliases', 'fetch', 'remote', 'zprezto'],
    codeSnippet: `gf    # downloads objects and references from another repository
gfa   # downloads objects and references from all remote repositories
gfc   # clones a repository into a new directory
gfcr  # clones a repository including all submodules
gfm   # fetches from and merges with another repository or local branch
gfr   # fetches from and rebases on another repository or local branch

gR    # manages tracked repositories
gRl   # lists remote names and their URLs
gRa   # adds a new remote
gRx   # removes a remote
gRm   # renames a remote
gRu   # fetches remotes updates
gRp   # prunes all stale remote tracking branches
gRs   # displays information about a given remote`,
  },
  {
    heading: 'Zprezto Git Aliases — Index (gi)',
    body: 'Index and staging area shortcuts.',
    tags: ['aliases', 'index', 'staging', 'zprezto'],
    codeSnippet: `gia  # adds file contents to the index
giA  # adds file contents to the index interactively
giu  # adds file contents to the index (updates only known files)
gid  # displays changes between the index and a named commit (diff)
giD  # displays changes between the index and a named commit (word diff)
gii  # temporarily ignore differences in a given file
giI  # unignore differences in a given file
gir  # resets the current HEAD to the specified state
giR  # resets the current index interactively
gix  # removes files/directories from the index (recursively)
giX  # removes files/directories from the index (recursively and forced)`,
  },
  {
    heading: 'Zprezto Git Aliases — Log (gl)',
    body: 'Log display shortcuts with various formats.',
    tags: ['aliases', 'log', 'zprezto'],
    codeSnippet: `gl   # displays the log
gls  # displays the stats log
gld  # displays the diff log
glo  # displays the one line log
glg  # displays the graph log
glb  # displays the brief commit log
glc  # displays the commit count for each contributor in descending order
glS  # displays the log and checks the validity of signed commits`,
  },
  {
    heading: 'Zprezto Git Aliases — Push & Rebase (gp, gr)',
    body: 'Push and rebase shortcuts.',
    tags: ['aliases', 'push', 'rebase', 'zprezto'],
    codeSnippet: `gp   # updates remote refs along with associated objects
gpf  # forcefully updates remote refs using the safer --force-with-lease option
gpF  # forcefully updates remote refs using the riskier --force option
gpa  # updates remote branches along with associated objects
gpA  # updates remote branches and tags along with associated objects
gpt  # updates remote tags along with associated objects
gpc  # updates remote refs and adds origin as an upstream reference for the current branch
gpp  # pulls and pushes from origin to origin

gr   # forward-ports local commits to the updated upstream HEAD
gra  # aborts the rebase
grc  # continues the rebase after merge conflicts are resolved
gri  # makes a list of commits to be rebased and opens the editor
grs  # skips the current patch`,
  },
  {
    heading: 'Zprezto Git Aliases — Stash (gs)',
    body: 'Stash management shortcuts.',
    tags: ['aliases', 'stash', 'zprezto'],
    codeSnippet: `gs   # stashes the changes of the dirty working directory
gsa  # applies the changes recorded in a stash to the working directory
gsx  # drops a stashed state
gsX  # drops all the stashed states
gsl  # lists stashed states
gsL  # lists dropped stashed states
gsd  # displays changes between the stash and its original parent
gsp  # removes and applies a single stashed state from the stash list
gsr  # recovers a given stashed state
gss  # stashes the changes of the dirty working directory, including untracked
gsS  # stashes the changes of the dirty working directory interactively
gsw  # stashes the changes of the dirty working directory retaining the index`,
  },
  {
    heading: 'Zprezto Git Aliases — Working Directory & Merge (gw, gm)',
    body: 'Working directory status and merge shortcuts.',
    tags: ['aliases', 'working-directory', 'merge', 'zprezto'],
    codeSnippet: `gws  # displays working-tree status in the short format
gwS  # displays working-tree status
gwd  # displays changes between the working tree and the index (diff)
gwD  # displays changes between the working tree and the index (word diff)
gwr  # resets the current HEAD to the specified state (does not touch index/working tree)
gwR  # resets the current HEAD, index and working tree to the specified state
gwc  # removes untracked files from the working tree (dry-run)
gwC  # removes untracked files from the working tree
gwx  # removes files from the working tree and from the index recursively
gwX  # removes files from the working tree and from the index recursively and forcefully

gm   # joins two or more development histories together
gmC  # joins two or more development histories together but does not commit
gmF  # joins histories but does not commit, generating a merge commit even if fast-forward
gma  # aborts the conflict resolution, and reconstructs the pre-merge state
gmt  # runs the merge conflict resolution tools to resolve conflicts`,
  },
  {
    heading: 'Zprezto Git Aliases — Data, Conflict & Submodule',
    body: 'Data inspection, conflict resolution, and submodule management shortcuts.',
    tags: ['aliases', 'submodules', 'conflicts', 'zprezto'],
    codeSnippet: `# Data (file info)
gd   # displays information about files in the index and the work tree
gdc  # lists cached files
gdx  # lists deleted files
gdm  # lists modified files
gdu  # lists untracked files
gdk  # lists killed files
gdi  # lists ignored files

# Conflict resolution
gCl  # lists unmerged files
gCa  # adds unmerged file contents to the index
gCe  # executes merge-tool on all unmerged files
gCo  # checks out our changes for unmerged paths
gCO  # checks out our changes for all unmerged paths
gCt  # checks out their changes for unmerged paths
gCT  # checks out their changes for all unmerged paths

# Submodule
gS   # initializes, updates, or inspects submodules
gSa  # adds given a repository as a submodule
gSf  # evaluates a shell command in each of checked out submodules
gSi  # initializes submodules
gSI  # initializes and clones submodules recursively
gSl  # lists the commits of all submodules
gSu  # fetches and merges the latest changes for all submodules
gSx  # removes a submodule`,
  },
  {
    heading: 'Zprezto Git — Log Format Configuration',
    body: 'Configure git-log output format via zprezto zstyle. Set to brief, oneline, or medium.',
    tags: ['configuration', 'log', 'zprezto'],
    codeSnippet: `# In ~/.zpreztorc:
zstyle ':prezto:module:git:log:context' format 'oneline'
# Options: 'brief', 'oneline', 'medium'

# Ignore submodule status (speeds up status check in large repos):
zstyle ':prezto:module:git:status:ignore' submodules 'dirty'
# Options: 'dirty', 'untracked', 'all', 'none'`,
  },
  {
    heading: 'Zprezto Git — Git Flow Aliases (gF)',
    body: 'Git flow integration aliases for feature, bugfix, release, hotfix, and support workflows.',
    tags: ['aliases', 'git-flow', 'zprezto'],
    codeSnippet: `gFi    # git flow init

# Feature
gFfs   # git flow feature start
gFff   # git flow feature finish
gFfp   # git flow feature publish
gFft   # git flow feature track
gFfd   # git flow feature diff

# Release
gFls   # git flow release start
gFlf   # git flow release finish

# Hotfix
gFhs   # git flow hotfix start
gFhf   # git flow hotfix finish`,
  },
];
