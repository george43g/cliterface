import { type CommandResult, executeCommand } from '../yabai/yabai-service';

export type { CommandResult };

/**
 * bash-tests service
 * Builds and (stub) executes bash test expressions.
 */
export const bashTestsService = {
  /**
   * Execute a bash test expression via a stub shell invocation.
   * Returns exit-code 0 (true) or 1 (false), or an error for bad operands.
   */
  async evaluate(expression: string): Promise<CommandResult> {
    return executeCommand(`bash -c '${expression.replace(/'/g, "'\\''")} && echo true || echo false'`);
  },
};

// ── Test operator definitions ──────────────────────────────────────────────

export type TestKind = 'string' | 'numeric' | 'file' | 'logical';
export type ShellForm = '[[' | '[' | 'test' | '((';

export interface TestOperator {
  op: string;
  label: string;
  description: string;
  arity: 'unary' | 'binary';
  kind: TestKind;
  bashOnly?: boolean; // true → available in [[ ]] only (not POSIX [ ])
  arithOnly?: boolean; // true → (( )) / arithmetic context only
  posixDeprecated?: boolean; // true → works in [ ] but POSIX-deprecated
  leftLabel?: string;
  rightLabel?: string;
}

export const STRING_OPERATORS: TestOperator[] = [
  {
    op: '-z',
    label: '-z (empty)',
    description: 'True if the string has zero length.',
    arity: 'unary',
    kind: 'string',
    leftLabel: 'String',
  },
  {
    op: '-n',
    label: '-n (non-empty)',
    description: 'True if the string has non-zero length.',
    arity: 'unary',
    kind: 'string',
    leftLabel: 'String',
  },
  {
    op: '=',
    label: '= (equal, POSIX)',
    description: 'String equality. Portable in both [ ] and [[ ]].',
    arity: 'binary',
    kind: 'string',
    leftLabel: 'Left string',
    rightLabel: 'Right string',
  },
  {
    op: '==',
    label: '== (equal / glob)',
    description: 'In [ ] behaves like =. In [[ ]] the right-hand side is treated as a glob pattern (not a literal string).',
    arity: 'binary',
    kind: 'string',
    leftLabel: 'Left string',
    rightLabel: 'Right string / pattern',
  },
  {
    op: '!=',
    label: '!= (not equal)',
    description: 'True if strings are not equal. Works in both [ ] and [[ ]].',
    arity: 'binary',
    kind: 'string',
    leftLabel: 'Left string',
    rightLabel: 'Right string',
  },
  {
    op: '<',
    label: '< (lexically before)',
    description: 'True if left string sorts before right string lexicographically. Must be escaped (\\<) in [ ]; native in [[ ]].',
    arity: 'binary',
    kind: 'string',
    bashOnly: true,
    leftLabel: 'Left string',
    rightLabel: 'Right string',
  },
  {
    op: '>',
    label: '> (lexically after)',
    description: 'True if left string sorts after right string lexicographically. Must be escaped (\\>) in [ ]; native in [[ ]].',
    arity: 'binary',
    kind: 'string',
    bashOnly: true,
    leftLabel: 'Left string',
    rightLabel: 'Right string',
  },
  {
    op: '=~',
    label: '=~ (regex match)',
    description: 'True if left string matches the extended regular expression on the right. Available in [[ ]] only. Do NOT quote the regex.',
    arity: 'binary',
    kind: 'string',
    bashOnly: true,
    leftLabel: 'String',
    rightLabel: 'ERE pattern (unquoted)',
  },
];

export const NUMERIC_OPERATORS: TestOperator[] = [
  {
    op: '-eq',
    label: '-eq (equal)',
    description: 'True if both integers are equal. Use in [ ] or [[ ]].',
    arity: 'binary',
    kind: 'numeric',
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '-ne',
    label: '-ne (not equal)',
    description: 'True if integers are not equal.',
    arity: 'binary',
    kind: 'numeric',
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '-lt',
    label: '-lt (less than)',
    description: 'True if left integer is less than right.',
    arity: 'binary',
    kind: 'numeric',
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '-le',
    label: '-le (less than or equal)',
    description: 'True if left integer is less than or equal to right.',
    arity: 'binary',
    kind: 'numeric',
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '-gt',
    label: '-gt (greater than)',
    description: 'True if left integer is greater than right.',
    arity: 'binary',
    kind: 'numeric',
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '-ge',
    label: '-ge (greater than or equal)',
    description: 'True if left integer is greater than or equal to right.',
    arity: 'binary',
    kind: 'numeric',
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '==',
    label: '== (arithmetic equal)',
    description: 'Arithmetic equality inside (( )). Returns 0 (true) when equal.',
    arity: 'binary',
    kind: 'numeric',
    arithOnly: true,
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '!=',
    label: '!= (arithmetic not equal)',
    description: 'Arithmetic inequality inside (( )).',
    arity: 'binary',
    kind: 'numeric',
    arithOnly: true,
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '<',
    label: '< (arithmetic less)',
    description: 'Arithmetic less-than inside (( )). No quoting needed.',
    arity: 'binary',
    kind: 'numeric',
    arithOnly: true,
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '>',
    label: '> (arithmetic greater)',
    description: 'Arithmetic greater-than inside (( )). No quoting needed.',
    arity: 'binary',
    kind: 'numeric',
    arithOnly: true,
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '<=',
    label: '<= (arithmetic less/equal)',
    description: 'Arithmetic less-than-or-equal inside (( )).',
    arity: 'binary',
    kind: 'numeric',
    arithOnly: true,
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
  {
    op: '>=',
    label: '>= (arithmetic greater/equal)',
    description: 'Arithmetic greater-than-or-equal inside (( )).',
    arity: 'binary',
    kind: 'numeric',
    arithOnly: true,
    leftLabel: 'Left integer',
    rightLabel: 'Right integer',
  },
];

export const FILE_OPERATORS: TestOperator[] = [
  {
    op: '-e',
    label: '-e (exists)',
    description: 'True if the file exists (any type: regular, dir, symlink, etc.).',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-f',
    label: '-f (regular file)',
    description: 'True if the path is a regular file.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-d',
    label: '-d (directory)',
    description: 'True if the path is a directory.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-L',
    label: '-L (symlink)',
    description: 'True if the path is a symbolic link.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-r',
    label: '-r (readable)',
    description: 'True if the file is readable by the current process.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-w',
    label: '-w (writable)',
    description: 'True if the file is writable by the current process.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-x',
    label: '-x (executable)',
    description: 'True if the file is executable by the current process.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-s',
    label: '-s (size > 0)',
    description: 'True if the file exists and has a size greater than zero.',
    arity: 'unary',
    kind: 'file',
    leftLabel: 'Path',
  },
  {
    op: '-nt',
    label: '-nt (newer than)',
    description: 'True if left file was modified more recently than right file.',
    arity: 'binary',
    kind: 'file',
    leftLabel: 'Newer path',
    rightLabel: 'Older path',
  },
  {
    op: '-ot',
    label: '-ot (older than)',
    description: 'True if left file was modified less recently than right file.',
    arity: 'binary',
    kind: 'file',
    leftLabel: 'Older path',
    rightLabel: 'Newer path',
  },
  {
    op: '-ef',
    label: '-ef (same file)',
    description: 'True if both paths refer to the same inode (same device + inode number). Useful for detecting hard links.',
    arity: 'binary',
    kind: 'file',
    leftLabel: 'Path A',
    rightLabel: 'Path B',
  },
];

export const LOGICAL_OPERATORS: TestOperator[] = [
  {
    op: '!',
    label: '! (NOT)',
    description: 'Negate a test. Works in [ ], [[ ]], and test.',
    arity: 'unary',
    kind: 'logical',
    leftLabel: 'Expression',
  },
  {
    op: '&&',
    label: '&& (AND, [[ ]] / shell)',
    description: 'Short-circuit AND. In [[ ]] both sides are inside the brackets. Outside, combine two separate [ ] tests with && between them.',
    arity: 'binary',
    kind: 'logical',
    bashOnly: true,
    leftLabel: 'Left expression',
    rightLabel: 'Right expression',
  },
  {
    op: '||',
    label: '|| (OR, [[ ]] / shell)',
    description: 'Short-circuit OR. In [[ ]] both sides are inside the brackets. Outside, combine two separate [ ] tests with || between them.',
    arity: 'binary',
    kind: 'logical',
    bashOnly: true,
    leftLabel: 'Left expression',
    rightLabel: 'Right expression',
  },
  {
    op: '-a',
    label: '-a (AND in [ ], deprecated)',
    description: 'Logical AND inside a single [ ]. POSIX marks this as deprecated; prefer separate tests combined with &&.',
    arity: 'binary',
    kind: 'logical',
    posixDeprecated: true,
    leftLabel: 'Left expression',
    rightLabel: 'Right expression',
  },
  {
    op: '-o',
    label: '-o (OR in [ ], deprecated)',
    description: 'Logical OR inside a single [ ]. POSIX marks this as deprecated; prefer separate tests combined with ||.',
    arity: 'binary',
    kind: 'logical',
    posixDeprecated: true,
    leftLabel: 'Left expression',
    rightLabel: 'Right expression',
  },
];

export const ALL_OPERATORS: TestOperator[] = [...STRING_OPERATORS, ...NUMERIC_OPERATORS, ...FILE_OPERATORS, ...LOGICAL_OPERATORS];

// ── Expression builder helpers ─────────────────────────────────────────────

export interface BuilderState {
  shellForm: ShellForm;
  kind: TestKind;
  operatorOp: string;
  leftOperand: string;
  rightOperand: string;
}

/** Build the shell expression string from the current builder state. */
export function buildExpression(state: BuilderState): string {
  const { shellForm, kind, operatorOp, leftOperand, rightOperand } = state;

  const op = ALL_OPERATORS.find(o => o.op === operatorOp && o.kind === kind);
  if (!op) return '';

  // (( )) arithmetic form
  if (shellForm === '((' || op.arithOnly) {
    const left = leftOperand || 'a';
    const right = rightOperand || 'b';
    if (op.arity === 'binary') {
      return `(( ${left} ${operatorOp} ${right} ))`;
    }
    return `(( ${operatorOp} ${left} ))`;
  }

  // test builtin form
  if (shellForm === 'test') {
    if (op.arity === 'unary') {
      return `test ${operatorOp} "${leftOperand || 'value'}"`;
    }
    return `test "${leftOperand || 'a'}" ${operatorOp} "${rightOperand || 'b'}"`;
  }

  // [[ ]] double-bracket form
  if (shellForm === '[[') {
    if (op.arity === 'unary') {
      return `[[ ${operatorOp} "${leftOperand || 'value'}" ]]`;
    }
    // =~ special: right side unquoted
    if (operatorOp === '=~') {
      return `[[ "${leftOperand || 'hello'}" =~ ${rightOperand || '^h'} ]]`;
    }
    return `[[ "${leftOperand || 'a'}" ${operatorOp} "${rightOperand || 'b'}" ]]`;
  }

  // [ ] POSIX single-bracket form (default)
  if (op.arity === 'unary') {
    return `[ ${operatorOp} "${leftOperand || 'value'}" ]`;
  }
  return `[ "${leftOperand || 'a'}" ${operatorOp} "${rightOperand || 'b'}" ]`;
}

/** Return a human-readable note about shell compatibility for the current state. */
export function compatibilityNote(op: TestOperator, shellForm: ShellForm): string {
  if (op.arithOnly) {
    return 'Only valid inside (( )) arithmetic context.';
  }
  if (op.bashOnly && (shellForm === '[' || shellForm === 'test')) {
    return `Warning: "${op.op}" is a Bash extension — not available in POSIX [ ] or the test builtin.`;
  }
  if (op.posixDeprecated && shellForm === '[') {
    return `Note: "${op.op}" is POSIX-deprecated inside [ ]. Prefer combining two separate tests with && or ||.`;
  }
  if (shellForm === '[[') {
    return 'Using [[ ]] (Bash/ksh). Not POSIX-portable but avoids word-splitting and glob pitfalls.';
  }
  if (shellForm === '[' || shellForm === 'test') {
    return 'Using POSIX-portable [ ] / test. Always quote variables to prevent word-splitting.';
  }
  return '';
}
