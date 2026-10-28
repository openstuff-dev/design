import type { Rule } from 'eslint';
import type { Options } from 'prettier';
import { createSyncFn } from 'synckit';
import prettierConfig from '../../prettier/index.js';

type FormatTemplate = (raw: string, depth: number, options: Options) => string;

// `overrides` is for Prettier's own config lookup, not for format().
const { overrides: _overrides, ...options } = prettierConfig;

let formatTemplate: FormatTemplate | undefined;

/** Starts the Prettier worker on first use, so files without templates stay fast. */
function formatSync(raw: string, depth: number): string {
  // From source (in tests) the worker is TypeScript, which Node runs by stripping types.
  const ext = import.meta.url.endsWith('.ts') ? '.ts' : '.js';
  formatTemplate ??= createSyncFn<FormatTemplate>(
    new URL(`./prettier-worker${ext}`, import.meta.url).pathname,
    { tsRunner: 'node' },
  );
  return formatTemplate(raw, depth, options);
}

/**
 * Formats the inline `template` of Angular components exactly as Prettier would.
 * ESLint Stylistic formats the rest of the file but can't look inside template strings.
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: { description: 'Format inline Angular templates with Prettier' },
    messages: { format: 'Format this template with Prettier (run ESLint with --fix).' },
    schema: [],
  },
  create(context) {
    return {
      'Decorator > CallExpression[callee.name="Component"] > ObjectExpression > Property[key.name="template"]'(
        property: Rule.Node,
      ) {
        if (property.type !== 'Property' || property.value.type !== 'TemplateLiteral') return;
        const literal = property.value;
        // Templates with ${} placeholders aren't plain HTML, so leave them alone.
        if (literal.expressions.length > 0) return;

        // Prettier indents by two, so the property sits at column 2, 4, 6, …
        const column = property.loc?.start.column ?? 0;
        if (column < 2 || column % 2 !== 0) return;

        const raw = context.sourceCode.getText(literal).slice(1, -1);
        const formatted = formatSync(raw, (column - 2) / 2);
        if (formatted === raw) return;

        const [start, end] = literal.range ?? [0, 0];
        context.report({
          node: literal,
          messageId: 'format',
          fix: (fixer) => fixer.replaceTextRange([start + 1, end - 1], formatted),
        });
      },
    };
  },
};

export default rule;
