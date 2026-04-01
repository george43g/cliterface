/**
 * Centralized tooltip and documentation registry
 * Provides explanations for CLI commands, flags, and arguments
 */

export interface TooltipData {
  title: string;
  description: string;
  examples?: string[];
  seeAlso?: string[];
  category?: 'command' | 'flag' | 'argument' | 'value';
}

export interface ManPageData {
  name: string;
  synopsis: string;
  description: string;
  sections: {
    title: string;
    content: string;
  }[];
  examples: {
    command: string;
    description: string;
  }[];
}

/**
 * Generic documentation registry
 */
class DocumentationRegistry {
  private tooltips = new Map<string, TooltipData>();
  private manPages = new Map<string, ManPageData>();

  registerTooltip(key: string, data: TooltipData): void {
    this.tooltips.set(key, data);
  }

  getTooltip(key: string): TooltipData | undefined {
    return this.tooltips.get(key);
  }

  registerManPage(tool: string, data: ManPageData): void {
    this.manPages.set(tool, data);
  }

  getManPage(tool: string): ManPageData | undefined {
    return this.manPages.get(tool);
  }

  searchTooltips(query: string): Array<{ key: string; data: TooltipData }> {
    const results: Array<{ key: string; data: TooltipData }> = [];
    const lowerQuery = query.toLowerCase();

    for (const [key, data] of this.tooltips) {
      if (key.toLowerCase().includes(lowerQuery) || data.title.toLowerCase().includes(lowerQuery) || data.description.toLowerCase().includes(lowerQuery)) {
        results.push({ key, data });
      }
    }

    return results;
  }

  getAllForTool(tool: string): Array<{ key: string; data: TooltipData }> {
    const results: Array<{ key: string; data: TooltipData }> = [];
    const prefix = `${tool}.`;

    for (const [key, data] of this.tooltips) {
      if (key.startsWith(prefix)) {
        results.push({ key, data });
      }
    }

    return results;
  }
}

export const registry = new DocumentationRegistry();

/**
 * Helper to batch register tooltips for a tool
 */
export function registerToolTips(tool: string, tooltips: Record<string, Omit<TooltipData, 'category'>>): void {
  for (const [key, data] of Object.entries(tooltips)) {
    registry.registerTooltip(`${tool}.${key}`, {
      ...data,
      category: inferCategory(key),
    });
  }
}

function inferCategory(key: string): TooltipData['category'] {
  if (key.startsWith('--') || key.startsWith('-')) return 'flag';
  if (['name', 'path', 'file', 'dir', 'url', 'host', 'port'].some(s => key.includes(s))) {
    return 'argument';
  }
  return 'command';
}

/**
 * Get explanation for a command segment
 */
export function getSegmentExplanation(tool: string, segment: string, context?: string): TooltipData | undefined {
  // Try exact match first
  const exact = registry.getTooltip(`${tool}.${segment}`);
  if (exact) return exact;

  // Try with context
  if (context) {
    const contextual = registry.getTooltip(`${tool}.${context}.${segment}`);
    if (contextual) return contextual;
  }

  // Try partial matches
  const allTooltips = registry.getAllForTool(tool);
  for (const { key, data } of allTooltips) {
    if (key.endsWith(`.${segment}`) || segment.includes(key.split('.').pop() || '')) {
      return data;
    }
  }

  return undefined;
}
