/**
 * Command compatibility engine
 * Determines which CLI options are compatible with current selections
 */

export interface CompatibilityRule {
  when: string[]; // Required flags/values that must be present
  incompatible?: string[]; // Options that become incompatible
  requires?: string[]; // Options that become required
  suggests?: string[]; // Options that are suggested
}

export interface CommandContext {
  command: string;
  flags: Set<string>;
  values: Map<string, string>;
}

/**
 * Compatibility engine for analyzing command combinations
 */
export class CompatibilityEngine {
  private rules = new Map<string, CompatibilityRule[]>();

  registerRules(tool: string, rules: CompatibilityRule[]): void {
    this.rules.set(tool, rules);
  }

  analyze(
    context: CommandContext,
    tool: string,
  ): {
    compatible: Set<string>;
    incompatible: Set<string>;
    required: Set<string>;
    suggested: Set<string>;
  } {
    const toolRules = this.rules.get(tool) || [];
    const compatible = new Set<string>();
    const incompatible = new Set<string>();
    const required = new Set<string>();
    const suggested = new Set<string>();

    // Check each rule
    for (const rule of toolRules) {
      const conditionsMet = rule.when.every(cond => context.flags.has(cond) || Array.from(context.values.keys()).some(k => k === cond || k.startsWith(cond)));

      if (conditionsMet) {
        // Mark incompatible options
        rule.incompatible?.forEach(opt => incompatible.add(opt));
        // Mark required options
        rule.requires?.forEach(opt => required.add(opt));
        // Mark suggested options
        rule.suggests?.forEach(opt => suggested.add(opt));
      }
    }

    // Everything not marked incompatible is compatible
    // (This is a simplified approach - real logic would be more complex)

    return { compatible, incompatible, required, suggested };
  }

  /**
   * Check if a specific option is compatible given current context
   */
  isCompatible(option: string, context: CommandContext, tool: string): boolean {
    const analysis = this.analyze(context, tool);
    return !analysis.incompatible.has(option);
  }

  /**
   * Get explanation for why an option is incompatible
   */
  getIncompatibilityReason(option: string, context: CommandContext, tool: string): string | undefined {
    const toolRules = this.rules.get(tool) || [];

    for (const rule of toolRules) {
      const conditionsMet = rule.when.every(cond => context.flags.has(cond) || Array.from(context.values.keys()).some(k => k === cond || k.startsWith(cond)));

      if (conditionsMet && rule.incompatible?.includes(option)) {
        return `Incompatible with: ${rule.when.join(', ')}`;
      }
    }

    return undefined;
  }
}

export const compatibilityEngine = new CompatibilityEngine();

/**
 * Common compatibility rules for CLI tools
 */
export const commonRules: Record<string, CompatibilityRule[]> = {
  git: [
    { when: ['--force'], suggests: ['--no-verify'] },
    { when: ['rebase'], incompatible: ['merge'] },
    { when: ['--amend'], suggests: ['--no-edit'] },
  ],
  docker: [
    { when: ['--detach', '-d'], incompatible: ['--interactive', '-i'] },
    { when: ['--rm'], suggests: ['--name'] },
    { when: ['--network=host'], incompatible: ['--publish', '-p'] },
  ],
  jq: [
    { when: ['--raw-output', '-r'], suggests: ['--compact-output', '-c'] },
    { when: ['--null-input', '-n'], incompatible: ['--arg', '--argjson'] },
    { when: ['--slurp', '-s'], incompatible: ['--stream'] },
  ],
  yabai: [
    { when: ['--toggle'], requires: ['float', 'sticky', 'pip', 'shadow'] },
    { when: ['--display'], suggests: ['--focus'] },
    { when: ['--close'], incompatible: ['--minimize'] },
  ],
};

// Register common rules
for (const [tool, rules] of Object.entries(commonRules)) {
  compatibilityEngine.registerRules(tool, rules);
}
