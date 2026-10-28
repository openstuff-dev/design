import type { ESLint } from 'eslint';
import formatInlineTemplates from './rules/format-inline-templates.js';

/** OpenStuff's own ESLint rules, under the `@openstuff-dev` prefix. */
const plugin: ESLint.Plugin = {
  meta: { name: '@openstuff-dev/lint' },
  rules: { 'format-inline-templates': formatInlineTemplates },
};

export default plugin;
