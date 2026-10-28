import nx from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The shared ESLint setup for every OpenStuff project: strict, type-checked
 * TypeScript, ESLint Stylistic for formatting, and Nx module boundaries.
 *
 * ```js
 * // eslint.config.js
 * export { default } from '@openstuff-dev/lint/eslint';
 * ```
 */
const SCRIPTS = '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}';

const formatting = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: true,
  braceStyle: '1tbs',
  commaDangle: 'always-multiline',
  arrowParens: true,
  jsx: true,
});

const config: Linter.Config[] = [
  {
    name: '@openstuff-dev/ignores',
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/coverage',
      '**/test-output',
      '**/tmp',
      '**/.nx',
      '**/.angular',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  ...defineConfig(
    {
      name: '@openstuff-dev/typescript',
      files: [SCRIPTS],
      extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
      languageOptions: {
        globals: { ...globals.node, ...globals.browser },
        parserOptions: { projectService: true },
      },
      rules: {
        // Numbers and booleans in template strings read fine.
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          { allowNumber: true, allowBoolean: true },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
        '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      },
    },
    {
      // Plain JavaScript config files aren't part of a tsconfig.
      name: '@openstuff-dev/javascript',
      files: ['**/*.{js,jsx,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
    },
  ),
  {
    name: '@openstuff-dev/stylistic',
    ...formatting,
    files: [SCRIPTS],
    rules: {
      ...formatting.rules,
      // Close to Prettier's output, so moving a project over changes few lines.
      '@stylistic/max-len': [
        'error',
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/operator-linebreak': [
        'error',
        'after',
        { overrides: { '?': 'before', ':': 'before' } },
      ],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/quote-props': ['error', 'as-needed'],
    },
  },
  ...(nx.configs['flat/base'] as Linter.Config[]),
  {
    name: '@openstuff-dev/module-boundaries',
    files: [SCRIPTS],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Apps can use packages; packages never import apps.
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:package'] },
            { sourceTag: 'type:package', onlyDependOnLibsWithTags: ['type:package'] },
            { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] },
          ],
        },
      ],
    },
  },
];

export default config;
