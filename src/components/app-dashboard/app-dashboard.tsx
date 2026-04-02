import { Component, h, State } from '@stencil/core';

interface ToolInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  version?: string;
  status: 'available' | 'coming-soon' | 'beta';
}

@Component({
  tag: 'app-dashboard',
  styleUrl: 'app-dashboard.css',
  scoped: true,
})
export class AppDashboard {
  @State() selectedTool: string | null = null;

  private tools: ToolInfo[] = [
    {
      id: 'yabai',
      name: 'yabai',
      description: 'Window manager for macOS',
      icon: '🪟',
      version: 'v7.1.17',
      status: 'available',
    },
    {
      id: 'jq',
      name: 'jq',
      description: 'Command-line JSON processor',
      icon: '📋',
      status: 'available',
    },
    {
      id: 'sed',
      name: 'sed',
      description: 'Stream editor for text processing',
      icon: '📝',
      status: 'available',
    },
    {
      id: 'docker',
      name: 'Docker',
      description: 'Container management',
      icon: '🐳',
      status: 'coming-soon',
    },
    {
      id: 'git',
      name: 'Git',
      description: 'Version control',
      icon: '📦',
      status: 'coming-soon',
    },
    {
      id: 'ssh',
      name: 'SSH',
      description: 'Remote connection manager',
      icon: '🔐',
      status: 'coming-soon',
    },
    {
      id: 'firebase',
      name: 'Firebase',
      description: 'Firebase CLI tools',
      icon: '🔥',
      status: 'coming-soon',
    },
  ];

  selectTool(toolId: string): void {
    this.selectedTool = toolId;
  }

  goBack(): void {
    this.selectedTool = null;
  }

  renderToolCardContent(tool: ToolInfo): Element {
    return (
      <>
        <div class="flex items-start justify-between mb-2">
          <span class="text-3xl">{tool.icon}</span>
          {tool.version && <span class="text-xs text-text2 bg-bg3 px-2 py-1 rounded-md">{tool.version}</span>}
        </div>
        <h3 class="text-lg font-semibold mb-1">{tool.name}</h3>
        <p class="text-text2 text-sm">{tool.description}</p>
        {tool.status !== 'available' && (
          <span class="inline-block mt-2 text-xs px-2 py-1 rounded-md bg-accent2 text-white">{tool.status === 'coming-soon' ? 'Coming Soon' : 'Beta'}</span>
        )}
      </>
    );
  }

  renderToolCard(tool: ToolInfo): Element {
    const isAvailable = tool.status === 'available';
    const cardClass = `tool-card ${!isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:border-accent'}`;

    if (isAvailable) {
      return (
        <button key={tool.id} type="button" class={cardClass} onClick={() => this.selectTool(tool.id)}>
          {this.renderToolCardContent(tool)}
        </button>
      );
    }

    return (
      <div key={tool.id} class={cardClass}>
        {this.renderToolCardContent(tool)}
      </div>
    );
  }

  renderDashboard(): Element {
    return (
      <div class="dashboard">
        <header class="mb-8">
          <h1 class="text-3xl mb-2">Cliterface</h1>
          <p class="text-text2">Visual interface for command-line tools</p>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{this.tools.map(tool => this.renderToolCard(tool))}</div>

        <footer class="mt-12 text-text2 text-sm">
          <p>Select a tool to launch its visual interface</p>
        </footer>
      </div>
    );
  }

  renderToolInterface(): Element {
    switch (this.selectedTool) {
      case 'yabai':
        return <yabai-gui />;
      case 'jq':
        return <jq-gui />;
      case 'sed':
        return <sed-gui />;
      default:
        return (
          <div class="p-8 text-center">
            <p class="text-text2">Tool interface not yet implemented</p>
            <button type="button" class="mt-4 px-4 py-2 bg-accent2 text-white rounded-lg hover:bg-accent transition-colors" onClick={() => this.goBack()}>
              ← Back to Dashboard
            </button>
          </div>
        );
    }
  }

  render() {
    return (
      <div class="min-h-screen p-4">
        {this.selectedTool ? (
          <div>
            <button type="button" class="mb-4 px-3 py-1.5 text-sm bg-accent2 text-white rounded-lg hover:bg-accent transition-colors" onClick={() => this.goBack()}>
              ← Back
            </button>
            {this.renderToolInterface()}
          </div>
        ) : (
          this.renderDashboard()
        )}
      </div>
    );
  }
}
