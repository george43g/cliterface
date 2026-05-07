// Curated from Obsidian vault: yabai.md (96 lines)
// Note: yabai.md in vault is the upstream project README.
// Content extracted: the requirements/caveats table which is the
// most practically useful reference for day-to-day setup troubleshooting.

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const YABAI_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Yabai — System Requirements',
    body: 'Operating system requirements per architecture.',
    tags: ['requirements', 'setup'],
    codeSnippet: `Intel x86-64:    Big Sur 11.0+, Monterey 12.0+, Ventura 13.0+, Sonoma 14.0+, Sequoia 15.0+
Apple Silicon:   Monterey 12.0+, Ventura 13.0+, Sonoma 14.0+, Sequoia 15.0+, Tahoe 26.0+

Accessibility API:  Must be granted in System Settings (required)
Screen Recording:   Required only if window animations are enabled`,
  },
  {
    heading: 'Yabai — Required System Settings',
    body: 'macOS settings that must be configured for yabai to work reliably.',
    tags: ['setup', 'macos', 'gotcha'],
    codeSnippet: `# macOS 13.x, 14.x, 15.x — in Desktop & Dock tab:
"Displays have separate Spaces" → ENABLE  (Mission Control pane)
"Automatically rearrange Spaces based on most recent use" → DISABLE

# macOS 14.x, 15.x — additional settings:
"Show Items On Desktop" → ENABLE  (Desktop & Stage Manager pane)
"Click wallpaper to reveal Desktop" → set to "Only in Stage Manager"`,
  },
  {
    heading: 'Yabai — SIP and Scripting Addition',
    body: 'System Integrity Protection can optionally be partially disabled to enable the scripting addition for elevated window control.',
    tags: ['setup', 'sip', 'scripting-addition'],
    codeSnippet: `# The scripting addition (injected into Dock.app) enables:
# - Control of the window server
# - Features requiring elevated privileges

# Without SIP partially disabled, some yabai features are unavailable
# (e.g., moving windows between spaces, opacity changes, shadows).

# Proceed at your own risk. See the yabai wiki for SIP disabling instructions.
# This is OPTIONAL — yabai works without it but with reduced capabilities.`,
  },
  {
    heading: 'Yabai — Known Caveats',
    body: 'Common issues to be aware of when using yabai.',
    tags: ['gotcha', 'caveats'],
    codeSnippet: `Code signing:     When building from source or installing from HEAD,
                  codesign the binary to retain accessibility/automation privileges.

Finder Desktop:   Do NOT disable the Finder Desktop window.
                  If disabled, use: defaults write com.apple.finder CreateDesktop -bool true

NSDocument tabs:  Terminal, Finder, and similar apps with native macOS tabs
                  do not behave correctly with yabai tab creation.
                  Avoid tabbed windows in these apps, or make them float via rules.`,
  },
  {
    heading: 'Yabai — Quick Reference Commands',
    body: 'Common yabai query and window management commands.',
    tags: ['commands', 'reference'],
    codeSnippet: `# Query state
yabai -m query --windows        # list all windows as JSON
yabai -m query --spaces         # list all spaces as JSON
yabai -m query --displays       # list all displays as JSON

# Window management
yabai -m window --focus <id>    # focus a window
yabai -m window --move rel:<x>:<y>  # move window relatively
yabai -m window --resize right:50:0  # resize window right by 50px
yabai -m window --toggle float  # toggle float/tile for current window
yabai -m window --toggle zoom-fullscreen  # fullscreen toggle

# Space management
yabai -m space --focus <index>  # focus a space
yabai -m space --create         # create a new space
yabai -m space --destroy        # destroy the focused space
yabai -m space --layout bsp     # set BSP tiling layout
yabai -m space --layout float   # set float layout
yabai -m space --layout stack   # set stack layout`,
  },
];
