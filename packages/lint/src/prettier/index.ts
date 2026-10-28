import type { Config } from 'prettier';

/**
 * Prettier options for Angular templates. ESLint Stylistic formats TypeScript and
 * JavaScript, so Prettier only formats templates (through the
 * `@openstuff-dev/format-inline-templates` rule) and `.html` files.
 */
const config: Config = {
  printWidth: 100,
  singleQuote: true,
  overrides: [{ files: '*.html', options: { parser: 'angular' } }],
};

export default config;
