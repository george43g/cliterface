import { Component, h, State } from '@stencil/core';
import { COMPARISON_DOC, type DocTab, FILE_DOC, LOGICAL_DOC, NUMERIC_DOC, STRING_DOC } from '../../bash-tests/bash-tests-documentation';
import {
  ALL_OPERATORS,
  buildExpression,
  compatibilityNote,
  FILE_OPERATORS,
  LOGICAL_OPERATORS,
  NUMERIC_OPERATORS,
  type ShellForm,
  STRING_OPERATORS,
  type TestKind,
  type TestOperator,
} from '../../bash-tests/bash-tests-service';

// ── Tab ids ────────────────────────────────────────────────────────────────
type TabId = 'string' | 'numeric' | 'file' | 'logical' | 'comparison' | 'builder';

const TABS: { id: TabId; label: string }[] = [
  { id: 'string', label: 'String' },
  { id: 'numeric', label: 'Numeric' },
  { id: 'file', label: 'File' },
  { id: 'logical', label: 'Logical' },
  { id: 'comparison', label: '[[ vs [ vs ((' },
  { id: 'builder', label: 'Builder' },
];

// ── Default builder state ──────────────────────────────────────────────────
const DEFAULT_KIND: TestKind = 'string';
const DEFAULT_SHELL: ShellForm = '[[';
const DEFAULT_OP = '-z';

@Component({
  tag: 'bash-tests-gui',
  styleUrl: 'bash-tests-gui.css',
  scoped: true,
})
export class BashTestsGui {
  // Tab navigation
  @State() activeTab: TabId = 'string';

  // Builder state
  @State() builderKind: TestKind = DEFAULT_KIND;
  @State() builderShell: ShellForm = DEFAULT_SHELL;
  @State() builderOp: string = DEFAULT_OP;
  @State() builderLeft = '';
  @State() builderRight = '';

  // Derived copy state
  @State() copyLabel = 'Copy';

  // ── helpers ──────────────────────────────────────────────────────────────

  private operatorsForKind(kind: TestKind): TestOperator[] {
    switch (kind) {
      case 'string':
        return STRING_OPERATORS;
      case 'numeric':
        return NUMERIC_OPERATORS;
      case 'file':
        return FILE_OPERATORS;
      case 'logical':
        return LOGICAL_OPERATORS;
    }
  }

  private currentOperator(): TestOperator | undefined {
    return ALL_OPERATORS.find(o => o.op === this.builderOp && o.kind === this.builderKind);
  }

  private builtExpression(): string {
    return buildExpression({
      shellForm: this.builderShell,
      kind: this.builderKind,
      operatorOp: this.builderOp,
      leftOperand: this.builderLeft,
      rightOperand: this.builderRight,
    });
  }

  private handleKindChange(kind: TestKind): void {
    this.builderKind = kind;
    // Reset operator to the first one for this kind
    const ops = this.operatorsForKind(kind);
    this.builderOp = ops[0]?.op ?? '';
    this.builderLeft = '';
    this.builderRight = '';
  }

  private handleOpChange(op: string): void {
    this.builderOp = op;
    this.builderLeft = '';
    this.builderRight = '';
  }

  private async copyExpression(): Promise<void> {
    const expr = this.builtExpression();
    if (!expr) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(expr);
    }
    this.copyLabel = 'Copied!';
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.copyLabel = 'Copy';
      }, 1800);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  private renderTabs() {
    return (
      <div class="border-b border-accent2 mb-5 flex flex-wrap gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
            onClick={() => {
              this.activeTab = tab.id;
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  /** Shared cheatsheet renderer for string / numeric / file / logical docs */
  private renderDocTab(doc: DocTab) {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <p class="text-text2 text-sm mb-5">{doc.intro}</p>
          {doc.sections.map((sec, i) => (
            <div key={i} class="mb-6">
              <h3 class="text-base font-semibold mb-2 text-info">{sec.title}</h3>
              <pre class="cli-output text-xs leading-relaxed">{sec.content}</pre>
              {sec.examples && sec.examples.length > 0 && (
                <div class="mt-3 space-y-2">
                  {sec.examples.map((ex, j) => (
                    <div key={j} class="flex items-start gap-3 p-2 bg-bg3 rounded-lg">
                      <code class="font-mono text-xs text-success flex-shrink-0">{ex.expr}</code>
                      <span class="text-text2 text-xs">{ex.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  private renderComparisonTab() {
    return this.renderDocTab(COMPARISON_DOC);
  }

  private renderBuilderTab() {
    const ops = this.operatorsForKind(this.builderKind);
    const currentOp = this.currentOperator();
    const expr = this.builtExpression();
    const note = currentOp ? compatibilityNote(currentOp, this.builderShell) : '';
    const isBinary = currentOp?.arity === 'binary';
    const leftLabel = currentOp?.leftLabel ?? 'Operand';
    const rightLabel = currentOp?.rightLabel ?? 'Right operand';

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Left panel: controls ── */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-4">Build a Test Expression</h3>

          {/* Shell form */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Shell form
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.builderShell = (e.target as HTMLSelectElement).value as ShellForm;
              }}
            >
              <option value="[[" selected={this.builderShell === '[['}>
                {'[[ ]] — Bash double-bracket (recommended)'}
              </option>
              <option value="[" selected={this.builderShell === '['}>
                {'[ ] — POSIX single-bracket'}
              </option>
              <option value="test" selected={this.builderShell === 'test'}>
                test — POSIX test builtin
              </option>
              <option value="((" selected={this.builderShell === '(('}>
                {'(( )) — Arithmetic (numeric only)'}
              </option>
            </select>
          </label>

          {/* Test kind */}
          <div class="flex flex-col gap-1 text-sm text-text2 mb-4">
            <span>Test kind</span>
            <div class="flex gap-2 flex-wrap">
              {(['string', 'numeric', 'file', 'logical'] as TestKind[]).map(k => (
                <button key={k} type="button" class={`cli-btn cli-btn-sm ${this.builderKind === k ? 'cli-btn-info' : ''}`} onClick={() => this.handleKindChange(k)}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Operator */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Operator
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.handleOpChange((e.target as HTMLSelectElement).value);
              }}
            >
              {ops.map(op => (
                <option key={op.op} value={op.op} selected={this.builderOp === op.op}>
                  {op.label}
                </option>
              ))}
            </select>
            {currentOp && <span class="text-xs text-text2 mt-1">{currentOp.description}</span>}
          </label>

          {/* Left operand */}
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            {leftLabel}
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder={`e.g. $myvar`}
              value={this.builderLeft}
              onInput={(e: Event) => {
                this.builderLeft = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          {/* Right operand (binary ops only) */}
          {isBinary && (
            <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
              {rightLabel}
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder={`e.g. expected`}
                value={this.builderRight}
                onInput={(e: Event) => {
                  this.builderRight = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          )}

          {/* Badge row */}
          <div class="flex flex-wrap gap-2 mt-2">
            {currentOp?.bashOnly && <span class="cli-badge-sip">Bash-only</span>}
            {currentOp?.arithOnly && <span class="cli-badge-sip">Arith-only</span>}
            {currentOp?.posixDeprecated && <span class="cli-badge-sip">POSIX deprecated</span>}
            {!currentOp?.bashOnly && !currentOp?.arithOnly && <span class="cli-badge-safe">POSIX portable</span>}
          </div>
        </div>

        {/* ── Right panel: preview ── */}
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Expression Preview</h3>

          {/* Live expression */}
          <div class="cli-cmd-preview mb-4">
            <span class="text-success font-mono text-sm">{expr || '—'}</span>
          </div>

          {/* Copy */}
          <button type="button" class="cli-btn cli-btn-sm cli-btn-success mb-4" onClick={() => this.copyExpression()}>
            {this.copyLabel}
          </button>

          {/* Compatibility note */}
          {note && <div class="p-3 bg-bg3 rounded-lg mb-4 text-xs text-warning leading-relaxed">{note}</div>}

          {/* Usage snippet */}
          {expr && (
            <div class="mt-4">
              <h4 class="text-sm text-text2 mb-2">Usage in a script</h4>
              <pre class="cli-output text-xs">{`if ${expr}; then
  echo "Test passed"
else
  echo "Test failed"
fi`}</pre>
            </div>
          )}

          {/* Tips for the selected operator */}
          {currentOp && (
            <div class="mt-4">
              <h4 class="text-sm text-text2 mb-2">Quick tips</h4>
              <ul class="list-disc list-inside text-xs text-text2 space-y-1">
                {currentOp.bashOnly && (
                  <li>
                    Not available in POSIX <code>[ ]</code> — use <code>{'[[ ]]'}</code> or switch operator.
                  </li>
                )}
                {currentOp.arithOnly && (
                  <li>
                    Only meaningful inside <code>{'(( ))'}</code> arithmetic context.
                  </li>
                )}
                {currentOp.posixDeprecated && (
                  <li>
                    POSIX-deprecated: combine separate tests with <code>{'&&'}</code> or <code>{'||'}</code> at the shell level instead.
                  </li>
                )}
                {currentOp.op === '==' && currentOp.kind === 'string' && (
                  <li>
                    In <code>{'[[ ]]'}</code> the right-hand side is a glob pattern — quote it to force a literal comparison.
                  </li>
                )}
                {currentOp.op === '=~' && (
                  <li>
                    Do <strong>not</strong> quote the regex pattern — quoting turns it into a literal string match.
                  </li>
                )}
                {(currentOp.op === '-z' || currentOp.op === '-n') && (
                  <li>
                    In <code>[ ]</code> always quote: <code>{`[ ${currentOp.op} "$var" ]`}</code> — an unset variable would leave the operator alone.
                  </li>
                )}
                {currentOp.kind === 'file' && (
                  <li>
                    Follows symlinks (except <code>-L</code>). To test the link itself, use <code>-L</code>.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* ── Full-width: operator reference grid ── */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-text2 text-base mb-3">All {this.builderKind.charAt(0).toUpperCase() + this.builderKind.slice(1)} Operators</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ops.map(op => (
              <button
                key={op.op + op.kind}
                type="button"
                class={`text-left p-3 rounded-lg border transition-colors ${this.builderOp === op.op ? 'border-accent bg-bg3' : 'border-accent2 bg-bg2 hover:border-accent'}`}
                onClick={() => this.handleOpChange(op.op)}
              >
                <div class="flex items-center gap-2 mb-1">
                  <code class="font-mono text-xs text-success">{op.op}</code>
                  {op.bashOnly && <span class="text-xs px-1 rounded bg-warning text-bg font-semibold">bash</span>}
                  {op.arithOnly && <span class="text-xs px-1 rounded bg-info text-bg font-semibold">arith</span>}
                  {op.posixDeprecated && <span class="text-xs px-1 rounded bg-danger text-white font-semibold">deprecated</span>}
                </div>
                <div class="text-xs text-text2 leading-relaxed">{op.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-5">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🧪</span> bash tests
          </h2>
          <p class="text-text2 text-sm">
            <code class="font-mono">{'[[ ]]'}</code> test expressions cheatsheet &amp; builder
          </p>
        </header>

        {this.renderTabs()}

        <div class="tab-content">
          {this.activeTab === 'string' && this.renderDocTab(STRING_DOC)}
          {this.activeTab === 'numeric' && this.renderDocTab(NUMERIC_DOC)}
          {this.activeTab === 'file' && this.renderDocTab(FILE_DOC)}
          {this.activeTab === 'logical' && this.renderDocTab(LOGICAL_DOC)}
          {this.activeTab === 'comparison' && this.renderComparisonTab()}
          {this.activeTab === 'builder' && this.renderBuilderTab()}
        </div>
      </div>
    );
  }
}
