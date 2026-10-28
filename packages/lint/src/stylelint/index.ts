import type { Config } from 'stylelint';

/** Colour functions that only the token files may use. Components use `var(--os-*)`. */
const COLOR_FUNCTIONS = [
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
  'color-mix',
];

/** Where viewport width queries are allowed: page layout, not components. */
export const LAYOUT_FILES = ['**/layout/**/*.{css,scss}', '**/*.layout.{css,scss}'];

/** Where raw colours are allowed. */
export const TOKEN_FILES = ['**/tokens/**/*.{css,scss}', '**/*.tokens.{css,scss}'];

/**
 * The shared Stylelint setup: the standard rules, Stylistic for formatting, and the
 * OpenStuff rules for themes and layout:
 *
 * - No raw colours outside token files. Use `--os-*` tokens.
 * - No `@media (prefers-color-scheme)`. Tokens switch themes with `light-dark()`.
 * - Viewport width queries only in layout files. Components use `@container`.
 *
 * ```js
 * // stylelint.config.js
 * export default { extends: ['@openstuff-dev/lint/stylelint'] };
 * ```
 */
const config: Config = {
  extends: ['stylelint-config-standard', '@stylistic/stylelint-config'],
  rules: {
    '@stylistic/string-quotes': 'single',
    '@stylistic/max-line-length': 100,
    // How the token generator writes colours: oklch(0.99 0.004 160).
    'lightness-notation': 'number',
    'hue-degree-notation': 'number',
    'color-no-hex': [true, { message: 'Use a colour token (var(--os-…)) instead of a hex colour.' }],
    'color-named': ['never', { message: 'Use a colour token (var(--os-…)) instead of a named colour.' }],
    'function-disallowed-list': [
      COLOR_FUNCTIONS,
      { message: (name: string) => `Use a colour token (var(--os-…)) instead of ${name}().` },
    ],
    'media-feature-name-disallowed-list': [
      ['prefers-color-scheme', 'width', 'min-width', 'max-width'],
      {
        message: (name: string) =>
          name === 'prefers-color-scheme'
            ? 'Themes come from light-dark() in the tokens; don\'t add prefers-color-scheme blocks.'
            : 'Components respond to their container: use @container. Viewport width queries belong in layout files.',
      },
    ],
  },
  overrides: [
    {
      files: TOKEN_FILES,
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
      },
    },
    {
      files: LAYOUT_FILES,
      rules: {
        'media-feature-name-disallowed-list': [['prefers-color-scheme']],
      },
    },
  ],
};

export default config;
