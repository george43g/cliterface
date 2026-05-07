// Curated from Obsidian vault:
//   - vim-plugins/ directory (48 plugin files)
//   - neovim.md, neovim-plugins/ (65 files)
// Note: vim.md in vault is the upstream Vim project README (no personal content).
// All plugin files are upstream project READMEs; content extracted is
// the key quick-reference documentation from the most commonly used plugins.

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const VIM_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'vim-surround — Change, Delete, Add Surroundings',
    body: 'All about "surroundings": parentheses, brackets, quotes, XML tags. Mappings: cs (change), ds (delete), ys (add).',
    tags: ['plugin', 'vim-surround', 'motions'],
    codeSnippet: `cs"'      # change surrounding " to '   → "Hello" becomes 'Hello'
cs'<q>    # change surrounding ' to <q>  → 'Hello' becomes <q>Hello</q>
cst"      # change surrounding tag to "  → <q>Hello</q> becomes "Hello"
ds"       # delete surrounding "         → "Hello" becomes Hello

ysiw]     # add [] around word (no space) → Hello becomes [Hello]
ysiw{     # add {} around word (with space) → Hello becomes { Hello }
yss)      # wrap entire line in ()
yssb      # wrap entire line in () (b = ))
yss"      # wrap entire line in "..."

# In visual mode:
S"        # surround selection with "
S<p>      # surround selection with <p></p>`,
  },
  {
    heading: 'vim-commentary — Comment/Uncomment',
    body: 'Toggle comments with gcc (line), gc (motion), gc (visual). All mappings toggle.',
    tags: ['plugin', 'vim-commentary', 'editing'],
    codeSnippet: `gcc    # toggle comment on current line (takes a count: 3gcc = 3 lines)
gc     # toggle comment on motion target (e.g., gcap = comment a paragraph)
gc     # toggle comment on visual selection (in visual mode)
gcgc   # uncomment a set of adjacent commented lines

# Examples:
gcip   # comment inner paragraph
gc3j   # comment 3 lines down
gcG    # comment to end of file

# Command mode:
:7,17Commentary   # comment lines 7-17
:g/TODO/Commentary  # comment all TODO lines`,
  },
  {
    heading: 'vim-easymotion — Jump Anywhere',
    body: 'Trigger motions with <Leader><Leader> prefix. Type the highlighted character to jump.',
    tags: ['plugin', 'vim-easymotion', 'navigation'],
    codeSnippet: `<Leader><Leader>w    # forward word motions
<Leader><Leader>b    # backward word motions
<Leader><Leader>f{c} # find character forward
<Leader><Leader>F{c} # find character backward
<Leader><Leader>t{c} # till character forward
<Leader><Leader>T{c} # till character backward
<Leader><Leader>j    # line motions (down)
<Leader><Leader>k    # line motions (up)
<Leader><Leader>s    # search (bidirectional)

# Change leader to single <Leader> (add to vimrc):
map <Leader> <Plug>(easymotion-prefix)`,
  },
  {
    heading: 'NERDTree — File Explorer',
    body: 'File system explorer. Open with :NERDTree or :NERDTreeToggle.',
    tags: ['plugin', 'nerdtree', 'navigation'],
    codeSnippet: `:NERDTree          # open NERDTree
:NERDTreeToggle   # toggle NERDTree
:NERDTreeFind     # reveal current file in NERDTree

# Inside NERDTree:
o   # open file/directory
t   # open in new tab
s   # open in vertical split
i   # open in horizontal split
m   # show the NERDTree menu (rename, delete, copy, etc.)
?   # toggle help
q   # close NERDTree

# Common vimrc mapping:
# map <C-n> :NERDTreeToggle<CR>`,
  },
  {
    heading: 'coc.nvim — LSP / IntelliSense',
    body: 'Language Server Protocol client. Provides completions, diagnostics, code actions. Requires Node.js.',
    tags: ['plugin', 'coc.nvim', 'lsp', 'completion'],
    codeSnippet: `# Key mappings (add to vimrc):
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gy <Plug>(coc-type-definition)
nmap <silent> gi <Plug>(coc-implementation)
nmap <silent> gr <Plug>(coc-references)
nmap <leader>rn <Plug>(coc-rename)
nmap <leader>ac <Plug>(coc-codeaction)
nmap <leader>qf <Plug>(coc-fix-current)
nmap <silent> [g  <Plug>(coc-diagnostic-prev)
nmap <silent> ]g  <Plug>(coc-diagnostic-next)

# Tab completion:
inoremap <silent><expr> <TAB>
  \\ pumvisible() ? "\\<C-n>" :
  \\ <SID>check_back_space() ? "\\<TAB>" :
  \\ coc#refresh()

# Use K to show documentation:
nnoremap <silent> K :call <SID>show_documentation()<CR>

# Install language servers:
:CocInstall coc-tsserver   # TypeScript
:CocInstall coc-python     # Python
:CocInstall coc-json       # JSON`,
  },
  {
    heading: 'ctrlp.vim — Fuzzy File Finder',
    body: 'Full path fuzzy file/buffer/MRU/tag finder. Open with <C-p>.',
    tags: ['plugin', 'ctrlp', 'fuzzy-find'],
    codeSnippet: `<C-p>      # open CtrlP in find file mode
<C-f>      # cycle to next search mode (file → buffer → MRU)
<C-d>      # toggle filename only search (vs full path)
<C-r>      # toggle regex mode
<C-j/k>    # navigate results
<CR>       # open selected file in current window
<C-t>      # open in new tab
<C-v>      # open in vertical split
<C-x>      # open in horizontal split
<C-c>      # close CtrlP

# In vimrc:
let g:ctrlp_map = '<c-p>'
let g:ctrlp_cmd = 'CtrlP'
let g:ctrlp_working_path_mode = 'ra'   # search from git root`,
  },
  {
    heading: 'lightline.vim — Status Line',
    body: 'Lightweight configurable status line. Much less config than powerline.',
    tags: ['plugin', 'lightline', 'ui'],
    codeSnippet: `" Basic setup in vimrc:
set laststatus=2
set noshowmode   " hide default mode text (lightline shows it)

let g:lightline = {
\\ 'colorscheme': 'wombat',
\\ 'active': {
\\   'left': [['mode', 'paste'], ['gitbranch', 'filename', 'modified']],
\\   'right': [['lineinfo'], ['percent'], ['fileformat', 'fileencoding', 'filetype']]
\\ },
\\ 'component_function': {
\\   'gitbranch': 'FugitiveHead'
\\ }
\\ }`,
  },
  {
    heading: 'copilot.vim — AI Completions',
    body: 'GitHub Copilot for Vim. Accept suggestions with Tab.',
    tags: ['plugin', 'copilot', 'ai'],
    codeSnippet: `:Copilot setup     # authenticate with GitHub
:Copilot enable    # enable Copilot
:Copilot disable   # disable Copilot
:Copilot status    # check status

# In insert mode:
<Tab>      # accept suggestion
<M-]>      # next suggestion
<M-[>      # previous suggestion
<C-]>      # dismiss suggestion

# Disable Tab mapping (use custom):
let g:copilot_no_tab_map = v:true
imap <silent><script><expr> <C-J> copilot#Accept("\\<CR>")`,
  },
  {
    heading: 'vim-snipmate / vim-snippets — Snippets',
    body: 'Tab-triggered code snippets. vim-snippets provides a large library.',
    tags: ['plugin', 'snippets', 'editing'],
    codeSnippet: `# Trigger snippet (in insert mode):
<Tab>    # expand snippet trigger
<Tab>    # jump to next placeholder
<S-Tab>  # jump to previous placeholder

# Common snippet triggers (vim-snippets library):
if<Tab>    # if statement
for<Tab>   # for loop
fun<Tab>   # function definition
cl<Tab>    # class definition
log<Tab>   # console.log / print statement

# Add custom snippets in ~/.vim/snippets/<filetype>.snippets`,
  },
  {
    heading: 'vim-fugitive — Git Integration',
    body: 'A Git wrapper so awesome, it should be illegal. Full Git workflow in Vim.',
    tags: ['plugin', 'fugitive', 'git'],
    codeSnippet: `:G / :Git         # run any git command
:Gstatus          # git status (deprecated; use :G)
:Git diff         # git diff
:Git blame        # git blame (interactive)
:Git log          # git log
:Git add %        # stage current file
:GBrowse          # open current file on GitHub

# In status buffer:
s    # stage file
u    # unstage file
cc   # commit
=    # toggle inline diff

# Conflict resolution:
:Gvdiffsplit!    # 3-way diff for conflict resolution`,
  },
  {
    heading: 'auto-pairs — Auto Bracket/Quote Pairs',
    body: 'Automatically insert matching pairs of brackets, quotes, etc.',
    tags: ['plugin', 'auto-pairs', 'editing'],
    codeSnippet: `# Automatic behavior:
(  → ()   with cursor between parens
[  → []   with cursor between brackets
{  → {}   with cursor between braces
"  → ""   with cursor between quotes
'  → ''   with cursor between quotes

# Key mappings:
<M-p>    # toggle auto-pairs
<M-e>    # fast wrap: wrap the word before cursor
<M-n>    # jump to next closed bracket

# Disable for specific filetypes (in vimrc):
let g:AutoPairsFiletypeBlacklist = ['markdown', 'text']`,
  },
  {
    heading: 'tabular.vim — Align Text',
    body: 'Vim script for text filtering and alignment. Align on any character.',
    tags: ['plugin', 'tabular', 'formatting'],
    codeSnippet: `:Tabularize /=      # align on = sign
:Tabularize /,      # align on comma
:Tabularize /|      # align on pipe (great for Markdown tables)
:Tabularize /:\\zs  # align on : but keep : with left column

# Visual mode: select lines first, then :Tabularize`,
  },
];
