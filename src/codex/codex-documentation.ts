export interface ManPageSection {
  title: string;
  content: string;
}

export interface ManPageData {
  name: string;
  synopsis: string;
  description: string;
  sections: ManPageSection[];
  examples: { command: string; description: string }[];
}

export const codexManPage: ManPageData = {
  name: 'codex',
  synopsis: 'codex [OPTIONS] [PROMPT]\ncodex [OPTIONS] <COMMAND> [ARGS]',
  description: `Codex CLI is an agentic coding tool from OpenAI that runs AI-powered coding agents in your terminal. It can read files, write code, run commands, and iterate on tasks autonomously.

Key capabilities:
- Interactive TUI agent sessions with full-auto execution options
- Non-interactive exec mode for CI/scripting
- Session resume and fork for continuing prior work
- Configurable sandbox policies (read-only → full disk access)
- MCP server integration for extended tool access
- Multiple authentication flows (ChatGPT login or API key)`,
  sections: [
    {
      title: 'Subcommands',
      content: `exec       Run Codex non-interactively (alias: e)
resume     Resume a previous interactive session
fork       Fork a previous interactive session
login      Manage login (subcommand: status)
logout     Remove stored credentials
mcp        Manage external MCP servers (list, add, remove, get)
mcp-server Start Codex as an MCP server (stdio)
sandbox    Run commands inside a Codex sandbox
review     Run a code review non-interactively
apply      Apply the latest diff as a git apply
cloud      Browse Codex Cloud tasks
app        Launch the Codex desktop app
completion Generate shell completion scripts`,
    },
    {
      title: 'Core Options',
      content: `-m, --model <MODEL>       Model to use (e.g. o4-mini, o3, gpt-4.1)
-s, --sandbox <MODE>      Sandbox policy: read-only | workspace-write | danger-full-access
-a, --ask-for-approval    Approval policy: untrusted | on-request | never
-p, --profile <PROFILE>   Config profile from ~/.codex/config.toml
-C, --cd <DIR>            Set agent working directory
-c, --config <key=value>  Override a config value (TOML dotted path)
--full-auto               Alias: -a on-request -s workspace-write
--search                  Enable live web search tool
--add-dir <DIR>           Extra writable directory
--no-alt-screen           Run TUI inline (no alternate screen)
-i, --image <FILE>        Attach image(s) to prompt`,
    },
    {
      title: 'Sandbox Modes',
      content: `read-only              Agent can only read files; cannot execute shell commands that modify files
workspace-write        Agent can write to the project workspace (recommended for most tasks)
danger-full-access     Full disk access; no sandboxing — use only in isolated environments`,
    },
    {
      title: 'Approval Policies',
      content: `untrusted       Only "trusted" commands run without approval (ls, cat, sed…)
on-request      Model decides when to request human approval
never           No approval prompts; failures returned immediately to the model`,
    },
    {
      title: 'Config (~/.codex/config.toml)',
      content: `model = "o4-mini"
sandbox_permissions = ["disk-full-read-access"]

[projects."/path/to/project"]
trust_level = "trusted"

[plugins."github@openai-curated"]
enabled = true

# Override at runtime:
codex -c model="o3" -c 'sandbox_permissions=["disk-full-read-access"]' "prompt"`,
    },
    {
      title: 'MCP Servers',
      content: `# Add stdio MCP server
codex mcp add my-server -- npx -y my-mcp-server --arg

# Add streamable HTTP MCP server
codex mcp add my-server --url https://example.com/mcp

# List configured servers
codex mcp list --json

# Remove a server
codex mcp remove my-server`,
    },
    {
      title: 'Authentication',
      content: `# Interactive ChatGPT login (opens browser)
codex login

# API key login via stdin
echo $OPENAI_API_KEY | codex login --with-api-key

# Device auth flow
codex login --device-auth

# Check login status
codex login status

# Remove credentials
codex logout`,
    },
  ],
  examples: [
    { command: 'codex "Fix the failing tests in src/"', description: 'Start interactive agent session' },
    { command: 'codex exec "Add error handling to all API routes"', description: 'Non-interactive exec mode' },
    { command: 'codex exec -m o3 -s workspace-write "Refactor auth module"', description: 'Exec with model + sandbox' },
    { command: 'codex --full-auto "Generate unit tests for utils.ts"', description: 'Full-auto mode (no approvals)' },
    { command: 'codex resume --last', description: 'Continue the most recent session' },
    { command: 'codex resume abc-session-id "Continue with auth"', description: 'Resume specific session with prompt' },
    { command: 'codex -m o4-mini -s read-only "Explain this codebase"', description: 'Read-only audit with fast model' },
    { command: 'codex --dangerously-bypass-approvals-and-sandbox "task"', description: 'DANGER: bypass all sandboxing' },
    { command: 'echo $OPENAI_API_KEY | codex login --with-api-key', description: 'Login via API key' },
    { command: 'codex mcp add github -- npx -y @modelcontextprotocol/server-github', description: 'Add GitHub MCP server' },
  ],
};

export function getCodexManPage(): ManPageData {
  return codexManPage;
}
