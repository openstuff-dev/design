import angular from 'angular-eslint';
import type { Linter } from 'eslint';
import base from './index.js';
import openstuff from './plugin.js';

/**
 * The shared setup plus Angular: OnPush, signal inputs and outputs, standalone
 * components, built-in control flow and accessible templates. Inline templates are
 * linted like `.html` files and formatted with Prettier.
 *
 * ```js
 * // eslint.config.js
 * export { default } from '@openstuff-dev/lint/eslint/angular';
 * ```
 */
const config: Linter.Config[] = [
  ...base,
  {
    name: '@openstuff-dev/angular',
    files: ['**/*.ts'],
    processor: angular.processInlineTemplates,
    plugins: { '@angular-eslint': angular.tsPlugin, '@openstuff-dev': openstuff },
    rules: {
      ...(angular.configs.tsRecommended.at(-1)?.rules ?? {}),
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@openstuff-dev/format-inline-templates': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^bypassSecurityTrust/]',
          message:
            'This turns off Angular\'s sanitizer. Sanitize the value yourself first, then disable this line with a comment saying how.',
        },
        {
          selector: 'AssignmentExpression > MemberExpression[property.name=/^(inner|outer)HTML$/]',
          message:
            'Setting innerHTML skips Angular\'s sanitizer. Bind [innerHTML] in the template, or disable this line with a comment saying why the value is safe.',
        },
      ],
    },
  },
  {
    name: '@openstuff-dev/angular-template',
    files: ['**/*.html'],
    languageOptions: { parser: angular.templateParser },
    plugins: { '@angular-eslint/template': angular.templatePlugin },
    rules: {
      ...(angular.configs.templateRecommended.at(-1)?.rules ?? {}),
      ...(angular.configs.templateAccessibility.at(-1)?.rules ?? {}),
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-inline-styles': ['error', { allowNgStyle: false, allowBindToStyle: true }],
    },
  },
];

export default config;
