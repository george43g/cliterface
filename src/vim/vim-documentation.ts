/**
 * Supplementary documentation text for the vim-gui reference interface.
 * Sourced from `man vim`, `:help`, and the neovim docs.
 */

export interface DocSection {
  title: string;
  content: string;
}

export interface VimDocPage {
  name: string;
  synopsis: string;
  description: string;
  sections: DocSection[];
}

export function getVimDocPage(): VimDocPage {
  return {
    name: 'vim / nvim — modal text editor',
    synopsis: 'vim [options] [file...]   |   nvim [options] [file...]',
    description:
      'Vim is a highly configurable, modal text editor. Its central insight is that most editing time is spent navigating and modifying, not inserting — so the default mode is Normal mode (commands) rather than Insert mode (typing). This modal design enables extremely efficient editing once the keystrokes become muscle memory.',
    sections: [
      {
        title: 'Key philosophy',
        content: `Vim commands compose:  [count] [operator] [motion / text-object]

  5dw   — delete 5 words
  ci"   — change inside quotes
  >i{   — indent inside braces
  y3j   — yank 4 lines

Learn operators (d, c, y, >, <, =, g~, gu, gU) and motions
separately — you get their product for free.`,
      },
      {
        title: 'The . (dot) command',
        content: `. repeats the last change. Combined with motions and macros,
it multiplies your edits with minimal keystrokes.

  ciwfoo<Esc>   — change word to "foo"
  ww.           — move two words, repeat the change`,
      },
      {
        title: 'Registers deep dive',
        content: `Vim has 26 named registers (a–z), a clipboard (+), a primary
selection (*), a black-hole register (_), and special read-only
registers (%, /, :, .).

  "ayy      — yank line into register a
  "ap       — paste from register a
  "+p       — paste from system clipboard
  "0p       — paste last yank (not affected by deletes)
  :reg      — inspect register contents`,
      },
      {
        title: 'Macro workflow',
        content: `Macros record and replay any sequence of Normal / Insert / Ex
commands. They are stored in registers.

  qq         — start recording into register q
  <do stuff>
  q          — stop recording
  @q         — replay
  100@q      — replay 100 times
  :norm @q   — apply to each selected line`,
      },
      {
        title: 'nvim differences',
        content: `Neovim (nvim) is a Vim fork with a cleaner codebase and modern
features. Key additions:
  - Built-in LSP client (:LspInfo, vim.lsp.*)
  - Lua config (~/.config/nvim/init.lua)
  - :terminal with <C-\\><C-n> to exit terminal mode
  - Floating windows and richer UI API
  - --clean flag to start without any config
  - Treesitter syntax highlighting built-in
  - Async job control

Most vim keybindings work identically in nvim.`,
      },
    ],
  };
}
